import { ModulePageShell } from "@/components/dashboard/module-page-shell";

const appointments = [
  { time: "10:00", client: "Carlos Méndez", service: "Corte + barba", status: "Confirmada" },
  { time: "11:30", client: "Luis Paredes", service: "Corte clásico", status: "Pendiente" },
  { time: "13:00", client: "Andrés Torres", service: "Afeitado premium", status: "En atención" },
];

export default function AgendaPage() {
  return (
    <ModulePageShell
      title="Agenda diaria"
      description="Organiza las citas del día y revisa el estado de cada atención."
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
