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

  // Cargar todos los datos en paralelo
  const [perfilRes, fijosRes, varsRes, deudasRes, abonosRes] = await Promise.all([
    supabase.from("perfiles").select("*").eq("id", user.id).single(),
    supabase.from("gastos_fijos").select("*").eq("user_id", user.id).eq("quincena", quincena).order("created_at"),
    supabase.from("gastos_variables").select("*").eq("user_id", user.id).eq("quincena", quincena).order("created_at", { ascending: false }),
    supabase.from("deudas").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("abonos").select("*").eq("user_id", user.id).order("fecha", { ascending: false }),
  ]);

  return (
    <DashboardClient
      userId={user.id}
      perfil={perfilRes.data}
      fijosIniciales={fijosRes.data ?? []}
      variablesIniciales={varsRes.data ?? []}
      deudasIniciales={deudasRes.data ?? []}
      abonosIniciales={abonosRes.data ?? []}
      quincena={quincena}
    />
  );
}
