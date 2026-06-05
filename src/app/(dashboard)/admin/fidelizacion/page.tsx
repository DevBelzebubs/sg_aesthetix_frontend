import { LoyaltyManagement } from "@/components/dashboard/loyalty-management";

export const dynamic = "force-dynamic";
import { ModulePageShell } from "@/components/dashboard/module-page-shell";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function FidelizacionPage() {
  const supabase = await createServerSupabase();

  const { count } = await supabase
    .from("recompensas")
    .select("*", { count: "exact", head: true });

  const { count: activas } = await supabase
    .from("recompensas")
    .select("*", { count: "exact", head: true })
    .eq("esta_activo", true);

  const { count: canjesPendientes } = await supabase
    .from("canjes_puntos")
    .select("*", { count: "exact", head: true })
    .eq("estado", "pendiente");

  return (
    <ModulePageShell
      breadcrumb={[{ label: "Administracion", href: "/admin" }, { label: "Fidelizacion" }]}
      title="Fidelizacion"
      description="Crea recompensas, gestiona puntos y revisa canjes pendientes."
    >
      <LoyaltyManagement totalBeneficios={count ?? 0} totalActivas={activas ?? 0} canjesPendientes={canjesPendientes ?? 0} />
    </ModulePageShell>
  );
}
