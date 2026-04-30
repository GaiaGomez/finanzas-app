# Testing

## Summary

**66 passing tests** across 3 files (Vitest). E2E tests exist but are not run in CI.

| Layer | File | Tests |
|---|---|---|
| Unit | `tests/unit/utils.test.ts` | 24 |
| Unit | `tests/unit/calculations.test.ts` | 23 |
| Integration | `tests/integration/useDashboard.test.ts` | 19 |
| E2E | `tests/e2e/dashboard.spec.ts` | local only |

## Unit: `utils.test.ts` (24 tests)

Covers the pure utility functions in `lib/utils.ts`:

- `fmtCOP` — zero, NaN, rounding, large numbers
- `getPeriodo` — returns current `YYYY-MM`
- `getPeriodoLabel` — capitalisation, year presence, uniqueness across months
- `nextPeriodo` / `prevPeriodo` — standard advance/retreat, December wrap, January wrap, leading-zero padding
- Round-trip invariant — `prevPeriodo(nextPeriodo(p)) === p` for four representative inputs

## Unit: `calculations.test.ts` (23 tests)

Covers the pure finance functions in `lib/finance/calculations.ts`:

- `calcTotalIngresos`, `calcTotalFijos`, `calcTotalVars` — sum and empty-array
- `calcGastadoFijos` — filters to paid-only; empty array
- `calcTotalAbonos` — period-matching filter; multi-abono; no-match; empty
- `calcGastado` — three-component sum; all-zero
- `calcDisponible` — normal; negative (overspent)
- `calcPct` — percentage; cap at 100; zero income; zero spend
- `calcCats` — deduplication; empty

## Integration: `useDashboard.test.ts` (19 tests)

Renders `useDashboard` via `renderHook` with controlled initial props. Supabase is mocked with a chainable, `PromiseLike` builder that mirrors the SDK's query API.

**Derived calculations (11 tests):** verifies `totalIngresos`, `gastadoFijos`, `totalFijos`, `totalVars`, `totalAbonos` (period-filtered), `gastado`, `disponible`, `pct` (capped and zero cases), and `cats` uniqueness.

**`toggleFijo` optimistic update (4 tests):** confirms the state flips immediately, `gastadoFijos` updates, the snapshot is restored on DB error, and the function is a no-op for guest users.

**Initial UI state (4 tests):** `tab` starts as `"fijos"`, `setTab` works, `periodo` initialises from `periodoInicial`, `modalIngreso` starts closed.

## E2E: `dashboard.spec.ts` (Playwright)

Tests dashboard load, tab navigation, empty states, guest auth menu, and the income modal. **Not included in CI** — run locally with:

```bash
npm run test:e2e
```

Playwright starts the dev server automatically via `playwright.config.ts`.

## Running tests

```bash
npm test                  # unit + integration, single run
npm run test:watch        # watch mode
npm run test:coverage     # v8 coverage report
npm run test:e2e          # Playwright (local only)
npm run test:e2e:ui       # Playwright interactive UI
```

## CI

GitHub Actions runs `npm test` (unit + integration) on every push and PR to `main`. E2E tests are excluded because they require a running dev server and a browser environment that is not set up in CI.
