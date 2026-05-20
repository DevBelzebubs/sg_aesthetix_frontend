"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import {
  CalendarClock,
  Clock3,
  PencilLine,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";
import { ConfirmationModal } from "@/components/dashboard/confirmation-modal";
import { AppointmentsService, type AppointmentWithDetails } from "@/services/appointments.service";
import { RewardsService } from "@/services/rewards.service";

const emptyDraft = {
  hora_inicio: "",
  estado: "Pendiente",
  observaciones: "",
};

const inputClassName =
  "w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-900";

export function AgendaManagement() {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState(emptyDraft);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await AppointmentsService.getAllForDate(today);
      setAppointments(data);
      if (data.length > 0 && !data.some((a) => a.id === selectedId)) {
        setSelectedId(data[0].id);
        setDraft({
          hora_inicio: data[0].hora_inicio,
          estado: data[0].estado,
          observaciones: data[0].observaciones ?? "",
        });
      }
      if (data.length === 0) {
        setSelectedId("");
        setDraft(emptyDraft);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar citas");
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const filteredAppointments = useMemo(() => {
    const text = query.toLowerCase();
    return appointments.filter((a) =>
      a.cliente_nombre.toLowerCase().includes(text) ||
      a.servicio_nombre.toLowerCase().includes(text) ||
      a.empleado_nombre.toLowerCase().includes(text) ||
      a.hora_inicio.includes(text)
    );
  }, [appointments, query]);

  const selectedAppointment = appointments.find((a) => a.id === selectedId);

  const handleSelect = (appointment: AppointmentWithDetails) => {
    setSelectedId(appointment.id);
    setDraft({
      hora_inicio: appointment.hora_inicio,
      estado: appointment.estado,
      observaciones: appointment.observaciones ?? "",
    });
  };

  const handleSave = async () => {
    if (!selectedId || !draft.hora_inicio) return;
    try {
      const estadoAnterior = selectedAppointment?.estado;
      await AppointmentsService.update(selectedId, {
        hora_inicio: draft.hora_inicio,
        estado: draft.estado,
        observaciones: draft.observaciones || null,
      });

      if (draft.estado === "Completada" && estadoAnterior !== "Completada") {
        await RewardsService.addPointsForCompletedAppointment(selectedId);
      }

      await fetchAppointments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    try {
      await AppointmentsService.remove(selectedId);
      await fetchAppointments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    }
  };

  const pendientes = appointments.filter((a) => a.estado === "Pendiente").length;
  const enCurso = appointments.filter((a) => a.estado === "En curso").length;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.92fr]">
      <div className="space-y-4">
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <KpiCard title="Citas hoy" value={String(appointments.length)} detail="Turnos del dia" />
            <KpiCard title="Pendientes" value={String(pendientes)} detail="Por confirmar" />
            <KpiCard title="En curso" value={String(enCurso)} detail="Siendo atendidas" />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <label className="flex flex-1 items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3">
              <Search size={16} className="text-zinc-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
                placeholder="Buscar por cliente, servicio, persona o hora"
              />
            </label>
            <button
              type="button"
              onClick={fetchAppointments}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 px-4 py-3 text-sm text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50"
              title="Recargar"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {loading && appointments.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-sm text-zinc-500">
            Cargando citas...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</div>
        ) : appointments.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-sm text-zinc-500">
            No hay citas para hoy
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredAppointments.map((appointment) => (
              <article
                key={appointment.id}
                onClick={() => handleSelect(appointment)}
                className={`cursor-pointer rounded-3xl border p-5 shadow-sm transition ${
                  selectedId === appointment.id
                    ? "border-sky-300 bg-gradient-to-br from-sky-50 to-cyan-50"
                    : "border-zinc-200 bg-white hover:-translate-y-0.5 hover:shadow-md"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="text-lg font-semibold text-zinc-900">{appointment.cliente_nombre}</p>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                        {appointment.hora_inicio.slice(0, 5)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-600">{appointment.servicio_nombre}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClassName(appointment.estado)}`}>
                    {appointment.estado}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-[180px_1fr]">
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      Profesional
                    </p>
                    <p className="mt-2 text-sm font-semibold text-zinc-900">{appointment.empleado_nombre}</p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      Nota
                    </p>
                    <p className="mt-2 text-sm text-zinc-700">{appointment.observaciones || "—"}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-zinc-900">Editar cita</p>
          <p className="mt-1 text-sm text-zinc-600">
            Cambia la hora, el estado o la nota de la cita.
          </p>

          <div className="mt-4 grid gap-3">
            <Field label="Hora">
              <input
                type="time"
                className={inputClassName}
                value={draft.hora_inicio}
                onChange={(e) => setDraft((c) => ({ ...c, hora_inicio: e.target.value }))}
                disabled={!selectedAppointment}
              />
            </Field>
            <Field label="Cliente">
              <div className={inputClassName + " bg-zinc-50 text-zinc-600"}>
                {selectedAppointment?.cliente_nombre || "—"}
              </div>
            </Field>
            <Field label="Servicio">
              <div className={inputClassName + " bg-zinc-50 text-zinc-600"}>
                {selectedAppointment?.servicio_nombre || "—"}
              </div>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Profesional">
                <div className={inputClassName + " bg-zinc-50 text-zinc-600"}>
                  {selectedAppointment?.empleado_nombre || "—"}
                </div>
              </Field>
              <Field label="Estado">
                <select
                  className={inputClassName}
                  value={draft.estado}
                  onChange={(e) => setDraft((c) => ({ ...c, estado: e.target.value }))}
                  disabled={!selectedAppointment}
                >
                  <option>Pendiente</option>
                  <option>Confirmada</option>
                  <option>En curso</option>
                  <option>Completada</option>
                </select>
              </Field>
            </div>
            <Field label="Nota operativa">
              <textarea
                className={`${inputClassName} min-h-28 resize-none`}
                value={draft.observaciones}
                onChange={(e) => setDraft((c) => ({ ...c, observaciones: e.target.value }))}
                disabled={!selectedAppointment}
              />
            </Field>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              disabled={!selectedAppointment}
              className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition enabled:hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PencilLine size={16} />
              Guardar cambios
            </button>
            <button
              type="button"
              onClick={() => setIsDeleteConfirmOpen(true)}
              disabled={!selectedAppointment}
              className="inline-flex items-center gap-2 rounded-full border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-700 transition enabled:hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={16} />
              Eliminar cita
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-zinc-900">Lectura rapida</p>
          <div className="mt-4 space-y-3 text-sm text-zinc-600">
            <p className="flex items-center gap-2">
              <CalendarClock size={15} />
              Ordena la jornada por prioridad y horario
            </p>
            <p className="flex items-center gap-2">
              <UserRound size={15} />
              Reasigna citas entre profesionales
            </p>
            <p className="flex items-center gap-2">
              <Clock3 size={15} />
              Ajusta horas sin perder el contexto del turno
            </p>
          </div>
        </div>
      </aside>

      <ConfirmationModal
        open={isConfirmOpen}
        title="Confirmar cambios"
        description="Se guardaran los cambios hechos en esta cita."
        confirmLabel="Si, guardar"
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          handleSave();
          setIsConfirmOpen(false);
        }}
      />

      <ConfirmationModal
        open={isDeleteConfirmOpen}
        title="Confirmar eliminacion"
        description="Esta cita se eliminara de la agenda actual."
        confirmLabel="Si, eliminar"
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => {
          handleDelete();
          setIsDeleteConfirmOpen(false);
        }}
      />
    </div>
  );
}

function KpiCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
      <p className="text-sm font-semibold text-zinc-700">{title}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-zinc-900">{value}</p>
      <p className="mt-2 text-sm text-zinc-600">{detail}</p>
    </article>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      {children}
    </label>
  );
}

function getStatusClassName(status: string) {
  if (status === "Completada") return "bg-emerald-100 text-emerald-900";
  if (status === "En curso") return "bg-amber-100 text-amber-900";
  if (status === "Confirmada") return "bg-sky-100 text-sky-900";
  return "bg-rose-100 text-rose-900";
}
