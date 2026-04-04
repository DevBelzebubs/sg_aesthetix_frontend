import { ModulePageShell } from "@/components/dashboard/module-page-shell";

export default function FidelizacionPage() {
  return (
    <ModulePageShell
      title="Fidelización"
      description="Gestión de puntos, reglas por tenant y transacciones de acumulación/canje/expiración."
      rf={["RF-37", "RF-38", "RF-39", "RF-40", "RF-41"]}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-500">Regla actual</p>
          <p className="mt-1 text-xl font-bold">1 punto por cada S/ 1 gastado</p>
        </article>
        <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-500">Canjes del mes</p>
          <p className="mt-1 text-xl font-bold">84 transacciones</p>
        </article>
      </div>
    </ModulePageShell>
  );
}
