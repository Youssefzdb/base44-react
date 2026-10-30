// pages/Home.jsx — hero prompt + apps grid
import { useState, useEffect } from 'react'
import { api, fmtAgo, esc } from '../lib/api.js'
import { Sidebar, icons, I } from '../components/Chrome.jsx'

export default function Home({ me, ws, credits, _refreshCredits, workspaces, onSwitchWs }) {
  const [apps, setApps] = useState(null)
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState(false)
  const load = () => api('/api/workspace_apps').then(setApps).catch(() => setApps([]))
  useEffect(() => { load() }, [ws?.id])
  const create = async () => {
    if (!prompt.trim()) return
    setBusy(true)
    try {
      const a = await api('/api/apps', { method: 'POST', body: JSON.stringify({ prompt }) })
      location.hash = '#/app/' + a.id
    } catch (e) { alert(e.message) }
    setBusy(false)
  }
  const emptyApp = async () => {
    const a = await api('/api/apps', { method: 'POST', body: JSON.stringify({ name: 'Untitled App' }) })
    location.hash = '#/app/' + a.id
  }
  return (
    <div className="shell">
      <Sidebar active="home" me={me} ws={ws} credits={credits} workspaces={workspaces} onSwitchWs={onSwitchWs} />
      <div className="main">
        <div className="topbar">
          <b style={{ fontSize: 15 }}>{esc(ws?.name || 'Workspace')}</b>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <a className="btn btn-ghost" href="#/explore"><I d={icons.compass} /> Explore</a>
            <button className="btn btn-primary" onClick={emptyApp}><I d={icons.plus} /> New App</button>
          </div>
        </div>
        <div className="content">
          <div className="hero">
            <h1>Build useful apps,<br /><span style={{ fontFamily: 'var(--font-brand)', fontWeight: 500 }}>fast with Base44.</span></h1>
            <p>Describe what you want. The agent builds the full app — data, logic and UI — in minutes.</p>
            <form className="prompt" style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }} onSubmit={e => { e.preventDefault(); create() }}>
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="e.g. A CRM to track my clients…" style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', minHeight: 40, fontSize: 14, resize: 'none', padding: '8px 10px' }} required />
              <button disabled={busy} className="btn btn-brand" style={{ height: 36, alignSelf: 'flex-end' }}><I d={icons.logo} fill="currentColor" s={14} w={0} /> {busy ? 'Building…' : 'Create'}</button>
            </form>
          </div>
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>Your apps <span className="wb-badge" style={{ marginLeft: 6 }}>{apps?.length ?? '…'}</span></h2>
          <div className="grid">
            {(apps || []).map(a => (
              <button key={a.id} className="app-card" onClick={() => { location.hash = '#/app/' + a.id }}>
                <div className="top">
                  <span className="app-icon" style={{ background: (a.theme && a.theme.accent) || '#4d33de' }}>{esc((a.name || 'A')[0].toUpperCase())}</span>
                  <span className={'vis' + (a.state === 'published' ? ' published' : '')}>{a.state === 'published' ? 'Live' : 'Preview'}</span>
                </div>
                <div>
                  <div className="app-name">{esc(a.name)}</div>
                  <div className="app-desc">{esc((a.spec && a.spec.summary) || 'Empty app')}</div>
                </div>
                <div className="app-meta"><span>{esc(a.visibility)}</span><span>{fmtAgo(a.updated)}</span></div>
              </button>
            ))}
            <button className="new-card" onClick={emptyApp}><I d={icons.plus} /> New App</button>
          </div>
        </div>
      </div>
    </div>
  )
}
