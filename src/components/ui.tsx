import { useCallback, useState } from 'react'

/* ---------- download helper ---------- */

export async function downloadAsset(url: string, filename: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Could not fetch ${url}`)
  const blob = await res.blob()
  const href = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(href), 1000)
}

/* ---------- buttons ---------- */

type DLProps = {
  url: string
  filename: string
  children: React.ReactNode
  variant?: 'solid' | 'ghost'
}

export function DownloadButton({ url, filename, children, variant = 'ghost' }: DLProps) {
  const [state, setState] = useState<'idle' | 'done' | 'error'>('idle')

  const onClick = useCallback(async () => {
    try {
      await downloadAsset(url, filename)
      setState('done')
    } catch {
      setState('error')
    }
    setTimeout(() => setState('idle'), 1600)
  }, [url, filename])

  const styles =
    variant === 'solid'
      ? 'bg-brand-orange text-white hover:bg-brand-orangeDark'
      : 'border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:text-ink'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`tap inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-medium ${styles}`}
    >
      {state === 'done' ? <CheckIcon /> : state === 'error' ? <AlertIcon /> : <ArrowDownIcon />}
      {state === 'done' ? 'Saved' : state === 'error' ? 'Failed' : children}
    </button>
  )
}

/* ---------- segmented toggle ---------- */

export function Toggle({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string; dot: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="inline-flex rounded-lg border border-neutral-200 p-0.5" role="tablist" aria-label="Logo colour">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`tap inline-flex items-center gap-1.5 whitespace-nowrap rounded-[6px] px-3 py-1.5 text-[13px] font-medium ${
              active ? 'bg-neutral-100 text-ink' : 'text-neutral-500 hover:text-ink'
            }`}
          >
            <span className="h-2 w-2 rounded-full ring-1 ring-black/10" style={{ background: o.dot }} />
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/* ---------- layout bits ---------- */

export function SectionHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: string
  children?: React.ReactNode
}) {
  return (
    <header className="mb-10">
      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-orange">{eyebrow}</p>
      <h1 className="text-[32px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink">{title}</h1>
      {children && <p className="mt-3 max-w-[46rem] text-[15px] leading-[1.65] text-neutral-600">{children}</p>}
    </header>
  )
}

export function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-[13px] leading-relaxed text-neutral-600">
      {children}
    </p>
  )
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-200 px-8 py-16 text-center">
      <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-neutral-500">{body}</p>
    </div>
  )
}

/* ---------- icons ---------- */

export const ArrowDownIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M8 2.5v8m0 0L4.5 7M8 10.5 11.5 7M2.5 13.5h11"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
export const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="m3 8.5 3.2 3.2L13 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
export const AlertIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M8 5v4m0 2.5h.01M8 1.5 15 14H1L8 1.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
