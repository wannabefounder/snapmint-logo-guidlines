import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import Sidebar from './components/Sidebar'
import { SectionView } from './components/Sections'
import { useSiteContent } from './lib/useContent'

const AdminApp = lazy(() => import('./admin/AdminApp'))

const routeFromHash = () => window.location.hash.replace(/^#\/?/, '').split('?')[0]

export default function App() {
  const [route, setRoute] = useState<string>(routeFromHash)

  useEffect(() => {
    const onHash = () => setRoute(routeFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (route === 'admin' || route.startsWith('admin/')) {
    return (
      <Suspense fallback={<Splash label="Loading admin…" />}>
        <AdminApp />
      </Suspense>
    )
  }
  return <PublicSite route={route} setRoute={setRoute} />
}

function Splash({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-[13px] text-neutral-400">{label}</p>
    </div>
  )
}

function PublicSite({ route, setRoute }: { route: string; setRoute: (r: string) => void }) {
  const { content, loading, degraded } = useSiteContent()
  const [logoSlug, setLogoSlug] = useState<string | null>(null)
  const [navOpen, setNavOpen] = useState(false)

  const sections = content.sections
  const active = useMemo(
    () => sections.find((s) => s.slug === route) ?? sections[0] ?? null,
    [sections, route],
  )

  const logo = useMemo(
    () => content.logos.find((l) => l.slug === logoSlug) ?? content.logos[0] ?? null,
    [content.logos, logoSlug],
  )

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [route])

  const go = (slug: string) => {
    window.location.hash = `/${slug}`
    setRoute(slug)
    setNavOpen(false)
  }

  if (loading) return <Splash label="Loading…" />

  return (
    <div className="min-h-screen bg-white">
      <Sidebar
        sections={sections}
        config={content.config}
        markLogo={logo}
        active={active?.slug ?? ''}
        onNavigate={go}
        open={navOpen}
        onClose={() => setNavOpen(false)}
      />

      <div className="lg:pl-[252px]">
        <div className="flex items-center gap-3 border-b border-neutral-100 px-5 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="Open navigation"
            className="rounded-md border border-neutral-200 p-2 text-neutral-600"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
          <span className="font-display text-[14px] font-semibold text-ink">
            {content.config.brand_name} · {content.config.site_title}
          </span>
        </div>

        <main className="mx-auto max-w-[1040px] px-6 py-10 sm:px-10 lg:py-14">
          {degraded && (
            <p className="mb-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
              Showing the last published version — live settings couldn’t be loaded.
            </p>
          )}

          {active && logo ? (
            <SectionView
              section={active}
              logos={content.logos}
              logo={logo}
              setLogo={setLogoSlug}
              colours={content.colours}
              rules={content.rules}
            />
          ) : (
            <p className="text-[14px] text-neutral-500">No sections are published yet.</p>
          )}

          <footer className="mt-20 border-t border-neutral-100 pt-6 text-[12px] leading-relaxed text-neutral-400">
            {content.config.footer_note}
          </footer>
        </main>
      </div>
    </div>
  )
}
