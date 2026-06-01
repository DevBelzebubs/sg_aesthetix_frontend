"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ConfiguracionService } from "@/services/configuracion.service";
import { RecompensasService } from "@/services/recompensas.service";
import { useCustomerAuth } from "@/contexts/customer-auth-context";
import type { RecompensaPuntos } from "@/types/redemption";
import Link from "next/link";

export default function PromocionPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { openModal, session } = useCustomerAuth();

  const [promocionActiva, setPromocionActiva] = useState(true);
  const [loadingPromo, setLoadingPromo] = useState(true);
  const [recompensas, setRecompensas] = useState<RecompensaPuntos[]>([]);
  const [loadingRewards, setLoadingRewards] = useState(true);

  useEffect(() => {
    ConfiguracionService.get()
      .then((config) => {
        if (config) setPromocionActiva(config.promocionActiva);
      })
      .catch(() => {})
      .finally(() => setLoadingPromo(false));

    RecompensasService.getActivas()
      .then(setRecompensas)
      .catch(() => {})
      .finally(() => setLoadingRewards(false));
  }, []);

  if (loadingPromo) {
    return (
      <section className="mx-auto max-w-lg px-4 py-16">
        <div className="flex items-center justify-center py-20">
          <div className="h-4 w-4 animate-pulse rounded-full bg-[var(--text-muted)]" />
        </div>
      </section>
    );
  }

  if (!promocionActiva) {
    return (
      <section className="mx-auto max-w-lg px-4 py-16">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Promoción no disponible</h1>
          <p className="mt-2 text-base leading-relaxed text-[var(--text-muted)]">
            Esta promoción no está activa en este momento. Vuelve más tarde.
          </p>
          <Link
            href={`/${slug}`}
            className="mt-8 inline-block border border-[var(--border)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] transition hover:border-[var(--hover)] hover:text-[var(--hover)]"
          >
            Volver al inicio
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 pt-16">

      {/* ── LISTADO PÚBLICO DE RECOMPENSAS ────────────────────────── */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Recompensas
        </h1>
        <p className="mt-2 text-base leading-relaxed text-[var(--text-muted)]">
          Acumula puntos en cada visita y canjéalos por estos beneficios.
        </p>
      </div>

      {loadingRewards ? (
        <div className="flex justify-center py-10">
          <div className="h-4 w-4 animate-pulse rounded-full bg-[var(--text-muted)]" />
        </div>
      ) : recompensas.length === 0 ? (
        <div className="mb-14 text-center">
          <p className="text-base text-[var(--text-muted)]">No hay recompensas disponibles por ahora.</p>
        </div>
      ) : (
        <div className="mb-12 grid gap-3 sm:grid-cols-2">
          {recompensas.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-5 border border-transparent/10 bg-[var(--background-secondary)] px-6 py-6"
            >
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden ${r.imagenUrl ? "" : "text-lg font-black text-white"}`}
                style={{ background: r.imagenUrl ? "transparent" : "var(--hover)" }}
              >
                {r.imagenUrl ? (
                  <img src={r.imagenUrl} alt={r.nombre} className="h-full w-full object-cover" />
                ) : (
                  <span>{r.puntosRequeridos > 999 ? "∞" : String(r.puntosRequeridos).charAt(0)}</span>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-black uppercase tracking-tight">{r.nombre}</h3>
                {r.descripcion && (
                  <p className="mt-0.5 text-sm text-[var(--text-muted)]">{r.descripcion}</p>
                )}
                <p className="mt-1.5 text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--hover)" }}>
                  {r.puntosRequeridos} pts
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <div className="text-center border-t border-transparent/10 pt-10">
        <h2 className="text-xl font-bold tracking-tight">
          {session ? "Sigue acumulando puntos" : "¿Quieres canjear recompensas?"}
        </h2>
        <p className="mt-1 text-base text-[var(--text-muted)]">
          {session
            ? "Ven al local en tu próxima visita y acumula más puntos."
            : "Inicia sesión con tu DNI y correo para canjear tus puntos."}
        </p>
        {!session && (
          <button
            type="button"
            onClick={openModal}
            className="mt-6 inline-block bg-[var(--hover)] px-8 py-3 text-[11px] font-bold uppercase tracking-[0.15em] text-white transition hover:opacity-75"
          >
            Iniciar sesión
          </button>
        )}
      </div>
    </section>
  );
}
