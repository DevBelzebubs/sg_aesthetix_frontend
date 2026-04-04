import Link from "next/link";

const kpis = [
  { label: "Locales activos", value: "12", tone: "from-zinc-900 to-zinc-700" },
  { label: "Citas para hoy", value: "48", tone: "from-emerald-700 to-emerald-500" },
  { label: "Clientes registrados", value: "1,284", tone: "from-blue-700 to-blue-500" },
  { label: "Productos por reponer", value: "7", tone: "from-amber-700 to-amber-500" },
];

const modules = [
  {
    title: "Agenda",
    desc: "Mira las citas del día, confirma horarios y reprograma si hace falta.",
    href: "/admin/agenda",
  },
  {
    title: "Empleados",
    desc: "Administra el equipo, sus horarios y su carga de trabajo.",
    href: "/admin/empleados",
  },
  {
    title: "Clientes",
    desc: "Encuentra clientes rápido y revisa su historial de visitas.",
    href: "/admin/clientes",
  },
  {
    title: "Servicios",
    desc: "Edita precios, duración y visibilidad de cada servicio.",
    href: "/admin/servicios",
  },
  {
    title: "Fidelización",
    desc: "Controla puntos, canjes y beneficios para clientes frecuentes.",
    href: "/admin/fidelizacion",
  },
  {
    title: "Inventario",
    desc: "Revisa stock y detecta productos que debes reponer.",
    href: "/admin/inventario",
  },
];

export default function AdminHomePage() {
  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Panel principal
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Resumen del negocio</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Todo lo importante en una sola vista para tomar decisiones rápido.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <article
            key={kpi.label}
            className={`rounded-2xl bg-gradient-to-br ${kpi.tone} p-5 text-white shadow-lg`}
          >
            <p className="text-sm text-white/85">{kpi.label}</p>
            <p className="mt-3 text-4xl font-bold tracking-tight">{kpi.value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {modules.map((module) => (
          <article
            key={module.title}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <h2 className="text-xl font-semibold tracking-tight">{module.title}</h2>
            <p className="mt-2 text-sm text-zinc-600">{module.desc}</p>
            <Link
              href={module.href}
              className="mt-4 inline-flex rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Entrar
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
