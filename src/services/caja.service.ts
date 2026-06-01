import { createClient } from "@/lib/supabase/client";
import type { Caja } from "@/types/caja";

function mapRow(row: Record<string, unknown>): Caja {
  return {
    id: row.id as number,
    estaAbierta: row.esta_abierta as boolean,
    saldoInicial: Number(row.saldo_inicial),
    abiertoEn: row.abierto_en as string | null,
    cerradoEn: row.cerrado_en as string | null,
    usuarioAperturaId: row.usuario_apertura_id as string | null,
    actualizadoEn: row.actualizado_en as string | null,
  };
}

export const CajaService = {
  async get(): Promise<Caja | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("caja")
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return mapRow(data as Record<string, unknown>);
  },

  async abrir(usuarioId: string, saldoInicial: number = 0): Promise<Caja> {
    const supabase = createClient();
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("caja")
      .update({
        esta_abierta: true,
        saldo_inicial: saldoInicial,
        abierto_en: now,
        usuario_apertura_id: usuarioId,
        actualizado_en: now,
      })
      .eq("id", 1)
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data) return mapRow(data as Record<string, unknown>);
    const { data: newRow, error: insertError } = await supabase
      .from("caja")
      .insert({ id: 1, esta_abierta: true, saldo_inicial: saldoInicial, abierto_en: now, usuario_apertura_id: usuarioId })
      .select()
      .single();
    if (insertError) throw new Error(insertError.message);
    return mapRow(newRow as Record<string, unknown>);
  },

  async cerrar(): Promise<Caja> {
    const supabase = createClient();
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("caja")
      .update({
        esta_abierta: false,
        cerrado_en: now,
        actualizado_en: now,
      })
      .eq("id", 1)
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data) return mapRow(data as Record<string, unknown>);
    throw new Error("No se encontro registro de caja");
  },
};
