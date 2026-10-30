// pages/Login.jsx — auth (login/signup toggle + demo)
import { api, LS_T } from '../lib/api.js'
import { useState } from 'react'
import { icons, I } from '../components/Chrome.jsx'

export default function Login({ onAuthed }) {
  const [mode, setMode] = useState('login')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const submit = async e => {
    e.preventDefault(); setBusy(true); setErr('')
    const fd = new FormData(e.target)
    try {
      const d = await api(mode === 'signup' ? '/api/auth/signup' : '/api/auth/login', {
        method: 'POST', body: JSON.stringify({ email: fd.get('email'), password: fd.get('password') }),
      })
      localStorage.setItem(LS_T, d.access_token)
      onAuthed()
    } catch (ex) { setErr(ex.message) }
    setBusy(false)
  }
  const demo = async () => {
    const d = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: 'demo@base44.dev', password: 'demo1234' }) })
    localStorage.setItem(LS_T, d.access_token); onAuthed()
  }
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <span style={{ width: 34, height: 34, borderRadius: 'var(--radius-xl)', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,var(--orange-400),var(--orange-600))', color: '#fff' }}>
            <I d={icons.logo} fill="currentColor" s={16} w={0} />
          </span>
        </div>
        <h1 className="auth-title">{mode === 'signup' ? 'Create your account' : 'Log in to Base44'}</h1>
        <p className="auth-sub">Build useful apps, fast with Base44.</p>
        <form onSubmit={submit}>
          <div className="field"><label className="label">Email</label><input className="input" name="email" type="email" placeholder="you@company.com" required /></div>
          <div className="field"><label className="label">Password</label><input className="input" name="password" type="password" placeholder="••••••••" required minLength="4" /></div>
          {err && <div style={{ color: 'var(--red-500)', fontSize: 12.5, margin: '4px 0' }}>{err}</div>}
          <button disabled={busy} className="btn btn-primary btn-lg btn-full" style={{ marginTop: 6 }}>{busy ? '…' : mode === 'signup' ? 'Create account' : 'Log in'}</button>
        </form>
        <div className="divider">or</div>
        <button className="btn btn-outline btn-lg btn-full" onClick={demo}>Try the demo workspace</button>
        <p className="auth-foot">
          {mode === 'signup' ? 'Already have an account?' : 'New here? It takes seconds —'}{' '}
          <a style={{ cursor: 'pointer' }} onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}><b>{mode === 'signup' ? 'Log in' : 'Sign up'}</b></a>
        </p>
      </div>
    </div>
  )
}
