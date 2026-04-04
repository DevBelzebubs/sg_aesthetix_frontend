import { ModulePageShell } from "@/components/dashboard/module-page-shell";

const employees = [
  { name: "Alejandro Ruiz", role: "Barber", load: "8 citas" },
  { name: "Matías Soto", role: "Barber", load: "6 citas" },
  { name: "Sergio Lara", role: "Recepción", load: "Asistencia completa" },
];

export default function EmpleadosPage() {
  return (
    <ModulePageShell
      title="Empleados"
      description="Gestión de perfiles, horarios semanales, asistencia, comisiones y rendimiento individual."
      rf={["RF-18", "RF-19", "RF-20", "RF-21", "RF-22", "RF-23"]}
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
