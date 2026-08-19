import { logoUrl, type Colour, type LogoOption, type Rule, type Section } from '../lib/content'
import { DownloadButton, EmptyState, Note, SectionHeader, Toggle } from './ui'
import WidgetRow from './WidgetRow'

type PrefProps = {
  logos: LogoOption[]
  logo: LogoOption
  setLogo: (slug: string) => void
}

export function PreferenceToggle({ logos, logo, setLogo }: PrefProps) {
  if (logos.length < 2) return null
  return (
    <Toggle
      options={logos.map((l) => ({ value: l.slug, label: shortLabel(l), dot: l.hex }))}
      value={logo.slug}
      onChange={setLogo}
    />
  )
}

/** "Snapmint Orange" reads as "Orange" inside a toggle that is already about Snapmint. */
const shortLabel = (l: LogoOption) => l.label.replace(/^Snapmint\s+/i, '')

/* ---------------- Logo ---------------- */

function LogoCard({ logo }: { logo: LogoOption }) {
  const svg = logoUrl(logo, 'svg')
  const png = logoUrl(logo, 'png')

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200">
      <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full ring-1 ring-black/10" style={{ background: logo.hex }} />
          <h3 className="text-[15px] font-semibold text-ink">{logo.label}</h3>
        </div>
        {logo.rank_label && <span className="text-[12px] text-neutral-400">{logo.rank_label}</span>}
      </div>

      <div className="flex items-center justify-center px-8 py-14">
        <img src={svg} alt={`Snapmint logo in ${logo.label}`} className="h-[42px] w-auto" />
      </div>

      <div className="border-t border-neutral-100 px-6 py-4">
        {logo.use_note && <p className="text-[13px] leading-relaxed text-neutral-500">{logo.use_note}</p>}
        <div className="mt-4 flex items-center gap-2">
          <DownloadButton url={svg} filename={`snapmint-logo-${logo.slug}.svg`} variant="solid">
            SVG
          </DownloadButton>
          <DownloadButton url={png} filename={`snapmint-logo-${logo.slug}.png`}>
            PNG
          </DownloadButton>
          <code className="ml-auto font-mono text-[12px] text-neutral-500">{logo.hex}</code>
        </div>
      </div>
    </div>
  )
}

