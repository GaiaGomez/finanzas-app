"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo";

type Modo = "login" | "registro" | "magic";

export default function AuthPage() {
  const supabase = createClient();
  const [modo, setModo]         = useState<Modo>("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre]     = useState("");
  const [loading, setLoading]     = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [sent, setSent]           = useState(false);
  const [error, setError]         = useState("");
  const [heroError, setHeroError] = useState("");
  const [success, setSuccess]     = useState("");

  function reset() { setError(""); setSuccess(""); setSent(false); }

  function parseAuthError(error: { message: string; status?: number }): string {
    const msg = error.message ?? "";
    if (msg.includes("rate limit") || msg.includes("over_email_send_rate_limit"))
      return "Demasiados intentos. Espera unos minutos antes de volver a intentarlo.";
    if (msg.includes("Invalid login") || msg.includes("invalid_credentials"))
      return "Email o contraseña incorrectos.";
    if (msg.includes("Email not confirmed"))
      return "Debes confirmar tu email antes de iniciar sesión. Revisa tu bandeja.";
    if (msg.includes("User already registered"))
      return "Ya existe una cuenta con ese email. Intenta iniciar sesión.";
    if (msg.includes("Password should be"))
      return "La contraseña es demasiado corta (mínimo 6 caracteres).";
    if (msg.includes("Unable to validate email"))
      return "Email inválido. Verifica que esté bien escrito.";
    return msg || "Ocurrió un error. Intenta de nuevo.";
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true); reset();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(parseAuthError(error));
    } else {
      window.location.href = "/dashboard";
    }
    setLoading(false);
  }

  async function handleRegistro(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password || !nombre) return;
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return; }
    setLoading(true); reset();
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: nombre }, emailRedirectTo: `${window.location.origin}/api/auth/callback` },
    });
    if (error) { setError(parseAuthError(error)); }
    else if (data.user && data.user.identities?.length === 0) {
      setError("Ya existe una cuenta con ese email. Intenta iniciar sesión.");
    } else { setSuccess("¡Cuenta creada! Revisa tu email para confirmarla."); }
    setLoading(false);
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true); reset();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
    });
    if (error) { setError(parseAuthError(error)); }
    else { setSent(true); }
    setLoading(false);
  }

  async function handleGoogle() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
    if (error) { setError(parseAuthError(error)); setLoading(false); }
  }

  async function handleDemo(source: "hero" | "form" = "form") {
    setDemoLoading(true);
    if (source === "hero") setHeroError(""); else { reset(); }
    const { error } = await supabase.auth.signInWithPassword({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });
    if (error) {
      const msg = "No se pudo cargar el demo. Intenta de nuevo.";
      if (source === "hero") setHeroError(msg); else setError(msg);
      setDemoLoading(false);
      return;
    }
    window.location.href = "/dashboard";
  }

  function scrollToAuth(e: React.MouseEvent) {
    e.preventDefault();
    document.getElementById("auth")?.scrollIntoView({ behavior: "smooth" });
  }

  const inputCls = "bg-[#1a1730] border border-[#2a2440] rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-purple transition-colors text-white placeholder:text-brand-muted w-full";

  return (
    <div className="min-h-screen bg-brand-bg text-white" style={{ scrollBehavior: "smooth" }}>

      {/* ── HERO ── */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 py-20 relative overflow-hidden">
        {/* subtle radial glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(167,139,250,0.12) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 w-full max-w-4xl flex flex-col items-center text-center gap-8">
          <p className="text-xs text-brand-purple uppercase tracking-widest font-semibold">
            Dashboard Financiero Personal
          </p>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight">
            Tu dinero,{" "}
            <span className="text-brand-purple">bajo control</span>
          </h1>

          <p className="text-lg sm:text-xl text-brand-muted max-w-xl leading-relaxed">
            Presupuesta, rastrea deudas y visualiza tu progreso financiero mes a mes.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
            <a
              href="#auth"
              onClick={scrollToAuth}
              className="px-8 py-3.5 bg-brand-purple text-brand-bg font-bold rounded-xl text-sm hover:opacity-90 transition-opacity text-center"
            >
              Comenzar gratis
            </a>
            <button
              onClick={() => handleDemo("hero")}
              disabled={demoLoading}
              className="px-8 py-3.5 border border-brand-border text-white font-bold rounded-xl text-sm hover:border-brand-purple/60 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {demoLoading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <span className="text-base leading-none">▶</span>
              }
              {demoLoading ? "Cargando…" : "Explorar demo"}
            </button>
          </div>
          {heroError && (
            <p className="text-brand-red text-xs text-center">{heroError}</p>
          )}

          {/* Dashboard mockup placeholder */}
          <div className="w-full max-w-3xl mt-4 rounded-2xl border border-brand-border bg-brand-card overflow-hidden shadow-2xl">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-brand-border">
              <span className="w-3 h-3 rounded-full bg-[#f87171]/60" />
              <span className="w-3 h-3 rounded-full bg-[#fbbf24]/60" />
              <span className="w-3 h-3 rounded-full bg-[#4ade80]/60" />
            </div>
            {/* Replace src with your actual screenshot */}
            <div className="w-full aspect-video bg-[#1a1730] flex items-center justify-center">
              <p className="text-brand-muted text-sm">[ screenshot del dashboard ]</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-center mb-4 tracking-tight">
            Todo lo que necesitas
          </h2>
          <p className="text-brand-muted text-center mb-14 max-w-md mx-auto">
            Una sola app para mantener tus finanzas personales ordenadas y visibles.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-brand-card border border-brand-border rounded-2xl p-6 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-purple/10 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-purple">
                  <rect x="2" y="5" width="20" height="14" rx="2"/>
                  <line x1="2" y1="10" x2="22" y2="10"/>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-base mb-1">Presupuesto mensual</h3>
                <p className="text-brand-muted text-sm leading-relaxed">
                  Organiza gastos fijos y variables con tracking de pagos y estado al instante.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-brand-card border border-brand-border rounded-2xl p-6 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-green/10 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-green">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                  <polyline points="16 7 22 7 22 13"/>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-base mb-1">Control de deudas</h3>
                <p className="text-brand-muted text-sm leading-relaxed">
                  Visualiza el progreso de pago de cada deuda con historial detallado de abonos.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-brand-card border border-brand-border rounded-2xl p-6 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-yellow/10 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-yellow">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-base mb-1">Resumen financiero</h3>
                <p className="text-brand-muted text-sm leading-relaxed">
                  Flujo de caja, diagnóstico de salud y tendencias mes a mes en un solo vistazo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── AUTH ── */}
      <section id="auth" className="py-24 px-6 flex justify-center">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <p className="text-xs text-brand-purple uppercase tracking-widest mb-2">Empieza ahora</p>
            <h2 className="text-2xl font-extrabold tracking-tight">Accede a tu cuenta</h2>
          </div>

          <div className="bg-brand-card border border-brand-border rounded-2xl p-6 flex flex-col gap-4">

            {/* Tabs */}
            <div className="flex gap-1 bg-[#1a1730] rounded-xl p-1">
              {([["login","Entrar"],["registro","Registro"],["magic","Magic Link"]] as const).map(([m, l]) => (
                <button key={m} onClick={() => { setModo(m); reset(); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    modo === m ? "bg-brand-purple text-brand-bg" : "text-brand-muted hover:text-white"
                  }`}>{l}</button>
              ))}
            </div>

            {/* Google */}
            <button onClick={handleGoogle} disabled={loading}
              className="flex items-center justify-center gap-3 w-full py-3 rounded-xl border border-brand-border hover:border-brand-purple transition-colors font-semibold text-sm disabled:opacity-50">
              <svg width="16" height="16" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
              </svg>
              Continuar con Google
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-brand-border"/>
              <span className="text-brand-muted text-xs">o con email</span>
              <div className="flex-1 h-px bg-brand-border"/>
            </div>

            {/* Login */}
            {modo === "login" && (
              <form onSubmit={handleLogin} className="flex flex-col gap-3">
                <label className="sr-only" htmlFor="login-email">Email</label>
                <input id="login-email" type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} required />
                <label className="sr-only" htmlFor="login-password">Contraseña</label>
                <input id="login-password" type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} className={inputCls} required />
                {error && <p className="text-brand-red text-xs">{error}</p>}
                <button type="submit" disabled={loading || !email || !password}
                  className="bg-brand-purple text-brand-bg font-bold py-3 rounded-xl text-sm disabled:opacity-50">
                  {loading ? "Entrando…" : "Iniciar sesión"}
                </button>
                <button type="button" onClick={() => { setModo("registro"); reset(); }}
                  className="text-brand-muted text-xs text-center">
                  ¿No tienes cuenta? <span className="text-brand-purple font-semibold">Regístrate</span>
                </button>
              </form>
            )}

            {/* Registro */}
            {modo === "registro" && (
              <form onSubmit={handleRegistro} className="flex flex-col gap-3">
                {success ? (
                  <div className="text-center py-3">
                    <p className="text-2xl mb-2">📬</p>
                    <p className="font-semibold text-brand-green text-sm">{success}</p>
                  </div>
                ) : (
                  <>
                    <label className="sr-only" htmlFor="reg-nombre">Nombre</label>
                    <input id="reg-nombre" type="text" placeholder="Tu nombre" value={nombre} onChange={e => setNombre(e.target.value)} className={inputCls} required />
                    <label className="sr-only" htmlFor="reg-email">Email</label>
                    <input id="reg-email" type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} required />
                    <label className="sr-only" htmlFor="reg-password">Contraseña</label>
                    <input id="reg-password" type="password" placeholder="Contraseña (mín. 6 caracteres)" value={password} onChange={e => setPassword(e.target.value)} className={inputCls} required />
                    {error && <p className="text-brand-red text-xs">{error}</p>}
                    <button type="submit" disabled={loading || !email || !password || !nombre}
                      className="bg-brand-green text-brand-bg font-bold py-3 rounded-xl text-sm disabled:opacity-50">
                      {loading ? "Creando…" : "Crear cuenta"}
                    </button>
                  </>
                )}
              </form>
            )}

            {/* Magic Link */}
            {modo === "magic" && (
              sent ? (
                <div className="text-center py-3">
                  <p className="text-2xl mb-2">📬</p>
                  <p className="font-semibold text-brand-green text-sm">¡Revisa tu email!</p>
                  <p className="text-brand-muted text-xs mt-1">Link enviado a <b>{email}</b></p>
                </div>
              ) : (
                <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
                  <label className="sr-only" htmlFor="magic-email">Email</label>
                  <input id="magic-email" type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} required />
                  {error && <p className="text-brand-red text-xs">{error}</p>}
                  <button type="submit" disabled={loading || !email}
                    className="bg-brand-purple text-brand-bg font-bold py-3 rounded-xl text-sm disabled:opacity-50">
                    {loading ? "Enviando…" : "Enviar link de acceso"}
                  </button>
                </form>
              )
            )}
          </div>

          {/* Demo */}
          <div className="mt-3 text-center">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-brand-border"/>
              <span className="text-brand-muted text-xs">¿solo quieres explorar?</span>
              <div className="flex-1 h-px bg-brand-border"/>
            </div>
            <button onClick={() => handleDemo("form")} disabled={demoLoading}
              className="w-full py-2.5 rounded-xl border border-brand-border text-brand-muted text-sm font-semibold hover:border-brand-purple/50 hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {demoLoading
                ? <span className="w-4 h-4 border-2 border-brand-muted/30 border-t-brand-muted rounded-full animate-spin" />
                : <span className="text-base leading-none">▶</span>
              }
              {demoLoading ? "Cargando…" : "Explorar demo"}
            </button>
          </div>
        </div>
      </section>

      {/* ── TECH / FOOTER ── */}
      <footer className="py-16 px-6 border-t border-brand-border">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-6 text-center">
          <p className="text-brand-muted text-sm uppercase tracking-widest font-semibold">
            Construido con
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: "Next.js", color: "border-white/20 text-white/80" },
              { label: "TypeScript", color: "border-[#3178c6]/40 text-[#3178c6]" },
              { label: "Supabase", color: "border-[#3ecf8e]/40 text-[#3ecf8e]" },
              { label: "Tailwind CSS", color: "border-[#38bdf8]/40 text-[#38bdf8]" },
              { label: "Vercel", color: "border-white/20 text-white/80" },
            ].map(({ label, color }) => (
              <span
                key={label}
                className={`px-3 py-1 rounded-full border text-xs font-semibold ${color}`}
              >
                {label}
              </span>
            ))}
          </div>
          <a
            href="https://github.com/GaiaGomez/finanzas-app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-brand-muted text-sm hover:text-white transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            Ver código en GitHub
          </a>
        </div>
      </footer>

    </div>
  );
}
