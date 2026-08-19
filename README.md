# Snapmint — Logo Guidelines

A static single-page site that CSMs share with merchants so their tech teams
apply the correct Snapmint wordmark on the widget, the widget popup and the
payment page.

Vite 5 · React 18 · TypeScript 5 · Tailwind CSS 3.4, with Supabase (Postgres,
Auth, Storage) behind an admin panel. No analytics, no third-party runtime
scripts. Node 18+ required.

## Admin panel

Everything on the public site — section text, which logo options exist, which
widgets show, the palette, the do/don't rules — is stored in Supabase and edited
at `#/admin`. Saving is immediate; merchants pick it up on their next page load.

Access is deliberately narrow:

- One address (`public.admin_email()` in `supabase/schema.sql`) may write.
- Every write also requires a TOTP-verified session. `public.is_admin()` checks
  both the email *and* `aal = 'aal2'`, so a stolen password alone is rejected by
  the database, not just the UI. RLS is `force`-enabled on every content table.
- The public site reads with the anon key, which can only ever see rows where
  `visible = true`. Hidden content is never sent to the browser.
- The auth library is confined to the lazy-loaded admin chunk, so visitors
  download the public bundle only.

If Supabase is unreachable the site silently falls back to the content bundled
in `src/lib/content.ts` and shows a small notice, so it can never go blank.

### First sign-in

Open `#/admin` and enter the admin email and password. Because no authenticator
is registered yet, the panel shows a QR code: scan it with Microsoft
Authenticator (or Google Authenticator, 1Password — any TOTP app), then type the
six-digit code to finish. That one-time step binds the account to the phone.
Every later sign-in is password plus a fresh code.

If the phone is ever lost, delete the row in Supabase → Authentication → the
user's MFA factors; the next sign-in will offer the QR code again.

The codes are time-based, so a phone whose clock has drifted will be rejected —
enable automatic date and time on the device if a correct-looking code fails.

### Configuration

Copy `.env.example` to `.env` and fill in the anon key from the Supabase
dashboard (Project Settings → API). The same two values must exist as
environment variables on Vercel. Both are safe to expose publicly — RLS, not
secrecy, is what protects the data.

`supabase/schema.sql` is the source of truth for tables and policies;
`supabase/seed.py` loads the starting content.

## Design stance

Archivo for headings (`font-display`), Inter for body text — both loaded from
Google Fonts, which the CSP in `vercel.json` already allows. The layout is
deliberately quiet: hairline rules instead of cards, no entrance animations, and
motion limited to short colour transitions on interactive elements (the `.tap`
class in `src/index.css`). `prefers-reduced-motion` is respected globally.

## What the site covers

- **Logo** — Snapmint Orange (1st preference) and Slate Blue (2nd), each with
  SVG and PNG download, plus clear-space and minimum-size rules.
- **Colours** — the six approved brand values used across widget surfaces.
- **Do & Don't** — the rules that keep the wordmark legible on merchant pages.
- **Logo on Widget** — all 19 approved widget lockups, grouped and ordered
  exactly as on the Gold Standard PDP board (1.0 – 3/1, 1.0 – 4/1, 2.0,
  With Cashback, ₹1/₹0 DP + EMIs, the pay-later set and the ₹19 Pay in 3 sale
  campaign).
- **Logo on Popup** / **Logo on Payment Page** — built and navigable, showing a
  "coming soon" state until those assets are approved.

## How widgets work here

Widget renders are **previews only**. They exist to show a merchant's tech team
where the wordmark sits, at what size and in which colourway — they are not
downloadable assets. Every download button on the site delivers the *logo*
(SVG or PNG) in the currently selected preference, which is what a merchant
actually needs in order to implement a placement.

The orange/slate toggle in the sticky download bar swaps every preview on the
page and the file the download buttons hand over.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build into dist/
npm run preview  # serve the built output
```

## Deploy

The build output is fully static. On Vercel, import the repo and accept the
detected Vite preset — `vercel.json` already sets the security headers (CSP,
X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
and immutable caching for hashed assets. Any static host works: serve `dist/`
and rewrite unknown paths to `index.html`.

## Regenerating assets

`scripts/build-assets.py` rebuilds everything the app serves from the raw brand
exports in the `logo guidlines` folder:

- copies both logo colourways into `public/assets/logo/`
- derives each slate widget by recolouring only `<path fill="#FF6F00">`, so CTA
  buttons, price colours and offer tags (which are `<rect>`s) stay untouched
- tight-crops every preview SVG to its visible content, removing the exporter's
  whitespace, and records the cropped dimensions in `src/widgets.json`

```bash
pip install resvg-py pillow --break-system-packages
python3 scripts/build-assets.py
```

The `CATALOG` list in that script is the single source of truth for widget
naming and ordering — edit it there, never hand-edit `src/widgets.json`.
Group titles and copy live in `WIDGET_GROUPS` in `src/data.ts`.

## Structure

```
src/
  App.tsx                  hash routing + shared preference state
  data.ts                  widget groups, palette, asset path helpers
  widgets.json             generated widget catalogue
  components/
    Sidebar.tsx            navigation
    Sections.tsx           page sections + sticky logo download bar
    WidgetRow.tsx          single widget preview
    ui.tsx                 buttons, toggle, section header, icons
scripts/build-assets.py    asset pipeline
public/assets/
  logo/                    snapmint-{orange,slate}.{svg,png}
  widgets/preview/         tight-cropped preview SVGs, per preference
```

## Popup & payment page

Both sections are live in the navigation with an empty state. Once approved
screens exist, export them, add them to the catalogue, and swap the
`EmptyState` in `src/components/Sections.tsx` for the same `WidgetRow` grid the
widget section uses.
