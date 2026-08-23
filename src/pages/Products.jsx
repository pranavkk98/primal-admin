import { useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import { formatINR, formatINRShort } from '../lib/format.js'
import TopProductsChart from '../components/TopProductsChart.jsx'

export default function Products() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/admin/analytics/top-products', { limit: 9 })
      .then(res => setData(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const maxRevenue = data ? Math.max(...data.map(p => p.revenue)) : 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-bone tracking-wide">Products</h1>
        <p className="text-bone/40 text-sm mt-1">Performance ranking by revenue</p>
      </div>

      {/* Bar chart */}
      <TopProductsChart data={data || []} loading={loading} />

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="divide-y divide-bone/5 animate-pulse">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="flex gap-4 px-5 py-4">
                <div className="h-10 w-10 bg-bone/8 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-bone/10 rounded w-40" />
                  <div className="h-2 bg-bone/6 rounded w-full" />
                </div>
                <div className="w-20 space-y-2">
                  <div className="h-4 bg-bone/10 rounded" />
                  <div className="h-2 bg-bone/5 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="px-5 py-3 hairline">
              <div className="grid grid-cols-12 gap-4 text-xs font-medium text-bone/40 uppercase tracking-[0.1em]">
                <div className="col-span-1">#</div>
                <div className="col-span-4">Product</div>
                <div className="col-span-4">Revenue Share</div>
                <div className="col-span-1 text-right">Revenue</div>
                <div className="col-span-1 text-right">Units</div>
                <div className="col-span-1 text-right">Buyers</div>
              </div>
            </div>
            <div className="divide-y divide-bone/5">
              {(data || []).map((product, i) => {
                const share = (product.revenue / maxRevenue) * 100
                return (
                  <div key={product.product_id} className="px-5 py-4">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-1">
                        <span className={`font-display text-xl ${i === 0 ? 'text-amber' : 'text-bone/30'}`}>
                          {i + 1}
                        </span>
                      </div>
                      <div className="col-span-4 flex items-center gap-3">
                        {product.image && (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded-lg bg-ink-700 flex-shrink-0"
                            onError={e => { e.target.style.display = 'none' }}
                          />
                        )}
                        <span className="text-bone font-medium text-sm">{product.name}</span>
                      </div>
                      <div className="col-span-4">
                        <div className="h-2 bg-ink-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${share}%`,
                              background: i === 0
                                ? 'rgb(236,30,39)'
                                : `rgba(236,30,39,${0.7 - i * 0.06})`,
                            }}
                          />
                        </div>
                        <div className="text-bone/30 text-[10px] mt-1">{share.toFixed(1)}% of top</div>
                      </div>
                      <div className="col-span-1 text-right">
                        <div className="text-bone font-semibold text-sm">{formatINRShort(product.revenue)}</div>
                      </div>
                      <div className="col-span-1 text-right">
                        <div className="text-bone/70 text-sm">{product.qty}</div>
                      </div>
                      <div className="col-span-1 text-right">
                        <div className="text-bone/60 text-sm">{product.customers}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
