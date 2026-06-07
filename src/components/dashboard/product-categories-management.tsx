"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowDown, ArrowLeft, ArrowUp, Loader2, PencilLine, Plus, Search, Tag, Trash2, X } from "lucide-react";
import { ConfirmationModal } from "@/components/dashboard/confirmation-modal";
import { Pagination } from "@/components/dashboard/pagination";
import { createClient } from "@/lib/supabase/client";
import { validatePositiveNumber, validateRequired } from "@/lib/validators";
import type { Category } from "@/types/category";

type CategoryDraft = Omit<Category, "id">;

const emptyDraft: CategoryDraft = {
  nombre: "",
  descripcion: "",
  orden: 0,
  publico: false,
  esta_activo: true,
};

const inputClassName =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] px-4 py-3 text-sm outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--hover)] focus:ring-2 focus:ring-[var(--hover)]/20";

async function reorderBeforeInsert(supabase: ReturnType<typeof createClient>, table: string, newOrder: number) {
  const { data } = await supabase.from(table).select("id, orden").gte("orden", newOrder).order("orden", { ascending: true });
  if (!data?.length) return;
  for (let i = data.length - 1; i >= 0; i--) {
    await supabase.from(table).update({ orden: (data[i] as Record<string, unknown>).orden as number + 1 }).eq("id", (data[i] as Record<string, unknown>).id);
  }
}

