import Link from "next/link";

type GaleriaPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function GaleriaPage({ params }: GaleriaPageProps) {
  const { slug } = await params;

  return (
    <section className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--tenant-muted)]">
          Portfolio
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Galería de cortes
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--tenant-muted)]">
          Vista inicial de la galería pública de {slug}. Próximamente se
          alimentará desde el módulo de contenido.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <article
            key={index}
            className="group aspect-square overflow-hidden rounded-3xl border border-black/10 bg-[var(--tenant-surface)] p-3 shadow-lg shadow-black/5"
          >
            <div className="flex h-full items-end rounded-2xl bg-gradient-to-br from-black/70 via-black/40 to-black/10 p-4 transition group-hover:scale-[1.02]">
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-zinc-800">
                Corte #{index + 1}
              </span>
            </div>
          </article>
        ))}
      </div>

      <Link
        href={`/${slug}`}
        className="inline-flex rounded-full border border-black/15 px-5 py-2.5 text-sm font-medium transition hover:bg-black/5"
      >
        Volver al inicio
      </Link>
    </section>
  );
}
