import { useEffect, useRef, useState, type ReactNode } from 'react'
import { uploadAsset } from './api'

/* ------------------------------------------------------------------ basics */

export function Btn({
  children,
  onClick,
  kind = 'ghost',
  size = 'md',
  disabled,
  type = 'button',
  title,
}: {
  children: ReactNode
  onClick?: () => void
  kind?: 'solid' | 'ghost' | 'danger' | 'quiet'
  size?: 'sm' | 'md'
  disabled?: boolean
  type?: 'button' | 'submit'
  title?: string
}) {
  const styles = {
    solid: 'bg-brand-orange text-white hover:bg-brand-orangeDark disabled:bg-neutral-200 disabled:text-neutral-400',
    ghost: 'border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:text-ink',
    danger: 'border border-red-200 bg-white text-red-600 hover:bg-red-50',
    quiet: 'text-neutral-500 hover:text-ink',
  }[kind]
  const pad = size === 'sm' ? 'px-2.5 py-1.5 text-[12px]' : 'px-3.5 py-2 text-[13px]'
  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`tap inline-flex items-center justify-center gap-1.5 rounded-lg font-medium disabled:cursor-not-allowed ${pad} ${styles}`}
    >
      {children}
    </button>
  )
}

export function Banner({ kind, children }: { kind: 'error' | 'ok' | 'info'; children: ReactNode }) {
  const styles = {
    error: 'border-red-200 bg-red-50 text-red-700',
    ok: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    info: 'border-neutral-200 bg-neutral-50 text-neutral-600',
  }[kind]
  return <p className={`rounded-lg border px-4 py-3 text-[13px] leading-relaxed ${styles}`}>{children}</p>
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-ink px-4 py-2.5 text-[13px] text-white shadow-lg">
      {message}
    </div>
  )
}

/* ------------------------------------------------------------------ fields */

export type FieldDef = {
  key: string
  label: string
  type?: 'text' | 'textarea' | 'color' | 'select' | 'asset' | 'number'
  options?: { value: string; label: string }[]
  help?: string
  placeholder?: string
  /** upload folder when type is 'asset' */
  folder?: string
  accept?: string
  span?: 1 | 2
}

