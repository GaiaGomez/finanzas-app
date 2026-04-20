import { createServerSupabase } from "@/lib/supabase-server";
import { getPeriodo } from "@/lib/utils";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  const periodo = getPeriodo();

  if (!user) {
    return (
      <DashboardClient
        userId={null}
        periodoInicial={periodo}
        fijosIniciales={[]}
        variablesIniciales={[]}
        ingresosIniciales={[]}
        deudasIniciales={[]}
        abonosIniciales={[]}
        metasAhorroIniciales={[]}
        abonosMetaIniciales={[]}
      />
    );
  }

  const [fijosRes, varsRes, ingresosRes, deudasRes, abonosRes, metasRes, abonosMetaRes] = await Promise.all([
    supabase.from("gastos_fijos").select("*").eq("user_id", user.id).eq("periodo", periodo).order("created_at"),
    supabase.from("gastos_variables").select("*").eq("user_id", user.id).eq("periodo", periodo).order("created_at", { ascending: false }),
    supabase.from("ingresos").select("*").eq("user_id", user.id).eq("periodo", periodo).order("fecha", { ascending: false }),
    supabase.from("deudas").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("abonos").select("*").eq("user_id", user.id).order("fecha", { ascending: false }),
    supabase.from("metas_ahorro").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("abonos_meta").select("*").eq("user_id", user.id).order("fecha", { ascending: false }),
  ]);

  return (
    <DashboardClient
      userId={user.id}
      periodoInicial={periodo}
      fijosIniciales={fijosRes.data ?? []}
      variablesIniciales={varsRes.data ?? []}
      ingresosIniciales={ingresosRes.data ?? []}
      deudasIniciales={deudasRes.data ?? []}
      abonosIniciales={abonosRes.data ?? []}
      metasAhorroIniciales={metasRes.data ?? []}
      abonosMetaIniciales={abonosMetaRes.data ?? []}
    />
  );
}
