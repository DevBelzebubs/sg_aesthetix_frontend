"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  Scissors,
  ShieldCheck,
  Sparkles,
  Star,
  TimerReset,
  UserRound,
} from "lucide-react";

type ServiceLink = {
  id: string;
  name: string;
  duration: string;
  price: string;
  category: string;
  demand: string;
};

type Appointment = {
  id: string;
  time: string;
  client: string;
  service: string;
  status: "Confirmada" | "En curso" | "Pendiente";
  note: string;
};

const linkedServices: ServiceLink[] = [
  {
    id: "svc-fade",
    name: "Fade premium",
    duration: "50 min",
    price: "$24",
    category: "Corte",
    demand: "Alta demanda",
  },
  {
    id: "svc-barba",
    name: "Perfilado de barba",
    duration: "25 min",
    price: "$12",
    category: "Barba",
    demand: "Complementario",
  },
  {
    id: "svc-combo",
    name: "Corte + barba",
    duration: "70 min",
    price: "$30",
    category: "Combo",
    demand: "Muy pedido",
  },
];

const initialAppointments: Appointment[] = [
  {
    id: "apt-01",
    time: "10:00",
    client: "Carlos Mendez",
    service: "Fade premium",
    status: "Confirmada",
    note: "Mantener laterales bajos.",
  },
  {
    id: "apt-02",
    time: "11:30",
    client: "Andres Torres",
    service: "Corte + barba",
    status: "En curso",
    note: "Cliente frecuente, ofrecer producto final.",
  },
  {
    id: "apt-03",
    time: "13:00",
    client: "Julian Rojas",
    service: "Perfilado de barba",
    status: "Pendiente",
    note: "Llega 10 min antes.",
  },
];

const checklistItems = [
  "Herramientas limpias y listas",
  "Toallas y navajas revisadas",
  "Citas de la tarde confirmadas",
  "Notas de clientes actualizadas",
];

const noteInputClassName =
  "min-h-32 w-full rounded-3xl border border-zinc-200 px-4 py-4 text-sm outline-none transition focus:border-zinc-900";

type EmployeeWorkspaceProps = {
  initialView?: "jornada" | "servicios" | "agenda";
};

