import { createClient } from '@supabase/supabase-js'
import { SUPABASE_ANON_KEY, SUPABASE_URL, hasBackend } from './config'

/**
 * Full Supabase client — auth, storage writes, RLS-aware queries.
 * Only imported from src/admin/*, which is lazy-loaded, so the auth library
 * never lands in the bundle merchants download.
 */
export const supabase = hasBackend
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: 'snapmint-brand-auth',
      },
    })
  : null

export { hasBackend }
