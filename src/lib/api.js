let _sessionAccessor = null
export function setSessionAccessor(fn) { _sessionAccessor = fn }

async function getToken() {
  if (_sessionAccessor) {
    const session = await _sessionAccessor()
    return session?.access_token || null
  }
  return null
}

function buildUrl(path, query) {
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  const url = new URL(path, base)
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
    })
  }
  return url.toString()
}

async function request(path, options = {}, query) {
  const token = await getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }

  const url = buildUrl(path, query)
  const res = await fetch(url, { ...options, headers })

  if (!res.ok) {
    let errBody
    try { errBody = await res.json() } catch { errBody = { message: res.statusText } }
    const err = new Error(errBody.message || `HTTP ${res.status}`)
    err.status = res.status
    err.body = errBody
    throw err
  }

  return res.json()
}

export const api = {
  get:   (path, query) => request(path, { method: 'GET' }, query),
  post:  (path, body)  => request(path, { method: 'POST',  body: JSON.stringify(body) }),
  patch: (path, body)  => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
}
