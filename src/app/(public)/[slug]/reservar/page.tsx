import Link from "next/link";

type ReservarPageProps = {
  params: Promise<{ slug: string }>;
};

const steps = [
  "Selecciona el servicio que quieres.",
  "Elige tu barbero favorito.",
  "Escoge fecha y horario disponible.",
  "Confirma tus datos y listo.",
];

export default async function ReservarPage({ params }: ReservarPageProps) {
  const { slug } = await params;

  return (
    <section className="overflow-hidden rounded-[2rem] border border-black/10 bg-[var(--tenant-surface)] p-8 shadow-xl shadow-black/5 sm:p-10">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--tenant-muted)]">
        Reserva online
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
        Reservar turno
      </h1>
      <p className="mt-3 max-w-2xl text-[var(--tenant-muted)]">
        Flujo inicial de reserva pública para <strong>{slug}</strong>. En la
        siguiente iteración conectamos disponibilidad real desde API.
      </p>

      <ol className="mt-8 grid gap-3 sm:grid-cols-2">
        {steps.map((step, index) => (
          <li
            key={step}
            className="rounded-2xl border border-black/10 bg-white/80 p-4 text-sm text-[var(--tenant-muted)]"
          >
            <span className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--tenant-primary)] text-xs font-bold text-white">
              {index + 1}
            </span>
            <p>{step}</p>
          </li>
        ))}
      </ol>

      <Link
        href={`/${slug}`}
        className="mt-8 inline-flex rounded-full border border-black/15 px-5 py-2.5 text-sm font-medium transition hover:bg-black/5"
      >
        Volver al inicio
      </Link>
    </section>
  );
}
