# Fynt — Tu dinero, bajo control

> Full-stack personal finance dashboard built with Next.js 14, Supabase, and TypeScript.

[Live Demo](https://fyntt.vercel.app) · [Report Bug](https://github.com/GaiaGomez/Fynt_Tu_Dinero_Bajo_Control/issues)

## Features
- Monthly budget tracking with fixed and variable expense categories
- Debt payoff tracker with payment history and progress bars
- Savings goals with incremental deposit tracking
- Financial summary with real-time cash flow breakdown
- Auto-copies fixed expenses when navigating to a new month
- Magic Link and email/password authentication via Supabase
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
- Server Components for initial data load — zero client-side waterfalls
- Row Level Security on all Supabase tables
- Edge middleware for session refresh and route protection
- Modular component structure with a single `useDashboard` hook as state layer
- Optimistic UI updates with rollback on DB errors

## Getting Started
1. Clone the repo
2. `npm install`
3. Copy `.env.example` to `.env.local` and fill in your Supabase credentials
4. `npm run dev`

## Environment Variables
See `.env.example` for required variables.

## Author
**Gaia Gómez** — Software Engineering Student & Full Stack Developer
