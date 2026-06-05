"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { ArrowLeft, CalendarClock, CheckCircle2, Clock3, Loader2, PencilLine, PlayCircle, RefreshCw, Search, Trash2, UserRound, X, AlertCircle } from "lucide-react";
import { ConfirmationModal } from "@/components/dashboard/confirmation-modal";
import { Pagination } from "@/components/dashboard/pagination";
import { AppointmentsService, type AppointmentWithDetails } from "@/services/appointments.service";
import { RewardsService } from "@/services/rewards.service";
import { validateRequired } from "@/lib/validators";

const emptyDraft = { hora_inicio: "", estado: "Pendiente", observaciones: "" };
const inputClassName = "w-full rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] px-4 py-3 text-sm outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--hover)] focus:ring-2 focus:ring-[var(--hover)]/20";

type Props = { totalCitas: number; totalPendientes: number; totalCompletadas: number; };

export function AgendaManagement({ totalCitas, totalPendientes, totalCompletadas }: Props) {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"list" | "edit">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
//cambios para probar el tema de deploy
  const pageSize = 10;
  const [page, setPage] = useState(1);

  const today = new Date().toISOString().split("T")[0];

  const fetchAppointments = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const data = await AppointmentsService.getAllForDate(today);
      setAppointments(data);
    } catch (err) { setError(err instanceof Error ? err.message : "Error al cargar citas"); } finally { setLoading(false); }
  }, [today]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const filteredAppointments = useMemo(() => {
    const text = query.toLowerCase();
    return appointments.filter((a) => a.cliente_nombre.toLowerCase().includes(text) || a.servicio_nombre.toLowerCase().includes(text) || a.empleado_nombre.toLowerCase().includes(text) || a.hora_inicio.includes(text));
  }, [appointments, query]);

  useEffect(() => { setPage(1); }, [query, today]);
  const totalPages = Math.ceil(filteredAppointments.length / pageSize);
  const paginatedAppointments = filteredAppointments.slice((page - 1) * pageSize, page * pageSize);

  const selectedAppointment = appointments.find((a) => a.id === selectedId);

  const handleEdit = (appointment: AppointmentWithDetails) => {
    setSelectedId(appointment.id);
    setDraft({ hora_inicio: appointment.hora_inicio ?? "", estado: appointment.estado, observaciones: appointment.observaciones ?? "" });
    setMode("edit");
  };

  const handleBack = () => { setMode("list"); setSelectedId(null); setDraft(emptyDraft); };

  const handleSave = async () => {
    if (!selectedId) return;
    const errors: Record<string, string> = {};
    const horaErr = validateRequired(draft.hora_inicio, "La hora de inicio");
    if (horaErr) errors.horaInicio = horaErr;
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    try {
      const estadoAnterior = selectedAppointment?.estado;
      await AppointmentsService.update(selectedId, { hora_inicio: draft.hora_inicio, estado: draft.estado, observaciones: draft.observaciones || null });
      if (draft.estado.toLowerCase() === "completada" && estadoAnterior?.toLowerCase() !== "completada") {
        await RewardsService.addPointsForCompletedAppointment(selectedId);
      }
      await fetchAppointments();
      setMode("list"); setSelectedId(null); setDraft(emptyDraft);
    } catch (err) { setError(err instanceof Error ? err.message : "Error al guardar"); }
    setIsConfirmOpen(false);
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    try { await AppointmentsService.remove(selectedId); await fetchAppointments(); setMode("list"); setSelectedId(null); setDraft(emptyDraft); } catch (err) { setError(err instanceof Error ? err.message : "Error al eliminar"); }
    setIsDeleteConfirmOpen(false);
  };

  const handleQuickStatus = async (appointment: AppointmentWithDetails, nuevoEstado: string) => {
    try {
      await AppointmentsService.update(appointment.id, { estado: nuevoEstado });
      if (nuevoEstado.toLowerCase() === "completada" && appointment.estado.toLowerCase() !== "completada") {
        await RewardsService.addPointsForCompletedAppointment(appointment.id);
      }
      await fetchAppointments();
    } catch (err) { setError(err instanceof Error ? err.message : "Error al actualizar"); }
  };

  const enCurso = appointments.filter((a) => a.estado.toLowerCase() === "en curso").length;

  if (loading && appointments.length === 0) return <div className="flex items-center justify-center py-20 text-sm text-[var(--text-muted)]">Cargando citas...</div>;

  return (
    <>
      {/* KPIs */}
      {mode === "list" && (
        <div className="grid gap-3 sm:grid-cols-4">
          <article className="rounded-2xl border border-[var(--hover)]/20 p-4" style={{ background: "color-mix(in srgb, var(--hover) 6%, var(--background-secondary))" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Citas hoy</p>
            <div className="mt-2 flex items-center gap-2"><CalendarClock size={20} style={{ color: "var(--hover)" }} /><p className="text-xl font-bold text-[var(--foreground)]">{totalCitas}</p></div>
          </article>
          <article className="rounded-2xl border border-[var(--hover)]/20 p-4" style={{ background: "color-mix(in srgb, var(--hover) 6%, var(--background-secondary))" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Pendientes</p>
            <div className="mt-2 flex items-center gap-2"><Clock3 size={20} style={{ color: "var(--hover)" }} /><p className="text-xl font-bold text-[var(--foreground)]">{totalPendientes}</p></div>
          </article>
          <article className="rounded-2xl border border-[var(--hover)]/20 p-4" style={{ background: "color-mix(in srgb, var(--hover) 6%, var(--background-secondary))" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Completadas</p>
            <div className="mt-2 flex items-center gap-2"><UserRound size={20} style={{ color: "var(--hover)" }} /><p className="text-xl font-bold text-[var(--foreground)]">{totalCompletadas}</p></div>
          </article>
          <article className="rounded-2xl border border-[var(--hover)]/20 p-4" style={{ background: "color-mix(in srgb, var(--hover) 6%, var(--background-secondary))" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">En curso</p>
            <div className="mt-2 flex items-center gap-2"><RefreshCw size={20} style={{ color: "var(--hover)" }} /><p className="text-xl font-bold text-[var(--foreground)]">{enCurso}</p></div>
          </article>
        </div>
      )}

      {/* Barra */}
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-sm font-semibold text-[var(--foreground)]">Citas del dia</p><p className="mt-1 text-sm text-[var(--text-muted)]">{appointments.length} turno(s)</p></div>
          {mode === "list" ? (
            <button type="button" onClick={fetchAppointments} disabled={loading} className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-muted)] transition hover:bg-[var(--background)] disabled:opacity-50"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Recargar</button>
          ) : (
            <button type="button" onClick={handleBack} className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)]"><ArrowLeft size={16} /> Volver al listado</button>
          )}
        </div>
        {mode === "list" && (
          <label className="mt-4 flex items-center gap-3 rounded-2xl border border-[var(--border)] px-4 py-3">
            <Search size={16} className="text-[var(--text-muted)]" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]" placeholder="Buscar por cliente, servicio o profesional" />
          </label>
        )}
      </div>

      {error && <div className="rounded-3xl border border-[var(--destructive-border)] bg-[var(--destructive-hover)] p-5 text-sm text-[var(--destructive)]">{error}</div>}

      {/* Listado */}
      {mode === "list" && (
        <>
          <div className="space-y-3">
            {appointments.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16"><CalendarClock size={32} className="text-[var(--text-muted)]" /><p className="text-sm text-[var(--text-muted)]">No hay citas para hoy.</p></div>
            ) : (
              paginatedAppointments.map((appointment) => (
                <article key={appointment.id} className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--background)] text-[var(--foreground)]"><UserRound size={20} /></div>
                      <div>
                        <div className="flex items-center gap-2"><p className="text-base font-semibold text-[var(--foreground)]">{appointment.cliente_nombre}</p><span className="rounded-full bg-[var(--background)] px-2.5 py-0.5 text-xs font-semibold text-[var(--text-muted)]">{appointment.hora_inicio.slice(0, 5)}</span></div>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">{appointment.servicio_nombre}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {["Pendiente", "pendiente"].includes(appointment.estado) && (
                        <button type="button" onClick={() => handleQuickStatus(appointment, "completada")} className="inline-flex items-center gap-1 rounded-xl bg-[var(--hover)]/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--hover)] transition hover:bg-[var(--hover)]/20" title="Marcar como completada"><CheckCircle2 size={14} /> Completar</button>
                      )}
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClassName(appointment.estado)}`}>{appointment.estado.charAt(0).toUpperCase() + appointment.estado.slice(1)}</span>
                      <button type="button" onClick={() => handleEdit(appointment)} className="rounded-xl p-2 text-[var(--text-muted)] transition hover:bg-[var(--background)] hover:text-[var(--foreground)]"><PencilLine size={16} /></button>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-[180px_1fr]">
                    <div className="rounded-2xl bg-[var(--background)] px-4 py-3"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Profesional</p><p className="mt-2 text-sm font-semibold text-[var(--foreground)]">{appointment.empleado_nombre}</p></div>
                    <div className="rounded-2xl bg-[var(--background)] px-4 py-3"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Nota</p><p className="mt-2 text-sm text-[var(--foreground)]">{appointment.observaciones || "—"}</p></div>
                  </div>
                </article>
              ))
            )}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {/* Formulario editar */}
      {mode === "edit" && selectedAppointment && (
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3"><div className="rounded-2xl bg-[var(--background)] p-3"><CalendarClock size={20} className="text-[var(--foreground)]" /></div><div><p className="text-lg font-semibold text-[var(--foreground)]">Editar cita</p><p className="text-sm text-[var(--text-muted)]">Cambia la hora, el estado o la nota.</p></div></div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Hora" error={fieldErrors.horaInicio}><input type="time" className={inputClassName} value={draft.hora_inicio} onChange={(e) => { setFieldErrors((prev) => ({ ...prev, horaInicio: "" })); setDraft((c) => ({ ...c, hora_inicio: e.target.value })); }} /></Field>
            <Field label="Cliente"><div className={inputClassName + " bg-[var(--background)] text-[var(--text-muted)]"}>{selectedAppointment.cliente_nombre}</div></Field>
            <Field label="Servicio"><div className={inputClassName + " bg-[var(--background)] text-[var(--text-muted)]"}>{selectedAppointment.servicio_nombre}</div></Field>
            <Field label="Profesional"><div className={inputClassName + " bg-[var(--background)] text-[var(--text-muted)]"}>{selectedAppointment.empleado_nombre}</div></Field>
            <Field label="Estado"><select className={inputClassName} value={draft.estado} onChange={(e) => { setFieldErrors((prev) => ({ ...prev, estado: "" })); setDraft((c) => ({ ...c, estado: e.target.value })); }}><option>Pendiente</option><option>Confirmada</option><option>En curso</option><option>Completada</option></select></Field>
          </div>
          <div className="mt-4">
            <Field label="Nota operativa"><textarea className={`${inputClassName} min-h-28 resize-none`} value={draft.observaciones} onChange={(e) => { setFieldErrors((prev) => ({ ...prev, observaciones: "" })); setDraft((c) => ({ ...c, observaciones: e.target.value })); }} /></Field>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-6">
            <button type="button" onClick={() => setIsConfirmOpen(true)} disabled={Object.keys(fieldErrors).length > 0} className="inline-flex items-center gap-2 rounded-full bg-[var(--button-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--button-primary-foreground)] transition hover:opacity-90 disabled:opacity-50"><PencilLine size={16} /> Guardar cambios</button>
            <button type="button" onClick={() => setIsDeleteConfirmOpen(true)} className="inline-flex items-center gap-2 rounded-full border border-[var(--destructive-border)] px-5 py-2.5 text-sm font-semibold text-[var(--destructive)] transition hover:bg-[var(--destructive-hover)]"><Trash2 size={16} /> Eliminar cita</button>
            <button type="button" onClick={handleBack} className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)]"><X size={16} /> Cancelar</button>
          </div>
        </div>
      )}

      <ConfirmationModal open={isConfirmOpen} title="Confirmar cambios" description="Se guardaran los cambios hechos en esta cita." confirmLabel="Si, guardar" onClose={() => setIsConfirmOpen(false)} onConfirm={handleSave} />
      <ConfirmationModal open={isDeleteConfirmOpen} title="Confirmar eliminacion" description="Esta cita se eliminara de la agenda." confirmLabel="Si, eliminar" onClose={() => setIsDeleteConfirmOpen(false)} onConfirm={handleDelete} />
    </>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return <label className="space-y-2"><span className="text-sm font-medium text-[var(--foreground)]">{label}{required && <span className="ml-1 text-[var(--destructive)]">*</span>}</span>{children}{error && <p className="flex items-center gap-1 text-[11px] text-[var(--destructive)]"><AlertCircle size={11} />{error}</p>}</label>;
}

function getStatusClassName(status: string) {
  const s = status.toLowerCase();
  if (s === "completada" || s === "en curso" || s === "confirmada") return "bg-[var(--hover)]/15 text-[var(--hover)]";
  return "bg-[var(--warning)]/15 text-[var(--warning)]";
}
