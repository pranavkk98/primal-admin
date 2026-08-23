export default function KpiCard({ label, value, sub, accent = false, icon }) {
  return (
    <div className={`card p-5 flex flex-col gap-2 ${accent ? 'border-amber/25' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-bone/50 uppercase tracking-[0.15em]">{label}</span>
        {icon && (
          <span className={`text-lg ${accent ? 'text-amber' : 'text-bone/25'}`}>{icon}</span>
        )}
      </div>
      <div className={`font-display text-3xl tracking-wide ${accent ? 'text-amber' : 'text-bone'}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-bone/40">{sub}</div>}
    </div>
  )
}
