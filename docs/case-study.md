# Case Study: Fynt

## Problem

Tracking personal finances across fixed bills, daily spending, debts, and savings goals in a single view — without a spreadsheet and without syncing to a bank.

## Solution

A single-page dashboard organised into five tabs (Fixed, Variable, Debts, Savings, Summary). Each tab surfaces a different spending dimension; the Summary tab integrates all of them into an income vs. spend vs. available breakdown.

## Technical choices and trade-offs

### Next.js App Router + Server Components

The dashboard page fetches all 7 data sources in a single `Promise.all` before sending HTML. The user sees a fully populated page on first load with no client-side loading skeletons. The trade-off is that navigation to a new month triggers a full server round-trip — acceptable at this scale.

### Single `useDashboard` hook

All client state and CRUD operations live in one hook (~500 lines). This keeps the component tree shallow and avoids a global store. The trade-off: the hook is large. At a larger scale, splitting by domain (fijos, deudas, metas) would be cleaner.

### Optimistic UI without a mutation library

Every write optimistically updates the local array, persists to Supabase, and rolls back on error. This was implemented manually without React Query or SWR. The benefit is full control over rollback behaviour and no extra dependency. The cost is that each CRUD operation is boilerplate-heavy.

### Supabase RLS as the only auth boundary

There is no server-side API layer. Client code talks directly to Supabase using the anon key. Security relies entirely on RLS policies enforced by PostgreSQL. This is the intended Supabase architecture and appropriate for a single-user personal tool.

### `periodo` as a string key

Using `YYYY-MM` strings for period scoping avoids timezone issues that arise when storing dates and comparing them across months. String comparison (`===`, `startsWith`) is sufficient for all filtering and navigation operations.

## What I would do differently

- **Split `useDashboard` by domain** — `useFijos`, `useDeudas`, `useMetas` — to reduce cognitive load per file.
- **Add PWA icons** — the manifest references icons that don't exist yet, degrading the install experience on mobile.
- **Authenticated E2E tests** — the Playwright suite currently only tests unauthenticated/guest views; seeded user tests would cover the full add/edit/delete flows.
- **Period navigation via URL** — storing `periodo` in a search param would make shareable and bookmarkable monthly views possible.

## Outcome

A working, deployed personal finance tool with 66 passing tests, active CI, strict TypeScript, and RLS-enforced data isolation.
