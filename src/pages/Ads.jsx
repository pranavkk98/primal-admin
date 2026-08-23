import { useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import {
  formatINR, formatINRShort, formatRoas, formatPct, formatDelta,
  getConfidenceConfig, getEvidenceConfig,
} from '../lib/format.js'
import KpiCard from '../components/KpiCard.jsx'
import VerdictPill from '../components/VerdictPill.jsx'
import EmptyState from '../components/EmptyState.jsx'

const WINDOWS = [7, 30]

const DIMENSIONS = [
  { id: 'hook_type', label: 'Hook' },
  { id: 'angle', label: 'Angle' },
  { id: 'proof_element', label: 'Proof' },
  { id: 'visual_style', label: 'Visual' },
  { id: 'awareness_stage', label: 'Awareness' },
  { id: 'format', label: 'Format' },
  { id: 'product', label: 'Product' },
]

function Delta({ current, previous }) {
  const d = formatDelta(current, previous)
  if (!d) return null
  return (
    <span className={`ml-1.5 text-[10px] ${d.up ? 'text-green-400' : 'text-red-400'}`}>
      {d.label}
    </span>
  )
}

function Stat({ label, value, delta }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-bone font-medium tabular-nums">
        {value}
        {delta}
      </span>
      <span className="text-[10px] text-bone/35 uppercase tracking-[0.1em]">{label}</span>
    </div>
  )
}

function CreativeCard({ c }) {
  const conf = getConfidenceConfig(c.confidence)
  const ev = getEvidenceConfig(c.evidence)
  const m = c.metrics || {}
  const tags = c.tags || {}

  const chips = [tags.angle, tags.hookType, c.format, tags.visualStyle, tags.proofElement]
    .filter(Boolean)

  return (
    <div className={`card p-5 space-y-4 ${c.isLive ? '' : 'opacity-75'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {/* Ad name first: this is what the account is managed by. The hook is
              what the customer sees, so it goes underneath as context. */}
          {c.ads?.length > 0 && (
            <div className="text-[11px] text-bone/45 font-medium mb-1 truncate">
              {c.ads.length === 1
                ? c.ads[0].adName
                : `${c.ads[0].adName} +${c.ads.length - 1} more`}
            </div>
          )}
          <h3 className="text-bone font-semibold text-[15px] leading-snug">
            {c.hookText || c.name || c.creativeId}
          </h3>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                c.isLive ? 'bg-green-500/15 text-green-400' : 'bg-bone/10 text-bone-dark'
              }`}
              title={c.isLive
                ? 'At least one ad using this creative is delivering right now.'
                : 'Every ad using this creative is paused. It spent inside the window, so its history still counts — but it is not running.'}
            >
              {c.isLive ? 'Live' : 'Paused'}
            </span>
            <span className="text-bone/20">·</span>
            <span className={`text-[11px] ${conf.text}`} title={conf.title}>{conf.label}</span>
            <span className="text-bone/20">·</span>
            <span className={`text-[11px] ${ev.text}`} title={ev.title}>{ev.label}</span>
            <span className="text-bone/20">·</span>
            <span className="font-mono text-[10px] text-bone/30">{c.creativeId}</span>
          </div>
        </div>
        <VerdictPill verdict={c.verdict} />
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 py-3 hairline border-b border-bone/8">
        <Stat label="ROAS" value={formatRoas(m.roas)} />
        <Stat label="Spend" value={formatINRShort(m.spend)} />
        <Stat label="Purchases" value={m.purchases ?? 0} />
        <Stat label="CTR" value={formatPct(m.ctr)} />
        <Stat label="CPM" value={formatINR(m.cpm)} />
        <Stat label="Frequency" value={m.frequency ? m.frequency.toFixed(2) : '—'} />
      </div>

      {c.reason && <p className="text-[13px] text-bone/60 leading-relaxed">{c.reason}</p>}

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((t, i) => (
            <span key={i} className="text-[10px] bg-bone/5 border border-bone/8 rounded px-2 py-0.5 text-bone/45">
              {t}
            </span>
          ))}
          {tags.showsPrice && (
            <span className="text-[10px] border border-amber/35 rounded px-2 py-0.5 text-amber">
              shows price
            </span>
          )}
        </div>
      )}

      {c.notes && <p className="text-xs text-bone/35 italic leading-relaxed">{c.notes}</p>}
    </div>
  )
}

