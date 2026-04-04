import { ModulePageShell } from "@/components/dashboard/module-page-shell";

export default function GaleriaAdminPage() {
  return (
    <ModulePageShell
      title="Catálogo de estilos"
      description="Sube fotos, ordena estilos y elige cuáles se muestran al público."
    >
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-zinc-600">
          Aquí podrás agregar imagen, nombre, descripción y etiquetas para cada estilo.
        </p>
      </div>
    </ModulePageShell>
  );
}
