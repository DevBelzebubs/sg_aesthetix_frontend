import { ModulePageShell } from "@/components/dashboard/module-page-shell";

const employees = [
  { name: "Alejandro Ruiz", role: "Barbero", load: "8 citas hoy" },
  { name: "Matías Soto", role: "Barbero", load: "6 citas hoy" },
  { name: "Sergio Lara", role: "Recepción", load: "Turno completo" },
];

export default function EmpleadosPage() {
  return (
    <ModulePageShell
      title="Empleados"
      description="Gestiona el equipo, sus horarios y su rendimiento de forma simple."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {employees.map((employee) => (
          <article key={employee.name} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-lg font-semibold">{employee.name}</p>
            <p className="mt-1 text-sm text-zinc-600">{employee.role}</p>
            <p className="mt-4 text-sm font-semibold text-zinc-800">{employee.load}</p>
          </article>
        ))}
      </div>
    </ModulePageShell>
  );
}
