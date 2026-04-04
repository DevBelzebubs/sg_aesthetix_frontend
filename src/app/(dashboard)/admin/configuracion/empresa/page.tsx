import { BusinessManagement } from "@/components/dashboard/business-management";
import { ModulePageShell } from "@/components/dashboard/module-page-shell";

export default function EmpresaPage() {
  return (
    <ModulePageShell
      title="Datos del negocio"
      description="Cambia el nombre, estado y datos principales de tu negocio."
    >
      <BusinessManagement />
    </ModulePageShell>
  );
}
