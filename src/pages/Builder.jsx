// pages/Builder.jsx — agent chat (SSE: think → tools → preview) + Preview/Code/Data/Logs/Publish
import { useState, useEffect } from 'react'
import { api, esc } from '../lib/api.js'
import { icons, I } from '../components/Chrome.jsx'

const TABS = [['preview', 'Preview'], ['code', 'Code'], ['data', 'Data'], ['logs', 'Logs'], ['publish', 'Publish']]

export default function Builder({ onCredits }) {
  const id = (location.hash.match(/#\/app\/([\w-]+)/) || [])[1]
  const [app, setApp] = useState(null)
  const [curTab, setTab] = useState('preview')
  const [msgs, setMsgs] = useState([{ role: 'ai', text: 'This is your app. Ask me for anything — entities, pages, theme, publish.' }])
  const [curFile, setFile] = useState(null)
  const [domain, setDomain] = useState('')
  const [busy, setBusy] = useState(false)
  const [pv, setPv] = useState(0) // bump → live preview reload after backend file regen

  useEffect(() => { if (id) api(`/api/apps/${id}`).then(a => { setApp(a); setFile(Object.keys(a.files || {})[0] || null) }).catch(() => { alert('App not found'); location.hash = '#/' }) }, [id])

  const openApp = a => {
    setApp(a)
    setFile(Object.keys(a.files || {})[0] || null)
  }

  const patchLast = f => setMsgs(m => { const c = [...m]; c[c.length - 1] = f(c[c.length - 1]); return c })

  const turn = async e => {
    e.preventDefault()
    if (busy) return
    const input = e.target.elements.message
    const msg = input.value.trim(); if (!msg) return
    input.value = ''
    setBusy(true)
    setMsgs(m => [...m, { role: 'user', text: msg }, { role: 'ai', thinking: [], tools: [], text: '', live: true }])

    const onEv = ev => {
      if (ev.type === 'start') patchLast(ai => ({ ...ai, model: ev.model }))
      else if (ev.type === 'thinking') patchLast(ai => ({ ...ai, thinking: [...(ai.thinking || []), ev.text] }))
      else if (ev.type === 'step') patchLast(ai => ({ ...ai, thinking: [...(ai.thinking || []), ev.text] }))
      else if (ev.type === 'notice') patchLast(ai => ({ ...ai, notice: ev.text }))
      else if (ev.type === 'tool') patchLast(ai => ({ ...ai, tools: [...(ai.tools || []), { name: ev.name, args: ev.args, result: ev.result }] }))
      else if (ev.type === 'preview') setPv(p => p + 1)             // live preview reload
      else if (ev.type === 'error') patchLast(ai => ({ ...ai, text: ev.text, live: false }))
      else if (ev.type === 'done') {
        patchLast(ai => ({ ...ai, steps: ev.steps, text: ev.reply || 'Done — changes applied.', mode: ev.mode, live: false }))
        api(`/api/apps/${id}`).then(openApp).catch(() => {})
        onCredits && onCredits()
      }
    }

    try {
      const res = await fetch(`/api/apps/${id}/agent/stream`, {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' },
          localStorage.getItem('b44_token') ? { Authorization: 'Bearer ' + localStorage.getItem('b44_token') } : {}),
        body: JSON.stringify({ message: msg }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || res.statusText)
      // not SSE? (plain json error)
      if (!(res.headers.get('content-type') || '').includes('text/event-stream')) {
        const j = await res.json(); throw new Error(j.message || 'agent failed')
      }
      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let buf = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        let nl
        while ((nl = buf.indexOf('\n\n')) >= 0) {
          const line = buf.slice(0, nl); buf = buf.slice(nl + 2)
          if (line.startsWith('data: ')) { try { onEv(JSON.parse(line.slice(6))) } catch { } }
        }
      }
    } catch (ex) {
      patchLast(ai => ({ ...ai, text: ex.message || 'agent failed', live: false }))
    }
    patchLast(ai => (ai.live ? { ...ai, live: false } : ai))
    setBusy(false)
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
            <b style={{ fontSize: 13 }}>Base44 agent</b><span className="wb-badge">AI</span>
          </div>
          <div className="chat-body">
            {msgs.map((m, i) => m.role === 'user'
              ? <div key={i} className="msg user">{esc(m.text)}</div>
              : (
                <div key={i} className={'msg ai' + (m.live ? ' live' : '')}>
                  {(m.thinking || []).map((t, j) => (
                    <div className="think-row" key={'t' + j}><span className="tdot">✳</span><span>{esc(t)}</span></div>
                  ))}
                  {(m.tools || []).map((t, j) => (
                    <div className="tool-chip" key={'k' + j}>
                      <b>{esc(t.name)}</b>{' '}
                      <span style={{ opacity: .75 }}>{esc(t.args?.name || t.args?.accent || '')}</span>
                      <span className="tres">→ {esc(t.result)}</span>
                    </div>
                  ))}
                  {m.notice && <div className="think-row warn"><span className="tdot">!</span><span>{esc(m.notice)}</span></div>}
                  {m.text && <span>{esc(m.text)}</span>}
                  {m.live && <div className="dots"><i /><i /><i /></div>}
                </div>
              ))}
          </div>
          <form className="chat-input" onSubmit={turn}>
            <textarea name="message" placeholder={busy ? 'Agent is working…' : 'Describe a change…'} disabled={busy} required />
            <button className="btn btn-brand" disabled={busy}><I d={icons.send} /></button>
          </form>
        </div>
        <div className="work">
          <div className="work-body">
            {curTab === 'preview' && (
              <div className="preview"><div className="frame-wrap">
                <iframe key={pv} title="preview" src={`/runtime.html#app=${app.id}&rev=${pv}`} />
              </div></div>
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
