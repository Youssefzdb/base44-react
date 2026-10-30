// pages/Settings.jsx — account + members + invite + workspaces + plan/appearance/locale
import { useState, useEffect } from 'react'
import { api, esc } from '../lib/api.js'
import { Sidebar, icons, I } from '../components/Chrome.jsx'

const saveTheme = v => {
  localStorage.setItem('appearance-theme', v)
  applyTheme(v, document)
}
export function applyTheme(v, doc) {
  const dark = v === 'dark' || (v !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches)
  const r = doc.documentElement
  r.classList.toggle('dark', dark)
  r.setAttribute('data-ds', 'base44')
  r.setAttribute('data-theme', dark ? 'dark' : 'light')
  r.style.backgroundColor = dark ? '#09090b' : ''
}

export default function Settings({ me, ws, credits, workspaces, onSwitchWs, _onRefresh }) {
  const [wsMembers, setMembers] = useState([])
  const [wsList, setWsList] = useState(workspaces || [])
  const [inviteEmail, setInvite] = useState('')
  const [theme, setTheme] = useState(localStorage.getItem('appearance-theme') || 'system')
  const [locale, setLocale] = useState(localStorage.getItem('b44_lang') || 'en')

  useEffect(() => {
    if (ws) api(`/api/workspaces/${ws.id}/members`).then(setMembers).catch(() => {})
  }, [ws?.id])

  const invite = async () => {
    try {
      await api(`/api/workspaces/${ws.id}/invite`, { method: 'POST', body: JSON.stringify({ email: inviteEmail }) })
      setInvite('')
      const m = await api(`/api/workspaces/${ws.id}/members`)
      setMembers(m); alert('Invite sent (mock) — ' + inviteEmail)
    } catch (e) { alert(e.message) }
  }
  const createWs = async () => {
    const name = prompt('Workspace name?')
    if (!name) return
    const w = await api('/api/workspaces', { method: 'POST', body: JSON.stringify({ name }) })
    setWsList(await api('/api/workspaces'))
    onSwitchWs(w.id)
  }
  return (
    <div className="shell">
      <Sidebar active="settings" me={me} ws={ws} credits={credits} workspaces={wsList} onSwitchWs={onSwitchWs} />
      <div className="main">
        <div className="topbar"><b style={{ fontSize: 15 }}>Settings</b>
          <button className="btn btn-outline" style={{ marginLeft: 'auto' }} onClick={createWs}>New workspace</button>
        </div>
        <div className="content">
          <div className="panel">
            <h3 style={{ fontSize: 15 }}>Appearance &amp; language</h3>
            <div className="theme-opts" style={{ display: 'flex', gap: 10, margin: '12px 0' }}>
              {['light', 'dark', 'system'].map(t => (
                <button key={t} className={'t-opt' + (theme === t ? ' active' : '')} style={{ flex: 1, border: 'var(--bw-regular) solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: 10, background: 'var(--surface-elevated)', fontWeight: 600, fontSize: 12.5 }} onClick={() => { setTheme(t); saveTheme(t) }}>
                  {t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <div className="row"><span style={{ color: 'var(--fg-muted)' }}>Language</span>
              <select className="input" style={{ width: 140 }} value={locale} onChange={e => { setLocale(e.target.value); localStorage.setItem('b44_lang', e.target.value); alert('Language set to ' + e.target.value + ' (labels stay EN in v1)') }}>
                <option value="en">English</option><option value="fr">Français</option><option value="ar">العربية</option>
              </select></div>
          </div>
          <div className="panel">
            <h3 style={{ fontSize: 15 }}>Members — {esc(ws?.name)}</h3>
            {(wsMembers || []).map((m, i) => (
              <div className="row" key={i}>
                <span><b>{esc(m.name)}</b> <span style={{ color: 'var(--stone-500)' }}>{esc(m.email)}</span></span>
                <span className="wb-badge">{esc(m.role)} · {esc(m.status)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <input className="input" placeholder="teammate@company.com" value={inviteEmail} onChange={e => setInvite(e.target.value)} style={{ flex: 1 }} />
              <button className="btn btn-primary" onClick={invite}>Invite</button>
            </div>
          </div>
          <div className="panel">
            <h3 style={{ fontSize: 15 }}>Plan</h3>
            <div className="row"><span>Current</span><b>{esc(ws?.plan || 'free')}</b></div>
            <div className="row"><span>Base44 Pro — $20/mo</span><button className="btn btn-brand" onClick={async () => { const p = await api("/api/billing/subscribe", { method: "POST", body: JSON.stringify({ plan: ws?.plan === "pro" ? "free" : "pro" }) }); alert("Plan switched to " + p.plan + " — credits limit " + p.credits_limit); }}>{ws?.plan === 'pro' ? 'Switch to Free' : 'Upgrade'}</button></div>
            <div className="row"><span>Billing portal</span><a href="#/settings" onClick={() => alert('Mock Stripe portal — no real charge.')}>Open</a></div>
          </div>
          <div className="panel">
            <h3 style={{ fontSize: 15 }}>Session</h3>
            <div className="row"><span style={{ color: 'var(--fg-muted)' }}>Email</span><b>{esc(me?.email)}</b></div>
            <div className="row"><span style={{ color: 'var(--fg-muted)' }}>Log out</span>
              <button className="btn btn-outline" onClick={async () => { await api('/api/auth/logout', { method: 'POST' }).catch(() => {}); localStorage.removeItem('b44_token'); location.hash = '#/login'; location.reload() }}>Log out</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
