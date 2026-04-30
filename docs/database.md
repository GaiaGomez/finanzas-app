# Database

## Overview

Fynt uses a Supabase (PostgreSQL) project. The full schema is in [`supabase/schema.sql`](../supabase/schema.sql).

> **Important:** The schema is written for a clean/fresh database. `CREATE POLICY` statements are not idempotent — re-running on an existing database will fail. Drop all tables first if you need to reset.

## Tables

| Table | Purpose |
|---|---|
| `perfiles` | One row per user; stores display name and a default income amount |
| `gastos_fijos` | Fixed (recurring) expenses, scoped by `user_id` and `periodo` |
| `gastos_variables` | Daily variable spending, scoped by `user_id` and `periodo` |
| `ingresos` | Income entries, scoped by `user_id` and `periodo` |
| `deudas` | Debt records with a total amount |
| `abonos` | Payments toward a specific debt; linked to `deudas` via `deuda_id` |
| `metas_ahorro` | Savings goals with a target and a cached running total (`monto_actual`) |
| `abonos_meta` | Individual deposits toward a savings goal |

## `periodo` column convention

All time-scoped tables use a `text` column in `YYYY-MM` format (e.g. `"2026-04"`). String comparison is used for filtering and navigation.

## `monto_actual` caching pattern

`metas_ahorro.monto_actual` is a denormalised sum of all `abonos_meta.monto` for that goal. The app recalculates and persists it on every insert/delete of a deposit. This avoids a `SUM` aggregation on each render while keeping the deposit audit trail in `abonos_meta`.

## Indexes

Compound indexes on `(user_id, periodo)` for the three period-scoped tables (`gastos_fijos`, `gastos_variables`, `ingresos`) keep per-user per-month queries fast. Single-column indexes on all foreign keys.

## Row Level Security

RLS is enabled on every table. All policies enforce `auth.uid() = user_id` (or the equivalent FK chain for `abonos` and `abonos_meta`). See [docs/security.md](security.md) for details.

## Trigger

A `AFTER INSERT ON auth.users` trigger calls `handle_new_user()`, which inserts a row into `perfiles` for every new signup. This guarantees every authenticated user has a profile.

## Applying the schema

1. Open your Supabase project → SQL Editor → New query.
2. Paste the contents of `supabase/schema.sql` and run.
3. This creates all tables, enables RLS, creates all policies, creates indexes, and installs the trigger.
