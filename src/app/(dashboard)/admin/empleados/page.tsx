import { EmployeesManagement } from "@/components/dashboard/employees-management";
import { ModulePageShell } from "@/components/dashboard/module-page-shell";

export default function EmpleadosPage() {
  return (
    <ModulePageShell
      title="Empleados"
      description="Organiza tu equipo, revisa sus datos y ajusta la informacion que necesites."
    >
      <EmployeesManagement />
    </ModulePageShell>
  );
}
