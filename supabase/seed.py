#!/usr/bin/env python3
"""Seed the Supabase content tables from the site's current bundled content.

Idempotent: re-running replaces content rows but never touches auth or storage.
Run with the direct Postgres connection (bypasses RLS as table owner).
"""
import json, os, sys, psycopg2

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.dirname(HERE)

POPUP_GROUPS = [
    ("Check Eligibility", "Eligibility check popup shown before EMI options.", "check-eligibility"),
    ("Merchant Popup", "Popup shown on merchant pages with EMI plan details.", "merchant"),
    ("Popup 1.0", "Version 1.0 of the standard popup with multiple variants.", "popup-1-0"),
    ("Popup 2.0", "Version 2.0 of the standard popup with updated layout.", "popup-2-0"),
    ("Popup 3", "Additional popup variants (1.0 and 2.0).", "popup-3"),
]

WIDGET_GROUPS = [
    ("1.0 – 3/1", "Version 1.0, 3/1 plans. Button reads View Plans.", "v1-3-1"),
    ("1.0 – 4/1", "Version 1.0, 4/1 plans. Button reads View Plans.", "v1-4-1"),
    ("2.0", "Version 2.0. Same layout as 1.0 — the button changes to Buy On EMI.", "v2"),
    ("With Cashback", "Cashback strip sits above the widget with a NEW tag. The strip never carries the logo.", "cashback"),
    ("With Cashback — Without New tag", "The same cashback strip, without the NEW tag.", "cashback-no-tag"),
    ("₹1 DP + EMIs", "₹1 down payment, then monthly EMIs.", "dp1-emi"),
    ("₹0 DP + EMIs", "No down payment, then monthly EMIs.", "dp0-emi"),
    ("₹0 DP pay later", "No down payment. The rest is paid later at no extra cost.", "dp0-paylater"),
    ("₹1 DP pay later", "₹1 down payment. The rest is paid later at no extra cost.", "dp1-paylater"),
    ("₹19 DP pay later", "Pay in 3 sale campaign. The logo appears twice — recolour both.", "dp19-paylater"),
    ("₹19 DP + EMIs", "Pay in 3 sale campaign with No Cost EMIs.", "dp19-emi"),
]

LOGOS = [
    dict(slug="orange", label="Snapmint Orange", rank_label="1st preference", hex="#FF6F00",
         use_note="Use this everywhere by default — on white, light grey and other light backgrounds.",
         svg_path="/assets/logo/snapmint-orange.svg", png_path="/assets/logo/snapmint-orange.png",
         sort_order=0, visible=True),
    dict(slug="slate", label="Snapmint Slate Blue", rank_label="2nd preference", hex="#151E29",
         use_note="Use only when your page is already orange-heavy, or orange clashes with your palette.",
         svg_path="/assets/logo/snapmint-slate.svg", png_path="/assets/logo/snapmint-slate.png",
         sort_order=1, visible=True),
    dict(slug="popup", label="Snapmint Popup Logo", rank_label="Popup only", hex="#FF6F00",
         use_note="Use only in the popup header. This logo is optically adjusted for small sizes — do not use it anywhere else.",
         svg_path="/assets/logo/snapmint-popup.svg", png_path="/assets/logo/snapmint-popup.png",
         sort_order=2, visible=True),
]

