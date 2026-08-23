import { useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import { formatINRShort, formatINR, relativeDate, shortDate } from '../lib/format.js'
import KpiCard from '../components/KpiCard.jsx'
import RevenueChart from '../components/RevenueChart.jsx'
import TopProductsChart from '../components/TopProductsChart.jsx'
import StatusPill from '../components/StatusPill.jsx'
import OrderDrawer from '../components/OrderDrawer.jsx'

export default function Dashboard() {
  const [overview, setOverview] = useState(null)
  const [timeseries, setTimeseries] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get('/api/admin/analytics/overview'),
      api.get('/api/admin/analytics/timeseries', { range: '30d', metric: 'revenue' }),
      api.get('/api/admin/analytics/top-products', { limit: 5 }),
      api.get('/api/admin/orders', { limit: 5, page: 1 }),
    ]).then(([ov, ts, tp, orders]) => {
      setOverview(ov)
      setTimeseries(ts.data || [])
      setTopProducts(tp.data || [])
      setRecentOrders(orders.data || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const kpis = overview ? [
    {
      label: 'Revenue — 30d',
      value: formatINRShort(overview.revenue?.month),
      sub: `Today ${formatINRShort(overview.revenue?.today)} · Week ${formatINRShort(overview.revenue?.week)}`,
      accent: true,
      icon: '₹',
    },
    {
      label: 'Orders — 30d',
      value: overview.orders?.month ?? '—',
      sub: `Today ${overview.orders?.today} · Week ${overview.orders?.week}`,
      icon: '🛍',
    },
    {
      label: 'Avg Order Value',
      value: formatINRShort(overview.aov?.month),
      sub: 'Last 30 days',
      icon: '📈',
    },
    {
      label: 'Active Customers',
      value: overview.customers?.active ?? '—',
      sub: `${overview.customers?.dormant ?? 0} dormant · ${overview.customers?.churned ?? 0} churned`,
      icon: '👥',
    },
  ] : Array(4).fill(null)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-display text-3xl text-bone tracking-wide">Dashboard</h1>
        <p className="text-bone/40 text-sm mt-1">Primal Nutrition · Analytics Overview</p>
      </div>

      {/* KPI cards */}
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

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-3">
          <RevenueChart data={timeseries} loading={loading} />
        </div>
        <div className="xl:col-span-2">
          <TopProductsChart data={topProducts} loading={loading} />
        </div>
      </div>

      {/* Recent orders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-bone/70">Recent Orders</h2>
        </div>
        <div className="card overflow-hidden">
          {loading ? (
            <div className="divide-y divide-bone/5 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4 px-5 py-3.5">
                  <div className="h-4 bg-bone/8 rounded w-28" />
                  <div className="h-4 bg-bone/6 rounded w-36" />
                  <div className="h-4 bg-bone/8 rounded w-20 ml-auto" />
                  <div className="h-4 bg-bone/6 rounded w-16" />
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="hairline">
                  {['Order', 'Customer', 'Total', 'Status', 'Date'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium text-bone/40 uppercase tracking-[0.1em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-bone/5">
                {recentOrders.map(order => (
                  <tr
                    key={order.id}
                    className="table-row-hover transition-colors cursor-pointer"
                    onClick={() => setSelectedOrder(order.id)}
                  >
                    <td className="px-5 py-3.5 font-mono text-xs text-bone/70">{order.order_number}</td>
                    <td className="px-5 py-3.5 text-bone/80">{order.customer_name}</td>
                    <td className="px-5 py-3.5 text-bone font-medium">{formatINR(order.total)}</td>
                    <td className="px-5 py-3.5"><StatusPill status={order.status} size="xs" /></td>
                    <td className="px-5 py-3.5 text-bone/40 text-xs">{relativeDate(order.placed_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedOrder && (
        <OrderDrawer
          orderId={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  )
}
