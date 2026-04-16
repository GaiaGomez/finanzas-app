// app/page.tsx — página raíz "/"
// El middleware ya se encarga de redirigir, pero por si acaso:
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";

export default async function RootPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");
  else redirect("/auth");
}
