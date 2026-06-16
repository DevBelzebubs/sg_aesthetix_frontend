"use client";

import { useEffect, useState } from "react";
import { Pagination } from "@/components/dashboard/pagination";
import Link from "next/link";

type PhotoItem = {
  id: number;
  titulo: string | null;
  imagen_url: string | null;
  orden: number | null;
};

export function GaleriaContent({
  slug,
  photos,
}: {
  slug: string;
  photos: PhotoItem[];
}) {
  const pageSize = 10;
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(photos.length / pageSize);
  const paginatedPhotos = photos.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  useEffect(() => {
    if (page > Math.ceil(photos.length / pageSize)) {
      setPage(1);
    }
  }, [photos.length, page, pageSize]);

  return (
    <section className="space-y-10 pt-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]">
          Portfolio
        </p>
        <h1 className="mt-2 text-5xl font-black uppercase tracking-tight sm:text-6xl">
          Galería
        </h1>
        <p className="mt-3 max-w-md text-lg font-light leading-relaxed text-[var(--text-muted)]">
          Cada corte es una firma. Explorá nuestro trabajo y elegí tu estilo.
        </p>
      </div>

      {paginatedPhotos.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-base text-[var(--text-muted)]">No hay trabajos disponibles por ahora.</p>
        </div>
      ) : (
        <div className="grid gap-[3px] sm:grid-cols-2 md:grid-cols-3">
          {paginatedPhotos.map((photo, index) => (
            <article
              key={photo.id}
              className="group relative aspect-square overflow-hidden bg-[var(--background)]"
            >
              <img
                src={photo.imagen_url ?? ""}
                alt={photo.titulo ?? ""}
                className="h-full w-full object-cover brightness-90 saturate-[0.85] transition duration-500 group-hover:scale-105 group-hover:brightness-75 group-hover:saturate-100"
              />

              <div className="absolute inset-0 flex flex-col justify-between p-5 opacity-0 transition duration-300 group-hover:opacity-100">
                <span
                  className="self-end font-black leading-none text-white/20"
                  style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "56px" }}
                >
                  {String(index + 1 + (page - 1) * pageSize).padStart(2, "0")}
                </span>
                <span className="inline-flex w-fit items-center gap-2 bg-[var(--tenant-primary)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                  {photo.titulo}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      {photos.length > pageSize && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      <div className="flex items-center gap-6 pt-8 pb-12">
        <Link
          href={`/${slug}`}
          className="inline-flex items-center gap-2 border border-[var(--border)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] transition hover:border-[var(--hover)] hover:text-[var(--hover)]"
        >
          ← Volver al inicio
        </Link>
        <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]/40">
          {photos.length} trabajos
        </span>
      </div>
    </section>
  );
}
