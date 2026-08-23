import { useState } from 'react'

function ResultsTable({ results }) {
  if (!results || results.length === 0) return null
  const keys = Object.keys(results[0])

  return (
    <div className="mt-3 overflow-x-auto rounded-lg border border-bone/8">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-ink-700">
            {keys.map(k => (
              <th key={k} className="px-3 py-2 text-left text-bone/40 uppercase tracking-[0.1em] font-medium whitespace-nowrap">
                {k.replace(/_/g, ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-bone/5">
          {results.slice(0, 20).map((row, i) => (
            <tr key={i} className="hover:bg-bone/3 transition-colors">
              {keys.map(k => (
                <td key={k} className="px-3 py-2 text-bone/70 whitespace-nowrap">
                  {typeof row[k] === 'number' && k.includes('revenue') || k.includes('spent') || k.includes('value')
                    ? `₹${Number(row[k]).toLocaleString('en-IN')}`
                    : String(row[k] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {results.length > 20 && (
        <div className="px-3 py-2 text-bone/30 text-xs bg-ink-700 border-t border-bone/8">
          Showing 20 of {results.length} rows
        </div>
      )}
    </div>
  )
}

export default function ChatMessage({ message }) {
  const [sqlOpen, setSqlOpen] = useState(false)

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-gradient-primal rounded-2xl rounded-tr-md px-4 py-2.5">
          <p className="text-bone text-sm">{message.content}</p>
        </div>
      </div>
    )
  }

  // Assistant message
  const data = message.data || {}
  const isError = data.error === 'SQL_REJECTED'
  const hasSuggestions = data.suggestions?.length > 0

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] w-full">
        {/* Assistant card */}
        <div className={`bg-ink-700 border rounded-2xl rounded-tl-md px-4 py-3 ${isError ? 'border-amber/30' : 'border-bone/8'}`}>
          {/* Avatar + label */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-full bg-gradient-primal flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-bone" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <span className="text-xs text-bone/40 font-medium">Primal AI</span>
          </div>

          {isError ? (
            <div className="flex items-start gap-2">
              <span className="text-amber text-base mt-0.5">⚠</span>
              <div>
                <p className="text-amber text-sm font-medium">SQL Rejected</p>
                <p className="text-bone/60 text-xs mt-1">{data.reason}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Summary */}
              {data.summary && (
                <p className="text-bone/85 text-sm leading-relaxed">{data.summary}</p>
              )}

              {/* Suggestions */}
              {hasSuggestions && (
                <div className="mt-3 space-y-1">
                  {data.suggestions.map((s, i) => (
                    <div key={i} className="text-bone/50 text-xs flex items-center gap-1.5">
                      <span className="text-amber/60">›</span> {s}
                    </div>
                  ))}
                </div>
              )}

              {/* SQL toggle */}
              {data.sql && (
                <div className="mt-3">
                  <button
                    onClick={() => setSqlOpen(!sqlOpen)}
                    className="text-xs text-bone/40 hover:text-bone/70 flex items-center gap-1 transition"
                  >
                    <span>{sqlOpen ? '▲' : '▼'}</span>
                    {sqlOpen ? 'Hide SQL' : 'Show SQL'}
                  </button>
                  {sqlOpen && (
                    <pre className="mt-2 bg-ink rounded-lg p-3 text-[11px] text-green-400/80 font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap">
                      {data.sql}
                    </pre>
                  )}
                </div>
              )}

              {/* Results table */}
              {data.results?.length > 0 && <ResultsTable results={data.results} />}

              {/* Latency */}
              {data.latencyMs && (
                <div className="mt-2 text-bone/25 text-[10px]">
                  answered in {(data.latencyMs / 1000).toFixed(2)}s
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
