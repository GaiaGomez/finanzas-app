# Fynt — Tu dinero, bajo control

> Full-stack personal finance web application built with Next.js, Supabase, and TypeScript.

[Live Demo](https://fyntt.vercel.app) · [Report Bug](https://github.com/GaiaGomez/Fynt_Tu_Dinero_Bajo_Control/issues)

## Preview
![Dashboard preview](./docs/preview.png)

## Features
- Monthly budget tracking with fixed and variable expense categories
- Debt payoff tracker with payment history and progress visualization
- Financial summary with real-time cash flow breakdown
- Auto-copy fixed expenses when creating new months
- Google OAuth and Magic Link authentication via Supabase
- Installable as PWA on mobile devices
- Dark theme UI with custom design system

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (zero `any`) |
| Database & Auth | Supabase (PostgreSQL + RLS + SSR Auth) |
| Styling | Tailwind CSS + custom design tokens |
| Deploy | Vercel |
| PWA | next-pwa |

## Architecture Highlights
- Server Components for initial data loading (zero client-side waterfalls)
- Row Level Security on all Supabase tables
- Edge middleware for route protection
- Modular component structure with custom hooks

## Getting Started
1. Clone the repo
2. `npm install`
3. Copy `.env.example` to `.env.local` and fill in your Supabase credentials
4. `npm run dev`

## Demo Mode
The live demo uses a read-only guest account. To seed it in your own Supabase project:

```bash
# Add SUPABASE_SERVICE_ROLE_KEY to your .env.local (from Supabase → Settings → API)
npx tsx scripts/seed-demo.ts
```

The script is idempotent — running it again resets the demo data.

## Environment Variables
See `.env.example` for required variables.

## Author
**Gaia Gómez** — Software Engineering Student & Full Stack Developer
