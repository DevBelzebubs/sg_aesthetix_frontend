"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, Boxes, Loader2, PackagePlus, Plus, Search, TrendingDown, TrendingUp, Trash2, X } from "lucide-react";
import { ConfirmationModal } from "@/components/dashboard/confirmation-modal";
import { Pagination } from "@/components/dashboard/pagination";
import { CloudinaryUpload } from "@/components/dashboard/cloudinary-upload";
import { createClient } from "@/lib/supabase/client";

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
  categoria_producto_id: 1,
};

const inputClassName =
  "w-full rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground)] px-4 py-3 text-sm outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--foreground)]";

type Props = {
  totalProductos: number;
  totalActivos: number;
  porReponer: number;
};

export function InventoryManagement({ totalProductos, totalActivos, porReponer }: Props) {
  const supabase = createClient();

  const [inventory, setInventory] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProductDraft>(emptyDraft);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const pageSize = 10;
  const [page, setPage] = useState(1);

  useEffect(() => { fetchInventory(); }, []);

  async function fetchInventory() {
    setLoading(true);
    const { data } = await supabase
      .from("productos")
      .select("*")
      .order("nombre", { ascending: true });
    setInventory(data ?? []);
    setLoading(false);
  }

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) =>
      item.nombre.toLowerCase().includes(query.toLowerCase()) ||
      item.sku?.toLowerCase().includes(query.toLowerCase())
    );
  }, [inventory, query]);

  useEffect(() => { setPage(1); }, [query]);
  const totalPages = Math.ceil(filteredInventory.length / pageSize);
  const paginatedInventory = filteredInventory.slice((page - 1) * pageSize, page * pageSize);

  const selectedItem = inventory.find((item) => item.id === selectedId);

  const handleCreate = () => { setSelectedId(null); setDraft(emptyDraft); setMode("create"); };
  const handleEdit = (item: Product) => { setSelectedId(item.id); setDraft(toDraft(item)); setMode("edit"); };
  const handleBack = () => { setMode("list"); setSelectedId(null); setDraft(emptyDraft); };

  async function saveItem() {
    if (!draft.nombre) return;
    setSaving(true);
    if (mode === "edit" && selectedId) {
      await supabase.from("productos").update({ ...draft, actualizado_en: new Date().toISOString() }).eq("id", selectedId);
    } else {
      await supabase.from("productos").insert({ ...draft, creado_en: new Date().toISOString(), actualizado_en: new Date().toISOString() });
    }
    await fetchInventory();
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
    await fetchInventory();
    setIsDeleteOpen(false);
  }

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
            <p className="text-sm font-semibold text-[var(--foreground)]">Control de stock</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{inventory.length} producto(s)</p>
          </div>
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
              <p className="text-sm text-[var(--text-muted)]">{query ? "No se encontraron productos." : "No hay productos. Crea el primero."}</p>
            </div>
          ) : (
            paginatedInventory.map((item) => {
              const lowStock = item.stock_actual <= item.stock_minimo;
              return (
                <article key={item.id} className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  {item.imagen_url ? (
                    <div className="flex items-center justify-center bg-[var(--background)] px-4 pt-4">
                      <img src={item.imagen_url} alt={item.nombre} className="h-48 w-auto max-w-full rounded-2xl object-contain" />
                    </div>
                  ) : (
                    <div className="flex h-48 w-full items-center justify-center bg-[var(--foreground)]"><Boxes size={32} className="text-[var(--background)]" /></div>
                  )}
                  <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-base font-semibold text-[var(--foreground)]">{item.nombre}</p></div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.esta_activo ? "bg-[var(--hover)]/15 text-[var(--hover)]" : "bg-[var(--background)] text-[var(--text-muted)]"}`}>{item.esta_activo ? "Activo" : "Inactivo"}</span>
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
                  <div className="mt-4 flex items-center gap-2 border-t border-[var(--border)] pt-4">
                    <button type="button" onClick={() => handleEdit(item)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--background)]">
                      <Plus size={14} className="rotate-45" /> Editar
                    </button>
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
            <div className="rounded-2xl bg-[var(--background)] p-3"><Boxes size={20} className="text-[var(--foreground)]" /></div>
            <div>
              <p className="text-lg font-semibold text-[var(--foreground)]">{mode === "create" ? "Nuevo producto" : "Editar producto"}</p>
              <p className="text-sm text-[var(--text-muted)]">{mode === "create" ? "Agrega un producto al inventario." : `Editando ${selectedItem?.nombre ?? ""}`}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre" required><input className={inputClassName} value={draft.nombre} onChange={(e) => setDraft((d) => ({ ...d, nombre: e.target.value }))} /></Field>
            <Field label="SKU"><input className={inputClassName} value={draft.sku ?? ""} onChange={(e) => setDraft((d) => ({ ...d, sku: e.target.value }))} /></Field>
            <div className="col-span-full">
              <Field label="Descripcion"><textarea className={`${inputClassName} min-h-20 resize-none`} value={draft.descripcion ?? ""} onChange={(e) => setDraft((d) => ({ ...d, descripcion: e.target.value }))} /></Field>
            </div>
            <div className="col-span-full">
              <Field label="Imagen">
                <div className="flex gap-2">
                  <input className={inputClassName} value={draft.imagen_url ?? ""} onChange={(e) => setDraft((d) => ({ ...d, imagen_url: e.target.value }))} placeholder="https://res.cloudinary.com/..." />
                  <CloudinaryUpload cloudName={process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!} uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!} onUpload={(url) => setDraft((d) => ({ ...d, imagen_url: url }))} />
                </div>
              </Field>
              {draft.imagen_url && <img src={draft.imagen_url} alt="preview" className="mt-2 h-40 w-full rounded-2xl object-cover" />}
            </div>
            <Field label="Precio costo"><input type="number" className={inputClassName} value={draft.precio_costo ?? 0} onChange={(e) => setDraft((d) => ({ ...d, precio_costo: Number(e.target.value) }))} /></Field>
            <Field label="Precio venta"><input type="number" className={inputClassName} value={draft.precio_venta} onChange={(e) => setDraft((d) => ({ ...d, precio_venta: Number(e.target.value) }))} /></Field>
            <Field label="Stock actual"><input type="number" className={inputClassName} value={draft.stock_actual} onChange={(e) => setDraft((d) => ({ ...d, stock_actual: Number(e.target.value) }))} /></Field>
            <Field label="Stock minimo"><input type="number" className={inputClassName} value={draft.stock_minimo} onChange={(e) => setDraft((d) => ({ ...d, stock_minimo: Number(e.target.value) }))} /></Field>
            <Field label="Puntos otorgados"><input type="number" className={inputClassName} value={draft.puntos_otorgados} onChange={(e) => setDraft((d) => ({ ...d, puntos_otorgados: Number(e.target.value) }))} /></Field>
            <Field label="Estado">
              <select className={inputClassName} value={draft.esta_activo ? "activo" : "inactivo"} onChange={(e) => setDraft((d) => ({ ...d, esta_activo: e.target.value === "activo" }))}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </Field>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-6">
            <button type="button" onClick={() => setIsConfirmOpen(true)} disabled={!draft.nombre || saving} className="inline-flex items-center gap-2 rounded-full bg-[var(--button-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--button-primary-foreground)] transition hover:opacity-90 disabled:opacity-50">
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
    </>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <label className="space-y-2"><span className="text-sm font-medium text-[var(--foreground)]">{label}{required && <span className="ml-1 text-[var(--destructive)]">*</span>}</span>{children}</label>;
}

function toDraft(item: Product): ProductDraft {
  return { nombre: item.nombre, descripcion: item.descripcion, imagen_url: item.imagen_url ?? "", sku: item.sku, precio_costo: item.precio_costo, precio_venta: item.precio_venta, stock_actual: item.stock_actual, stock_minimo: item.stock_minimo, puntos_otorgados: item.puntos_otorgados, esta_activo: item.esta_activo, destacado: item.destacado, categoria_producto_id: item.categoria_producto_id };
}
