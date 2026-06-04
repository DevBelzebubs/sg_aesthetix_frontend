"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ClipboardList,
  Scissors,
  Sparkles,
  Star,
  TimerReset,
  UserRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type ServiceLink = {
  id: string;
  name: string;
  duration: number;
  price: number;
};

type Appointment = {
  id: string;
  time: string;
  client: string;
  service: string;
  status: string;
  note: string;
};

type EmployeeWorkspaceProps = {
  initialView?: "jornada" | "servicios" | "agenda";
  employeeName: string;
  employeeId: string;
};

export function EmployeeWorkspace({
  initialView = "jornada",
  employeeName,
  employeeId,
}: EmployeeWorkspaceProps) {
  const router = useRouter();
  const supabase = createClient();
  const [services, setServices] = useState<ServiceLink[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("");
  const [dailyNote, setDailyNote] = useState("");
  const [checklist, setChecklist] = useState<{ id: number; text: string; done: boolean }[]>([
    { id: 1, text: "Herramientas limpias y listas", done: false },
    { id: 2, text: "Toallas y navajas revisadas", done: false },
    { id: 3, text: "Citas de la tarde confirmadas", done: false },
    { id: 4, text: "Notas de clientes actualizadas", done: false },
  ]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().slice(0, 10);

      const [servRes, aptRes] = await Promise.all([
        supabase
          .from("usuario_servicio")
          .select("servicios(id, nombre, duracion_minutos, precio)")
          .eq("usuario_id", employeeId),
        supabase
          .from("reservas")
          .select("id, hora_inicio, cliente_id, clientes(nombres, apellidos), servicios(nombre), estado, observaciones")
          .eq("usuario_id", employeeId)
          .eq("fecha_reserva", today)
          .order("hora_inicio", { ascending: true }),
      ]);

      if (servRes.data) {
        const svc = servRes.data
          .map((r: Record<string, unknown>) => {
            const s = (r.servicios as Record<string, unknown>[])?.[0];
            if (!s) return null;
            return {
              id: s.id as string,
              name: s.nombre as string,
              duration: Number(s.duracion_minutos),
              price: Number(s.precio),
            };
          })
          .filter(Boolean) as ServiceLink[];
        setServices(svc);
        if (svc.length > 0) setSelectedServiceId(svc[0].id);
      }

      if (aptRes.data) {
        const apts = aptRes.data.map((a: Record<string, unknown>) => {
          const clientes = (a.clientes as Record<string, unknown>[])?.[0];
          const servicios = (a.servicios as Record<string, unknown>[])?.[0];
          return {
            id: a.id as string,
            time: (a.hora_inicio as string)?.slice(0, 5) ?? "",
            client: clientes ? `${clientes.nombres} ${clientes.apellidos ?? ""}`.trim() : "—",
            service: (servicios?.nombre as string) ?? "—",
            status: a.estado as string,
            note: (a.observaciones as string) ?? "",
          };
        });
        setAppointments(apts);
        if (apts.length > 0) setSelectedAppointmentId(apts[0].id);
      }

      setLoading(false);
    }
    if (employeeId) load();
  }, [employeeId, supabase]);

  const pendingCount = useMemo(
    () => appointments.filter((a) => a.status === "pendiente" || a.status === "Pendiente").length,
    [appointments],
  );

  const completedCount = useMemo(
    () => appointments.filter((a) => a.status === "completada" || a.status === "Completada").length,
    [appointments],
  );

  const checklistDone = checklist.filter((c) => c.done).length;

  const toggleChecklist = (id: number) => {
    setChecklist((prev) =>
      prev.map((c) => (c.id === id ? { ...c, done: !c.done } : c)),
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-4 w-4 animate-pulse rounded-full bg-[var(--text-muted)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-4">
        <article className="rounded-2xl border border-[var(--hover)]/20 p-4" style={{ background: "color-mix(in srgb, var(--hover) 6%, var(--background-secondary))" }}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Citas hoy</p>
          <div className="mt-2 flex items-center gap-2">
            <CalendarClock size={20} style={{ color: "var(--hover)" }} />
            <p className="text-xl font-bold text-[var(--foreground)]">{appointments.length}</p>
          </div>
        </article>
        <article className="rounded-2xl border border-[var(--hover)]/20 p-4" style={{ background: "color-mix(in srgb, var(--hover) 6%, var(--background-secondary))" }}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Pendientes</p>
          <div className="mt-2 flex items-center gap-2">
            <Clock3 size={20} style={{ color: "var(--hover)" }} />
            <p className="text-xl font-bold text-[var(--foreground)]">{pendingCount}</p>
          </div>
        </article>
        <article className="rounded-2xl border border-[var(--hover)]/20 p-4" style={{ background: "color-mix(in srgb, var(--hover) 6%, var(--background-secondary))" }}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Completadas</p>
          <div className="mt-2 flex items-center gap-2">
            <CheckCircle2 size={20} style={{ color: "var(--hover)" }} />
            <p className="text-xl font-bold text-[var(--foreground)]">{completedCount}</p>
          </div>
        </article>
        <article className="rounded-2xl border border-[var(--hover)]/20 p-4" style={{ background: "color-mix(in srgb, var(--hover) 6%, var(--background-secondary))" }}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Checklist</p>
          <div className="mt-2 flex items-center gap-2">
            <ClipboardList size={20} style={{ color: "var(--hover)" }} />
            <p className="text-xl font-bold text-[var(--foreground)]">{checklistDone}/{checklist.length}</p>
          </div>
        </article>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Columna izquierda */}
        <div className="space-y-6">
          {/* Servicios asignados */}
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Scissors size={18} className="text-[var(--hover)]" />
              <p className="text-sm font-semibold text-[var(--foreground)]">Mis servicios</p>
            </div>
            {services.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No tienes servicios asignados.</p>
            ) : (
              <div className="space-y-2">
                {services.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedServiceId(s.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selectedServiceId === s.id
                        ? "border-[var(--hover)] bg-[var(--hover)]/5"
                        : "border-[var(--border)] hover:bg-[var(--background)]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-[var(--foreground)]">{s.name}</p>
                      <span className="text-sm font-bold text-[var(--foreground)]">S/{s.price.toFixed(2)}</span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">{s.duration} min</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Citas del día */}
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <CalendarClock size={18} className="text-[var(--hover)]" />
              <p className="text-sm font-semibold text-[var(--foreground)]">Citas de hoy</p>
            </div>
            {appointments.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No tienes citas programadas para hoy.</p>
            ) : (
              <div className="space-y-2">
                {appointments.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelectedAppointmentId(a.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selectedAppointmentId === a.id
                        ? "border-[var(--hover)] bg-[var(--hover)]/5"
                        : "border-[var(--border)] hover:bg-[var(--background)]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-[var(--foreground)]">{a.time}</span>
                        <span>{a.client}</span>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        a.status === "Confirmada" || a.status === "confirmada"
                          ? "bg-[var(--hover)]/15 text-[var(--hover)]"
                          : a.status === "En curso" || a.status === "en_progreso"
                            ? "bg-[var(--hover)]/10 text-[var(--hover)]"
                            : "bg-[var(--background)] text-[var(--text-muted)]"
                      }`}>
                        {a.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">{a.service}</p>
                    {a.note && <p className="mt-1 text-xs text-[var(--text-muted)]/70">{a.note}</p>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha */}
        <div className="space-y-6">
          {/* Perfil */}
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--background)]">
                <UserRound size={22} className="text-[var(--foreground)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">{employeeName}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {services.length} servicio(s) asignado(s)
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                isAvailable
                  ? "bg-[var(--hover)]/15 text-[var(--hover)]"
                  : "bg-[var(--warning)]/15 text-[var(--warning)]"
              }`}>
                {isAvailable ? "Disponible" : "No disponible"}
              </span>
              <button
                type="button"
                onClick={() => setIsAvailable((v) => !v)}
                className="text-xs text-[var(--text-muted)] underline transition hover:text-[var(--foreground)]"
              >
                Cambiar
              </button>
            </div>
          </div>

          {/* Checklist */}
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList size={18} className="text-[var(--hover)]" />
              <p className="text-sm font-semibold text-[var(--foreground)]">Checklist</p>
            </div>
            <div className="space-y-2">
              {checklist.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleChecklist(item.id)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-[var(--background)]"
                >
                  <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                    item.done
                      ? "border-[var(--hover)] bg-[var(--hover)] text-white"
                      : "border-[var(--border)]"
                  }`}>
                    {item.done && <CheckCircle2 size={12} />}
                  </div>
                  <span className={`text-sm ${item.done ? "text-[var(--text-muted)] line-through" : "text-[var(--foreground)]"}`}>
                    {item.text}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Nota diaria */}
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={18} className="text-[var(--hover)]" />
              <p className="text-sm font-semibold text-[var(--foreground)]">Nota del día</p>
            </div>
            <textarea
              value={dailyNote}
              onChange={(e) => {
                setDailyNote(e.target.value);
                setFieldErrors((prev) => ({ ...prev, dailyNote: "" }));
              }}
              className="min-h-24 w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--hover)] focus:ring-2 focus:ring-[var(--hover)]/20 resize-none"
              placeholder="Escribe una nota para hoy..."
            />
            {fieldErrors.dailyNote && (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
                <AlertCircle size={11} />
                {fieldErrors.dailyNote}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
