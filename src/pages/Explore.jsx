// pages/Explore.jsx — templates gallery
import { api } from '../lib/api.js'
import { Sidebar, icons, I } from '../components/Chrome.jsx'
import { esc } from '../lib/api.js'

const TPLS = [
  ['CRM', 'Track customers, deals and follow-ups in one clean pipeline.', 'A CRM to track my clients and deals', '#4d33de'],
  ['Task Manager', 'Projects, tasks, statuses and a daily focus view.', 'A task manager with kanban board', '#ff773c'],
  ['Blog', 'Write posts with a rich editor and share publicly.', 'A blog to publish articles', '#3b51e5'],
  ['Expense Tracker', 'Log spend, monthly budget charts and export.', 'An expense tracker with categories', '#a6c93b'],
  ['Notes', 'Fast notes with search and pinned items.', 'A notes app with pinned notes', '#f0c84d'],
]

export default function Explore({ me, ws, credits, workspaces, onSwitchWs }) {
  const build = async p => {
    const a = await api('/api/apps', { method: 'POST', body: JSON.stringify({ prompt: p }) })
    location.hash = '#/app/' + a.id
  }
  return (
    <div className="shell">
      <Sidebar active="explore" me={me} ws={ws} credits={credits} workspaces={workspaces} onSwitchWs={onSwitchWs} />
      <div className="main">
        <div className="topbar"><b style={{ fontSize: 15 }}>Explore templates</b></div>
        <div className="content">
          <div className="grid">
            {TPLS.map(([n, d, p, c]) => (
              <div className="tpl" key={n}>
                <div className="card" onClick={() => build(p)} role="button">
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                    <span className="app-icon" style={{ background: c }}>{n[0]}</span><b>{n}</b>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--fg-muted)' }}>{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
