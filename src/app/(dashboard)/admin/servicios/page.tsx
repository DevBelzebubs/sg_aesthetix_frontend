import { ModulePageShell } from "@/components/dashboard/module-page-shell";

const serviceTypes = ["Estándar", "Premium", "Clásico", "Combo", "Niños"];

export default function ServiciosPage() {
  return (
    <ModulePageShell
      title="Servicios"
      description="Crea y edita servicios con precio, duración y categoría."
    >
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-zinc-800">Categorías disponibles</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {serviceTypes.map((type) => (
            <span key={type} className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
              {type}
            </span>
          ))}
        </div>
      </div>
    </ModulePageShell>
  );
}
