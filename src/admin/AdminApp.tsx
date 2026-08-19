import { useCallback, useEffect, useState } from 'react'
import { hasBackend } from '../lib/config'
import { supabase } from '../lib/supabase'
import { useSiteContent } from '../lib/useContent'
import Login from './Login'
import {
  ActivityPanel, ColoursPanel, LogosPanel, RulesPanel, SectionsPanel, SitePanel, WidgetsPanel,
} from './panels'
import { Banner, Btn, Toast } from './ui'

const TABS = [
  { id: 'site', label: 'Site' },
  { id: 'logos', label: 'Logos' },
  { id: 'sections', label: 'Sections' },
  { id: 'widgets', label: 'Widgets' },
  { id: 'colours', label: 'Colours' },
  { id: 'rules', label: 'Rules' },
  { id: 'activity', label: 'Activity' },
] as const

type TabId = (typeof TABS)[number]['id']

export default function AdminApp() {
  const [ready, setReady] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const [email, setEmail] = useState('')
  const [tab, setTab] = useState<TabId>('site')
  const [toast, setToast] = useState<string | null>(null)
  const { refresh } = useSiteContent()

  const notify = useCallback((msg: string) => {
    setToast(msg)
    void refresh() // keep the public site's cached content in step
    setTimeout(() => setToast(null), 2200)
  }, [refresh])

  const check = useCallback(async () => {
    if (!supabase) return setReady(true)
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    const { data: u } = await supabase.auth.getUser()
    setEmail(u.user?.email ?? '')
    setSignedIn(aal?.currentLevel === 'aal2')
    setReady(true)
  }, [])

  useEffect(() => {
    void check()
    const sub = supabase?.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setSignedIn(false)
        setEmail('')
      }
    })
    return () => sub?.data.subscription.unsubscribe()
  }, [check])

  if (!hasBackend) {
    return (
      <Shell>
        <Banner kind="error">
          This build has no database configured, so the admin panel can’t run. Set VITE_SUPABASE_URL and
          VITE_SUPABASE_ANON_KEY and redeploy.
        </Banner>
      </Shell>
    )
  }

  if (!ready) return <Shell><p className="text-[13px] text-neutral-400">Checking your session…</p></Shell>
  if (!signedIn) return <Login onSignedIn={() => void check()} />

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-[980px] flex-wrap items-center gap-x-4 gap-y-2 px-6 py-3.5">
          <h1 className="font-display text-[15px] font-semibold text-ink">Brand admin</h1>
          <span className="hidden text-[12px] text-neutral-400 sm:inline">{email}</span>
          <div className="ml-auto flex items-center gap-2">
            <Btn size="sm" onClick={() => (window.location.hash = '/logo')}>
              View site
            </Btn>
            <Btn
              size="sm"
              kind="quiet"
              onClick={async () => {
                await supabase!.auth.signOut()
                setSignedIn(false)
              }}
            >
              Sign out
            </Btn>
          </div>
        </div>

        <nav className="mx-auto flex max-w-[980px] gap-1 overflow-x-auto px-4 pb-0.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`tap whitespace-nowrap border-b-2 px-3 py-2.5 text-[13px] font-medium ${
                tab === t.id
                  ? 'border-brand-orange text-ink'
                  : 'border-transparent text-neutral-500 hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-[980px] px-6 py-8">
        {tab === 'site' && <SitePanel notify={notify} />}
        {tab === 'logos' && <LogosPanel notify={notify} />}
        {tab === 'sections' && <SectionsPanel notify={notify} />}
        {tab === 'widgets' && <WidgetsPanel notify={notify} />}
        {tab === 'colours' && <ColoursPanel notify={notify} />}
        {tab === 'rules' && <RulesPanel notify={notify} />}
        {tab === 'activity' && <ActivityPanel />}

        <p className="mt-12 border-t border-neutral-200 pt-5 text-[12px] leading-relaxed text-neutral-400">
          Changes are live the moment you save — merchants see them on their next page load. New items start hidden so
          you can finish writing before anyone sees them.
        </p>
      </main>

      <Toast message={toast} />
    </div>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-6">
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
