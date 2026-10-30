import { createRoot } from 'react-dom/client'
import { useEffect, useState } from 'react'
import { api, LS_T, LS_WS } from './lib/api.js'
import { applyTheme } from './pages/Settings.jsx'
import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import Explore from './pages/Explore.jsx'
import Builder from './pages/Builder.jsx'
import Settings from './pages/Settings.jsx'

function App() {
  const [route, setRoute] = useState(location.hash || '#/')
  const [sess, setSess] = useState(null) // {me, ws, workspaces}
  useEffect(() => {
    const onHash = () => setRoute(location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const boot = async () => {
    if (!localStorage.getItem(LS_T)) { setSess({ anon: true }); return }
    try {
      const me = await api('/api/me')
      const workspaces = await api('/api/workspaces')
      const saved = localStorage.getItem(LS_WS)
      let ws = workspaces.find(w => w.id === saved) || workspaces[0] || null
      if (ws) localStorage.setItem(LS_WS, ws.id)
      setSess({ me, ws, workspaces })
    } catch (e) {
      localStorage.removeItem(LS_T)
      setSess({ anon: true })
    }
  }
  useEffect(() => { applyTheme(localStorage.getItem('appearance-theme') || 'system', document); boot() }, [])

  const onSwitchWs = id => { localStorage.setItem(LS_WS, id); setRoute('#/__x'); boot().then(() => setRoute(location.hash === '#/__x' ? '#/' : location.hash)); }
  const onAuthed = () => boot().then(() => { location.hash = '#/' })
  if (!sess) return <div style={{ padding: 40, color: 'var(--stone-500)' }}>Loading workspace…</div>
  if (sess.anon) return <Login onAuthed={onAuthed} />

  const Page = {
    login: Login, home: Home, explore: Explore, app: Builder, settings: Settings,
  }
  const hash = route.replace(/^#\/?/, '')
  if (hash.startsWith('app/')) return <Builder onCredits={boot} key={hash} />
  if (hash.startsWith('explore')) return <Explore me={sess.me} ws={sess.ws} credits={null} workspaces={sess.workspaces} onSwitchWs={onSwitchWs} />
  if (hash.startsWith('settings')) return <Settings me={sess.me} ws={sess.ws} credits={null} workspaces={sess.workspaces} onSwitchWs={onSwitchWs} key={hash} />
  return <Home me={sess.me} ws={sess.ws} credits={null} workspaces={sess.workspaces} onSwitchWs={onSwitchWs} key={(sess.ws?.id || '') + hash} />
}
createRoot(document.getElementById('root')).render(<App />)
