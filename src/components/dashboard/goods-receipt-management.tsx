"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownToLine, ArrowLeft, Loader2, Package, PackagePlus, Search, X } from "lucide-react";
import { ConfirmationModal } from "@/components/dashboard/confirmation-modal";
import { Pagination } from "@/components/dashboard/pagination";
import { createClient } from "@/lib/supabase/client";

type GoodsReceipt = {
  id: string;
  producto_id: string;
  usuario_id: string | null;
  tipo: string;
  cantidad: number;
  motivo: string | null;
  stock_anterior: number;
  stock_nuevo: number;
  referencia_tipo: string | null;
  referencia_id: string | null;
  creado_en: string;
  productos: { nombre: string } | null;
  usuarios: { nombres: string; apellidos: string } | null;
};

type GoodsReceiptDraft = {
  producto_id: string;
  cantidad: number;
  motivo: string;
};

const emptyDraft: GoodsReceiptDraft = {
  producto_id: "",
  cantidad: 1,
  motivo: "",
};

const inputClassName =
  "w-full rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground)] px-4 py-3 text-sm outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--foreground)]";

type Props = {
  totalIngresos: number;
  totalUnidades: number;
};

export function GoodsReceiptManagement({ totalIngresos, totalUnidades }: Props) {
  const supabase = createClient();

  const [items, setItems] = useState<GoodsReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"list" | "create">("list");
  const [draft, setDraft] = useState<GoodsReceiptDraft>(emptyDraft);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [page, setPage] = useState(1);

  const [productos, setProductos] = useState<{ id: string; nombre: string }[]>([]);

  const pageSize = 10;

  useEffect(() => {
    fetchIngresos();
    fetchProductos();
  }, []);

  async function fetchIngresos() {
    setLoading(true);
    const { data } = await supabase
      .from("movimientos_inventario")
      .select("*, productos(nombre), usuarios(nombres, apellidos)")
      .eq("tipo", "ingreso")
      .order("creado_en", { ascending: false });
    setItems((data as GoodsReceipt[]) ?? []);
    setLoading(false);
  }

  async function fetchProductos() {
    const { data } = await supabase
      .from("productos")
      .select("id, nombre")
      .order("nombre");
    setProductos((data as { id: string; nombre: string }[]) ?? []);
  }

  const filteredItems = useMemo(() => {
    return items.filter((i) =>
      i.productos?.nombre?.toLowerCase().includes(query.toLowerCase()) ||
      i.motivo?.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, items]);

  useEffect(() => { setPage(1); }, [query]);
  const totalPages = Math.ceil(filteredItems.length / pageSize);
  const paginatedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  const handleCreate = () => {
    setDraft(emptyDraft);
    setMode("create");
  };

  const handleBack = () => {
    setMode("list");
    setDraft(emptyDraft);
  };

  async function saveIngreso() {
    if (!draft.producto_id || draft.cantidad < 1) return;
    setSaving(true);

    const { data: product } = await supabase
      .from("productos")
      .select("stock_actual")
      .eq("id", draft.producto_id)
      .single();

    const stockAnterior = (product as { stock_actual: number } | null)?.stock_actual ?? 0;
    const stockNuevo = stockAnterior + draft.cantidad;

    await supabase.from("movimientos_inventario").insert({
      producto_id: draft.producto_id,
      tipo: "ingreso",
      cantidad: draft.cantidad,
      motivo: draft.motivo || null,
      stock_anterior: stockAnterior,
      stock_nuevo: stockNuevo,
      referencia_tipo: "compra",
    });

    await supabase
      .from("productos")
      .update({ stock_actual: stockNuevo })
      .eq("id", draft.producto_id);

    await fetchIngresos();
    setSaving(false);
    setMode("list");
    setDraft(emptyDraft);
    setIsConfirmOpen(false);
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("es-PE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
      </div>
    );

  return (
    <>
      {mode === "list" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <article
            className="rounded-2xl border border-[var(--hover)]/20 p-4"
            style={{ background: "color-mix(in srgb, var(--hover) 6%, var(--background-secondary))" }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Ingresos totales
            </p>
            <div className="mt-2 flex items-center gap-2">
              <PackagePlus size={20} style={{ color: "var(--hover)" }} />
              <p className="text-xl font-bold text-[var(--foreground)]">{totalIngresos}</p>
            </div>
          </article>
          <article
            className="rounded-2xl border border-[var(--hover)]/20 p-4"
            style={{ background: "color-mix(in srgb, var(--hover) 6%, var(--background-secondary))" }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Unidades recibidas
            </p>
            <div className="mt-2 flex items-center gap-2">
              <ArrowDownToLine size={20} style={{ color: "var(--hover)" }} />
              <p className="text-xl font-bold text-[var(--foreground)]">{totalUnidades}</p>
            </div>
          </article>
        </div>
      )}

      <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">Ingresos de mercadería</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {items.length} ingreso(s)
            </p>
          </div>
          {mode === "list" ? (
            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--button-primary)] px-4 py-2 text-sm font-semibold text-[var(--button-primary-foreground)] transition hover:opacity-90"
            >
              <PackagePlus size={16} />
              Nuevo ingreso
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
              placeholder="Buscar por producto o motivo"
            />
          </label>
        )}
      </div>

      {mode === "list" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {paginatedItems.length === 0 ? (
              <div className="col-span-full flex flex-col items-center gap-3 py-16">
                <Package size={32} className="text-[var(--text-muted)]" />
                <p className="text-sm text-[var(--text-muted)]">
                  {query
                    ? "No se encontraron ingresos con ese filtro."
                    : "No hay ingresos registrados."}
                </p>
              </div>
            ) : (
              paginatedItems.map((item) => (
                <article
                  key={item.id}
                  className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--background)] text-[var(--foreground)]">
                      <Package size={20} />
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-base font-semibold text-[var(--foreground)]">
                      {item.productos?.nombre ?? "Sin nombre"}
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--text-muted)]">
                    <span>
                      {item.cantidad} unidad(es)
                    </span>
                    <span className="font-medium text-[var(--foreground)]">
                      Stock: {item.stock_anterior} &rarr; {item.stock_nuevo}
                    </span>
                  </div>

                  {item.motivo && (
                    <div className="mt-2 text-sm text-[var(--text-muted)]">
                      {item.motivo}
                    </div>
                  )}

                  <div className="mt-3 border-t border-[var(--border)] pt-3 text-xs text-[var(--text-muted)]">
                    <p>
                      {formatDate(item.creado_en)}
                      {item.usuarios && (
                        <>
                          {" "}&middot;{" "}
                          {item.usuarios.nombres} {item.usuarios.apellidos}
                        </>
                      )}
                    </p>
                  </div>
                </article>
              ))
            )}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {mode === "create" && (
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-[var(--background)] p-3">
              <PackagePlus size={20} className="text-[var(--foreground)]" />
            </div>
            <div>
              <p className="text-lg font-semibold text-[var(--foreground)]">
                Nuevo ingreso de mercadería
              </p>
              <p className="text-sm text-[var(--text-muted)]">
                Registra la entrada de productos al inventario.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Producto" required>
              <select
                className={inputClassName}
                value={draft.producto_id}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, producto_id: e.target.value }))
                }
              >
                <option value="" disabled>
                  Seleccionar producto
                </option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Cantidad" required>
              <input
                type="number"
                className={inputClassName}
                value={draft.cantidad}
                min={1}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, cantidad: Number(e.target.value) }))
                }
              />
            </Field>
            <Field label="Motivo">
              <input
                className={inputClassName}
                value={draft.motivo}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, motivo: e.target.value }))
                }
                placeholder="Compra a proveedor"
              />
            </Field>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-6">
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              disabled={
                !draft.producto_id || draft.cantidad < 1 || saving
              }
              className="inline-flex items-center gap-2 rounded-full bg-[var(--button-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--button-primary-foreground)] transition hover:opacity-90 disabled:opacity-50"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              Registrar ingreso
            </button>
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
        title="Confirmar ingreso"
        description="Se registrará un nuevo ingreso de mercadería y se actualizará el stock del producto."
        confirmLabel={saving ? "Registrando..." : "Sí, registrar"}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={saveIngreso}
      />
    </>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
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
