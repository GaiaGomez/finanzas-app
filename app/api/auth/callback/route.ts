// app/api/auth/callback/route.ts
// Supabase redirige aquí después de confirmar email o usar magic link
// Este endpoint intercambia el "code" temporal por una sesión real

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      env.supabaseUrl,
      env.supabaseKey,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );
    // Intercambia el code por una sesión — Supabase guarda la sesión en cookies
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
