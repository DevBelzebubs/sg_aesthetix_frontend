import { ModulePageShell } from "@/components/dashboard/module-page-shell";

const tenants = [
  { name: "Barbería Central", slug: "barberia-central", plan: "PRO", status: "ACTIVE" },
  { name: "Gentlemen Cut", slug: "gentlemen-cut", plan: "BASIC", status: "INACTIVE" },
];

export default function EmpresaPage() {
  return (
    <ModulePageShell
      title="Empresa y tenants"
      description="Alta de tenant, activación/desactivación, plan, vencimiento y validación de tenant_id obligatorio."
      rf={["RF-01", "RF-02", "RF-03", "RF-04", "RF-05", "RF-10"]}
    >
      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-600">
            <tr>
              <th className="px-4 py-3">Tenant</th>
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
