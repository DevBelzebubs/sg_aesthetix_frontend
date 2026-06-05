import { ServicesManagement } from "@/components/dashboard/services-management";

export const dynamic = "force-dynamic";
import { ModulePageShell } from "@/components/dashboard/module-page-shell";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function ServiciosPage() {
  const supabase = await createServerSupabase();

  const { count } = await supabase
    .from("servicios")
    .select("*", { count: "exact", head: true });

  const { count: activos } = await supabase
    .from("servicios")
    .select("*", { count: "exact", head: true })
    .eq("esta_activo", true);

  const { data: servicios } = await supabase
    .from("servicios")
    .select("precio");

  const precios = servicios?.map((s) => Number(s.precio)) ?? [];
  const precioPromedio = precios.length > 0
    ? precios.reduce((a, b) => a + b, 0) / precios.length
    : 0;

  return (
    <ModulePageShell
      breadcrumb={[{ label: "Administracion", href: "/admin" }, { label: "Servicios" }]}
      title="Servicios"
      description="Administra tu catalogo de servicios, precios y duraciones."
    >
      <ServicesManagement
        totalServicios={count ?? 0}
        totalActivos={activos ?? 0}
        precioPromedio={precioPromedio}
      />
    </ModulePageShell>
  );
}
