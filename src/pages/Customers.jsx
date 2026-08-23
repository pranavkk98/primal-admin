import { useEffect, useState, useCallback } from 'react'
import { api } from '../lib/api.js'
import { formatINR, relativeDate } from '../lib/format.js'
import DataTable from '../components/DataTable.jsx'
import StatusPill from '../components/StatusPill.jsx'
import CustomerDrawer from '../components/CustomerDrawer.jsx'

const FILTERS = [
  { id: '', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'dormant', label: 'Dormant' },
  { id: 'churned', label: 'Churned' },
]

export default function Customers() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    api.get('/api/admin/customers', { page, limit: 25, search, status })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page, search, status])

  useEffect(() => { fetchData() }, [fetchData])

  // Reset page on filter change
  const handleSearch = (v) => { setSearch(v); setPage(1) }
  const handleStatus = (v) => { setStatus(v); setPage(1) }

  const counts = data ? {
    all: data.meta?.total ?? 0,
  } : {}

  const columns = [
    {
      key: 'name',
      header: 'Customer',
      render: (row) => (
        <div>
          <div className="text-bone font-medium text-sm">{row.name}</div>
          <div className="text-bone/40 text-xs">{row.email}</div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (row) => <span className="text-bone/60 text-xs font-mono">{row.phone}</span>,
    },
    {
      key: 'total_orders',
      header: 'Orders',
      render: (row) => <span className="text-bone/80 text-sm">{row.total_orders}</span>,
    },
    {
      key: 'total_spent',
      header: 'Lifetime Spend',
      render: (row) => <span className="text-bone font-semibold text-sm">{formatINR(row.total_spent)}</span>,
    },
    {
      key: 'last_order_date',
      header: 'Last Order',
      render: (row) => <span className="text-bone/50 text-xs">{relativeDate(row.last_order_date)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusPill status={row.status} size="xs" />,
    },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-bone tracking-wide">Customers</h1>
          <p className="text-bone/40 text-sm mt-1">
            {data ? `${data.meta.total} customers` : 'Loading…'}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bone/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search name or email…"
            className="w-full bg-ink-800 border border-bone/10 rounded-lg pl-9 pr-3 py-2 text-sm text-bone placeholder-bone/30 focus:outline-none focus:border-amber/40 transition"
          />
        </div>

        {/* Status filters */}
        <div className="flex gap-1.5">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => handleStatus(f.id)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
                status === f.id
                  ? 'bg-amber/15 text-amber border border-amber/30'
                  : 'bg-ink-800 border border-bone/10 text-bone/55 hover:text-bone hover:border-bone/20'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        rows={data?.data}
        loading={loading}
        onRowClick={(row) => setSelectedCustomer(row.id)}
        emptyTitle="No customers found"
        emptyDescription="Try adjusting your search or filter"
        keyFn={r => r.id}
      />

      {/* Pagination */}
      {data && data.meta.pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-bone/40 text-xs">
            Page {data.meta.page} of {data.meta.pages} · {data.meta.total} total
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-ghost !px-3 !py-1.5 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= data.meta.pages}
              className="btn-ghost !px-3 !py-1.5 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
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
