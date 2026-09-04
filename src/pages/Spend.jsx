import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { api } from '../lib/api.js'
import { formatINR, formatINRShort, formatRoas, chartDate, shortDate } from '../lib/format.js'
import KpiCard from '../components/KpiCard.jsx'
import VerdictPill from '../components/VerdictPill.jsx'
import EmptyState from '../components/EmptyState.jsx'

const WINDOWS = [
  { days: 7, label: '7D' },
  { days: 14, label: '14D' },
  { days: 30, label: '30D' },
  { days: 90, label: '90D' },
]

/**
 * Freshness banner. The tracker pushes from a scheduled local run, so the only
 * thing worse than stale numbers is stale numbers that look current.
 */
function SyncBanner({ sync }) {
  if (!sync) return null
  const tone = sync.stale
    ? 'border-red-400/30 text-red-400'
    : 'border-bone/8 text-bone/40'
  return (
    <div className={`card px-4 py-2.5 flex items-center gap-2.5 ${tone}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${sync.stale ? 'bg-red-400' : 'bg-green-400'}`} />
      <span className="text-xs">{sync.message}</span>
      {sync.fetchedAt && (
        <span className="text-[10px] text-bone/25 ml-auto tabular-nums">
          last fetch {new Date(sync.fetchedAt).toLocaleString('en-IN')}
        </span>
      )}
    </div>
  )
}

function BurnTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload ?? {}
  return (
    <div className="bg-ink-700 border border-bone/10 rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="text-bone/50 mb-1">{chartDate(label)}</div>
      <div className="text-bone font-semibold tabular-nums">{formatINR(d.spend)}</div>
      {d.hasData ? (
        <div className="text-bone/45 mt-0.5 tabular-nums">
          {d.purchases} purchase{d.purchases === 1 ? '' : 's'}
          {d.roas ? ` · ${formatRoas(d.roas)}` : ''}
        </div>
      ) : (
        <div className="text-bone/30 mt-0.5">no delivery</div>
      )}
    </div>
  )
}

