import Link from "next/link";

const kpis = [
  { label: "Tenants activos", value: "12", rf: "RF-01 · RF-02 · RF-03" },
  { label: "Reservas hoy", value: "48", rf: "RF-24 · RF-25 · RF-26" },
  { label: "Clientes totales", value: "1,284", rf: "RF-32 · RF-33 · RF-36" },
  { label: "Stock bajo", value: "7", rf: "RF-45 · RF-47" },
];

const modules = [
  {
    title: "Identidad y autenticación",
    desc: "Registro, login, refresh, roles y recuperación de contraseña por tenant.",
    href: "/admin/configuracion/empresa",
    rf: "RF-06 a RF-11",
  },
  {
    title: "Servicios",
    desc: "CRUD, asignación a empleados, activación y ordenamiento por categorías.",
    href: "/admin/servicios",
    rf: "RF-12 a RF-17",
  },
  {
    title: "Empleados",
    desc: "Gestión de perfiles, horarios, rendimiento, asistencia y comisiones.",
    href: "/admin/empleados",
    rf: "RF-18 a RF-23",
  },
  {
    title: "Reservas",
    desc: "Agenda diaria, estados de cita, reprogramación y validación de disponibilidad.",
    href: "/admin/agenda",
    rf: "RF-24 a RF-31",
  },
  {
    title: "Clientes & fidelización",
    desc: "Vista 360 del cliente, historial y reglas de puntos por tenant.",
    href: "/admin/fidelizacion",
    rf: "RF-32 a RF-41",
  },
  {
    title: "Inventario",
    desc: "Productos, categorías, movimientos, alertas y trazabilidad.",
    href: "/admin/inventario",
    rf: "RF-42 a RF-47",
  },
];

export default function AdminHomePage() {
  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Panel administrativo
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Resumen general</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Vista inicial del dashboard alineada a tus RF para multi-tenant.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <article key={kpi.label} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">{kpi.label}</p>
            <p className="mt-2 text-3xl font-bold">{kpi.value}</p>
            <p className="mt-2 text-xs font-semibold text-zinc-600">{kpi.rf}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {modules.map((module) => (
          <article key={module.title} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              {module.rf}
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">{module.title}</h2>
            <p className="mt-2 text-sm text-zinc-600">{module.desc}</p>
            <Link
              href={module.href}
              className="mt-4 inline-flex rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Abrir módulo
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
