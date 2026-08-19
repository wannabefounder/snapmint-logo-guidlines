import widgetsJson from '../widgets.json'
import popupWidgetsJson from '../popup-widgets.json'
import { SUPABASE_ANON_KEY, SUPABASE_URL, hasBackend } from './config'

/* ------------------------------------------------------------------ types */

export type LogoOption = {
  id: string
  slug: string
  label: string
  rank_label: string
  hex: string
  use_note: string
  svg_path: string
  png_path: string
  sort_order: number
  visible: boolean
}

export type WidgetItem = {
  id: string
  group_id: string
  name: string
  spec: string
  cta: string
  asset_key: string
  preview_overrides: Record<string, string>
  width: number
  height: number
  sort_order: number
  visible: boolean
}

export type WidgetGroup = {
  id: string
  section_id: string
  title: string
  blurb: string
  sort_order: number
  visible: boolean
  items: WidgetItem[]
}

export type SectionKind = 'logo' | 'colours' | 'usage' | 'widget'

export type Section = {
  id: string
  slug: string
  nav_label: string
  eyebrow: string
  title: string
  description: string
  kind: SectionKind
  note_body: string
  is_coming_soon: boolean
  empty_title: string
  empty_body: string
  sort_order: number
  visible: boolean
  groups: WidgetGroup[]
}

export type Colour = {
  id: string
  name: string
  hex: string
  usage: string
  sort_order: number
  visible: boolean
}

export type Rule = {
  id: string
  kind: 'do' | 'dont' | 'logo'
  title: string
  body: string
  sort_order: number
  visible: boolean
}

export type SiteConfig = {
  brand_name: string
  site_title: string
  site_tagline: string
  footer_note: string
  sidebar_note: string
}

export type SiteContent = {
  config: SiteConfig
  logos: LogoOption[]
  sections: Section[]
  colours: Colour[]
  rules: Rule[]
  /** true when served from the database rather than the bundled fallback */
  live: boolean
}

/* ------------------------------------------------- bundled fallback content */

const base = import.meta.env.BASE_URL

const FALLBACK_GROUPS: [string, string, string][] = [
  ['v1-3-1', '1.0 – 3/1', 'Version 1.0, 3/1 plans. Button reads View Plans.'],
  ['v1-4-1', '1.0 – 4/1', 'Version 1.0, 4/1 plans. Button reads View Plans.'],
  ['v2', '2.0', 'Version 2.0. Same layout as 1.0 — the button changes to Buy On EMI.'],
  ['cashback', 'With Cashback', 'Cashback strip sits above the widget with a NEW tag. The strip never carries the logo.'],
  ['cashback-no-tag', 'With Cashback — Without New tag', 'The same cashback strip, without the NEW tag.'],
  ['dp1-emi', '₹1 DP + EMIs', '₹1 down payment, then monthly EMIs.'],
  ['dp0-emi', '₹0 DP + EMIs', 'No down payment, then monthly EMIs.'],
  ['dp0-paylater', '₹0 DP pay later', 'No down payment. The rest is paid later at no extra cost.'],
  ['dp1-paylater', '₹1 DP pay later', '₹1 down payment. The rest is paid later at no extra cost.'],
  ['dp19-paylater', '₹19 DP pay later', 'Pay in 3 sale campaign. The logo appears twice — recolour both.'],
  ['dp19-emi', '₹19 DP + EMIs', 'Pay in 3 sale campaign with No Cost EMIs.'],
]

type RawWidget = { id: string; group: string; variant: string; spec: string; cta: string; pw: number; ph: number }

function fallbackWidgetGroups(): WidgetGroup[] {
  const raw = widgetsJson as RawWidget[]
  return FALLBACK_GROUPS.map(([gid, title, blurb], gi) => ({
    id: gid,
    section_id: 'widget',
    title,
    blurb,
    sort_order: gi,
    visible: true,
    items: raw
      .filter((w) => w.group === gid)
      .map((w, i) => ({
        id: w.id,
        group_id: gid,
        name: w.variant,
        spec: w.spec,
        cta: w.cta,
        asset_key: w.id,
        preview_overrides: {},
        width: Math.round(w.pw),
        height: Math.round(w.ph),
        sort_order: i,
        visible: true,
      })),
  })).filter((g) => g.items.length > 0)
}

