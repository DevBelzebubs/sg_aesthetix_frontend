"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, Clock3, DollarSign, Loader2, Plus, Scissors, Search, Trash2, X } from "lucide-react";
import { ConfirmationModal } from "@/components/dashboard/confirmation-modal";
import { Pagination } from "@/components/dashboard/pagination";
import { createClient } from "@/lib/supabase/client";
import { validateRequired, validatePositiveNumber } from "@/lib/validators";

type Service = {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  duracion_minutos: number;
  puntos_otorgados: number;
  esta_activo: boolean;
  categoria_servicio_id: number;
};

type ServiceDraft = Omit<Service, "id">;

const emptyDraft: ServiceDraft = {
  nombre: "",
  descripcion: "",
  precio: 0,
  duracion_minutos: 45,
  puntos_otorgados: 0,
  esta_activo: true,
  categoria_servicio_id: 1,
};

const inputClassName =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] px-4 py-3 text-sm outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--hover)] focus:ring-2 focus:ring-[var(--hover)]/20";

type Props = {
  totalServicios: number;
  totalActivos: number;
  precioPromedio: number;
};

export function ServicesManagement({ totalServicios, totalActivos, precioPromedio }: Props) {
  const supabase = createClient();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ServiceDraft>(emptyDraft);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const pageSize = 10;
  const [page, setPage] = useState(1);

  useEffect(() => { fetchServices(); }, []);

  async function fetchServices() {
    setLoading(true);
    const { data } = await supabase
      .from("servicios")
      .select("*")
      .order("nombre", { ascending: true });
    setServices(data ?? []);
    setLoading(false);
  }

  const filteredServices = useMemo(() => {
    return services.filter((s) =>
      s.nombre.toLowerCase().includes(query.toLowerCase()) ||
      s.descripcion?.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, services]);

  useEffect(() => { setPage(1); }, [query]);
  const totalPages = Math.ceil(filteredServices.length / pageSize);
  const paginatedServices = filteredServices.slice((page - 1) * pageSize, page * pageSize);

  const selectedService = services.find((s) => s.id === selectedId);

  const handleCreate = () => {
    setSelectedId(null);
    setDraft(emptyDraft);
    setMode("create");
  };

  const handleEdit = (service: Service) => {
    setSelectedId(service.id);
    setDraft(toDraft(service));
    setMode("edit");
  };

  const handleBack = () => {
    setMode("list");
    setSelectedId(null);
    setDraft(emptyDraft);
  };

  async function saveService() {
    const errors: Record<string, string> = {};
    const nombreErr = validateRequired(draft.nombre, "El nombre");
    const precioErr = validatePositiveNumber(draft.precio, "El precio");
    const duracionErr = validatePositiveNumber(draft.duracion_minutos, "La duración");
    if (nombreErr) errors.nombre = nombreErr;
    if (precioErr) errors.precio = precioErr;
    if (duracionErr) errors.duracion = duracionErr;
    if (draft.puntos_otorgados < 0) errors.puntos = "Los puntos no pueden ser negativos";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setSaving(true);
    if (mode === "edit" && selectedId) {
      await supabase.from("servicios").update({
        ...draft,
        actualizado_en: new Date().toISOString(),
      }).eq("id", selectedId);
    } else if (mode === "create") {
      await supabase.from("servicios").insert({
        ...draft,
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString(),
      });
    }
    await fetchServices();
    setSaving(false);
    setMode("list");
    setSelectedId(null);
    setDraft(emptyDraft);
    setIsConfirmOpen(false);
  }

  async function deleteService() {
    if (!selectedId) return;
    await supabase.from("servicios").delete().eq("id", selectedId);
    setSelectedId(null);
    setDraft(emptyDraft);
    setMode("list");
    await fetchServices();
    setIsDeleteOpen(false);
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
    </div>
  );

  return (
    <>
      {/* KPIs — solo en listado */}
      {mode === "list" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <article className="rounded-2xl border border-[var(--hover)]/20 p-4" style={{ background: "color-mix(in srgb, var(--hover) 6%, var(--background-secondary))" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Total servicios</p>
            <div className="mt-2 flex items-center gap-2">
              <Scissors size={20} style={{ color: "var(--hover)" }} />
              <p className="text-xl font-bold text-[var(--foreground)]">{totalServicios}</p>
            </div>
          </article>
          <article className="rounded-2xl border border-[var(--hover)]/20 p-4" style={{ background: "color-mix(in srgb, var(--hover) 6%, var(--background-secondary))" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Activos</p>
            <div className="mt-2 flex items-center gap-2">
              <Clock3 size={20} style={{ color: "var(--hover)" }} />
              <p className="text-xl font-bold text-[var(--foreground)]">{totalActivos}</p>
            </div>
          </article>
          <article className="rounded-2xl border border-[var(--hover)]/20 p-4" style={{ background: "color-mix(in srgb, var(--hover) 6%, var(--background-secondary))" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Precio promedio</p>
            <div className="mt-2 flex items-center gap-2">
              <DollarSign size={20} style={{ color: "var(--hover)" }} />
              <p className="text-xl font-bold text-[var(--foreground)]">S/{precioPromedio.toFixed(0)}</p>
            </div>
          </article>
        </div>
      )}

      {/* Barra de busqueda */}
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">Catalogo de servicios</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {services.length} servicio(s) registrado(s)
            </p>
          </div>
          {mode === "list" ? (
            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--button-primary)] px-4 py-2 text-sm font-semibold text-[var(--button-primary-foreground)] transition hover:opacity-90"
            >
              <Plus size={16} />
              Nuevo servicio
            </button>
          ) : (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)]"
            >
              <ArrowLeft size={16} />
              Volver al listado
            </button>
          )}
        </div>

        {mode === "list" && (
          <label className="mt-4 flex items-center gap-3 rounded-2xl border border-[var(--border)] px-4 py-3">
            <Search size={16} className="text-[var(--text-muted)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
              placeholder="Buscar por nombre o descripcion"
            />
          </label>
        )}
      </div>

      {/* Listado */}
      {mode === "list" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {paginatedServices.length === 0 ? (
            <div className="col-span-full flex flex-col items-center gap-3 py-16">
              <Scissors size={32} className="text-[var(--text-muted)]" />
              <p className="text-sm text-[var(--text-muted)]">
                {query ? "No se encontraron servicios con ese filtro." : "No hay servicios registrados. Crea el primero."}
              </p>
            </div>
          ) : (
            paginatedServices.map((service) => (
              <article
                key={service.id}
                className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--background)] text-[var(--foreground)]">
                    <Scissors size={20} />
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    service.esta_activo ? "bg-[var(--hover)]/15 text-[var(--hover)]" : "bg-[var(--background)] text-[var(--text-muted)]"
                  }`}>
                    {service.esta_activo ? "Activo" : "Inactivo"}
                  </span>
                </div>

                <div className="mt-3">
                  <p className="text-base font-semibold text-[var(--foreground)]">{service.nombre}</p>
                  {service.descripcion && (
                    <p className="mt-1 text-sm text-[var(--text-muted)] line-clamp-2">{service.descripcion}</p>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[var(--text-muted)]">
                  <span className="inline-flex items-center gap-1">
                    <Clock3 size={13} />
                    {service.duracion_minutos} min
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <DollarSign size={13} />
                    S/{service.precio}
                  </span>
                  {service.puntos_otorgados > 0 && (
                    <span className="rounded-full bg-[var(--background)] px-2 py-0.5 text-xs font-medium">
                      +{service.puntos_otorgados} pts
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-[var(--border)] pt-4">
                  <button
                    type="button"
                    onClick={() => handleEdit(service)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--background)]"
                  >
                    <Plus size={14} className="rotate-45" />
                    Editar
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {/* Formulario crear / editar */}
      {(mode === "create" || mode === "edit") && (
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-[var(--background)] p-3">
              <Scissors size={20} className="text-[var(--foreground)]" />
            </div>
            <div>
              <p className="text-lg font-semibold text-[var(--foreground)]">
                {mode === "create" ? "Nuevo servicio" : "Editar servicio"}
              </p>
              <p className="text-sm text-[var(--text-muted)]">
                {mode === "create"
                  ? "Agrega un servicio al catalogo."
                  : `Editando ${selectedService?.nombre ?? ""}`}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="col-span-full">
              <Field label="Nombre" required error={fieldErrors.nombre}>
                <input className={inputClassName} value={draft.nombre}
                  onChange={(e) => { setDraft((d) => ({ ...d, nombre: e.target.value })); setFieldErrors((prev) => ({ ...prev, nombre: "" })); }}
                  placeholder="Nombre del servicio" />
              </Field>
            </div>
            <div className="col-span-full">
              <Field label="Descripcion" error={fieldErrors.descripcion}>
                <textarea className={`${inputClassName} min-h-24 resize-none`} value={draft.descripcion ?? ""}
                  onChange={(e) => { setDraft((d) => ({ ...d, descripcion: e.target.value })); setFieldErrors((prev) => ({ ...prev, descripcion: "" })); }} />
              </Field>
            </div>
            <Field label="Precio (S/)" error={fieldErrors.precio}>
              <input type="number" className={inputClassName} value={draft.precio}
                onChange={(e) => { setDraft((d) => ({ ...d, precio: Number(e.target.value) })); setFieldErrors((prev) => ({ ...prev, precio: "" })); }} />
            </Field>
            <Field label="Duracion (min)" error={fieldErrors.duracion}>
              <input type="number" className={inputClassName} value={draft.duracion_minutos}
                onChange={(e) => { setDraft((d) => ({ ...d, duracion_minutos: Number(e.target.value) })); setFieldErrors((prev) => ({ ...prev, duracion: "" })); }} />
            </Field>
            <Field label="Puntos otorgados" error={fieldErrors.puntos}>
              <input type="number" className={inputClassName} value={draft.puntos_otorgados}
                onChange={(e) => { setDraft((d) => ({ ...d, puntos_otorgados: Number(e.target.value) })); setFieldErrors((prev) => ({ ...prev, puntos: "" })); }} />
            </Field>
            <Field label="Estado">
              <select className={inputClassName} value={draft.esta_activo ? "activo" : "inactivo"}
                onChange={(e) => setDraft((d) => ({ ...d, esta_activo: e.target.value === "activo" }))}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </Field>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-6">
            <button type="button" onClick={() => setIsConfirmOpen(true)}
              disabled={Object.keys(fieldErrors).length > 0 || saving}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--button-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--button-primary-foreground)] transition hover:opacity-90 disabled:opacity-50">
              {saving && <Loader2 size={16} className="animate-spin" />}
              {mode === "create" ? "Crear servicio" : "Guardar cambios"}
            </button>
            {mode === "edit" && (
              <button type="button" onClick={() => setIsDeleteOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--destructive-border)] px-5 py-2.5 text-sm font-semibold text-[var(--destructive)] transition hover:bg-[var(--destructive-hover)]">
                <Trash2 size={16} />
                Eliminar
              </button>
            )}
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)]"
            >
              <X size={16} />
              Cancelar
            </button>
          </div>
        </div>
      )}

      <ConfirmationModal
        open={isConfirmOpen}
        title={mode === "create" ? "Confirmar nuevo servicio" : "Confirmar cambios"}
        description={mode === "create" ? "Se creara un nuevo servicio." : "Se guardaran los cambios."}
        confirmLabel={saving ? "Guardando..." : mode === "create" ? "Si, crear" : "Si, guardar"}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={saveService}
      />

      <ConfirmationModal
        open={isDeleteOpen}
        title="Eliminar servicio"
        description="Esta accion no se puede deshacer."
        confirmLabel="Si, eliminar"
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={deleteService}
      />
    </>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-[var(--foreground)]">
        {label}
        {required && <span className="ml-1 text-[var(--destructive)]">*</span>}
      </span>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-[11px] text-[var(--destructive)]">
          <AlertCircle size={11} />
          {error}
        </p>
      )}
    </label>
  );
}

function toDraft(item: Service): ServiceDraft {
  return {
    nombre: item.nombre,
    descripcion: item.descripcion,
    precio: item.precio,
    duracion_minutos: item.duracion_minutos,
    puntos_otorgados: item.puntos_otorgados,
    esta_activo: item.esta_activo,
    categoria_servicio_id: item.categoria_servicio_id,
  };
}
