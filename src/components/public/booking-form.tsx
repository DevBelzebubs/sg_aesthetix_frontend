"use client";

import { useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, Scissors, UserRound } from "lucide-react";

type BookingOption = {
  name: string;
  duration: string;
  price: string;
};

type TeamMember = {
  name: string;
  role: string;
};

type CalendarDate = {
  value: string;
  weekday: string;
  day: string;
  month: string;
  monthLabel: string;
  label: string;
};

type BookingFormProps = {
  businessName: string;
  services: BookingOption[];
  barbers: TeamMember[];
  availableDates: CalendarDate[];
  availableSlots: string[];
};

type BookingDraft = {
  service: string;
  barber: string;
  date: string;
  time: string;
  customerName: string;
  phone: string;
  email: string;
};

const initialDraft: BookingDraft = {
  service: "",
  barber: "",
  date: "",
  time: "",
  customerName: "",
  phone: "",
  email: "",
};

const inputClassName =
  "w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-[var(--tenant-text)] outline-none transition placeholder:text-[var(--tenant-muted)] focus:border-[var(--tenant-primary)] focus:ring-4 focus:ring-[color:color-mix(in_srgb,var(--tenant-primary)_14%,white)]";

const calendarWeekdays = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

export function BookingForm({
  businessName,
  services,
  barbers,
  availableDates,
  availableSlots,
}: BookingFormProps) {
  const [formData, setFormData] = useState<BookingDraft>({
    ...initialDraft,
    service: services[0]?.name ?? "",
    barber: barbers[0]?.name ?? "",
    date: availableDates[0]?.value ?? "",
    time: availableSlots[0] ?? "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const monthOptions = useMemo(() => {
    const groupedMonths = new Map<
      string,
      {
        key: string;
        label: string;
        year: number;
        month: number;
        firstDay: number;
        totalDays: number;
        datesByDay: Map<number, CalendarDate>;
      }
    >();

    availableDates.forEach((date) => {
      const parsedDate = parseCalendarDate(date.value);
      const year = parsedDate.getFullYear();
      const month = parsedDate.getMonth();
      const key = `${year}-${String(month + 1).padStart(2, "0")}`;

      if (!groupedMonths.has(key)) {
        groupedMonths.set(key, {
          key,
          label: date.monthLabel,
          year,
          month,
          firstDay: new Date(year, month, 1).getDay(),
          totalDays: new Date(year, month + 1, 0).getDate(),
          datesByDay: new Map<number, CalendarDate>(),
        });
      }

      groupedMonths.get(key)?.datesByDay.set(parsedDate.getDate(), date);
    });

    return Array.from(groupedMonths.values()).sort((left, right) =>
      left.key.localeCompare(right.key),
    );
  }, [availableDates]);

  const [activeMonthKey, setActiveMonthKey] = useState(() => monthOptions[0]?.key ?? "");

  const selectedService = useMemo(
    () => services.find((service) => service.name === formData.service),
    [formData.service, services],
  );

  const selectedDate = useMemo(
    () => availableDates.find((date) => date.value === formData.date),
    [availableDates, formData.date],
  );
  const selectedMonthKey = selectedDate ? buildMonthKey(parseCalendarDate(selectedDate.value)) : "";

  const activeMonth = useMemo(
    () =>
      monthOptions.find((month) => month.key === activeMonthKey) ??
      monthOptions.find((month) => month.key === selectedMonthKey) ??
      monthOptions[0],
    [activeMonthKey, monthOptions, selectedMonthKey],
  );

  const calendarCells = useMemo(() => {
    if (!activeMonth) {
      return [];
    }

    return Array.from({ length: activeMonth.firstDay + activeMonth.totalDays }, (_, index) => {
      if (index < activeMonth.firstDay) {
        return null;
      }

      const dayNumber = index - activeMonth.firstDay + 1;
      const availableDate = activeMonth.datesByDay.get(dayNumber);

      return {
        dayNumber,
        availableDate,
      };
    });
  }, [activeMonth]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
    setIsSubmitted(false);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.72fr]">
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-[2rem] border border-black/10 bg-[linear-gradient(180deg,white,color-mix(in_srgb,var(--tenant-accent)_10%,white))] p-5 shadow-xl shadow-black/5 sm:p-8"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--tenant-muted)]">
              Reserva online
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Elige tu fecha y hora
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[var(--tenant-muted)] sm:text-base">
              Simplificamos la reserva para que elijas el turno sin ruido. Esta
              confirmacion sigue siendo local mientras conectamos disponibilidad real.
            </p>
          </div>

          <div className="rounded-3xl border border-[var(--tenant-primary)]/15 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--tenant-primary)_12%,white),color-mix(in_srgb,var(--tenant-accent)_14%,white))] px-4 py-3 text-sm shadow-sm">
            <p className="font-semibold text-[var(--tenant-text)]">{businessName}</p>
            <p className="mt-1 text-[var(--tenant-muted)]">Agenda visual y confirmacion rapida</p>
          </div>
        </div>

        {isSubmitted ? (
          <div className="flex items-start gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Turno listo para integracion</p>
              <p className="mt-1">
                Simulamos la confirmacion para {formData.customerName || "tu reserva"} el{" "}
                {selectedDate?.label ?? "dia elegido"} a las {formData.time}.
              </p>
            </div>
          </div>
        ) : null}

        <section className="space-y-4 rounded-[1.75rem] border border-sky-200 bg-gradient-to-br from-white to-sky-50 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--tenant-primary)] text-white">
              <Scissors className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">Servicio</h2>
              <p className="text-sm text-[var(--tenant-muted)]">
                Empieza por lo esencial y ajusta el resto despues.
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            {services.map((service) => {
              const isActive = formData.service === service.name;

              return (
                <button
                  key={service.name}
                  type="button"
                  onClick={() => {
                    setFormData((current) => ({ ...current, service: service.name }));
                    setIsSubmitted(false);
                  }}
                  className={`rounded-3xl border px-4 py-4 text-left transition ${
                    isActive
                      ? "border-[var(--tenant-primary)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--tenant-primary)_11%,white),white)] shadow-lg shadow-black/5"
                      : "border-black/10 bg-white hover:-translate-y-0.5 hover:border-[var(--tenant-primary)]/30 hover:bg-sky-50/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold">{service.name}</p>
                      <p className="mt-1 text-sm text-[var(--tenant-muted)]">{service.duration}</p>
                    </div>
                    <p className="text-base font-semibold text-[var(--tenant-primary)]">
                      {service.price}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-4 rounded-[1.75rem] border border-amber-200 bg-gradient-to-br from-white to-amber-50 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--tenant-primary)] text-white">
              <CalendarDays className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">Calendario de reservas</h2>
              <p className="text-sm text-[var(--tenant-muted)]">
                Selecciona un dia y luego el horario disponible.
              </p>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-amber-200 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--tenant-primary)_4%,white),color-mix(in_srgb,#f59e0b_14%,white))] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--tenant-muted)]">
                  Fechas disponibles
                </p>
                <p className="mt-1 text-sm text-[var(--tenant-muted)]">
                  {activeMonth?.label ?? "Disponibilidad actual"}
                </p>
              </div>

              <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                {availableSlots.length} horarios abiertos
              </div>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {monthOptions.map((month) => {
                const isActive = month.key === activeMonth?.key;

                return (
                  <button
                    key={month.key}
                    type="button"
                    onClick={() => setActiveMonthKey(month.key)}
                    className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                      isActive
                        ? "border-[var(--tenant-primary)] bg-white text-[var(--tenant-primary)] shadow-sm"
                        : "border-black/10 bg-white/80 text-[var(--tenant-muted)] hover:border-[var(--tenant-primary)]/30 hover:text-[var(--tenant-text)]"
                    }`}
                  >
                    {month.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 rounded-[1.25rem] border border-black/10 bg-white/85 p-2 sm:p-3">
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {calendarWeekdays.map((weekday) => (
                  <span
                    key={weekday}
                    className="pb-1 text-center text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--tenant-muted)] sm:pb-2 sm:text-[11px] sm:tracking-[0.12em]"
                  >
                    {weekday}
                  </span>
                ))}

                {calendarCells.map((cell, index) => {
                  if (!cell) {
                    return <span key={`empty-${index}`} className="aspect-square" />;
                  }

                  const isActive = formData.date === cell.availableDate?.value;
                  const isAvailable = Boolean(cell.availableDate);

                  return (
                    <button
                      key={cell.availableDate?.value ?? `day-${cell.dayNumber}`}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => {
                        if (!cell.availableDate) {
                          return;
                        }

                        setFormData((current) => ({
                          ...current,
                          date: cell.availableDate?.value ?? current.date,
                        }));
                        setIsSubmitted(false);
                      }}
                      className={`flex h-10 items-center justify-center rounded-xl border text-xs font-semibold transition sm:aspect-square sm:min-h-11 sm:flex-col sm:rounded-2xl sm:text-sm ${
                        isActive
                          ? "border-[var(--tenant-primary)] bg-[var(--tenant-primary)] text-white shadow-md shadow-black/10"
                          : isAvailable
                            ? "border-black/10 bg-white text-[var(--tenant-text)] hover:border-[var(--tenant-primary)]/30 hover:bg-amber-50"
                            : "border-transparent bg-transparent text-zinc-300"
                      }`}
                    >
                      <span>{String(cell.dayNumber).padStart(2, "0")}</span>
                      <span
                        className={`ml-1 h-1.5 w-1.5 rounded-full sm:ml-0 sm:mt-1 ${
                          isActive
                            ? "bg-white"
                            : isAvailable
                              ? "bg-[var(--tenant-primary)]/55"
                              : "bg-transparent"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">Horarios</p>
              <p className="text-sm text-[var(--tenant-muted)]">
                {selectedDate?.label ?? "Selecciona una fecha"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {availableSlots.map((slot) => {
                const isActive = formData.time === slot;

                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => {
                      setFormData((current) => ({ ...current, time: slot }));
                      setIsSubmitted(false);
                    }}
                    className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                      isActive
                        ? "border-[var(--tenant-primary)] bg-[var(--tenant-primary)] text-white shadow-lg shadow-black/10"
                        : "border-black/10 bg-white hover:border-[var(--tenant-primary)]/30 hover:bg-[linear-gradient(135deg,color-mix(in_srgb,var(--tenant-primary)_7%,white),color-mix(in_srgb,#f59e0b_9%,white))]"
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-[1.75rem] border border-emerald-200 bg-gradient-to-br from-white to-emerald-50 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--tenant-primary)] text-white">
              <UserRound className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">Datos de contacto</h2>
              <p className="text-sm text-[var(--tenant-muted)]">
                Solo lo necesario para sostener tu reserva.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium">Nombre completo</span>
              <input
                required
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                placeholder="Ej. Juan Perez"
                className={inputClassName}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">Telefono</span>
              <input
                required
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="999 999 999"
                className={inputClassName}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">Email</span>
              <input
                required
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="nombre@correo.com"
                className={inputClassName}
              />
            </label>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] border border-black/10 bg-[linear-gradient(135deg,white,color-mix(in_srgb,var(--tenant-primary)_6%,white))] px-5 py-4">
          <p className="max-w-xl text-sm text-[var(--tenant-muted)]">
            La reserva se confirma visualmente en esta etapa. Todavia no enviaremos
            datos al backend.
          </p>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-[var(--tenant-primary)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:opacity-95"
          >
            Confirmar turno
          </button>
        </div>
      </form>

      <aside className="space-y-5">
        <div className="rounded-[2rem] border border-black/10 bg-[linear-gradient(145deg,white,color-mix(in_srgb,var(--tenant-primary)_8%,white),color-mix(in_srgb,var(--tenant-accent)_14%,white))] p-6 shadow-xl shadow-black/5 xl:sticky xl:top-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--tenant-muted)]">
            Resumen rapido
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">Tu cita</h2>

          <div className="mt-5 space-y-3">
            <SummaryRow
              icon={<Scissors className="h-4 w-4" />}
              label="Servicio"
              value={formData.service}
            />
            <SummaryRow
              icon={<UserRound className="h-4 w-4" />}
              label="Profesional"
              value={formData.barber}
            />
            <SummaryRow
              icon={<CalendarDays className="h-4 w-4" />}
              label="Fecha"
              value={selectedDate?.label ?? ""}
            />
            <SummaryRow icon={<Clock3 className="h-4 w-4" />} label="Hora" value={formData.time} />
          </div>

          <div className="mt-5 rounded-[1.75rem] bg-[linear-gradient(135deg,var(--tenant-primary),color-mix(in_srgb,var(--tenant-primary)_70%,var(--tenant-accent)))] px-5 py-5 text-white">
            <p className="text-sm text-white/80">Inversion estimada</p>
            <p className="mt-1 text-3xl font-bold">{selectedService?.price ?? "--"}</p>
            <p className="mt-1 text-sm text-white/80">{selectedService?.duration ?? "Sin duracion"}</p>
          </div>

          <div className="mt-5 rounded-[1.5rem] border border-black/10 bg-white/90 px-4 py-4">
            <p className="text-sm font-semibold">Profesional asignado</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {barbers.map((barber) => {
                const isActive = formData.barber === barber.name;

                return (
                  <button
                    key={barber.name}
                    type="button"
                    onClick={() => {
                      setFormData((current) => ({ ...current, barber: barber.name }));
                      setIsSubmitted(false);
                    }}
                    className={`rounded-full border px-3 py-2 text-sm transition ${
                      isActive
                        ? "border-[var(--tenant-primary)] bg-[color:color-mix(in_srgb,var(--tenant-primary)_10%,white)] font-semibold text-[var(--tenant-primary)]"
                        : "border-black/10 bg-white text-[var(--tenant-muted)] hover:border-[var(--tenant-primary)]/30 hover:bg-[color:color-mix(in_srgb,var(--tenant-accent)_10%,white)] hover:text-[var(--tenant-text)]"
                    }`}
                  >
                    {barber.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--tenant-primary)]/10 text-[var(--tenant-primary)]">
        {icon}
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--tenant-muted)]">
          {label}
        </p>
        <p className="mt-1 text-sm font-semibold">{value || "Pendiente"}</p>
      </div>
    </div>
  );
}

function parseCalendarDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function buildMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
