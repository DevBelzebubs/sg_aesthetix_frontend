import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type GaleriaPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function GaleriaPage({ params }: GaleriaPageProps) {
  const { slug } = await params;
  const supabase = createClient();

  const { data: photos } = await supabase
    .from("galeria_cortes")
    .select("id, titulo, imagen_url, orden")
    .eq("esta_activo", true)
    .order("orden", { ascending: true });

  return (
    <section className="space-y-10">
      {/* Header */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--tenant-muted)]">
          Portfolio
        </p>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-tight sm:text-5xl">
          Galería
        </h1>
        <p className="mt-3 max-w-md text-sm font-light leading-relaxed text-[var(--tenant-muted)]">
          Cada corte es una firma. Explorá nuestro trabajo y elegí tu estilo.
        </p>
      </div>

      {/* Grid */}
      <div className="grid gap-[3px] sm:grid-cols-2 md:grid-cols-3">
        {(photos ?? []).map((photo, index) => (
          <article
            key={photo.id}
            className="group relative aspect-square overflow-hidden bg-neutral-900"
          >
            <img
              src={photo.imagen_url}
              alt={photo.titulo ?? ""}
              className="h-full w-full object-cover brightness-90 saturate-[0.85] transition duration-500 group-hover:scale-105 group-hover:brightness-75 group-hover:saturate-100"
            />

            <div className="absolute inset-0 flex flex-col justify-between p-5 opacity-0 transition duration-300 group-hover:opacity-100">
              <span
                className="self-end font-black leading-none text-white/20"
                style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "56px" }}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="inline-flex w-fit items-center gap-2 bg-[var(--tenant-primary)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                {photo.titulo}
              </span>
            </div>
          </article>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-6 pt-2">
        <Link
          href={`/${slug}`}
          className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--tenant-muted)] transition hover:text-[var(--tenant-primary)]"
        >
          ← Volver al inicio
        </Link>
        <span className="text-[10px] uppercase tracking-widest text-[var(--tenant-muted)]/40">
          {photos?.length ?? 0} trabajos
        </span>
      </div>
    </section>
  );
}