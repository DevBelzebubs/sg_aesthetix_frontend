import { HeroManagement } from "@/components/dashboard/hero-management";

export const dynamic = "force-dynamic";
import { ModulePageShell } from "@/components/dashboard/module-page-shell";

export default function HeroPage() {
  return (
    <ModulePageShell
      breadcrumb={[{ label: "Administracion", href: "/admin" }, { label: "Hero" }]}
      title="Hero"
      description="Personaliza el hero principal de la landing page."
    >
      <HeroManagement />
    </ModulePageShell>
  );
}
