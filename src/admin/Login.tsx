import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Banner, Btn } from './ui'

type Stage = 'password' | 'enroll' | 'challenge'

const client = () => {
  if (!supabase) throw new Error('Backend not configured')
  return supabase
}

export default function Login({ onSignedIn }: { onSignedIn: () => void }) {
  const [stage, setStage] = useState<Stage>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [factorId, setFactorId] = useState('')
  const [qr, setQr] = useState('')
  const [secret, setSecret] = useState('')

  /* If a session already exists, resume at the right step. */
  useEffect(() => {
    void (async () => {
      const { data } = await client().auth.getSession()
      if (data.session) await routeAfterPassword()
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function routeAfterPassword() {
    const { data: aal, error: aalErr } = await client().auth.mfa.getAuthenticatorAssuranceLevel()
    if (aalErr) throw aalErr

    if (aal?.currentLevel === 'aal2') {
      onSignedIn()
      return
    }

    const { data: factors, error: fErr } = await client().auth.mfa.listFactors()
    if (fErr) throw fErr
    const verified = factors?.totp?.find((f) => f.status === 'verified')

    if (verified) {
      setFactorId(verified.id)
      setStage('challenge')
      return
    }

    // Clear any half-finished enrollment so a fresh QR can be issued.
    for (const f of factors?.totp ?? []) {
      if (f.status !== 'verified') await client().auth.mfa.unenroll({ factorId: f.id })
    }
    const { data: enr, error: eErr } = await client().auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: `Authenticator ${new Date().toISOString().slice(0, 10)}`,
      issuer: 'Snapmint Brand Admin',
    })
    if (eErr) throw eErr
    setFactorId(enr.id)
    setQr(enr.totp.qr_code)
    setSecret(enr.totp.secret)
    setStage('enroll')
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const { error } = await client().auth.signInWithPassword({ email: email.trim(), password })
      if (error) throw error
      await routeAfterPassword()
    } catch (err: any) {
      const m = String(err?.message ?? err)
      setError(/invalid login credentials/i.test(m) ? 'That email and password combination didn’t work.' : m)
    } finally {
      setBusy(false)
    }
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const { data: ch, error: cErr } = await client().auth.mfa.challenge({ factorId })
      if (cErr) throw cErr
      const { error: vErr } = await client().auth.mfa.verify({
        factorId,
        challengeId: ch.id,
        code: code.replace(/\D/g, ''),
      })
      if (vErr) throw vErr
      onSignedIn()
    } catch (err: any) {
      const m = String(err?.message ?? err)
      setError(/invalid totp|invalid code/i.test(m) ? 'That code didn’t match. Try the next one.' : m)
      setCode('')
    } finally {
      setBusy(false)
    }
  }

  async function startOver() {
    await client().auth.signOut()
    setStage('password')
    setPassword('')
    setCode('')
    setError(null)
  }

  const input =
    'w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-[14px] text-ink placeholder:text-neutral-300 focus:border-neutral-400 focus:outline-none'

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-6 py-12">
      <div className="w-full max-w-[400px]">
        <div className="mb-7">
          <h1 className="font-display text-[22px] font-semibold text-ink">Brand admin</h1>
          <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-500">
            {stage === 'password' && 'Sign in to manage what the guidelines site shows.'}
            {stage === 'enroll' && 'Add this account to your authenticator app to finish setup.'}
            {stage === 'challenge' && 'Enter the 6-digit code from your authenticator app.'}
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          {error && (
            <div className="mb-4">
              <Banner kind="error">{error}</Banner>
            </div>
          )}

          {stage === 'password' && (
            <form onSubmit={submitPassword} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-neutral-600" htmlFor="email">
                  Email
                </label>
                <input
                  id="email" type="email" autoComplete="username" required
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className={input} placeholder="you@snapmint.com"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-neutral-600" htmlFor="password">
                  Password
                </label>
                <input
                  id="password" type="password" autoComplete="current-password" required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className={input} placeholder="••••••••"
                />
              </div>
              <Btn kind="solid" type="submit" disabled={busy}>
                {busy ? 'Checking…' : 'Continue'}
              </Btn>
            </form>
          )}

          {stage === 'enroll' && (
            <div className="space-y-5">
              <ol className="space-y-1.5 text-[13px] leading-relaxed text-neutral-600">
                <li>1. Open Microsoft Authenticator.</li>
                <li>2. Add account → Other account → scan this code.</li>
                <li>3. Type the 6-digit code it shows.</li>
              </ol>

              {qr && (
                <div className="flex justify-center rounded-lg border border-neutral-200 bg-white p-3">
                  <img src={qr} alt="Authenticator setup QR code" className="h-44 w-44" />
                </div>
              )}

              <details className="text-[12px] text-neutral-500">
                <summary className="cursor-pointer select-none">Can’t scan? Enter the key manually</summary>
                <code className="mt-2 block break-all rounded bg-neutral-50 p-2 font-mono text-[12px] text-ink">
                  {secret}
                </code>
              </details>

              <form onSubmit={submitCode} className="space-y-3">
                <CodeInput value={code} onChange={setCode} />
                <div className="flex items-center gap-3">
                  <Btn kind="solid" type="submit" disabled={busy || code.replace(/\D/g, '').length !== 6}>
                    {busy ? 'Verifying…' : 'Finish setup'}
                  </Btn>
                  <Btn kind="quiet" size="sm" onClick={startOver}>
                    Cancel
                  </Btn>
                </div>
              </form>
            </div>
          )}

          {stage === 'challenge' && (
            <form onSubmit={submitCode} className="space-y-4">
              <CodeInput value={code} onChange={setCode} />
              <div className="flex items-center gap-3">
                <Btn kind="solid" type="submit" disabled={busy || code.replace(/\D/g, '').length !== 6}>
                  {busy ? 'Verifying…' : 'Verify'}
                </Btn>
                <Btn kind="quiet" size="sm" onClick={startOver}>
                  Use a different account
                </Btn>
              </div>
            </form>
          )}
        </div>

        <p className="mt-5 text-center text-[12px] leading-relaxed text-neutral-400">
          Editing is limited to one Snapmint account and always requires an authenticator code.
        </p>
      </div>
    </div>
  )
}

function CodeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-medium text-neutral-600" htmlFor="code">
        6-digit code
      </label>
      <input
        id="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        maxLength={7}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
        placeholder="000000"
        className="w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-center font-mono text-[20px] tracking-[0.3em] text-ink placeholder:text-neutral-200 focus:border-neutral-400 focus:outline-none"
      />
    </div>
  )
}
