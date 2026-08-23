export default function EmptyState({ icon = '📭', title = 'Nothing here', description = '' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4 opacity-60">{icon}</div>
      <h3 className="text-bone/70 font-semibold text-base mb-1">{title}</h3>
      {description && <p className="text-bone/40 text-sm max-w-xs">{description}</p>}
    </div>
  )
}
