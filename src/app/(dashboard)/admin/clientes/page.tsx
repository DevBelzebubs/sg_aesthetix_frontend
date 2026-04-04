import { ModulePageShell } from "@/components/dashboard/module-page-shell";

export default function ClientesPage() {
  return (
    <ModulePageShell
      title="Clientes"
      description="Busca clientes por nombre, teléfono o correo y revisa su historial."
    >
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-3">
          <input className="rounded-xl border border-zinc-200 px-3 py-2 text-sm" placeholder="Nombre" />
          <input className="rounded-xl border border-zinc-200 px-3 py-2 text-sm" placeholder="Teléfono" />
          <input className="rounded-xl border border-zinc-200 px-3 py-2 text-sm" placeholder="Correo" />
        </div>
        <p className="mt-4 text-sm text-zinc-600">
          Aquí verás próximas citas, preferencias y notas de cada cliente.
        </p>
      </div>
    </ModulePageShell>
  );
}
