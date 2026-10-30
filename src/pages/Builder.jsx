// pages/Builder.jsx — agent chat + Preview/Code/Data/Logs/Publish + domains/billing
import { useState, useEffect } from 'react'
import { api, esc } from '../lib/api.js'
import { icons, I } from '../components/Chrome.jsx'

const TABS = [['preview', 'Preview'], ['code', 'Code'], ['data', 'Data'], ['logs', 'Logs'], ['publish', 'Publish']]

export default function Builder({ onCredits }) {
  const id = (location.hash.match(/#\/app\/([\w-]+)/) || [])[1]
  const [app, setApp] = useState(null)
  const [curTab, setTab] = useState('preview')
  const [msgs, setMsgs] = useState([{ role: 'ai', text: 'This is your app. Ask me for anything — entities, pages, theme, publish.' }])
  const [turnSteps, setSteps] = useState(null)
  const [curFile, setFile] = useState(null)
  const [domain, setDomain] = useState('')

  useEffect(() => { if (id) api(`/api/apps/${id}`).then(a => { setApp(a); setFile(Object.keys(a.files || {})[0] || null) }).catch(() => { alert('App not found'); location.hash = '#/' }) }, [id])

  const openApp = a => {
    setApp(a)
    setFile(Object.keys(a.files || {})[0] || null)
  }

  const turn = async e => {
    e.preventDefault()
    const input = e.target.elements.message
    const msg = input.value.trim(); if (!msg) return
    input.value = ''
    setMsgs(m => [...m, { role: 'user', text: msg }])
    try {
      const r = await api(`/api/apps/${id}/agent`, { method: 'POST', body: JSON.stringify({ message: msg }) })
      setSteps(r.steps)
      setMsgs(m => [...m, { role: 'ai', text: 'Working on it —' }])
      setTimeout(async () => {
        const fresh = await api(`/api/apps/${id}`)
        openApp(fresh)
        await onCredits()
        setSteps(null)
      }, r.steps.length * 140 + 300)
    } catch (ex) {
      setMsgs(m => [...m, { role: 'ai', text: ex.message || 'agent failed' }])
    }
  }

  const publish = async () => {
    try {
      const up = await api(`/api/apps/${id}/publish`, { method: 'POST' })
      openApp(up)
      setTab('publish')
    } catch (ex) { alert(ex.message) }
  }

  const verifyDomain = async () => {
    if (!domain.includes('.')) return alert('domain missing TLD?')
    await api('/api/domains/' + domain + '/claim', { method: 'POST' }).catch(() => {})
    const H = { Authorization: 'Bearer ' + localStorage.getItem('b44_token') }
    const s1 = await fetch(`http://localhost:8510/api/domains/${domain}/status`, { headers: H }).then(r => r.json())
    await new Promise(r2 => setTimeout(r2, 3200))
    const s2 = await fetch(`http://localhost:8510/api/domains/${domain}/status`, { headers: H }).then(r => r.json())
    alert(`Domain ${s2.domain}: ${s2.status}` + (s2.status === 'verified' ? ' — your app will answer on this domain 🎉' : ' — TXT: ' + s1.txt_record))
  }

  const subscribe = async () => {
    const p = await api('/api/billing/subscribe', { method: 'POST', body: JSON.stringify({ plan: app?.plan === 'pro' ? 'free' : 'pro' }) })
    alert('Plan switched to ' + p.plan + ' — credits limit ' + p.credits_limit)
    await onCredits()
  }

  if (!app) return <div style={{ padding: 40, color: 'var(--stone-500)' }}>Loading app…</div>

  const files = Object.keys(app.files || {})
  const entEls = (app.spec?.entities || []).map(en => (
    <div className="panel" key={en.name}>
      <h3 style={{ fontSize: 14 }}>{esc(en.name)}</h3>
      <p style={{ color: 'var(--fg-muted)', fontSize: 12, margin: '4px 0 8px' }}>{en.fields.map(f => esc(f.name) + ' (' + f.type + ')').join(' · ')}</p>
      {(en.seed || []).map((r, i) => <div className="entity-row" key={i}><span>{r.map(c => esc(String(c))).join(' — ')}</span></div>)}
    </div>
  ))

  return (
    <div className="main" style={{ height: '100vh' }}>
      <div className="work-head">
        <button className="btn btn-ghost" onClick={() => { location.hash = '#/' }}><I d={icons.back} /></button>
        <b style={{ fontSize: 14 }}>{esc(app.name)}</b>
        <span className={'vis' + (app.state === 'published' ? ' published' : '')} style={{ marginLeft: 4 }}>{app.state === 'published' ? 'Live' : 'Preview'}</span>
        <div className="tabs">
          {TABS.map(([k, l]) => <button key={k} className={'tab' + (curTab === k ? ' active' : '')} onClick={() => setTab(k)}>{l}</button>)}
        </div>
        <span className="credit-chip" style={{ marginLeft: 'auto' }}>{app.plan === 'pro' ? 'Pro' : 'Free'}</span>
      </div>
      <div className="builder">
        <div className="chat">
          <div className="chat-head">
            <span style={{ width: 22, height: 22, borderRadius: 6, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,var(--orange-400),var(--orange-600))', color: '#fff' }}><I d={icons.logo} fill="currentColor" s={11} w={0} /></span>
            <b style={{ fontSize: 13 }}>Base44 agent</b><span className="wb-badge">beta</span>
          </div>
          <div className="chat-body">
            {msgs.map((m, i) => <div key={i} className={'msg ' + (m.role === 'user' ? 'user' : 'ai')}>{esc(m.text)}</div>)}
            {turnSteps && (
              <div className="msg ai"><div className="steps">{turnSteps.map((s, i) => <div key={i} className="step" style={{ animationDelay: i * 0.12 + 's' }}>{s}</div>)}</div></div>
            )}
          </div>
          <form className="chat-input" onSubmit={turn}>
            <textarea name="message" placeholder="Describe a change…" required />
            <button className="btn btn-brand"><I d={icons.send} /></button>
          </form>
        </div>
        <div className="work">
          <div className="work-body">
            {curTab === 'preview' && (
              <div className="preview"><div className="frame-wrap"><iframe title="preview" src={`/runtime.html#app=${app.id}`} /></div></div>
            )}
            {curTab === 'code' && (
              <div className="pane">
                {files.length ? (
                  <>
                    <div className="code-tabs">{files.map(f => <button key={f} className={'code-file' + (f === curFile ? ' active' : '')} onClick={() => setFile(f)}>{esc(f)}</button>)}</div>
                    <pre className="code">{esc(app.files[curFile] || '')}</pre>
                  </>
                ) : <div style={{ color: 'var(--stone-500)', padding: 20 }}>No code yet — build the app first.</div>}
              </div>
            )}
            {curTab === 'data' && <div className="pane">{entEls.length ? entEls : <div style={{ color: 'var(--stone-500)' }}>No entities yet.</div>}</div>}
            {curTab === 'logs' && (
              <div className="pane">{(app.logs || []).map((l, i) => <div key={i} className="logline">{esc(l[1] || '')}</div>).reverse()}</div>
            )}
            {curTab === 'publish' && (
              <div className="pane">
                <div className="panel publish-wrap">
                  <h3 style={{ fontSize: 15 }}>Publish</h3>
                  <p style={{ color: 'var(--fg-muted)', fontSize: 12.5, margin: '4px 0 14px' }}>Your app goes live on <span className="mono">{esc(app.sub_domain)}.base44.app</span></p>
                  {app.state === 'published' ? (
                    <>
                      <div className="pub-url"><span>/p/{esc(app.sub_domain)}</span>
                        <button className="btn btn-ghost" style={{ height: 26 }} onClick={() => { navigator.clipboard?.writeText(location.origin + '/p/' + app.sub_domain) }}><I d={icons.copy} /></button>
                      </div>
                      <p style={{ fontSize: 12.5, color: 'var(--fg-muted)', marginTop: 10 }}>Live version v{esc(app.live_version)}</p>
                    </>
                  ) : (
                    <button className="btn btn-brand btn-lg" onClick={publish}><I d={icons.globe} /> Publish to the web</button>
                  )}
                </div>
                <div className="panel publish-wrap">
                  <h3 style={{ fontSize: 15 }}>Custom domain</h3>
                  <p style={{ color: 'var(--fg-muted)', fontSize: 12.5, margin: '4px 0 12px' }}>Point a CNAME/TXT at your app. Mock verifier auto-approves after 3s.</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className="input" value={domain} onChange={e => setDomain(e.target.value)} placeholder="app.yourbrand.com" style={{ flex: 1 }} />
                    <button className="btn btn-outline" onClick={verifyDomain}>Verify</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
