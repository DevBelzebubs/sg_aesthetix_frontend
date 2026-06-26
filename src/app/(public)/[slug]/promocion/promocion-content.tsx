"use client";

import { useCallback, useState } from "react";
import { useCustomerAuth } from "@/contexts/customer-auth-context";
import { Pagination } from "@/components/dashboard/pagination";
import { RecompensasService } from "@/services/recompensas.service";
import { RewardsService } from "@/services/rewards.service";
import { Toast } from "@/components/dashboard/toast";
import type { ToastType } from "@/components/dashboard/toast";
import { Loader2 } from "lucide-react";

type RecompensaItem = {
  id: string;
  nombre: string;
  descripcion?: string;
  puntosRequeridos: number;
  imagenUrl?: string;
};

export function PromocionContent({
  slug,
  recompensas,
}: {
  slug: string;
  recompensas: RecompensaItem[];
}) {
  const { openModal, session } = useCustomerAuth();
  const pageSize = 10;
  const [page, setPage] = useState(1);
  const [canjeandoId, setCanjeandoId] = useState<string | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<ToastType>("success");
  const totalPages = Math.ceil(recompensas.length / pageSize);
  const paginatedRecompensas = recompensas.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  const handleCanje = useCallback(async (recompensa: RecompensaItem) => {
    if (!session) return;
    setCanjeandoId(recompensa.id);
    try {
      const cuenta = await RewardsService.getCuentaPuntosByClienteId(session.id);
      if (!cuenta) throw new Error("No tienes una cuenta de puntos. Realiza tu primera compra.");
      if (cuenta.puntosDisponibles < recompensa.puntosRequeridos) {
        throw new Error(`Necesitas ${recompensa.puntosRequeridos} pts, tienes ${cuenta.puntosDisponibles} pts.`);
      }
      await RecompensasService.solicitarCanje(cuenta.id, recompensa.id);
      setToastMsg(`Solicitud enviada para "${recompensa.nombre}". Espera la confirmación del local.`);
      setToastType("success");
    } catch (err) {
      setToastMsg(err instanceof Error ? err.message : "Error al solicitar canje");
      setToastType("error");
    } finally {
      setToastOpen(true);
      setCanjeandoId(null);
    }
  }, [session]);

  return (
    <section className="space-y-10 pt-8">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]">Fidelidad</p>
        <h1 className="text-5xl font-black uppercase tracking-tight sm:text-6xl">Recompensas</h1>
        <p className="mt-1 max-w-md text-lg font-light leading-relaxed text-[var(--text-muted)]">
          Acumula puntos en cada visita y canjéalos por estos beneficios.
        </p>
      </div>

      {recompensas.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-base text-[var(--text-muted)]">No hay recompensas disponibles por ahora.</p>
        </div>
      ) : (
        <div className="grid gap-[1px] sm:grid-cols-2" style={{ background: "var(--background)" }}>
          {paginatedRecompensas.map((r) => (
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
              {session && (
                <button
                  type="button"
                  onClick={() => handleCanje(r)}
                  disabled={canjeandoId === r.id}
                  className="shrink-0 self-center rounded-full border border-[var(--hover)] px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-[var(--hover)] transition hover:bg-[var(--hover)] hover:text-white disabled:opacity-40"
                >
                  {canjeandoId === r.id ? <Loader2 size={14} className="animate-spin" /> : "Canjear"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {recompensas.length > pageSize && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      <div
        className="relative overflow-hidden"
        style={{ background: "var(--background-secondary)" }}
      >
        <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: "var(--hover)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-[1px]" style={{ background: "var(--hover)" }} />
        <div className="grid md:grid-cols-[1fr_auto] gap-[1px]" style={{ background: "var(--background)" }}>
          <div className="flex flex-col justify-center px-8 py-10 md:px-14 md:py-12 bg-neutral-950">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--hover)" }}>
              {session ? "Sigue así" : "Únete al programa"}
            </p>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-white md:text-3xl">
              {session ? "Sigue acumulando puntos" : "¿Quieres canjear recompensas?"}
            </h2>
            <p className="mt-2 text-sm text-white/50 leading-relaxed max-w-lg">
              {session
                ? "Selecciona una recompensa y solicita tu canje."
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

      <Toast message={toastMsg} type={toastType} open={toastOpen} onClose={() => setToastOpen(false)} position="top-right" />
    </section>
  );
}
