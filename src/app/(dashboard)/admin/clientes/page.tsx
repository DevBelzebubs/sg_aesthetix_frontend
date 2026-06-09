import { CustomersManagement } from "@/components/dashboard/customers-management";

export const dynamic = "force-dynamic";
import { ModulePageShell } from "@/components/dashboard/module-page-shell";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function ClientesPage() {
  const supabase = await createServerSupabase();

  const { count } = await supabase
    .from("clientes")
    .select("*", { count: "exact", head: true });

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  const { count: nuevosMes } = await supabase
    .from("clientes")
    .select("*", { count: "exact", head: true })
    .gte("creado_en", inicioMes.toISOString());

  const { count: conTelefono } = await supabase
    .from("clientes")
    .select("*", { count: "exact", head: true })
    .not("telefono", "is", null)
    .neq("telefono", "");

  return (
    <ModulePageShell
      breadcrumb={[{ label: "Administracion", href: "/admin" }, { label: "Clientes" }]}
      title="Clientes"
      description="Gestiona los datos de tus clientes, telefonos y correos."
    >
      <CustomersManagement totalClientes={count ?? 0} nuevosEsteMes={nuevosMes ?? 0} conTelefono={conTelefono ?? 0} />
    </ModulePageShell>
  );
}
