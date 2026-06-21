"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { CalendarClock, Clock3, Loader2, RefreshCw } from "lucide-react";
import { AppointmentsService, type AppointmentWithDetails } from "@/services/appointments.service";

export function AgendaManagement() {
  const [apps, setApps] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const today = new Date();
      const end = new Date(today);
      end.setDate(today.getDate() + 10);
      const data = await AppointmentsService.getAllForDateRange(
        today.toISOString().split("T")[0],
        end.toISOString().split("T")[0],
      );
      setApps(data);
    } catch (err) { setError(err instanceof Error ? err.message : "Error al cargar"); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    const weekdays = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
    const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "setiembre", "octubre", "noviembre", "diciembre"];
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">Reservas</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{(() => { const t = new Date(); const e = new Date(t); e.setDate(t.getDate() + 10); const f = (d: Date) => `${["dom","lun","mar","mié","jue","vie","sáb"][d.getDay()]}, ${d.getDate()} ${["ene","feb","mar","abr","may","jun","jul","ago","set","oct","nov","dic"][d.getMonth()]}`; return `${f(t)} — ${f(e)} · ${apps.length} reserva(s)`; })()}</p>
        </div>
        <button type="button" onClick={fetchData} disabled={loading} className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-muted)] transition hover:bg-[var(--background)] disabled:opacity-50"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Recargar</button>
      </div>

      {error && <div className="rounded-3xl border border-[var(--destructive-border)] bg-[var(--destructive-hover)] p-4 text-sm text-[var(--destructive)]">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-[var(--text-muted)]" size={32} /></div>
      ) : apps.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16"><CalendarClock size={32} className="text-[var(--text-muted)]" /><p className="text-sm text-[var(--text-muted)]">No hay reservas en los próximos días.</p></div>
      ) : (
        <div className="space-y-6">
          {Array.from(groupedByDate.entries()).map(([date, items]) => (
            <div key={date}>
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--text-muted)]">{formatDate(date)}</p>
              <div className="space-y-2">
                {items.map((app) => (
                  <div key={app.id} className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] px-5 py-4 shadow-sm">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--background)] text-[var(--text-muted)] text-xs font-bold leading-tight text-center">{app.hora_inicio.slice(0, 5)}<br/>{app.hora_fin.slice(0, 5)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-[var(--foreground)]">{app.cliente_nombre}</p>
                      <p className="text-sm text-[var(--text-muted)] truncate">{app.servicio_nombre} · {app.empleado_nombre}</p>
                    </div>
                    <span className={`shrink-0 text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full ${
                      app.estado.toLowerCase() === "completada"
                        ? "bg-emerald-100 text-emerald-700"
                        : app.estado.toLowerCase() === "cancelada"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                    }`}>{app.estado}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
