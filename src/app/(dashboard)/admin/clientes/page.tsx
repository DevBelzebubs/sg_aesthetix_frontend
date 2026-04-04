import { CustomersManagement } from "@/components/dashboard/customers-management";
import { ModulePageShell } from "@/components/dashboard/module-page-shell";

export default function ClientesPage() {
  return (
    <ModulePageShell
      title="Clientes"
      description="Encuentra clientes, corrige sus datos y elimina registros cuando haga falta."
    >
      <CustomersManagement />
    </ModulePageShell>
  );
}
