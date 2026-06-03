"use client";

import { useState, useMemo } from "react";
import {
  DollarSign, ShoppingCart, TrendingUp, TrendingDown, CreditCard,
  Banknote, Smartphone, AlertTriangle, Package, CalendarCheck,
  Clock, CheckCircle2, ChevronRight,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PaymentMethodBreakdown = {
  metodo_pago: string;
  total: number;
  count: number;
};

type DailyPoint = {
  date: string;
  revenue: number;
  count: number;
};

type MonthlySalesData = {
  dailyPoints: DailyPoint[];
  totalRevenue: number;
  totalCount: number;
  avgTicket: number;
  lastMonthRevenue: number;
  lastMonthCount: number;
};

type LowStockProduct = {
  id: string;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
};

type TopProduct = {
  descripcion: string;
  total_vendido: number;
  total_revenue: number;
};

type CitaItem = {
  hora_inicio: string;
  cliente_nombre?: string;
  servicio_nombre?: string;
};

type Props = {
  monthlySales: MonthlySalesData;
  revenueTrend: DailyPoint[];
  lowStockProducts: LowStockProduct[];
  topProducts: TopProduct[];
  // Citas
  citasHoy: number;
  pendientesHoy: number;
  citasCompletadasHoy: number;
  citasSemana: number;
  pendientesSemana: number;
  citasCompletadasSemana: number;
  proximasCitas: CitaItem[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(n: number) {
  return n.toFixed(2);
}

function getDayName(dateStr: string) {
  const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const d = new Date(dateStr + "T00:00:00");
  return days[d.getDay()];
}

function getMonthName(monthIdx: number) {
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];
  return months[monthIdx];
}

function formatMetodo(metodo: string) {
  const map: Record<string, string> = {
    efectivo: "Efectivo",
    tarjeta: "Tarjeta",
    yape: "Yape",
    plin: "Plin",
    transferencia: "Transferencia",
    otro: "Otro",
  };
  return map[metodo] ?? metodo;
}

function getMetodoIcon(metodo: string) {
  switch (metodo) {
    case "efectivo": return Banknote;
    case "tarjeta": return CreditCard;
    case "yape": case "plin": case "transferencia": return Smartphone;
    default: return CreditCard;
  }
}

const methodColors: Record<string, string> = {
  efectivo: "bg-emerald-500",
  tarjeta: "bg-blue-500",
  yape: "bg-purple-500",
  plin: "bg-violet-500",
  transferencia: "bg-amber-500",
  otro: "bg-slate-500",
};

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

// ---------------------------------------------------------------------------
// Row 1: Monthly Sales Dashboard (full width)
// ---------------------------------------------------------------------------

type Periodo = "mes" | "semana" | "dia";

function MonthlySalesDashboard({ data }: { data: MonthlySalesData }) {
  const [periodo, setPeriodo] = useState<Periodo>("mes");

  const today = todayStr();

  // Filter daily points based on selected period
  const filteredPoints = useMemo(() => {
    if (periodo === "dia") {
      return data.dailyPoints.filter((p) => p.date === today);
    }
    if (periodo === "semana") {
      return data.dailyPoints.slice(-7);
    }
    return data.dailyPoints;
  }, [periodo, data.dailyPoints]);

  // Aggregate for selected period
  const periodRevenue = filteredPoints.reduce((s, p) => s + p.revenue, 0);
  const periodCount = filteredPoints.reduce((s, p) => s + p.count, 0);

  // Comparison: previous period
  let prevRevenue = 0;
  let prevCount = 0;
  if (periodo === "mes") {
    prevRevenue = data.lastMonthRevenue;
    prevCount = data.lastMonthCount;
  } else if (periodo === "semana") {
    // Previous 7 days before the current 7
    const prevPoints = data.dailyPoints.slice(-14, -7);
    prevRevenue = prevPoints.reduce((s, p) => s + p.revenue, 0);
    prevCount = prevPoints.reduce((s, p) => s + p.count, 0);
  } else {
    // Yesterday
    const yesterdayIdx = data.dailyPoints.findIndex((p) => p.date === today) - 1;
    if (yesterdayIdx >= 0) {
      prevRevenue = data.dailyPoints[yesterdayIdx]?.revenue ?? 0;
      prevCount = data.dailyPoints[yesterdayIdx]?.count ?? 0;
    }
  }

  const revenueChange = prevRevenue > 0 ? ((periodRevenue - prevRevenue) / prevRevenue) * 100 : 0;

  const maxBar = Math.max(...filteredPoints.map((p) => p.revenue), 1);

  const periodLabel =
    periodo === "mes"
      ? getMonthName(new Date().getMonth())
      : periodo === "semana"
        ? "Esta semana"
        : "Hoy";

  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Ventas
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-[var(--foreground)]">
            {periodLabel}
          </h2>
        </div>

        {/* Period selector */}
        <div className="flex rounded-2xl border border-[var(--border)] bg-[var(--background)] p-1 gap-1">
          {(["mes", "semana", "dia"] as Periodo[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                periodo === p
                  ? "bg-[var(--hover)] text-[var(--foreground)]"
                  : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {p === "mes" ? "Mes" : p === "semana" ? "Semana" : "Día"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-3 sm:grid-cols-3 mb-6">
        <div className="rounded-2xl bg-[var(--background)] p-4">
          <p className="text-xs text-[var(--text-muted)]">Ingresos</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-bold text-[var(--foreground)]">
              S/{formatCurrency(periodRevenue)}
            </p>
            {prevRevenue > 0 && (
              <span className={`text-xs font-semibold ${revenueChange >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {revenueChange >= 0 ? "+" : ""}{revenueChange.toFixed(0)}%
              </span>
            )}
          </div>
        </div>
        <div className="rounded-2xl bg-[var(--background)] p-4">
          <p className="text-xs text-[var(--text-muted)]">Ventas</p>
          <p className="mt-1 text-2xl font-bold text-[var(--foreground)]">{periodCount}</p>
        </div>
        <div className="rounded-2xl bg-[var(--background)] p-4">
          <p className="text-xs text-[var(--text-muted)]">Ticket promedio</p>
          <p className="mt-1 text-2xl font-bold text-[var(--foreground)]">
            S/{formatCurrency(periodCount > 0 ? periodRevenue / periodCount : 0)}
          </p>
        </div>
      </div>

      {/* Bar chart */}
      {filteredPoints.length > 0 ? (
        <div>
          {periodo === "dia" ? (
            /* Day view: show today's revenue prominently */
            <div className="flex items-end gap-4 py-4">
              <div className="flex-1 h-24 rounded-2xl bg-[var(--background)] flex items-center justify-center relative overflow-hidden">
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-2xl bg-[var(--hover)]/30 transition-all duration-700"
                  style={{ height: "100%" }}
                />
                <span className="relative text-3xl font-bold text-[var(--foreground)]">
                  S/{formatCurrency(periodRevenue)}
                </span>
              </div>
            </div>
          ) : (
            /* Month / Week: vertical column chart */
            <div>
              <div className="relative h-44">
                {/* Y-axis guide lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none px-1">
                  <div className="border-t border-[var(--border)]/30 w-full" />
                  <div className="border-t border-[var(--border)]/30 w-full" />
                  <div className="border-t border-[var(--border)]/30 w-full" />
                  <div className="border-t border-[var(--border)]/30 w-full" />
                </div>

                <div className="flex items-end gap-[2px] h-full px-1">
                  {filteredPoints.map((point) => {
                    const pct = maxBar > 0 ? (point.revenue / maxBar) * 100 : 0;
                    const barH = Math.max(pct, point.revenue > 0 ? 2 : 0);
                    const isToday = point.date === today;
                    return (
                      <div
                        key={point.date}
                        className="flex-1 flex flex-col items-center justify-end min-w-0"
                        title={`${point.date}: S/${formatCurrency(point.revenue)}`}
                      >
                        {barH > 35 && (
                          <span className="text-[9px] font-semibold text-[var(--foreground)] mb-0.5 whitespace-nowrap">
                            S/{formatCurrency(point.revenue)}
                          </span>
                        )}
                        <div
                          className={`w-full rounded-t-sm transition-all duration-500 ${
                            isToday
                              ? "bg-[var(--hover)]"
                              : point.revenue > 0
                                ? "bg-[var(--hover)]/40"
                                : "bg-[var(--hover)]/10"
                          }`}
                          style={{ height: `${barH}%`, minHeight: point.revenue > 0 ? 4 : 1 }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* X-axis labels */}
              <div className="flex gap-[2px] px-1 mt-1.5">
                {filteredPoints.map((point) => (
                  <span
                    key={point.date}
                    className="flex-1 text-center text-[9px] text-[var(--text-muted)] min-w-0 truncate"
                  >
                    {periodo === "mes"
                      ? point.date.slice(8)
                      : getDayName(point.date)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-[var(--text-muted)]">
          Sin ventas registradas en este período.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Row 2 Left: Revenue trend (last 7 days)
// ---------------------------------------------------------------------------

function RevenueTrendWidget({ data }: { data: DailyPoint[] }) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const today = todayStr();

  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
        Últimos 7 días
      </p>
      <h2 className="mt-1 text-xl font-bold tracking-tight text-[var(--foreground)]">
        Tendencia de ingresos
      </h2>

      {data.length > 0 && maxRevenue > 0 ? (
        <div className="mt-5">
          <div className="relative h-44">
            {/* Y-axis guide lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none px-1">
              <div className="border-t border-[var(--border)]/30 w-full" />
              <div className="border-t border-[var(--border)]/30 w-full" />
              <div className="border-t border-[var(--border)]/30 w-full" />
              <div className="border-t border-[var(--border)]/30 w-full" />
            </div>

            <div className="flex items-end gap-2 h-full px-1">
              {data.map((day) => {
                const pct = (day.revenue / maxRevenue) * 100;
                const barH = Math.max(pct, day.revenue > 0 ? 3 : 0);
                const isToday = day.date === today;
                return (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center justify-end min-w-0"
                    title={`${day.date}: S/${formatCurrency(day.revenue)}`}
                  >
                    {barH > 30 && (
                      <span className="text-[10px] font-semibold text-[var(--foreground)] mb-1 whitespace-nowrap">
                        S/{formatCurrency(day.revenue)}
                      </span>
                    )}
                    <div
                      className={`w-full rounded-t-sm transition-all duration-500 ${
                        isToday
                          ? "bg-[var(--hover)]"
                          : day.revenue > 0
                            ? "bg-[var(--hover)]/40"
                            : "bg-[var(--hover)]/10"
                      }`}
                      style={{ height: `${barH}%`, minHeight: day.revenue > 0 ? 4 : 1 }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* X-axis labels */}
          <div className="flex gap-2 px-1 mt-1.5">
            {data.map((day) => (
              <span
                key={day.date}
                className="flex-1 text-center text-[10px] text-[var(--text-muted)]"
              >
                {getDayName(day.date)}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-5 text-sm text-[var(--text-muted)]">
          Sin datos de ventas en los últimos 7 días.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Row 2 Right: Top products
// ---------------------------------------------------------------------------

function TopProductsWidget({ data }: { data: TopProduct[] }) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
        Este mes
      </p>
      <h2 className="mt-1 text-xl font-bold tracking-tight text-[var(--foreground)]">
        Más vendidos
      </h2>

      {data.length > 0 ? (
        <div className="mt-5 space-y-2">
          {data.map((product, idx) => {
            const maxQty = data[0]?.total_vendido ?? 1;
            const pct = maxQty > 0 ? (product.total_vendido / maxQty) * 100 : 0;
            return (
              <div
                key={`${product.descripcion}-${idx}`}
                className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--hover)]/10 text-xs font-bold text-[var(--hover)] shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--foreground)]">
                    {product.descripcion}
                  </p>
                  <div className="mt-1 h-1.5 rounded-full bg-[var(--border)]/20 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--hover)]/40 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-[var(--foreground)]">
                    S/{formatCurrency(product.total_revenue)}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {product.total_vendido} vendido{product.total_vendido !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 flex flex-col items-center gap-3 py-8">
          <ShoppingCart size={32} className="text-[var(--text-muted)]" />
          <p className="text-sm text-[var(--text-muted)]">Sin ventas de productos este mes.</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Row 3 Left: Low stock alerts
// ---------------------------------------------------------------------------

function LowStockWidget({ data }: { data: LowStockProduct[] }) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Inventario
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-[var(--foreground)]">
            Stock bajo
          </h2>
        </div>
        {data.length > 0 && (
          <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-500">
            {data.length}
          </span>
        )}
      </div>

      {data.length > 0 ? (
        <div className="mt-5 space-y-3 max-h-[360px] overflow-y-auto pr-1">
          {data.map((product) => {
            const stockRatio =
              product.stock_minimo > 0
                ? (product.stock_actual / product.stock_minimo) * 100
                : 0;
            const isCritical = product.stock_actual === 0;

            return (
              <a
                key={product.id}
                href="/admin/inventario"
                className="block rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 transition hover:border-[var(--hover)]/40"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {isCritical ? (
                      <AlertTriangle size={16} className="text-red-500 shrink-0" />
                    ) : (
                      <Package size={16} className="text-amber-500 shrink-0" />
                    )}
                    <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                      {product.nombre}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold shrink-0 ml-2 ${
                      isCritical ? "text-red-500" : "text-amber-500"
                    }`}
                  >
                    {product.stock_actual} / {product.stock_minimo}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[var(--border)]/20 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCritical
                        ? "bg-red-500"
                        : stockRatio < 50
                          ? "bg-amber-500"
                          : "bg-amber-400"
                    }`}
                    style={{ width: `${Math.min(stockRatio, 100)}%` }}
                  />
                </div>
              </a>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 flex flex-col items-center gap-3 py-8">
          <CheckCircle2 size={32} className="text-emerald-500" />
          <p className="text-sm text-[var(--text-muted)]">Todo el inventario está abastecido.</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Row 3 Right: Today's appointments
// ---------------------------------------------------------------------------

type VistaCitas = "hoy" | "semana";

function AppointmentsWidget({
  citasHoy,
  pendientesHoy,
  citasCompletadasHoy,
  citasSemana,
  pendientesSemana,
  citasCompletadasSemana,
  proximasCitas,
}: {
  citasHoy: number;
  pendientesHoy: number;
  citasCompletadasHoy: number;
  citasSemana: number;
  pendientesSemana: number;
  citasCompletadasSemana: number;
  proximasCitas: CitaItem[];
}) {
  const [vista, setVista] = useState<VistaCitas>("hoy");

  const total = vista === "hoy" ? citasHoy : citasSemana;
  const pendientes = vista === "hoy" ? pendientesHoy : pendientesSemana;
  const completadas = vista === "hoy" ? citasCompletadasHoy : citasCompletadasSemana;
  const pendientesPct = total > 0 ? (pendientes / total) * 100 : 0;
  const completadasPct = total > 0 ? (completadas / total) * 100 : 0;

  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Citas
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-[var(--foreground)]">
            {vista === "hoy" ? "Hoy" : "Esta semana"}
          </h2>
        </div>

        <div className="flex rounded-2xl border border-[var(--border)] bg-[var(--background)] p-1 gap-1">
          {(["hoy", "semana"] as VistaCitas[]).map((v) => (
            <button
              key={v}
              onClick={() => setVista(v)}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                vista === v
                  ? "bg-[var(--hover)] text-[var(--foreground)]"
                  : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {v === "hoy" ? "Hoy" : "Semana"}
            </button>
          ))}
        </div>
      </div>

      {/* Stacked progress bar */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[var(--foreground)]">{total} citas</span>
          <a
            href="/admin/agenda"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--foreground)] transition"
          >
            Ver todas
            <ChevronRight size={14} />
          </a>
        </div>

        <div className="h-3 rounded-full bg-[var(--background)] overflow-hidden flex">
          {completadasPct > 0 && (
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${completadasPct}%` }}
            />
          )}
          {pendientesPct > 0 && (
            <div
              className="h-full bg-amber-500 transition-all duration-500"
              style={{ width: `${pendientesPct}%` }}
            />
          )}
        </div>

        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span className="text-xs text-[var(--text-muted)]">
              {completadas} completadas
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
            <span className="text-xs text-[var(--text-muted)]">
              {pendientes} pendientes
            </span>
          </div>
        </div>
      </div>

      {/* Next appointments (only for "hoy" view) */}
      {vista === "hoy" && proximasCitas.length > 0 && (
        <div className="mt-5 pt-5 border-t border-[var(--border)]">
          <p className="text-xs font-semibold text-[var(--text-muted)] mb-3">
            Próximas
          </p>
          <div className="space-y-2">
            {proximasCitas.slice(0, 5).map((cita, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl bg-[var(--background)] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[var(--foreground)] tabular-nums">
                    {cita.hora_inicio?.slice(0, 5)}
                  </span>
                  {cita.cliente_nombre && (
                    <span className="text-xs text-[var(--text-muted)] truncate max-w-[140px]">
                      {cita.cliente_nombre}
                    </span>
                  )}
                </div>
                <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-600">
                  Pendiente
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {vista === "hoy" && proximasCitas.length === 0 && total === 0 && (
        <p className="mt-5 text-sm text-[var(--text-muted)]">
          No hay citas para hoy.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function DashboardWidgets({
  monthlySales,
  revenueTrend,
  lowStockProducts,
  topProducts,
  citasHoy,
  pendientesHoy,
  citasCompletadasHoy,
  citasSemana,
  pendientesSemana,
  citasCompletadasSemana,
  proximasCitas,
}: Props) {
  return (
    <section className="space-y-6">
      {/* Row 1: Monthly Sales (full width) */}
      <MonthlySalesDashboard data={monthlySales} />

      {/* Row 2: Revenue Trend + Top Products */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueTrendWidget data={revenueTrend} />
        <TopProductsWidget data={topProducts} />
      </div>

      {/* Row 3: Low Stock + Appointments */}
      <div className="grid gap-6 lg:grid-cols-2">
        <LowStockWidget data={lowStockProducts} />
        <AppointmentsWidget
          citasHoy={citasHoy}
          pendientesHoy={pendientesHoy}
          citasCompletadasHoy={citasCompletadasHoy}
          citasSemana={citasSemana}
          pendientesSemana={pendientesSemana}
          citasCompletadasSemana={citasCompletadasSemana}
          proximasCitas={proximasCitas}
        />
      </div>
    </section>
  );
}
