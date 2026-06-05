import { AgendaManagement } from "@/components/dashboard/agenda-management";

export const dynamic = "force-dynamic";
import { ModulePageShell } from "@/components/dashboard/module-page-shell";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function AgendaPage() {
  const supabase = await createServerSupabase();
  const today = new Date().toISOString().split("T")[0];

  const { count: total } = await supabase
    .from("reservas")
    .select("*", { count: "exact", head: true })
    .eq("fecha_reserva", today);

  const { count: pendientes } = await supabase
    .from("reservas")
    .select("*", { count: "exact", head: true })
    .eq("fecha_reserva", today)
    .eq("estado", "Pendiente");

  const { count: completadas } = await supabase
    .from("reservas")
    .select("*", { count: "exact", head: true })
    .eq("fecha_reserva", today)
    .eq("estado", "Completada");

  return (
    <ModulePageShell
      breadcrumb={[{ label: "Administracion", href: "/admin" }, { label: "Agenda" }]}
      title="Agenda"
      description="Gestiona las citas del dia, cambia horarios y estados."
    >
      <AgendaManagement totalCitas={total ?? 0} totalPendientes={pendientes ?? 0} totalCompletadas={completadas ?? 0} />
    </ModulePageShell>
  );
}
