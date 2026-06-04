"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, AlertTriangle, ArrowLeft, Boxes, Loader2, PackagePlus, Plus, Search, TrendingDown, TrendingUp, Trash2, X } from "lucide-react";
import { ConfirmationModal } from "@/components/dashboard/confirmation-modal";
import { Pagination } from "@/components/dashboard/pagination";
import { CloudinaryUpload } from "@/components/dashboard/cloudinary-upload";
import { Toast } from "@/components/dashboard/toast";
import type { ToastType } from "@/components/dashboard/toast";
import { createClient } from "@/lib/supabase/client";
import { validatePositiveNumber, validateRequired } from "@/lib/validators";

type Product = {
  id: string;
  nombre: string;
  descripcion: string | null;
  imagen_url: string | null;
  sku: string | null;
  precio_costo: number | null;
  precio_venta: number;
  stock_actual: number;
  stock_minimo: number;
  puntos_otorgados: number;
  esta_activo: boolean;
  destacado: boolean;
  publico: boolean;
  categoria_producto_id: number;
};

type ProductDraft = Omit<Product, "id">;

const emptyDraft: ProductDraft = {
  nombre: "",
  descripcion: null,
  imagen_url: null,
  sku: null,
  precio_costo: null,
  precio_venta: 0,
  stock_actual: 0,
  stock_minimo: 0,
  puntos_otorgados: 0,
  esta_activo: true,
  destacado: false,
  publico: false,
  categoria_producto_id: 1,
};

const inputClassName =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] px-4 py-3 text-sm outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--hover)] focus:ring-2 focus:ring-[var(--hover)]/20";

type Props = {
  totalProductos: number;
  totalActivos: number;
  porReponer: number;
};