export function Field({
  def,
  value,
  onChange,
}: {
  def: FieldDef
  value: any
  onChange: (v: any) => void
}) {
  const label = (
    <label className="mb-1.5 block text-[12px] font-medium text-neutral-600" htmlFor={def.key}>
      {def.label}
    </label>
  )
  const box =
    'w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[13px] text-ink placeholder:text-neutral-300 focus:border-neutral-400 focus:outline-none'

  return (
    <div className={def.span === 2 ? 'sm:col-span-2' : ''}>
      {label}
      {def.type === 'textarea' ? (
        <textarea
          id={def.key}
          rows={3}
          value={value ?? ''}
          placeholder={def.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`${box} resize-y leading-relaxed`}
        />
      ) : def.type === 'select' ? (
        <select id={def.key} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={box}>
          {def.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : def.type === 'color' ? (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={/^#[0-9a-f]{6}$/i.test(value ?? '') ? value : '#000000'}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="h-9 w-10 shrink-0 cursor-pointer rounded border border-neutral-200 bg-white p-1"
            aria-label={`${def.label} swatch`}
          />
          <input
            id={def.key}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className={`${box} font-mono`}
            placeholder="#FF6F00"
          />
        </div>
      ) : def.type === 'asset' ? (
        <AssetField def={def} value={value} onChange={onChange} />
      ) : def.type === 'number' ? (
        <input
          id={def.key}
          type="number"
          value={value ?? 0}
          onChange={(e) => onChange(Number(e.target.value))}
          className={box}
        />
      ) : (
        <input
          id={def.key}
          value={value ?? ''}
          placeholder={def.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={box}
        />
      )}
      {def.help && <p className="mt-1 text-[11px] leading-relaxed text-neutral-400">{def.help}</p>}
    </div>
  )
}

function AssetField({ def, value, onChange }: { def: FieldDef; value: any; onChange: (v: any) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const pick = async (file?: File | null) => {
    if (!file) return
    setBusy(true)
    setErr(null)
    try {
      onChange(await uploadAsset(file, def.folder ?? 'misc'))
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setBusy(false)
      if (ref.current) ref.current.value = ''
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="/assets/logo/… or an uploaded URL"
          className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 font-mono text-[12px] text-ink placeholder:text-neutral-300 focus:border-neutral-400 focus:outline-none"
        />
        <input
          ref={ref}
          type="file"
          accept={def.accept ?? 'image/svg+xml,image/png'}
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0])}
        />
        <Btn size="sm" onClick={() => ref.current?.click()} disabled={busy}>
          {busy ? 'Uploading…' : 'Upload'}
        </Btn>
      </div>
      {value && (
        <div className="mt-2 inline-flex items-center gap-2 rounded border border-neutral-100 bg-neutral-50 px-2 py-1.5">
          <img src={value} alt="" className="h-5 w-auto max-w-[130px] object-contain" />
        </div>
      )}
      {err && <p className="mt-1 text-[11px] text-red-600">{err}</p>}
    </div>
  )
}

/* ------------------------------------------------------------- form shells */

export function Panel({ title, description, children, action }: {
  title: string
  description?: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <section className="mb-10">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-[19px] font-semibold text-ink">{title}</h2>
          {description && <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-neutral-500">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`tap relative h-[22px] w-[38px] shrink-0 rounded-full ${on ? 'bg-brand-orange' : 'bg-neutral-300'}`}
    >
      <span
        className={`absolute top-[3px] h-4 w-4 rounded-full bg-white transition-[left] duration-150 ${
          on ? 'left-[19px]' : 'left-[3px]'
        }`}
      />
    </button>
  )
}

/** Collapsible record card with move / hide / delete controls. */
export function RecordCard({
  title,
  subtitle,
  visible,
  onVisible,
  onUp,
  onDown,
  onDelete,
  children,
  defaultOpen = false,
}: {
  title: string
  subtitle?: string
  visible?: boolean
  onVisible?: (v: boolean) => void
  onUp?: () => void
  onDown?: () => void
  onDelete?: () => void
  children: ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [confirm, setConfirm] = useState(false)

  useEffect(() => {
    if (!confirm) return
    const t = setTimeout(() => setConfirm(false), 4000)
    return () => clearTimeout(t)
  }, [confirm])

  return (
    <div className={`rounded-xl border border-neutral-200 ${visible === false ? 'bg-neutral-50/60' : 'bg-white'}`}>
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
          aria-expanded={open}
        >
          <svg
            width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"
            className={`shrink-0 text-neutral-400 ${open ? 'rotate-90' : ''}`}
          >
            <path d="m3 1 4 4-4 4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </svg>
          <span className="min-w-0">
            <span className={`block truncate text-[14px] font-medium ${visible === false ? 'text-neutral-400' : 'text-ink'}`}>
              {title || 'Untitled'}
            </span>
            {subtitle && <span className="block truncate text-[12px] text-neutral-400">{subtitle}</span>}
          </span>
          {visible === false && (
            <span className="ml-1 shrink-0 rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
              Hidden
            </span>
          )}
        </button>

        <div className="flex shrink-0 items-center gap-1">
          {onUp && <IconBtn label="Move up" onClick={onUp}><path d="m3 7 4-4 4 4" /></IconBtn>}
          {onDown && <IconBtn label="Move down" onClick={onDown}><path d="m3 5 4 4 4-4" /></IconBtn>}
          {onVisible && <Toggle on={visible !== false} onChange={onVisible} label={`Show ${title}`} />}
          {onDelete && (
            <Btn kind={confirm ? 'danger' : 'quiet'} size="sm" onClick={() => (confirm ? onDelete() : setConfirm(true))}>
              {confirm ? 'Confirm' : 'Delete'}
            </Btn>
          )}
        </div>
      </div>

      {open && <div className="border-t border-neutral-100 px-4 py-4">{children}</div>}
    </div>
  )
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="tap rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-ink"
    >
      <svg width="14" height="14" viewBox="0 0 14 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </button>
  )
}

/** Edit-in-place form body: renders fields, tracks dirt, saves on demand. */
export function EditForm({
  fields,
  row,
  onSave,
  saving,
}: {
  fields: FieldDef[]
  row: Record<string, any>
  onSave: (patch: Record<string, any>) => Promise<boolean | void>
  saving?: boolean
}) {
  const [draft, setDraft] = useState(row)
  const [busy, setBusy] = useState(false)

  useEffect(() => setDraft(row), [row])

  const dirty = fields.some((f) => (draft[f.key] ?? '') !== (row[f.key] ?? ''))

  const save = async () => {
    setBusy(true)
    const patch: Record<string, any> = {}
    for (const f of fields) if ((draft[f.key] ?? '') !== (row[f.key] ?? '')) patch[f.key] = draft[f.key]
    await onSave(patch)
    setBusy(false)
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <Field key={f.key} def={f} value={draft[f.key]} onChange={(v) => setDraft({ ...draft, [f.key]: v })} />
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Btn kind="solid" size="sm" onClick={save} disabled={!dirty || busy || saving}>
          {busy ? 'Saving…' : 'Save'}
        </Btn>
        {dirty && !busy && <span className="text-[12px] text-neutral-400">Unsaved changes</span>}
      </div>
    </div>
  )
}
