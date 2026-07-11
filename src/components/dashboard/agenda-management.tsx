"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  Loader2,
  Pencil,
  RefreshCw,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AppointmentsService, type AppointmentWithDetails } from "@/services/appointments.service";
import { RewardsService } from "@/services/rewards.service";
import { ConfirmationModal } from "@/components/dashboard/confirmation-modal";
import { Toast } from "@/components/dashboard/toast";
import { useAuth } from "@/hooks/useAuth";

const inputClassName =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] px-4 py-3 text-sm outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--hover)] focus:ring-2 focus:ring-[var(--hover)]/20";

type BarberOption = { id: string; name: string };
type ServiceOption = { id: string; name: string; durationMinutes: number };

export function AgendaManagement() {
  const supabase = createClient();
  const { userId } = useAuth();

  const [apps, setApps] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // edit modal
  const [editTarget, setEditTarget] = useState<AppointmentWithDetails | null>(null);
  const [editServiceId, setEditServiceId] = useState("");
  const [editBarberId, setEditBarberId] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editObs, setEditObs] = useState("");

  const [barbers, setBarbers] = useState<BarberOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);

  // delete
  const [deleteTarget, setDeleteTarget] = useState<AppointmentWithDetails | null>(null);

  // state change confirm
  const [statusTarget, setStatusTarget] = useState<{
    id: string;
    nuevoEstado: string;
  } | null>(null);

  const [saving, setSaving] = useState(false);

  // toast
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const today = new Date();
      const end = new Date(today);
      end.setDate(today.getDate() + 10);
      const data = await AppointmentsService.getAllForDateRange(
        today.toISOString().split("T")[0],
        end.toISOString().split("T")[0],
      );
      setApps(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (editTarget) {
      fetchBarbersAndServices();
    }
  }, [editTarget]);

  const fetchBarbersAndServices = async () => {
    try {
      const { data: users } = await supabase
        .from("usuarios")
        .select("id, nombres, apellidos")
        .eq("esta_activo", true)
        .order("nombres");
      setBarbers(
        (users ?? []).map((u: Record<string, unknown>) => ({
          id: u.id as string,
          name: `${u.nombres} ${u.apellidos ?? ""}`.trim(),
        })),
      );

      const { data: servs } = await supabase
        .from("servicios")
        .select("id, nombre, duracion_estimada")
        .eq("esta_activo", true)
        .order("nombre");
      setServices(
        (servs ?? []).map((s: Record<string, unknown>) => {
          const durStr = (s.duracion_estimada as string) ?? "30 min";
          const mins = parseInt(durStr, 10) || 30;
          return { id: s.id as string, name: s.nombre as string, durationMinutes: mins };
        }),
      );
    } catch {}
  };

  const openEdit = (app: AppointmentWithDetails) => {
    setEditTarget(app);
    setEditServiceId(app.servicio_id);
    setEditBarberId(app.usuario_id);
    setEditDate(app.fecha_reserva);
    setEditStart(app.hora_inicio.slice(0, 5));
    setEditEnd(app.hora_fin.slice(0, 5));
    setEditObs(app.observaciones ?? "");
  };

  const handleSaveEdit = async () => {
    if (!editTarget || !editDate || !editStart || !editEnd) return;
    setSaving(true);
    try {
      await AppointmentsService.update(editTarget.id, {
        servicio_id: editServiceId,
        usuario_id: editBarberId,
        fecha_reserva: editDate,
        hora_inicio: `${editStart}:00`,
        hora_fin: `${editEnd}:00`,
        observaciones: editObs || null,
      });
      setToastMessage("Reserva actualizada");
      setToastType("success");
      setToastOpen(true);
      setEditTarget(null);
      await fetchData();
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Error al actualizar");
      setToastType("error");
      setToastOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await AppointmentsService.remove(deleteTarget.id);
      setToastMessage("Reserva eliminada");
      setToastType("success");
      setToastOpen(true);
      setDeleteTarget(null);
      await fetchData();
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Error al eliminar");
      setToastType("error");
      setToastOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const updateAppointmentStatus = async (id: string, status: string) => {
    setSaving(true);
    try {
      await AppointmentsService.update(id, { estado: status });
      setApps((prev) =>
        prev.map((a) => (a.id === id ? { ...a, estado: status } : a)),
      );

      if (status === "completada") {
        const app = apps.find((a) => a.id === id);
        if (app && app.cliente_id && app.servicio_id) {
          await crearVentaDesdeReserva(app);
        }
      }
      setToastMessage(
        status === "completada"
          ? "Reserva marcada como completada"
          : "Reserva cancelada",
      );
      setToastType("success");
      setToastOpen(true);
    } catch (err) {
      setToastMessage(
        err instanceof Error ? err.message : "Error al actualizar estado",
      );
      setToastType("error");
      setToastOpen(true);
    } finally {
      setSaving(false);
      setStatusTarget(null);
    }
  };

  const crearVentaDesdeReserva = async (app: AppointmentWithDetails) => {
    try {
      const { data: servicio } = await supabase
        .from("servicios")
        .select("nombre, precio, puntos_otorgados")
        .eq("id", app.servicio_id)
        .single();

      if (!servicio) return;

      const precio = Number((servicio as Record<string, unknown>).precio);
      const puntos =
        Number((servicio as Record<string, unknown>).puntos_otorgados) ||
        Math.max(1, Math.floor(precio));

      const { data: venta } = await supabase
        .from("ventas")
        .insert({
          cliente_id: app.cliente_id,
          usuario_id: userId,
          tipo_venta: "servicio",
          subtotal: precio,
          descuento: 0,
          total: precio,
          metodo_pago: "efectivo",
          puntos_ganados: puntos,
          estado: "pagada",
        })
        .select()
        .single();

      if (venta) {
        const v = venta as Record<string, unknown>;
        await supabase.from("venta_detalle").insert({
          venta_id: v.id,
          tipo_item: "servicio",
          servicio_id: app.servicio_id,
          descripcion: (servicio as Record<string, unknown>).nombre,
          precio_unitario: precio,
          cantidad: 1,
          subtotal: precio,
          puntos_otorgados: puntos,
        });

        await RewardsService.addPoints(
          app.cliente_id,
          puntos,
          "acumulacion",
          `Puntos por servicio completado (${(servicio as Record<string, unknown>).nombre})`,
        );
      }
    } catch (err) {
      console.error("[AGENDA] Error al crear venta/puntos:", err);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    const weekdays = [
      "domingo",
      "lunes",
      "martes",
      "miércoles",
      "jueves",
      "viernes",
      "sábado",
    ];
    const months = [
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "setiembre",
      "octubre",
      "noviembre",
      "diciembre",
    ];
    return `${weekdays[d.getDay()]}, ${d.getDate()} de ${months[d.getMonth()]}`;
  };

  const groupedByDate = useMemo(() => {
    const map = new Map<string, AppointmentWithDetails[]>();
    for (const app of apps) {
      const list = map.get(app.fecha_reserva) ?? [];
      list.push(app);
      map.set(app.fecha_reserva, list);
    }
    return map;
  }, [apps]);

  const formatDateShort = (d: Date) =>
    `${
      ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"][d.getDay()]
    }, ${d.getDate()} ${
      ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "set", "oct", "nov", "dic"][d.getMonth()]
    }`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">Reservas</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {(() => {
              const t = new Date();
              const e = new Date(t);
              e.setDate(t.getDate() + 10);
              return `${formatDateShort(t)} — ${formatDateShort(e)} · ${apps.length} reserva(s)`;
            })()}
          </p>
        </div>
        <button
          type="button"
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-muted)] transition hover:bg-[var(--background)] disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Recargar
        </button>
      </div>

      {error && (
        <div className="rounded-3xl border border-[var(--destructive-border)] bg-[var(--destructive-hover)] p-4 text-sm text-[var(--destructive)]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-[var(--text-muted)]" size={32} />
        </div>
      ) : apps.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <CalendarClock size={32} className="text-[var(--text-muted)]" />
          <p className="text-sm text-[var(--text-muted)]">
            No hay reservas en los próximos días.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(groupedByDate.entries()).map(([date, items]) => (
            <div key={date}>
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                {formatDate(date)}
              </p>
              <div className="space-y-2">
                {items.map((app) => {
                  const isCompleted = app.estado.toLowerCase() === "completada";
                  const isCancelled = app.estado.toLowerCase() === "cancelada";
                  const isPending = !isCompleted && !isCancelled;

                  return (
                    <div
                      key={app.id}
                      className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] px-5 py-4 shadow-sm sm:flex-nowrap"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--background)] text-xs font-bold leading-tight text-center text-[var(--text-muted)]">
                        {app.hora_inicio.slice(0, 5)}
                        <br />
                        {app.hora_fin.slice(0, 5)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-[var(--foreground)]">
                          {app.cliente_nombre}
                        </p>
                        <p className="text-sm text-[var(--text-muted)] truncate">
                          {app.servicio_nombre} · {app.empleado_nombre}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full ${
                          isCompleted
                            ? "bg-emerald-100 text-emerald-700"
                            : isCancelled
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {app.estado}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {isPending && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setStatusTarget({
                                  id: app.id,
                                  nuevoEstado: "completada",
                                })
                              }
                              className="rounded-lg p-2 text-emerald-600 transition hover:bg-emerald-50"
                              title="Marcar como completada"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setStatusTarget({
                                  id: app.id,
                                  nuevoEstado: "cancelada",
                                })
                              }
                              className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                              title="Cancelar reserva"
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => openEdit(app)}
                          className="rounded-lg p-2 text-[var(--text-muted)] transition hover:bg-[var(--background)] hover:text-[var(--foreground)]"
                          title="Editar reserva"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(app)}
                          className="rounded-lg p-2 text-[var(--text-muted)] transition hover:bg-red-50 hover:text-red-500"
                          title="Eliminar reserva"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[10vh] px-4">
          <div className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-lg font-semibold text-[var(--foreground)]">Editar reserva</p>
                <p className="text-sm text-[var(--text-muted)]">{editTarget.cliente_nombre}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="rounded-xl p-2 text-[var(--text-muted)] hover:bg-[var(--background)] hover:text-[var(--foreground)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <label className="space-y-1.5 block">
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Servicio</span>
                <select
                  value={editServiceId}
                  onChange={(e) => setEditServiceId(e.target.value)}
                  className={inputClassName}
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5 block">
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Profesional</span>
                <select
                  value={editBarberId}
                  onChange={(e) => setEditBarberId(e.target.value)}
                  className={inputClassName}
                >
                  {barbers.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="space-y-1.5 block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Fecha</span>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className={inputClassName}
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="space-y-1.5 block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Hora inicio</span>
                  <input
                    type="time"
                    value={editStart}
                    onChange={(e) => setEditStart(e.target.value)}
                    className={inputClassName}
                  />
                </label>
                <label className="space-y-1.5 block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Hora fin</span>
                  <input
                    type="time"
                    value={editEnd}
                    onChange={(e) => setEditEnd(e.target.value)}
                    className={inputClassName}
                  />
                </label>
              </div>

              <label className="space-y-1.5 block">
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Observaciones</span>
                <textarea
                  value={editObs}
                  onChange={(e) => setEditObs(e.target.value)}
                  className={`${inputClassName} min-h-[70px] resize-y`}
                  placeholder="Notas opcionales..."
                  maxLength={500}
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={saving}
                className="rounded-full bg-[var(--button-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--button-primary-foreground)] transition hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status confirmation */}
      <ConfirmationModal
        open={statusTarget !== null}
        title={
          statusTarget?.nuevoEstado === "completada"
            ? "Marcar como completada"
            : "Cancelar reserva"
        }
        description={
          statusTarget?.nuevoEstado === "completada"
            ? "Se marcará la reserva como completada y se registrará la venta automáticamente."
            : "Se cancelará la reserva. Esta acción no se puede deshacer."
        }
        confirmLabel={
          statusTarget?.nuevoEstado === "completada"
            ? "Completar"
            : "Cancelar reserva"
        }
        onClose={() => setStatusTarget(null)}
        onConfirm={() =>
          statusTarget &&
          updateAppointmentStatus(statusTarget.id, statusTarget.nuevoEstado)
        }
      />

      {/* Delete confirmation */}
      <ConfirmationModal
        open={deleteTarget !== null}
        title="Eliminar reserva"
        description="La reserva se eliminará permanentemente. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <Toast
        message={toastMessage}
        type={toastType}
        open={toastOpen}
        onClose={() => setToastOpen(false)}
        position="top-right"
      />
    </div>
  );
}
