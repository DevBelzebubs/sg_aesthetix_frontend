import { ModulePageShell } from "@/components/dashboard/module-page-shell";

export default function ClientesPage() {
  return (
    <ModulePageShell
      title="Clientes"
      description="Registro, historial de visitas, preferencias y búsqueda por nombre, teléfono o email."
      rf={["RF-32", "RF-33", "RF-34", "RF-35", "RF-36"]}
    >
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-3">
          <input className="rounded-xl border border-zinc-200 px-3 py-2 text-sm" placeholder="Nombre" />
          <input className="rounded-xl border border-zinc-200 px-3 py-2 text-sm" placeholder="Teléfono" />
          <input className="rounded-xl border border-zinc-200 px-3 py-2 text-sm" placeholder="Email" />
        </div>
        <p className="mt-4 text-sm text-zinc-600">
          Próximo paso: conectar esta vista al endpoint tenant-scoped para búsqueda y ficha 360°.
        </p>
      </div>
    </ModulePageShell>
  );
}
