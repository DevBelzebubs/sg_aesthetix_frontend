"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type CajaRow = {
  id: number;
  esta_abierta: boolean;
};

let channelCounter = 0;

export function StoreStatus() {
  const [abierta, setAbierta] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabaseRef.current = supabase;

    supabase.from("caja").select("esta_abierta").maybeSingle().then(({ data }) => {
      if (data) setAbierta((data as CajaRow).esta_abierta);
      setLoaded(true);
    });

    const channelId = ++channelCounter;
    const channel = supabase.channel(`caja_public_${channelId}`);
    channel.on("postgres_changes", { event: "*", schema: "public", table: "caja" }, (payload) => {
      setAbierta((payload.new as CajaRow).esta_abierta);
    });
    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabaseRef.current = null;
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
