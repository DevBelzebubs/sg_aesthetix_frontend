import { LoyaltyManagement } from "@/components/dashboard/loyalty-management";
import { ModulePageShell } from "@/components/dashboard/module-page-shell";

export default function FidelizacionPage() {
  return (
    <ModulePageShell
      title="Fidelizacion"
      description="Crea beneficios simples para premiar a quienes vuelven seguido."
    >
      <LoyaltyManagement />
    </ModulePageShell>
  );
}
