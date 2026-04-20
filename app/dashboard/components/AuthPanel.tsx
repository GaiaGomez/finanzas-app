"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo";

type Modo = "login" | "registro" | "magic";

const INPUT_CLS =
  "bg-[#1a1730] border border-[#2a2440] rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-purple transition-colors text-white placeholder:text-brand-muted w-full";

interface Props {
  initialTab?: Modo;
}

export default function AuthPanel({ initialTab = "login" }: Props) {
  const supabase = createClient();
  const [modo, setModo]         = useState<Modo>(initialTab);
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [sent, setSent]         = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  function reset() { setError(""); setSuccess(""); setSent(false); }

  function parseAuthError(err: { message: string }): string {
    const msg = err.message ?? "";
    if (msg.includes("rate limit") || msg.includes("over_email_send_rate_limit"))
      return "Demasiados intentos. Espera unos minutos.";
    if (msg.includes("Invalid login") || msg.includes("invalid_credentials"))
      return "Email o contraseña incorrectos.";
    if (msg.includes("Email not confirmed"))
      return "Confirma tu email antes de iniciar sesión.";
    if (msg.includes("User already registered"))
      return "Ya existe una cuenta con ese email.";
    if (msg.includes("Password should be"))
      return "La contraseña debe tener al menos 6 caracteres.";
    if (msg.includes("Unable to validate email"))
      return "Email inválido.";
    return msg || "Ocurrió un error. Intenta de nuevo.";
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true); reset();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(parseAuthError(error)); setLoading(false); return; }
    window.location.reload();
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
    else if (data.user && data.user.identities?.length === 0) { setError("Ya existe una cuenta con ese email."); }
    else { setSuccess("¡Cuenta creada! Revisa tu email para confirmarla."); }
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
    if (error) { setError(parseAuthError(error)); } else { setSent(true); }
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

  async function handleDemo() {
    setDemoLoading(true); reset();
    const { error } = await supabase.auth.signInWithPassword({
      email: DEMO_EMAIL, password: DEMO_PASSWORD,
    });
    if (error) { setError("No se pudo cargar el demo. Intenta de nuevo."); setDemoLoading(false); return; }
    window.location.reload();
  }

  return (
    <div className="w-full max-w-sm mx-auto">
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
            <label className="sr-only" htmlFor="ap-login-email">Email</label>
            <input id="ap-login-email" type="email" placeholder="tu@email.com" value={email}
              onChange={e => setEmail(e.target.value)} className={INPUT_CLS} required />
            <label className="sr-only" htmlFor="ap-login-password">Contraseña</label>
            <input id="ap-login-password" type="password" placeholder="Contraseña" value={password}
              onChange={e => setPassword(e.target.value)} className={INPUT_CLS} required />
            {error && <p className="text-brand-red text-xs">{error}</p>}
            <button type="submit" disabled={loading || !email || !password}
              className="bg-brand-purple text-brand-bg font-bold py-3 rounded-xl text-sm disabled:opacity-50">
              {loading ? "Entrando…" : "Iniciar sesión"}
            </button>
            <button type="button" onClick={() => { setModo("registro"); reset(); }}
              className="text-brand-muted text-xs text-center">
              ¿No tienes cuenta?{" "}
              <span className="text-brand-purple font-semibold">Regístrate</span>
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
                <label className="sr-only" htmlFor="ap-reg-nombre">Nombre</label>
                <input id="ap-reg-nombre" type="text" placeholder="Tu nombre" value={nombre}
                  onChange={e => setNombre(e.target.value)} className={INPUT_CLS} required />
                <label className="sr-only" htmlFor="ap-reg-email">Email</label>
                <input id="ap-reg-email" type="email" placeholder="tu@email.com" value={email}
                  onChange={e => setEmail(e.target.value)} className={INPUT_CLS} required />
                <label className="sr-only" htmlFor="ap-reg-password">Contraseña</label>
                <input id="ap-reg-password" type="password" placeholder="Contraseña (mín. 6 caracteres)"
                  value={password} onChange={e => setPassword(e.target.value)} className={INPUT_CLS} required />
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
              <label className="sr-only" htmlFor="ap-magic-email">Email</label>
              <input id="ap-magic-email" type="email" placeholder="tu@email.com" value={email}
                onChange={e => setEmail(e.target.value)} className={INPUT_CLS} required />
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
      <div className="mt-3">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-px bg-brand-border"/>
          <span className="text-brand-muted text-xs">¿solo quieres explorar?</span>
          <div className="flex-1 h-px bg-brand-border"/>
        </div>
        <button onClick={handleDemo} disabled={demoLoading}
          className="w-full py-2.5 rounded-xl border border-brand-border text-brand-muted text-sm font-semibold hover:border-brand-purple/50 hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {demoLoading
            ? <span className="w-4 h-4 border-2 border-brand-muted/30 border-t-brand-muted rounded-full animate-spin" />
            : <span className="text-base leading-none">▶</span>
          }
          {demoLoading ? "Cargando…" : "Explorar demo"}
        </button>
      </div>
    </div>
  );
}
