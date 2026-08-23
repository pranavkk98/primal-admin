import EmptyState from './EmptyState.jsx'

export default function DataTable({
  columns,
  rows,
  onRowClick,
  loading = false,
  emptyTitle = 'No data',
  emptyDescription = '',
  keyFn = (row) => row.id,
}) {
  if (loading) {
    return (
      <div className="card overflow-hidden">
        <div className="divide-y divide-bone/5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-5 py-3.5 animate-pulse">
              {columns.map((col, ci) => (
                <div key={ci} className="h-4 bg-bone/8 rounded flex-1" style={{ maxWidth: col.width || undefined }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="card">
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="hairline">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-5 py-3 text-left text-xs font-medium text-bone/40 uppercase tracking-[0.1em] whitespace-nowrap"
                  style={{ width: col.width || undefined }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-bone/5">
            {rows.map((row) => (
              <tr
                key={keyFn(row)}
                className={`table-row-hover transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-5 py-3.5 whitespace-nowrap">
                    {col.render ? col.render(row) : (
                      <span className="text-bone/80">{row[col.key] ?? '—'}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
