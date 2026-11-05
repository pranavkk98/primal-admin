import { useEffect, useState, useCallback } from 'react'
import { api } from '../lib/api.js'
import { formatINR, relativeDate, shortDate, paymentMethodLabel, getChannelConfig, hostOf } from '../lib/format.js'
import StatusPill from './StatusPill.jsx'

function waPhone(phone) {
  const d = String(phone ?? '').replace(/\D/g, '')
  return d.length >= 10 ? '91' + d.slice(-10) : null
}

function itemSize(label) {
  const m = String(label ?? '').match(/(\d+(?:\.\d+)?)\s*(ml|g|kg|l|caps?|tabs?)/i)
  return m ? `${m[1]} ${m[2].toLowerCase()}` : (label ?? '')
}

function codConfirmLink(data) {
  const phone = waPhone(data.customer?.phone)
  if (!phone) return null
  const first = String(data.customer?.name ?? '').trim().split(/\s+/)[0] || 'there'
  const lines = (data.items ?? []).map((it) => {
    const size = itemSize(it.variant_label)
    return `• ${it.qty > 1 ? `${it.qty} × ` : ''}${it.product_name}${size ? ` – ${size}` : ''}`
  }).join('\n')
  const a = data.address
  const addr = a ? `Delivery Address:\n${a.city}, ${a.state} – ${a.pincode}\n\n` : ''
  const msg =
    `Hi ${first} 👋\n\n` +
    `Thank you for ordering from Primal Nutrition.\n\n` +
    `We have received your COD order ${data.order.order_number} for:\n\n` +
    `${lines}\n\n` +
    `Order Total: ${formatINR(data.order.total)} COD\n\n` +
    addr +
    `Please reply YES to confirm that the order is correct and that you will accept the COD delivery.\n\n` +
    `Regards,\nTeam Primal Nutrition`
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
}

function AutoStatus({ order }) {
  if (order.cod_confirmed_at) {
    return <div className="mt-2 text-xs text-green-400">✓ COD confirmed on WhatsApp · {shortDate(order.cod_confirmed_at)}</div>
  }
  if (order.wa_cod_sent_at) {
    return <div className="mt-2 text-xs text-bone/50">Auto-message sent {relativeDate(order.wa_cod_sent_at)} · awaiting YES</div>
  }
  if (order.wa_cod_error) {
    return <div className="mt-2 text-xs text-red-400">Auto-message failed: {order.wa_cod_error}</div>
  }
  return null
}

// Online payment started but never completed: nudge the buyer back with a product link.
function paymentFailedLink(data) {
  const phone = waPhone(data.customer?.phone)
  if (!phone) return null
  const first = String(data.customer?.name ?? '').trim().split(/\s+/)[0] || 'there'
  const items = data.items ?? []
  const product = items.length === 1 ? items[0].product_name : 'Primal Nutrition'
  const slug = items.length === 1 ? items[0].product_slug : null
  const link = slug
    ? `https://primalnutrition.in/?p=${slug}&utm_source=whatsapp&utm_medium=recovery&utm_campaign=failed_payment`
    : 'https://primalnutrition.in/#/shop?utm_source=whatsapp&utm_medium=recovery&utm_campaign=failed_payment'
  const total = Number(data.order.total)
  // Online orders carry the ₹200 prepaid discount; COD is the price without it.
  const cod = Number(data.order.discount) >= 200 ? total + 200 : total
  const msg =
    `Hi ${first} 👋 This is Team Primal Nutrition.\n` +
    `We noticed your ${product} order (${data.order.order_number}) for ${formatINR(total)} didn't complete — the payment didn't go through.\n` +
    `You can finish it here in 2 taps, same ${formatINR(total)} price when you pay online:\n` +
    `${link}\n` +
    `Prefer Cash on Delivery? Just reply COD and we'll arrange it (${formatINR(cod)}).\n` +
    `Team Primal Nutrition`
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
}

