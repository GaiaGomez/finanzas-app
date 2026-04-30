# Security

## Row Level Security

Every Supabase table has RLS enabled. All policies enforce ownership at the database level — not in application code — so the app is safe even if client-side auth checks are bypassed or the anon key is exposed.

| Table | Policy rule |
|---|---|
| `perfiles` | `auth.uid() = id` |
| `gastos_fijos` | `auth.uid() = user_id` (select, insert, update, delete) |
| `gastos_variables` | `auth.uid() = user_id` (select, insert, update, delete) |
| `ingresos` | `auth.uid() = user_id` (select, insert, delete) |
| `deudas` | `auth.uid() = user_id` (select, insert, update, delete) |
| `abonos` | `auth.uid() = user_id` + parent `deuda` must also belong to the same user on insert |
| `metas_ahorro` | `auth.uid() = user_id` (select, insert, update, delete) |
| `abonos_meta` | `auth.uid() = user_id` + parent `meta_ahorro` must also belong to the same user on insert |

The cross-ownership check on `abonos` and `abonos_meta` inserts prevents a user from posting a payment against another user's debt or savings goal even if they somehow know the target ID.

## Authentication

Supabase Auth handles authentication. Two methods are available:

- **Magic Link** — passwordless, email-only
- **Email + Password** — standard credentials flow

Sessions are stored in cookies and refreshed on every request via `middleware.ts`. The server-side Supabase client (`lib/supabase-server.ts`) reads and writes these cookies using `@supabase/ssr`.

## Environment variables

Only two environment variables are required and both are public (`NEXT_PUBLIC_`). They are safe to expose to the browser because Supabase's security model relies on RLS, not on keeping the anon key secret.

| Variable | Exposure |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public — client + server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public — client + server |

No server-only secrets are required. `lib/env.ts` validates both variables at startup and throws a descriptive error if either is missing.

## TypeScript strict mode

The codebase compiles with `"strict": true` in `tsconfig.json`. No explicit `any` types are used in production code, reducing the surface area for type-confusion bugs.