export default function ProductCategoriesManagement() {
  const supabase = createClient();

  const [items, setItems] = useState<Category[]>([]);
  const [inactiveItems, setInactiveItems] = useState<Category[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<CategoryDraft>(emptyDraft);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [error, setError] = useState("");

  const pageSize = 10;
  const [page, setPage] = useState(1);

  useEffect(() => { fetchItems(); }, []);

  useEffect(() => {
    if (!showInactive) return;
    setLoading(true);
    supabase
      .from("categoria_producto")
      .select("*")
      .eq("esta_activo", false)
      .order("orden", { ascending: true })
      .then(({ data }) => setInactiveItems(data ?? []))
      .finally(() => setLoading(false));
  }, [showInactive]);

  async function fetchItems() {
    setLoading(true);
    const { data } = await supabase
      .from("categoria_producto")
      .select("*")
      .eq("esta_activo", true)
      .order("orden", { ascending: true });
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
    setDraft({ ...emptyDraft, orden: 1 });
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
    const errors: Record<string, string> = {};
    const nombreError = validateRequired(draft.nombre, "El nombre");
    if (nombreError) errors.nombre = nombreError;
    const ordenError = validatePositiveNumber(draft.orden, "El orden");
    if (ordenError) errors.orden = ordenError;
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setError("");
    setSaving(true);
    try {
      if (mode === "edit" && selectedId !== null) {
        const old = selectedItem?.orden ?? 0;
        if (draft.orden !== old) {
          await reorderBeforeInsert(supabase, "categoria_producto", draft.orden);
        }
        await supabase.from("categoria_producto").update({
          nombre: draft.nombre,
          descripcion: draft.descripcion || null,
          orden: draft.orden,
          publico: draft.publico,
          esta_activo: draft.esta_activo,
        }).eq("id", selectedId);
      } else if (mode === "create") {
        if (draft.orden > 0) {
          await reorderBeforeInsert(supabase, "categoria_producto", draft.orden);
        }
        await supabase.from("categoria_producto").insert({
          nombre: draft.nombre,
          descripcion: draft.descripcion || null,
          orden: draft.orden > 0 ? draft.orden : (items.length > 0 ? Math.max(...items.map((i) => i.orden)) + 1 : 1),
          publico: draft.publico,
          esta_activo: draft.esta_activo,
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
    await supabase.from("categoria_producto").update({ esta_activo: false }).eq("id", selectedId);
    setItems((prev) => prev.filter((i) => i.id !== selectedId));
    setSelectedId(null);
    setDraft(emptyDraft);
    setMode("list");
    setIsDeleteOpen(false);
  }

  async function handleRestore(itemId: number) {
    await supabase.from("categoria_producto").update({ esta_activo: true }).eq("id", itemId);
    setInactiveItems((prev) => prev.filter((i) => i.id !== itemId));
  }

  async function moveItem(itemId: number, direction: "up" | "down") {
    const sorted = [...items].sort((a, b) => a.orden - b.orden);
    const idx = sorted.findIndex((i) => i.id === itemId);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === sorted.length - 1) return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [sorted[idx], sorted[swapIdx]] = [sorted[swapIdx], sorted[idx]];

    const updated = sorted.map((item, i) => ({ ...item, orden: i + 1 }));
    setItems(updated);

    for (let i = 0; i < updated.length; i++) {
      if (updated[i].orden !== sorted[i].orden || true) {
        await supabase.from("categoria_producto").update({ orden: updated[i].orden }).eq("id", updated[i].id);
      }
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
    </div>
  );

  return (
    <>
      {error && <div className="rounded-3xl border border-[var(--destructive-border)] bg-[var(--destructive-hover)] p-5 text-sm text-[var(--destructive)]">{error}</div>}

      <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {showInactive ? "Categorías desactivadas" : "Categorías de productos"}
            </p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {showInactive ? `${inactiveItems.length} categoría(s) desactivada(s)` : `${items.length} categoría(s)`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setShowInactive((v) => !v); setQuery(""); setPage(1); }}
              className={`inline-flex items-center gap-2 rounded-full border border-[var(--destructive-border)] px-4 py-2 text-sm font-semibold text-[var(--destructive)] transition ${
                showInactive ? "bg-[var(--destructive-hover)]" : "hover:bg-[var(--destructive-hover)]"
              }`}
            >
              <Trash2 size={16} />
              Papelera
            </button>
          {mode === "list" ? (
            <button type="button" onClick={handleCreate} className="inline-flex items-center gap-2 rounded-full bg-[var(--button-primary)] px-4 py-2 text-sm font-semibold text-[var(--button-primary-foreground)] transition hover:opacity-90">
              <Plus size={16} /> Nueva categoría
            </button>
          ) : (
            <button type="button" onClick={handleBack} className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)]">
              <ArrowLeft size={16} /> Volver al listado
            </button>
          )}
          </div>
        </div>
        {mode === "list" && (
          <label className="mt-4 flex items-center gap-3 rounded-2xl border border-[var(--border)] px-4 py-3">
            <Search size={16} className="text-[var(--text-muted)]" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]" placeholder="Buscar por nombre" />
          </label>
        )}
      </div>

      {mode === "list" && !showInactive && (
        <>
          {paginatedItems.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <Tag size={32} className="text-[var(--text-muted)]" />
              <p className="text-sm text-[var(--text-muted)]">{query ? "No se encontraron categorías." : "No hay categorías registradas."}</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)]">
              <div className="overflow-x-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--border)]">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left">
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] whitespace-nowrap">Nombre</th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Descripción</th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] text-center whitespace-nowrap">Orden</th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] text-center whitespace-nowrap">Público</th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] text-center whitespace-nowrap">Estado</th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] w-24"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {paginatedItems.map((item) => (
                      <tr key={item.id} className="transition hover:bg-[var(--background)]">
                        <td className="px-6 py-4 font-medium text-[var(--foreground)] cursor-pointer whitespace-nowrap" onClick={() => handleEdit(item)}>{item.nombre}</td>
                        <td className="px-6 py-4 text-[var(--text-muted)] cursor-pointer" onClick={() => handleEdit(item)}>{item.descripcion || "—"}</td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-sm font-medium text-[var(--foreground)]">{item.orden}</span>
                            <div className="flex flex-col -space-y-0.5">
                              <button type="button" onClick={() => moveItem(item.id, "up")} className="rounded p-0.5 text-[var(--text-muted)] transition hover:text-[var(--foreground)] leading-none"><ArrowUp size="10" /></button>
                              <button type="button" onClick={() => moveItem(item.id, "down")} className="rounded p-0.5 text-[var(--text-muted)] transition hover:text-[var(--foreground)] leading-none"><ArrowDown size="10" /></button>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${item.publico ? "bg-[var(--hover)]/15 text-[var(--hover)]" : "bg-[var(--background)] text-[var(--text-muted)]"}`}>{item.publico ? "Sí" : "No"}</span>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${item.esta_activo ? "bg-[var(--hover)]/15 text-[var(--hover)]" : "bg-[var(--warning)]/15 text-[var(--warning)]"}`}>{item.esta_activo ? "Activo" : "Inactivo"}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <button type="button" onClick={() => handleEdit(item)} className="rounded-lg p-2 text-[var(--text-muted)] transition hover:bg-[var(--background)] hover:text-[var(--foreground)]" title="Editar"><PencilLine size={15} /></button>
                            <button type="button" onClick={() => { setSelectedId(item.id); setIsDeleteOpen(true); }} className="rounded-lg p-2 text-[var(--destructive)] transition hover:bg-[var(--destructive-hover)]" title="Desactivar"><Trash2 size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {/* Papelera */}
      {mode === "list" && showInactive && (
        <>
          {inactiveItems.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <Trash2 size={32} className="text-[var(--text-muted)]" />
              <p className="text-sm text-[var(--text-muted)]">No hay categorías en la papelera.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-[var(--destructive-border)] bg-[var(--background-secondary)]">
              <div className="overflow-x-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--border)]">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left">
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] whitespace-nowrap">Nombre</th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Descripción</th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] text-center whitespace-nowrap">Orden</th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] text-center whitespace-nowrap">Público</th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] w-24"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {inactiveItems.map((item) => (
                      <tr key={item.id} className="transition hover:bg-[var(--destructive-hover)]">
                        <td className="px-6 py-4 font-medium text-[var(--foreground)] whitespace-nowrap">{item.nombre}</td>
                        <td className="px-6 py-4 text-[var(--text-muted)]">{item.descripcion || "—"}</td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span className="text-sm font-medium text-[var(--text-muted)]">{item.orden}</span>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${item.publico ? "bg-[var(--hover)]/15 text-[var(--hover)]" : "bg-[var(--background)] text-[var(--text-muted)]"}`}>{item.publico ? "Sí" : "No"}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button type="button" onClick={() => handleRestore(item.id)} className="rounded-lg p-2 text-[var(--text-muted)] transition hover:bg-[var(--hover)]/10 hover:text-[var(--hover)]" title="Restaurar">
                            <Undo2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {(mode === "create" || mode === "edit") && (
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-[var(--background)] p-3"><Tag size={20} className="text-[var(--foreground)]" /></div>
            <div>
              <p className="text-lg font-semibold text-[var(--foreground)]">{mode === "create" ? "Nueva categoría" : "Editar categoría"}</p>
              <p className="text-sm text-[var(--text-muted)]">{mode === "create" ? "Agrega una categoría para productos." : `Editando ${selectedItem?.nombre ?? ""}`}</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="col-span-full">
              <Field label="Nombre" required error={fieldErrors.nombre}>
                <input className={inputClassName} value={draft.nombre} onChange={(e) => { setDraft((d) => ({ ...d, nombre: e.target.value })); setFieldErrors((prev) => ({ ...prev, nombre: "" })); }} placeholder="Nombre de la categoría" />
              </Field>
            </div>
            <div className="col-span-full">
              <Field label="Descripción">
                <textarea className={`${inputClassName} min-h-20 resize-none`} value={draft.descripcion ?? ""} onChange={(e) => setDraft((d) => ({ ...d, descripcion: e.target.value }))} placeholder="Descripción opcional" />
              </Field>
            </div>
            <Field label="Orden" error={fieldErrors.orden}>
              <input type="number" className={inputClassName} value={draft.orden} onChange={(e) => { setDraft((d) => ({ ...d, orden: Number(e.target.value) })); setFieldErrors((prev) => ({ ...prev, orden: "" })); }} min={1} />
            </Field>
            <Field label="Visible en tienda">
              <select className={inputClassName} value={draft.publico ? "si" : "no"} onChange={(e) => setDraft((d) => ({ ...d, publico: e.target.value === "si" }))}>
                <option value="si">Sí</option>
                <option value="no">No</option>
              </select>
            </Field>
            <Field label="Estado">
              <select className={inputClassName} value={draft.esta_activo ? "activo" : "inactivo"} onChange={(e) => setDraft((d) => ({ ...d, esta_activo: e.target.value === "activo" }))}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </Field>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-6">
            <button type="button" onClick={() => setIsConfirmOpen(true)} disabled={Object.keys(fieldErrors).length > 0 || saving} className="inline-flex items-center gap-2 rounded-full bg-[var(--button-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--button-primary-foreground)] transition hover:opacity-90 disabled:opacity-50">
              {saving && <Loader2 size={16} className="animate-spin" />}
              {mode === "create" ? "Crear categoría" : "Guardar cambios"}
            </button>
            <button type="button" onClick={handleBack} className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)]">
              <X size={16} /> Cancelar
            </button>
          </div>
        </div>
      )}

      <ConfirmationModal open={isConfirmOpen} title={mode === "create" ? "Confirmar nueva categoría" : "Confirmar cambios"} description={mode === "create" ? "Se creará una nueva categoría." : "Se guardarán los cambios."} confirmLabel={saving ? "Guardando..." : mode === "create" ? "Sí, crear" : "Sí, guardar"} onClose={() => setIsConfirmOpen(false)} onConfirm={saveItem} />
      <ConfirmationModal open={isDeleteOpen} title="Eliminar categoría" description="Esta acción no se puede deshacer." confirmLabel="Sí, eliminar" onClose={() => setIsDeleteOpen(false)} onConfirm={deleteItem} />
    </>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return <label className="space-y-2"><span className="text-sm font-medium text-[var(--foreground)]">{label}{required && <span className="ml-1 text-[var(--destructive)]">*</span>}</span>{children}{error && <p className="flex items-center gap-1 text-[11px] text-[var(--destructive)]"><AlertCircle size={11} />{error}</p>}</label>;
}

function toDraft(item: Category): CategoryDraft {
  return { nombre: item.nombre, descripcion: item.descripcion, orden: item.orden, publico: item.publico, esta_activo: item.esta_activo };
}
