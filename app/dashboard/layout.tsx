// app/dashboard/layout.tsx
// Layout del dashboard — verifica sesión en el servidor y pasa el usuario a los hijos
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  // Doble check — el middleware ya debería haber redirigido, pero por seguridad
  if (!user) redirect("/auth");

  return <>{children}</>;
}
