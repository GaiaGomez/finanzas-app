// lib/supabase.ts
// Aquí viven los dos clientes de Supabase que necesita Next.js:
// - createBrowserClient: para componentes del lado del cliente (browser)
// - createServerClient: para Server Components y middleware (servidor)

import { createBrowserClient } from "@supabase/ssr";

// Este es el cliente que usas en componentes con "use client"
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
