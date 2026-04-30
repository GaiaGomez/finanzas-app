# Architecture

## Overview

Fynt is a Next.js 14 App Router application with a single-page dashboard. The architecture is deliberately flat: one server component fetches data, one client hook owns all state, and components are pure presentational leaves.

## Data flow

```
Supabase DB
    │
    ▼
app/dashboard/page.tsx          ← Server Component: parallel SSR fetch
    │  (props)
    ▼
app/dashboard/DashboardClient.tsx  ← Client boundary, tab router
    │  (hook return)
    ▼
useDashboard.ts                 ← All state, CRUD, derived values
    │  (typed props)
    ▼
FijosTab / VariablesTab / …     ← Pure presentational components
```

## Key decisions

### Server Component for initial data load

`app/dashboard/page.tsx` fetches all 7 data sources in a single `Promise.all` before sending HTML. There is no client-side waterfall on first render. The server-side Supabase client reads the session from cookies via `@supabase/ssr`.

### Single `useDashboard` hook as state layer

All client state, derived calculations, and CRUD operations live in one hook. Components receive typed props only — no intermediate prop drilling and no global store needed at this scale. Derived values (`gastado`, `disponible`, `pct`, `cats`) are computed with pure functions from `lib/finance/calculations.ts` and are recalculated on every render from the live state arrays.

### Optimistic updates with snapshot rollback

Every mutation updates local state immediately, then awaits the DB call. On error, the pre-mutation snapshot is restored and an `error` string is surfaced to the UI. No loading spinners for writes.

### `periodo` as a plain `YYYY-MM` string key

All time-scoped tables use a text `periodo` column. String comparison is sufficient for navigation, filtering, and auto-copy logic — no `Date` parsing complexity.

### `monto_actual` as a cached derived value

Savings goals store the running total (`monto_actual`) alongside individual deposit records (`abonos_meta`). It is recalculated and synced on every insert/delete — avoids a `SUM` query on every render while keeping deposit history auditable.

## Module layout

| Path | Responsibility |
|---|---|
| `lib/utils.ts` | Pure formatting and period math (`fmtCOP`, `nextPeriodo`, `COLOR_CAT`) |
| `lib/finance/calculations.ts` | Pure derived-value functions (`calcGastado`, `calcPct`, …) |
| `lib/finance/categories.ts` | Category enums (`CATS_FIJOS`, `CATS_VARIABLES`) |
| `lib/finance/constants.ts` | Alert thresholds (`ALERTA_ROJA`, `ALERTA_AMBER`) |
| `lib/ui/classes.ts` | Shared Tailwind input class strings (`INPUT_CLS`) |
| `lib/supabase.ts` | Browser Supabase client |
| `lib/supabase-server.ts` | Server Supabase client (SSR cookie adapter) |
| `lib/env.ts` | Environment variable validation at startup |
| `types/index.ts` | Domain interfaces (`GastoFijo`, `Deuda`, `MetaAhorro`, …) |
| `middleware.ts` | Session refresh on every request |

## CI

GitHub Actions runs on every push/PR to `main`: lint → test → type-check → build. The build step sets `DISABLE_PWA=true` to skip `next-pwa`'s service-worker generation, which requires network access not available in CI runners. PWA is enabled by default in production.
