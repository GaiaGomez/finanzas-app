// app/dashboard/page.tsx — Server Component
import { createServerSupabase } from "@/lib/supabase-server";
import { getPeriodo } from "@/lib/utils";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = createServerSupabase();
  const periodo  = getPeriodo();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [perfilRes, fijosRes, varsRes, ingresosRes, deudasRes, abonosRes] = await Promise.all([
    supabase.from("perfiles").select("*").eq("id", user.id).single(),
    supabase.from("gastos_fijos").select("*").eq("user_id", user.id).eq("periodo", periodo).order("created_at"),
    supabase.from("gastos_variables").select("*").eq("user_id", user.id).eq("periodo", periodo).order("created_at", { ascending: false }),
    supabase.from("ingresos").select("*").eq("user_id", user.id).eq("periodo", periodo).order("fecha", { ascending: false }),
    supabase.from("deudas").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("abonos").select("*").eq("user_id", user.id).order("fecha", { ascending: false }),
  ]);

  return (
    <DashboardClient
      userId={user.id}
      perfil={perfilRes.data}
      periodoInicial={periodo}
      fijosIniciales={fijosRes.data ?? []}
      variablesIniciales={varsRes.data ?? []}
      ingresosIniciales={ingresosRes.data ?? []}
      deudasIniciales={deudasRes.data ?? []}
      abonosIniciales={abonosRes.data ?? []}
    />
  );
}
