"use client";

import { useEffect, useState } from "react";
import { EmployeeWorkspace } from "@/components/dashboard/employee-workspace";
import { createClient } from "@/lib/supabase/client";

export default function EmpleadoPage() {
  const supabase = createClient();
  const [data, setData] = useState<{ name: string; id: string } | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const { data: usuario } = await supabase
          .from("usuarios")
          .select("id, nombres, apellidos")
          .eq("auth_user_id", session.user.id)
          .single();
        if (usuario) {
          setData({
            name: `${usuario.nombres} ${(usuario.apellidos as string) ?? ""}`.trim(),
            id: usuario.id as string,
          });
        }
      }
    }
    load();
  }, [supabase]);

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-4 w-4 animate-pulse rounded-full bg-[var(--text-muted)]" />
      </div>
    );
  }

  return <EmployeeWorkspace initialView="jornada" employeeName={data.name} employeeId={data.id} />;
}
