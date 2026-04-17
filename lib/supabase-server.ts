// lib/supabase-server.ts — cliente de Supabase para Server Components (usa cookies de sesión)
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export function createServerSupabase() {
  const cookieStore = cookies();
  return createServerClient(
    env.supabaseUrl,
    env.supabaseKey,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}
