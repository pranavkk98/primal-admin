import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="bg-ink-700 border border-bone/10 rounded-lg px-3 py-2 text-xs shadow-xl max-w-[180px]">
      <div className="text-bone font-semibold mb-1 truncate">{d?.name}</div>
      <div className="text-bone/60">Revenue: <span className="text-bone">₹{d?.revenue?.toLocaleString('en-IN')}</span></div>
      <div className="text-bone/60">Units: <span className="text-bone">{d?.qty}</span></div>
    </div>
  )
}

export default function TopProductsChart({ data = [], loading = false }) {
  if (loading) {
    return (
      <div className="card p-5">
        <div className="h-5 w-36 bg-bone/8 rounded mb-4 animate-pulse" />
        <div className="h-52 bg-bone/4 rounded animate-pulse" />
      </div>
    )
  }

  const chartData = data.slice(0, 5).map(p => ({
    name: p.name.length > 14 ? p.name.slice(0, 14) + '…' : p.name,
    fullName: p.name,
    revenue: p.revenue,
    qty: p.qty,
  }))

  return (
    <div className="card p-5">
      <h3 className="text-xs font-medium text-bone/40 uppercase tracking-[0.15em] mb-4">
        Top Products by Revenue
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(245,241,232,0.05)" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`}
            tick={{ fill: 'rgba(245,241,232,0.35)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: 'rgba(245,241,232,0.6)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={90}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(245,241,232,0.03)' }} />
          <Bar dataKey="revenue" radius={[0, 4, 4, 0]} maxBarSize={24}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={i === 0 ? 'rgb(236,30,39)' : `rgba(236,30,39,${0.7 - i * 0.1})`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
