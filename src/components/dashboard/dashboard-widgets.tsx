"use client";

import { useState, useMemo } from "react";
import {
  ShoppingCart, TrendingUp, TrendingDown, CreditCard,
  Banknote, Smartphone, AlertTriangle, Package,
  CheckCircle2, ChevronRight,
} from "lucide-react";

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
  citasHoy: number;
  pendientesHoy: number;
  citasCompletadasHoy: number;
  citasSemana: number;
  pendientesSemana: number;
  citasCompletadasSemana: number;
  proximasCitas: CitaItem[];
};

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

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getDate()} ${getMonthName(d.getMonth())}`;
}

type Periodo = "mes" | "semana" | "dia";

function niceTicks(max: number, count: number = 5): number[] {
  const rawStep = max / count;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;
  let niceStep: number;
  if (normalized <= 1.5) niceStep = 1 * magnitude;
  else if (normalized <= 3.5) niceStep = 2 * magnitude;
  else if (normalized <= 7.5) niceStep = 5 * magnitude;
  else niceStep = 10 * magnitude;
  const maxNice = Math.ceil(max / niceStep) * niceStep;
  const ticks: number[] = [];
  for (let i = 0; i <= Math.round(maxNice / niceStep); i++) {
    ticks.push(i * niceStep);
  }
  return ticks;
}

function Chart({ data, maxValue, today, periodo }: {
  data: DailyPoint[];
  maxValue: number;
  today: string;
  periodo: Periodo;
}) {
  const [tooltip, setTooltip] = useState<{ date: string; revenue: number; count: number; x: number; y: number } | null>(null);

  if (data.length === 0 || maxValue <= 0) return null;

  const paddedMax = maxValue * 1.2;
  const ticks = niceTicks(paddedMax, 5);
  const chartMax = ticks[ticks.length - 1];
  const hasData = data.some((d) => d.revenue > 0);
  const dataCount = data.filter((d) => d.revenue > 0).length;
  const sparseData = dataCount <= 3;

  const showLabel = (index: number): boolean => {
    if (data.length <= 15) return true;
    if (periodo === "mes") return index % 5 === 0 || data[index].revenue > 0;
    return index % 2 === 0 || data[index].revenue > 0;
  };

  return (
    <div className="relative" style={{ minHeight: 300 }}>
      {sparseData && (
        <p className="absolute -top-1 right-0 text-[11px] font-medium text-[var(--text-muted)]/60 z-20">
          {dataCount === 0 ? "Sin datos este período" : `Pocos datos este mes`}
        </p>
      )}

      <div className="absolute inset-0 flex flex-col-reverse justify-between pointer-events-none select-none pb-7">
        {ticks.map((tick) => (
          <div key={tick} className="flex items-center gap-2 w-full">
            <span className="text-[10px] font-medium text-[var(--text-muted)] tabular-nums w-10 text-right shrink-0">
              S/{Math.round(tick)}
            </span>
            <div className="flex-1 border-t border-[var(--border)]/15" />
          </div>
        ))}
      </div>

      <div className="relative ml-12">
        <div className="flex items-end gap-[3px]" style={{ height: 300 }}>
          {data.map((point, idx) => {
            const pct = chartMax > 0 ? (point.revenue / chartMax) * 100 : 0;
            const barH = Math.max(pct, point.revenue > 0 ? 3 : 0);
            const isToday = point.date === today;
            const hasRevenue = point.revenue > 0;

            return (
              <div
                key={point.date}
                className="flex-1 flex flex-col items-center justify-end min-w-0 relative h-full"
              >
                {hasRevenue && (
                  <div
                    className="absolute z-10 rounded-full bg-white border-2 border-[var(--hover)] transition-all duration-200 cursor-pointer hover:scale-150"
                    style={{
                      width: sparseData ? 14 : 10,
                      height: sparseData ? 14 : 10,
                      bottom: `calc(${barH}% + 2px)`,
                      boxShadow: sparseData
                        ? "0 0 0 4px color-mix(in srgb, var(--hover) 25%, transparent), 0 0 12px color-mix(in srgb, var(--hover) 40%, transparent)"
                        : "0 0 0 2px color-mix(in srgb, var(--hover) 20%, transparent)",
                    }}
                    onMouseEnter={(e) => {
                      const rect = (e.target as HTMLElement).getBoundingClientRect();
                      setTooltip({
                        date: point.date,
                        revenue: point.revenue,
                        count: point.count,
                        x: rect.left + rect.width / 2,
                        y: rect.top - 8,
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                )}
                <div
                  className={`w-full transition-all duration-500 ${
                    isToday
                      ? "bg-[var(--hover)]"
                      : hasRevenue
                        ? "bg-[var(--hover)]/45"
                        : "bg-[var(--hover)]/6"
                  }`}
                  style={{
                    height: `${barH}%`,
                    minHeight: hasRevenue ? 4 : 1,
                    borderTopLeftRadius: 2,
                    borderTopRightRadius: 2,
                  }}
                />
              </div>
            );
          })}
        </div>

        <div className="flex gap-[3px] mt-2 min-h-[18px]">
          {data.map((point, idx) => (
            <span
              key={point.date}
              className={`flex-1 text-center text-[9px] font-medium min-w-0 truncate ${
                showLabel(idx) ? "text-[var(--text-muted)]" : "text-transparent"
              }`}
            >
              {periodo === "mes"
                ? point.date.slice(8)
                : getDayName(point.date)}
            </span>
          ))}
        </div>
      </div>

      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] px-3 py-2 shadow-xl"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          <p className="text-xs font-semibold text-[var(--foreground)] whitespace-nowrap">
            {formatShortDate(tooltip.date)} {tooltip.date === today ? "(Hoy)" : `(${getDayName(tooltip.date)})`}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Ingreso: <span className="font-bold text-[var(--foreground)]">S/{formatCurrency(tooltip.revenue)}</span>
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Ventas: <span className="font-bold text-[var(--foreground)]">{tooltip.count}</span>
          </p>
        </div>
      )}
    </div>
  );
}

function MonthlySalesDashboard({ data }: { data: MonthlySalesData }) {
  const [periodo, setPeriodo] = useState<Periodo>("mes");

  const today = todayStr();

  const filteredPoints = useMemo(() => {
    if (periodo === "dia") {
      return data.dailyPoints.filter((p) => p.date === today);
    }
    if (periodo === "semana") {
      return data.dailyPoints.slice(-7);
    }
    return data.dailyPoints;
  }, [periodo, data.dailyPoints]);

  const periodRevenue = filteredPoints.reduce((s, p) => s + p.revenue, 0);
  const periodCount = filteredPoints.reduce((s, p) => s + p.count, 0);

  let prevRevenue = 0;
  let prevCount = 0;
  if (periodo === "mes") {
    prevRevenue = data.lastMonthRevenue;
    prevCount = data.lastMonthCount;
  } else if (periodo === "semana") {
    const prevPoints = data.dailyPoints.slice(-14, -7);
    prevRevenue = prevPoints.reduce((s, p) => s + p.revenue, 0);
    prevCount = prevPoints.reduce((s, p) => s + p.count, 0);
  } else {
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
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 sm:p-7 shadow-sm overflow-hidden">
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--foreground)]/60">
            Ventas
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-[var(--foreground)]">
            {periodLabel}
          </h2>
        </div>

        <div className="flex rounded-2xl border border-[var(--border)] bg-[var(--background)] p-1 gap-1 w-full sm:w-auto">
          {(["mes", "semana", "dia"] as Periodo[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`flex-1 sm:flex-none rounded-xl px-4 py-2 text-sm font-semibold transition ${
                periodo === p
                  ? "bg-[var(--hover)] text-white shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {p === "mes" ? "Mes" : p === "semana" ? "Semana" : "Día"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div className="rounded-2xl bg-[var(--background)] px-5 py-6">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Ingresos</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-2xl font-bold text-[var(--foreground)]">
              S/{formatCurrency(periodRevenue)}
            </p>
            {prevRevenue > 0 && (
              <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md ${
                revenueChange >= 0 ? "text-emerald-500 bg-emerald-500/10" : "text-red-500 bg-red-500/10"
              }`}>
                {revenueChange >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {revenueChange >= 0 ? "+" : ""}{revenueChange.toFixed(0)}%
              </span>
            )}
          </div>
        </div>
        <div className="rounded-2xl bg-[var(--background)] px-5 py-6">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Ventas</p>
          <p className="mt-2 text-2xl font-bold text-[var(--foreground)]">{periodCount}</p>
        </div>
        <div className="rounded-2xl bg-[var(--background)] px-5 py-6">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Ticket promedio</p>
          <p className="mt-2 text-2xl font-bold text-[var(--foreground)]">
            S/{formatCurrency(periodCount > 0 ? periodRevenue / periodCount : 0)}
          </p>
        </div>
      </div>

      {filteredPoints.length > 0 ? (
        <div className="overflow-x-auto -mx-5 px-5 sm:-mx-0 sm:px-0">
          {periodo === "dia" ? (
            <div className="flex items-end gap-4 py-6">
              <div className="flex-1 h-32 rounded-2xl bg-[var(--background)] flex items-center justify-center relative overflow-hidden border border-[var(--border)]/10">
                <div
                  className="absolute bottom-0 left-0 right-0 bg-[var(--hover)]/20 transition-all duration-700"
                  style={{ height: "100%" }}
                />
                <span className="relative text-3xl font-bold text-[var(--foreground)]">
                  S/{formatCurrency(periodRevenue)}
                </span>
              </div>
            </div>
          ) : (
            <Chart
              data={filteredPoints}
              maxValue={maxBar}
              today={today}
              periodo={periodo}
            />
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

function RevenueTrendWidget({ data }: { data: DailyPoint[] }) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const today = todayStr();

  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 sm:p-7 shadow-sm overflow-hidden">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--foreground)]/60">
        Últimos 7 días
      </p>
      <h2 className="mt-1 text-lg sm:text-xl font-bold tracking-tight text-[var(--foreground)]">
        Tendencia de ingresos
      </h2>

      {data.length > 0 && maxRevenue > 0 ? (
        <div className="mt-5 overflow-x-auto -mx-5 px-5 sm:-mx-0 sm:px-0">
          <Chart
            data={data}
            maxValue={maxRevenue}
            today={today}
            periodo="semana"
          />
        </div>
      ) : (
        <p className="mt-5 text-sm text-[var(--text-muted)]">
          Sin datos de ventas en los últimos 7 días.
        </p>
      )}
    </div>
  );
}

function TopProductsWidget({ data }: { data: TopProduct[] }) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 sm:p-7 shadow-sm overflow-hidden">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--foreground)]/60">
        Este mes
      </p>
      <h2 className="mt-1 text-lg sm:text-xl font-bold tracking-tight text-[var(--foreground)]">
        Más vendidos
      </h2>

      {data.length > 0 ? (
        <div className="mt-5 space-y-3">
          {data.map((product, idx) => {
            const maxQty = data[0]?.total_vendido ?? 1;
            const pct = maxQty > 0 ? (product.total_vendido / maxQty) * 100 : 0;
            return (
              <div
                key={`${product.descripcion}-${idx}`}
                className="flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 sm:flex-row sm:items-center sm:gap-3 hover:border-[var(--hover)]/30 transition"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--hover)]/15 text-xs font-bold text-[var(--hover)] shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--foreground)] break-words">
                    {product.descripcion}
                  </p>
                  <div className="mt-1.5 h-2 rounded-full bg-[var(--border)]/20 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--hover)]/50 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <p className="text-sm font-bold text-[var(--foreground)]">
                    S/{formatCurrency(product.total_revenue)}
                  </p>
                  <p className="text-xs font-medium text-[var(--text-muted)]">
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

function LowStockWidget({ data }: { data: LowStockProduct[] }) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 sm:p-7 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--foreground)]/60">
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
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 sm:p-7 shadow-sm overflow-hidden">
      <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--foreground)]/60">
            Citas
          </p>
          <h2 className="mt-1 text-lg sm:text-xl font-bold tracking-tight text-[var(--foreground)]">
            {vista === "hoy" ? "Hoy" : "Esta semana"}
          </h2>
        </div>

        <div className="flex rounded-2xl border border-[var(--border)] bg-[var(--background)] p-1 gap-1 w-full sm:w-auto">
          {(["hoy", "semana"] as VistaCitas[]).map((v) => (
            <button
              key={v}
              onClick={() => setVista(v)}
              className={`flex-1 sm:flex-none rounded-xl px-4 py-2 text-xs font-semibold transition ${
                vista === v
                  ? "bg-[var(--hover)] text-white shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {v === "hoy" ? "Hoy" : "Semana"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-[var(--foreground)]">{total} citas</span>
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
            <span className="text-xs font-medium text-[var(--text-muted)]">
              {completadas} completadas
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
            <span className="text-xs font-medium text-[var(--text-muted)]">
              {pendientes} pendientes
            </span>
          </div>
        </div>
      </div>

      {vista === "hoy" && proximasCitas.length > 0 && (
        <div className="mt-5 pt-5 border-t border-[var(--border)]">
          <p className="text-xs font-semibold text-[var(--text-muted)] mb-3">
            Próximas
          </p>
          <div className="space-y-2">
            {proximasCitas.slice(0, 5).map((cita, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl bg-[var(--background)] px-4 py-3 hover:bg-[var(--background)]/80 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[var(--foreground)] tabular-nums">
                    {cita.hora_inicio?.slice(0, 5)}
                  </span>
                  {cita.cliente_nombre && (
                    <span className="text-xs font-medium text-[var(--text-muted)] truncate max-w-[140px]">
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
      <MonthlySalesDashboard data={monthlySales} />

      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueTrendWidget data={revenueTrend} />
        <TopProductsWidget data={topProducts} />
      </div>

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
