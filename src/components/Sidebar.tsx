import { logoUrl, type LogoOption, type Section, type SiteConfig } from '../lib/content'

export default function Sidebar({
  sections,
  config,
  markLogo,
  active,
  onNavigate,
  open,
  onClose,
}: {
  sections: Section[]
  config: SiteConfig
  markLogo: LogoOption | null
  active: string
  onNavigate: (slug: string) => void
  open: boolean
  onClose: () => void
}) {
  // Group nav items by their eyebrow, preserving section order.
  const groups: { title: string; items: Section[] }[] = []
  for (const s of sections) {
    const title = s.eyebrow || 'Sections'
    const last = groups[groups.length - 1]
    if (last && last.title === title) last.items.push(s)
    else groups.push({ title, items: [s] })
  }

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-ink/20 lg:hidden" onClick={onClose} aria-hidden="true" />}
      <aside
        className={`thin-scroll fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col overflow-y-auto border-r border-neutral-100 bg-white lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-6 pb-7 pt-7">
          {markLogo ? (
            <img src={logoUrl(markLogo, 'svg')} alt={config.brand_name} className="h-[20px] w-auto" />
          ) : (
            <p className="font-display text-[17px] font-semibold text-ink">{config.brand_name}</p>
          )}
          <p className="mt-2.5 text-[12px] leading-snug text-neutral-500">{config.site_title}</p>
        </div>

        <nav className="flex-1 px-3 pb-8">
          {groups.map((group) => (
            <div key={group.title} className="mb-7">
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-400">
                {group.title}
              </p>
              <ul>
                {group.items.map((item) => {
                  const isActive = item.slug === active
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => onNavigate(item.slug)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`tap flex w-full items-center justify-between rounded-md px-3 py-[7px] text-left text-[14px] ${
                          isActive
                            ? 'bg-neutral-100 font-semibold text-ink'
                            : 'font-medium text-neutral-600 hover:bg-neutral-50 hover:text-ink'
                        }`}
                      >
                        <span>{item.nav_label}</span>
                        {item.is_coming_soon && (
                          <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                            Soon
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-neutral-100 px-6 py-5">
          <p className="text-[12px] leading-relaxed text-neutral-400">{config.sidebar_note}</p>
        </div>
      </aside>
    </>
  )
}
