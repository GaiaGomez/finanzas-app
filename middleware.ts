// middleware.ts — se ejecuta en CADA request antes de que llegue a la página
// Su trabajo: verificar si hay sesión activa
// Si no hay sesión y la ruta es protegida → redirige a /auth
// Si hay sesión y la ruta es /auth → redirige a /dashboard

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Obtener usuario actual — si no hay sesión, user es null
  const { data: { user } } = await supabase.auth.getUser();
  const url = request.nextUrl.clone();
  const isAuth = url.pathname.startsWith("/auth");
  const isDashboard = url.pathname.startsWith("/dashboard");

  // Sin sesión intentando entrar al dashboard → manda a login
  if (!user && isDashboard) {
    url.pathname = "/auth";
    return NextResponse.redirect(url);
  }

  // Con sesión intentando entrar a login → manda al dashboard
  if (user && isAuth) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

// Le dice a Next.js en qué rutas correr el middleware
export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*", "/auth"],
};
