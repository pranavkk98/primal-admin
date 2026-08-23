import { useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import { formatINR, relativeDate, shortDate } from '../lib/format.js'
import StatusPill from './StatusPill.jsx'

export default function CustomerDrawer({ customerId, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedOrders, setExpandedOrders] = useState(() => new Set())

  useEffect(() => {
    if (!customerId) return
    setLoading(true)
    setExpandedOrders(new Set())
    api.get(`/api/admin/customers/${customerId}`)
      .then((d) => {
        setData(d)
        // Auto-expand the most recent order so the item breakdown is visible immediately.
        if (d?.orders?.[0]?.id) setExpandedOrders(new Set([d.orders[0].id]))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [customerId])

  const toggleOrder = (id) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!customerId) return null

  const initials = data?.customer?.name
    ? data.customer.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '??'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-40 animate-fade-up"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-ink-800 border-l border-bone/10 z-50 flex flex-col animate-slide-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-bone/8">
          <span className="text-xs font-medium text-bone/40 uppercase tracking-[0.15em]">Customer Profile</span>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-bone/40 hover:text-bone hover:bg-bone/8 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-5">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-bone/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-bone/10 rounded w-32" />
                  <div className="h-3 bg-bone/8 rounded w-48" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-bone/8 rounded-lg" />)}
              </div>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-bone/5 rounded-lg" />)}
              </div>
            </div>
          ) : data ? (
            <>
              {/* Identity */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-primal flex items-center justify-center text-bone font-display text-xl flex-shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="text-bone font-semibold text-base truncate">{data.customer.name}</div>
                  <div className="text-bone/50 text-xs truncate">{data.customer.email}</div>
                  <div className="text-bone/40 text-xs mt-0.5">{data.customer.phone}</div>
                </div>
                <div className="ml-auto flex-shrink-0">
                  <StatusPill status={data.customer.status} />
                </div>
              </div>

              {/* Stat tiles */}
              <div className="grid grid-cols-3 gap-3">
                <StatTile label="Lifetime Spend" value={formatINR(data.stats.lifetime_spend)} />
                <StatTile label="Total Orders" value={data.customer.total_orders} />
                <StatTile label="Days Since Order" value={data.customer.days_since_last_order} />
              </div>

              {data.stats.favorite_product && (
                <div className="bg-amber/8 border border-amber/20 rounded-lg px-4 py-3 flex items-center gap-3">
                  <span className="text-amber text-lg">★</span>
                  <div>
                    <div className="text-xs text-bone/40 mb-0.5">Favourite Product</div>
                    <div className="text-bone text-sm font-medium">{data.stats.favorite_product}</div>
                  </div>
                </div>
              )}

              {/* Products purchased (lifetime aggregate) */}
              {data.stats.products_purchased?.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-medium text-bone/40 uppercase tracking-[0.15em]">
                      Products Purchased
                    </h4>
                    <span className="text-bone/30 text-[10px]">
                      {data.stats.unique_products_purchased} SKU{data.stats.unique_products_purchased !== 1 ? 's' : ''} · {data.stats.total_units_purchased} unit{data.stats.total_units_purchased !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {data.stats.products_purchased.map((p) => (
                      <div
                        key={p.product_id ?? p.product_name}
                        className="bg-ink-700 border border-bone/8 rounded-lg p-3 flex gap-3 items-center"
                      >
                        {p.product_image ? (
                          <img
                            src={p.product_image}
                            alt={p.product_name}
                            className="w-10 h-10 object-cover rounded-md bg-ink-600 flex-shrink-0"
                            onError={(e) => { e.target.style.display = 'none' }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-ink-600 flex-shrink-0 flex items-center justify-center text-bone/30 text-xs">—</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-bone text-sm font-medium truncate">{p.product_name}</div>
                          <div className="text-bone/40 text-xs">
                            {p.total_qty} unit{p.total_qty !== 1 ? 's' : ''} · {p.order_count} order{p.order_count !== 1 ? 's' : ''}
                            {p.last_purchased_at && <> · last {relativeDate(p.last_purchased_at)}</>}
                          </div>
                        </div>
                        <div className="text-bone text-sm font-semibold flex-shrink-0">
                          {formatINR(p.total_spent)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Order history with expandable line items */}
              <div>
                <h4 className="text-xs font-medium text-bone/40 uppercase tracking-[0.15em] mb-3">
                  Order History ({data.orders?.length || 0})
                </h4>
                {data.orders?.length > 0 ? (
                  <div className="space-y-2">
                    {data.orders.map((order) => {
                      const isOpen = expandedOrders.has(order.id)
                      return (
                        <div
                          key={order.id}
                          className="bg-ink-700 border border-bone/8 rounded-lg hover:border-amber/20 transition-colors overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() => toggleOrder(order.id)}
                            className="w-full text-left px-4 py-3"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-bone/60 text-xs font-mono">{order.order_number}</span>
                              <div className="flex items-center gap-2">
                                <StatusPill status={order.status} size="xs" />
                                <svg
                                  className={`w-3.5 h-3.5 text-bone/40 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-bone text-sm font-semibold">{formatINR(order.total)}</div>
                                <div className="text-bone/40 text-xs">
                                  {order.item_count} item{order.item_count !== 1 ? 's' : ''}
                                  {order.item_qty > order.item_count && <> · {order.item_qty} units</>}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-bone/60 text-xs">{relativeDate(order.placed_at)}</div>
                                <div className="text-bone/30 text-xs">{shortDate(order.placed_at)}</div>
                              </div>
                            </div>
                          </button>

                          {isOpen && (
                            <div className="border-t border-bone/8 px-4 py-3 space-y-2 bg-ink-800/40">
                              {order.items?.length > 0 ? (
                                <>
                                  {order.items.map((item) => (
                                    <div key={item.id} className="flex gap-3 items-center">
                                      {item.product_image ? (
                                        <img
                                          src={item.product_image}
                                          alt={item.product_name}
                                          className="w-9 h-9 object-cover rounded-md bg-ink-600 flex-shrink-0"
                                          onError={(e) => { e.target.style.display = 'none' }}
                                        />
                                      ) : (
                                        <div className="w-9 h-9 rounded-md bg-ink-600 flex-shrink-0" />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <div className="text-bone text-sm truncate">{item.product_name}</div>
                                        {item.variant_label && (
                                          <div className="text-bone/40 text-[11px] truncate">{item.variant_label}</div>
                                        )}
                                        <div className="text-bone/50 text-[11px] mt-0.5">
                                          {item.qty} × {formatINR(item.unit_price)}
                                        </div>
                                      </div>
                                      <div className="text-bone/80 text-sm font-medium flex-shrink-0">
                                        {formatINR(item.line_total)}
                                      </div>
                                    </div>
                                  ))}
                                  <div className="hairline pt-2 flex items-center justify-between text-[11px] text-bone/40">
                                    <span>
                                      Subtotal {formatINR(order.subtotal)}
                                      {order.discount > 0 && <> · −{formatINR(order.discount)}</>}
                                      {order.shipping_fee > 0 && <> · ship {formatINR(order.shipping_fee)}</>}
                                      {order.tax > 0 && <> · tax {formatINR(order.tax)}</>}
                                    </span>
                                    <span className="text-bone/60 font-medium">Total {formatINR(order.total)}</span>
                                  </div>
                                </>
                              ) : (
                                <div className="text-bone/30 text-xs text-center py-2">No item details available</div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-bone/30 text-sm text-center py-6">No orders yet</div>
                )}
              </div>

              {/* Address */}
              {data.addresses?.[0] && (
                <div>
                  <h4 className="text-xs font-medium text-bone/40 uppercase tracking-[0.15em] mb-2">Shipping Address</h4>
                  <div className="text-bone/60 text-xs leading-relaxed">
                    {data.addresses[0].line1}<br />
                    {data.addresses[0].city}, {data.addresses[0].state} — {data.addresses[0].pincode}<br />
                    {data.addresses[0].country}
                  </div>
                </div>
              )}

              {/* Member since */}
              {data.stats.first_order_date && (
                <div className="pt-2 hairline">
                  <span className="text-bone/30 text-xs">
                    Customer since {shortDate(data.customer.created_at)} · First order {shortDate(data.stats.first_order_date)}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="text-bone/40 text-sm text-center py-12">Failed to load customer</div>
          )}
        </div>
      </div>
    </>
  )
}

function StatTile({ label, value }) {
  return (
    <div className="bg-ink-700 border border-bone/8 rounded-lg px-3 py-2.5 text-center">
      <div className="text-bone font-semibold text-base">{value}</div>
      <div className="text-bone/40 text-[10px] mt-0.5">{label}</div>
    </div>
  )
}
