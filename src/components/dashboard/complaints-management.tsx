"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageSquareText,
  Search,
  ChevronRight,
  Send,
  Eye,
} from "lucide-react";
import { ComplaintsService } from "@/services/complaints.service";
import type { Complaint } from "@/types/complaint";
import { ConfirmationModal } from "@/components/dashboard/confirmation-modal";
import { Pagination } from "@/components/dashboard/pagination";

const inputClassName =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] px-4 py-3 text-sm outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--hover)] focus:ring-2 focus:ring-[var(--hover)]/20";

function daysBetween(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ComplaintsManagement() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<string>("todas");

  const [selected, setSelected] = useState<Complaint | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "detail" | "respond">("list");

  const [respuestaTexto, setRespuestaTexto] = useState("");
  const [saving, setSaving] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [error, setError] = useState("");

  const pageSize = 10;
  const [page, setPage] = useState(1);

  useEffect(() => {
    Promise.resolve(ComplaintsService.getAll())
      .then(setComplaints)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pendientes = complaints.filter((c) => c.estado === "pendiente").length;
  const respondidos = complaints.filter((c) => c.estado === "respondido").length;

  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      const text = query.toLowerCase();
      const matchSearch =
        !query ||
        c.nombres.toLowerCase().includes(text) ||
        c.apellidos.toLowerCase().includes(text) ||
        c.email.toLowerCase().includes(text) ||
        c.descripcion.toLowerCase().includes(text);

      const matchEstado =
        estadoFilter === "todas" || c.estado === estadoFilter;

      return matchSearch && matchEstado;
    });
  }, [complaints, query, estadoFilter]);

  useEffect(() => { setPage(1); }, [query, estadoFilter]);
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleViewDetail = (complaint: Complaint) => {
    setSelected(complaint);
    setViewMode("detail");
  };

  const handleRespond = (complaint: Complaint) => {
    setSelected(complaint);
    setRespuestaTexto(complaint.respuesta || "");
    setViewMode("respond");
    setError("");
  };

  const handleBack = () => {
    setViewMode("list");
    setSelected(null);
    setRespuestaTexto("");
    setError("");
  };

  const handleSubmitResponse = async () => {
    if (!respuestaTexto.trim() || respuestaTexto.trim().length < 10) {
      setError("La respuesta debe tener al menos 10 caracteres");
      return;
    }
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch("/api/libro-reclamaciones/responder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, respuesta: respuestaTexto.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al enviar la respuesta.");
        return;
      }
      const updated = await ComplaintsService.getById(selected.id);
      if (updated) {
        setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        setSelected(updated);
      }
      setViewMode("detail");
      setIsConfirmOpen(false);
    } catch {
      setError("Error al enviar la respuesta.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-4 w-4 animate-pulse rounded-full bg-[var(--text-muted)]" />
      </div>
    );
  }

  return (
    <>
      {viewMode === "list" && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <article
              className="rounded-2xl border border-[var(--hover)]/20 p-4"
              style={{ background: "color-mix(in srgb, var(--hover) 6%, var(--background-secondary))" }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Pendientes</p>
              <div className="mt-2 flex items-center gap-2">
                <Clock size={20} style={{ color: "var(--hover)" }} />
                <p className="text-xl font-bold text-[var(--foreground)]">{pendientes}</p>
              </div>
            </article>
            <article
              className="rounded-2xl border border-[var(--hover)]/20 p-4"
              style={{ background: "color-mix(in srgb, var(--hover) 6%, var(--background-secondary))" }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Respondidos</p>
              <div className="mt-2 flex items-center gap-2">
                <CheckCircle2 size={20} style={{ color: "var(--hover)" }} />
                <p className="text-xl font-bold text-[var(--foreground)]">{respondidos}</p>
              </div>
            </article>
            <article
              className="rounded-2xl border border-[var(--hover)]/20 p-4"
              style={{ background: "color-mix(in srgb, var(--hover) 6%, var(--background-secondary))" }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Total</p>
              <div className="mt-2 flex items-center gap-2">
                <BookOpen size={20} style={{ color: "var(--hover)" }} />
                <p className="text-xl font-bold text-[var(--foreground)]">{complaints.length}</p>
              </div>
            </article>
          </div>

          <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">Reclamos registrados</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {filtered.length} reclamo(s) encontrados
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={estadoFilter}
                  onChange={(e) => setEstadoFilter(e.target.value)}
                  className={`${inputClassName} w-auto py-2`}
                >
                  <option value="todas">Todos los estados</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="respondido">Respondidos</option>
                  <option value="cerrado">Cerrados</option>
                </select>
              </div>
            </div>
            <label className="mt-4 flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 transition focus-within:border-[var(--hover)] focus-within:ring-2 focus-within:ring-[var(--hover)]/20">
              <Search size={16} className="text-[var(--text-muted)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--text-muted)]"
                placeholder="Buscar por nombre, email..."
              />
            </label>
          </div>

          <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)]">
            <div className="overflow-x-auto touch-pan-x [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--border)]">
              {paginated.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16">
                  <BookOpen size={32} className="text-[var(--text-muted)]" />
                  <p className="text-sm text-[var(--text-muted)]">
                    {query || estadoFilter !== "todas"
                      ? "No se encontraron reclamos con esos filtros."
                      : "No hay reclamos registrados."}
                  </p>
                </div>
              ) : (
                <table className="w-full text-sm min-w-[900px]">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left">
                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] whitespace-nowrap">Cliente</th>
                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] whitespace-nowrap">Contacto</th>
                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] text-center whitespace-nowrap">Tipo</th>
                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] text-center whitespace-nowrap">Estado</th>
                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] whitespace-nowrap">Descripción</th>
                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] text-center whitespace-nowrap">Plazo</th>
                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] whitespace-nowrap">Fecha</th>
                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] text-center whitespace-nowrap w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {paginated.map((complaint) => {
                      const diasTranscurridos = daysBetween(
                        new Date(complaint.creadoEn!),
                        new Date(),
                      );
                      const vencido = complaint.estado === "pendiente" && diasTranscurridos > 15;

                      return (
                        <tr key={complaint.id} className="transition hover:bg-[var(--background)]">
                          <td className="px-5 py-4 font-medium text-[var(--foreground)] whitespace-nowrap">
                            {complaint.nombres} {complaint.apellidos}
                          </td>
                          <td className="px-5 py-4 text-[var(--text-muted)] max-w-[200px] truncate">
                            <div className="text-xs space-y-0.5">
                              <div>{complaint.email}</div>
                              {complaint.telefono && <div>{complaint.telefono}</div>}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-center whitespace-nowrap">
                            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                              complaint.tipo === "reclamo"
                                ? "bg-[var(--destructive-hover)] text-[var(--destructive)]"
                                : "bg-[var(--hover)]/10 text-[var(--hover)]"
                            }`}>
                              {complaint.tipo}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center whitespace-nowrap">
                            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                              complaint.estado === "pendiente"
                                ? "bg-[var(--warning)]/15 text-[var(--warning)]"
                                : complaint.estado === "respondido"
                                  ? "bg-[var(--hover)]/15 text-[var(--hover)]"
                                  : "bg-[var(--text-muted)]/15 text-[var(--text-muted)]"
                            }`}>
                              {complaint.estado}
                            </span>
                            {vencido && (
                              <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-[var(--destructive-hover)] px-2 py-0.5 text-[10px] font-semibold text-[var(--destructive)]">
                                <AlertTriangle size={10} />
                                Vencido
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-[var(--text-muted)] max-w-[250px] truncate">
                            {complaint.descripcion}
                          </td>
                          <td className="px-5 py-4 text-center whitespace-nowrap">
                            <span className={`text-xs font-semibold ${vencido ? "text-[var(--destructive)]" : "text-[var(--text-muted)]"}`}>
                              {diasTranscurridos}/15
                            </span>
                          </td>
                          <td className="px-5 py-4 text-[var(--text-muted)] whitespace-nowrap text-xs">
                            {formatDate(complaint.creadoEn!).split(",")[0]}
                          </td>
                          <td className="px-5 py-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleViewDetail(complaint)}
                              className="rounded-lg p-2 text-[var(--text-muted)] transition hover:bg-[var(--background)] hover:text-[var(--foreground)]"
                              title="Ver detalle"
                            >
                              <Eye size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {viewMode === "detail" && selected && (
        <DetailView complaint={selected} onBack={handleBack} onRespond={handleRespond} />
      )}

      {viewMode === "respond" && selected && (
        <RespondView
          complaint={selected}
          respuesta={respuestaTexto}
          setRespuesta={setRespuestaTexto}
          error={error}
          saving={saving}
          onBack={handleBack}
          onSave={() => setIsConfirmOpen(true)}
        />
      )}

      <ConfirmationModal
        open={isConfirmOpen}
        title="Confirmar respuesta"
        description="Se enviará la respuesta al consumidor por correo electrónico."
        confirmLabel={saving ? "Enviando..." : "Sí, enviar respuesta"}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleSubmitResponse}
      />
    </>
  );
}

function DetailView({
  complaint,
  onBack,
  onRespond,
}: {
  complaint: Complaint;
  onBack: () => void;
  onRespond: (c: Complaint) => void;
}) {
  const diasTranscurridos = daysBetween(
    new Date(complaint.creadoEn!),
    new Date(),
  );

  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 shadow-sm">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-[var(--background)] p-3">
            <BookOpen size={20} className="text-[var(--foreground)]" />
          </div>
          <div>
            <p className="text-lg font-semibold text-[var(--foreground)]">
              {complaint.tipo === "reclamo" ? "Reclamo" : "Queja"} ·{" "}
              {complaint.nombres} {complaint.apellidos}
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              {formatDate(complaint.creadoEn!)}
            </p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
            complaint.estado === "pendiente"
              ? "bg-[var(--warning)]/15 text-[var(--warning)]"
              : complaint.estado === "respondido"
                ? "bg-[var(--hover)]/15 text-[var(--hover)]"
                : "bg-[var(--text-muted)]/15 text-[var(--text-muted)]"
          }`}
        >
          {complaint.estado}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombres" value={complaint.nombres} />
        <Field label="Apellidos" value={complaint.apellidos} />

        {complaint.domicilio && <Field label="Domicilio" value={complaint.domicilio} />}
        {complaint.telefono && <Field label="Teléfono" value={complaint.telefono} />}
        <Field label="Email" value={complaint.email} />
        {complaint.bienContratado && <Field label="Bien / Servicio" value={complaint.bienContratado} />}
        {complaint.montoReclamado != null && (
          <Field label="Monto reclamado" value={`S/ ${complaint.montoReclamado.toFixed(2)}`} />
        )}
      </div>

      <div className="mt-4">
        <Field label="Descripción" value={complaint.descripcion} />
      </div>

      {complaint.pedidoConsumidor && (
        <div className="mt-4">
          <Field label="Pedido del consumidor" value={complaint.pedidoConsumidor} />
        </div>
      )}

      <div className="mt-4 flex items-center gap-4 text-sm text-[var(--text-muted)]">
        <span>Plazo: {diasTranscurridos} / 15 días hábiles</span>
        {diasTranscurridos > 15 && complaint.estado === "pendiente" && (
          <span className="flex items-center gap-1 text-[var(--destructive)] font-semibold">
            <AlertTriangle size={14} />
            Vencido
          </span>
        )}
      </div>

      {complaint.respuesta && (
        <div className="mt-4 rounded-2xl border border-[var(--hover)]/20 bg-[var(--hover)]/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--hover)]">Respuesta</p>
          <p className="mt-1 text-sm text-[var(--foreground)]">{complaint.respuesta}</p>
          {complaint.respondidoEl && (
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              Respondido el {formatDate(complaint.respondidoEl)}
            </p>
          )}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-6">
        {complaint.estado === "pendiente" && (
          <button
            type="button"
            onClick={() => onRespond(complaint)}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--hover)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-[0.98]"
          >
            <MessageSquareText size={16} />
            Responder
          </button>
        )}
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)]"
        >
          <ChevronRight size={16} className="rotate-180" />
          Volver al listado
        </button>
      </div>
    </div>
  );
}

function RespondView({
  complaint,
  respuesta,
  setRespuesta,
  error,
  saving,
  onBack,
  onSave,
}: {
  complaint: Complaint;
  respuesta: string;
  setRespuesta: (v: string) => void;
  error: string;
  saving: boolean;
  onBack: () => void;
  onSave: () => void;
}) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-2xl bg-[var(--background)] p-3">
          <MessageSquareText size={20} className="text-[var(--foreground)]" />
        </div>
        <div>
          <p className="text-lg font-semibold text-[var(--foreground)]">Responder reclamo</p>
          <p className="text-sm text-[var(--text-muted)]">
            {complaint.nombres} {complaint.apellidos} — {complaint.tipo}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl bg-[var(--destructive-hover)] px-4 py-3 text-sm text-[var(--destructive)]">
          {error}
        </div>
      )}

      <div className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 text-sm text-[var(--text-muted)]">
        <p className="font-medium text-[var(--foreground)]">Descripción del reclamo:</p>
        <p className="mt-1">{complaint.descripcion}</p>
      </div>

      <label className="space-y-2">
        <span className="text-sm font-medium text-[var(--foreground)]">
          Su respuesta <span className="text-[var(--destructive)]">*</span>
        </span>
        <p className="text-xs text-[var(--text-muted)]">
          Esta respuesta será enviada al correo del consumidor.
        </p>
        <textarea
          className={`${inputClassName} min-h-[180px] resize-y`}
          value={respuesta}
          onChange={(e) => {
            setRespuesta(e.target.value);
            setFieldErrors((prev) => ({ ...prev, respuesta: "" }));
          }}
          placeholder="Redacte su respuesta detallada al reclamo..."
        />
        {fieldErrors.respuesta && (
          <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--destructive)]">
            <AlertCircle size={11} />
            {fieldErrors.respuesta}
          </p>
        )}
      </label>

      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-6">
        <button
          type="button"
          onClick={onSave}
          disabled={!respuesta.trim() || saving || Object.keys(fieldErrors).length > 0}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--hover)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          ) : (
            <Send size={16} />
          )}
          {saving ? "Enviando..." : "Enviar respuesta"}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)]"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-sm text-[var(--foreground)]">{value}</p>
    </div>
  );
}
