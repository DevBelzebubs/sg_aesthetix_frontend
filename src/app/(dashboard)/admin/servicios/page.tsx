import { ModulePageShell } from "@/components/dashboard/module-page-shell";

const serviceTypes = ["STANDARD", "PREMIUM", "CLASSIC", "COMBO", "KIDS"];

export default function ServiciosPage() {
  return (
    <ModulePageShell
      title="Servicios"
      description="CRUD de servicios por tenant, asignación a empleados, activación/desactivación e imagen por Cloudinary."
      rf={["RF-12", "RF-13", "RF-14", "RF-15", "RF-16", "RF-17"]}
    >
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-zinc-800">Tipos soportados</p>
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
