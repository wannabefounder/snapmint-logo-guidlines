/**
 * Backend coordinates. Kept free of any @supabase/supabase-js import so the
 * public site can read content with plain fetch and never pays for the auth
 * library — that only ships inside the lazy-loaded admin chunk.
 */
export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '')
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

export const hasBackend = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

export const STORAGE_BUCKET = 'brand-assets'

export const storagePublicUrl = (path: string) =>
  `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`
