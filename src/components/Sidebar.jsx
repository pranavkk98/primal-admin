import { usePage } from '../context/RouterContext.jsx'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../lib/api.js'

const NAV = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: 'orders',
    label: 'Orders',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
  {
    id: 'products',
    label: 'Products',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    id: 'ads',
    label: 'Ads & Creative',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
  },
  {
    id: 'spend',
    label: 'Money & Burn',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 17l6-6 4 4 8-8M21 7h-5m5 0v5" />
      </svg>
    ),
  },
  {
    id: 'creators',
    label: 'T-REX Athletes',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
  {
    id: 'chat',
    label: 'AI Chat',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
]

export default function Sidebar() {
  const { page, navigate } = usePage()
  const { user, logout } = useAuth()
  const [requests, setRequests] = useState(0)

  // Pending creator requests badge (silent on failure)
  useEffect(() => {
    api.get('/api/admin/creators', { limit: 1 })
      .then((r) => setRequests(r?.counts?.applied ?? 0))
      .catch(() => {})
  }, [page])

  return (
    <aside className="w-56 flex-shrink-0 bg-ink-800 border-r border-bone/8 flex flex-col h-screen sticky top-0">
      {/* Wordmark */}
      <div className="px-5 py-5 border-b border-bone/8">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-primal flex items-center justify-center flex-shrink-0">
            <span className="font-display text-bone text-sm leading-none">P</span>
          </div>
          <div>
            <div className="font-display text-bone text-lg leading-none tracking-wider">PRIMAL</div>
            <div className="text-bone/30 text-[9px] tracking-[0.2em] uppercase mt-0.5">Admin</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(item => {
          const active = page === item.id
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-amber/10 text-amber border-l-2 border-amber -ml-px pl-[11px]'
                  : 'text-bone/55 hover:text-bone hover:bg-bone/5 border-l-2 border-transparent -ml-px pl-[11px]'
              }`}
            >
              <span className={active ? 'text-amber' : 'text-bone/40'}>{item.icon}</span>
              {item.label}
              {item.id === 'creators' && requests > 0 && (
                <span className="ml-auto text-[10px] bg-amber text-ink px-1.5 py-0.5 rounded-full font-semibold">{requests}</span>
              )}
              {item.id === 'chat' && (
                <span className="ml-auto text-[9px] bg-amber/20 text-amber px-1.5 py-0.5 rounded font-medium">AI</span>
              )}
            </button>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-bone/8">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-bone/5 transition group">
          <div className="w-7 h-7 rounded-full bg-gradient-primal flex items-center justify-center text-bone text-xs font-display flex-shrink-0">
            {user?.email?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-bone/70 text-xs truncate">{user?.name || user?.email || 'Admin'}</div>
          </div>
          <button
            onClick={logout}
            className="opacity-0 group-hover:opacity-100 transition text-bone/30 hover:text-bone/70"
            title="Sign out"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
