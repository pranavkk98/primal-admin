import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const RouterContext = createContext(null)

const PAGES = new Set(['dashboard', 'customers', 'orders', 'products', 'ads', 'spend', 'chat', 'login'])

function readRoute() {
  if (typeof window === 'undefined') return { page: 'dashboard' }
  const segments = window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  const [head] = segments
  if (PAGES.has(head)) return { page: head }
  return { page: 'dashboard' }
}

function buildHash(route) {
  if (route.page === 'dashboard') return ''
  if (PAGES.has(route.page)) return `#/${route.page}`
  return ''
}

export function RouterProvider({ children }) {
  const [route, setRoute] = useState(readRoute)

  useEffect(() => {
    const onHash = () => setRoute(readRoute())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const navigate = useCallback((next, _params = {}, { scroll = true } = {}) => {
    const newRoute = PAGES.has(next) ? { page: next } : { page: 'dashboard' }
    const hash = buildHash(newRoute)
    const url = `${window.location.pathname}${window.location.search}${hash}`
    window.history.pushState(null, '', url)
    setRoute(newRoute)
    if (scroll) window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  return (
    <RouterContext.Provider value={{ ...route, navigate }}>
      {children}
    </RouterContext.Provider>
  )
}

export function usePage() {
  const ctx = useContext(RouterContext)
  if (!ctx) throw new Error('usePage must be used inside <RouterProvider>')
  return ctx
}
