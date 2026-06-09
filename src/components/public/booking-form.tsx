"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { AppointmentsService } from "@/services/appointments.service";
import { CustomersService } from "@/services/customers.service";
import { useCustomerAuth } from "@/contexts/customer-auth-context";
import { validateDni, validateDniOptional, validateEmail, validateEmailOptional, validateName, validateRequired } from "@/lib/validators";

type BookingOption = {
  id: string;
  name: string;
  duration: string;
  price: string;
  imageUrl: string | null;
};

type TeamMember = {
  id: string;
  name: string;
  role: string;
  imageUrl: string | null;
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
  nombres: string;
  apellidos: string;
  phone: string;
  email: string;
  dni: string;
  fechaNacimiento: string;
};

const initialDraft: BookingDraft = {
  serviceId: "",
  barberId: "",
  date: "",
  time: "",
  nombres: "",
  apellidos: "",
  phone: "",
  email: "",
  dni: "",
  fechaNacimiento: "",
};

const fieldClass =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3.5 text-base text-[var(--foreground)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--hover)] focus:ring-2 focus:ring-[var(--hover)]/20";

const selectClassName =
  "w-full border border-[var(--foreground)]/20 bg-[var(--background-secondary)] px-4 py-3.5 text-base text-[var(--foreground)] outline-none transition focus:border-black focus:ring-0 appearance-none cursor-pointer pr-10";

const inputClassName =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3.5 text-base text-[var(--foreground)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--hover)] focus:ring-2 focus:ring-[var(--hover)]/20";

