# Primal Admin — Analytics Dashboard

Admin analytics dashboard for Primal Nutrition. Built with Vite 5 + React 18 + Tailwind 3. Mirrors the primal-revamp brand palette.

## Quick Start (Mock Mode — works immediately, no backend needed)

```bash
cd /Users/pranavkochhar/primal-admin
npm install
npm run dev
```

Open http://localhost:5173 — the dashboard is fully populated with 50 realistic customers, 200 orders, and a working AI chat panel. No Supabase or backend configuration needed.

Mock mode is on by default (`VITE_MOCK=1` in `.env`).

## Real Mode (Supabase + Backend)

1. Copy `.env.example` to `.env`
2. Fill in your Supabase project URL and anon key
3. Fill in the backend URL (Render deploy of `primal-revamp-api/`)
4. Set `VITE_MOCK=0`
5. Create an admin user in Supabase Auth, then add a row to `admin_users` with `role='admin'`
6. `npm run dev`

## Deploy to Netlify

1. Connect this repository to Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Set environment variables in Netlify dashboard:
   - `VITE_API_BASE_URL` — your Render backend URL
   - `VITE_SUPABASE_URL` — your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` — your Supabase anon key
   - `VITE_MOCK` — set to `0` for production

## Project Structure

```
src/
  lib/
    api.js          — fetch wrapper with auto-Bearer auth; routes to mockApi when VITE_MOCK=1
    supabase.js     — anon client for auth
    mockApi.js      — complete mock layer: 50 customers, 200 orders, analytics, chat
    format.js       — ₹ currency, relative dates, status pills
  context/
    AuthContext.jsx — session state, login/logout; auto-login in mock mode
    RouterContext.jsx — hash-based router (dashboard/customers/orders/products/chat)
  components/
    Layout.jsx        — sidebar + header + main wrapper
    Sidebar.jsx       — brand nav
    KpiCard.jsx       — big-number card with trend
    StatusPill.jsx    — active/dormant/churned/delivered/etc pill
    RevenueChart.jsx  — Recharts line chart
    TopProductsChart.jsx — Recharts bar chart
    DataTable.jsx     — generic paginated table
    CustomerDrawer.jsx — slide-in customer profile + order history
    OrderDrawer.jsx   — slide-in order details + line items
    ChatPanel.jsx     — floating FAB chatbot widget
    ChatMessage.jsx   — user/assistant bubbles with SQL + results
    EmptyState.jsx    — empty state illustration
  pages/
    Login.jsx      — email/password; auto-passes in mock mode
    Dashboard.jsx  — KPI cards + revenue chart + top products + recent orders
    Customers.jsx  — search + filter + paginated table
    Orders.jsx     — status filter + date range + table
    Products.jsx   — ranked product performance
    Chat.jsx       — full-page chat interface
```

## Pages

- **Dashboard** — Revenue 30d, Orders 30d, AOV, Active Customers + charts + recent orders
- **Customers** — Search by name/email, filter by status (Active/Dormant/Churned), click any row to open full profile drawer
- **Orders** — Filter by status + date range, click row for order detail drawer with line items
- **Products** — Bar chart + table of product performance (revenue, units, customers)
- **Chat** — AI-powered analytics chat. Ask natural language questions, get SQL + results + summary

## Chat Examples

- "Top products this month" — revenue ranking
- "Dormant customers" — customers who haven't ordered in 60-180 days
- "Best spenders" — highest lifetime value customers
- "Delete all orders" — safely rejected with SQL_REJECTED error
