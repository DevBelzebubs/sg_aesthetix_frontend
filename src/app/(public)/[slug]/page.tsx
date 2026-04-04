import Link from "next/link";

type LandingPageProps = {
  params: Promise<{ slug: string }>;
};

const services = [
  {
    name: "Corte clasico",
    duration: "45 min",
    price: "$18",
    description: "Limpieza de contornos, acabado con producto y asesoria de estilo.",
  },
  {
    name: "Corte + barba",
    duration: "60 min",
    price: "$25",
    description: "Corte completo con perfilado de barba y toalla caliente.",
  },
  {
    name: "Afeitado premium",
    duration: "30 min",
    price: "$15",
    description: "Afeitado tradicional con crema premium y locion final.",
  },
];

const team = [
  { name: "Alejandro", role: "Master Barber" },
  { name: "Matias", role: "Fade Specialist" },
  { name: "Sergio", role: "Beard Artist" },
];

const availableSlots = ["10:00", "11:30", "13:00", "15:30", "17:00", "18:30"];

const testimonials = [
  {
    name: "Carlos M.",
    quote: "La mejor barberia del barrio. Siempre salgo impecable.",
  },
  {
    name: "Andres P.",
    quote: "Reservar online me ahorra tiempo y el servicio es top.",
  },
  {
    name: "Julian R.",
    quote: "Excelente atencion, ambiente cuidado y puntualidad total.",
  },
];

