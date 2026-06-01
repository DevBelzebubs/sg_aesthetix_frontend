import { EmployeesManagement } from "@/components/dashboard/employees-management";
import { ModulePageShell } from "@/components/dashboard/module-page-shell";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function EmpleadosPage() {
  const supabase = await createServerSupabase();

  const { data: usuarios } = await supabase
    .from("usuarios")
    .select("rol, esta_activo");

  const activos = usuarios?.filter((u) => u.esta_activo).length ?? 0;
  const admins = usuarios?.filter((u) => u.rol === "admin").length ?? 0;
  const total = usuarios?.length ?? 0;

  return (
    <ModulePageShell
      breadcrumb={[{ label: "Administracion", href: "/admin" }, { label: "Empleados" }]}
      title="Empleados"
      description="Organiza tu equipo, revisa sus datos y ajusta la informacion que necesites."
    >
      <EmployeesManagement
        kpiActivos={activos}
        kpiAdmins={admins}
        kpiEmpleados={total - admins}
      />
    </ModulePageShell>
  );
}
