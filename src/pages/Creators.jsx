import { useEffect, useState, useCallback } from 'react'
import { api } from '../lib/api.js'
import { relativeDate, shortDate } from '../lib/format.js'
import DataTable from '../components/DataTable.jsx'

// T-REX Athletes barter pipeline, in the order a creator moves through it.
const STATUSES = [
  { id: 'new', label: 'New', cls: 'bg-bone/10 text-bone/70' },
  { id: 'contacted', label: 'Contacted', cls: 'bg-blue-500/15 text-blue-400' },
  { id: 'replied', label: 'Replied', cls: 'bg-purple-500/15 text-purple-400' },
  { id: 'applied', label: 'Applied', cls: 'bg-amber/15 text-amber' },
  { id: 'approved', label: 'Approved', cls: 'bg-teal-500/15 text-teal-400' },
  { id: 'shipped', label: 'Shipped', cls: 'bg-sky-500/15 text-sky-400' },
  { id: 'posted', label: 'Posted', cls: 'bg-green-500/15 text-green-400' },
  { id: 'rejected', label: 'Rejected', cls: 'bg-red-500/10 text-red-400' },
  { id: 'not_interested', label: 'Not interested', cls: 'bg-bone/5 text-bone/40' },
]
const STATUS_BY_ID = Object.fromEntries(STATUSES.map((s) => [s.id, s]))
const SOURCE_LABEL = { application: 'Applied on site', hashtag: 'Hashtag hunt', mention: 'Tagged us', comment: 'Commented', customer: 'Customer', manual: 'Added by team' }

const igUrl = (h) => `https://www.instagram.com/${h}/`
const fmtNum = (n) => (n == null ? '—' : n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n))

// ── WhatsApp pre-drafted messages ──
function waPhone(phone) {
  const d = String(phone ?? '').replace(/\D/g, '')
  return d.length >= 10 ? '91' + d.slice(-10) : null
}
const firstName = (c) => String(c.name || '').trim().split(/\s+/)[0] || 'there'
const sportWord = (c) => String(c.sport || '').replace(/\s*\/\s*Strength/i, '').trim().toLowerCase() || 'training'
const addressLine = (c) =>
  [c.address_line1, c.address_line2, [c.city, c.state].filter(Boolean).join(', ') + (c.pincode ? ` – ${c.pincode}` : '')]
    .filter((x) => x && x.trim()).join(', ')

export const MESSAGES = {
  approval: (c) =>
    `Hi ${firstName(c)} 👋\n\nThis is Team Primal Nutrition. We loved your application for T-REX Athletes, and we'd love to have you in the pack! 🦖\n\nHere's how it works:\n• We send you a T-REX 500 ml bottle, free, to your door\n• Within 14 days of delivery, you post 1 Reel + 2 Stories with T-REX in your real ${sportWord(c)} routine\n• Tag @primalnutritiontrex and mark it as a Paid partnership (or add #ad)\n• Share your honest experience. Please don't make health or medical claims\n\nYour delivery address:\n${addressLine(c)}\n\nReply YES to confirm and we'll ship it out. 💪\n\nTeam Primal Nutrition`,
  moreInfo: (c) =>
    `Hi ${firstName(c)} 👋 Thanks for applying to T-REX Athletes! Could you share a little more about your training and the kind of content you post? A link to a recent Reel you're proud of would be perfect.`,
  decline: (c) =>
    `Hi ${firstName(c)}, thank you for applying to T-REX Athletes 🙏 We can't onboard you right now, but we'll keep your profile and reach out when a spot opens up. Keep training hard! 💪`,
  shipped: (c) =>
    `Hi ${firstName(c)}! Your T-REX is on the way 🦖 Can't wait to see it in your routine. Remember to tag @primalnutritiontrex and mark the post as a Paid partnership.`,
  reminder: (c) =>
    `Hi ${firstName(c)}, hope you're enjoying T-REX! 💪 Just a gentle reminder about your Reel and 2 Stories. Tag @primalnutritiontrex and mark them as a Paid partnership. Let us know if you need anything.`,
  thanks: (c) =>
    `Hi ${firstName(c)}, your post looks amazing 🔥 Thank you for being a T-REX Athlete! We may reshare it on our page, with credit to you.`,
  intro: (c) =>
    `Hi ${firstName(c)} 👋 We're Primal Nutrition, the team behind T-REX. We've been following your ${sportWord(c)} content and love how consistent you are. We're building T-REX Athletes, a community of everyday athletes, and we'd love to have you. Here's where to join: https://primalnutrition.in/#/athletes`,
}