export function InventoryManagement({ totalProductos, totalActivos, porReponer }: Props) {
  const supabase = createClient();

  const [inventory, setInventory] = useState<Product[]>([]);
  const [inactiveInventory, setInactiveInventory] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: number; nombre: string }[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProductDraft>(emptyDraft);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<Product | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<ToastType>("success");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const pageSize = 10;
  const [page, setPage] = useState(1);

  useEffect(() => { fetchActiveInventory(); fetchCategories(); }, []);

  async function fetchCategories() {
    const { data } = await supabase
      .from("categoria_producto")
      .select("id, nombre")
      .eq("esta_activo", true)
      .order("orden", { ascending: true });
    setCategories(data ?? []);
  }

  async function fetchActiveInventory() {
    setLoading(true);
    const { data } = await supabase
      .from("productos")
      .select("*")
      .eq("esta_activo", true)
      .order("nombre", { ascending: true });
    setInventory(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (!showInactive) return;
    setLoading(true);
    supabase
      .from("productos")
      .select("*")
      .eq("esta_activo", false)
      .order("nombre", { ascending: true })
      .then(({ data }) => setInactiveInventory(data ?? []))
      .finally(() => setLoading(false));
  }, [showInactive]);

  const inventoryForList = showInactive ? inactiveInventory : inventory;

  const filteredInventory = useMemo(() => {
    return inventoryForList.filter((item) =>
      item.nombre.toLowerCase().includes(query.toLowerCase()) ||
      item.sku?.toLowerCase().includes(query.toLowerCase())
    );
  }, [inventoryForList, query]);

  useEffect(() => { setPage(1); }, [query, showInactive]);
  const totalPages = Math.ceil(filteredInventory.length / pageSize);
  const paginatedInventory = filteredInventory.slice((page - 1) * pageSize, page * pageSize);

  const selectedItem = inventoryForList.find((item) => item.id === selectedId);

  const handleCreate = () => { setSelectedId(null); setDraft(emptyDraft); setMode("create"); };
  const handleEdit = (item: Product) => { setSelectedId(item.id); setDraft(toDraft(item)); setMode("edit"); };
  const handleDelete = (item: Product) => { setSelectedId(item.id); setIsDeleteOpen(true); };
  const handleBack = () => { setMode("list"); setSelectedId(null); setDraft(emptyDraft); setShowInactive(false); };

  async function saveItem() {
    const errors: Record<string, string> = {};
    const nombreErr = validateRequired(draft.nombre, "El nombre");
    if (nombreErr) errors.nombre = nombreErr;
    const precioVentaErr = validatePositiveNumber(draft.precio_venta, "El precio de venta");
    if (precioVentaErr) errors.precioVenta = precioVentaErr;
    if (draft.precio_costo && draft.precio_costo < 0) errors.precioCosto = "El precio de costo no puede ser negativo";
    if (draft.stock_actual < 0) errors.stockActual = "El stock actual no puede ser negativo";
    if (draft.stock_minimo < 0) errors.stockMinimo = "El stock mínimo no puede ser negativo";
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setSaving(true);
    if (mode === "edit" && selectedId) {
      await supabase.from("productos").update({ ...draft, actualizado_en: new Date().toISOString() }).eq("id", selectedId);
    } else {
      await supabase.from("productos").insert({ ...draft, creado_en: new Date().toISOString(), actualizado_en: new Date().toISOString() });
    }
    await fetchActiveInventory();
    setSaving(false);
    setMode("list");
    setSelectedId(null);
    setDraft(emptyDraft);
    setIsConfirmOpen(false);
  }

  async function deleteItem() {
    if (!selectedId) return;
    await supabase.from("productos").delete().eq("id", selectedId);
    setSelectedId(null);
    setDraft(emptyDraft);
    setMode("list");
    await fetchActiveInventory();
    setIsDeleteOpen(false);
  }

  const handleDeactivateFromCard = async () => {
    if (!deactivateTarget) return;
    try {
      await supabase.from("productos").update({ esta_activo: false }).eq("id", deactivateTarget.id);
      setInventory((prev) => prev.filter((p) => p.id !== deactivateTarget.id));
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

  const handleRestoreItem = async (id: string) => {
    await supabase.from("productos").update({ esta_activo: true }).eq("id", id);
    setInactiveInventory((prev) => prev.filter((p) => p.id !== id));
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
    </div>
  );

  return (
    <>
      {mode === "list" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <article className="rounded-2xl border border-[var(--hover)]/20 p-4" style={{ background: "color-mix(in srgb, var(--hover) 6%, var(--background-secondary))" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Total productos</p>
            <div className="mt-2 flex items-center gap-2">
              <Boxes size={20} style={{ color: "var(--hover)" }} />
              <p className="text-xl font-bold text-[var(--foreground)]">{totalProductos}</p>
            </div>
          </article>
          <article className="rounded-2xl border border-[var(--hover)]/20 p-4" style={{ background: "color-mix(in srgb, var(--hover) 6%, var(--background-secondary))" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Activos</p>
            <div className="mt-2 flex items-center gap-2">
              <TrendingUp size={20} style={{ color: "var(--hover)" }} />
              <p className="text-xl font-bold text-[var(--foreground)]">{totalActivos}</p>
            </div>
          </article>
          <article className="rounded-2xl border border-[var(--hover)]/20 p-4" style={{ background: "color-mix(in srgb, var(--hover) 6%, var(--background-secondary))" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Por reponer</p>
            <div className="mt-2 flex items-center gap-2">
              <AlertTriangle size={20} style={{ color: "var(--warning)" }} />
              <p className="text-xl font-bold text-[var(--foreground)]">{porReponer}</p>
            </div>
          </article>
        </div>
      )}

      <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {showInactive ? "Productos desactivados" : "Control de stock"}
            </p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {showInactive
                ? `${inactiveInventory.length} producto(s) desactivado(s)`
                : `${inventory.length} producto(s)`}
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
              <button type="button" onClick={handleCreate} className="inline-flex items-center gap-2 rounded-full bg-[var(--button-primary)] px-4 py-2 text-sm font-semibold text-[var(--button-primary-foreground)] transition hover:opacity-90">
                <Plus size={16} /> Nuevo producto
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
            <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]" placeholder="Buscar por nombre o SKU" />
          </label>
        )}
      </div>

      {mode === "list" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {paginatedInventory.length === 0 ? (
            <div className="col-span-full flex flex-col items-center gap-3 py-16">
              <Boxes size={32} className="text-[var(--text-muted)]" />
              <p className="text-sm text-[var(--text-muted)]">
                {showInactive
                  ? "No hay productos en la papelera."
                  : query
                    ? "No se encontraron productos."
                    : "No hay productos. Crea el primero."}
              </p>
            </div>
          ) : (
            paginatedInventory.map((item) => {
              const lowStock = item.stock_actual <= item.stock_minimo;
              return (
                <article key={item.id} className="flex h-full flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  {item.imagen_url ? (
                    <div className="flex items-center justify-center bg-[var(--background)] px-4 pt-4">
                      <img src={item.imagen_url} alt={item.nombre} className="h-48 w-auto max-w-full rounded-2xl object-contain" />
                    </div>
                  ) : (
                    <div className="flex h-48 w-full items-center justify-center bg-[var(--foreground)]"><Boxes size={32} className="text-[var(--background)]" /></div>
                  )}
                  <div className="p-5 flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-base font-semibold text-[var(--foreground)]">{item.nombre}</p></div>
                    <div className="flex flex-wrap gap-1">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.esta_activo ? "bg-[var(--hover)]/15 text-[var(--hover)]" : "bg-[var(--background)] text-[var(--text-muted)]"}`}>{item.esta_activo ? "Activo" : "Inactivo"}</span>
                    </div>
                  </div>
                   <div className="mt-2 flex flex-wrap gap-1">
                     {item.publico && <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-blue-500">Público</span>}
                     {item.destacado && <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-500">Destacado</span>}
                     <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-purple-500">
                       {categories.find((c) => c.id === item.categoria_producto_id)?.nombre ?? "Sin categoría"}
                     </span>
                   </div>
                  <div className="mt-3 space-y-1.5 text-sm text-[var(--text-muted)]">
                    <p className="flex items-center gap-2"><Boxes size={14} />Stock: {item.stock_actual} / mín {item.stock_minimo}</p>
                    <p className="flex items-center gap-2">{lowStock ? <TrendingDown size={14} className="text-[var(--warning)]" /> : <TrendingUp size={14} className="text-[var(--hover)]" />}Venta: S/{item.precio_venta}</p>
                    {item.sku && <p className="text-xs uppercase tracking-wide">SKU: {item.sku}</p>}
                  </div>
                  {lowStock && (
                    <div className="mt-3 flex items-center gap-2 rounded-2xl bg-[var(--warning)]/10 px-3 py-2 text-sm text-[var(--warning)]">
                      <AlertTriangle size={14} /> Hace falta reponer
                    </div>
                  )}
                  <div className="mt-auto flex items-center gap-2 border-t border-[var(--border)] pt-4">
                    {showInactive ? (
                      <button
                        type="button"
                        onClick={() => handleRestoreItem(item.id)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--hover)] py-2 text-sm font-semibold text-[var(--hover)] transition hover:bg-[var(--hover)]/10"
                      >
                        <Undo2 size={14} />
                        Restaurar
                      </button>
                    ) : (
                      <>
                        <button type="button" onClick={() => handleEdit(item)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--background)]">
                          <PencilLine size={14} /> Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeactivateTarget(item)}
                          className="flex shrink-0 items-center justify-center rounded-xl border border-[var(--destructive-border)] p-2 text-[var(--destructive)] transition hover:bg-[var(--destructive-hover)]"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {(mode === "create" || mode === "edit") && (
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-[var(--background)] p-3">
              {mode === "edit" ? (
                <PencilLine size={20} className="text-[var(--foreground)]" />
              ) : (
                <Boxes size={20} className="text-[var(--foreground)]" />
              )}
            </div>
            <div>
              <p className="text-lg font-semibold text-[var(--foreground)]">{mode === "create" ? "Nuevo producto" : "Editar producto"}</p>
              <p className="text-sm text-[var(--text-muted)]">{mode === "create" ? "Agrega un producto al inventario." : `Editando ${selectedItem?.nombre ?? ""}`}</p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-[320px_1fr]">
            {/* IMAGEN - izquierda */}
            <div className="flex flex-col items-center">
              <p className="mb-3 text-sm font-medium text-[var(--foreground)]">Foto</p>
              <div className="flex flex-col items-center gap-3">
                <div className={`flex aspect-square w-full max-w-[200px] items-center justify-center overflow-hidden rounded-2xl border border-[var(--border)] ${!draft.imagen_url ? "bg-[var(--background)]" : ""}`}>
                  {draft.imagen_url ? (
                    <img src={draft.imagen_url} alt="preview" className="h-full w-full object-cover" />
                  ) : (
                    <Boxes size={48} className="text-[var(--text-muted)]" />
                  )}
                </div>
                <CloudinaryUpload cloudName={process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!} uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!} onUpload={(url) => setDraft((d) => ({ ...d, imagen_url: url }))} />
                {draft.imagen_url && (
                  <button
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, imagen_url: null }))}
                    className="text-xs text-[var(--destructive)] underline transition hover:opacity-80"
                  >
                    Quitar imagen
                  </button>
                )}
              </div>
            </div>

            {/* FORMULARIO - derecha */}
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nombre" required><input className={inputClassName} value={draft.nombre} onChange={(e) => setDraft((d) => ({ ...d, nombre: e.target.value }))} /></Field>
              <Field label="SKU"><input className={inputClassName} value={draft.sku ?? ""} onChange={(e) => setDraft((d) => ({ ...d, sku: e.target.value }))} /></Field>
              <div className="col-span-full">
                <Field label="Descripcion"><textarea className={`${inputClassName} min-h-20 resize-none`} value={draft.descripcion ?? ""} onChange={(e) => setDraft((d) => ({ ...d, descripcion: e.target.value }))} /></Field>
              </div>
              <Field label="Precio costo"><input type="number" className={inputClassName} value={draft.precio_costo ?? 0} onChange={(e) => setDraft((d) => ({ ...d, precio_costo: Number(e.target.value) }))} /></Field>
              <Field label="Precio venta"><input type="number" className={inputClassName} value={draft.precio_venta} onChange={(e) => setDraft((d) => ({ ...d, precio_venta: Number(e.target.value) }))} /></Field>
              <Field label="Puntos otorgados"><input type="number" className={inputClassName} value={draft.puntos_otorgados} onChange={(e) => setDraft((d) => ({ ...d, puntos_otorgados: Number(e.target.value) }))} /></Field>
               <Field label="Stock mínimo"><input type="number" className={inputClassName} value={draft.stock_minimo} onChange={(e) => setDraft((d) => ({ ...d, stock_minimo: Number(e.target.value) }))} /></Field>
               <Field label="Categoría">
                 <select
                   className={inputClassName}
                   value={draft.categoria_producto_id}
                   onChange={(e) => setDraft((d) => ({ ...d, categoria_producto_id: Number(e.target.value) }))}
                 >
                   {categories.map((cat) => (
                     <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                   ))}
                 </select>
               </Field>
              <div className="col-span-full">
                <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Estado</span>
                  <div className="flex rounded-xl bg-[var(--background-secondary)] p-0.5">
                    <button
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, esta_activo: true }))}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${draft.esta_activo ? "bg-[var(--hover)] text-white" : "text-[var(--text-muted)]"}`}
                    >
                      Activo
                    </button>
                    <button
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, esta_activo: false, publico: false, destacado: false }))}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${!draft.esta_activo ? "bg-neutral-700 text-white" : "text-[var(--text-muted)]"}`}
                    >
                      Inactivo
                    </button>
                  </div>
                  {draft.esta_activo && (
                    <>
                      <span className="mx-1 h-5 w-px bg-[var(--border)]" />
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-xs text-[var(--text-muted)]">Visible</span>
                        <button
                          type="button"
                          onClick={() => setDraft((d) => ({ ...d, publico: !d.publico }))}
                          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${draft.publico ? "bg-[var(--hover)]" : "bg-[var(--border)]"}`}
                        >
                          <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition ${draft.publico ? "translate-x-[18px]" : "translate-x-0.5"}`} />
                        </button>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-xs text-[var(--text-muted)]">Destacado</span>
                        <button
                          type="button"
                          onClick={() => setDraft((d) => ({ ...d, destacado: !d.destacado }))}
                          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${draft.destacado ? "bg-[var(--hover)]" : "bg-[var(--border)]"}`}
                        >
                          <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition ${draft.destacado ? "translate-x-[18px]" : "translate-x-0.5"}`} />
                        </button>
                      </label>
                    </>
                  )}
                </div>
              </div>
            </div>
            <Field label="Precio costo" error={fieldErrors.precioCosto}><input type="number" className={inputClassName} value={draft.precio_costo ?? 0} onChange={(e) => { setDraft((d) => ({ ...d, precio_costo: Number(e.target.value) })); setFieldErrors((prev) => ({ ...prev, precioCosto: "" })); }} /></Field>
            <Field label="Precio venta" error={fieldErrors.precioVenta}><input type="number" className={inputClassName} value={draft.precio_venta} onChange={(e) => { setDraft((d) => ({ ...d, precio_venta: Number(e.target.value) })); setFieldErrors((prev) => ({ ...prev, precioVenta: "" })); }} /></Field>
            <Field label="Puntos otorgados"><input type="number" className={inputClassName} value={draft.puntos_otorgados} onChange={(e) => { setDraft((d) => ({ ...d, puntos_otorgados: Number(e.target.value) })); setFieldErrors((prev) => ({ ...prev, puntosOtorgados: "" })); }} /></Field>
            <Field label="Estado">
              <select className={inputClassName} value={draft.esta_activo ? "activo" : "inactivo"} onChange={(e) => setDraft((d) => ({ ...d, esta_activo: e.target.value === "activo" }))}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </Field>
            <Field label="Visible en tienda">
              <select className={inputClassName} value={draft.publico ? "si" : "no"} onChange={(e) => setDraft((d) => ({ ...d, publico: e.target.value === "si" }))}>
                <option value="si">Si - Mostrar en la tienda publica</option>
                <option value="no">No - Solo panel admin</option>
              </select>
            </Field>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-6">
            <button type="button" onClick={() => setIsConfirmOpen(true)} disabled={Object.keys(fieldErrors).length > 0 || saving} className="inline-flex items-center gap-2 rounded-full bg-[var(--button-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--button-primary-foreground)] transition hover:opacity-90 disabled:opacity-50">
              {saving && <Loader2 size={16} className="animate-spin" />}
              {mode === "create" ? "Crear producto" : "Guardar cambios"}
            </button>
            {mode === "edit" && (
              <button type="button" onClick={() => setIsDeleteOpen(true)} className="inline-flex items-center gap-2 rounded-full border border-[var(--destructive-border)] px-5 py-2.5 text-sm font-semibold text-[var(--destructive)] transition hover:bg-[var(--destructive-hover)]">
                <Trash2 size={16} /> Eliminar
              </button>
            )}
            <button type="button" onClick={handleBack} className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)]">
              <X size={16} /> Cancelar
            </button>
          </div>
        </div>
      )}

      <ConfirmationModal open={isConfirmOpen} title={mode === "create" ? "Confirmar nuevo producto" : "Confirmar cambios"} description={mode === "create" ? "Se creara un nuevo producto." : "Se guardaran los cambios."} confirmLabel={saving ? "Guardando..." : mode === "create" ? "Si, crear" : "Si, guardar"} onClose={() => setIsConfirmOpen(false)} onConfirm={saveItem} />
      <ConfirmationModal open={isDeleteOpen} title="Eliminar producto" description="Esta accion no se puede deshacer." confirmLabel="Si, eliminar" onClose={() => setIsDeleteOpen(false)} onConfirm={deleteItem} />

      <ConfirmationModal
        open={deactivateTarget !== null}
        title="Desactivar producto"
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
  return <label className="space-y-2"><span className="text-sm font-medium text-[var(--foreground)]">{label}{required && <span className="ml-1 text-[var(--destructive)]">*</span>}</span>{children}{error && <p className="flex items-center gap-1 text-[11px] text-[var(--destructive)]"><AlertCircle size={11} />{error}</p>}</label>;
}

function toDraft(item: Product): ProductDraft {
  return { nombre: item.nombre, descripcion: item.descripcion, imagen_url: item.imagen_url ?? "", sku: item.sku, precio_costo: item.precio_costo, precio_venta: item.precio_venta, stock_actual: item.stock_actual, stock_minimo: item.stock_minimo, puntos_otorgados: item.puntos_otorgados, esta_activo: item.esta_activo, destacado: item.destacado, publico: item.publico, categoria_producto_id: item.categoria_producto_id };
}
