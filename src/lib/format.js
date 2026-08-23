import { formatDistanceToNow, format, parseISO } from 'date-fns'

// ── Currency ──
export function formatINR(amount) {
  if (amount === null || amount === undefined) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatINRShort(amount) {
  if (amount === null || amount === undefined) return '—'
  if (amount >= 10_00_000) return `₹${(amount / 10_00_000).toFixed(1)}Cr`
  if (amount >= 1_00_000) return `₹${(amount / 1_00_000).toFixed(1)}L`
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
  return `₹${amount}`
}

// ── Dates ──
export function relativeDate(dateStr) {
  if (!dateStr) return '—'
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true })
  } catch {
    return '—'
  }
}

export function shortDate(dateStr) {
  if (!dateStr) return '—'
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy')
  } catch {
    return '—'
  }
}

export function chartDate(dateStr) {
  if (!dateStr) return ''
  try {
    return format(parseISO(dateStr), 'dd MMM')
  } catch {
    return dateStr
  }
}

// ── Status pills ──
const STATUS_CONFIG = {
  // Order statuses
  delivered:  { label: 'Delivered',  bg: 'bg-green-500/15',  text: 'text-green-400',  dot: 'bg-green-400' },
  shipped:    { label: 'Shipped',    bg: 'bg-blue-500/15',   text: 'text-blue-400',   dot: 'bg-blue-400' },
  pending:    { label: 'Pending',    bg: 'bg-yellow-500/15', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  paid:       { label: 'Paid',       bg: 'bg-teal-500/15',   text: 'text-teal-400',   dot: 'bg-teal-400' },
  cancelled:  { label: 'Cancelled',  bg: 'bg-red-500/15',    text: 'text-red-400',    dot: 'bg-red-400' },
  refunded:   { label: 'Refunded',   bg: 'bg-orange-500/15', text: 'text-orange-400', dot: 'bg-orange-400' },
  // Customer statuses
  active:     { label: 'Active',     bg: 'bg-green-500/15',  text: 'text-green-400',  dot: 'bg-green-400' },
  dormant:    { label: 'Dormant',    bg: 'bg-yellow-500/15', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  churned:    { label: 'Churned',    bg: 'bg-red-500/15',    text: 'text-red-400',    dot: 'bg-red-400' },
}

export function getStatusConfig(status) {
  return STATUS_CONFIG[status] || { label: status, bg: 'bg-bone/10', text: 'text-bone-dark', dot: 'bg-bone-dark' }
}

// ── Payment method ──
export function paymentMethodLabel(method) {
  if (!method) return '—'
  const m = String(method).toLowerCase()
  if (m === 'cod') return 'COD'
  if (m === 'razorpay' || m === 'prepaid' || m === 'online') return 'Prepaid'
  return method
}

// ── Attribution channel ──
// Colours reuse the same palette as STATUS_CONFIG so the classes are in the build.
const CHANNEL_CONFIG = {
  organic_search: { label: 'Organic Search', bg: 'bg-green-500/15',  text: 'text-green-400' },
  paid_search:    { label: 'Paid Search',    bg: 'bg-blue-500/15',   text: 'text-blue-400' },
  organic_social: { label: 'Organic Social', bg: 'bg-teal-500/15',   text: 'text-teal-400' },
  paid_social:    { label: 'Paid Social',    bg: 'bg-orange-500/15',  text: 'text-orange-400' },
  referral:       { label: 'Referral',       bg: 'bg-yellow-500/15',  text: 'text-yellow-400' },
  email:          { label: 'Email',          bg: 'bg-blue-500/15',    text: 'text-blue-400' },
  affiliate:      { label: 'Affiliate',      bg: 'bg-orange-500/15',  text: 'text-orange-400' },
  direct:         { label: 'Direct',         bg: 'bg-bone/10',        text: 'text-bone-dark' },
}

export function getChannelConfig(channel) {
  return CHANNEL_CONFIG[channel] || { label: channel || 'Unknown', bg: 'bg-bone/10', text: 'text-bone-dark' }
}

// Reduce a referrer URL to its host for compact display.
export function hostOf(url) {
  if (!url) return '—'
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