function BurnChart({ series, loading }) {
  if (loading) {
    return (
      <div className="card p-5">
        <div className="h-5 w-32 bg-bone/8 rounded mb-4 animate-pulse" />
        <div className="h-56 bg-bone/4 rounded animate-pulse" />
      </div>
    )
  }
  if (!series.length) {
    return (
      <div className="card p-5">
        <EmptyState title="No spend in this window" description="Nothing was delivered over the selected period." />
      </div>
    )
  }

  return (
    <div className="card p-5">
      <h3 className="text-xs font-medium text-bone/40 uppercase tracking-[0.15em] mb-4">
        Daily spend
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={series} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(245,241,232,0.05)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={chartDate}
            tick={{ fill: 'rgba(245,241,232,0.35)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            tickFormatter={(v) => (v >= 1000 ? `₹${(v / 1000).toFixed(1)}K` : `₹${v}`)}
            tick={{ fill: 'rgba(245,241,232,0.35)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip content={<BurnTooltip />} cursor={{ fill: 'rgba(245,241,232,0.04)' }} />
          <Bar dataKey="spend" radius={[3, 3, 0, 0]}>
            {series.map((s) => (
              // Days that converted are shown in brand red; days that spent
              // without a purchase stay muted, so a run of flat bars reads as
              // a problem rather than as ordinary activity.
              <Cell
                key={s.date}
                fill={s.purchases ? 'rgb(236,30,39)' : 'rgba(245,241,232,0.18)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function UpdateEntry({ e }) {
  const up = e.spendDelta !== null && e.spendDelta > 0
  return (
    <div className="card p-4 flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <span className="text-bone font-medium text-sm">{shortDate(e.date)}</span>
        <div className="flex items-center gap-3 text-xs tabular-nums">
          <span className="text-bone/70">{formatINR(e.spend)}</span>
          {e.spendDelta !== null && (
            <span className={up ? 'text-red-400' : 'text-green-400'}>
              {up ? '+' : ''}{e.spendDelta}%
            </span>
          )}
          <span className="text-bone/40">{e.purchases} purch</span>
          {e.roas !== null && <span className="text-bone/40">{formatRoas(e.roas)}</span>}
        </div>
      </div>

      <p className="text-bone/70 text-sm leading-relaxed">{e.headline}</p>

      {e.topCreative && (
        <p className="text-[11px] text-bone/35">
          Most spend: {e.topCreative.name || e.topCreative.creativeId} · {formatINRShort(e.topCreative.spend)}
        </p>
      )}

      {e.verdicts.length > 0 && (
        <div className="flex flex-col gap-1.5 pt-1 border-t border-bone/8">
          {e.verdicts.map((v) => (
            <div key={v.creativeId} className="flex items-start gap-2">
              <VerdictPill verdict={v.verdict} />
              <span className="text-[11px] text-bone/45 leading-relaxed">
                {v.name || v.creativeId} — {v.reason}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Spend() {
  const [days, setDays] = useState(30)
  const [burn, setBurn] = useState(null)
  const [updates, setUpdates] = useState([])
  const [sync, setSync] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      api.get('/api/admin/ads/burn', { days }),
      api.get('/api/admin/ads/updates', { days: Math.min(days, 30) }),
      api.get('/api/admin/ads/sync-status'),
    ])
      .then(([b, u, s]) => {
        setBurn(b)
        setUpdates(u.entries || [])
        setSync(s)
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [days])

  const b = burn?.burn ?? {}
  const t = burn?.totals ?? {}

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl text-bone tracking-wide">Money &amp; Burn</h1>
          <p className="text-bone/40 text-sm mt-1">
            Meta account 59417226 · daily spend and what moved
          </p>
        </div>
        <div className="flex gap-1 bg-ink-800 border border-bone/8 rounded-lg p-1">
          {WINDOWS.map((w) => (
            <button
              key={w.days}
              onClick={() => setDays(w.days)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                days === w.days ? 'bg-amber/15 text-amber' : 'text-bone/50 hover:text-bone'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="card p-4 border-red/30">
          <p className="text-red-400 text-sm font-medium">Couldn’t load spend data</p>
          <p className="text-bone/50 text-xs mt-1">{error.message}</p>
        </div>
      )}

      <SyncBanner sync={sync} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          [0, 1, 2, 3].map((i) => (
            <div key={i} className="card p-5 h-[104px] animate-pulse">
              <div className="h-3 w-20 bg-bone/8 rounded mb-3" />
              <div className="h-7 w-24 bg-bone/8 rounded" />
            </div>
          ))
        ) : (
          <>
            <KpiCard
              label="Today"
              value={formatINR(b.today)}
              sub={b.todayHasData ? 'delivering' : 'no delivery recorded yet'}
              accent
            />
            <KpiCard label="Yesterday" value={formatINR(b.yesterday)} />
            <KpiCard
              label="7-day average"
              value={b.avg7 === null ? '—' : formatINR(b.avg7)}
              sub="days with delivery only"
            />
            <KpiCard
              label="30-day run rate"
              value={b.projected30 === null ? '—' : formatINRShort(b.projected30)}
              sub="7-day average × 30"
            />
          </>
        )}
      </div>

      {/* Budgets are not stored anywhere, so pacing cannot be shown. Say why
          rather than leaving an unexplained absence. */}
      {burn?.budgetReason && (
        <p className="text-[11px] text-bone/30 leading-relaxed -mt-2">
          No pacing or runway shown: {burn.budgetReason}
        </p>
      )}

      <BurnChart series={burn?.series ?? []} loading={loading} />

      {!loading && burn && (
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-xs text-bone/45 px-1">
          <span>Window spend <span className="text-bone/70 tabular-nums">{formatINR(t.spend)}</span></span>
          <span>Purchases <span className="text-bone/70 tabular-nums">{t.purchases}</span></span>
          <span>Revenue <span className="text-bone/70 tabular-nums">{formatINR(t.revenue)}</span></span>
          <span>Days delivering <span className="text-bone/70 tabular-nums">{t.daysWithDelivery} / {days}</span></span>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="font-display text-xl text-bone tracking-wide">Daily updates</h2>
        {loading ? (
          [0, 1, 2].map((i) => (
            <div key={i} className="card p-4 h-24 animate-pulse">
              <div className="h-3 w-24 bg-bone/8 rounded mb-3" />
              <div className="h-3 w-2/3 bg-bone/8 rounded" />
            </div>
          ))
        ) : updates.length ? (
          updates.map((e) => <UpdateEntry key={e.date} e={e} />)
        ) : (
          <EmptyState
            title="No activity yet"
            description="Nothing has been delivered in this window."
          />
        )}
      </div>
    </div>
  )
}
