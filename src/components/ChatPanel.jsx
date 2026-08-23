import { useState, useRef, useEffect } from 'react'
import { api } from '../lib/api.js'
import ChatMessage from './ChatMessage.jsx'
import { usePage } from '../context/RouterContext.jsx'

const CHIPS = ['Top products', 'Dormant customers', 'Best spenders', 'Revenue this month']

export default function ChatPanel() {
  const { navigate } = usePage()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: '',
      data: {
        summary: 'Ask me anything about your Primal Nutrition data.',
        suggestions: CHIPS,
        latencyMs: null,
      },
    },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const send = async (text) => {
    const msg = (text || input).trim()
    if (!msg || sending) return
    setInput('')
    const userMsg = { id: Date.now().toString(), role: 'user', content: msg }
    setMessages(prev => [...prev, userMsg])
    setSending(true)
    try {
      const history = messages.filter(m => m.role !== 'assistant' || m.id !== 'welcome').slice(-6).map(m => ({
        role: m.role,
        content: m.role === 'user' ? m.content : (m.data?.summary || ''),
      }))
      const res = await api.post('/api/admin/chat', { message: msg, history })
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString() + '-a', role: 'assistant', content: '', data: res },
      ])
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString() + '-e', role: 'assistant', content: '', data: { summary: 'Something went wrong. Please try again.' } },
      ])
    } finally {
      setSending(false)
    }
  }

  const recentMessages = messages.slice(-6)

  return (
    <div className="fixed bottom-5 right-5 z-30">
      {/* Expanded panel */}
      {open && (
        <div className="mb-3 w-[380px] h-[520px] bg-ink-800 border border-bone/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-up">
          {/* Panel header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b border-bone/8 cursor-pointer hover:bg-bone/3 transition"
            onClick={() => { navigate('chat'); setOpen(false) }}
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-primal flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-bone" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-bone text-sm font-semibold">Primal AI</span>
              <span className="text-bone/30 text-xs">· Open full chat ↗</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false) }}
              className="w-6 h-6 flex items-center justify-center text-bone/30 hover:text-bone/70 transition"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3">
            {recentMessages.map(m => <ChatMessage key={m.id} message={m} />)}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-ink-700 border border-bone/8 rounded-2xl rounded-tl-md px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Chips */}
          {messages.length <= 2 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {CHIPS.map(chip => (
                <button
                  key={chip}
                  onClick={() => send(chip)}
                  className="text-xs bg-ink-700 border border-bone/10 text-bone/60 hover:text-bone hover:border-amber/30 rounded-full px-3 py-1 transition"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Composer */}
          <div className="p-3 border-t border-bone/8 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Ask about your data…"
              className="flex-1 bg-ink-700 border border-bone/10 rounded-lg px-3 py-2 text-sm text-bone placeholder-bone/30 focus:outline-none focus:border-amber/40 transition"
              disabled={sending}
            />
            <button
              onClick={() => send()}
              disabled={sending || !input.trim()}
              className="btn-primary !px-3 !py-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <div className="flex justify-end">
        <button
          onClick={() => setOpen(!open)}
          className="w-14 h-14 rounded-full bg-gradient-primal shadow-lg shadow-amber/30 flex items-center justify-center hover:scale-105 transition-transform active:scale-95"
          aria-label="Open AI chat"
        >
          {open ? (
            <svg className="w-6 h-6 text-bone" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-bone" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