const waLink = (c, text) => `https://wa.me/${waPhone(c.phone)}?text=${encodeURIComponent(text)}`
const DAY = 86400000

// The one WhatsApp action that fits a creator's current stage (null = none).
function stageAction(c) {
  switch (c.status) {
    case 'applied': return { label: 'WhatsApp', message: 'approval' }
    case 'approved': return { label: 'WhatsApp: Confirm address', message: 'approval' }
    case 'shipped':
      return c.shipped_at && Date.now() - new Date(c.shipped_at).getTime() > 10 * DAY
        ? { label: 'WhatsApp: Gentle reminder', message: 'reminder' }
        : { label: "WhatsApp: It's on the way", message: 'shipped' }
    case 'posted': return { label: 'WhatsApp: Thank you', message: 'thanks' }
    case 'new':
    case 'contacted':
    case 'replied': return { label: 'WhatsApp: Intro', message: 'intro' }
    default: return null
  }
}

const WA_BTN = 'inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/25 hover:bg-green-500/25 transition disabled:opacity-50'
function WaIcon({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.4.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2z" />
    </svg>
  )
}

export default function Creators() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('applied')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)
  const [adding, setAdding] = useState(false)

  const fetchData = useCallback(() => {
    setLoading(true)
    api.get('/api/admin/creators', { page, limit: 50, status, search })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page, status, search])

  useEffect(() => {
    const t = setTimeout(fetchData, search ? 300 : 0)
    return () => clearTimeout(t)
  }, [fetchData, search])

  const onSaved = (row) => {
    setSelected(row)
    setData((d) => d && { ...d, data: d.data.map((r) => (r.id === row.id ? row : r)) })
  }

  // Open WhatsApp first (popup blockers), then log the touch.
  const openWa = (row, message, patch = {}) => {
    window.open(waLink(row, MESSAGES[message](row)), '_blank', 'noopener')
    api.patch(`/api/admin/creators/${row.id}`, { contacted: true, ...patch })
      .then((updated) => { onSaved(updated); fetchData() })
      .catch(console.error)
  }

  const total = data ? Object.values(data.counts).reduce((a, b) => a + b, 0) : 0
  const pages = data ? Math.max(1, Math.ceil(data.meta.total / data.meta.limit)) : 1

  const requestColumns = [
    {
      key: 'handle',
      header: 'Creator',
      render: (row) => (
        <div>
          <a href={igUrl(row.handle)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-bone text-sm hover:text-amber">@{row.handle}</a>
          <div className="text-bone/40 text-xs">{row.name || '—'}</div>
        </div>
      ),
    },
    { key: 'sport', header: 'Sport', render: (row) => <span className="text-bone/70 text-sm">{row.sport || '—'}</span> },
    { key: 'followers', header: 'Followers', render: (row) => <span className="text-bone text-sm font-semibold">{fmtNum(row.followers)}</span> },
    { key: 'city', header: 'City', render: (row) => <span className="text-bone/60 text-sm">{[row.city, row.state].filter(Boolean).join(', ') || '—'}</span> },
    {
      key: 'applied_at',
      header: 'Applied',
      render: (row) => (
        <div>
          <div className="text-bone/50 text-xs">{row.applied_at ? relativeDate(row.applied_at) : '—'}</div>
          <div className="text-bone/30 text-xs">{row.applied_at ? shortDate(row.applied_at) : ''}</div>
        </div>
      ),
    },
    {
      key: 'wa',
      header: '',
      render: (row) => waPhone(row.phone) ? (
        <button
          title="Review & WhatsApp"
          onClick={(e) => { e.stopPropagation(); setSelected(row) }}
          className="w-9 h-9 inline-flex items-center justify-center rounded-lg bg-green-500/15 text-green-400 border border-green-500/25 hover:bg-green-500/25 transition"
        >
          <WaIcon className="w-4 h-4" />
        </button>
      ) : <span className="text-bone/25 text-xs">no phone</span>,
    },
  ]

  const columns = status === 'applied' ? requestColumns : [
    {
      key: 'handle',
      header: 'Creator',
      render: (row) => (
        <div>
          <a href={igUrl(row.handle)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-bone text-sm hover:text-amber">@{row.handle}</a>
          <div className="text-bone/40 text-xs">{row.name || '—'}</div>
        </div>
      ),
    },
    { key: 'sport', header: 'Sport', render: (row) => <span className="text-bone/70 text-sm">{row.sport || '—'}</span> },
    {
      key: 'followers',
      header: 'Followers',
      render: (row) => (
        <div>
          <div className="text-bone text-sm font-semibold">{fmtNum(row.followers)}</div>
          {row.engagement_rate != null && <div className="text-bone/40 text-xs">{row.engagement_rate}% eng.</div>}
        </div>
      ),
    },
    { key: 'city', header: 'City', render: (row) => <span className="text-bone/60 text-sm">{row.city || '—'}</span> },
    { key: 'source', header: 'Source', render: (row) => <span className="text-bone/50 text-xs">{SOURCE_LABEL[row.source] || row.source}</span> },
    { key: 'status', header: 'Status', render: (row) => <StatusChip status={row.status} /> },
    {
      key: 'last_contacted_at',
      header: 'Last contact',
      render: (row) => (
        <div>
          <div className="text-bone/50 text-xs">{row.last_contacted_at ? relativeDate(row.last_contacted_at) : 'Never'}</div>
          {row.contact_count > 0 && <div className="text-bone/30 text-xs">{row.contact_count}× touched</div>}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-bone tracking-wide">Creator Requests</h1>
          <p className="text-bone/40 text-sm mt-1">
            {data ? `${data.counts.applied ?? 0} new requests · ${total} creators in the pipeline · applications from primalnutrition.in/#/athletes` : 'Loading…'}
          </p>
        </div>
        <button onClick={() => setAdding(true)} className="btn-primary !px-4 !py-2 text-xs">+ Add creator</button>
      </div>

      {/* Pipeline */}
      <div className="flex gap-1.5 flex-wrap">
        <FilterBtn active={status === 'applied'} highlight={(data?.counts?.applied ?? 0) > 0} onClick={() => { setStatus('applied'); setPage(1) }}>
          Requests · {data?.counts?.applied ?? 0}
        </FilterBtn>
        <FilterBtn active={status === ''} onClick={() => { setStatus(''); setPage(1) }}>All · {total}</FilterBtn>
        {STATUSES.filter((s) => s.id !== 'applied').map((s) => (
          <FilterBtn key={s.id} active={status === s.id} onClick={() => { setStatus(s.id); setPage(1) }}>
            {s.label} · {data?.counts?.[s.id] ?? 0}
          </FilterBtn>
        ))}
      </div>

      <input
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        placeholder="Search handle, name or city…"
        className="w-full sm:w-80 bg-ink-800 border border-bone/10 rounded-lg px-3 py-2 text-sm text-bone placeholder:text-bone/30 focus:outline-none focus:border-amber/40"
      />

      <DataTable
        columns={columns}
        rows={data?.data}
        loading={loading}
        onRowClick={(row) => setSelected(row)}
        emptyTitle={status === 'applied' ? 'No new requests' : 'No creators here'}
        emptyDescription={status === 'applied' ? 'New applications from primalnutrition.in/#/athletes will appear here' : 'Applications from the website and the daily hunt will appear here'}
        keyFn={(r) => r.id}
      />

      {data && pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-bone/40 text-xs">Page {page} of {pages} · {data.meta.total} total</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost !px-3 !py-1.5 text-xs disabled:opacity-40">Previous</button>
            <button onClick={() => setPage((p) => p + 1)} disabled={page >= pages} className="btn-ghost !px-3 !py-1.5 text-xs disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      {selected && <CreatorDrawer creator={selected} onClose={() => setSelected(null)} onSaved={onSaved} openWa={openWa} />}
      {adding && <AddCreator onClose={() => setAdding(false)} onAdded={() => { setAdding(false); fetchData() }} />}
    </div>
  )
}

function FilterBtn({ active, highlight, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
        active ? 'bg-amber/15 text-amber border border-amber/30'
          : highlight ? 'bg-amber/10 text-amber border border-amber/25 hover:bg-amber/20'
          : 'bg-ink-800 border border-bone/10 text-bone/55 hover:text-bone'
      }`}
    >
      {children}
    </button>
  )
}

function StatusChip({ status }) {
  const s = STATUS_BY_ID[status] || { label: status, cls: 'bg-bone/10 text-bone/60' }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${s.cls}`}>{s.label}</span>
}

function CreatorDrawer({ creator, onClose, onSaved, openWa }) {
  const [notes, setNotes] = useState(creator.notes || '')
  const [saving, setSaving] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => { setNotes(creator.notes || '') }, [creator.id, creator.notes])
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const save = async (key, body) => {
    setSaving(key)
    setError(null)
    try {
      onSaved(await api.patch(`/api/admin/creators/${creator.id}`, body))
    } catch (err) {
      setError(err?.body?.message || err.message || 'Failed to save')
    } finally {
      setSaving(null)
    }
  }

  const c = creator
  const hasPhone = !!waPhone(c.phone)
  const action = stageAction(c)
  const [declined, setDeclined] = useState(false)
  const address = [c.address_line1, c.address_line2, [c.city, c.state].filter(Boolean).join(', '), c.pincode].filter(Boolean)

  return (
    <>
      <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-ink-800 border-l border-bone/10 z-50 flex flex-col animate-slide-in overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-bone/8">
          <span className="text-xs font-medium text-bone/40 uppercase tracking-[0.15em]">Creator</span>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-bone/40 hover:text-bone hover:bg-bone/8 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <a href={igUrl(c.handle)} target="_blank" rel="noreferrer" className="font-display text-2xl text-bone tracking-wide hover:text-amber">@{c.handle}</a>
              <StatusChip status={c.status} />
            </div>
            <div className="text-bone/40 text-xs">
              {c.name || 'No name yet'} · {SOURCE_LABEL[c.source] || c.source} · added {shortDate(c.created_at)}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Stat label="Followers" value={fmtNum(c.followers)} />
            <Stat label="Engagement" value={c.engagement_rate != null ? `${c.engagement_rate}%` : '—'} />
            <Stat label="Touches" value={c.contact_count ?? 0} />
          </div>

          {/* Quick links */}
          <div className="flex flex-wrap gap-2">
            <a href={igUrl(c.handle)} target="_blank" rel="noreferrer" className="btn-ghost !px-3 !py-1.5 text-xs">Open Instagram</a>
            {c.email && <a href={`mailto:${c.email}`} className="btn-ghost !px-3 !py-1.5 text-xs">Email</a>}
            {c.content_url && <a href={c.content_url} target="_blank" rel="noreferrer" className="btn-ghost !px-3 !py-1.5 text-xs text-amber">Their post</a>}
          </div>

          {/* Review (new requests) */}
          {c.status === 'applied' && (
            <div className="bg-amber/[0.06] border border-amber/25 rounded-xl p-3">
              <div className="text-[10px] font-medium text-amber/80 uppercase tracking-[0.15em] mb-2.5">Review request</div>
              {hasPhone ? (
                <div className="flex flex-wrap gap-2">
                  <button disabled={!!saving} onClick={() => openWa(c, 'approval', { status: 'approved' })} className={WA_BTN}>
                    <WaIcon /> Approve &amp; WhatsApp
                  </button>
                  <button disabled={!!saving} onClick={() => openWa(c, 'moreInfo')} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg text-xs font-medium border border-bone/15 text-bone/70 hover:text-bone hover:border-bone/30 transition">
                    Ask for details
                  </button>
                  <button disabled={!!saving} onClick={() => { setDeclined(true); save('rejected', { status: 'rejected' }) }} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition">
                    Decline
                  </button>
                </div>
              ) : (
                <div className="text-bone/50 text-xs">
                  No WhatsApp number{c.email ? <> · <a className="text-amber hover:underline" href={`mailto:${c.email}`}>Email instead</a></> : null}
                </div>
              )}
              <p className="text-bone/35 text-[11px] mt-2">WhatsApp opens with the message ready. You only press Send.</p>
            </div>
          )}

          {/* Declined: offer the polite note */}
          {declined && c.status === 'rejected' && hasPhone && (
            <button onClick={() => openWa(c, 'decline')} className={WA_BTN}>
              <WaIcon /> Send polite note on WhatsApp
            </button>
          )}

          {/* Stage WhatsApp (everything except new requests, which use Review above) */}
          {c.status !== 'applied' && action && (
            hasPhone ? (
              <button onClick={() => openWa(c, action.message)} className={WA_BTN}>
                <WaIcon /> {action.label}
              </button>
            ) : (
              <div className="text-bone/45 text-xs">No WhatsApp number{c.email ? <> · <a className="text-amber hover:underline" href={`mailto:${c.email}`}>Email instead</a></> : null}</div>
            )
          )}

          {/* Status */}
          <div className="bg-ink-700 border border-bone/8 rounded-xl p-3">
            <div className="text-[10px] font-medium text-bone/35 uppercase tracking-[0.15em] mb-2.5">Move to</div>
            <div className="flex flex-wrap gap-1.5">
              {STATUSES.filter((s) => s.id !== c.status).map((s) => (
                <button key={s.id} disabled={!!saving} onClick={() => save(s.id, { status: s.id })} className="px-2.5 py-1 rounded-lg text-xs border border-bone/10 text-bone/65 hover:text-bone hover:border-bone/25 disabled:opacity-50">
                  {saving === s.id ? '…' : s.label}
                </button>
              ))}
            </div>
            <button disabled={!!saving} onClick={() => save('contacted', { contacted: true })} className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber/10 text-amber border border-amber/20 hover:bg-amber/20 disabled:opacity-50">
              {saving === 'contacted' ? 'Saving…' : 'Log outreach sent'}
            </button>
            {c.last_contacted_at && <span className="ml-2 text-bone/35 text-xs">last {relativeDate(c.last_contacted_at)}</span>}
            {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
          </div>

          {c.pitch && (
            <Section title="Outreach message">
              <p className="text-bone/70 text-sm leading-relaxed whitespace-pre-line">{c.pitch}</p>
              <button onClick={() => navigator.clipboard?.writeText(c.pitch)} className="mt-2 text-amber text-xs hover:underline">Copy message</button>
            </Section>
          )}

          <Section title="Details">
            <Row label="Sport" value={c.sport} />
            <Row label="Email" value={c.email} />
            <Row label="Phone" value={c.phone} />
            <Row label="Found via" value={c.found_via} />
            {c.applied_at && <Row label="Applied" value={shortDate(c.applied_at)} />}
            {c.shipped_at && <Row label="Shipped" value={shortDate(c.shipped_at)} />}
            {c.posted_at && <Row label="Posted" value={shortDate(c.posted_at)} />}
          </Section>

          {address.length > 0 && (
            <Section title="Delivery address">
              <div className="text-bone/60 text-xs leading-relaxed">{address.map((l) => <div key={l}>{l}</div>)}</div>
            </Section>
          )}

          {c.why_us && (
            <Section title="Why T-REX (their words)">
              <p className="text-bone/60 text-sm leading-relaxed">{c.why_us}</p>
            </Section>
          )}

          <Section title="Notes">
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-ink border border-bone/10 rounded-lg px-3 py-2 text-sm text-bone focus:outline-none focus:border-amber/40"
              placeholder="Size, flavour, follow-up notes…"
            />
            <button disabled={!!saving || notes === (c.notes || '')} onClick={() => save('notes', { notes })} className="mt-2 btn-ghost !px-3 !py-1.5 text-xs disabled:opacity-40">
              {saving === 'notes' ? 'Saving…' : 'Save notes'}
            </button>
          </Section>
        </div>
      </div>
    </>
  )
}

function AddCreator({ onClose, onAdded }) {
  const [form, setForm] = useState({ handle: '', sport: '', followers: '', city: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const body = { handle: form.handle, source: 'manual' }
      if (form.sport) body.sport = form.sport
      if (form.followers) body.followers = Number(form.followers)
      if (form.city) body.city = form.city
      if (form.notes) body.notes = form.notes
      const res = await api.post('/api/admin/creators', body)
      if (res.added === 0) setError('This handle is already in the tracker.')
      else onAdded()
    } catch (err) {
      setError(err?.body?.message || err.message || 'Failed to add')
    } finally {
      setSaving(false)
    }
  }

  const input = 'w-full bg-ink border border-bone/10 rounded-lg px-3 py-2 text-sm text-bone placeholder:text-bone/30 focus:outline-none focus:border-amber/40'
  return (
    <>
      <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-40" onClick={onClose} />
      <form onSubmit={submit} className="fixed left-1/2 top-24 -translate-x-1/2 w-[92vw] max-w-sm bg-ink-800 border border-bone/10 rounded-2xl p-5 z-50 space-y-3">
        <div className="text-xs font-medium text-bone/40 uppercase tracking-[0.15em]">Add creator</div>
        <input required value={form.handle} onChange={update('handle')} placeholder="@handle or Instagram link" className={input} autoFocus />
        <div className="grid grid-cols-2 gap-2">
          <input value={form.sport} onChange={update('sport')} placeholder="Sport" className={input} />
          <input value={form.followers} onChange={update('followers')} placeholder="Followers" inputMode="numeric" className={input} />
        </div>
        <input value={form.city} onChange={update('city')} placeholder="City" className={input} />
        <textarea value={form.notes} onChange={update('notes')} rows={2} placeholder="Notes" className={input} />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn-ghost !px-3 !py-1.5 text-xs">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary !px-4 !py-1.5 text-xs disabled:opacity-50">{saving ? 'Adding…' : 'Add'}</button>
        </div>
      </form>
    </>
  )
}

function Stat({ label, value }) {
  return (
    <div className="bg-ink-700 border border-bone/8 rounded-lg p-3 text-center">
      <div className="text-bone font-semibold">{value}</div>
      <div className="text-bone/40 text-[10px] uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <h4 className="text-xs font-medium text-bone/40 uppercase tracking-[0.15em] mb-2">{title}</h4>
      <div className="card p-4 space-y-2">{children}</div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-bone/50">{label}</span>
      <span className="text-bone/80 text-right truncate">{value || '—'}</span>
    </div>
  )
}
