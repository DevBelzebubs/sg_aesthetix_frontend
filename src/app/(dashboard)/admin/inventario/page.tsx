import { InventoryManagement } from "@/components/dashboard/inventory-management";
import { ModulePageShell } from "@/components/dashboard/module-page-shell";

export default function InventarioPage() {
  return (
    <ModulePageShell
      title="Inventario"
      description="Mira tus productos, edita cantidades y detecta lo que ya falta reponer."
    >
      <InventoryManagement />
    </ModulePageShell>
  );
}
