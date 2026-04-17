# Fynt

Dashboard financiero personal con login, offline (PWA) y multi-usuario.

## Stack
- **Next.js 14** + TypeScript
- **Tailwind CSS**
- **Supabase** (DB + Auth)
- **next-pwa** (offline)
- **Vercel** (deploy)

## Setup paso a paso

### 1. Clonar e instalar
```bash
git clone <tu-repo>
cd finanzas-app
npm install
```

### 2. Variables de entorno
Copia `.env.example` a `.env.local` y llena tus claves de Supabase:
```
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...TU_ANON_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Base de datos
Ve a **Supabase → SQL Editor** y corre todo el contenido de `supabase/schema.sql`

### 4. Auth con Google (opcional)
Ve a **Supabase → Authentication → Providers → Google**
Necesitas un Client ID y Secret de Google Cloud Console.

### 5. Correr en local
```bash
npm run dev
```
Abre http://localhost:3000

### 6. Deploy en Vercel
```bash
# Conecta tu repo de GitHub a Vercel
# En Vercel → Settings → Environment Variables agrega las mismas del .env.local
# Cambia NEXT_PUBLIC_APP_URL a tu URL de Vercel
```

En Supabase → Authentication → URL Configuration agrega:
- Site URL: `https://fyntt.vercel.app`
- Redirect URLs: `https://fyntt.vercel.app/api/auth/callback`

## Estructura
```
app/
  auth/          → Login page
  dashboard/     → Dashboard (Server + Client)
  api/auth/      → Callback de OAuth
components/
  ui/            → Bar, Dot, Editable
lib/
  supabase.ts    → Cliente browser
  supabase-server.ts → Cliente servidor
  utils.ts       → fmtCOP, colores, quincena
types/           → TypeScript types
supabase/
  schema.sql     → Tablas + RLS + trigger
middleware.ts    → Protección de rutas
```