const POPUP_FALLBACK_GROUPS: [string, string, string][] = [
  ['check-eligibility', 'Check Eligibility', 'Eligibility check popup shown before EMI options.'],
  ['merchant', 'Merchant Popup', 'Popup shown on merchant pages with EMI plan details.'],
  ['popup-1-0', 'Popup 1.0', 'Version 1.0 of the standard popup with multiple variants.'],
  ['popup-2-0', 'Popup 2.0', 'Version 2.0 of the standard popup with updated layout.'],
  ['popup-3', 'Popup 3', 'Additional popup variants (1.0 and 2.0).'],
]

type RawPopupWidget = { id: string; group: string; variant: string; spec: string; cta: string; pw: number; ph: number }

function fallbackPopupGroups(): WidgetGroup[] {
  const raw = popupWidgetsJson as RawPopupWidget[]
  return POPUP_FALLBACK_GROUPS.map(([gid, title, blurb], gi) => ({
    id: gid,
    section_id: 'popup',
    title,
    blurb,
    sort_order: gi,
    visible: true,
    items: raw
      .filter((w) => w.group === gid)
      .map((w, i) => ({
        id: w.id,
        group_id: gid,
        name: w.variant,
        spec: w.spec,
        cta: w.cta,
        asset_key: w.id,
        preview_overrides: {},
        width: Math.round(w.pw),
        height: Math.round(w.ph),
        sort_order: i,
        visible: true,
      })),
  })).filter((g) => g.items.length > 0)
}

