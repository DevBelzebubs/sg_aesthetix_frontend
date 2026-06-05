import { GoodsReceiptManagement } from "@/components/dashboard/goods-receipt-management";

export const dynamic = "force-dynamic";
import { ModulePageShell } from "@/components/dashboard/module-page-shell";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function IngresoMercaderiaPage() {
  const supabase = await createServerSupabase();

  const { count } = await supabase
    .from("movimientos_inventario")
    .select("*", { count: "exact", head: true })
    .eq("tipo", "ingreso");

  const { data: items } = await supabase
    .from("movimientos_inventario")
    .select("cantidad")
    .eq("tipo", "ingreso");

  const totalUnidades = items?.reduce((sum, i) => sum + Number(i.cantidad), 0) ?? 0;

  return (
    <ModulePageShell
      breadcrumb={[{ label: "Administracion", href: "/admin" }, { label: "Ingreso de mercaderia" }]}
      title="Ingreso de mercaderia"
      description="Registra la entrada de nuevos productos al inventario."
    >
      <GoodsReceiptManagement
        totalIngresos={count ?? 0}
        totalUnidades={totalUnidades}
      />
    </ModulePageShell>
  );
}
