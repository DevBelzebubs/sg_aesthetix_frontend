"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Loader2, Package, Search } from "lucide-react";
import { Pagination } from "@/components/dashboard/pagination";
import { createClient } from "@/lib/supabase/client";

type Movement = {
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

type Props = {
  totalMovimientos: number;
  totalEntradas: number;
  totalSalidas: number;
};

function getTipoClass(tipo: string) {
  if (tipo === "ingreso") return "bg-[var(--hover)]/15 text-[var(--hover)]";
  if (tipo === "salida") return "bg-[var(--destructive)]/15 text-[var(--destructive)]";
  return "bg-[var(--background)] text-[var(--text-muted)]";
}

function getTipoLabel(tipo: string) {
  if (tipo === "ingreso") return "Ingreso";
  if (tipo === "salida") return "Salida";
  return "Ajuste";
}

export function InventoryMovementsManagement({ totalMovimientos, totalEntradas, totalSalidas }: Props) {
  const supabase = createClient();

  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const pageSize = 10;
  const [page, setPage] = useState(1);

  async function fetchMovements() {
    setLoading(true);
    const { data } = await supabase
      .from("movimientos_inventario")
      .select("*, productos(nombre), usuarios(nombres, apellidos)")
      .order("creado_en", { ascending: false });
    setMovements(data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchMovements(); }, []);

  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      const productoNombre = m.productos?.nombre ?? "";
      const usuarioNombre = m.usuarios
        ? `${m.usuarios.nombres} ${m.usuarios.apellidos}`
        : "";
      return (
        productoNombre.toLowerCase().includes(query.toLowerCase()) ||
        (m.motivo ?? "").toLowerCase().includes(query.toLowerCase()) ||
        usuarioNombre.toLowerCase().includes(query.toLowerCase())
      );
    });
  }, [query, movements]);

  useEffect(() => { setPage(1); }, [query]);
  const totalPages = Math.ceil(filteredMovements.length / pageSize);
  const paginatedMovements = filteredMovements.slice((page - 1) * pageSize, page * pageSize);

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
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Total movimientos</p>
          <div className="mt-2 flex items-center gap-2">
            <Package size={20} style={{ color: "var(--hover)" }} />
            <p className="text-xl font-bold text-[var(--foreground)]">{totalMovimientos}</p>
          </div>
        </article>
        <article className="rounded-2xl border border-[var(--hover)]/20 p-4" style={{ background: "color-mix(in srgb, var(--hover) 6%, var(--background-secondary))" }}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Ingresos</p>
          <div className="mt-2 flex items-center gap-2">
            <ArrowDownToLine size={20} style={{ color: "var(--hover)" }} />
            <p className="text-xl font-bold text-[var(--foreground)]">{totalEntradas}</p>
          </div>
        </article>
        <article className="rounded-2xl border border-[var(--destructive)]/20 p-4" style={{ background: "color-mix(in srgb, var(--destructive) 6%, var(--background-secondary))" }}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Salidas</p>
          <div className="mt-2 flex items-center gap-2">
            <ArrowUpFromLine size={20} style={{ color: "var(--destructive)" }} />
            <p className="text-xl font-bold text-[var(--foreground)]">{totalSalidas}</p>
          </div>
        </article>
      </div>

      {/* Search bar */}
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">Movimientos de inventario</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {movements.length} movimiento(s)
            </p>
          </div>
        </div>

        <label className="mt-4 flex items-center gap-3 rounded-2xl border border-[var(--border)] px-4 py-3">
          <Search size={16} className="text-[var(--text-muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
            placeholder="Buscar por producto, motivo o usuario"
          />
        </label>
      </div>

      {/* Listado */}
      <>
        {paginatedMovements.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Package size={32} className="text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-muted)]">
              {query ? "No se encontraron movimientos con ese filtro." : "No hay movimientos registrados."}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)]">
            <div className="overflow-x-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--border)]">
              <table className="w-full text-sm min-w-[750px]">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left">
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] whitespace-nowrap">Producto</th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] text-center whitespace-nowrap">Tipo</th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] text-center whitespace-nowrap">Cantidad</th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] whitespace-nowrap">Motivo</th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] text-center whitespace-nowrap">Stock Ant.</th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] text-center whitespace-nowrap">Stock Nuevo</th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] whitespace-nowrap">Fecha</th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] whitespace-nowrap">Usuario</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {paginatedMovements.map((movement) => (
                    <tr key={movement.id} className="transition hover:bg-[var(--background)]">
                      <td className="px-5 py-4 font-medium text-[var(--foreground)] whitespace-nowrap">
                        {movement.productos?.nombre ?? "Sin nombre"}
                      </td>
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${getTipoClass(movement.tipo)}`}>
                          {movement.tipo === "ingreso" ? <ArrowDownToLine size={10} /> : movement.tipo === "salida" ? <ArrowUpFromLine size={10} /> : <Package size={10} />}
                          {getTipoLabel(movement.tipo)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center text-[var(--foreground)] font-medium whitespace-nowrap">
                        {movement.cantidad}
                      </td>
                      <td className="px-5 py-4 text-[var(--text-muted)] max-w-[200px] truncate">
                        {movement.motivo || "—"}
                      </td>
                      <td className="px-5 py-4 text-center text-[var(--text-muted)] whitespace-nowrap">
                        {movement.stock_anterior}
                      </td>
                      <td className="px-5 py-4 text-center text-[var(--foreground)] font-medium whitespace-nowrap">
                        {movement.stock_nuevo}
                      </td>
                      <td className="px-5 py-4 text-[var(--text-muted)] whitespace-nowrap">
                        {movement.creado_en.slice(0, 10)}
                      </td>
                      <td className="px-5 py-4 text-[var(--text-muted)] whitespace-nowrap">
                        {movement.usuarios
                          ? `${movement.usuarios.nombres} ${movement.usuarios.apellidos}`
                          : "—"}
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
    </>
  );
}
