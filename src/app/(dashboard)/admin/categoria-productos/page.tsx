import ProductCategoriesManagement from "@/components/dashboard/product-categories-management";
import { ModulePageShell } from "@/components/dashboard/module-page-shell";

export default function CategoriaProductosPage() {
  return (
    <ModulePageShell
      breadcrumb={[{ label: "Administracion", href: "/admin" }, { label: "Categorias de productos" }]}
      title="Categorias de productos"
      description="Administra las categorias para clasificar tus productos."
    >
      <ProductCategoriesManagement />
    </ModulePageShell>
  );
}