export const FALLBACK: SiteContent = {
  live: false,
  config: {
    brand_name: 'Snapmint',
    site_title: 'Logo Guidelines',
    site_tagline: 'How to use the Snapmint logo on your widget, popup and payment page.',
    footer_note:
      'Snapmint brand assets. Need a placement that isn’t covered here? Check with the Snapmint brand team before you go live.',
    sidebar_note: 'Everything here is the current approved version.',
  },
  logos: [
    {
      id: 'orange', slug: 'orange', label: 'Snapmint Orange', rank_label: '1st preference', hex: '#FF6F00',
      use_note: 'Use this everywhere by default — on white, light grey and other light backgrounds.',
      svg_path: '/assets/logo/snapmint-orange.svg', png_path: '/assets/logo/snapmint-orange.png',
      sort_order: 0, visible: true,
    },
    {
      id: 'slate', slug: 'slate', label: 'Snapmint Slate Blue', rank_label: '2nd preference', hex: '#151E29',
      use_note: 'Use only when your page is already orange-heavy, or orange clashes with your palette.',
      svg_path: '/assets/logo/snapmint-slate.svg', png_path: '/assets/logo/snapmint-slate.png',
      sort_order: 1, visible: true,
    },
    {
      id: 'popup', slug: 'popup', label: 'Snapmint Popup Logo', rank_label: 'Popup only', hex: '#FF6F00',
      use_note: 'Use only in the popup header. This logo is optically adjusted for small sizes — do not use it anywhere else.',
      svg_path: '/assets/logo/snapmint-popup.svg', png_path: '/assets/logo/snapmint-popup.png',
      sort_order: 2, visible: true,
    },
  ],
  sections: [
    { id: 'logo', slug: 'logo', nav_label: 'Logo', eyebrow: 'Foundations', title: 'Logo', kind: 'logo',
      description:
        'The Snapmint logo comes in two colours. Use orange by default. Use slate blue only when orange doesn’t work on your background. No other colour or effect is approved.',
      note_body: '', is_coming_soon: false, empty_title: '', empty_body: '', sort_order: 0, visible: true, groups: [] },
    { id: 'colours', slug: 'colours', nav_label: 'Colours', eyebrow: 'Foundations', title: 'Colours', kind: 'colours',
      description: 'The exact colours used inside Snapmint widgets. Match these values if you rebuild a widget in your own code.',
      note_body: '', is_coming_soon: false, empty_title: '', empty_body: '', sort_order: 1, visible: true, groups: [] },
    { id: 'usage', slug: 'usage', nav_label: 'Do & Don’t', eyebrow: 'Foundations', title: 'Do & Don’t', kind: 'usage',
      description: 'A quick checklist before you go live. Anything outside this list needs sign-off from the Snapmint brand team.',
      note_body: '', is_coming_soon: false, empty_title: '', empty_body: '', sort_order: 2, visible: true, groups: [] },
    { id: 'widget', slug: 'widget', nav_label: 'Widget', eyebrow: 'Placements', title: 'Logo on Widget', kind: 'widget',
      description:
        'Where the Snapmint logo sits in every approved widget. Names and order match the Gold Standard PDP board. These are previews only — download the logo and place it exactly as shown.',
      note_body: 'Switching to slate blue changes the logo only. Buttons, offer tags and price colours stay exactly as designed.',
      is_coming_soon: false, empty_title: '', empty_body: '', sort_order: 3, visible: true, groups: fallbackWidgetGroups() },
{ id: 'popup', slug: 'popup', nav_label: 'Popup', eyebrow: 'Placements', title: 'Logo on Popup', kind: 'widget',
      description:
        'The popup opens when a shopper taps the widget. The logo in its header uses a dedicated popup logo that is optically adjusted for small sizes.',
      note_body:
        'The popup logo (orange) is specifically designed for the popup header at small sizes. Do not use the standard orange or slate blue logos in the popup — they will not render correctly at the required size. The popup logo is available as SVG and PNG below. Button and accent colours inside the popup remain unchanged regardless of logo selection.',
      is_coming_soon: false, empty_title: '', empty_body: '', sort_order: 4, visible: true, groups: fallbackPopupGroups() },
    { id: 'payment', slug: 'payment', nav_label: 'Payment page', eyebrow: 'Placements', title: 'Logo on Payment Page', kind: 'widget',
      description: 'Snapmint at checkout — the payment method row, the payment page header and the confirmation screen.',
      note_body: '', is_coming_soon: true, empty_title: 'Previews coming soon',
      empty_body: 'Payment page screens aren’t published yet. Until then, follow the same rule: orange first, slate blue only when orange doesn’t work.',
      sort_order: 5, visible: true, groups: [] },
  ],
  colours: [
    { id: 'c1', name: 'Snapmint Orange', hex: '#FF6F00', usage: 'Primary brand colour / wordmark', sort_order: 0, visible: true },
    { id: 'c2', name: 'Slate Blue', hex: '#151E29', usage: 'Alternate wordmark colour', sort_order: 1, visible: true },
    { id: 'c3', name: 'Ink', hex: '#1B1B1B', usage: 'Widget headline text', sort_order: 2, visible: true },
    { id: 'c4', name: 'Muted', hex: '#787878', usage: 'Widget secondary text', sort_order: 3, visible: true },
    { id: 'c5', name: 'Success Green', hex: '#2DA257', usage: 'Price / NEW tag', sort_order: 4, visible: true },
    { id: 'c6', name: 'Surface', hex: '#F0F0F0', usage: 'Widget background', sort_order: 5, visible: true },
  ],
  rules: [
    { id: 'r1', kind: 'logo', title: 'Clear space', body: 'Leave a gap around the logo equal to the height of the “s”.', sort_order: 0, visible: true },
    { id: 'r2', kind: 'logo', title: 'Minimum size', body: 'Never below 72 px wide on desktop, or 24 px on mobile.', sort_order: 1, visible: true },
    { id: 'r3', kind: 'logo', title: 'File format', body: 'Use the SVG wherever your platform supports it. PNG is the fallback.', sort_order: 2, visible: true },
    { id: 'r12', kind: 'logo', title: 'Popup logo', body: 'Use the dedicated popup logo (optically adjusted) only in the popup header. Do not use standard orange or slate logos in popups.', sort_order: 3, visible: true },
    { id: 'r4', kind: 'do', title: '', body: 'Use the SVG — it stays sharp at any size.', sort_order: 0, visible: true },
    { id: 'r5', kind: 'do', title: '', body: 'Keep the logo horizontal and on one line.', sort_order: 1, visible: true },
    { id: 'r6', kind: 'do', title: '', body: 'Place it on white or a light neutral background.', sort_order: 2, visible: true },
    { id: 'r7', kind: 'do', title: '', body: 'Keep “snap” and “mint” exactly as supplied.', sort_order: 3, visible: true },
    { id: 'r8', kind: 'dont', title: '', body: 'Don’t change the colour, or add shadows, strokes or gradients.', sort_order: 0, visible: true },
    { id: 'r9', kind: 'dont', title: '', body: 'Don’t stretch, squash, rotate or crop it.', sort_order: 1, visible: true },
    { id: 'r10', kind: 'dont', title: '', body: 'Don’t put the orange logo on a dark or bright background — use slate blue.', sort_order: 2, visible: true },
    { id: 'r11', kind: 'dont', title: '', body: 'Don’t retype the logo in another font.', sort_order: 3, visible: true },
  ],
}

