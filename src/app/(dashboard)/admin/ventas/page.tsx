import { SalesManagement } from "@/components/dashboard/sales-management";

export const dynamic = "force-dynamic";
import { ModulePageShell } from "@/components/dashboard/module-page-shell";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function VentasPage() {
  const supabase = await createServerSupabase();

  const { count } = await supabase
    .from("ventas")
    .select("*", { count: "exact", head: true });

  const today = new Date().toISOString().slice(0, 10);
  const { count: hoy } = await supabase
    .from("ventas")
    .select("*", { count: "exact", head: true })
    .gte("creado_en", today);

  const { data: ventas } = await supabase
    .from("ventas")
    .select("total");

  const total = ventas?.reduce((sum, v) => sum + Number(v.total), 0) ?? 0;

  return (
    <ModulePageShell
      breadcrumb={[{ label: "Administracion", href: "/admin" }, { label: "Ventas" }]}
      title="Listado de ventas"
      description="Consulta el historial de transacciones y ventas realizadas."
    >
      <SalesManagement
        totalVentas={count ?? 0}
        totalDia={hoy ?? 0}
        ingresoTotal={total}
      />
    </ModulePageShell>
  );
}
