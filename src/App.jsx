import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { RouterProvider, usePage } from './context/RouterContext.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Customers from './pages/Customers.jsx'
import Orders from './pages/Orders.jsx'
import Products from './pages/Products.jsx'
import Ads from './pages/Ads.jsx'
import Spend from './pages/Spend.jsx'
import Chat from './pages/Chat.jsx'

function Shell() {
  const { page } = usePage()
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-primal flex items-center justify-center">
            <span className="font-display text-bone text-xl">P</span>
          </div>
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-amber/60 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user || page === 'login') return <Login />

  const pages = {
    dashboard: <Dashboard />,
    customers: <Customers />,
    orders: <Orders />,
    products: <Products />,
    ads: <Ads />,
    spend: <Spend />,
    chat: <Chat />,
  }

  return (
    <Layout>
      {pages[page] || <Dashboard />}
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <Shell />
      </RouterProvider>
    </AuthProvider>
  )
}
