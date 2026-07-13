"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Toast } from "@/components/dashboard/toast";
import { AppointmentsService } from "@/services/appointments.service";
import { CustomersService } from "@/services/customers.service";
import { useCustomerAuth } from "@/contexts/customer-auth-context";
import { validateDni, validateDniOptional, validateEmail, validateEmailOptional, validateName, validatePhone, validatePhoneOptional, validateRequired } from "@/lib/validators";
import { getRealtimeClient } from "@/lib/supabase/realtime";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (element: HTMLElement, options: { theme?: string; size?: string; type?: string; shape?: string }) => void;
          prompt: (callback?: (notification: { isNotDisplayed: () => boolean }) => void) => void;
        };
      };
    };
  }
}

type BookingOption = {
  id: string;
  name: string;
  duration: string;
  durationMinutes: number;
  price: string;
  imageUrl: string | null;
};

type ExistingReservation = {
  empleadoId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
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
  existingReservations: ExistingReservation[];
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
  existingReservations,
}: BookingFormProps) {
  const [stage, setStage] = useState<"dni" | "register" | "booking">("dni");
  const [dni, setDni] = useState("");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<BookingDraft>(initialDraft);
  const [reservations, setReservations] = useState<ExistingReservation[]>(existingReservations);

  useEffect(() => {
    setReservations(existingReservations);
  }, [existingReservations]);

  const { session: customerSession } = useCustomerAuth();
  const hasLoadedCustomerRef = useRef(false);

  useEffect(() => {
    if (!customerSession || hasLoadedCustomerRef.current) return;
    hasLoadedCustomerRef.current = true;
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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [showConfirm, setShowConfirm] = useState(false);

  const sessionIdRef = useRef(crypto.randomUUID());
  const [lockedSlots, setLockedSlots] = useState<Set<string>>(new Set());
  const channelRef = useRef<ReturnType<ReturnType<typeof getRealtimeClient>["channel"]> | null>(null);
  const mySlotRef = useRef<string | null>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = getRealtimeClient();

    (async () => {
      const { data } = await supabase
        .from("blocked_slots")
        .select("usuario_id, fecha_reserva, hora_inicio, session_id")
        .neq("session_id", sessionIdRef.current)
        .gt("expires_at", new Date().toISOString());

      if (data) {
        setLockedSlots(new Set(data.map((r: Record<string, unknown>) => slotKey(r.usuario_id as string, r.fecha_reserva as string, (r.hora_inicio as string).slice(0, 5)))));
      }
    })();

    const channel = supabase.channel(`blocked_slots_${sessionIdRef.current}`);
    channel
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "blocked_slots" },
          (payload: { new: Record<string, unknown> }) => {
            const row = payload.new as Record<string, unknown>;
            if (row.session_id === sessionIdRef.current) return;
            const hora = (row.hora_inicio as string) ?? "";
            const key = slotKey(row.usuario_id as string, row.fecha_reserva as string, hora.slice(0, 5));
            setLockedSlots((prev) => new Set(prev).add(key));
          },
        )
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "blocked_slots" },
          (payload: { old: Record<string, unknown> }) => {
            const row = payload.old as Record<string, unknown>;
            const hora = (row.hora_inicio as string) ?? "";
            const key = slotKey(row.usuario_id as string, row.fecha_reserva as string, hora.slice(0, 5));
          setLockedSlots((prev) => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    return () => {
      getRealtimeClient().from("blocked_slots").delete().eq("session_id", sessionIdRef.current).then();
    };
  }, []);

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

  const handleGoogleLogin = useCallback(async (credential: string) => {
    setGoogleLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error de autenticación");

      setCustomerId(data.id);
      setFormData((c) => ({
        ...c,
        nombres: data.nombres,
        apellidos: data.apellidos || "",
        phone: data.telefono || c.phone,
        email: data.correoElectronico || c.email,
        dni: data.dni || "",
        fechaNacimiento: data.fechaNacimiento || "",
      }));
      setStage("booking");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al conectar con Google");
    } finally {
      setGoogleLoading(false);
    }
  }, []);

  const googleCallbackRef = useRef<(credential: string) => void>(handleGoogleLogin);
  googleCallbackRef.current = handleGoogleLogin;

  useEffect(() => {
    if (stage !== "dni") return;
    const scriptId = "google-gsi-script";

    const initGoogle = () => {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId || !window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: { credential?: string }) => {
          if (response.credential) googleCallbackRef.current(response.credential);
        },
        auto_select: false,
      });
      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "filled_black",
          size: "large",
          type: "standard",
          shape: "rectangular",
        });
      }
    };

    if (document.getElementById(scriptId)) {
      initGoogle();
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    document.head.appendChild(script);
  }, [stage]);

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

  const validateBooking = () => {
    const errors: Record<string, string> = {};
    const nombresErr = validateName(formData.nombres, "Los nombres");
    const apellidosErr = validateName(formData.apellidos, "Los apellidos");
    const phoneErr = validatePhoneOptional(formData.phone);
    const emailErr = validateEmail(formData.email);
    const dniErr = validateDniOptional(formData.dni);
    const serviceErr = validateRequired(formData.serviceId, "El servicio");
    const dateErr = validateRequired(formData.date, "La fecha");
    const timeErr = validateRequired(formData.time, "La hora");
    if (nombresErr) errors.nombres = nombresErr;
    if (apellidosErr) errors.apellidos = apellidosErr;
    if (phoneErr) errors.phone = phoneErr;
    if (emailErr) errors.email = emailErr;
    if (dniErr) errors.dni = dniErr;
    if (serviceErr) errors.serviceId = serviceErr;
    if (dateErr) errors.date = dateErr;
    if (timeErr) errors.time = timeErr;

    if (formData.time && formData.barberId && formData.date && formData.serviceId) {
      const selectedServiceObj = services.find((s) => s.id === formData.serviceId);
      const duration = selectedServiceObj?.durationMinutes ?? 30;
      const slotEnd = addMinutesToTime(formData.time, duration);
      const conflicted = reservations.some(
        (r) =>
          r.empleadoId === formData.barberId &&
          r.fecha === formData.date &&
          r.horaInicio &&
          r.horaFin &&
          isOverlapping(formData.time, slotEnd, r.horaInicio.slice(0, 5), r.horaFin.slice(0, 5)),
      );
      if (conflicted) errors.time = "Este horario ya no está disponible";
    }

    return errors;
  };

  const handleConfirmClick = () => {
    const errors = validateBooking();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setShowConfirm(true);
  };

  const handleSubmit = async () => {
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
      setReservations((prev) => [
        ...prev,
        { empleadoId, fecha: formData.date, horaInicio: `${formData.time}:00`, horaFin: `${endTimeHHMM}:00` },
      ]);
      unlockAllBySession();
      setIsSubmitted(true);
      setShowConfirm(false);
      setToastMessage("¡Reserva confirmada! Te esperamos.");
      setToastType("success");
      setToastOpen(true);
      setTimeout(() => {
        setFormData(initialDraft);
        setCurrentStep(0);
        setDni("");
        setCustomerId(null);
        setIsSubmitted(false);
        setError("");
        setFieldErrors({});
        setStage("dni");
        setToastOpen(false);
      }, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const lockSlot = async (barberId: string, date: string, time: string) => {
    const supabase = getRealtimeClient();
    await supabase.from("blocked_slots").delete().eq("session_id", sessionIdRef.current);
    mySlotRef.current = slotKey(barberId, date, time);
    const { error } = await supabase.from("blocked_slots").insert({
      usuario_id: barberId,
      fecha_reserva: date,
      hora_inicio: time,
      session_id: sessionIdRef.current,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });
    if (error && error.code === "23505") {
      setError("Alguien más acaba de seleccionar este horario. Elige otro.");
      return false;
    }
    if (error) {
      setError("Error al bloquear el horario. Intenta de nuevo.");
      return false;
    }
    return true;
  };

  const unlockAllBySession = () => {
    getRealtimeClient().from("blocked_slots").delete().eq("session_id", sessionIdRef.current).then();
    mySlotRef.current = null;
  };

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
            ? "Inicia sesión con Google o ingresa tu DNI para agilizar la reserva."
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
        <>
          <div className="mb-6 flex flex-col items-center gap-3">
            <div
              ref={googleBtnRef}
              className="min-h-[40px] flex items-center justify-center"
            />
            {googleLoading && (
              <div className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-xs text-[var(--text-muted)]">Verificando...</span>
              </div>
            )}
          </div>
          <div className="mb-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">o</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>
          <form onSubmit={handleDniLookup} className="flex flex-col gap-6">
          <label className="flex flex-col gap-1.5">
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
            className="mt-6 w-full rounded-xl bg-black px-8 py-3.5 text-xs font-bold uppercase tracking-[0.15em] text-white shadow-sm transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLoading ? "Buscando..." : "Buscar"}
          </button>
        </form>
        </>
      )}

      {stage === "register" && (
        <form onSubmit={handleRegister} className="animate-[fadeInUp_0.6s_ease-out] space-y-4">
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
    <div className="animate-[fadeInUp_0.6s_ease-out] grid gap-px bg-[var(--background)] xl:grid-cols-[1.2fr_0.72fr]">
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

              <div className="grid grid-cols-7 gap-px bg-[var(--border)]">
                {calendarWeekdays.map((wd) => (
                  <div
                    key={wd}
                    className="bg-[var(--background-secondary)] py-1.5 text-center text-[9px] font-semibold uppercase tracking-widest text-[var(--text-muted)]"
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
                      className={`flex h-9 items-center justify-center text-[11px] font-bold transition ${
                        isActive
                          ? "bg-[var(--hover)] text-white"
                          : isAvailable
                            ? "bg-[var(--background-secondary)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--hover)] hover:text-white hover:border-[var(--hover)]"
                            : "bg-[var(--background-tertiary)] text-[var(--text-muted)] cursor-default"
                      }`}
                    >
                      {String(cell.dayNumber).padStart(2, "0")}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 bg-[var(--hover)]" />
                  <span className="text-[9px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                    Seleccionado
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 border border-[var(--border)] bg-[var(--background-secondary)]" />
                  <span className="text-[9px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                    Disponible
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 bg-[var(--background-tertiary)]" />
                  <span className="text-[9px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                    No disponible
                  </span>
                </div>
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
                  {selectedDate?.value === (() => {
                    const n = new Date();
                    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
                  })()
                    ? "Horarios disponibles a partir de la próxima hora."
                    : "Selecciona la hora que prefieras para tu cita."}
                </p>
              </div>

              {(() => {
                const now = new Date();
                const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
                const isToday = selectedDate?.value === todayStr;
                const minTime = new Date(now.getTime() + 30 * 60 * 1000);

                const occupiedRanges = reservations
                  .filter((r) => r.empleadoId === formData.barberId && r.fecha === selectedDate?.value && r.horaInicio && r.horaFin)
                  .map((r) => ({ start: r.horaInicio.slice(0, 5), end: r.horaFin.slice(0, 5) }));

                const slotsWithStatus = availableSlots.map((slot) => {
                  const [h, m] = slot.split(":").map(Number);
                  const slotTime = new Date();
                  slotTime.setHours(h, m, 0, 0);
                  const past = isToday && slotTime < minTime;

                  if (past) return { slot, isEnabled: false };

                  const conflicted = occupiedRanges.some((r) => slot >= r.start && slot < r.end);

                  if (conflicted) return { slot, isEnabled: false };

                  const isLocked = formData.barberId && selectedDate?.value
                    ? lockedSlots.has(slotKey(formData.barberId, selectedDate.value, slot))
                    : false;

                  return { slot, isEnabled: !isLocked };
                });

                const hasEnabled = slotsWithStatus.some((s) => s.isEnabled);

                if (isToday && !hasEnabled) {
                  return (
                    <div className="rounded-xl border border-[var(--destructive-border)] bg-[var(--destructive-hover)] px-4 py-3 text-xs text-[var(--destructive)]">
                      No hay horarios disponibles para hoy. Elige otro día.
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
                    {slotsWithStatus.map(({ slot, isEnabled }) => {
                      const isActive = formData.time === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={!isEnabled}
                          onClick={async () => {
                            if (formData.time === slot) return;
                            const ok = await lockSlot(formData.barberId, formData.date, slot);
                            if (!ok) return;
                            setFormData((c) => ({ ...c, time: slot }));
                            setIsSubmitted(false);
                          }}
                          className={`rounded-lg border px-2 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition ${
                            isActive
                              ? "border-[var(--hover)] bg-[var(--hover)] text-white"
                              : isEnabled
                                ? "border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground)] hover:border-[var(--hover)] hover:text-[var(--hover)]"
                                : "border-transparent bg-[var(--background-tertiary)] text-[var(--text-muted)] opacity-40 cursor-not-allowed line-through"
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
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
                      Nombres <span className="text-[var(--destructive)]">*</span>
                    </span>
                    <input
                      type="text"
                      name="nombres"
                      value={formData.nombres}
                      readOnly
                      tabIndex={-1}
                      className={inputClassName + " cursor-default opacity-60"}
                    />
                    {fieldErrors.nombres && (
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
                        <AlertCircle size={11} />
                        {fieldErrors.nombres}
                      </p>
                    )}
                  </label>
                  <label className="space-y-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                      Apellidos <span className="text-[var(--destructive)]">*</span>
                    </span>
                    <input
                      type="text"
                      name="apellidos"
                      value={formData.apellidos}
                      readOnly
                      tabIndex={-1}
                      className={inputClassName + " cursor-default opacity-60"}
                    />
                    {fieldErrors.apellidos && (
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
                        <AlertCircle size={11} />
                        {fieldErrors.apellidos}
                      </p>
                    )}
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
                      readOnly
                      tabIndex={-1}
                      className={inputClassName + " cursor-default opacity-60"}
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                      Teléfono <span className="text-[var(--text-muted)]">(opcional)</span>
                    </span>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      readOnly
                      tabIndex={-1}
                      className={inputClassName + " cursor-default opacity-60"}
                    />
                    {fieldErrors.phone && (
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
                        <AlertCircle size={11} />
                        {fieldErrors.phone}
                      </p>
                    )}
                  </label>
                </div>

                {/* Fila 3: Email */}
                <label className="space-y-2">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                    Email <span className="text-[var(--destructive)]">*</span>
                  </span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    readOnly
                    tabIndex={-1}
                    className={inputClassName + " cursor-default opacity-60"}
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
                      <AlertCircle size={11} />
                      {fieldErrors.email}
                    </p>
                  )}
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
                type="button"
                onClick={handleConfirmClick}
                disabled={isLoading || isSubmitted}
                className="bg-black px-8 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white transition hover:opacity-75 disabled:opacity-40"
              >
                {isSubmitted ? "¡Confirmado!" : "Confirmar turno"}
              </button>
            )}
          </div>
        </form>

        {/* Modal de confirmación */}
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-500" onClick={() => setShowConfirm(false)} />
            <div className="animate-[fadeInUp_0.6s_ease-out] relative w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-8 shadow-2xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Confirma tu reserva
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">
                ¿Deseas confirmar?
              </h2>
              <div className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between border-b border-[var(--border)] pb-2">
                  <span className="text-[var(--text-muted)]">Servicio</span>
                  <span className="font-bold">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between border-b border-[var(--border)] pb-2">
                  <span className="text-[var(--text-muted)]">Profesional</span>
                  <span className="font-bold">{selectedBarber?.name || "Sin preferencia"}</span>
                </div>
                <div className="flex justify-between border-b border-[var(--border)] pb-2">
                  <span className="text-[var(--text-muted)]">Fecha</span>
                  <span className="font-bold">{selectedDate?.label}</span>
                </div>
                <div className="flex justify-between border-b border-[var(--border)] pb-2">
                  <span className="text-[var(--text-muted)]">Hora</span>
                  <span className="font-bold">{formData.time}</span>
                </div>
                <div className="flex justify-between border-b border-[var(--border)] pb-2">
                  <span className="text-[var(--text-muted)]">Cliente</span>
                  <span className="font-bold">{formData.nombres} {formData.apellidos}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Inversión</span>
                  <span className="font-bold text-[var(--hover)]">{selectedService?.price}</span>
                </div>
              </div>
              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 rounded-xl border border-[var(--border)] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.15em] transition hover:bg-[var(--background)]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-1 rounded-xl bg-black px-4 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-white transition hover:opacity-75 disabled:opacity-40"
                >
                  {isLoading ? "Procesando..." : "Sí, confirmar"}
                </button>
              </div>
            </div>
          </div>
        )}
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
      <Toast message={toastMessage} type={toastType} open={toastOpen} onClose={() => setToastOpen(false)} position="top-right" />
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

function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(":").map(Number);
  const dateObj = new Date();
  dateObj.setHours(hours, mins + minutes);
  return `${String(dateObj.getHours()).padStart(2, "0")}:${String(dateObj.getMinutes()).padStart(2, "0")}`;
}

function isOverlapping(startA: string, endA: string, startB: string, endB: string): boolean {
  return startA < endB && startB < endA;
}

function slotKey(usuarioId: string, fecha: string, hora: string): string {
  return `${usuarioId}|${fecha}|${hora}`;
}
