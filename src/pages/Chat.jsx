import { useState, useRef, useEffect } from 'react'
import { api } from '../lib/api.js'
import ChatMessage from '../components/ChatMessage.jsx'

const CHIPS = [
  'Top products this month',
  'Dormant customers',
  'Best spenders',
  'Daily revenue trend',
  'Churned customers',
  'Average order value',
]

const WELCOME = {
  id: 'welcome',
  role: 'assistant',
  content: '',
  data: {
    summary: 'Ask me anything about your Primal Nutrition data. I convert your questions into safe, read-only SQL queries and show you the results.',
    suggestions: CHIPS,
  },
}

export default function Chat() {
  const [messages, setMessages] = useState([WELCOME])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const send = async (text) => {
    const msg = (text || input).trim()
    if (!msg || sending) return
    setInput('')
    const userMsg = { id: Date.now().toString(), role: 'user', content: msg }
    setMessages(prev => [...prev, userMsg])
    setSending(true)

    try {
      const history = messages.filter(m => m.id !== 'welcome').slice(-8).map(m => ({
        role: m.role,
        content: m.role === 'user' ? m.content : (m.data?.summary || ''),
      }))
      const res = await api.post('/api/admin/chat', { message: msg, history })
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString() + '-a', role: 'assistant', content: '', data: res },
      ])
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString() + '-e',
          role: 'assistant',
          content: '',
          data: { summary: 'Something went wrong. Please try again.' },
        },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-48px)] max-h-[900px]">
      {/* Header */}
      <div className="mb-4">
        <h1 className="font-display text-3xl text-bone tracking-wide">AI Chat</h1>
        <p className="text-bone/40 text-sm mt-1">Natural language analytics · Read-only SQL · Instant results</p>
      </div>

      {/* Safety badge */}
      <div className="flex items-center gap-2 mb-4 bg-ink-800 border border-bone/8 rounded-lg px-4 py-2.5">
        <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span className="text-bone/50 text-xs">Read-only · Only SELECT queries allowed · All queries are audited</span>
      </div>

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto scrollbar-thin card p-4 space-y-4">
        {messages.map(m => <ChatMessage key={m.id} message={m} />)}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-ink-700 border border-bone/8 rounded-2xl rounded-tl-md px-4 py-3">
              <div className="flex gap-1.5 items-center">
                <div className="w-2 h-2 rounded-full bg-amber animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-amber animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-amber animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Chip suggestions */}
      {messages.length <= 2 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {CHIPS.map(chip => (
            <button
              key={chip}
              onClick={() => send(chip)}
              className="text-xs bg-ink-800 border border-bone/10 text-bone/60 hover:text-bone hover:border-amber/30 rounded-full px-3 py-1.5 transition"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Composer */}
      <div className="mt-3 flex gap-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
          }}
          placeholder="Ask about customers, orders, revenue, products… (Enter to send, Shift+Enter for newline)"
          rows={2}
          className="flex-1 bg-ink-800 border border-bone/10 rounded-xl px-4 py-3 text-sm text-bone placeholder-bone/30 focus:outline-none focus:border-amber/40 transition resize-none"
          disabled={sending}
        />
        <button
          onClick={() => send()}
          disabled={sending || !input.trim()}
          className="btn-primary !px-4 self-end disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          <span className="hidden sm:inline">Send</span>
        </button>
      </div>
    </div>
  )
}
