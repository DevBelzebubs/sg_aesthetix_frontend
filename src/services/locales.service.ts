import { createClient } from "@/lib/supabase/client";

export type Locale = {
  id: string;
  nombre: string;
  direccion: string;
  horario: string;
  telefono: string;
  maps_url: string;
  lat: number;
  lng: number;
  creado_en?: string;
  actualizado_en?: string;
};

export const LocalesService = {
  async getFirst(): Promise<Locale | null> {
    const supabase = createClient();
    const { data } = await supabase
      .from("locales")
      .select("*")
      .limit(1)
      .maybeSingle();
    return data ?? null;
  },

  async update(id: string, data: Partial<Omit<Locale, "id" | "creado_en" | "actualizado_en">>): Promise<Locale> {
    const supabase = createClient();
    const { data: row, error } = await supabase
      .from("locales")
      .update({ ...data, actualizado_en: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row as Locale;
  },
};
