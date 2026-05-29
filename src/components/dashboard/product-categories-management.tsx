"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, Plus, Search, Tag, Trash2, X } from "lucide-react";
import { ConfirmationModal } from "@/components/dashboard/confirmation-modal";
import { Pagination } from "@/components/dashboard/pagination";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/types/category";

type CategoryDraft = Omit<Category, "id">;

const emptyDraft: CategoryDraft = {
  nombre: "",
  descripcion: "",
  orden: 0,
};

const inputClassName =
  "w-full rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground)] px-4 py-3 text-sm outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--foreground)]";

export default function ProductCategoriesManagement() {
  const supabase = createClient();

  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<CategoryDraft>(emptyDraft);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [error, setError] = useState("");

  const pageSize = 10;
  const [page, setPage] = useState(1);

  useEffect(() => { fetchItems(); }, []);

  async function fetchItems() {
    setLoading(true);
    const { data } = await supabase
      .from("categoria_producto")
      .select("*")
      .order("nombre", { ascending: true });
    setItems(data ?? []);
    setLoading(false);
  }

  const filteredItems = useMemo(() => {
    return items.filter((i) =>
      i.nombre.toLowerCase().includes(query.toLowerCase()) ||
      i.descripcion?.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, items]);

  useEffect(() => { setPage(1); }, [query]);
  const totalPages = Math.ceil(filteredItems.length / pageSize);
  const paginatedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  const selectedItem = items.find((i) => i.id === selectedId);

  const handleCreate = () => {
    setSelectedId(null);
    setDraft(emptyDraft);
    setMode("create");
  };

  const handleEdit = (item: Category) => {
    setSelectedId(item.id);
    setDraft(toDraft(item));
    setMode("edit");
  };

  const handleBack = () => {
    setMode("list");
    setSelectedId(null);
    setDraft(emptyDraft);
  };

  async function saveItem() {
    if (!draft.nombre) return;
    setError("");
    setSaving(true);
    try {
      if (mode === "edit" && selectedId !== null) {
        await supabase.from("categoria_producto").update({
          nombre: draft.nombre,
          descripcion: draft.descripcion || null,
          orden: draft.orden,
        }).eq("id", selectedId);
      } else if (mode === "create") {
        await supabase.from("categoria_producto").insert({
          nombre: draft.nombre,
          descripcion: draft.descripcion || null,
          orden: draft.orden,
        });
      }
      await fetchItems();
      setMode("list");
      setSelectedId(null);
      setDraft(emptyDraft);
      setIsConfirmOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar la categoría");
    }
    setSaving(false);
  }

  async function deleteItem() {
    if (selectedId === null) return;
    await supabase.from("categoria_producto").delete().eq("id", selectedId);
    setSelectedId(null);
    setDraft(emptyDraft);
    setMode("list");
    await fetchItems();
    setIsDeleteOpen(false);
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
    </div>
  );

  return (
    <>
      {error && <div className="rounded-3xl border border-[var(--destructive-border)] bg-[var(--destructive-hover)] p-5 text-sm text-[var(--destructive)]">{error}</div>}

      {/* Barra de busqueda */}
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">Categorías de productos</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {items.length} categoría(s)
            </p>
          </div>
          {mode === "list" ? (
            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--button-primary)] px-4 py-2 text-sm font-semibold text-[var(--button-primary-foreground)] transition hover:opacity-90"
            >
              <Plus size={16} />
              Nueva categoría
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
              placeholder="Buscar por nombre"
            />
          </label>
        )}
      </div>

      {/* Listado */}
      {mode === "list" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {paginatedItems.length === 0 ? (
            <div className="col-span-full flex flex-col items-center gap-3 py-16">
              <Tag size={32} className="text-[var(--text-muted)]" />
              <p className="text-sm text-[var(--text-muted)]">
                {query ? "No se encontraron categorías con ese filtro." : "No hay categorías de productos registradas."}
              </p>
            </div>
          ) : (
            paginatedItems.map((item) => (
              <article
                key={item.id}
                className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--background)] text-[var(--foreground)]">
                    <Tag size={20} />
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-base font-semibold text-[var(--foreground)]">{item.nombre}</p>
                  {item.descripcion && (
                    <p className="mt-1 text-sm text-[var(--text-muted)] line-clamp-2">{item.descripcion}</p>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-[var(--border)] pt-4">
                  <button
                    type="button"
                    onClick={() => handleEdit(item)}
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
              <Tag size={20} className="text-[var(--foreground)]" />
            </div>
            <div>
              <p className="text-lg font-semibold text-[var(--foreground)]">
                {mode === "create" ? "Nueva categoría" : "Editar categoría"}
              </p>
              <p className="text-sm text-[var(--text-muted)]">
                {mode === "create"
                  ? "Agrega una categoría para productos."
                  : `Editando ${selectedItem?.nombre ?? ""}`}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="col-span-full">
              <Field label="Nombre" required>
                <input className={inputClassName} value={draft.nombre}
                  onChange={(e) => setDraft((d) => ({ ...d, nombre: e.target.value }))}
                  placeholder="Nombre de la categoría" />
              </Field>
            </div>
            <div className="col-span-full">
              <Field label="Descripción">
                <textarea className={`${inputClassName} min-h-20 resize-none`} value={draft.descripcion ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, descripcion: e.target.value }))}
                  placeholder="Descripción opcional" />
              </Field>
            </div>
            <Field label="Orden">
              <input type="number" className={inputClassName} value={draft.orden}
                onChange={(e) => setDraft((d) => ({ ...d, orden: Number(e.target.value) }))}
                min={0} />
            </Field>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-6">
            <button type="button" onClick={() => setIsConfirmOpen(true)}
              disabled={!draft.nombre || saving}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--button-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--button-primary-foreground)] transition hover:opacity-90 disabled:opacity-50">
              {saving && <Loader2 size={16} className="animate-spin" />}
              {mode === "create" ? "Crear categoría" : "Guardar cambios"}
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
        title={mode === "create" ? "Confirmar nueva categoría" : "Confirmar cambios"}
        description={mode === "create" ? "Se creará una nueva categoría." : "Se guardarán los cambios."}
        confirmLabel={saving ? "Guardando..." : mode === "create" ? "Sí, crear" : "Sí, guardar"}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={saveItem}
      />

      <ConfirmationModal
        open={isDeleteOpen}
        title="Eliminar categoría"
        description="Esta acción no se puede deshacer."
        confirmLabel="Sí, eliminar"
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={deleteItem}
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

function toDraft(item: Category): CategoryDraft {
  return {
    nombre: item.nombre,
    descripcion: item.descripcion,
    orden: item.orden,
  };
}
