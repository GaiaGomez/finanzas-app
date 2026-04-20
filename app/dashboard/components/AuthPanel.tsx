"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { INPUT_CLS_AUTH as INPUT_CLS } from "@/lib/constants";

type Modo = "login" | "registro" | "magic";

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
    </div>
  );
}
