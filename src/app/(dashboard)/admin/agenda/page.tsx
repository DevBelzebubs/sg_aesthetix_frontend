import { AgendaManagement } from "@/components/dashboard/agenda-management";
import { ModulePageShell } from "@/components/dashboard/module-page-shell";

export default function AgendaPage() {
  return (
    <ModulePageShell
      title="Agenda diaria"
      description="Revisa las citas del dia, cambia horarios y mantén el orden de la agenda."
    >
      <AgendaManagement />
    </ModulePageShell>
  );
}
