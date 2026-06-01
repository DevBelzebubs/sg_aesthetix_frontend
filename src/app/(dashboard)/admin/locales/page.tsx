import LocalesManagement from "@/components/dashboard/locales-management";
import { ModulePageShell } from "@/components/dashboard/module-page-shell";

export default function LocalesPage() {
  return (
    <ModulePageShell
      breadcrumb={[{ label: "Administracion", href: "/admin" }, { label: "Locales" }]}
      title="Locales"
      description="Administra las sucursales y locales del negocio."
    >
      <LocalesManagement />
    </ModulePageShell>
  );
}
