import Link from "next/link";
import {
  CalendarCheck,
  UserPlus,
  AlertTriangle,
  TrendingUp,
  Clock,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";
import { CajaToggle } from "@/components/dashboard/caja-toggle";

export default async function AdminHomePage() {
  const supabase = await createServerSupabase();

  const today = new Date().toISOString().split("T")[0];

  const { count: citasHoy } = await supabase
    .from("reservas")
    .select("*", { count: "exact", head: true })
    .eq("fecha_reserva", today);

  const { count: clientesRegistrados } = await supabase
    .from("clientes")
    .select("*", { count: "exact", head: true });

  const { data: productos } = await supabase
    .from("productos")
    .select("stock_actual, stock_minimo");

  const productosPorTerminarse =
    productos?.filter((p) => p.stock_actual <= p.stock_minimo).length ?? 0;

  const { data: reservasCompletadas } = await supabase
    .from("reservas")
    .select("servicio_id")
    .eq("fecha_reserva", today)
    .eq("estado", "Completada");

  const servicioIds = [...new Set(reservasCompletadas?.map((r) => r.servicio_id) ?? [])];

  let gananciaDelDia = 0;
  if (servicioIds.length > 0) {
    const { data: servicios } = await supabase
      .from("servicios")
      .select("precio")
      .in("id", servicioIds);

    const precioMap = new Map(
      servicios?.map((s, i) => [servicioIds[i], Number(s.precio)]) ?? []
    );

    gananciaDelDia = reservasCompletadas?.reduce(
      (sum, r) => sum + (precioMap.get(r.servicio_id) ?? 0),
      0
    ) ?? 0;
  }

  const { data: proximasCitas } = await supabase
    .from("reservas")
    .select("hora_inicio, cliente_id")
    .eq("fecha_reserva", today)
    .neq("estado", "Completada")
    .order("hora_inicio", { ascending: true })
    .limit(5);

  const { count: pendientes } = await supabase
    .from("reservas")
    .select("*", { count: "exact", head: true })
    .eq("fecha_reserva", today)
    .eq("estado", "Pendiente");

  const kpis = [
    { label: "Ganancia del d\u00eda", value: `S/${gananciaDelDia.toFixed(2)}`, icon: DollarSign },
    { label: "Citas hoy", value: String(citasHoy ?? 0), icon: CalendarCheck },
    { label: "Pendientes por atender", value: String(pendientes ?? 0), icon: Clock },
    { label: "Productos por terminarse", value: String(productosPorTerminarse), icon: AlertTriangle },
  ];

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-[var(--text-muted)]">Bienvenido de nuevo</p>
            <h1 className="mt-1 text-3xl font-bold text-[var(--foreground)]">Resumen del negocio</h1>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Esto es lo que importa hoy.
            </p>
          </div>
          <div className="shrink-0 w-64">
            <CajaToggle />
          </div>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;

          return (
            <article
              key={kpi.label}
              className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              style={{
                background: "var(--background-secondary)",
              }}
            >
              <div
                className="rounded-xl p-3"
                style={{
                  background: "color-mix(in srgb, var(--hover) 12%, var(--background-secondary))",
                }}
              >
                <Icon size={20} style={{ color: "var(--hover)" }} />
              </div>

              <div>
                <p className="text-sm text-[var(--text-muted)]">{kpi.label}</p>
                <p className="text-2xl font-bold text-[var(--foreground)]">{kpi.value}</p>
              </div>
            </article>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Pr&oacute;ximas citas
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-[var(--foreground)]">Hoy</h2>
            </div>
            <Link
              href="/admin/agenda"
              className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--foreground)] transition hover:gap-2"
            >
              Ver todas
              <ArrowRight size={16} />
            </Link>
          </div>

          {proximasCitas && proximasCitas.length > 0 ? (
            <ul className="mt-5 divide-y divide-transparent/5">
              {proximasCitas.map((cita, i) => (
                <li key={i} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--background)] text-xs font-bold text-[var(--text-muted)]">
                      {cita.hora_inicio?.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)]">
                        {cita.hora_inicio?.slice(0, 5)}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[var(--background)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Pendiente
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 text-sm text-[var(--text-muted)]">
              No hay citas pendientes para hoy.
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Clientes
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-[var(--foreground)]">
                {clientesRegistrados ?? 0} registrados
              </h2>
            </div>
            <Link
              href="/admin/clientes"
              className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--foreground)] transition hover:gap-2"
            >
              Ver todos
              <ArrowRight size={16} />
            </Link>
          </div>
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            {productosPorTerminarse > 0
              ? `${productosPorTerminarse} producto${
                  productosPorTerminarse === 1 ? "" : "s"
                } por reponer.`
              : "Inventario al d\u00eda."}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {[
              { label: "Agenda", href: "/admin/agenda" },
              { label: "Productos", href: "/admin/inventario" },
              { label: "Ventas", href: "/admin/ventas" },
              { label: "Empleados", href: "/admin/empleados" },
              { label: "Clientes", href: "/admin/clientes" },
              { label: "Fidelización", href: "/admin/fidelizacion" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl border border-[var(--border)] px-4 py-3 text-center text-sm font-semibold text-[var(--text-muted)] transition hover:border-[var(--hover)] hover:text-[var(--foreground)]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
