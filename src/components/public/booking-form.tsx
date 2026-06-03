"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { AppointmentsService } from "@/services/appointments.service";
import { CustomersService } from "@/services/customers.service";
import { useCustomerAuth } from "@/contexts/customer-auth-context";
import { validateDni, validateDniOptional, validateEmail, validateEmailOptional, validateName, validateRequired } from "@/lib/validators";

type BookingOption = {
  id: string;
  name: string;
  duration: string;
  price: string;
};

type TeamMember = {
  id: string;
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
  serviceId: string;
  barberId: string;
  date: string;
  time: string;
  customerName: string;
  phone: string;
  email: string;
  dni: string;
};

const initialDraft: BookingDraft = {
  serviceId: "",
  barberId: "",
  date: "",
  time: "",
  customerName: "",
  phone: "",
  email: "",
  dni: "",
};

const fieldClass =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3.5 text-base text-[var(--foreground)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--hover)] focus:ring-2 focus:ring-[var(--hover)]/20";

const calendarWeekdays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function validatePhone9(v: string): string | null {
  const digits = v.replace(/\D/g, "");
  if (!digits) return "El teléfono es obligatorio";
  if (digits.length !== 9) return "El teléfono debe tener 9 dígitos";
  return null;
}

function onlyDigits(v: string): string {
  return v.replace(/\D/g, "").slice(0, 9);
}

