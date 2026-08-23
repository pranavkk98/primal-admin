import { getVerdictConfig } from '../lib/format.js'

export default function VerdictPill({ verdict, size = 'sm' }) {
  const { label, bg, text, dot } = getVerdictConfig(verdict)
  const padding = size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${bg} ${text} ${padding}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot} flex-shrink-0`} />
      {label}
    </span>
  )
}
