import { ComplaintsManagement } from "@/components/dashboard/complaints-management";
import { ModulePageShell } from "@/components/dashboard/module-page-shell";

export default async function LibroReclamacionesAdminPage() {
  return (
    <ModulePageShell
      breadcrumb={[{ label: "Administracion", href: "/admin" }, { label: "Libro Reclamaciones" }]}
      title="Libro de Reclamaciones"
      description="Gestione las quejas y reclamos registrados según la Ley N° 29571."
    >
      <ComplaintsManagement />
    </ModulePageShell>
  );
}
