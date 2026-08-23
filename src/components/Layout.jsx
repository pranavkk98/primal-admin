import Sidebar from './Sidebar.jsx'
import ChatPanel from './ChatPanel.jsx'
import { usePage } from '../context/RouterContext.jsx'

export default function Layout({ children }) {
  const { page } = usePage()
  const showChat = page !== 'chat' && page !== 'login'

  return (
    <div className="flex h-screen bg-ink overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {children}
        </div>
      </main>
      {showChat && <ChatPanel />}
    </div>
  )
}
