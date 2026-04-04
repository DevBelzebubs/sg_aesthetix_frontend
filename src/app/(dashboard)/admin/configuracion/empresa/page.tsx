import { ModulePageShell } from "@/components/dashboard/module-page-shell";

const tenants = [
  { name: "Barbería Central", slug: "barberia-central", plan: "Pro", status: "Activa" },
  { name: "Gentlemen Cut", slug: "gentlemen-cut", plan: "Básico", status: "Pausada" },
];

export default function EmpresaPage() {
  return (
    <ModulePageShell
      title="Empresa y planes"
      description="Crea nuevas barberías, activa o pausa cuentas y revisa el plan de cada una."
    >
      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-600">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.slug} className="border-t border-zinc-100">
                <td className="px-4 py-3 font-semibold">{tenant.name}</td>
                <td className="px-4 py-3">{tenant.slug}</td>
                <td className="px-4 py-3">{tenant.plan}</td>
                <td className="px-4 py-3">{tenant.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ModulePageShell>
  );
}