export function EmployeeWorkspace({
  initialView = "jornada",
}: EmployeeWorkspaceProps) {
  const router = useRouter();
  const [appointments, setAppointments] = useState(initialAppointments);
  const [isAvailable, setIsAvailable] = useState(true);
  const [selectedServiceId, setSelectedServiceId] = useState(linkedServices[0]?.id ?? "");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(
    initialAppointments[0]?.id ?? "",
  );
  const [dailyNote, setDailyNote] = useState(
    "Recordar preferencias nuevas y ofrecer combo cuando encaje.",
  );

  const pendingCount = useMemo(
    () => appointments.filter((appointment) => appointment.status === "Pendiente").length,
    [appointments],
  );

  const selectedService = useMemo(
    () => linkedServices.find((service) => service.id === selectedServiceId) ?? linkedServices[0],
    [selectedServiceId],
  );

  const selectedAppointment = useMemo(
    () =>
      appointments.find((appointment) => appointment.id === selectedAppointmentId) ??
      appointments[0],
    [appointments, selectedAppointmentId],
  );

  const nextAppointment = useMemo(
    () =>
      appointments.find((appointment) => appointment.status === "Pendiente") ??
      appointments.find((appointment) => appointment.status === "Confirmada"),
    [appointments],
  );

  const advanceAppointment = (appointmentId: string) => {
    setAppointments((current) =>
      current.map((appointment) => {
        if (appointment.id !== appointmentId) {
          return appointment;
        }

        if (appointment.status === "Pendiente") {
          return { ...appointment, status: "Confirmada" };
        }

        if (appointment.status === "Confirmada") {
          return { ...appointment, status: "En curso" };
        }

        return { ...appointment, status: "Confirmada" };
      }),
    );

    setSelectedAppointmentId(appointmentId);
  };

  const openView = (view: "jornada" | "servicios" | "agenda") => {
    if (view === "jornada") {
      router.push("/empleado");
      return;
    }

    if (view === "servicios") {
      router.push("/empleado/servicios");
      return;
    }

    router.push("/empleado/citas");
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="grid gap-5 xl:grid-cols-[1.35fr_0.75fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Mi jornada
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
              Tus servicios y tus citas
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">
              Aqui ves solo lo que te corresponde hoy, con una vista clara y rapida.
            </p>
          </div>

          <div
            className={`rounded-[1.75rem] border px-5 py-4 transition ${
              isAvailable
                ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-lime-50"
                : "border-rose-200 bg-gradient-to-br from-rose-50 to-orange-50"
            }`}
          >
            <p className="text-sm font-semibold text-zinc-900">Estado de hoy</p>
            <p className="mt-1 text-sm text-zinc-600">
              {isAvailable
                ? "Puedes seguir recibiendo nuevas citas."
                : "No entraran nuevas citas por ahora."}
            </p>
            <button
              type="button"
              onClick={() => setIsAvailable((current) => !current)}
              className={`mt-4 rounded-full px-4 py-2 text-sm font-semibold transition ${
                isAvailable
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-rose-600 text-white hover:bg-rose-700"
              }`}
            >
              {isAvailable ? "Disponible" : "No disponible"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Citas hoy"
            value="8"
            icon={<CalendarClock size={18} />}
            detail="2 mas por la tarde"
            isActive={initialView === "agenda"}
            onClick={() => openView("agenda")}
          />
          <KpiCard
            label="Mis servicios"
            value={String(linkedServices.length)}
            icon={<Scissors size={18} />}
            detail="Solo los tuyos"
            isActive={initialView === "servicios"}
            onClick={() => openView("servicios")}
          />
          <KpiCard
            label="Pendientes"
            value={String(pendingCount)}
            icon={<TimerReset size={18} />}
            detail="Por confirmar"
            isActive={initialView === "jornada"}
            onClick={() => openView("jornada")}
          />
          <KpiCard
            label="Puntuacion"
            value="4.9"
            icon={<Star size={18} />}
            detail="Promedio semanal"
            isActive={initialView === "jornada"}
            onClick={() => openView("jornada")}
          />
        </div>
      </section>

      {initialView === "jornada" ? (
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.95fr]">
          <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-zinc-900">Resumen del dia</p>
                <p className="mt-1 text-sm text-zinc-600">
                  Entra rapido a lo que necesitas ver ahora.
                </p>
              </div>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
                Vista activa
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={() => openView("servicios")}
                className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
              >
                <p className="text-lg font-semibold text-zinc-900">Mis servicios</p>
                <p className="mt-2 text-sm text-zinc-600">
                  Revisa solo lo que puedes atender hoy.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                    {linkedServices.length} servicios
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                    {selectedService?.name}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => openView("agenda")}
                className="rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
              >
                <p className="text-lg font-semibold text-zinc-900">Mis citas</p>
                <p className="mt-2 text-sm text-zinc-600">
                  Mira tus turnos y actualiza su estado.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                    {appointments.length} citas
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                    {pendingCount} pendientes
                  </span>
                </div>
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <section className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
                <p className="text-sm font-semibold text-zinc-900">Antes de empezar</p>
                <div className="mt-4 space-y-3">
                  {checklistItems.map((item, index) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3"
                    >
                      {index < 2 ? (
                        <CheckCircle2 size={18} className="text-emerald-600" />
                      ) : (
                        <ClipboardList size={18} className="text-zinc-500" />
                      )}
                      <span className="text-sm text-zinc-700">{item}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
                <p className="text-sm font-semibold text-zinc-900">Nota del dia</p>
                <textarea
                  value={dailyNote}
                  onChange={(event) => setDailyNote(event.target.value)}
                  className={`mt-4 bg-white ${noteInputClassName}`}
                />
              </section>
            </div>
          </section>

          <div className="grid gap-6">
            <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-zinc-900">Siguiente cita</p>
              {nextAppointment ? (
                <div className="mt-4 rounded-3xl bg-zinc-900 p-5 text-white">
                  <p className="text-sm text-zinc-300">{nextAppointment.time}</p>
                  <p className="mt-1 text-xl font-bold">{nextAppointment.client}</p>
                  <p className="mt-2 text-sm text-zinc-300">{nextAppointment.service}</p>
                  <div className="mt-4 flex items-center gap-2 text-sm text-zinc-200">
                    <BadgeCheck size={16} />
                    {nextAppointment.note}
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-zinc-600">No hay citas por atender.</p>
              )}
            </section>

            <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-zinc-900">Tu perfil</p>
              <div className="mt-4 space-y-3 text-sm text-zinc-600">
                <p className="flex items-center gap-2">
                  <UserRound size={16} />
                  Alejandro Ruiz - Barber Senior
                </p>
                <p className="flex items-center gap-2">
                  <Sparkles size={16} />
                  Especialista en fade, barba y acabados premium
                </p>
                <p className="flex items-center gap-2">
                  <Clock3 size={16} />
                  Hoy trabajas de 9:00 AM a 6:00 PM
                </p>
              </div>

              <div className="mt-5 grid gap-3">
                <MiniInfo
                  icon={<Sparkles size={16} />}
                  title="Hoy conviene"
                  detail="Ofrecer combos cuando el cliente ya pide barba o acabado."
                />
                <MiniInfo
                  icon={<ShieldCheck size={16} />}
                  title="No olvidar"
                  detail="Guardar observaciones utiles al terminar cada cita."
                />
              </div>
            </section>
          </div>
        </div>
      ) : null}

      {initialView === "servicios" ? (
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-zinc-900">Mis servicios</p>
                <p className="mt-1 text-sm text-zinc-600">Solo ves los que te asignaron.</p>
              </div>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
                {linkedServices.length} servicios
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {linkedServices.map((service) => (
                <article
                  key={service.id}
                  onClick={() => setSelectedServiceId(service.id)}
                  className={`cursor-pointer rounded-3xl border p-5 transition ${
                    selectedServiceId === service.id
                      ? "border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm"
                      : "border-zinc-200 bg-zinc-50 hover:border-zinc-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-zinc-900">{service.name}</p>
                      <p className="mt-1 text-sm text-zinc-600">{service.category}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getDemandClassName(
                        service.demand,
                      )}`}
                    >
                      {service.demand}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                      {service.duration}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                      {service.price}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-zinc-900">Detalle del servicio</p>
            <div className="mt-4 rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xl font-semibold text-zinc-900">{selectedService?.name}</p>
                  <p className="mt-1 text-sm text-zinc-600">{selectedService?.category}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getDemandClassName(
                    selectedService?.demand ?? "",
                  )}`}
                >
                  {selectedService?.demand}
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <InfoTile label="Tiempo" value={selectedService?.duration ?? "--"} />
                <InfoTile label="Precio" value={selectedService?.price ?? "--"} />
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <MiniInfo
                icon={<Scissors size={16} />}
                title="Lo que haces"
                detail="Aqui revisas rapido que servicios puedes atender."
              />
              <MiniInfo
                icon={<Star size={16} />}
                title="Lo mas pedido"
                detail="Prioriza lo que mas te reservan durante el dia."
              />
            </div>
          </section>
        </div>
      ) : null}

      {initialView === "agenda" ? (
        <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
          <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-zinc-900">Mis citas</p>
                <p className="mt-1 text-sm text-zinc-600">Marca el avance de cada una.</p>
              </div>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
                {appointments.length} citas
              </span>
            </div>

            <div className="mt-5 grid gap-4">
              {appointments.map((appointment) => (
                <article
                  key={appointment.id}
                  onClick={() => setSelectedAppointmentId(appointment.id)}
                  className={`cursor-pointer rounded-3xl border p-5 transition ${
                    selectedAppointmentId === appointment.id
                      ? "border-sky-300 bg-gradient-to-br from-sky-50 to-cyan-50 shadow-sm"
                      : "border-zinc-200 bg-zinc-50 hover:border-zinc-300"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="text-base font-semibold text-zinc-900">{appointment.client}</p>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                          {appointment.time}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-zinc-600">{appointment.service}</p>
                    </div>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        advanceAppointment(appointment.id);
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100"
                    >
                      Cambiar estado
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getAppointmentStatusClassName(
                        appointment.status,
                      )}`}
                    >
                      {appointment.status}
                    </span>
                    <p className="text-sm text-zinc-600">{appointment.note}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <div className="grid gap-6">
            <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-zinc-900">Cita elegida</p>
              {selectedAppointment ? (
                <div className="mt-4 rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-zinc-900">{selectedAppointment.client}</p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
                      {selectedAppointment.time}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-600">{selectedAppointment.service}</p>
                  <span
                    className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getAppointmentStatusClassName(
                      selectedAppointment.status,
                    )}`}
                  >
                    {selectedAppointment.status}
                  </span>
                  <p className="mt-4 text-sm text-zinc-700">{selectedAppointment.note}</p>

                  <button
                    type="button"
                    onClick={() => advanceAppointment(selectedAppointment.id)}
                    className="mt-5 inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
                  >
                    Actualizar cita
                    <ChevronRight size={16} />
                  </button>
                </div>
              ) : (
                <p className="mt-4 text-sm text-zinc-600">Elige una cita para ver mas.</p>
              )}
            </section>

            <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-zinc-900">Siguiente cita</p>
              {nextAppointment ? (
                <div className="mt-4 rounded-3xl bg-zinc-900 p-5 text-white">
                  <p className="text-sm text-zinc-300">{nextAppointment.time}</p>
                  <p className="mt-1 text-xl font-bold">{nextAppointment.client}</p>
                  <p className="mt-2 text-sm text-zinc-300">{nextAppointment.service}</p>
                  <div className="mt-4 flex items-center gap-2 text-sm text-zinc-200">
                    <BadgeCheck size={16} />
                    {nextAppointment.note}
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-zinc-600">No hay citas por atender.</p>
              )}
            </section>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
  detail,
  isActive,
  onClick,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  detail: string;
  isActive?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-3xl border p-5 text-left transition ${
        isActive
          ? "border-zinc-900 bg-white shadow-sm"
          : "border-zinc-200 bg-zinc-50 hover:-translate-y-0.5 hover:bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-zinc-700">{label}</p>
        <div className="rounded-2xl bg-white p-2 text-zinc-700">{icon}</div>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-zinc-900">{value}</p>
      <p className="mt-2 text-sm text-zinc-600">{detail}</p>
    </button>
  );
}

function MiniInfo({
  icon,
  title,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
      <div className="flex items-center gap-2 text-zinc-800">
        {icon}
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <p className="mt-2 text-sm text-zinc-600">{detail}</p>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-zinc-900">{value}</p>
    </div>
  );
}

function getDemandClassName(demand: string) {
  if (demand === "Muy pedido") {
    return "bg-amber-100 text-amber-900";
  }

  if (demand === "Alta demanda") {
    return "bg-sky-100 text-sky-900";
  }

  return "bg-emerald-100 text-emerald-900";
}

function getAppointmentStatusClassName(status: Appointment["status"]) {
  if (status === "En curso") {
    return "bg-amber-100 text-amber-900";
  }

  if (status === "Confirmada") {
    return "bg-emerald-100 text-emerald-900";
  }

  return "bg-sky-100 text-sky-900";
}