export default function Ads() {
  const [days, setDays] = useState(30)
  const [dimension, setDimension] = useState('hook_type')
  const [liveOnly, setLiveOnly] = useState(true)

  const [overview, setOverview] = useState(null)
  const [creatives, setCreatives] = useState([])
  const [rankings, setRankings] = useState([])
  const [testQueue, setTestQueue] = useState([])
  const [dataQuality, setDataQuality] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      api.get('/api/admin/ads/overview', { days }),
      api.get('/api/admin/ads/creatives', { days }),
      api.get('/api/admin/ads/test-queue'),
      api.get('/api/admin/ads/data-quality'),
    ])
      .then(([ov, cr, tq, dq]) => {
        setOverview(ov)
        setCreatives(cr.creatives || [])
        setTestQueue(tq.queue || [])
        setDataQuality(dq)
      })
      .catch(err => setError(err))
      .finally(() => setLoading(false))
  }, [days])

  useEffect(() => {
    api.get('/api/admin/ads/rankings', { days, dimension })
      .then(r => setRankings(r.rankings || []))
      .catch(() => setRankings([]))
  }, [days, dimension])

  const liveCount = creatives.filter(c => c.isLive).length
  const shown = liveOnly ? creatives.filter(c => c.isLive) : creatives

  const meta = overview?.meta || {}
  const prev = overview?.previous || {}
  const real = overview?.real || {}

  const kpis = overview ? [
    {
      label: `Spend — ${days}d`,
      value: formatINRShort(meta.spend),
      sub: `${meta.days ?? 0} days of delivery`,
      icon: '₹',
    },
    {
      label: 'Meta ROAS',
      value: formatRoas(meta.roas),
      sub: `${meta.purchases ?? 0} pixel purchases · gross`,
      accent: true,
      icon: '◎',
    },
    {
      label: 'Real ROAS',
      value: formatRoas(real.roas),
      sub: `${real.orders ?? 0} orders · net of refunds`,
      icon: '✓',
    },
    {
      label: 'Net revenue',
      value: formatINRShort(real.netRevenue),
      sub: `${real.lostOrders ?? 0} cancelled or refunded`,
      icon: '↗',
    },
  ] : Array(4).fill(null)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl text-bone tracking-wide">Ads &amp; Creative</h1>
          <p className="text-bone/40 text-sm mt-1">
            Meta account 59417226 · creative performance and verdicts
          </p>
        </div>
        <div className="flex gap-1 bg-ink-800 border border-bone/8 rounded-lg p-1">
          {WINDOWS.map(w => (
            <button
              key={w}
              onClick={() => setDays(w)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                days === w ? 'bg-amber/15 text-amber' : 'text-bone/50 hover:text-bone'
              }`}
            >
              {w} days
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="card p-4 border-red/30">
          <p className="text-red-400 text-sm font-medium">Couldn’t load ads data</p>
          <p className="text-bone/50 text-xs mt-1">{error.message}</p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i}>
            {loading || !kpi ? (
              <div className="card p-5 animate-pulse space-y-2">
                <div className="h-3 bg-bone/8 rounded w-24" />
                <div className="h-8 bg-bone/10 rounded w-20" />
                <div className="h-2 bg-bone/5 rounded w-32" />
              </div>
            ) : (
              <KpiCard {...kpi} />
            )}
          </div>
        ))}
      </div>

      {/* Why the two ROAS numbers differ — stated, not hidden. */}
      {!loading && overview && (
        <p className="text-xs text-bone/35 leading-relaxed -mt-2">
          <span className="text-bone/55">Meta ROAS</span> counts gross pixel-attributed
          purchases. <span className="text-bone/55">Real ROAS</span> uses net revenue from your
          own orders, with cancellations and refunds removed — it is the honest number.
          Profit ROAS is not shown: {overview.contributionRoasReason || 'no COGS loaded.'}
        </p>
      )}

      {/* Data quality */}
      {dataQuality?.issues?.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-bone/70">Data quality — {dataQuality.runDate}</h2>
          {dataQuality.issues.map(issue => (
            <div
              key={issue.id}
              className={`card p-3.5 border-l-2 ${
                issue.severity === 'warn' ? 'border-l-yellow-400' : 'border-l-blue-400'
              }`}
            >
              <span className="text-[11px] text-amber font-medium mr-2">{issue.check_name}</span>
              <span className="text-[13px] text-bone/60">{issue.detail}</span>
            </div>
          ))}
        </div>
      )}

      {/* Creative leaderboard */}
      <div>
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <h2 className="text-sm font-semibold text-bone/70">Creative leaderboard</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-bone/35">
              {liveCount} live · {creatives.length - liveCount} paused
            </span>
            <div className="flex gap-1 bg-ink-800 border border-bone/8 rounded-lg p-1">
              {[['Live', true], ['All', false]].map(([label, val]) => (
                <button
                  key={label}
                  onClick={() => setLiveOnly(val)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                    liveOnly === val ? 'bg-amber/15 text-amber' : 'text-bone/45 hover:text-bone/80'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card p-5 animate-pulse space-y-3">
                <div className="h-4 bg-bone/8 rounded w-64" />
                <div className="h-12 bg-bone/5 rounded" />
              </div>
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="card">
            <EmptyState
              icon="📊"
              title={liveOnly ? 'No live creatives with spend' : 'No creatives with spend'}
              description={liveOnly
                ? 'Nothing currently running delivered in this window. Switch to All to see paused creatives.'
                : 'Nothing delivered in this window. Try the 30-day view.'}
            />
          </div>
        ) : (
          <div className="space-y-3">
            {shown.map(c => <CreativeCard key={c.creativeId} c={c} />)}
          </div>
        )}
      </div>

      {/* Tag rankings */}
      <div>
        <div className="flex items-center justify-between mb-3 gap-4 flex-wrap">
          <h2 className="text-sm font-semibold text-bone/70">What works</h2>
          <div className="flex gap-1 flex-wrap">
            {DIMENSIONS.map(d => (
              <button
                key={d.id}
                onClick={() => setDimension(d.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                  dimension === d.id
                    ? 'bg-amber/15 text-amber'
                    : 'text-bone/45 hover:text-bone/80 hover:bg-bone/5'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="hairline">
                  {['Value', 'Creatives', 'Spend', 'ROAS', 'Purch', 'CTR', 'CPM'].map((h, i) => (
                    <th
                      key={h}
                      className={`px-5 py-3 text-xs font-medium text-bone/40 uppercase tracking-[0.1em] ${
                        i === 0 ? 'text-left' : 'text-right'
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-bone/5">
                {rankings.map(r => (
                  <tr key={r.value} className={r.thin ? 'opacity-50' : ''}>
                    <td className="px-5 py-3 text-bone/80">
                      {r.value}
                      {r.thin && (
                        <span
                          className="ml-2 text-[9px] text-yellow-400 border border-yellow-400/30 rounded px-1.5 py-0.5"
                          title="Rests on fewer than 2 creatives or under ₹1,000 spend — not enough to call a trend."
                        >
                          thin
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right text-bone/50 tabular-nums">{r.creatives}</td>
                    <td className="px-5 py-3 text-right text-bone/70 tabular-nums">{formatINRShort(r.spend)}</td>
                    <td className="px-5 py-3 text-right text-bone font-medium tabular-nums">{formatRoas(r.roas)}</td>
                    <td className="px-5 py-3 text-right text-bone/50 tabular-nums">{r.purchases}</td>
                    <td className="px-5 py-3 text-right text-bone/50 tabular-nums">{formatPct(r.ctr)}</td>
                    <td className="px-5 py-3 text-right text-bone/50 tabular-nums">{formatINR(r.cpm)}</td>
                  </tr>
                ))}
                {rankings.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-bone/35 text-sm">
                      No tagged spend in this window.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Test queue */}
      {testQueue.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-bone/70">What to make next</h2>
            <span className="text-xs text-bone/35">{testQueue.length} proposals</span>
          </div>
          <div className="space-y-2">
            {testQueue.map(t => (
              <div key={t.id} className="card p-4 flex gap-4">
                <div className="w-6 h-6 rounded-full bg-amber/10 text-amber flex items-center justify-center text-xs font-medium flex-shrink-0">
                  {t.priority}
                </div>
                <p className="text-[13px] text-bone/70 leading-relaxed">{t.hypothesis}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
