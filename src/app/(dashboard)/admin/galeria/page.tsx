import { ModulePageShell } from "@/components/dashboard/module-page-shell";

export default function GaleriaAdminPage() {
  return (
    <ModulePageShell
      title="Catálogo de estilos"
      description="CRUD de estilos de corte, tags, orden y activación para exponer en la landing pública."
      rf={["RF-53", "RF-54", "RF-55", "RF-56", "RF-57"]}
    >
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-zinc-600">
          Aquí se gestionarán las imágenes (Cloudinary), título, descripción, tags y orden de estilos.
        </p>
      </div>
    </ModulePageShell>
  );
}
