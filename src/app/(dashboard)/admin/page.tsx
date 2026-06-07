import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
import { CajaToggle } from "@/components/dashboard/caja-toggle";
import { DashboardWidgets } from "@/components/dashboard/dashboard-widgets";

export default async function AdminHomePage() {
  const supabase = await createServerSupabase();

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

  const firstOfMonth = `${todayStr.slice(0, 7)}-01`;

  // Start of last month
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthStartStr = lastMonthStart.toISOString().split("T")[0];

  // Monday of current week
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const mondayStr = monday.toISOString().split("T")[0];

  // ------------------------------------------------------------------
  // Monthly sales data
  // ------------------------------------------------------------------

  const { data: ventasMes } = await supabase
    .from("ventas")
    .select("total, creado_en")
    .gte("creado_en", firstOfMonth)
    .eq("estado", "pagada")
    .order("creado_en");

  // Build daily points for the current month (from 1st to today)
  const startDay = new Date(firstOfMonth + "T00:00:00");
  const daysInMonth: string[] = [];
  const cursor = new Date(startDay);
  while (cursor <= today) {
    daysInMonth.push(cursor.toISOString().split("T")[0]);
    cursor.setDate(cursor.getDate() + 1);
  }

  const monthlyMap = new Map<string, { revenue: number; count: number }>();
  for (const d of daysInMonth) {
    monthlyMap.set(d, { revenue: 0, count: 0 });
  }
  for (const v of (ventasMes ?? []) as { total: number; creado_en: string }[]) {
    const dateStr = v.creado_en.slice(0, 10);
    const entry = monthlyMap.get(dateStr);
    if (entry) {
      entry.revenue += Number(v.total);
      entry.count += 1;
    }
  }

  const dailyPoints = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({ date, revenue: d.revenue, count: d.count }));

  const totalRevenueMonth = dailyPoints.reduce((s, p) => s + p.revenue, 0);
  const totalCountMonth = dailyPoints.reduce((s, p) => s + p.count, 0);

  // Last month totals for comparison
  const { data: ventasMesPasado } = await supabase
    .from("ventas")
    .select("total")
    .gte("creado_en", lastMonthStartStr)
    .lt("creado_en", firstOfMonth)
    .eq("estado", "pagada");

  const lastMonthRevenue = (ventasMesPasado ?? []).reduce(
    (sum, v) => sum + Number((v as { total: number }).total),
    0,
  );
  const lastMonthCount = (ventasMesPasado ?? []).length;

  // ------------------------------------------------------------------
  // Revenue trend (last 7 days)
  // ------------------------------------------------------------------

  const { data: ventasSemana } = await supabase
    .from("ventas")
    .select("total, creado_en")
    .gte("creado_en", sevenDaysAgoStr)
    .eq("estado", "pagada")
    .order("creado_en");

  const trendMap = new Map<string, { revenue: number; count: number }>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    trendMap.set(dateStr, { revenue: 0, count: 0 });
  }

  for (const v of (ventasSemana ?? []) as { total: number; creado_en: string }[]) {
    const dateStr = v.creado_en.slice(0, 10);
    const existing = trendMap.get(dateStr);
    if (existing) {
      existing.revenue += Number(v.total);
      existing.count += 1;
    }
  }

  const revenueTrend = Array.from(trendMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, revenue: data.revenue, count: data.count }));

  // ------------------------------------------------------------------
  // Low stock products
  // ------------------------------------------------------------------

  const { data: allProducts } = await supabase
    .from("productos")
    .select("id, nombre, stock_actual, stock_minimo")
    .eq("esta_activo", true)
    .order("stock_actual", { ascending: true });

  const lowStock = ((allProducts ?? []) as {
    id: string;
    nombre: string;
    stock_actual: number;
    stock_minimo: number;
  }[])
    .filter((p) => p.stock_actual <= p.stock_minimo)
    .sort((a, b) => {
      const ratioA = a.stock_minimo > 0 ? a.stock_actual / a.stock_minimo : 0;
      const ratioB = b.stock_minimo > 0 ? b.stock_actual / b.stock_minimo : 0;
      return ratioA - ratioB;
    });

  // ------------------------------------------------------------------
  // Top products (this month)
  // ------------------------------------------------------------------

  const { data: ventasDelMes } = await supabase
    .from("ventas")
    .select("id")
    .gte("creado_en", firstOfMonth)
    .eq("estado", "pagada");

  const ventaIdsDelMes = (ventasDelMes ?? []).map((v) => (v as { id: string }).id);

  let topProducts: { descripcion: string; total_vendido: number; total_revenue: number }[] = [];

  if (ventaIdsDelMes.length > 0) {
    const { data: detailsData } = await supabase
      .from("venta_detalle")
      .select("descripcion, cantidad, subtotal")
      .eq("tipo_item", "producto")
      .in("venta_id", ventaIdsDelMes);

    const productMap = new Map<string, { total_vendido: number; total_revenue: number }>();
    for (const item of (detailsData ?? []) as {
      descripcion: string;
      cantidad: number;
      subtotal: number;
    }[]) {
      const key = item.descripcion;
      const existing = productMap.get(key) ?? { total_vendido: 0, total_revenue: 0 };
      existing.total_vendido += Number(item.cantidad);
      existing.total_revenue += Number(item.subtotal);
      productMap.set(key, existing);
    }

    topProducts = Array.from(productMap.entries())
      .map(([descripcion, data]) => ({ descripcion, ...data }))
      .sort((a, b) => b.total_vendido - a.total_vendido)
      .slice(0, 5);
  }

  // ------------------------------------------------------------------
  // Appointments (today + week)
  // ------------------------------------------------------------------

  // Today
  const { count: citasHoy } = await supabase
    .from("reservas")
    .select("*", { count: "exact", head: true })
    .eq("fecha_reserva", todayStr);

  const { count: pendientesHoy } = await supabase
    .from("reservas")
    .select("*", { count: "exact", head: true })
    .eq("fecha_reserva", todayStr)
    .eq("estado", "Pendiente");

  const { count: citasCompletadasHoy } = await supabase
    .from("reservas")
    .select("*", { count: "exact", head: true })
    .eq("fecha_reserva", todayStr)
    .eq("estado", "Completada");

  const { data: proximasCitasRaw } = await supabase
    .from("reservas")
    .select("hora_inicio, clientes(nombres, apellidos)")
    .eq("fecha_reserva", todayStr)
    .neq("estado", "Completada")
    .order("hora_inicio", { ascending: true })
    .limit(5);

  const proximasCitas = ((proximasCitasRaw ?? []) as unknown[]).map((r: unknown) => {
    const row = r as { hora_inicio: string; clientes?: unknown };
    const clientesData = row.clientes as { nombres: string; apellidos: string }[] | { nombres: string; apellidos: string } | null | undefined;
    let clienteNombre: string | undefined;
    if (clientesData) {
      const cl = Array.isArray(clientesData) ? clientesData[0] : clientesData;
      if (cl) clienteNombre = `${cl.nombres} ${cl.apellidos}`;
    }
    return { hora_inicio: row.hora_inicio, cliente_nombre: clienteNombre };
  });

  // Week (Monday to today)
  const { count: citasSemana } = await supabase
    .from("reservas")
    .select("*", { count: "exact", head: true })
    .gte("fecha_reserva", mondayStr)
    .lte("fecha_reserva", todayStr);

  const { count: pendientesSemana } = await supabase
    .from("reservas")
    .select("*", { count: "exact", head: true })
    .gte("fecha_reserva", mondayStr)
    .lte("fecha_reserva", todayStr)
    .eq("estado", "Pendiente");

  const { count: citasCompletadasSemana } = await supabase
    .from("reservas")
    .select("*", { count: "exact", head: true })
    .gte("fecha_reserva", mondayStr)
    .lte("fecha_reserva", todayStr)
    .eq("estado", "Completada");

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-[var(--text-muted)]">Bienvenido de nuevo</p>
            <h1 className="mt-1 text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
              Resumen del negocio
            </h1>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Esto es lo que importa hoy.
            </p>
          </div>
          <div className="w-full sm:w-64 sm:shrink-0">
            <CajaToggle />
          </div>
        </div>
      </header>

      <DashboardWidgets
        monthlySales={{
          dailyPoints,
          totalRevenue: totalRevenueMonth,
          totalCount: totalCountMonth,
          avgTicket: totalCountMonth > 0 ? totalRevenueMonth / totalCountMonth : 0,
          lastMonthRevenue,
          lastMonthCount,
        }}
        revenueTrend={revenueTrend}
        lowStockProducts={lowStock}
        topProducts={topProducts}
        citasHoy={citasHoy ?? 0}
        pendientesHoy={pendientesHoy ?? 0}
        citasCompletadasHoy={citasCompletadasHoy ?? 0}
        citasSemana={citasSemana ?? 0}
        pendientesSemana={pendientesSemana ?? 0}
        citasCompletadasSemana={citasCompletadasSemana ?? 0}
        proximasCitas={proximasCitas}
      />
    </section>
  );
}
