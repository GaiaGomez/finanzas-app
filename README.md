# Fynt — Tu dinero, bajo control

> Personal finance dashboard for monthly budget tracking, debt management, and savings goals.  
> Built with **Next.js 14 App Router**, **Supabase**, and **TypeScript** — deployed on Vercel.

[**Live Demo →**](https://fyntt.vercel.app) · [Report Bug](https://github.com/GaiaGomez/Fynt_Tu_Dinero_Bajo_Control/issues)

---

## Status

**Active** — core feature set complete. See [Future Improvements](#future-improvements) for planned work.

---

## Screenshots

Screenshots pending — see the [live demo](https://fyntt.vercel.app) to explore the app.

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
- **PWA** — installable on mobile devices with offline shell support (icons pending, see [Known Limitations](#known-limitations))
- **Optimistic UI** — every write updates the UI instantly and rolls back silently on DB error

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 — strict mode, strict typed production code |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Magic Link + email/password) |
| Styling | Tailwind CSS + custom design tokens |
| Fonts | DM Sans + DM Mono (self-hosted via next/font) |
| PWA | next-pwa (enabled in production; disabled in CI via `DISABLE_PWA=true`) |
| Unit/Integration tests | Vitest + React Testing Library |
| E2E tests | Playwright |
| CI | GitHub Actions (lint → test → type-check → build) |
| Deploy | Vercel |
| Node.js | 20 (pinned via `.nvmrc`) |

---

## Project Structure

```
fynt/
├── app/
│   ├── api/auth/callback/       # Supabase auth callback handler
│   ├── dashboard/
│   │   ├── components/          # FijosTab, VariablesTab, DeudasTab,
│   │   │                        # AhorroTab, ResumenTab, MonthSummary,
│   │   │                        # DashboardHeader, IngresoModal, AuthPanel, AboutModal
│   │   ├── hooks/
│   │   │   └── useDashboard.ts  # Central state hook — all CRUD + derived values
│   │   ├── DashboardClient.tsx  # Client entry point, tab router
│   │   ├── error.tsx
│   │   └── page.tsx             # Server Component — SSR data fetch
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── ui/                      # Bar, Dot, Editable — shared primitives
├── lib/
│   ├── finance/
│   │   ├── calculations.ts      # Pure derived-value functions (calcGastado, calcPct…)
│   │   ├── categories.ts        # CATS_FIJOS, CATS_VARIABLES arrays
│   │   └── constants.ts         # LIMITE_VARIABLES_PCT, ALERTA_ROJA, ALERTA_AMBER
│   ├── ui/
│   │   └── classes.ts           # INPUT_CLS, INPUT_CLS_AUTH shared Tailwind strings
│   ├── utils.ts                 # fmtCOP, period math (nextPeriodo, prevPeriodo…), COLOR_CAT
│   ├── supabase.ts              # Browser Supabase client
│   ├── supabase-server.ts       # Server Supabase client (SSR cookies)
│   └── env.ts                   # Environment variable validation
├── types/
│   └── index.ts                 # Domain types: GastoFijo, Deuda, MetaAhorro, AbonoMeta…
├── tests/
│   ├── unit/
│   │   ├── utils.test.ts        # 24 tests — fmtCOP, period helpers, edge cases
│   │   └── calculations.test.ts # 23 tests — calc functions, boundary conditions
│   ├── integration/
│   │   └── useDashboard.test.ts # 19 tests — hook calculations + optimistic updates
│   ├── e2e/
│   │   └── dashboard.spec.ts    # Playwright — navigation, modals, auth flow
│   └── setup.ts
├── supabase/
│   └── schema.sql               # Full DB schema with RLS policies (requires fresh DB)
├── public/
│   └── manifest.json            # PWA manifest (icons not yet added)
├── .github/
│   └── workflows/ci.yml         # GitHub Actions CI
├── middleware.ts                 # Session refresh on every request
├── vitest.config.ts
└── playwright.config.ts
```

---

## Architecture

See [docs/architecture.md](docs/architecture.md) for a full write-up of the key design decisions.

---

## Getting Started

### Prerequisites

- Node.js 20 (see `.nvmrc`; use `nvm use` to switch)
- A [Supabase](https://supabase.com) project with the schema applied

### Installation

```bash
git clone https://github.com/GaiaGomez/Fynt_Tu_Dinero_Bajo_Control.git
cd Fynt_Tu_Dinero_Bajo_Control
nvm use        # requires nvm; ensures Node 20
npm install
```

### Database setup

Run [`supabase/schema.sql`](supabase/schema.sql) in your Supabase project's SQL Editor.
It creates all tables, RLS policies, and the trigger that provisions a user profile on signup.

> **Note:** The schema is written for a clean/fresh database. `CREATE POLICY` statements are not idempotent — re-running on an existing database will fail on policy lines. Drop all tables first if you need to reset.

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
| `npm run build` | Production build (PWA enabled) |
| `DISABLE_PWA=true npm run build` | Build without PWA (used in CI) |
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

**66 tests — all passing.**

| Layer | File | Tests | What's covered |
|---|---|---|---|
| Unit | `utils.test.ts` | 24 | `fmtCOP`, `nextPeriodo`, `prevPeriodo`, `getPeriodoLabel`, `getPeriodo` — edge cases, year boundaries, round-trip invariants |
| Unit | `calculations.test.ts` | 23 | `calcTotalIngresos`, `calcGastadoFijos`, `calcTotalFijos`, `calcTotalVars`, `calcTotalAbonos`, `calcGastado`, `calcDisponible`, `calcPct`, `calcCats` — boundary and empty-array cases |
| Integration | `useDashboard.test.ts` | 19 | `useDashboard` derived calculations (income, spent, available, pct), `toggleFijo` optimistic update and snapshot rollback, initial UI state |
| E2E | `dashboard.spec.ts` | — | Dashboard load, tab navigation, empty states, guest auth menu, income modal — **not run in CI** |

The integration tests mock Supabase with a chainable awaitable builder that mirrors the SDK's `PromiseLike` query API, allowing full optimistic update cycles to be tested without a real database connection.

E2E tests exist but are excluded from CI. Run them locally with `npm run test:e2e`.

See [docs/testing.md](docs/testing.md) for the full testing rationale.

---

## Security

All Supabase tables enforce `auth.uid() = user_id` via Row Level Security at the DB level. The app is safe even if client-side auth checks are bypassed.

See [docs/security.md](docs/security.md) for details.

---

## Known Limitations

- **PWA icons missing** — `public/manifest.json` references `icon-192.png` and `icon-512.png`, but neither file exists. The app installs as a PWA but without a home-screen icon on iOS/Android.
- **E2E tests not in CI** — Playwright tests are local-only; CI runs lint, unit/integration tests, type-check, and build only.
- **Schema not idempotent** — `supabase/schema.sql` requires a clean Supabase project. Re-running on an existing database will fail on `CREATE POLICY` statements.

---

## Future Improvements

- Add PWA icons (192×192 and 512×512) to enable proper home-screen installation
- Authenticated E2E tests — add/edit/delete flows with a seeded test user
- Monthly trend charts — spending over time per category
- Budget alerts — push notifications for unpaid fixed expenses near month end
- CSV / PDF export — monthly summary for personal records
- Multi-currency support — currently formats everything in COP (Colombian peso)

---

## Author

**Gaia Gómez**  
Software Engineering Student & Full Stack Developer  
[GitHub](https://github.com/GaiaGomez) · [Live Demo](https://fyntt.vercel.app)
