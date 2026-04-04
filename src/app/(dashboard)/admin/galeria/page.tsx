import { GalleryManagement } from "@/components/dashboard/gallery-management";
import { ModulePageShell } from "@/components/dashboard/module-page-shell";

export default function GaleriaAdminPage() {
  return (
    <ModulePageShell
      title="Catalogo de estilos"
      description="Ordena las fotos y estilos que quieres mostrar en tu pagina."
    >
      <GalleryManagement />
    </ModulePageShell>
  );
}
