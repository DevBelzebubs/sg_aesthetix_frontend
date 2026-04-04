import { ModulePageShell } from "@/components/dashboard/module-page-shell";

const appointments = [
  { time: "10:00", client: "Carlos Méndez", service: "Corte + barba", status: "CONFIRMED" },
  { time: "11:30", client: "Luis Paredes", service: "Corte clásico", status: "PENDING" },
  { time: "13:00", client: "Andrés Torres", service: "Afeitado premium", status: "IN_PROGRESS" },
];

export default function AgendaPage() {
  return (
    <ModulePageShell
      title="Agenda diaria"
      description="Vista de reservas por día con estados de cita, reprogramación y control de solapamientos por empleado."
      rf={["RF-24", "RF-25", "RF-26", "RF-27", "RF-29", "RF-31"]}
    >
      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-600">
            <tr>
              <th className="px-4 py-3">Hora</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Servicio</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((row) => (
              <tr key={row.time} className="border-t border-zinc-100">
                <td className="px-4 py-3 font-semibold">{row.time}</td>
                <td className="px-4 py-3">{row.client}</td>
                <td className="px-4 py-3">{row.service}</td>
                <td className="px-4 py-3">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ModulePageShell>
  );
}
