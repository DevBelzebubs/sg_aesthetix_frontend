import ServiceCategoriesManagement from "@/components/dashboard/service-categories-management";
import { ModulePageShell } from "@/components/dashboard/module-page-shell";

export default function CategoriaServiciosPage() {
  return (
    <ModulePageShell
      breadcrumb={[{ label: "Administracion", href: "/admin" }, { label: "Categorias de servicios" }]}
      title="Categorias de servicios"
      description="Administra las categorias para clasificar tus servicios."
    >
      <ServiceCategoriesManagement />
    </ModulePageShell>
  );
}
