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
  Play,
  Scissors,
  Sparkles,
  Star,
  TimerReset,
  UserRound,
  XCircle,
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
  const [allServices, setAllServices] = useState<ServiceLink[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("");
  const CHECKLIST_ITEMS = [
    { id: 1, text: "Herramientas limpias y listas" },
    { id: 2, text: "Toallas y navajas revisadas" },
    { id: 3, text: "Citas de la tarde confirmadas" },
    { id: 4, text: "Notas de clientes actualizadas" },
  ];

  const [dailyNote, setDailyNote] = useState("");
  const [checklist, setChecklist] = useState<{ id: number; text: string; done: boolean }[]>(
    CHECKLIST_ITEMS.map((i) => ({ ...i, done: false })),
  );
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
          .select("id, hora_inicio, clientes!cliente_id(nombres, apellidos), servicios!servicio_id(nombre), estado, observaciones")
          .eq("usuario_id", employeeId)
          .eq("fecha_reserva", today)
          .order("hora_inicio", { ascending: true }),
      ]);

      if (servRes.data) {
        const svc = servRes.data
          .map((r: Record<string, unknown>) => {
            const raw = r.servicios as Record<string, unknown> | Record<string, unknown>[] | null;
            const s = Array.isArray(raw) ? raw[0] : raw;
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

      if (initialView === "servicios") {
        const { data: allServRes } = await supabase
          .from("servicios")
          .select("id, nombre, duracion_minutos, precio")
          .eq("esta_activo", true)
          .order("nombre", { ascending: true });
        if (allServRes) {
          setAllServices(allServRes.map((s) => ({
            id: s.id,
            name: s.nombre,
            duration: s.duracion_minutos,
            price: Number(s.precio),
          })));
        }
      }

      if (aptRes.data) {
        const apts = aptRes.data.map((a: Record<string, unknown>) => {
          const rawClient = a.clientes as Record<string, unknown> | Record<string, unknown>[] | null;
          const clientes = Array.isArray(rawClient) ? rawClient[0] : rawClient;
          const rawService = a.servicios as Record<string, unknown> | Record<string, unknown>[] | null;
          const servicios = Array.isArray(rawService) ? rawService[0] : rawService;
          return {
            id: a.id as string,
            time: (a.hora_inicio as string)?.slice(0, 5) ?? "",
            client: clientes ? `${clientes.nombres} ${(clientes.apellidos as string) ?? ""}`.trim() : "—",
            service: (servicios?.nombre as string) ?? "—",
            status: a.estado as string,
            note: (a.observaciones as string) ?? "",
          };
        });
        setAppointments(apts);
        if (apts.length > 0) setSelectedAppointmentId(apts[0].id);
      }

      const { data: userData } = await supabase
        .from("usuarios")
        .select("nota_diaria, nota_diaria_fecha, checklist_json")
        .eq("id", employeeId)
        .single();
      if (userData) {
        if (userData.nota_diaria_fecha === today) {
          setDailyNote(userData.nota_diaria ?? "");
          if (userData.checklist_json) {
            const saved = JSON.parse(userData.checklist_json as string) as { id: number; done: boolean }[];
            setChecklist(
              CHECKLIST_ITEMS.map((item) => {
                const found = saved.find((s) => s.id === item.id);
                return { ...item, done: found?.done ?? false };
              }),
            );
          }
        }
      }

      setLoading(false);
    }
    if (employeeId) load();
  }, [employeeId, supabase]);

  const pendingCount = useMemo(
    () => appointments.filter((a) => a.status.toLowerCase() === "pendiente" || a.status.toLowerCase() === "confirmada").length,
    [appointments],
  );

  const completedCount = useMemo(
    () => appointments.filter((a) => a.status.toLowerCase() === "completada").length,
    [appointments],
  );

  const checklistDone = checklist.filter((c) => c.done).length;

  async function saveDailyData(checklistItems: { id: number; done: boolean }[], note: string) {
    const today = new Date().toISOString().slice(0, 10);
    await supabase
      .from("usuarios")
      .update({
        nota_diaria: note,
        nota_diaria_fecha: today,
        checklist_json: JSON.stringify(checklistItems.map((i) => ({ id: i.id, done: i.done }))),
      })
      .eq("id", employeeId);
  }

  async function updateAppointmentStatus(id: string, status: string) {
    const { error } = await supabase
      .from("reservas")
      .update({ estado: status })
      .eq("id", id);
    if (error) {
      alert(`Error al actualizar: ${error.message}`);
      return;
    }
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a)),
    );
  }

  const toggleChecklist = (id: number) => {
    setChecklist((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, done: !c.done } : c));
      saveDailyData(next, dailyNote);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-4 w-4 animate-pulse rounded-full bg-[var(--text-muted)]" />
      </div>
    );
  }

  if (initialView === "servicios") {
    const displayServices = services.length > 0 ? services : allServices;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Scissors size={20} className="text-[var(--hover)]" />
          <h2 className="text-lg font-bold text-[var(--foreground)]">Servicios</h2>
          {services.length > 0 && (
            <span className="rounded-full bg-[var(--hover)]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[var(--hover)]">
              Asignados
            </span>
          )}
        </div>
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 shadow-sm">
          {displayServices.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No hay servicios disponibles.</p>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {displayServices.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">{s.name}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">{s.duration} min</p>
                  </div>
                  <span className="text-sm font-bold text-[var(--foreground)]">S/{s.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (initialView === "agenda") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <CalendarClock size={20} className="text-[var(--hover)]" />
          <h2 className="text-lg font-bold text-[var(--foreground)]">Mis citas</h2>
        </div>
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 shadow-sm">
          {appointments.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No tienes citas programadas para hoy.</p>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {appointments.map((a) => (
                <div key={a.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-[var(--foreground)]">{a.time}</span>
                      <span className="text-sm text-[var(--foreground)]">{a.client}</span>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      a.status.toLowerCase() === "confirmada"
                        ? "bg-amber-400/15 text-amber-400"
                        : a.status.toLowerCase() === "completada"
                          ? "bg-emerald-400/15 text-emerald-400"
                          : a.status.toLowerCase() === "cancelada"
                            ? "bg-red-400/15 text-red-400"
                            : "bg-[var(--background)] text-[var(--text-muted)]"
                    }`}>
                      {a.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{a.service}</p>
                  {a.note && <p className="mt-1 text-xs text-[var(--text-muted)]/70">{a.note}</p>}
                  <div className="mt-3 flex gap-2">
                    {(a.status.toLowerCase() === "pendiente" || a.status.toLowerCase() === "confirmada") && (
                      <button
                        type="button"
                        onClick={() => updateAppointmentStatus(a.id, "completada")}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-emerald-600 active:scale-95"
                      >
                        <CheckCircle2 size={12} />
                        Completar
                      </button>
                    )}
                    {(a.status.toLowerCase() !== "completada" && a.status.toLowerCase() !== "cancelada") && (
                      <button
                        type="button"
                        onClick={() => updateAppointmentStatus(a.id, "cancelada")}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-red-400/30 px-3 py-1.5 text-[11px] font-semibold text-red-400 transition hover:bg-red-400/10 active:scale-95"
                      >
                        <XCircle size={12} />
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
                        a.status.toLowerCase() === "confirmada"
                          ? "bg-[var(--hover)]/15 text-[var(--hover)]"
                          : a.status.toLowerCase() === "en_curso"
                            ? "bg-amber-400/15 text-amber-400"
                            : a.status.toLowerCase() === "completada"
                              ? "bg-emerald-400/15 text-emerald-400"
                              : a.status.toLowerCase() === "cancelada"
                                ? "bg-red-400/15 text-red-400"
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
              onBlur={() => saveDailyData(checklist, dailyNote)}
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
