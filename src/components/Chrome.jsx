// components/Chrome.jsx — sidebar + icons (base44 tokens)
import { api, LS_WS, esc } from '../lib/api.js'
import { useEffect, useState } from 'react'

export const icons = {
  logo: 'M12 2.5 13.6 8.4 19.5 10 13.6 11.6 12 17.5 10.4 11.6 4.5 10l5.9-1.6z',
  home: 'M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5',
  compass: 'M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0zm13-4-2.5 5.5L8 16l2.5-5.5z',
  settings: 'M12 8.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4zM12 2.8v3m0 12.4v3M4.6 4.6l2.1 2.1M17.3 6.7l2.1-2.1M2.8 12h3m12.4 0h3M4.6 19.4l2.1-2.1',
  plus: 'M12 5v14M5 12h14',
  send: 'M4 12 20 4l-4 16-4-6-6-1z',
  code: 'm8 7-5 5 5 5m8-10 5 5-5 5',
  globe: 'M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0zM3 12h18M12 3c2.7 2.6 4 5.8 4 9s-1.3 6.4-4 9c-2.7-2.6-4-5.8-4-9s1.3-6.4 4-9z',
  copy: 'M9 9h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2zM5 15V5a1 1 0 0 1 1-1h10',
  back: 'M15 5l-7 7 7 7',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-3.5-3.5',
  logout: 'M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 8l-4 4 4 4M6 12h11',
  users: 'M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  switch: 'M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4',
}

export const I = ({ d, s = 16, w = 2, fill = 'none' }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
    {d.includes('>') ? <g dangerouslySetInnerHTML={{}} /> : <path d={d} />}
  </svg>
)

export const useCredits = () => {
  const [c, setC] = useState(null)
  const refresh = () => api('/api/credits').then(setC).catch(() => {})
  useEffect(refresh, [])
  return [c, setC, refresh]
}

export function Sidebar({ active, me, ws, credits, onSwitchWs, workspaces }) {
  return (
    <aside className="sidebar">
      <div className="logo"><span className="mark"><I d={icons.logo} fill="currentColor" s={15} /></span>Base44</div>
      {ws && (
        <div className="ws-box" data-ws-switch title="Switch workspace">
          <span className="ws-avatar">{esc((me?.name || 'B')[0].toUpperCase())}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="ws-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{esc(ws.name)}</div>
            <div className="ws-plan">{esc(ws.plan || 'Free')} plan</div>
          </div>
          {workspaces && workspaces.length > 1 && (
            <select value={ws.id} onChange={e => onSwitchWs(e.target.value)} style={{ position: 'absolute', opacity: 0, width: '100%', left: 0, top: 0, height: '100%', cursor: 'pointer' }} aria-label="Switch workspace">
              {workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          )}
        </div>
      )}
      <nav className="nav">
        <a href="#/" className={active === 'home' ? 'active' : ''}><I d={icons.home} /> Home</a>
        <a href="#/explore" className={active === 'explore' ? 'active' : ''}><I d={icons.compass} /> Explore</a>
        <a href="#/settings" className={active === 'settings' ? 'active' : ''}><I d={icons.settings} /> Settings</a>
      </nav>
      <div className="credits">
        <b style={{ fontSize: 12.5 }}>Daily credits</b>
        <div style={{ color: 'var(--stone-500)' }}>{credits ? `${credits.used} / ${credits.total} used` : '…'}</div>
        <div className="bar"><i style={{ width: credits ? Math.min(100, credits.used / (credits.limit || credits.total) * 100) + '%' : 0 }} /></div>
      </div>
    </aside>
  )
}
