// lib/api.js — token-aware fetch + session boot
export const LS_T = 'b44_token'
export const LS_WS = 'b44_ws'

export async function api(path, opts = {}) {
  const token = localStorage.getItem(LS_T)
  const res = await fetch(path, {
    ...opts,
    headers: Object.assign(
      { 'Content-Type': 'application/json' },
      token ? { Authorization: 'Bearer ' + token } : {},
      opts.headers || {},
    ),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const e = new Error(data.message || res.statusText || 'request failed')
    e.status = res.status; e.data = data
    throw e
  }
  return data
}

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
export const fmtAgo = ts => {
  const s = (Date.now() - ts * 1000) / 1000
  return s < 60 ? 'just now' : s < 3600 ? Math.round(s / 60) + 'm ago' : s < 86400 ? Math.round(s / 3600) + 'h ago' : Math.round(s / 86400) + 'd ago'
}
