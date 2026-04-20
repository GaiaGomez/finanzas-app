# Fynt — Tu dinero, bajo control

> Personal finance dashboard for monthly budget tracking, debt management, and savings goals.  
> Built with **Next.js 14 App Router**, **Supabase**, and **TypeScript** — deployed on Vercel.

[**Live Demo →**](https://fyntt.vercel.app) · [Report Bug](https://github.com/GaiaGomez/Fynt_Tu_Dinero_Bajo_Control/issues)

---

## Status

**Active** — core feature set complete. See [Future Improvements](#future-improvements) for planned work.

---

## Features

- **Monthly budget periods** — navigate months freely; fixed expenses auto-copy to new periods
- **Fixed expenses** — categorized recurring costs with paid/unpaid toggle and inline editing
- **Variable expenses** — daily spending log grouped by category
- **Income tracking** — register multiple income sources per period with descriptions
- **Debt tracker** — track total debt, log individual payments, and see payoff progress
- **Savings goals** — set targets, log deposits with notes, and track history per goal
- **Financial summary** — real-time breakdown of income vs. committed vs. spent vs. available
- **Auth** — Magic Link and email/password via Supabase; SSR session handling
- **PWA** — installable on mobile devices with offline shell support
- **Optimistic UI** — every write updates the UI instantly and rolls back silently on DB error

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 — strict mode, zero `any` |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Magic Link + email/password) |
| Styling | Tailwind CSS + custom design tokens |
| Fonts | DM Sans + DM Mono (self-hosted via next/font) |
| PWA | next-pwa |
| Unit/Integration tests | Vitest + React Testing Library |
| E2E tests | Playwright |
| Deploy | Vercel |

---

## Project Structure

```
fynt/
├── app/
│   ├── api/auth/                # Supabase auth callback handler
│   ├── dashboard/
│   │   ├── components/          # FijosTab, VariablesTab, DeudasTab,
│   │   │                        # AhorroTab, ResumenTab, MonthSummary,
│   │   │                        # DashboardHeader, IngresoModal, AuthPanel, AboutModal
│   │   ├── hooks/
│   │   │   └── useDashboard.ts  # Central state hook — all CRUD + derived values
│   │   ├── DashboardClient.tsx  # Client entry point, tab router
│   │   └── page.tsx             # Server Component — SSR data fetch
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── utils.ts                 # Pure functions: fmtCOP, period math, color map
│   ├── constants.ts             # Categories, alert thresholds, shared input styles
│   ├── supabase.ts              # Browser Supabase client
│   ├── supabase-server.ts       # Server Supabase client (SSR cookies)
│   └── env.ts                   # Environment variable validation
├── types/
│   └── index.ts                 # Domain types: GastoFijo, Deuda, MetaAhorro, AbonoMeta…
├── tests/
│   ├── unit/
│   │   └── utils.test.ts        # 29 tests — pure function coverage
│   ├── integration/
│   │   └── useDashboard.test.ts # 14 tests — hook calculations + optimistic updates
│   ├── e2e/
│   │   └── dashboard.spec.ts    # 7 tests — navigation, modals, auth flow
│   └── setup.ts
├── supabase/
│   └── schema.sql               # Full DB schema with RLS policies
├── middleware.ts                 # Session refresh on every request
├── vitest.config.ts
└── playwright.config.ts
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project with the schema applied

### Installation

```bash
git clone https://github.com/GaiaGomez/Fynt_Tu_Dinero_Bajo_Control.git
cd Fynt_Tu_Dinero_Bajo_Control
npm install
```

### Database setup

Run [`supabase/schema.sql`](supabase/schema.sql) in your Supabase project's SQL editor.  
It creates all tables, RLS policies, and the trigger that provisions a user profile on signup.

### Environment variables

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

### Run locally

```bash
npm run dev
```

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint via `next lint` |
| `npm run type-check` | TypeScript check without emitting |
| `npm test` | Vitest unit + integration (single run) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:coverage` | Vitest with v8 coverage report |
| `npm run test:e2e` | Playwright E2E (starts dev server automatically) |
| `npm run test:e2e:ui` | Playwright with interactive UI |

---

## Testing

**50 tests — all passing.**

| Layer | Runner | Tests | What's covered |
|---|---|---|---|
| Unit | Vitest | 29 | `fmtCOP`, `nextPeriodo`, `prevPeriodo`, `getPeriodoLabel`, `getPeriodo` — edge cases, year boundaries, round-trip invariants |
| Integration | Vitest + RTL | 14 | `useDashboard` derived calculations (income, spent, available, pct), `toggleFijo` optimistic update and snapshot rollback, initial UI state |
| E2E | Playwright | 7 | Dashboard load, tab navigation, empty states, guest auth menu, income modal |

The integration tests mock Supabase with a chainable awaitable builder that mirrors the SDK's `PromiseLike` query API — allowing full optimistic update cycles to be tested without a real database connection.

---

## Technical Decisions

**Server Components for initial data load**  
`app/dashboard/page.tsx` fetches all 7 data sources in a single `Promise.all` before sending HTML. No client-side waterfall on first render.

**Single `useDashboard` hook as state layer**  
All client state, derived calculations, and CRUD operations live in one hook. Components receive typed props only — no intermediate prop drilling and no global store needed at this scale.

**Optimistic updates with snapshot rollback**  
Every mutation updates local state immediately, then awaits the DB call. On error, the pre-mutation snapshot is restored and an error banner is shown. No loading spinners for writes.

**`periodo` as a plain string key (`YYYY-MM`)**  
All time-scoped tables use a text period column. String comparison is sufficient for navigation, filtering, and auto-copy logic — no date parsing complexity.

**Row Level Security on every table**  
All Supabase tables enforce `auth.uid() = user_id` at the DB level. The app is safe even if client-side auth checks were bypassed.

**`monto_actual` as a cached derived value**  
Savings goals store the running total (`monto_actual`) alongside individual deposit records (`abonos_meta`). It's recalculated and synced on every insert/delete — avoids a `SUM` query on every render while keeping deposit history auditable.

---

## Future Improvements

- Authenticated E2E tests — add/edit/delete flows with a seeded test user
- CI pipeline — GitHub Actions running `type-check`, `test`, and `test:e2e` on every PR
- Monthly trend charts — spending over time per category
- Budget alerts — push notifications for unpaid fixed expenses near month end
- CSV / PDF export — monthly summary for personal records
- Multi-currency support — currently formats everything in COP (Colombian peso)

---

## Author

**Gaia Gómez**  
Software Engineering Student & Full Stack Developer  
[GitHub](https://github.com/GaiaGomez) · [Live Demo](https://fyntt.vercel.app)
