import { ModulePageShell } from "@/components/dashboard/module-page-shell";

export default function FidelizacionPage() {
  return (
    <ModulePageShell
      title="Fidelización"
      description="Premia a tus clientes con puntos y descuentos por visitas frecuentes."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-500">Regla de puntos</p>
          <p className="mt-1 text-xl font-bold">1 punto por cada S/ 1 gastado</p>
        </article>
        <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-500">Canjes este mes</p>
          <p className="mt-1 text-xl font-bold">84 movimientos</p>
        </article>
      </div>
    </ModulePageShell>
  );
}
