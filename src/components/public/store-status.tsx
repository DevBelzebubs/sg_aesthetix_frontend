"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type CajaRow = {
  id: number;
  esta_abierta: boolean;
};

export function StoreStatus() {
  const [abierta, setAbierta] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  useEffect(() => {
    if (channelRef.current) return;
    const supabase = createClient();

    supabase.from("caja").select("esta_abierta").maybeSingle().then(({ data }) => {
      if (data) setAbierta((data as CajaRow).esta_abierta);
      setLoaded(true);
    });

    const channel = supabase.channel(`caja_public_${Date.now()}`);
    channel.on("postgres_changes", { event: "*", schema: "public", table: "caja" }, (payload) => {
      setAbierta((payload.new as CajaRow).esta_abierta);
    });
    channel.subscribe();
    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, []);

  if (!loaded) return null;

  return (
    <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wider"
      style={{
        borderColor: abierta ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)",
        background: abierta ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
        color: abierta ? "#22c55e" : "#ef4444",
      }}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${abierta ? "bg-green-500" : "bg-red-500"}`} />
      {abierta ? "Abierto ahora" : "Cerrado"}
    </div>
  );
}
