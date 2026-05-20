import { createClient } from "@/lib/supabase/client";

export interface ConfiguracionPuntos {
  id: number;
  minimoCanje: number;
  estaActivo: boolean;
  promocionActiva: boolean;
}

function mapRow(row: Record<string, unknown>): ConfiguracionPuntos {
  return {
    id: row.id as number,
    minimoCanje: row.minimo_canje as number,
    estaActivo: row.esta_activo as boolean,
    promocionActiva: row.promocion_activa as boolean,
  };
}

export const ConfiguracionService = {
  async get(): Promise<ConfiguracionPuntos | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("configuracion_puntos")
      .select("*")
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;
    return mapRow(data as Record<string, unknown>);
  },

  async update(data: { promocionActiva?: boolean; estaActivo?: boolean; minimoCanje?: number }): Promise<ConfiguracionPuntos> {
    const supabase = createClient();
    const updateData: Record<string, unknown> = {};
    if (data.promocionActiva !== undefined) updateData.promocion_activa = data.promocionActiva;
    if (data.estaActivo !== undefined) updateData.esta_activo = data.estaActivo;
    if (data.minimoCanje !== undefined) updateData.minimo_canje = data.minimoCanje;
    updateData.actualizado_en = new Date().toISOString();

    const { data: row, error } = await supabase
      .from("configuracion_puntos")
      .update(updateData)
      .eq("id", 1)
      .select()
      .maybeSingle();

    if (error) throw new Error(error.message);

    if (row) return mapRow(row as Record<string, unknown>);

    const { data: newRow, error: insertError } = await supabase
      .from("configuracion_puntos")
      .insert({ id: 1, ...updateData })
      .select()
      .single();

    if (insertError) throw new Error(insertError.message);
    return mapRow(newRow as Record<string, unknown>);
  },
};
