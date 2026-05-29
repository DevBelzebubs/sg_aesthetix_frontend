import { InventoryManagement } from "@/components/dashboard/inventory-management";
import { ModulePageShell } from "@/components/dashboard/module-page-shell";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function InventarioPage() {
  const supabase = await createServerSupabase();

  const { count } = await supabase
    .from("productos")
    .select("*", { count: "exact", head: true });

  const { count: activos } = await supabase
    .from("productos")
    .select("*", { count: "exact", head: true })
    .eq("esta_activo", true);

  const { data: stockBajo } = await supabase
    .from("productos")
    .select("stock_actual, stock_minimo");

  const porReponer = stockBajo?.filter((p) => p.stock_actual <= p.stock_minimo).length ?? 0;

  return (
    <ModulePageShell
      breadcrumb={[{ label: "Administracion", href: "/admin" }, { label: "Productos" }]}
      title="Productos"
      description="Catalogo de productos, precios y visibilidad en la tienda publica."
    >
      <InventoryManagement totalProductos={count ?? 0} totalActivos={activos ?? 0} porReponer={porReponer} />
    </ModulePageShell>
  );
}
