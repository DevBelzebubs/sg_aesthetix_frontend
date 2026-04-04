import { ModulePageShell } from "@/components/dashboard/module-page-shell";
import { ServicesManagement } from "@/components/dashboard/services-management";

export default function ServiciosPage() {
  return (
    <ModulePageShell
      title="Servicios"
      description="Crea servicios, cambia precios, tiempos y decide quienes los atienden."
    >
      <ServicesManagement />
    </ModulePageShell>
  );
}
