import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type Row = Record<string, any> & { id: string; sort_order?: number; visible?: boolean }

const client = () => {
  if (!supabase) throw new Error('Backend is not configured for this build.')
  return supabase
}

/** Human message for the common failure modes, instead of raw Postgres errors. */
export function explain(e: any): string {
  const msg = String(e?.message ?? e ?? 'Something went wrong')
  if (/row-level security|violates row-level/i.test(msg))
    return 'The database refused the change. Your session needs to be verified with your authenticator app.'
  if (/duplicate key|unique constraint/i.test(msg)) return 'That short name is already used. Pick another.'
  if (/violates check constraint/i.test(msg)) return 'One of the values isn’t allowed for this field.'
  if (/JWT|token is expired/i.test(msg)) return 'Your session expired. Sign in again.'
  if (/Failed to fetch|NetworkError/i.test(msg)) return 'Can’t reach the database. Check your connection.'
  return msg
}

export function useTable(table: string, filter?: { column: string; value: string | null }) {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      let q = client().from(table).select('*')
      if (filter?.column) {
        if (filter.value === null) {
          setRows([])
          setLoading(false)
          return
        }
        q = q.eq(filter.column, filter.value)
      }
      const { data, error } = await q.order('sort_order', { ascending: true })
      if (error) throw error
      setRows((data ?? []) as Row[])
    } catch (e) {
      setError(explain(e))
    } finally {
      setLoading(false)
    }
  }, [table, filter?.column, filter?.value])

  useEffect(() => {
    setLoading(true)
    void load()
  }, [load])

  const run = async (fn: () => Promise<any>) => {
    setError(null)
    try {
      const { error } = await fn()
      if (error) throw error
      await load()
      return true
    } catch (e) {
      setError(explain(e))
      return false
    }
  }

  const create = (values: Record<string, any>) =>
    run(async () => {
      const next = rows.length ? Math.max(...rows.map((r) => r.sort_order ?? 0)) + 1 : 0
      return client()
        .from(table)
        .insert({ sort_order: next, ...values })
    })

  const update = (id: string, values: Record<string, any>) =>
    run(async () => client().from(table).update(values).eq('id', id))

  const remove = (id: string) => run(async () => client().from(table).delete().eq('id', id))

  /** Swap sort_order with the neighbour in the given direction. */
  const move = async (id: string, dir: -1 | 1) => {
    const i = rows.findIndex((r) => r.id === id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= rows.length) return false
    const a = rows[i]
    const b = rows[j]
    return run(async () => {
      const r1 = await client().from(table).update({ sort_order: b.sort_order ?? j }).eq('id', a.id)
      if (r1.error) return r1
      return client().from(table).update({ sort_order: a.sort_order ?? i }).eq('id', b.id)
    })
  }

  return { rows, loading, error, setError, reload: load, create, update, remove, move }
}

/** Upload a file to the public brand-assets bucket and return its URL. */
export async function uploadAsset(file: File, folder: string): Promise<string> {
  const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-|-$/g, '')
  const path = `${folder}/${Date.now()}-${safe}`
  const { error } = await client()
    .storage.from('brand-assets')
    .upload(path, file, { cacheControl: '31536000', upsert: false, contentType: file.type })
  if (error) throw new Error(explain(error))
  return client().storage.from('brand-assets').getPublicUrl(path).data.publicUrl
}

export async function updateSiteConfig(values: Record<string, any>) {
  const { error } = await client().from('site_config').update(values).eq('id', true)
  if (error) throw new Error(explain(error))
}
