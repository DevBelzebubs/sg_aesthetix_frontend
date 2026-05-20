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
          <div className="h-4 w-4 animate-pulse rounded-full bg-neutral-300" />
        </div>
      </section>
    );
  }

  if (!promocionActiva) {
    return (
      <section className="mx-auto max-w-lg px-4 py-16">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Promoción no disponible</h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500">
            Esta promoción no está activa en este momento. Vuelve más tarde.
          </p>
          <Link
            href={`/${slug}`}
            className="mt-8 inline-block bg-black px-8 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-white transition hover:opacity-75"
          >
            Volver al inicio
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">

      {/* ── LISTADO PÚBLICO DE RECOMPENSAS ────────────────────────── */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Recompensas
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          Acumula puntos en cada visita y canjéalos por estos beneficios.
        </p>
      </div>

      {loadingRewards ? (
        <div className="flex justify-center py-10">
          <div className="h-4 w-4 animate-pulse rounded-full bg-neutral-300" />
        </div>
      ) : recompensas.length === 0 ? (
        <div className="mb-14 text-center">
          <p className="text-sm text-neutral-400">No hay recompensas disponibles por ahora.</p>
        </div>
      ) : (
        <div className="mb-12 grid gap-3 sm:grid-cols-2">
          {recompensas.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-5 border border-black/8 bg-white px-6 py-6"
            >
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center text-lg font-black text-white"
                style={{ background: "#324730" }}
              >
                {r.puntosRequeridos > 999 ? "∞" : String(r.puntosRequeridos).charAt(0)}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-black uppercase tracking-tight">{r.nombre}</h3>
                {r.descripcion && (
                  <p className="mt-0.5 text-xs text-neutral-500">{r.descripcion}</p>
                )}
                <p className="mt-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: "#324730" }}>
                  {r.puntosRequeridos} pts
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <div className="text-center border-t border-black/8 pt-10">
        <h2 className="text-lg font-bold tracking-tight">
          {session ? "Sigue acumulando puntos" : "¿Quieres canjear recompensas?"}
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          {session
            ? "Ven al local en tu próxima visita y acumula más puntos."
            : "Inicia sesión con tu DNI y correo para canjear tus puntos."}
        </p>
        {!session && (
          <button
            type="button"
            onClick={openModal}
            className="mt-6 inline-block bg-black px-8 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-white transition hover:opacity-75"
          >
            Iniciar sesión
          </button>
        )}
      </div>
    </section>
  );
}
