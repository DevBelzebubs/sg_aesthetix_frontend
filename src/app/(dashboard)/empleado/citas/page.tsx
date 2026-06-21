"use client";

import { useEffect, useState } from "react";
import { EmployeeWorkspace } from "@/components/dashboard/employee-workspace";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

export default function EmpleadoCitasPage() {
  const { userId, isReady, isAuthenticated } = useAuth();
  const supabase = createClient();
  const [data, setData] = useState<{ name: string; id: string } | null>(null);

  useEffect(() => {
    async function load() {
      if (!userId) return;
      const { data: usuario } = await supabase
        .from("usuarios")
        .select("id, nombres, apellidos")
        .eq("id", userId)
        .single();
      if (usuario) {
        setData({
          name: `${usuario.nombres} ${(usuario.apellidos as string) ?? ""}`.trim(),
          id: usuario.id as string,
        });
      }
    }
    if (isReady && isAuthenticated) load();
  }, [isReady, isAuthenticated, userId, supabase]);

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-4 w-4 animate-pulse rounded-full bg-[var(--text-muted)]" />
      </div>
    );
  }

  return <EmployeeWorkspace initialView="agenda" employeeName={data.name} employeeId={data.id} />;
}
