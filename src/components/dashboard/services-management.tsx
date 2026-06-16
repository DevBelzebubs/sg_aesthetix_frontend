"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Clock3, DollarSign, Loader2, PencilLine, Plus, Scissors, Search, Trash2, Undo2, X } from "lucide-react";
import { CloudinaryUpload } from "@/components/dashboard/cloudinary-upload";
import { ConfirmationModal } from "@/components/dashboard/confirmation-modal";
import { Pagination } from "@/components/dashboard/pagination";
import { Toast } from "@/components/dashboard/toast";
import type { ToastType } from "@/components/dashboard/toast";
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
  imagen_url: string | null;
};

type ServiceDraft = Omit<Service, "id"> & { imagen_url: string };

const emptyDraft: ServiceDraft = {
  nombre: "",
  descripcion: "",
  precio: 0,
  duracion_minutos: 45,
  puntos_otorgados: 0,
  esta_activo: true,
  categoria_servicio_id: 1,
  imagen_url: "",
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
  const [inactiveServices, setInactiveServices] = useState<Service[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ServiceDraft>(emptyDraft);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<Service | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<ToastType>("success");

  const pageSize = 10;
  const [page, setPage] = useState(1);

  useEffect(() => { fetchActiveServices(); }, []);

  async function fetchActiveServices() {
    setLoading(true);
    const { data } = await supabase
      .from("servicios")
      .select("*")
      .eq("esta_activo", true)
      .order("nombre", { ascending: true });
    setServices(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (!showInactive) return;
    setLoading(true);
    supabase
      .from("servicios")
      .select("*")
      .eq("esta_activo", false)
      .order("nombre", { ascending: true })
      .then(({ data }) => setInactiveServices(data ?? []))
      .finally(() => setLoading(false));
  }, [showInactive]);

  const servicesForList = showInactive ? inactiveServices : services;

  const filteredServices = useMemo(() => {
    return servicesForList.filter((s) =>
      s.nombre.toLowerCase().includes(query.toLowerCase()) ||
      s.descripcion?.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, servicesForList]);

  useEffect(() => { setPage(1); }, [query, showInactive]);
  const totalPages = Math.ceil(filteredServices.length / pageSize);
  const paginatedServices = filteredServices.slice((page - 1) * pageSize, page * pageSize);

  const selectedService = servicesForList.find((s) => s.id === selectedId);

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
    setShowInactive(false);
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
    try {
      const payload = {
        nombre: draft.nombre,
        descripcion: draft.descripcion,
        precio: draft.precio,
        duracion_minutos: draft.duracion_minutos,
        puntos_otorgados: draft.puntos_otorgados,
        imagen_url: draft.imagen_url,
        esta_activo: draft.esta_activo,
        actualizado_en: new Date().toISOString(),
      };
      if (mode === "edit" && selectedId) {
        const { error } = await supabase.from("servicios").update(payload).eq("id", selectedId);
        if (error) throw error;
      } else if (mode === "create") {
        const { error } = await supabase.from("servicios").insert({
          ...payload,
          creado_en: new Date().toISOString(),
        });
        if (error) throw error;
      }
      await fetchActiveServices();
      setMode("list");
      setSelectedId(null);
      setDraft(emptyDraft);
      setIsConfirmOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al guardar el servicio";
      setToastMessage(msg);
      setToastType("error");
      setToastOpen(true);
    } finally {
      setSaving(false);
    }
  }

  async function deleteService() {
    if (!selectedId) return;
    try {
      const { error } = await supabase.from("servicios").delete().eq("id", selectedId);
      if (error) throw error;
      setSelectedId(null);
      setDraft(emptyDraft);
      setMode("list");
      await fetchActiveServices();
      setIsDeleteOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al eliminar el servicio";
      setToastMessage(msg);
      setToastType("error");
      setToastOpen(true);
    }
  }

  const handleDeactivateFromCard = async () => {
    if (!deactivateTarget) return;
    try {
      await supabase.from("servicios").update({ esta_activo: false }).eq("id", deactivateTarget.id);
      setServices((prev) => prev.filter((s) => s.id !== deactivateTarget.id));
      setToastMessage(`${deactivateTarget.nombre} ha sido desactivado.`);
      setToastType("success");
      setToastOpen(true);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Error al desactivar");
      setToastType("error");
      setToastOpen(true);
    } finally {
      setDeactivateTarget(null);
    }
  };

  const handleRestoreService = async (id: string) => {
    await supabase.from("servicios").update({ esta_activo: true }).eq("id", id);
    setInactiveServices((prev) => prev.filter((s) => s.id !== id));
  };

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
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {showInactive ? "Servicios desactivados" : "Catalogo de servicios"}
            </p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {showInactive
                ? `${inactiveServices.length} servicio(s) desactivado(s)`
                : `${services.length} servicio(s) registrado(s)`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setShowInactive((v) => !v); setQuery(""); setPage(1); }}
              className={`inline-flex items-center gap-2 rounded-full border border-[var(--destructive-border)] px-4 py-2 text-sm font-semibold text-[var(--destructive)] transition ${
                showInactive
                  ? "bg-[var(--destructive-hover)]"
                  : "hover:bg-[var(--destructive-hover)]"
              }`}
            >
              <Trash2 size={16} />
              Papelera
            </button>
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
                {showInactive
                  ? "No hay servicios en la papelera."
                  : query
                    ? "No se encontraron servicios con ese filtro."
                    : "No hay servicios registrados. Crea el primero."}
              </p>
            </div>
          ) : (
            paginatedServices.map((service) => (
              <article
                key={service.id}
                className="flex h-full flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                {service.imagen_url ? (
                  <div className="flex items-center justify-center bg-[var(--background)] px-4 pt-4">
                    <img src={service.imagen_url} alt={service.nombre} className="h-48 w-auto max-w-full rounded-2xl object-contain" />
                  </div>
                ) : (
                  <div className="flex h-48 w-full items-center justify-center bg-[var(--foreground)]">
                    <Scissors size={32} className="text-[var(--background)]" />
                  </div>
                )}
                <div className="p-5 flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-base font-semibold text-[var(--foreground)]">{service.nombre}</p>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      service.esta_activo ? "bg-[var(--hover)]/15 text-[var(--hover)]" : "bg-[var(--background)] text-[var(--text-muted)]"
                    }`}>
                      {service.esta_activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  {service.descripcion && (
                    <p className="mt-2 text-sm text-[var(--text-muted)] line-clamp-2">{service.descripcion}</p>
                  )}
                  <div className="mt-3 space-y-1.5 text-sm text-[var(--text-muted)]">
                    <p className="flex items-center gap-2"><Clock3 size={14} />{service.duracion_minutos} min</p>
                    <p className="flex items-center gap-2"><DollarSign size={14} />S/{service.precio}</p>
                    {service.puntos_otorgados > 0 && (
                      <p className="flex items-center gap-2 rounded-full bg-[var(--background)] px-2 py-0.5 text-xs font-medium w-fit">
                        +{service.puntos_otorgados} pts
                      </p>
                    )}
                  </div>
                  <div className="mt-auto flex items-center gap-2 border-t border-[var(--border)] pt-4">
                    {showInactive ? (
                      <button
                        type="button"
                        onClick={() => handleRestoreService(service.id)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--hover)] py-2 text-sm font-semibold text-[var(--hover)] transition hover:bg-[var(--hover)]/10"
                      >
                        <Undo2 size={14} />
                        Restaurar
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleEdit(service)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--background)]"
                        >
                          <Plus size={14} className="rotate-45" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeactivateTarget(service)}
                          className="flex shrink-0 items-center justify-center rounded-xl border border-[var(--destructive-border)] p-2 text-[var(--destructive)] transition hover:bg-[var(--destructive-hover)]"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
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
              {mode === "edit" ? (
                <PencilLine size={20} className="text-[var(--foreground)]" />
              ) : (
                <Scissors size={20} className="text-[var(--foreground)]" />
              )}
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

          <div className="grid gap-6 md:grid-cols-[200px_1fr] items-start">
            {/* FOTO - izquierda */}
            <div className="flex flex-col items-center">
              <p className="mb-2 text-sm font-medium text-[var(--foreground)]">Foto de perfil</p>
              <div className="flex flex-col items-center gap-3">
                <div className={`flex h-40 w-40 items-center justify-center overflow-hidden rounded-2xl border border-[var(--border)] ${!draft.imagen_url ? "bg-[var(--background)]" : ""}`}>
                  {draft.imagen_url ? (
                    <img src={draft.imagen_url} alt="Vista previa" className="h-full w-full object-cover" />
                  ) : (
                    <Scissors size={40} className="text-[var(--text-muted)]" />
                  )}
                </div>
                <CloudinaryUpload
                  cloudName={process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!}
                  uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!}
                  onUpload={(url) => setDraft((d) => ({ ...d, imagen_url: url }))}
                />
                {draft.imagen_url && (
                  <button
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, imagen_url: "" }))}
                    className="text-xs text-[var(--destructive)] underline transition hover:opacity-80"
                  >
                    Quitar foto
                  </button>
                )}
              </div>
            </div>

            {/* FORMULARIO - derecha */}
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="col-span-full">
                  <Field label="Nombre" required>
                    <input className={inputClassName} value={draft.nombre}
                      onChange={(e) => setDraft((d) => ({ ...d, nombre: e.target.value }))}
                      placeholder="Nombre del servicio" />
                  </Field>
                </div>
                <div className="col-span-full">
                  <Field label="Descripcion">
                    <textarea className={`${inputClassName} min-h-24 resize-none`} value={draft.descripcion ?? ""}
                      onChange={(e) => setDraft((d) => ({ ...d, descripcion: e.target.value }))} />
                  </Field>
                </div>
                <Field label="Precio (S/)">
                  <input type="number" className={inputClassName} value={draft.precio}
                    onChange={(e) => setDraft((d) => ({ ...d, precio: Number(e.target.value) }))} />
                </Field>
                <Field label="Duracion (min)">
                  <input type="number" className={inputClassName} value={draft.duracion_minutos}
                    onChange={(e) => setDraft((d) => ({ ...d, duracion_minutos: Number(e.target.value) }))} />
                </Field>
                <Field label="Puntos otorgados">
                  <input type="number" className={inputClassName} value={draft.puntos_otorgados}
                    onChange={(e) => setDraft((d) => ({ ...d, puntos_otorgados: Number(e.target.value) }))} />
                </Field>
                <Field label="Estado">
                  <select className={inputClassName} value={draft.esta_activo ? "activo" : "inactivo"}
                    onChange={(e) => setDraft((d) => ({ ...d, esta_activo: e.target.value === "activo" }))}>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </Field>
              </div>
            </div>
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

      <ConfirmationModal
        open={deactivateTarget !== null}
        title="Desactivar servicio"
        description={`${deactivateTarget?.nombre ?? ""} pasara a estado inactivo. Podras restaurarlo desde la papelera.`}
        confirmLabel="Si, desactivar"
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivateFromCard}
      />

      <Toast
        message={toastMessage}
        type={toastType}
        open={toastOpen}
        onClose={() => setToastOpen(false)}
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
    imagen_url: item.imagen_url ?? "",
  };
}