export function BookingForm({
  businessName,
  services,
  barbers,
  availableDates,
  availableSlots,
}: BookingFormProps) {
  const [stage, setStage] = useState<"dni" | "register" | "booking">("dni");
  const [dni, setDni] = useState("");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [formData, setFormData] = useState<BookingDraft>({
    ...initialDraft,
    serviceId: services[0]?.id ?? "",
    barberId: barbers[0]?.id ?? "",
    date: availableDates[0]?.value ?? "",
    time: availableSlots[0] ?? "",
  });

  const { session: customerSession } = useCustomerAuth();

  useEffect(() => {
    if (!customerSession) return;
    setCustomerId(customerSession.id);
    (async () => {
      try {
        const all = await CustomersService.getAll();
        const found = all.find((c) => c.id === customerSession.id);
        if (found) {
          const parts = found.nombres.trim().split(/\s+/);
          const nombres = parts.slice(0, -1).join(" ") || parts[0] || "";
          const apellidos = parts.slice(-1).join("") || parts[0] || "";
          setFormData((c) => ({
            ...c,
            customerName: `${nombres} ${apellidos}`.trim(),
            phone: found.telefono ?? c.phone,
            email: found.correoElectronico ?? c.email,
            dni: found.dni ?? c.dni,
          }));
        }
      } catch {}
    })();
    setStage("booking");
  }, [customerSession]);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const monthOptions = useMemo(() => {
    const groupedMonths = new Map
      <string,{
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
    () => services.find((service) => service.id === formData.serviceId),
    [formData.serviceId, services],
  );

  const selectedDate = useMemo(
    () => availableDates.find((date) => date.value === formData.date),
    [availableDates, formData.date],
  );

  const selectedMonthKey = selectedDate
    ? buildMonthKey(parseCalendarDate(selectedDate.value))
    : "";

  const activeMonth = useMemo(
    () =>
      monthOptions.find((month) => month.key === activeMonthKey) ??
      monthOptions.find((month) => month.key === selectedMonthKey) ??
      monthOptions[0],
    [activeMonthKey, monthOptions, selectedMonthKey],
  );

  const calendarCells = useMemo(() => {
    if (!activeMonth) return [];

    return Array.from(
      { length: activeMonth.firstDay + activeMonth.totalDays },
      (_, index) => {
        if (index < activeMonth.firstDay) return null;
        const dayNumber = index - activeMonth.firstDay + 1;
        const availableDate = activeMonth.datesByDay.get(dayNumber);
        return { dayNumber, availableDate };
      },
    );
  }, [activeMonth]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setIsSubmitted(false);
    setError("");
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleDniLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateDni(dni);
    if (err) {
      setFieldErrors({ dni: err });
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const customer = await CustomersService.findByDni(dni);
      if (customer) {
        setCustomerId(customer.id);
        const nameParts = customer.nombres.trim().split(/\s+/);
        const nombres = nameParts.slice(0, -1).join(" ") || nameParts[0] || "";
        const apellidos = nameParts.slice(-1).join("") || nameParts[0] || "";
        setFormData((c) => ({
          ...c,
          customerName: `${nombres} ${apellidos}`.trim(),
          phone: customer.telefono ?? c.phone,
          email: customer.correoElectronico ?? c.email,
          dni: customer.dni ?? dni,
        }));
        setStage("booking");
      } else {
        setFormData((c) => ({ ...c, dni }));
        setStage("register");
      }
    } catch {
      setError("Error al buscar DNI");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    const nameErr = validateName(formData.customerName);
    const phoneErr = validatePhone9(formData.phone);
    const emailErr = validateEmailOptional(formData.email);
    if (nameErr) errors.customerName = nameErr;
    if (phoneErr) errors.phone = phoneErr;
    if (emailErr) errors.email = emailErr;
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const nameParts = formData.customerName.trim().split(/\s+/);
      const nombres = nameParts.slice(0, -1).join(" ") || nameParts[0] || "";
      const apellidos = nameParts.slice(-1).join("") || nameParts[0] || "";
      const newCustomer = await CustomersService.create({
        nombres,
        apellidos,
        dni: formData.dni || undefined,
        telefono: formData.phone,
        correoElectronico: formData.email,
      });
      setCustomerId(newCustomer.id);
      setStage("booking");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors: Record<string, string> = {};
    const nameErr = validateName(formData.customerName);
    const phoneErr = validatePhone9(formData.phone);
    const emailErr = validateEmail(formData.email);
    const dniErr = validateDniOptional(formData.dni);
    const serviceErr = validateRequired(formData.serviceId, "El servicio");
    const dateErr = validateRequired(formData.date, "La fecha");
    const timeErr = validateRequired(formData.time, "La hora");
    if (nameErr) errors.customerName = nameErr;
    if (phoneErr) errors.phone = phoneErr;
    if (emailErr) errors.email = emailErr;
    if (dniErr) errors.dni = dniErr;
    if (serviceErr) errors.serviceId = serviceErr;
    if (dateErr) errors.date = dateErr;
    if (timeErr) errors.time = timeErr;
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      if (!customerId) throw new Error("Cliente no identificado");
      const exactService = services.find((s) => s.id === formData.serviceId);
      const exactBarber = barbers.find((b) => b.id === formData.barberId);

      if (!exactService) throw new Error("El servicio seleccionado no está disponible");
      const empleadoId = exactBarber?.id ?? "";

      const duration = exactService.duration;
      const endTimeHHMM = calculateEndTime(formData.time, duration);

      const payload = {
        clienteId: customerId,
        servicioId: exactService.id,
        empleadoId,
        fechaReserva: formData.date,
        horaInicio: `${formData.time}:00`,
        horaFin: `${endTimeHHMM}:00`,
        canalReserva: "landing",
        estado: "pendiente",
      };

      await AppointmentsService.createPublic(payload);
      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  return stage === "dni" || stage === "register" ? (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="mb-8 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
          {businessName}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          {stage === "dni" ? "Reserva online" : "Completa tus datos"}
        </h1>
        <p className="mt-2 text-base leading-relaxed text-[var(--text-muted)]">
          {stage === "dni"
            ? "Ingresa tu DNI para agilizar la reserva."
            : "Llena los campos para registrarte."}
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2.5 rounded-2xl border border-[var(--destructive-border)] bg-[var(--destructive-hover)] px-5 py-3.5 text-sm text-[var(--destructive)]">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {stage === "dni" && (
        <form onSubmit={handleDniLookup} className="space-y-4">
          <label className="space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              Número de DNI <span className="text-[var(--destructive)]">*</span>
            </span>
            <input
              type="text"
              value={dni}
              onChange={(e) => {
                setDni(e.target.value);
                setFieldErrors((prev) => ({ ...prev, dni: "" }));
              }}
              placeholder="12345678"
              maxLength={8}
              className={fieldClass}
            />
            {fieldErrors.dni && (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
                <AlertCircle size={11} />
                {fieldErrors.dni}
              </p>
            )}
          </label>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-black px-8 py-3.5 text-xs font-bold uppercase tracking-[0.15em] text-white shadow-sm transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLoading ? "Buscando..." : "Buscar"}
          </button>
        </form>
      )}

      {stage === "register" && (
        <form onSubmit={handleRegister} className="space-y-4">
          <label className="space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              Nombre completo <span className="text-[var(--destructive)]">*</span>
            </span>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => {
                setFormData((c) => ({ ...c, customerName: e.target.value }));
                setFieldErrors((prev) => ({ ...prev, customerName: "" }));
              }}
              placeholder="Juan Pérez"
              className={fieldClass}
            />
            {fieldErrors.customerName && (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
                <AlertCircle size={11} />
                {fieldErrors.customerName}
              </p>
            )}
          </label>
          <label className="space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              Teléfono <span className="text-[var(--destructive)]">*</span>
            </span>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => {
                setFormData((c) => ({ ...c, phone: onlyDigits(e.target.value) }));
                setFieldErrors((prev) => ({ ...prev, phone: "" }));
              }}
              placeholder="999 999 999"
              maxLength={9}
              className={fieldClass}
            />
            {fieldErrors.phone && (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
                <AlertCircle size={11} />
                {fieldErrors.phone}
              </p>
            )}
          </label>
          <label className="space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              Email
            </span>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData((c) => ({ ...c, email: e.target.value }));
                setFieldErrors((prev) => ({ ...prev, email: "" }));
              }}
              placeholder="nombre@correo.com"
              className={fieldClass}
            />
            {fieldErrors.email && (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
                <AlertCircle size={11} />
                {fieldErrors.email}
              </p>
            )}
          </label>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-black px-8 py-3.5 text-xs font-bold uppercase tracking-[0.15em] text-white shadow-sm transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLoading ? "Registrando..." : "Continuar"}
          </button>
        </form>
      )}
    </div>
  ) : (
    <div className="grid gap-px bg-[var(--background)] xl:grid-cols-[1.2fr_0.72fr]">
      <form onSubmit={handleSubmit} className="space-y-0 bg-[var(--background-secondary)]">

        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] px-8 py-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Reserva online
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">Elige tu fecha y hora</h1>
            <p className="mt-2 text-base leading-relaxed text-[var(--text-muted)]">
              Confirmación rápida, sin esperas ni llamadas.
            </p>
          </div>
          <div className="border border-[var(--border)] bg-[var(--background-secondary)] px-4 py-3">
            <p className="text-sm font-bold uppercase tracking-tight">{businessName}</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
              Agenda visual
            </p>
          </div>
        </div>

        {isSubmitted && (
          <div className="flex items-start gap-3 border-b border-[var(--border)] bg-[var(--background)] px-8 py-5 text-white">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="text-sm font-bold uppercase tracking-tight">¡Turno confirmado!</p>
              <p className="mt-1 text-[11px] text-white/60">
                Reserva registrada para el {selectedDate?.label ?? "día elegido"} a las{" "}
                {formData.time}. Te esperamos.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mx-8 mt-6 flex items-center gap-2.5 rounded-2xl border border-[var(--destructive-border)] bg-[var(--destructive-hover)] px-5 py-3.5 text-sm text-[var(--destructive)]">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="border-b border-[var(--border)] px-8 py-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center bg-black text-[10px] font-bold text-white">
              1
            </div>
            <p className="text-sm font-bold uppercase tracking-tight">Servicio</p>
          </div>

          <div className="grid gap-px bg-[var(--background)]">
            {services.map((service) => {
              const isActive = formData.serviceId === service.id;
              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => {
                    setFormData((c) => ({ ...c, serviceId: service.id }));
                    setIsSubmitted(false);
                  }}
                  className={`flex items-center justify-between px-5 py-4 text-left transition ${
                    isActive ? "bg-[var(--background)] text-white" : "bg-[var(--background-secondary)] hover:opacity-75"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 shrink-0 ${
                        isActive ? "bg-[var(--background-secondary)]" : "border border-[var(--border)] bg-transparent"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-bold uppercase tracking-tight">{service.name}</p>
                      <p
                        className={`mt-0.5 text-[10px] uppercase tracking-widest ${
                          isActive ? "text-white/40" : "text-[var(--text-muted)]"
                        }`}
                      >
                        {service.duration}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-base font-black tracking-tight ${
                      isActive ? "text-white" : "text-[var(--tenant-primary)]"
                    }`}
                  >
                    {service.price}
                  </span>
                </button>
              );
            })}
          </div>
          {fieldErrors.serviceId && (
            <p className="mt-2 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
              <AlertCircle size={11} />
              {fieldErrors.serviceId}
            </p>
          )}
        </div>

        <div className="border-b border-[var(--border)] px-8 py-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center bg-black text-[10px] font-bold text-white">
              2
            </div>
            <p className="text-sm font-bold uppercase tracking-tight">Fecha</p>
          </div>

          <div className="mb-4 flex items-center justify-between border-b border-[var(--border)] pb-4">
            <p className="text-sm font-bold uppercase tracking-tight">
              {activeMonth?.label ?? ""}
            </p>
            <div className="flex gap-px">
              {monthOptions.map((month) => {
                const isActive = month.key === activeMonth?.key;
                return (
                  <button
                    key={month.key}
                    type="button"
                    onClick={() => setActiveMonthKey(month.key)}
                    className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest transition ${
                      isActive
                        ? "bg-black text-white"
                        : "bg-[var(--background)] text-[var(--text-muted)] hover:opacity-75"
                    }`}
                  >
                    {month.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-[var(--background)]">
            {calendarWeekdays.map((wd) => (
              <div
                key={wd}
                className="bg-[var(--background-secondary)] py-2 text-center text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]"
              >
                {wd}
              </div>
            ))}

            {calendarCells.map((cell, index) => {
              if (!cell) {
                return <div key={`empty-${index}`} className="bg-[var(--background-secondary)]" />;
              }

              const isActive = formData.date === cell.availableDate?.value;
              const isAvailable = Boolean(cell.availableDate);

              return (
                <button
                  key={cell.availableDate?.value ?? `day-${cell.dayNumber}`}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => {
                    if (!cell.availableDate) return;
                    setFormData((c) => ({
                      ...c,
                      date: cell.availableDate?.value ?? c.date,
                    }));
                    setIsSubmitted(false);
                  }}
                  className={`flex aspect-square items-center justify-center text-xs font-bold transition ${
                    isActive
                      ? "bg-black text-white"
                      : isAvailable
                        ? "bg-[var(--background-secondary)] text-[var(--foreground)] hover:opacity-75"
                        : "bg-[var(--background-secondary)] text-[var(--text-muted)] cursor-default"
                  }`}
                >
                  {String(cell.dayNumber).padStart(2, "0")}
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
            {availableSlots.length} horarios disponibles ·{" "}
            {selectedDate?.label ?? "Selecciona un día"}
          </p>
          {fieldErrors.date && (
            <p className="mt-2 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
              <AlertCircle size={11} />
              {fieldErrors.date}
            </p>
          )}
        </div>

        <div className="border-b border-[var(--border)] px-8 py-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center bg-black text-[10px] font-bold text-white">
              3
            </div>
            <p className="text-sm font-bold uppercase tracking-tight">Horario</p>
          </div>

          <div className="grid grid-cols-3 gap-px bg-[var(--background)] sm:grid-cols-4 lg:grid-cols-6">
            {availableSlots.map((slot) => {
              const isActive = formData.time === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => {
                    setFormData((c) => ({ ...c, time: slot }));
                    setIsSubmitted(false);
                  }}
                  className={`py-3 text-center text-xs font-bold uppercase tracking-wide transition ${
                    isActive
                      ? "bg-[var(--background)] text-white"
                      : "bg-[var(--background-secondary)] text-[var(--foreground)] hover:opacity-75"
                  }`}
                >
                  {slot}
                </button>
              );
            })}
          </div>
          {fieldErrors.time && (
            <p className="mt-2 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
              <AlertCircle size={11} />
              {fieldErrors.time}
            </p>
          )}
        </div>

        <div className="px-8 py-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center bg-black text-[10px] font-bold text-white">
              4
            </div>
            <p className="text-sm font-bold uppercase tracking-tight">Datos de contacto</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                Nombre completo <span className="text-[var(--destructive)]">*</span>
              </span>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                placeholder="Juan Pérez"
                className={fieldClass}
              />
              {fieldErrors.customerName && (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
                  <AlertCircle size={11} />
                  {fieldErrors.customerName}
                </p>
              )}
            </label>

            <label className="space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                Teléfono <span className="text-[var(--destructive)]">*</span>
              </span>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={(e) => {
                  setFormData((c) => ({ ...c, phone: onlyDigits(e.target.value) }));
                  setFieldErrors((prev) => ({ ...prev, phone: "" }));
                }}
                placeholder="999 999 999"
                maxLength={9}
                className={fieldClass}
              />
              {fieldErrors.phone && (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
                  <AlertCircle size={11} />
                  {fieldErrors.phone}
                </p>
              )}
            </label>

            <label className="space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                Email <span className="text-[var(--destructive)]">*</span>
              </span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="nombre@correo.com"
                className={fieldClass}
              />
              {fieldErrors.email && (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
                  <AlertCircle size={11} />
                  {fieldErrors.email}
                </p>
              )}
            </label>

            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                DNI <span className="text-[var(--text-muted)]">(opcional)</span>
              </span>
              <input
                type="text"
                name="dni"
                value={formData.dni}
                onChange={handleChange}
                placeholder="12345678"
                maxLength={8}
                className={fieldClass}
              />
              {fieldErrors.dni && (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
                  <AlertCircle size={11} />
                  {fieldErrors.dni}
                </p>
              )}
            </label>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] pt-6">
            <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
              Al confirmar, tu turno se agendará en nuestro sistema.
            </p>
            <div className="flex flex-col items-end gap-2">
              <button
                type="submit"
                disabled={isLoading || isSubmitted}
                className="rounded-xl bg-black px-8 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-white shadow-sm transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isLoading ? "Procesando..." : isSubmitted ? "¡Confirmado!" : "Confirmar turno"}
              </button>
            </div>
          </div>
        </div>
      </form>

      <aside className="bg-[var(--background-secondary)]">
        <div className="xl:sticky xl:top-6">

          <div className="border-b border-[var(--border)] px-6 py-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Resumen
            </p>
            <h2 className="mt-2 text-xl font-bold uppercase tracking-tight">Tu cita</h2>
          </div>

          <div className="divide-y divide-[var(--border)]/50">
            <SummaryRow label="Servicio" value={selectedService?.name ?? "Pendiente"} />
            <SummaryRow
              label="Profesional"
              value={barbers.find((b) => b.id === formData.barberId)?.name ?? "Pendiente"}
            />
            <SummaryRow label="Fecha" value={selectedDate?.label ?? "Pendiente"} />
            <SummaryRow label="Hora" value={formData.time || "Pendiente"} />
          </div>

          <div className="bg-[var(--background)] px-6 py-6 text-white">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
              Inversión
            </p>
            <p className="mt-2 text-4xl font-black tracking-tight">
              {selectedService?.price ?? "--"}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-white/40">
              {selectedService?.duration ?? "Sin duración"}
            </p>
          </div>

          <div className="px-6 py-6">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              Profesional
            </p>
            <div className="grid gap-px bg-[var(--background)]">
              {barbers.map((barber) => {
                const isActive = formData.barberId === barber.id;
                return (
                  <button
                    key={barber.id}
                    type="button"
                    onClick={() => {
                      setFormData((c) => ({ ...c, barberId: barber.id }));
                      setIsSubmitted(false);
                    }}
                    className={`px-4 py-3 text-left transition ${
                      isActive ? "bg-[var(--background)] text-white" : "bg-[var(--background-secondary)] hover:opacity-75"
                    }`}
                  >
                    <p className="text-sm font-bold uppercase tracking-tight">{barber.name}</p>
                    <p
                      className={`mt-0.5 text-[10px] uppercase tracking-widest ${
                        isActive ? "text-white/40" : "text-[var(--text-muted)]"
                      }`}
                    >
                      {barber.role}
                    </p>
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">{label}</p>
      <p className="text-sm font-bold uppercase tracking-tight">{value}</p>
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

function calculateEndTime(startTime: string, durationString: string): string {
  if (!startTime) return "";
  const minutesToAdd = parseInt(durationString.replace(/\D/g, "")) || 30;
  const [hours, minutes] = startTime.split(":").map(Number);
  const dateObj = new Date();
  dateObj.setHours(hours, minutes + minutesToAdd);
  return `${String(dateObj.getHours()).padStart(2, "0")}:${String(dateObj.getMinutes()).padStart(2, "0")}`;
}