export default async function LandingPage({ params }: LandingPageProps) {
  const { slug } = await params;

  return (
    <div className="space-y-20 pb-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-black/10 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--tenant-primary)_10%,white),white_45%,color-mix(in_srgb,var(--tenant-accent)_18%,white))] p-8 shadow-2xl shadow-black/5 sm:p-12">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[var(--tenant-accent)]/35 blur-3xl" />
        <div className="absolute left-0 top-1/3 h-48 w-48 rounded-full bg-[var(--tenant-primary)]/15 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-40 w-40 rounded-full bg-amber-200/60 blur-3xl" />

        <div className="relative z-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="inline-flex rounded-full border border-black/10 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--tenant-muted)]">
              Barberia · {slug}
            </p>

            <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
              Tu estilo con mas detalle, color y presencia.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--tenant-muted)] sm:text-lg">
              Cortes precisos, barba bien cuidada y una reserva simple desde el
              primer clic. Todo pensado para que la experiencia se vea tan bien como
              el resultado final.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href={`/${slug}/reservar`}
                className="rounded-full bg-[var(--tenant-primary)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:-translate-y-0.5"
              >
                Reservar ahora
              </Link>
              <Link
                href={`/${slug}/galeria`}
                className="rounded-full border border-black/15 bg-white/80 px-6 py-3 text-sm font-semibold backdrop-blur transition hover:bg-white"
              >
                Ver galeria
              </Link>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-white to-sky-50 p-4 backdrop-blur">
                <p className="text-2xl font-bold">+2K</p>
                <p className="text-sm text-[var(--tenant-muted)]">Clientes atendidos</p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-white to-amber-50 p-4 backdrop-blur">
                <p className="text-2xl font-bold">4.9</p>
                <p className="text-sm text-[var(--tenant-muted)]">Puntuacion promedio</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-white to-emerald-50 p-4 backdrop-blur">
                <p className="text-2xl font-bold">Lun-Sab</p>
                <p className="text-sm text-[var(--tenant-muted)]">8:00 AM - 8:00 PM</p>
              </div>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-black/10 bg-white/75 p-5 shadow-xl shadow-black/5 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--tenant-muted)]">
              Reserva destacada
            </p>
            <div className="mt-4 rounded-[1.75rem] border border-[var(--tenant-primary)]/15 bg-[color:color-mix(in_srgb,var(--tenant-primary)_10%,white)] p-5">
              <p className="text-sm font-semibold text-[var(--tenant-text)]">Hoy hay turnos libres</p>
              <p className="mt-1 text-sm text-[var(--tenant-muted)]">
                Elige un horario y asegura tu espacio sin llamadas ni esperas.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {availableSlots.slice(0, 6).map((slot, index) => (
                <span
                  key={slot}
                  className={`rounded-xl border px-2 py-2 text-center text-xs font-semibold ${
                    index % 3 === 0
                      ? "border-sky-200 bg-sky-50 text-sky-900"
                      : index % 3 === 1
                        ? "border-amber-200 bg-amber-50 text-amber-900"
                        : "border-emerald-200 bg-emerald-50 text-emerald-900"
                  }`}
                >
                  {slot}
                </span>
              ))}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-black/10 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--tenant-muted)]">
                  Ambiente
                </p>
                <p className="mt-2 text-sm font-semibold">Comodo y cuidado</p>
              </div>
              <div className="rounded-2xl border border-black/10 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--tenant-muted)]">
                  Atencion
                </p>
                <p className="mt-2 text-sm font-semibold">Puntual y cercana</p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section
        id="reservas"
        className="grid gap-6 rounded-[2rem] border border-black/10 bg-[linear-gradient(135deg,white,color-mix(in_srgb,var(--tenant-accent)_12%,white))] p-6 shadow-xl shadow-black/5 lg:grid-cols-[1.2fr_1fr] lg:p-8"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--tenant-muted)]">
            Reservas rapidas
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">
            Agenda tu cita con una vista clara
          </h2>
          <p className="mt-3 max-w-2xl text-[var(--tenant-muted)]">
            Elige servicio, fecha y hora en un flujo visual mas limpio y directo.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { title: "Servicio", tone: "from-sky-50 to-cyan-50 border-sky-200" },
              { title: "Fecha", tone: "from-amber-50 to-orange-50 border-amber-200" },
              { title: "Hora", tone: "from-emerald-50 to-lime-50 border-emerald-200" },
            ].map((item, index) => (
              <div
                key={item.title}
                className={`rounded-2xl border bg-gradient-to-br ${item.tone} p-4`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--tenant-muted)]">
                  Paso {index + 1}
                </p>
                <p className="mt-2 text-sm font-semibold">{item.title}</p>
              </div>
            ))}
          </div>

          <Link
            href={`/${slug}/reservar`}
            className="mt-6 inline-flex rounded-full bg-[var(--tenant-primary)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:-translate-y-0.5"
          >
            Empezar reserva
          </Link>
        </div>

        <aside className="rounded-3xl border border-black/10 bg-white/80 p-5 backdrop-blur">
          <p className="text-sm font-semibold">Hoy hay disponibilidad</p>
          <p className="mt-1 text-xs text-[var(--tenant-muted)]">Horarios de ejemplo</p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {availableSlots.map((slot, index) => (
              <span
                key={slot}
                className={`rounded-xl border px-2 py-2 text-center text-xs font-semibold ${
                  index % 2 === 0
                    ? "border-black/10 bg-white"
                    : "border-[var(--tenant-primary)]/20 bg-[color:color-mix(in_srgb,var(--tenant-primary)_9%,white)]"
                }`}
              >
                {slot}
              </span>
            ))}
          </div>

          <p className="mt-4 text-xs text-[var(--tenant-muted)]">
            Los horarios reales se veran al conectar la disponibilidad del negocio.
          </p>
        </aside>
      </section>

      <section id="servicios" className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--tenant-muted)]">
              Servicios
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">Lo mas solicitado</h2>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {services.map((service, index) => (
            <article
              key={service.name}
              className={`group rounded-3xl border p-6 shadow-lg shadow-black/5 transition hover:-translate-y-1 hover:shadow-2xl ${
                index === 0
                  ? "border-sky-200 bg-gradient-to-br from-white to-sky-50"
                  : index === 1
                    ? "border-amber-200 bg-gradient-to-br from-white to-amber-50"
                    : "border-emerald-200 bg-gradient-to-br from-white to-emerald-50"
              }`}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">{service.name}</h3>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--tenant-primary)] shadow-sm">
                  {service.duration}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-[var(--tenant-muted)]">
                {service.description}
              </p>
              <p className="mt-5 text-2xl font-bold text-[var(--tenant-primary)]">
                {service.price}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section id="equipo" className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--tenant-muted)]">
            Equipo
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">Profesionales de la casa</h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
          {team.map((member, index) => (
            <article
              key={member.name}
              className={`rounded-3xl border p-6 shadow-lg shadow-black/5 ${
                index === 0
                  ? "border-sky-200 bg-gradient-to-br from-white to-sky-50"
                  : index === 1
                    ? "border-rose-200 bg-gradient-to-br from-white to-rose-50"
                    : "border-amber-200 bg-gradient-to-br from-white to-amber-50"
              }`}
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--tenant-primary)] text-base font-bold text-white shadow-lg shadow-black/10">
                {member.name.charAt(0)}
              </div>
              <h3 className="text-lg font-semibold">{member.name}</h3>
              <p className="mt-1 text-sm text-[var(--tenant-muted)]">{member.role}</p>
              <p className="mt-4 text-sm leading-relaxed text-[var(--tenant-muted)]">
                Especialista en cortes modernos, perfiles limpios y acabados que
                respetan tu estilo.
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--tenant-muted)]">
            Testimonios
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">Lo que dicen nuestros clientes</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <article
              key={testimonial.name}
              className={`rounded-3xl border p-6 shadow-lg shadow-black/5 ${
                index === 0
                  ? "border-sky-200 bg-gradient-to-br from-white to-sky-50"
                  : index === 1
                    ? "border-violet-200 bg-gradient-to-br from-white to-violet-50"
                    : "border-emerald-200 bg-gradient-to-br from-white to-emerald-50"
              }`}
            >
              <p className="text-sm leading-relaxed text-[var(--tenant-muted)]">
                &quot;{testimonial.quote}&quot;
              </p>
              <p className="mt-4 text-sm font-semibold">{testimonial.name}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-black/10 bg-[linear-gradient(135deg,var(--tenant-primary),color-mix(in_srgb,var(--tenant-primary)_72%,var(--tenant-accent)))] p-8 text-white shadow-2xl shadow-black/20 sm:p-10">
        <h2 className="text-3xl font-bold tracking-tight">Listo para tu proximo look?</h2>
        <p className="mt-3 max-w-2xl text-sm text-white/85 sm:text-base">
          Agenda ahora y asegura tu horario preferido. La reserva ya tiene una
          vista mas clara, mas rapida y mas visual.
        </p>
        <Link
          href={`/${slug}/reservar`}
          className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-[var(--tenant-primary)] transition hover:opacity-90"
        >
          Reservar mi turno
        </Link>
      </section>
    </div>
  );
}
