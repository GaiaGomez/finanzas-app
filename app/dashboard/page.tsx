// app/dashboard/page.tsx — Server Component
// Carga los datos del usuario desde Supabase y los pasa al Dashboard cliente
import { createServerSupabase } from "@/lib/supabase-server";
import { getQuincenaKey } from "@/lib/utils";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = createServerSupabase();
  const quincena = getQuincenaKey();

  // Obtener usuario
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Cargar perfil, fijos y variables en paralelo — más rápido que en serie
  const [perfilRes, fijosRes, varsRes] = await Promise.all([
    supabase.from("perfiles").select("*").eq("id", user.id).single(),
    supabase.from("gastos_fijos").select("*").eq("user_id", user.id).eq("quincena", quincena).order("created_at"),
    supabase.from("gastos_variables").select("*").eq("user_id", user.id).eq("quincena", quincena).order("created_at", { ascending: false }),
  ]);

  const perfil   = perfilRes.data;
  const fijos    = fijosRes.data   ?? [];
  const variables = varsRes.data   ?? [];

  return (
    <DashboardClient
      userId={user.id}
      perfil={perfil}
      fijosIniciales={fijos}
      variablesIniciales={variables}
      quincena={quincena}
    />
  );
}
