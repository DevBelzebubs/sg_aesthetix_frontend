"use client";

import { useMemo, useState } from "react";
import {
  CalendarClock,
  Clock3,
  PencilLine,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";
import { ConfirmationModal } from "@/components/dashboard/confirmation-modal";

type AppointmentStatus = "Confirmada" | "Pendiente" | "En curso" | "Completada";

type AppointmentRecord = {
  id: string;
  time: string;
  client: string;
  service: string;
  employee: string;
  status: AppointmentStatus;
  note: string;
};

const initialAppointments: AppointmentRecord[] = [
  {
    id: "apt-01",
    time: "10:00",
    client: "Carlos Mendez",
    service: "Corte + barba",
    employee: "Alejandro Ruiz",
    status: "Confirmada",
    note: "Cliente premium, ofrecer producto final.",
  },
  {
    id: "apt-02",
    time: "11:30",
    client: "Luis Paredes",
    service: "Corte clasico",
    employee: "Matias Soto",
    status: "Pendiente",
    note: "Esperando confirmacion por WhatsApp.",
  },
  {
    id: "apt-03",
    time: "13:00",
    client: "Andres Torres",
    service: "Afeitado premium",
    employee: "Alejandro Ruiz",
    status: "En curso",
    note: "Atencion prioritaria.",
  },
];

const emptyDraft: AppointmentRecord = {
  id: "",
  time: "",
  client: "",
  service: "",
  employee: "",
  status: "Pendiente",
  note: "",
};

const inputClassName =
  "w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-900";

export function AgendaManagement() {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(initialAppointments[0]?.id ?? "");
  const [draft, setDraft] = useState(initialAppointments[0] ?? emptyDraft);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const filteredAppointments = useMemo(() => {
    const text = query.toLowerCase();

    return appointments.filter((appointment) => {
      return (
        appointment.client.toLowerCase().includes(text) ||
        appointment.service.toLowerCase().includes(text) ||
        appointment.employee.toLowerCase().includes(text) ||
        appointment.time.toLowerCase().includes(text)
      );
    });
  }, [appointments, query]);

  const selectedAppointment = appointments.find((appointment) => appointment.id === selectedId);

  const handleSelect = (appointment: AppointmentRecord) => {
    setSelectedId(appointment.id);
    setDraft(appointment);
  };

  const handleSave = () => {
    if (!selectedId || !draft.client || !draft.time) {
      return;
    }

    setAppointments((current) =>
      current.map((appointment) =>
        appointment.id === selectedId ? { ...draft, id: selectedId } : appointment,
      ),
    );
  };

  const handleDelete = () => {
    if (!selectedId) {
      return;
    }

    const nextAppointments = appointments.filter((appointment) => appointment.id !== selectedId);
    setAppointments(nextAppointments);

    if (nextAppointments.length === 0) {
      setSelectedId("");
      setDraft(emptyDraft);
      return;
    }

    setSelectedId(nextAppointments[0].id);
    setDraft(nextAppointments[0]);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.92fr]">
      <div className="space-y-4">
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <KpiCard title="Citas hoy" value={String(appointments.length)} detail="Turnos del dia" />
            <KpiCard
              title="Pendientes"
              value={String(appointments.filter((item) => item.status === "Pendiente").length)}
              detail="Por confirmar"
            />
            <KpiCard
              title="En curso"
              value={String(appointments.filter((item) => item.status === "En curso").length)}
              detail="Siendo atendidas"
            />
          </div>

          <label className="mt-4 flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3">
            <Search size={16} className="text-zinc-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
              placeholder="Buscar por cliente, servicio, persona o hora"
            />
          </label>
        </div>

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
                    <p className="text-lg font-semibold text-zinc-900">{appointment.client}</p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                      {appointment.time}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-600">{appointment.service}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClassName(appointment.status)}`}>
                  {appointment.status}
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-[180px_1fr]">
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Profesional
                  </p>
                  <p className="mt-2 text-sm font-semibold text-zinc-900">{appointment.employee}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Nota
                  </p>
                  <p className="mt-2 text-sm text-zinc-700">{appointment.note}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-zinc-900">Editar cita</p>
          <p className="mt-1 text-sm text-zinc-600">
            Cambia la hora, el estado o la persona que atendera la cita.
          </p>

          <div className="mt-4 grid gap-3">
            <Field label="Hora">
              <input
                type="time"
                className={inputClassName}
                value={draft.time}
                onChange={(event) => setDraft((current) => ({ ...current, time: event.target.value }))}
                disabled={!selectedAppointment}
              />
            </Field>
            <Field label="Cliente">
              <input
                className={inputClassName}
                value={draft.client}
                onChange={(event) => setDraft((current) => ({ ...current, client: event.target.value }))}
                disabled={!selectedAppointment}
              />
            </Field>
            <Field label="Servicio">
              <input
                className={inputClassName}
                value={draft.service}
                onChange={(event) => setDraft((current) => ({ ...current, service: event.target.value }))}
                disabled={!selectedAppointment}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Profesional">
                <input
                  className={inputClassName}
                  value={draft.employee}
                  onChange={(event) => setDraft((current) => ({ ...current, employee: event.target.value }))}
                  disabled={!selectedAppointment}
                />
              </Field>
              <Field label="Estado">
                <select
                  className={inputClassName}
                  value={draft.status}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      status: event.target.value as AppointmentStatus,
                    }))
                  }
                  disabled={!selectedAppointment}
                >
                  <option>Confirmada</option>
                  <option>Pendiente</option>
                  <option>En curso</option>
                  <option>Completada</option>
                </select>
              </Field>
            </div>
            <Field label="Nota operativa">
              <textarea
                className={`${inputClassName} min-h-28 resize-none`}
                value={draft.note}
                onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))}
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

function getStatusClassName(status: AppointmentStatus) {
  if (status === "Completada") {
    return "bg-emerald-100 text-emerald-900";
  }
  if (status === "En curso") {
    return "bg-amber-100 text-amber-900";
  }
  if (status === "Confirmada") {
    return "bg-sky-100 text-sky-900";
  }
  return "bg-rose-100 text-rose-900";
}
