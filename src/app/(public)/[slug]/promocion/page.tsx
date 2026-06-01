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
    <section className="space-y-10 pt-8">

      {/* ── HEADER ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]">Fidelidad</p>
        <h1 className="text-5xl font-black uppercase tracking-tight sm:text-6xl">Recompensas</h1>
        <p className="mt-1 max-w-md text-lg font-light leading-relaxed text-[var(--text-muted)]">
          Acumula puntos en cada visita y canjéalos por estos beneficios.
        </p>
      </div>

      {loadingRewards ? (
        <div className="flex justify-center py-20">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--hover)] border-t-transparent" />
        </div>
      ) : recompensas.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-base text-[var(--text-muted)]">No hay recompensas disponibles por ahora.</p>
        </div>
      ) : (
        <div className="grid gap-[1px] sm:grid-cols-2" style={{ background: "var(--hover)" }}>
          {recompensas.map((r) => (
            <div
              key={r.id}
              className="group relative flex items-start gap-6 bg-[var(--background-secondary)] px-8 py-8 transition hover:bg-neutral-900"
            >
              <div
                className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden ${
                  r.imagenUrl ? "" : "text-xl font-black text-white"
                }`}
                style={{ background: r.imagenUrl ? "transparent" : "var(--hover)" }}
              >
                {r.imagenUrl ? (
                  <img src={r.imagenUrl} alt={r.nombre} className="h-full w-full object-cover" />
                ) : (
                  <span>{r.puntosRequeridos > 999 ? "∞" : String(r.puntosRequeridos).charAt(0)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="mb-2 h-[2px] w-5 transition-all duration-300 group-hover:w-8" style={{ background: "var(--hover)" }} />
                <h3 className="text-lg font-black uppercase tracking-tight text-[var(--foreground)] group-hover:text-white transition-colors">{r.nombre}</h3>
                {r.descripcion && (
                  <p className="mt-0.5 text-sm text-[var(--text-muted)] leading-relaxed group-hover:text-white/60 transition-colors">{r.descripcion}</p>
                )}
                <p className="mt-2 text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--hover)" }}>
                  {r.puntosRequeridos} pts
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{ background: "var(--background-secondary)" }}
      >
        <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: "var(--hover)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-[1px]" style={{ background: "var(--hover)" }} />
        <div className="grid md:grid-cols-[1fr_auto] gap-[1px]" style={{ background: "var(--hover)" }}>
          <div className="flex flex-col justify-center px-8 py-10 md:px-14 md:py-12 bg-neutral-950">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--hover)" }}>
              {session ? "Sigue así" : "Únete al programa"}
            </p>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-white md:text-3xl">
              {session ? "Sigue acumulando puntos" : "¿Quieres canjear recompensas?"}
            </h2>
            <p className="mt-2 text-sm text-white/50 leading-relaxed max-w-lg">
              {session
                ? "Ven al local en tu próxima visita y acumula más puntos."
                : "Inicia sesión con tu DNI y correo para canjear tus puntos."}
            </p>
          </div>
          {!session && (
            <div className="flex items-center justify-center bg-[var(--background-secondary)] px-8 py-10 md:px-14 md:py-12">
              <button
                type="button"
                onClick={openModal}
                className="bg-[var(--hover)] px-10 py-4 text-[11px] font-bold uppercase tracking-[0.15em] text-white transition hover:opacity-75 whitespace-nowrap"
              >
                Iniciar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