SECTIONS = [
    dict(slug="logo", nav_label="Logo", kind="logo", eyebrow="Foundations", title="Logo",
         description="The Snapmint logo comes in two colours. Use orange by default. Use slate blue only when "
                     "orange doesn’t work on your background. No other colour or effect is approved.",
         sort_order=0),
    dict(slug="colours", nav_label="Colours", kind="colours", eyebrow="Foundations", title="Colours",
         description="The exact colours used inside Snapmint widgets. Match these values if you rebuild a "
                     "widget in your own code.",
         sort_order=1),
    dict(slug="usage", nav_label="Do & Don’t", kind="usage", eyebrow="Foundations", title="Do & Don’t",
         description="A quick checklist before you go live. Anything outside this list needs sign-off from the "
                     "Snapmint brand team.",
         sort_order=2),
    dict(slug="widget", nav_label="Widget", kind="widget", eyebrow="Placements", title="Logo on Widget",
         description="Where the Snapmint logo sits in every approved widget. Names and order match the Gold "
                     "Standard PDP board. These are previews only — download the logo and place it exactly as shown.",
         note_body="Switching to slate blue changes the logo only. Buttons, offer tags and price colours stay "
                   "exactly as designed.",
         sort_order=3),
dict(slug="popup", nav_label="Popup", kind="widget", eyebrow="Placements", title="Logo on Popup",
         description="The popup opens when a shopper taps the widget. The logo in its header uses a dedicated popup logo that is optically adjusted for small sizes.",
         note_body="The popup logo (orange) is specifically designed for the popup header at small sizes. Do not use the standard orange or slate blue logos in the popup — they will not render correctly at the required size. The popup logo is available as SVG and PNG below. Button and accent colours inside the popup remain unchanged regardless of logo selection.",
         is_coming_soon=False, empty_title="", empty_body="",
         sort_order=4),
    dict(slug="payment", nav_label="Payment page", kind="widget", eyebrow="Placements",
         title="Logo on Payment Page",
         description="Snapmint at checkout — the payment method row, the payment page header and the "
                     "confirmation screen.",
         is_coming_soon=True, empty_title="Previews coming soon",
         empty_body="Payment page screens aren’t published yet. Until then, follow the same rule: orange first, "
                    "slate blue only when orange doesn’t work.",
         sort_order=5),
]

PALETTE = [
    ("Snapmint Orange", "#FF6F00", "Primary brand colour / wordmark"),
    ("Slate Blue", "#151E29", "Alternate wordmark colour"),
    ("Ink", "#1B1B1B", "Widget headline text"),
    ("Muted", "#787878", "Widget secondary text"),
    ("Success Green", "#2DA257", "Price / NEW tag"),
    ("Surface", "#F0F0F0", "Widget background"),
]

RULES = [
    ("logo", "Clear space", "Leave a gap around the logo equal to the height of the “s”."),
    ("logo", "Minimum size", "Never below 72 px wide on desktop, or 24 px on mobile."),
    ("logo", "File format", "Use the SVG wherever your platform supports it. PNG is the fallback."),
    ("logo", "Popup logo", "Use the dedicated popup logo (optically adjusted) only in the popup header. Do not use standard orange or slate logos in popups."),
    ("do", "", "Use the SVG — it stays sharp at any size."),
    ("do", "", "Keep the logo horizontal and on one line."),
    ("do", "", "Place it on white or a light neutral background."),
    ("do", "", "Keep “snap” and “mint” exactly as supplied."),
    ("dont", "", "Don’t change the colour, or add shadows, strokes or gradients."),
    ("dont", "", "Don’t stretch, squash, rotate or crop it."),
    ("dont", "", "Don’t put the orange logo on a dark or bright background — use slate blue."),
    ("dont", "", "Don’t retype the logo in another font."),
]

CONFIG = dict(
    brand_name="Snapmint",
    site_title="Logo Guidelines",
    site_tagline="How to use the Snapmint logo on your widget, popup and payment page.",
    footer_note="Snapmint brand assets. Need a placement that isn’t covered here? Check with the Snapmint "
                "brand team before you go live.",
    sidebar_note="Everything here is the current approved version.",
)