function WhatsAppContact({ data }) {
  const phone = waPhone(data.customer?.phone)
  const isCod = String(data.order.payment_method ?? '').toLowerCase() === 'cod'
  const canConfirm = isCod && !['cancelled', 'delivered'].includes(data.order.status)
  const paymentFailed = !isCod && data.order.status === 'pending' && !data.order.razorpay_payment_id
  return (
    <div className="bg-ink-700 border border-bone/8 rounded-xl p-3">
      <div className="text-[10px] font-medium text-bone/35 uppercase tracking-[0.15em] mb-2.5">Contact Buyer</div>
      {!phone ? (
        <div className="text-bone/40 text-xs">No phone on file</div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          {canConfirm ? (
            <a
              href={codConfirmLink(data)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/25 hover:bg-green-500/25 transition"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.700-1.600-2-.2-.3 0-.4.100-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.600-.9-2.200-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.500s1.100 2.900 1.200 3.100c.1.2 2.100 3.200 5.100 4.500.7.3 1.300.5 1.700.6.7.2 1.400.2 1.900.1.600-.1 1.700-.7 2-1.400.2-.7.2-1.300.2-1.400-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 00-8.600 15.100L2 22l5-1.300A10 10 0 1012 2z" />
              </svg>
              Confirm COD on WhatsApp
            </a>
          ) : paymentFailed ? (
            <a
              href={paymentFailedLink(data)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/25 hover:bg-green-500/25 transition"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.4.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2z" />
              </svg>
              Payment failed? WhatsApp buyer
            </a>
          ) : (
            <a
              href={`https://wa.me/${phone}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-green-400 border border-green-500/25 hover:bg-green-500/10 transition"
            >
              WhatsApp
            </a>
          )}
          <span className="text-bone/60 text-xs">+91 {phone.slice(2, 7)} {phone.slice(7)}</span>
        </div>
      )}
      {isCod && <AutoStatus order={data.order} />}
    </div>
  )
}

export default function OrderDrawer({ orderId, onClose, onViewCustomer }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [actionError, setActionError] = useState(null)

  const reload = useCallback(() => {
    if (!orderId) return
    setLoading(true)
    api.get(`/api/admin/orders/${orderId}`)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [orderId])

  useEffect(() => { reload() }, [reload])

  const handleStatusChange = useCallback(async (newStatus) => {
    if (!data?.order?.id) return
    setActionLoading(newStatus)
    setActionError(null)
    try {
      await api.patch(`/api/admin/orders/${data.order.id}/status`, { status: newStatus })
      await reload()
    } catch (err) {
      setActionError(err?.body?.message || err.message || 'Failed to update status')
    } finally {
      setActionLoading(null)
    }
  }, [data?.order?.id, reload])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!orderId) return null

  return (
    <>
      <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-ink-800 border-l border-bone/10 z-50 flex flex-col animate-slide-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-bone/8">
          <span className="text-xs font-medium text-bone/40 uppercase tracking-[0.15em]">Order Detail</span>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-bone/40 hover:text-bone hover:bg-bone/8 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-5">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-6 bg-bone/10 rounded w-40" />
              <div className="h-20 bg-bone/8 rounded-lg" />
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-bone/5 rounded-lg" />)}
              </div>
            </div>
          ) : data ? (
            <>
              {/* Order header */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-display text-2xl text-bone tracking-wide">{data.order.order_number}</span>
                  <div className="flex items-center gap-2">
                    <PaymentBadge method={data.order.payment_method} />
                    <StatusPill status={data.order.status} />
                  </div>
                </div>
                <div className="text-bone/40 text-xs">
                  Placed {relativeDate(data.order.placed_at)} · {shortDate(data.order.placed_at)}
                </div>
              </div>

              <WhatsAppContact data={data} />

              {/* Order actions */}
              <OrderActions
                status={data.order.status}
                actionLoading={actionLoading}
                actionError={actionError}
                onAction={handleStatusChange}
              />

              {/* Totals */}
              <div className="card p-4 space-y-2 text-sm">
                <Row label="Subtotal" value={formatINR(data.order.subtotal)} />
                {data.order.discount > 0 && <Row label="Discount" value={`-${formatINR(data.order.discount)}`} valueClass="text-green-400" />}
                <Row label="Shipping" value={data.order.shipping_fee === 0 ? 'Free' : formatINR(data.order.shipping_fee)} />
                <Row label="Tax (5%)" value={formatINR(data.order.tax)} />
                <div className="hairline pt-2">
                  <Row label="Total" value={formatINR(data.order.total)} labelClass="font-semibold text-bone" valueClass="font-semibold text-bone text-base" />
                </div>
              </div>

              {/* Line items */}
              <div>
                <h4 className="text-xs font-medium text-bone/40 uppercase tracking-[0.15em] mb-3">
                  Items ({data.items?.length})
                </h4>
                <div className="space-y-2">
                  {data.items?.map((item, i) => (
                    <div key={i} className="bg-ink-700 border border-bone/8 rounded-lg p-3 flex gap-3">
                      {item.product_image && (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-10 h-10 object-cover rounded-md bg-ink-600 flex-shrink-0"
                          onError={(e) => { e.target.style.display = 'none' }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-bone text-sm font-medium truncate">{item.product_name}</div>
                        <div className="text-bone/40 text-xs truncate">{item.variant_label}</div>
                        <div className="text-bone/50 text-xs mt-1">
                          {item.qty} × {formatINR(item.unit_price)} = <span className="text-bone/80">{formatINR(item.line_total)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer mini-card */}
              {data.customer && (
                <div>
                  <h4 className="text-xs font-medium text-bone/40 uppercase tracking-[0.15em] mb-2">Customer</h4>
                  <div
                    className="bg-ink-700 border border-bone/8 rounded-lg p-3 flex items-center gap-3 hover:border-amber/20 transition cursor-pointer"
                    onClick={() => onViewCustomer && onViewCustomer(data.customer.id)}
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-primal flex items-center justify-center text-bone text-xs font-display flex-shrink-0">
                      {data.customer.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-bone text-sm font-medium truncate">{data.customer.name}</div>
                      <div className="text-bone/40 text-xs truncate">{data.customer.email}</div>
                    </div>
                    <svg className="w-4 h-4 text-bone/30 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Shipping address */}
              {data.address && (
                <div>
                  <h4 className="text-xs font-medium text-bone/40 uppercase tracking-[0.15em] mb-2">Shipping Address</h4>
                  <div className="text-bone/60 text-xs leading-relaxed bg-ink-700 border border-bone/8 rounded-lg p-3">
                    {data.address.line1}<br />
                    {data.address.city}, {data.address.state} — {data.address.pincode}<br />
                    {data.address.country}
                  </div>
                </div>
              )}

              {/* Payment & fulfillment */}
              <div>
                <h4 className="text-xs font-medium text-bone/40 uppercase tracking-[0.15em] mb-2">Payment &amp; Fulfillment</h4>
                <div className="card p-4 space-y-2 text-sm">
                  <Row label="Payment method" value={paymentMethodLabel(data.order.payment_method)} />
                  {data.order.razorpay_payment_id && <Row label="Razorpay payment" value={data.order.razorpay_payment_id} />}
                  <Row label="Shiprocket order" value={data.order.shiprocket_order_id || '—'} />
                  <Row
                    label="AWB"
                    value={data.order.awb_code || 'Not booked'}
                    valueClass={data.order.awb_code ? 'text-bone/80' : 'text-yellow-400'}
                  />
                  {data.order.courier_name && <Row label="Courier" value={data.order.courier_name} />}
                  {data.order.awb_code && (
                    <div className="pt-1">
                      <a
                        href={`https://shiprocket.co/tracking/${data.order.awb_code}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber text-xs hover:underline"
                      >
                        Track shipment →
                      </a>
                    </div>
                  )}
                </div>
                {/* Timeline */}
                <div className="mt-2 px-1 space-y-1.5">
                  <TimelineRow label="Placed" at={data.order.placed_at} />
                  <TimelineRow label="Paid" at={data.order.paid_at} />
                  <TimelineRow label="Shipped" at={data.order.shipped_at} />
                  <TimelineRow label="Delivered" at={data.order.delivered_at} />
                  {data.order.cancelled_at && <TimelineRow label="Cancelled" at={data.order.cancelled_at} />}
                </div>
              </div>

              {/* Marketing attribution — how this order was acquired */}
              {(data.order.attribution || data.order.attribution_channel || data.order.utm_source) && (
                <div>
                  <h4 className="text-xs font-medium text-bone/40 uppercase tracking-[0.15em] mb-2">Marketing Source</h4>
                  <div className="card p-4 space-y-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <ChannelBadge channel={data.order.attribution_channel || data.order.attribution?.lastTouch?.channel} />
                      {data.order.attribution?.device && <Tile>{data.order.attribution.device}</Tile>}
                      {Number.isFinite(data.order.attribution?.daysToPurchase) && (
                        <Tile>{data.order.attribution.daysToPurchase === 0 ? 'same-day' : `${data.order.attribution.daysToPurchase}d to buy`}</Tile>
                      )}
                    </div>
                    <TouchBlock
                      title="Last touch"
                      touch={data.order.attribution?.lastTouch}
                      fallback={{
                        source: data.order.utm_source,
                        medium: data.order.utm_medium,
                        campaign: data.order.utm_campaign,
                        landingPage: data.order.landing_page,
                      }}
                    />
                    <TouchBlock title="First touch" touch={data.order.attribution?.firstTouch} />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-bone/40 text-sm text-center py-12">Failed to load order</div>
          )}
        </div>
      </div>
    </>
  )
}

function OrderActions({ status, actionLoading, actionError, onAction }) {
  const canCancel   = status === 'pending' || status === 'paid'
  const canShip     = status === 'pending' || status === 'paid'
  const canDeliver  = status === 'shipped'

  if (!canCancel && !canShip && !canDeliver) return null

  return (
    <div className="bg-ink-700 border border-bone/8 rounded-xl p-3">
      <div className="text-[10px] font-medium text-bone/35 uppercase tracking-[0.15em] mb-2.5">Order Actions</div>
      <div className="flex flex-wrap gap-2">
        {canShip && (
          <ActionBtn
            label="Mark as Shipped"
            loading={actionLoading === 'shipped'}
            variant="primary"
            onClick={() => onAction('shipped')}
          />
        )}
        {canDeliver && (
          <ActionBtn
            label="Mark as Delivered"
            loading={actionLoading === 'delivered'}
            variant="primary"
            onClick={() => onAction('delivered')}
          />
        )}
        {canCancel && (
          <ActionBtn
            label="Cancel Order"
            loading={actionLoading === 'cancelled'}
            variant="danger"
            onClick={() => {
              if (window.confirm('Cancel this order? This cannot be undone.')) onAction('cancelled')
            }}
          />
        )}
      </div>
      {actionError && (
        <p className="mt-2 text-xs text-red-400">{actionError}</p>
      )}
    </div>
  )
}

function ActionBtn({ label, loading, variant, onClick }) {
  const base = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-50'
  const styles = variant === 'danger'
    ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
    : 'bg-amber/10 text-amber border border-amber/20 hover:bg-amber/20'
  return (
    <button onClick={onClick} disabled={!!loading} className={`${base} ${styles}`}>
      {loading && <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />}
      {label}
    </button>
  )
}

function Row({ label, value, labelClass = 'text-bone/50', valueClass = 'text-bone/80' }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={`text-sm ${labelClass} flex-shrink-0`}>{label}</span>
      <span className={`text-sm ${valueClass} text-right truncate`} title={typeof value === 'string' ? value : undefined}>{value}</span>
    </div>
  )
}

function PaymentBadge({ method }) {
  if (!method) return null
  const isCod = String(method).toLowerCase() === 'cod'
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${isCod ? 'bg-orange-500/15 text-orange-400' : 'bg-teal-500/15 text-teal-400'}`}>
      {paymentMethodLabel(method)}
    </span>
  )
}

function ChannelBadge({ channel }) {
  if (!channel) return null
  const cfg = getChannelConfig(channel)
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  )
}

function Tile({ children }) {
  return <span className="px-2 py-1 rounded-md bg-ink-600 border border-bone/8 text-bone/70 text-[11px]">{children}</span>
}

function TimelineRow({ label, at }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-bone/40">{label}</span>
      <span className={at ? 'text-bone/70' : 'text-bone/25'}>{at ? shortDate(at) : '—'}</span>
    </div>
  )
}

function TouchBlock({ title, touch, fallback }) {
  const t = touch || fallback || {}
  const hasAny = t.source || t.medium || t.campaign || t.referrer || t.landingPage
  if (!hasAny) return null
  return (
    <div className="pt-3 border-t border-bone/8 first:border-t-0 first:pt-0">
      <div className="text-bone/40 text-[11px] uppercase tracking-wider mb-1.5">{title}</div>
      {t.source && <Row label="Source" value={t.source} />}
      {t.medium && <Row label="Medium" value={t.medium} />}
      {t.campaign && <Row label="Campaign" value={t.campaign} />}
      {t.content && <Row label="Content" value={t.content} />}
      {t.term && <Row label="Term" value={t.term} />}
      {t.landingPage && <Row label="Landing" value={t.landingPage} />}
      {t.referrer && <Row label="Referrer" value={hostOf(t.referrer)} />}
      {(t.gclid || t.fbclid) && <Row label="Click ID" value={t.gclid ? 'Google (gclid)' : 'Meta (fbclid)'} />}
      {t.at && <Row label="When" value={shortDate(t.at)} />}
    </div>
  )
}
