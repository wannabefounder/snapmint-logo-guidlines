import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { FALLBACK, fetchContent, type SiteContent } from './content'
import { hasBackend } from './config'

type Ctx = {
  content: SiteContent
  loading: boolean
  /** set when the database was configured but unreachable — the site fell back */
  degraded: boolean
  refresh: () => Promise<void>
}

const ContentContext = createContext<Ctx>({
  content: FALLBACK,
  loading: false,
  degraded: false,
  refresh: async () => {},
})

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>(FALLBACK)
  const [loading, setLoading] = useState(hasBackend)
  const [degraded, setDegraded] = useState(false)

  const refresh = useCallback(async () => {
    if (!hasBackend) return
    try {
      const next = await fetchContent()
      setContent(next)
      setDegraded(false)
    } catch (e) {
      // Never blank the page: keep the bundled content and flag the state.
      console.error('[content] falling back to bundled defaults', e)
      setContent(FALLBACK)
      setDegraded(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return (
    <ContentContext.Provider value={{ content, loading, degraded, refresh }}>{children}</ContentContext.Provider>
  )
}

export const useSiteContent = () => useContext(ContentContext)
