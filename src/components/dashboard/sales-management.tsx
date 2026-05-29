"use client";

import { useEffect, useMemo, useState } from "react";
import { DollarSign, FileText, Loader2, Search, ShoppingCart, TrendingUp } from "lucide-react";
import { Pagination } from "@/components/dashboard/pagination";
import { createClient } from "@/lib/supabase/client";

type Sale = {
  id: string;
  cliente_id: string | null;
  usuario_id: string;
  tipo_venta: string;
  subtotal: number;
  descuento: number;
  total: number;
  metodo_pago: string | null;
  puntos_ganados: number;
  estado: string;
  observaciones: string | null;
  creado_en: string;
  clientes: { nombres: string; apellidos: string } | null;
};

const inputClassName =
  "w-full rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground)] px-4 py-3 text-sm outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--foreground)]";

type Props = {
  totalVentas: number;
  totalDia: number;
  ingresoTotal: number;
};

function getStatusClass(estado: string) {
  if (estado === "pagada") return "bg-[var(--hover)]/15 text-[var(--hover)]";
  if (estado === "anulada") return "bg-[var(--destructive)]/15 text-[var(--destructive)]";
  return "bg-[var(--background)] text-[var(--text-muted)]";
}

function getStatusLabel(estado: string) {
  if (estado === "pagada") return "Pagada";
  if (estado === "anulada") return "Anulada";
  return "Pendiente";
}

function formatMetodoPago(metodo: string | null) {
  if (!metodo) return "—";
  return metodo.charAt(0).toUpperCase() + metodo.slice(1);
}

function formatTipoVenta(tipo: string) {
  if (tipo === "servicio") return "Servicio";
  if (tipo === "producto") return "Producto";
  if (tipo === "mixta") return "Mixta";
  return tipo;
}

function getTipoVentaClass(tipo: string) {
  if (tipo === "servicio") return "bg-blue-500/15 text-blue-600";
  if (tipo === "producto") return "bg-amber-500/15 text-amber-600";
  return "bg-violet-500/15 text-violet-600";
}

export function SalesManagement({ totalVentas, totalDia, ingresoTotal }: Props) {
  const supabase = createClient();

  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const pageSize = 10;
  const [page, setPage] = useState(1);

  useEffect(() => { fetchSales(); }, []);

  async function fetchSales() {
    setLoading(true);
    const { data } = await supabase
      .from("ventas")
      .select("*, clientes(nombres, apellidos)")
      .order("creado_en", { ascending: false });
    setSales((data as Sale[]) ?? []);
    setLoading(false);
  }

  const filteredSales = useMemo(() => {
    const q = query.toLowerCase();
    return sales.filter((s) => {
      const nombreCliente = s.clientes?.nombres?.toLowerCase() ?? "";
      return (
        nombreCliente.includes(q) ||
        s.metodo_pago?.toLowerCase().includes(q)
      );
    });
  }, [query, sales]);

  useEffect(() => { setPage(1); }, [query]);
  const totalPages = Math.ceil(filteredSales.length / pageSize);
  const paginatedSales = filteredSales.slice((page - 1) * pageSize, page * pageSize);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
    </div>
  );

  return (
    <>
      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-[var(--hover)]/20 p-4" style={{ background: "color-mix(in srgb, var(--hover) 6%, var(--background-secondary))" }}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Total ventas</p>
          <div className="mt-2 flex items-center gap-2">
            <ShoppingCart size={20} style={{ color: "var(--hover)" }} />
            <p className="text-xl font-bold text-[var(--foreground)]">{totalVentas}</p>
          </div>
        </article>
        <article className="rounded-2xl border border-[var(--hover)]/20 p-4" style={{ background: "color-mix(in srgb, var(--hover) 6%, var(--background-secondary))" }}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Ventas hoy</p>
          <div className="mt-2 flex items-center gap-2">
            <TrendingUp size={20} style={{ color: "var(--hover)" }} />
            <p className="text-xl font-bold text-[var(--foreground)]">{totalDia}</p>
          </div>
        </article>
        <article className="rounded-2xl border border-[var(--hover)]/20 p-4" style={{ background: "color-mix(in srgb, var(--hover) 6%, var(--background-secondary))" }}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Ingreso total</p>
          <div className="mt-2 flex items-center gap-2">
            <DollarSign size={20} style={{ color: "var(--hover)" }} />
            <p className="text-xl font-bold text-[var(--foreground)]">S/{ingresoTotal.toFixed(2)}</p>
          </div>
        </article>
      </div>

      {/* Barra de busqueda */}
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">Listado de ventas</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {sales.length} venta(s)
            </p>
          </div>
        </div>

        <label className="mt-4 flex items-center gap-3 rounded-2xl border border-[var(--border)] px-4 py-3">
          <Search size={16} className="text-[var(--text-muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
            placeholder="Buscar por cliente o método de pago"
          />
        </label>
      </div>

      {/* Listado */}
      <>
        <div className="grid gap-4 sm:grid-cols-1">
          {paginatedSales.length === 0 ? (
            <div className="col-span-full flex flex-col items-center gap-3 py-16">
              <FileText size={32} className="text-[var(--text-muted)]" />
              <p className="text-sm text-[var(--text-muted)]">
                {query ? "No se encontraron ventas con ese filtro." : "No hay ventas registradas."}
              </p>
            </div>
          ) : (
            paginatedSales.map((sale) => {
              const nombreCliente = sale.clientes
                ? `${sale.clientes.nombres} ${sale.clientes.apellidos}`
                : "Cliente ocasional";

              return (
                <article
                  key={sale.id}
                  className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--background)] text-[var(--foreground)]">
                      <FileText size={20} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getTipoVentaClass(sale.tipo_venta)}`}>
                        {formatTipoVenta(sale.tipo_venta)}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(sale.estado)}`}>
                        {getStatusLabel(sale.estado)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-base font-semibold text-[var(--foreground)]">{nombreCliente}</p>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">{sale.creado_en.slice(0, 10)}</p>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--text-muted)]">
                    <span className="inline-flex items-center gap-1">
                      <span className="font-medium">Subtotal:</span>
                      S/{sale.subtotal.toFixed(2)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="font-medium">Desc:</span>
                      S/{sale.descuento.toFixed(2)}
                    </span>
                    <span className="inline-flex items-center gap-1 font-bold text-[var(--foreground)]">
                      <span>Total:</span>
                      S/{sale.total.toFixed(2)}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--text-muted)]">
                    <span className="inline-flex items-center gap-1">
                      <span className="font-medium">Pago:</span>
                      {formatMetodoPago(sale.metodo_pago)}
                    </span>
                    {sale.puntos_ganados > 0 && (
                      <span className="rounded-full bg-[var(--background)] px-2 py-0.5 text-xs font-medium">
                        +{sale.puntos_ganados} pts
                      </span>
                    )}
                  </div>

                  {sale.observaciones && (
                    <div className="mt-3 border-t border-[var(--border)] pt-3">
                      <p className="text-sm text-[var(--text-muted)]">{sale.observaciones}</p>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </>
    </>
  );
}