def main():
    creds = json.load(open(os.path.join(os.path.dirname(APP), "secrets", "db.json")))
    conn = psycopg2.connect(host="aws-0-ap-south-1.pooler.supabase.com", port=5432,
                            user=f"postgres.{creds['ref']}", password=creds["password"],
                            dbname="postgres", sslmode="require")
    conn.autocommit = False
    cur = conn.cursor()

    # wipe content only (cascade clears groups + items)
    cur.execute("delete from public.sections")
    cur.execute("delete from public.logo_options")
    cur.execute("delete from public.colours")
    cur.execute("delete from public.rules")

    cur.execute("""insert into public.site_config (id, brand_name, site_title, site_tagline,
                   footer_note, sidebar_note) values (true,%(brand_name)s,%(site_title)s,
                   %(site_tagline)s,%(footer_note)s,%(sidebar_note)s)
                   on conflict (id) do update set brand_name=excluded.brand_name,
                     site_title=excluded.site_title, site_tagline=excluded.site_tagline,
                     footer_note=excluded.footer_note, sidebar_note=excluded.sidebar_note""", CONFIG)

    for l in LOGOS:
        cur.execute("""insert into public.logo_options
            (slug,label,rank_label,hex,use_note,svg_path,png_path,sort_order,visible)
            values (%(slug)s,%(label)s,%(rank_label)s,%(hex)s,%(use_note)s,%(svg_path)s,
                    %(png_path)s,%(sort_order)s,%(visible)s)""", l)

    section_ids = {}
    for s in SECTIONS:
        row = dict(note_body="", is_coming_soon=False, empty_title="", empty_body="", visible=True)
        row.update(s)
        cur.execute("""insert into public.sections
            (slug,nav_label,kind,eyebrow,title,description,note_body,is_coming_soon,
             empty_title,empty_body,sort_order,visible)
            values (%(slug)s,%(nav_label)s,%(kind)s,%(eyebrow)s,%(title)s,%(description)s,
                    %(note_body)s,%(is_coming_soon)s,%(empty_title)s,%(empty_body)s,
                    %(sort_order)s,%(visible)s) returning id""", row)
        section_ids[s["slug"]] = cur.fetchone()[0]

    widgets = json.load(open(os.path.join(APP, "src", "widgets.json")))
    group_ids = {}
    for i, (title, blurb, gid) in enumerate(WIDGET_GROUPS):
        cur.execute("""insert into public.widget_groups (section_id,title,blurb,sort_order,visible)
                       values (%s,%s,%s,%s,true) returning id""",
                    (section_ids["widget"], title, blurb, i))
        group_ids[gid] = cur.fetchone()[0]

    per_group = {}
    for w in widgets:
        n = per_group.get(w["group"], 0)
        per_group[w["group"]] = n + 1
        cur.execute("""insert into public.widget_items
            (group_id,name,spec,cta,asset_key,width,height,sort_order,visible)
            values (%s,%s,%s,%s,%s,%s,%s,%s,true)""",
            (group_ids[w["group"]], w["variant"], w["spec"], w["cta"], w["id"],
             round(w["pw"]), round(w["ph"]), n))

    # Seed popup widgets
    popup_widgets = json.load(open(os.path.join(APP, "src", "popup-widgets.json")))
    popup_group_ids = {}
    for i, (title, blurb, gid) in enumerate(POPUP_GROUPS):
        cur.execute("""insert into public.widget_groups (section_id,title,blurb,sort_order,visible)
                       values (%s,%s,%s,%s,true) returning id""",
                    (section_ids["popup"], title, blurb, i))
        popup_group_ids[gid] = cur.fetchone()[0]

    popup_per_group = {}
    for w in popup_widgets:
        n = popup_per_group.get(w["group"], 0)
        popup_per_group[w["group"]] = n + 1
        cur.execute("""insert into public.widget_items
            (group_id,name,spec,cta,asset_key,width,height,sort_order,visible)
            values (%s,%s,%s,%s,%s,%s,%s,%s,true)""",
            (popup_group_ids[w["group"]], w["variant"], w["spec"], w["cta"], w["id"],
             round(w["pw"]), round(w["ph"]), n))

    for i, (name, hexv, usage) in enumerate(PALETTE):
        cur.execute("""insert into public.colours (name,hex,usage,sort_order,visible)
                       values (%s,%s,%s,%s,true)""", (name, hexv, usage, i))

    counters = {}
    for kind, title, body in RULES:
        n = counters.get(kind, 0); counters[kind] = n + 1
        cur.execute("""insert into public.rules (kind,title,body,sort_order,visible)
                       values (%s,%s,%s,%s,true)""", (kind, title, body, n))

    conn.commit()

    for t in ["site_config", "logo_options", "sections", "widget_groups", "widget_items", "colours", "rules"]:
        cur.execute(f"select count(*) from public.{t}")
        print(f"  {t:15} {cur.fetchone()[0]}")
    conn.close()


if __name__ == "__main__":
    main()
