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
      <header className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-zinc-500">Bienvenido de nuevo</p>
        <h1 className="mt-1 text-3xl font-bold text-zinc-900">Resumen del negocio</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Esto es lo que importa hoy.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;

          return (
            <article
              key={kpi.label}
              className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="rounded-xl bg-gradient-to-br from-sky-100 to-fuchsia-100 p-3">
                <Icon size={20} className="text-zinc-700" />
              </div>

              <div>
                <p className="text-sm text-zinc-500">{kpi.label}</p>
                <p className="text-2xl font-bold text-zinc-900">{kpi.value}</p>
              </div>
            </article>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Pr&oacute;ximas citas
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-zinc-900">Hoy</h2>
            </div>
            <Link
              href="/admin/agenda"
              className="inline-flex items-center gap-1 text-sm font-semibold text-zinc-900 transition hover:gap-2"
            >
              Ver todas
              <ArrowRight size={16} />
            </Link>
          </div>

          {proximasCitas && proximasCitas.length > 0 ? (
            <ul className="mt-5 divide-y divide-zinc-100">
              {proximasCitas.map((cita, i) => (
                <li key={i} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-600">
                      {cita.hora_inicio?.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">
                        {cita.hora_inicio?.slice(0, 5)}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-600">
                    Pendiente
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 text-sm text-zinc-400">
              No hay citas pendientes para hoy.
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Clientes
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-zinc-900">
                {clientesRegistrados ?? 0} registrados
              </h2>
            </div>
            <Link
              href="/admin/clientes"
              className="inline-flex items-center gap-1 text-sm font-semibold text-zinc-900 transition hover:gap-2"
            >
              Ver todos
              <ArrowRight size={16} />
            </Link>
          </div>
          <p className="mt-3 text-sm text-zinc-500">
            {productosPorTerminarse > 0
              ? `${productosPorTerminarse} producto${
                  productosPorTerminarse === 1 ? "" : "s"
                } por reponer.`
              : "Inventario al d\u00eda."}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {[
              { label: "Agenda", href: "/admin/agenda" },
              { label: "Inventario", href: "/admin/inventario" },
              { label: "Fidelizaci\u00f3n", href: "/admin/fidelizacion" },
              { label: "Galer\u00eda", href: "/admin/galeria" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl border border-zinc-200 px-4 py-3 text-center text-sm font-semibold text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
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
