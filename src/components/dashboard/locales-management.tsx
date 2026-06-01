"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Globe, Loader2, MapPin, PencilLine, Plus, Search, Trash2, X } from "lucide-react";
import { ConfirmationModal } from "@/components/dashboard/confirmation-modal";
import { Pagination } from "@/components/dashboard/pagination";
import { LocalesService, type Locale } from "@/services/locales.service";

type LocaleDraft = {
  nombre: string;
  direccion: string;
  horario: string;
  telefono: string;
  maps_url: string;
  lat: string;
  lng: string;
  orden: number;
};

const emptyDraft: LocaleDraft = {
  nombre: "",
  direccion: "",
  horario: "",
  telefono: "",
  maps_url: "",
  lat: "",
  lng: "",
  orden: 1,
};

const inputClassName =
  "w-full rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground)] px-4 py-3 text-sm outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--foreground)]";

export default function LocalesManagement() {
  const [items, setItems] = useState<Locale[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<LocaleDraft>(emptyDraft);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [error, setError] = useState("");

  const pageSize = 10;
  const [page, setPage] = useState(1);

  useEffect(() => { fetchItems(); }, []);

  async function fetchItems() {
    setLoading(true);
    try {
      const data = await LocalesService.getAll();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }

  const filteredItems = useMemo(() => {
    return items.filter((i) =>
      i.nombre.toLowerCase().includes(query.toLowerCase()) ||
      i.direccion.toLowerCase().includes(query.toLowerCase()),
    );
  }, [query, items]);

  useEffect(() => { setPage(1); }, [query]);
  const totalPages = Math.ceil(filteredItems.length / pageSize);
  const paginatedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  const selectedItem = items.find((i) => i.id === selectedId);

  const handleCreate = () => {
    setSelectedId(null);
    setDraft({ ...emptyDraft, orden: items.length + 1 });
    setMode("create");
  };

  const handleEdit = (item: Locale) => {
    setSelectedId(item.id);
    setDraft({
      nombre: item.nombre,
      direccion: item.direccion,
      horario: item.horario,
      telefono: item.telefono,
      maps_url: item.maps_url,
      lat: String(item.lat),
      lng: String(item.lng),
      orden: item.orden,
    });
    setMode("edit");
  };

  const handleBack = () => {
    setMode("list");
    setSelectedId(null);
    setDraft(emptyDraft);
  };

  const handleSave = async () => {
    if (!draft.nombre || !draft.direccion || !draft.lat || !draft.lng) return;
    const lat = parseFloat(draft.lat);
    const lng = parseFloat(draft.lng);
    if (isNaN(lat) || isNaN(lng)) {
      setError("Latitud y longitud deben ser numeros validos.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (mode === "edit" && selectedId) {
        const updated = await LocalesService.update(selectedId, {
          nombre: draft.nombre,
          direccion: draft.direccion,
          horario: draft.horario,
          telefono: draft.telefono,
          maps_url: draft.maps_url,
          lat,
          lng,
          orden: draft.orden,
        });
        setItems((current) => current.map((i) => (i.id === selectedId ? updated : i)));
      } else {
        const created = await LocalesService.create({
          nombre: draft.nombre,
          direccion: draft.direccion,
          horario: draft.horario,
          telefono: draft.telefono,
          maps_url: draft.maps_url,
          lat,
          lng,
          orden: draft.orden,
        });
        setItems((current) => [...current, created]);
      }
      setMode("list");
      setSelectedId(null);
      setDraft(emptyDraft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
      setIsConfirmOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    try {
      await LocalesService.remove(selectedId);
      setItems((current) => current.filter((i) => i.id !== selectedId));
      setMode("list");
      setSelectedId(null);
      setDraft(emptyDraft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setIsDeleteOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[var(--text-muted)]" size={32} />
      </div>
    );
  }

  return (
    <>
      {/* Barra de busqueda y acciones */}
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">Locales</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{items.length} local(es) registrado(s)</p>
          </div>
          <div className="flex items-center gap-2">
            {mode === "list" ? (
              <button
                type="button"
                onClick={handleCreate}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--button-primary)] px-4 py-2 text-sm font-semibold text-[var(--button-primary-foreground)] transition hover:opacity-90"
              >
                <Plus size={16} />
                Nuevo local
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
          <div className="mt-4">
            <label className="flex items-center gap-3 rounded-2xl border border-[var(--border)] px-4 py-3">
              <Search size={16} className="text-[var(--text-muted)]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nombre o direccion"
                className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
              />
            </label>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-3xl border border-[var(--destructive-border)] bg-[var(--destructive-hover)] p-4 text-sm text-[var(--destructive)]">{error}</div>
      )}

      {/* Listado */}
      {mode === "list" && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {paginatedItems.length === 0 ? (
            <div className="col-span-full flex flex-col items-center gap-3 py-16">
              <MapPin size={32} className="text-[var(--text-muted)]" />
              <p className="text-sm text-[var(--text-muted)]">
                {query ? "No se encontraron locales con ese filtro." : "No hay locales registrados. Crea el primero."}
              </p>
            </div>
          ) : (
            paginatedItems.map((item) => (
              <article
                key={item.id}
                className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--background)] text-[var(--foreground)]">
                    <MapPin size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-[var(--foreground)]">{item.nombre}</p>
                    <p className="mt-0.5 text-sm text-[var(--text-muted)]">{item.direccion}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">{item.horario} · {item.telefono}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 border-t border-[var(--border)] pt-4">
                  <button
                    type="button"
                    onClick={() => handleEdit(item)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--background)]"
                  >
                    <PencilLine size={14} />
                    Editar
                  </button>
                  <a
                    href={item.maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] py-2 text-sm font-medium text-[var(--text-muted)] transition hover:bg-[var(--background)] hover:text-[var(--foreground)]"
                  >
                    <Globe size={14} />
                    Mapa
                  </a>
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {/* Formulario crear / editar */}
      {(mode === "create" || mode === "edit") && (
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-[var(--background)] p-3">
              <MapPin size={20} className="text-[var(--foreground)]" />
            </div>
            <div>
              <p className="text-lg font-semibold text-[var(--foreground)]">
                {mode === "create" ? "Nuevo local" : "Editar local"}
              </p>
              <p className="text-sm text-[var(--text-muted)]">
                {mode === "create" ? "Agrega una nueva sucursal." : `Editando ${selectedItem?.nombre ?? ""}`}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="col-span-full">
              <Field label="Nombre" required>
                <input className={inputClassName} value={draft.nombre} onChange={(e) => setDraft((c) => ({ ...c, nombre: e.target.value }))} placeholder="San Borja" />
              </Field>
            </div>
            <div className="col-span-full">
              <Field label="Direccion" required>
                <input className={inputClassName} value={draft.direccion} onChange={(e) => setDraft((c) => ({ ...c, direccion: e.target.value }))} placeholder="Av. Aviacion 3464 · San Borja" />
              </Field>
            </div>
            <Field label="Horario">
              <input className={inputClassName} value={draft.horario} onChange={(e) => setDraft((c) => ({ ...c, horario: e.target.value }))} placeholder="Lun – Sab · 8:00 AM – 8:00 PM" />
            </Field>
            <Field label="Telefono">
              <input className={inputClassName} value={draft.telefono} onChange={(e) => setDraft((c) => ({ ...c, telefono: e.target.value }))} placeholder="+51 999 999 999" />
            </Field>
            <Field label="URL Google Maps">
              <input className={inputClassName} value={draft.maps_url} onChange={(e) => setDraft((c) => ({ ...c, maps_url: e.target.value }))} placeholder="https://maps.google.com/?q=..." />
            </Field>
            <div className="grid gap-4 md:grid-cols-2 col-span-full">
              <Field label="Latitud" required>
                <input className={inputClassName} value={draft.lat} onChange={(e) => setDraft((c) => ({ ...c, lat: e.target.value }))} placeholder="-12.0943" type="number" step="any" />
              </Field>
              <Field label="Longitud" required>
                <input className={inputClassName} value={draft.lng} onChange={(e) => setDraft((c) => ({ ...c, lng: e.target.value }))} placeholder="-77.0073" type="number" step="any" />
              </Field>
            </div>
            <Field label="Orden">
              <input className={inputClassName} value={draft.orden} onChange={(e) => setDraft((c) => ({ ...c, orden: Number(e.target.value) }))} type="number" min={1} />
            </Field>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-6">
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              disabled={saving || !draft.nombre || !draft.direccion || !draft.lat || !draft.lng}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--button-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--button-primary-foreground)] transition hover:opacity-90 disabled:opacity-50"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {mode === "create" ? "Crear local" : "Guardar cambios"}
            </button>
            {mode === "edit" && (
              <button
                type="button"
                onClick={() => setIsDeleteOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--destructive-border)] px-5 py-2.5 text-sm font-semibold text-[var(--destructive)] transition hover:bg-[var(--destructive-hover)]"
              >
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
        title={mode === "create" ? "Confirmar nuevo local" : "Confirmar cambios"}
        description={mode === "create" ? "Se creara un nuevo local." : "Se guardaran los cambios."}
        confirmLabel={mode === "create" ? "Si, crear" : "Si, guardar"}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleSave}
      />

      <ConfirmationModal
        open={isDeleteOpen}
        title="Eliminar local"
        description="Este local se eliminara permanentemente."
        confirmLabel="Si, eliminar"
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-[var(--foreground)]">
        {label}
        {required && <span className="ml-1 text-[var(--destructive)]">*</span>}
      </span>
      {children}
    </label>
  );
}
