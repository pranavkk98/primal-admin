import { useEffect, useState, useCallback } from 'react'
import { api } from '../lib/api.js'
import { formatINR, relativeDate, shortDate, paymentMethodLabel } from '../lib/format.js'
import DataTable from '../components/DataTable.jsx'
import StatusPill from '../components/StatusPill.jsx'
import OrderDrawer from '../components/OrderDrawer.jsx'
import CustomerDrawer from '../components/CustomerDrawer.jsx'

const STATUS_FILTERS = [
  { id: '', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'paid', label: 'Paid' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
]

const DATE_RANGES = [
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: '90d', label: '90 days' },
  { id: '', label: 'All time' },
]

export default function Orders() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [range, setRange] = useState('30d')
  const [page, setPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    api.get('/api/admin/orders', { page, limit: 25, status, range })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page, status, range])

  useEffect(() => { fetchData() }, [fetchData])

  const handleStatus = (v) => { setStatus(v); setPage(1) }
  const handleRange = (v) => { setRange(v); setPage(1) }

  const columns = [
    {
      key: 'order_number',
      header: 'Order',
      render: (row) => <span className="font-mono text-xs text-bone/70">{row.order_number}</span>,
    },
    {
      key: 'customer_name',
      header: 'Customer',
      render: (row) => (
        <div>
          <div className="text-bone text-sm">{row.customer_name}</div>
          <div className="text-bone/40 text-xs">{row.customer_email}</div>
        </div>
      ),
    },
    {
      key: 'item_count',
      header: 'Items',
      render: (row) => <span className="text-bone/60 text-sm">{row.item_count}</span>,
    },
    {
      key: 'total',
      header: 'Total',
      render: (row) => <span className="text-bone font-semibold text-sm">{formatINR(row.total)}</span>,
    },
    {
      key: 'payment_method',
      header: 'Payment',
      render: (row) => {
        if (!row.payment_method) return <span className="text-bone/30 text-xs">—</span>
        const isCod = String(row.payment_method).toLowerCase() === 'cod'
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${isCod ? 'bg-orange-500/15 text-orange-400' : 'bg-teal-500/15 text-teal-400'}`}>
            {paymentMethodLabel(row.payment_method)}
          </span>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusPill status={row.status} size="xs" />,
    },
    {
      key: 'placed_at',
      header: 'Date',
      render: (row) => (
        <div>
          <div className="text-bone/50 text-xs">{relativeDate(row.placed_at)}</div>
          <div className="text-bone/30 text-xs">{shortDate(row.placed_at)}</div>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl text-bone tracking-wide">Orders</h1>
        <p className="text-bone/40 text-sm mt-1">
          {data ? `${data.meta.total} orders` : 'Loading…'}
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        {/* Status */}
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => handleStatus(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                status === f.id
                  ? 'bg-amber/15 text-amber border border-amber/30'
                  : 'bg-ink-800 border border-bone/10 text-bone/55 hover:text-bone'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="sm:ml-auto flex gap-1.5">
          {DATE_RANGES.map(r => (
            <button
              key={r.id}
              onClick={() => handleRange(r.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                range === r.id
                  ? 'bg-bone/10 text-bone border border-bone/20'
                  : 'bg-ink-800 border border-bone/8 text-bone/40 hover:text-bone/70'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={data?.data}
        loading={loading}
        onRowClick={(row) => setSelectedOrder(row.id)}
        emptyTitle="No orders found"
        emptyDescription="Try adjusting the status filter or date range"
        keyFn={r => r.id}
      />

      {data && data.meta.pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-bone/40 text-xs">
            Page {data.meta.page} of {data.meta.pages} · {data.meta.total} total
          </span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost !px-3 !py-1.5 text-xs disabled:opacity-40">Previous</button>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= data.meta.pages} className="btn-ghost !px-3 !py-1.5 text-xs disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      {selectedOrder && (
        <OrderDrawer
          orderId={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onViewCustomer={(id) => { setSelectedOrder(null); setSelectedCustomer(id) }}
        />
      )}

      {selectedCustomer && (
        <CustomerDrawer
          customerId={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  )
}