function LogoSection({ section, logos, rules }: { section: Section; logos: LogoOption[]; rules: Rule[] }) {
  const logoRules = rules.filter((r) => r.kind === 'logo')
  return (
    <section>
      <SectionHeader eyebrow={section.eyebrow} title={section.title}>
        {section.description}
      </SectionHeader>

      <div className={`grid gap-5 ${logos.length > 1 ? 'lg:grid-cols-2' : 'max-w-xl'}`}>
        {logos.map((l) => (
          <LogoCard key={l.id} logo={l} />
        ))}
      </div>

      {logoRules.length > 0 && (
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {logoRules.map((r) => (
            <div key={r.id} className="border-t border-neutral-200 pt-4">
              <p className="text-[13px] font-semibold text-ink">{r.title}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-500">{r.body}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

/* ---------------- Colours ---------------- */

function ColoursSection({ section, colours }: { section: Section; colours: Colour[] }) {
  return (
    <section>
      <SectionHeader eyebrow={section.eyebrow} title={section.title}>
        {section.description}
      </SectionHeader>

      <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
        {colours.map((c) => (
          <div key={c.id} className="flex gap-4 border-t border-neutral-200 pt-4">
            <span
              className="mt-0.5 h-10 w-10 shrink-0 rounded-md ring-1 ring-inset ring-black/10"
              style={{ background: c.hex }}
            />
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-ink">{c.name}</p>
              <p className="mt-0.5 font-mono text-[12px] text-neutral-500">{c.hex}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-neutral-400">{c.usage}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ---------------- Do & Don't ---------------- */

function UsageSection({ section, rules }: { section: Section; rules: Rule[] }) {
  const cols = [
    { title: 'Do', items: rules.filter((r) => r.kind === 'do'), ok: true },
    { title: 'Don’t', items: rules.filter((r) => r.kind === 'dont'), ok: false },
  ].filter((c) => c.items.length > 0)

  return (
    <section>
      <SectionHeader eyebrow={section.eyebrow} title={section.title}>
        {section.description}
      </SectionHeader>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        {cols.map((col) => (
          <div key={col.title}>
            <h3
              className={`mb-4 border-b pb-3 text-[13px] font-semibold uppercase tracking-[0.08em] ${
                col.ok ? 'border-emerald-200 text-emerald-700' : 'border-red-200 text-red-700'
              }`}
            >
              {col.title}
            </h3>
            <ul className="space-y-3">
              {col.items.map((r) => (
                <li key={r.id} className="flex gap-3 text-[14px] leading-relaxed text-neutral-600">
                  <span
                    className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${col.ok ? 'bg-emerald-500' : 'bg-red-400'}`}
                  />
                  {r.body}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ---------------- shared download bar ---------------- */

function DownloadBar({ logos, logo, setLogo }: PrefProps) {
  return (
    <div className="sticky top-0 z-20 -mx-6 mb-10 border-b border-neutral-100 bg-white px-6 py-3 sm:-mx-10 sm:px-10">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex items-center gap-3">
          <img src={logoUrl(logo, 'svg')} alt={`Snapmint logo in ${logo.label}`} className="h-[17px] w-auto" />
          <span className="hidden text-[13px] text-neutral-500 sm:inline">{logo.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <PreferenceToggle logos={logos} logo={logo} setLogo={setLogo} />
          {logos.length > 1 && <span className="mx-1 h-5 w-px bg-neutral-200" aria-hidden="true" />}
          <DownloadButton url={logoUrl(logo, 'svg')} filename={`snapmint-logo-${logo.slug}.svg`} variant="solid">
            SVG
          </DownloadButton>
          <DownloadButton url={logoUrl(logo, 'png')} filename={`snapmint-logo-${logo.slug}.png`}>
            PNG
          </DownloadButton>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Placements (widget / popup / payment) ---------------- */

function PlacementSection({ section, logos, logo, setLogo }: PrefProps & { section: Section }) {
  const groups = section.groups.filter((g) => g.items.length > 0)
  const showEmpty = section.is_coming_soon || groups.length === 0

  // For popup section, only show the popup logo; for widget/payment, show orange & slate
  const sectionLogos = section.slug === 'popup'
    ? logos.filter((l) => l.slug === 'popup')
    : logos.filter((l) => l.slug === 'orange' || l.slug === 'slate')

  // If current logo not in sectionLogos, switch to first available
  const effectiveLogo = sectionLogos.find((l) => l.slug === logo.slug) ?? sectionLogos[0] ?? logo

  return (
    <section>
      <SectionHeader eyebrow={section.eyebrow} title={section.title}>
        {section.description}
      </SectionHeader>

      <DownloadBar logos={sectionLogos} logo={effectiveLogo} setLogo={setLogo} />

      {section.note_body && <Note>{section.note_body}</Note>}

      {showEmpty ? (
        <div className={section.note_body ? 'mt-6' : ''}>
          <EmptyState
            title={section.empty_title || 'Previews coming soon'}
            body={section.empty_body || 'These screens aren\'t published yet.'}
          />
        </div>
      ) : (
        <div className="mt-12 space-y-14">
          {groups.map((g) => (
            <div key={g.id}>
              <div className="mb-1.5 flex items-baseline gap-3">
                <h2 className="text-[19px] font-semibold tracking-[-0.015em] text-ink">{g.title}</h2>
                <span className="text-[12px] text-neutral-400">
                  {g.items.length} {g.items.length === 1 ? 'variant' : 'variants'}
                </span>
              </div>
              {g.blurb && <p className="mb-4 max-w-2xl text-[13px] leading-relaxed text-neutral-500">{g.blurb}</p>}
              <div className="border-b border-neutral-100">
                {g.items.map((item) => (
                  <WidgetRow key={item.id} item={item} logo={effectiveLogo} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

/* ---------------- router ---------------- */

export function SectionView({
  section,
  logos,
  logo,
  setLogo,
  colours,
  rules,
}: PrefProps & { section: Section; colours: Colour[]; rules: Rule[] }) {
  switch (section.kind) {
    case 'logo':
      return <LogoSection section={section} logos={logos} rules={rules} />
    case 'colours':
      return <ColoursSection section={section} colours={colours} />
    case 'usage':
      return <UsageSection section={section} rules={rules} />
    default:
      return <PlacementSection section={section} logos={logos} logo={logo} setLogo={setLogo} />
  }
}
