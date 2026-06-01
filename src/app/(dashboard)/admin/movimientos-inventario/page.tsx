import { InventoryMovementsManagement } from "@/components/dashboard/inventory-movements-management";
import { ModulePageShell } from "@/components/dashboard/module-page-shell";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function MovimientosInventarioPage() {
  const supabase = await createServerSupabase();

  const { count } = await supabase
    .from("movimientos_inventario")
    .select("*", { count: "exact", head: true });

  const { count: entradas } = await supabase
    .from("movimientos_inventario")
    .select("*", { count: "exact", head: true })
    .eq("tipo", "ingreso");

  const { count: salidas } = await supabase
    .from("movimientos_inventario")
    .select("*", { count: "exact", head: true })
    .eq("tipo", "salida");

  return (
    <ModulePageShell
      breadcrumb={[{ label: "Administracion", href: "/admin" }, { label: "Movimientos de inventario" }]}
      title="Movimientos de inventario"
      description="Registro de entradas y salidas de stock del inventario."
    >
      <InventoryMovementsManagement
        totalMovimientos={count ?? 0}
        totalEntradas={entradas ?? 0}
        totalSalidas={salidas ?? 0}
      />
    </ModulePageShell>
  );
}
