"use client";

import { useEffect, useRef, useState } from "react";
import { CajaService } from "@/services/caja.service";
import { createClient } from "@/lib/supabase/client";
import type { Caja } from "@/types/caja";
import { Loader2 } from "lucide-react";

export function CajaToggle() {
  const [caja, setCaja] = useState<Caja | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [saldoInput, setSaldoInput] = useState("0");
  const [userId, setUserId] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  useEffect(() => {
    if (channelRef.current) return;
    const supabase = createClient();

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setUserId(data.session.user.id);
    });

    CajaService.get().then((data) => {
      setCaja(data);
      if (data) setSaldoInput(String(data.saldoInicial));
      setLoading(false);
    });

    const channel = supabase.channel(`caja_changes_${Date.now()}`);
    channel.on("postgres_changes", { event: "*", schema: "public", table: "caja" }, (payload) => {
      setCaja(payload.new as Caja);
    });
    channel.subscribe();
    channelRef.current = channel;

    return () => { supabase.removeChannel(channel); channelRef.current = null; };
  }, []);

  const handleToggle = async () => {
    if (!userId) return;
    setToggling(true);
    try {
      if (caja?.estaAbierta) {
        const updated = await CajaService.cerrar();
        setCaja(updated);
      } else {
        const saldo = parseFloat(saldoInput) || 0;
        const updated = await CajaService.abrir(userId, saldo);
        setCaja(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] px-5 py-4">
        <Loader2 size={16} className="animate-spin text-[var(--text-muted)]" />
        <span className="text-sm text-[var(--text-muted)]">Cargando...</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`h-3 w-3 rounded-full ${caja?.estaAbierta ? "bg-green-500" : "bg-red-500"}`}
          />
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {caja?.estaAbierta ? "Tienda abierta" : "Tienda cerrada"}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {caja?.estaAbierta
                ? `Abierta desde ${new Date(caja.abiertoEn!).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}`
                : caja?.cerradoEn
                  ? `Cerrada a las ${new Date(caja.cerradoEn).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}`
                  : "La tienda esta cerrada"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggle}
          disabled={toggling}
          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors ${caja?.estaAbierta ? "bg-green-500" : "bg-red-500"} ${toggling ? "opacity-50" : ""}`}
          role="switch"
          aria-checked={caja?.estaAbierta}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${caja?.estaAbierta ? "translate-x-6" : "translate-x-1"}`} />
        </button>
      </div>

      {!caja?.estaAbierta && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)]">Saldo inicial:</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={saldoInput}
            onChange={(e) => setSaldoInput(e.target.value)}
            className="w-24 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm outline-none"
          />
        </div>
      )}
    </div>
  );
}