/* ---------------------------------------------------------------- fetching */

/** Resolve an asset reference: absolute URLs pass through, site paths get the base prefix. */
export const assetUrl = (p: string) =>
  !p ? '' : /^https?:\/\//.test(p) ? p : `${base}${p.replace(/^\//, '')}`

export const logoUrl = (logo: LogoOption, ext: 'svg' | 'png') =>
  assetUrl(ext === 'svg' ? logo.svg_path : logo.png_path)

/** Preview art for a widget in a given colourway — an uploaded override wins. */
export const previewUrl = (item: WidgetItem, logoSlug: string) => {
  const override = item.preview_overrides?.[logoSlug]
  if (override) return assetUrl(override)
  // Popup assets only exist in the 'popup' colourway
  const colourway = logoSlug === 'popup' ? 'popup' : logoSlug
  return `${base}assets/widgets/preview/${colourway}/${item.asset_key}.svg`
}

/**
 * Read a table through PostgREST. RLS already hides unpublished rows from anon.
 * `site_config` is a singleton and has no sort_order column, so ordering is opt-in.
 */
async function readTable<T>(table: string, signal?: AbortSignal, ordered = true): Promise<T[]> {
  const query = ordered ? 'select=*&order=sort_order.asc' : 'select=*'
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    signal,
  })
  if (!res.ok) throw new Error(`${table}: ${res.status} ${await res.text()}`)
  return (await res.json()) as T[]
}

export async function fetchContent(signal?: AbortSignal): Promise<SiteContent> {
  if (!hasBackend) return FALLBACK

  const [cfgRows, logoRows, sectionRows, groupRows, itemRows, colourRows, ruleRows] = await Promise.all([
    readTable<SiteConfig>('site_config', signal, false),
    readTable<LogoOption>('logo_options', signal),
    readTable<Section>('sections', signal),
    readTable<WidgetGroup>('widget_groups', signal),
    readTable<WidgetItem>('widget_items', signal),
    readTable<Colour>('colours', signal),
    readTable<Rule>('rules', signal),
  ])

  if (!sectionRows.length) return FALLBACK

  const keep = <T extends { visible: boolean }>(rows: T[]) => rows.filter((r) => r.visible)

  const itemsByGroup = new Map<string, WidgetItem[]>()
  for (const it of keep(itemRows)) {
    const list = itemsByGroup.get(it.group_id) ?? []
    list.push(it)
    itemsByGroup.set(it.group_id, list)
  }

  const groupsBySection = new Map<string, WidgetGroup[]>()
  for (const g of keep(groupRows)) {
    const list = groupsBySection.get(g.section_id) ?? []
    list.push({ ...g, items: itemsByGroup.get(g.id) ?? [] })
    groupsBySection.set(g.section_id, list)
  }

  return {
    live: true,
    config: cfgRows[0] ?? FALLBACK.config,
    logos: keep(logoRows),
    colours: keep(colourRows),
    rules: keep(ruleRows),
    sections: keep(sectionRows).map((s) => ({
      ...s,
      groups: groupsBySection.get(s.id) ?? [],
    })),
  }
}
