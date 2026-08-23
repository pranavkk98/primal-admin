import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { chartDate } from '../lib/format.js'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const value = payload[0]?.value ?? 0
  return (
    <div className="bg-ink-700 border border-bone/10 rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="text-bone/50 mb-1">{chartDate(label)}</div>
      <div className="text-bone font-semibold">
        ₹{value.toLocaleString('en-IN')}
      </div>
    </div>
  )
}

export default function RevenueChart({ data = [], loading = false }) {
  if (loading) {
    return (
      <div className="card p-5">
        <div className="h-5 w-32 bg-bone/8 rounded mb-4 animate-pulse" />
        <div className="h-52 bg-bone/4 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="card p-5">
      <h3 className="text-xs font-medium text-bone/40 uppercase tracking-[0.15em] mb-4">
        Revenue — Last 30 Days
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(245,241,232,0.05)" />
          <XAxis
            dataKey="date"
            tickFormatter={chartDate}
            tick={{ fill: 'rgba(245,241,232,0.35)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval={4}
          />
          <YAxis
            tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`}
            tick={{ fill: 'rgba(245,241,232,0.35)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="rgb(236,30,39)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: 'rgb(236,30,39)', stroke: 'rgb(20,20,20)', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