const calendarWeekdays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const STEPS = ["Servicio", "Profesional", "Fecha", "Horario", "Datos"] as const;

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
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<BookingDraft>(initialDraft);

  const { session: customerSession } = useCustomerAuth();

  useEffect(() => {
    if (!customerSession) return;
    setCustomerId(customerSession.id);
    (async () => {
      try {
        const all = await CustomersService.getAll();
        const found = all.find((c) => c.id === customerSession.id);
        if (found) {
          setFormData((c) => ({
            ...c,
            nombres: found.nombres,
            apellidos: found.apellidos ?? "",
            phone: found.telefono ?? c.phone,
            email: found.correoElectronico ?? c.email,
            dni: found.dni ?? c.dni,
            fechaNacimiento: found.fechaNacimiento ?? c.fechaNacimiento,
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

  const selectedBarber = useMemo(
    () => barbers.find((b) => b.id === formData.barberId),
    [barbers, formData.barberId],
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
        setFormData((c) => ({
          ...c,
          nombres: customer.nombres,
          apellidos: customer.apellidos ?? "",
          phone: customer.telefono ?? c.phone,
          email: customer.correoElectronico ?? c.email,
          dni: customer.dni ?? dni,
          fechaNacimiento: customer.fechaNacimiento ?? c.fechaNacimiento,
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
    if (!formData.nombres || !formData.apellidos || !formData.phone) return;
    setIsLoading(true);
    setError("");
    try {
      const newCustomer = await CustomersService.create({
        nombres: formData.nombres.trim(),
        apellidos: formData.apellidos.trim(),
        dni: formData.dni || undefined,
        telefono: formData.phone,
        correoElectronico: formData.email,
        fechaNacimiento: formData.fechaNacimiento || undefined,
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

  const nextStep = () => setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 0));

  return stage === "dni" || stage === "register" ? (
    <div className="mx-auto max-w-3xl px-8 py-12">
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
              inputMode="numeric"
              maxLength={8}
              value={dni}
              onChange={(e) => setDni(e.target.value.replace(/\D/g, ""))}
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
          {/* Fila 1: Nombres + Apellidos */}
          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                Nombres
              </span>
              <input
                required
                type="text"
                value={formData.nombres}
                onChange={(e) => setFormData((c) => ({ ...c, nombres: e.target.value }))}
                placeholder="Juan"
                className={inputClassName}
              />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                Apellidos
              </span>
              <input
                required
                type="text"
                value={formData.apellidos}
                onChange={(e) => setFormData((c) => ({ ...c, apellidos: e.target.value }))}
                placeholder="Pérez"
                className={inputClassName}
              />
            </label>
          </div>

          {/* Fila 2: DNI + Teléfono */}
          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                DNI
              </span>
              <input
                required
                type="text"
                inputMode="numeric"
                maxLength={8}
                value={formData.dni}
                onChange={(e) => setFormData((c) => ({ ...c, dni: e.target.value.replace(/\D/g, "") }))}
                placeholder="12345678"
                className={inputClassName}
              />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                Teléfono
              </span>
              <input
                required
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData((c) => ({ ...c, phone: e.target.value }))}
                placeholder="999 999 999"
                className={inputClassName}
              />
            </label>
          </div>

          {/* Fila 3: Email + Fecha de nacimiento */}
          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                Email
              </span>
              <input
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((c) => ({ ...c, email: e.target.value }))}
                placeholder="nombre@correo.com"
                className={inputClassName}
              />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                Fecha de nacimiento
              </span>
              <input
                required
                type="date"
                value={formData.fechaNacimiento}
                onChange={(e) => setFormData((c) => ({ ...c, fechaNacimiento: e.target.value }))}
                className={inputClassName}
              />
            </label>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black px-8 py-3.5 text-xs font-bold uppercase tracking-[0.15em] text-white transition hover:opacity-75 disabled:opacity-40"
            >
              {isLoading ? "Registrando..." : "Continuar"}
            </button>
          </div>
        </form>
      )}
    </div>
  ) : (
    <div className="grid gap-px bg-[var(--background)] xl:grid-cols-[1.2fr_0.72fr]">
      <div className="bg-[var(--background-secondary)]">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 bg-black px-8 py-10">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
              Reserva online
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-white">Elige tu fecha y hora</h1>
            <p className="mt-2 text-base leading-relaxed text-white/50">
              Confirmación rápida, sin esperas ni llamadas.
            </p>
          </div>
          <div className="border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-sm font-bold uppercase tracking-tight text-white">{businessName}</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-widest text-white/30">
              Agenda visual
            </p>
          </div>
        </div>

        {isSubmitted && (
          <div className="flex items-start gap-3 border-b border-transparent/10 bg-black px-8 py-5 text-white">
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

        <div className="border-b border-transparent/10 px-8 pb-6 pt-8">
          <div className="flex items-center justify-between">
            {STEPS.map((label, idx) => (
              <div key={label} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(idx)}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center text-[10px] font-bold transition ${
                    idx === currentStep
                      ? "bg-black text-white"
                      : idx < currentStep
                        ? "bg-black/20 text-white"
                        : "bg-[var(--background)] text-[var(--text-muted)]"
                  }`}
                >
                  {idx < currentStep ? <CheckCircle2 size={12} /> : idx + 1}
                </button>
                <span
                  className={`hidden text-[10px] font-semibold uppercase tracking-widest sm:inline ${
                    idx === currentStep ? "text-[var(--foreground)]" : "text-[var(--text-muted)]"
                  }`}
                >
                  {label}
                </span>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`mx-1 hidden h-px w-6 sm:block ${
                      idx < currentStep ? "bg-black/20" : "bg-[var(--background)]"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          {fieldErrors.serviceId && (
            <p className="mt-2 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
              <AlertCircle size={11} />
              {fieldErrors.serviceId}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          {currentStep === 0 && (
            <div className="border-b border-transparent/10 px-8 py-8">
              <div className="mb-5">
                <p className="text-sm font-bold uppercase tracking-tight">Servicio</p>
                <p className="mt-1 text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                  Selecciona el servicio que deseas reservar.
                </p>
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
                        isActive
                          ? "bg-black text-white"
                          : "bg-[var(--background-secondary)] hover:opacity-75"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {service.imageUrl ? (
                          <img
                            src={service.imageUrl}
                            alt={service.name}
                            className="h-10 w-10 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className={`h-10 w-10 shrink-0 rounded-full ${
                              isActive ? "bg-white/20" : "bg-[var(--background)]"
                            }`}
                          />
                        )}
                        <div>
                          <p className={`text-sm font-bold uppercase tracking-tight ${isActive ? "text-white" : ""}`}>
                            {service.name}
                          </p>
                          <p
                            className={`mt-0.5 text-[10px] uppercase tracking-widest ${
                              isActive ? "text-white/50" : "text-[var(--text-muted)]"
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
            </div>
          )}

          {currentStep === 1 && (
            <div className="border-b border-transparent/10 px-8 py-8">
              <div className="mb-5">
                <p className="text-sm font-bold uppercase tracking-tight">Profesional</p>
                <p className="mt-1 text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                  Elige con quién quieres atenderte.
                </p>
              </div>

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
                      className={`flex items-center gap-4 px-5 py-4 text-left transition ${
                        isActive
                          ? "bg-black text-white"
                          : "bg-[var(--background-secondary)] hover:opacity-75"
                      }`}
                    >
                      {barber.imageUrl ? (
                        <img
                          src={barber.imageUrl}
                          alt={barber.name}
                          className="h-10 w-10 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className={`h-10 w-10 shrink-0 rounded-full ${
                            isActive ? "bg-white/20" : "bg-[var(--background)]"
                          }`}
                        />
                      )}
                      <div>
                        <p className="text-sm font-bold uppercase tracking-tight">{barber.name}</p>
                        <p
                          className={`mt-0.5 text-[10px] uppercase tracking-widest ${
                            isActive ? "text-white/50" : "text-[var(--text-muted)]"
                          }`}
                        >
                          {barber.role}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="border-b border-transparent/10 px-8 py-8">
              <div className="mb-5">
                <p className="text-sm font-bold uppercase tracking-tight">Fecha</p>
                <p className="mt-1 text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                  Elige el día que más te convenga.
                </p>
              </div>

              <div className="mb-4 flex items-center justify-between border-b border-transparent/10 pb-4">
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
            </div>
          )}

          {currentStep === 3 && (
            <div className="border-b border-transparent/10 px-8 py-8">
              <div className="mb-5">
                <p className="text-sm font-bold uppercase tracking-tight">Horario</p>
                <p className="mt-1 text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                  Selecciona la hora que prefieras para tu cita.
                </p>
              </div>

              <div className="relative">
                <select
                  value={formData.time}
                  onChange={(e) => {
                    setFormData((c) => ({ ...c, time: e.target.value }));
                    setIsSubmitted(false);
                  }}
                  className={selectClassName}
                >
                  {availableSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
                <ChevronRight
                  size={16}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-[var(--text-muted)]"
                />
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="px-8 py-8">
              <div className="mb-5">
                <p className="text-sm font-bold uppercase tracking-tight">Datos de contacto</p>
                <p className="mt-1 text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                  Confírmanos tus datos para agendar el turno.
                </p>
              </div>

              <div className="space-y-4">
                {/* Fila 1: Nombres + Apellidos */}
                <div className="grid grid-cols-2 gap-4">
                  <label className="space-y-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                      Nombres
                    </span>
                    <input
                      required
                      type="text"
                      name="nombres"
                      value={formData.nombres}
                      onChange={handleChange}
                      placeholder="Juan"
                      className={inputClassName}
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                      Apellidos
                    </span>
                    <input
                      required
                      type="text"
                      name="apellidos"
                      value={formData.apellidos}
                      onChange={handleChange}
                      placeholder="Pérez"
                      className={inputClassName}
                    />
                  </label>
                </div>

                {/* Fila 2: DNI + Teléfono */}
                <div className="grid grid-cols-2 gap-4">
                  <label className="space-y-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                      DNI <span className="text-[var(--text-muted)]">(opcional)</span>
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={8}
                      name="dni"
                      value={formData.dni}
                      onChange={(e) => setFormData((c) => ({ ...c, dni: e.target.value.replace(/\D/g, "") }))}
                      placeholder="12345678"
                      className={inputClassName}
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                      Teléfono
                    </span>
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
                </div>

                {/* Fila 3: Email */}
                <label className="space-y-2">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                    Email
                  </span>
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
            </div>
          )}

          {error && (
            <div className="mx-8 mb-4 border border-red-500/20 bg-red-50 px-4 py-3">
              <p className="text-xs font-semibold text-red-600">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-transparent/10 px-8 py-6">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="inline-flex items-center gap-1.5 border border-transparent/10 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)] transition hover:border-[var(--hover)] disabled:opacity-30"
            >
              <ChevronLeft size={14} />
              Anterior
            </button>

            {currentStep < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex items-center gap-1.5 bg-black px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white transition hover:opacity-75"
              >
                Siguiente
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading || isSubmitted}
                className="bg-black px-8 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white transition hover:opacity-75 disabled:opacity-40"
              >
                {isLoading ? "Procesando..." : isSubmitted ? "¡Confirmado!" : "Confirmar turno"}
              </button>
            )}
          </div>
        </form>
      </div>

      <aside className="bg-[var(--background-secondary)]">
        <div className="xl:sticky xl:top-6">

          <div className="border-b border-[var(--border)] px-6 py-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Resumen
            </p>
            <h2 className="mt-2 text-xl font-bold uppercase tracking-tight">Tu cita</h2>
          </div>

          <div className="divide-y divide-black/10 dark:divide-white/10">
            <SummaryRow label="Servicio" value={selectedService?.name || "\u2014"} />
            <SummaryRow
              label="Profesional"
              value={selectedBarber?.name || "\u2014"}
            />
            <SummaryRow label="Fecha" value={selectedDate?.label || "\u2014"} />
            <SummaryRow label="Hora" value={formData.time || "\u2014"} />
          </div>

          <div className="bg-black px-6 py-6 text-white">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
              Inversión
            </p>
            <p className="mt-2 text-4xl font-black tracking-tight">
              {selectedService?.price || "\u2014"}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-white/40">
              {selectedService?.duration || "\u2014"}
            </p>
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
