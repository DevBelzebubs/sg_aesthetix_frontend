import { AgendaManagement } from "@/components/dashboard/agenda-management";

export const dynamic = "force-dynamic";
import { ModulePageShell } from "@/components/dashboard/module-page-shell";

export default function AgendaPage() {
  return (
    <ModulePageShell
      breadcrumb={[{ label: "Administracion", href: "/admin" }, { label: "Agenda" }]}
      title="Agenda"
      description="Revisa las reservas de los próximos días."
    >
      <AgendaManagement />
    </ModulePageShell>
  );
}
