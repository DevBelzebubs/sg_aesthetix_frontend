import { PointsConfigManagement } from "@/components/dashboard/points-config-management";
import { ModulePageShell } from "@/components/dashboard/module-page-shell";

export default function ConfiguracionPuntosPage() {
  return (
    <ModulePageShell
      breadcrumb={[{ label: "Administracion", href: "/admin" }, { label: "Configuracion de puntos" }]}
      title="Configuracion de puntos"
      description="Define los parametros del sistema de fidelizacion y canje de puntos."
    >
      <PointsConfigManagement />
    </ModulePageShell>
  );
}
