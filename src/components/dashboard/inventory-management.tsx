"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Boxes, PackagePlus, Search, TrendingDown, TrendingUp, Loader2 } from "lucide-react";
import { ConfirmationModal } from "@/components/dashboard/confirmation-modal";
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
  "w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-900";

export function InventoryManagement() {
  const supabase = createClient();

  const [inventory, setInventory] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProductDraft>(emptyDraft);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => { fetchInventory(); }, []);

  async function fetchInventory() {
    setLoading(true);
    const { data } = await supabase
      .from("productos")
      .select("*")
      .order("nombre", { ascending: true });
    setInventory(data ?? []);
    if (data && data.length > 0) {
      setSelectedId(data[0].id);
      setDraft(toDraft(data[0]));
    }
    setLoading(false);
  }

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) =>
      item.nombre.toLowerCase().includes(query.toLowerCase()) ||
      item.sku?.toLowerCase().includes(query.toLowerCase())
    );
  }, [inventory, query]);

  const selectedItem = inventory.find((item) => item.id === selectedId);

  async function saveItem() {
    if (!draft.nombre) return;
    setSaving(true);
    if (selectedId) {
      await supabase.from("productos").update({
        ...draft,
        actualizado_en: new Date().toISOString(),
      }).eq("id", selectedId);
    } else {
      await supabase.from("productos").insert({
        ...draft,
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString(),
      });
    }
    await fetchInventory();
    setSaving(false);
  }

  async function deleteItem() {
    if (!selectedId) return;
    await supabase.from("productos").delete().eq("id", selectedId);
    setSelectedId(null);
    setDraft(emptyDraft);
    await fetchInventory();
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={24} className="animate-spin text-zinc-400" />
    </div>
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.92fr]">
      <div className="space-y-4">
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-zinc-900">Control de stock</p>
              <p className="mt-1 text-sm text-zinc-600">
                Revisa tus productos, las cantidades y lo que hace falta reponer.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setSelectedId(null); setDraft(emptyDraft); }}
              className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              <PackagePlus size={16} />
              Nuevo producto
            </button>
          </div>

          <label className="mt-4 flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3">
            <Search size={16} className="text-zinc-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
              placeholder="Buscar por nombre o SKU"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {filteredInventory.map((item) => {
            const lowStock = item.stock_actual <= item.stock_minimo;
            return (
              <article
                key={item.id}
                className={`rounded-3xl border bg-white p-5 shadow-sm transition ${
                  selectedId === item.id
                    ? "border-zinc-900 shadow-md"
                    : "border-zinc-200 hover:-translate-y-1 hover:shadow-md"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-zinc-900">{item.nombre}</p>
                    {item.sku && (
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500">{item.sku}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {item.destacado && (
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                        Destacado
                      </span>
                    )}
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      item.esta_activo ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"
                    }`}>
                      {item.esta_activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </div>
                {item.imagen_url && (
                  <img src={item.imagen_url} alt={item.nombre} className="mt-3 h-36 w-full rounded-2xl object-cover" />
                )}

                <div className="mt-4 space-y-2 text-sm text-zinc-600">
                  <p className="flex items-center gap-2">
                    <Boxes size={15} />
                    Stock: {item.stock_actual} / mín {item.stock_minimo}
                  </p>
                  <p className="flex items-center gap-2">
                    {lowStock ? <TrendingDown size={15} className="text-amber-500" /> : <TrendingUp size={15} className="text-green-500" />}
                    Venta: S/{item.precio_venta}
                  </p>
                </div>

                {lowStock && (
                  <div className="mt-4 flex items-center gap-2 rounded-2xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    <AlertTriangle size={15} />
                    Hace falta reponer
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => { setSelectedId(item.id); setDraft(toDraft(item)); }}
                  className="mt-4 rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100"
                >
                  Editar
                </button>
              </article>
            );
          })}
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-zinc-900">
            {selectedId ? "Editar producto" : "Nuevo producto"}
          </p>
          <div className="mt-4 grid gap-3">
            <Field label="Nombre">
              <input className={inputClassName} value={draft.nombre}
                onChange={(e) => setDraft((d) => ({ ...d, nombre: e.target.value }))} />
            </Field>
            <Field label="Descripcion">
              <textarea className={`${inputClassName} min-h-20 resize-none`} value={draft.descripcion ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, descripcion: e.target.value }))} />
            </Field>
            <Field label="Imagen">
              <div className="flex gap-2">
                <input className={inputClassName} value={draft.imagen_url ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, imagen_url: e.target.value }))}
                  placeholder="https://res.cloudinary.com/..." />
                <CloudinaryUpload
                  cloudName={process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!}
                  uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!}
                  onUpload={(url) => setDraft((d) => ({ ...d, imagen_url: url }))}
                />
              </div>
            </Field>
            {draft.imagen_url && (
              <img src={draft.imagen_url} alt="preview" className="h-40 w-full rounded-2xl object-cover" />
            )}
            <Field label="SKU">
              <input className={inputClassName} value={draft.sku ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, sku: e.target.value }))} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Precio costo">
                <input type="number" className={inputClassName} value={draft.precio_costo ?? 0}
                  onChange={(e) => setDraft((d) => ({ ...d, precio_costo: Number(e.target.value) }))} />
              </Field>
              <Field label="Precio venta">
                <input type="number" className={inputClassName} value={draft.precio_venta}
                  onChange={(e) => setDraft((d) => ({ ...d, precio_venta: Number(e.target.value) }))} />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Stock actual">
                <input type="number" className={inputClassName} value={draft.stock_actual}
                  onChange={(e) => setDraft((d) => ({ ...d, stock_actual: Number(e.target.value) }))} />
              </Field>
              <Field label="Stock minimo">
                <input type="number" className={inputClassName} value={draft.stock_minimo}
                  onChange={(e) => setDraft((d) => ({ ...d, stock_minimo: Number(e.target.value) }))} />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
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
              <Field label="Destacar en home">
                <select className={inputClassName} value={draft.destacado ? "si" : "no"}
                  onChange={(e) => setDraft((d) => ({ ...d, destacado: e.target.value === "si" }))}>
                  <option value="si">Sí</option>
                  <option value="no">No</option>
                </select>
              </Field>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={() => setIsConfirmOpen(true)}
              disabled={!draft.nombre}
              className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-40">
              {saving ? "Guardando..." : selectedId ? "Guardar cambios" : "Crear producto"}
            </button>
            <button type="button" onClick={() => setDraft(selectedItem ? toDraft(selectedItem) : emptyDraft)}
              className="rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100">
              Restablecer
            </button>
            {selectedId && (
              <button type="button" onClick={() => setIsDeleteOpen(true)}
                className="rounded-full border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-50">
                Eliminar
              </button>
            )}
          </div>
        </div>
      </aside>

      <ConfirmationModal
        open={isConfirmOpen}
        title={selectedId ? "Confirmar cambios" : "Confirmar nuevo producto"}
        description={selectedId ? "Se guardaran los cambios." : "Se creara un nuevo producto."}
        confirmLabel={saving ? "Guardando..." : selectedId ? "Si, guardar" : "Si, crear"}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={async () => { await saveItem(); setIsConfirmOpen(false); }}
      />

      <ConfirmationModal
        open={isDeleteOpen}
        title="Eliminar producto"
        description="Esta accion no se puede deshacer."
        confirmLabel="Si, eliminar"
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={async () => { await deleteItem(); setIsDeleteOpen(false); }}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      {children}
    </label>
  );
}

function toDraft(item: Product): ProductDraft {
  return {
    nombre: item.nombre,
    descripcion: item.descripcion,
    imagen_url: item.imagen_url ?? "",
    sku: item.sku,
    precio_costo: item.precio_costo,
    precio_venta: item.precio_venta,
    stock_actual: item.stock_actual,
    stock_minimo: item.stock_minimo,
    puntos_otorgados: item.puntos_otorgados,
    esta_activo: item.esta_activo,
    destacado: item.destacado,
    categoria_producto_id: item.categoria_producto_id,
  };
}