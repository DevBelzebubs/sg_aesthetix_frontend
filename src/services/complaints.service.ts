import { createClient } from "@/lib/supabase/client";
import type { Complaint, CreateComplaintPayload } from "@/types/complaint";

function mapRowToComplaint(row: Record<string, unknown>): Complaint {
  return {
    id: row.id as string,
    tenantSlug: row.tenant_slug as string,
    tipo: row.tipo as "queja" | "reclamo",
    nombres: row.nombres as string,
    apellidos: row.apellidos as string,
    dni: row.dni as string | undefined,
    domicilio: row.domicilio as string | undefined,
    telefono: row.telefono as string | undefined,
    email: row.email as string,
    bienContratado: row.bien_contratado as string | undefined,
    montoReclamado: row.monto_reclamado ? Number(row.monto_reclamado) : undefined,
    descripcion: row.descripcion as string,
    pedidoConsumidor: row.pedido_consumidor as string | undefined,
    respuesta: row.respuesta as string | undefined,
    respondidoEl: row.respondido_el as string | undefined,
    estado: row.estado as "pendiente" | "respondido" | "cerrado",
    creadoEn: row.creado_en as string | undefined,
    actualizadoEn: row.actualizado_en as string | undefined,
  };
}

export const ComplaintsService = {
  async getAll(): Promise<Complaint[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("libro_reclamaciones")
      .select("*")
      .order("creado_en", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => mapRowToComplaint(row as Record<string, unknown>));
  },

  async getById(id: string): Promise<Complaint | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("libro_reclamaciones")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;
    return mapRowToComplaint(data as Record<string, unknown>);
  },

  async create(payload: CreateComplaintPayload): Promise<Complaint> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("libro_reclamaciones")
      .insert({
        tenant_slug: payload.tenantSlug,
        tipo: payload.tipo,
        nombres: payload.nombres,
        apellidos: payload.apellidos,
        dni: payload.dni || null,
        domicilio: payload.domicilio || null,
        telefono: payload.telefono || null,
        email: payload.email,
        bien_contratado: payload.bienContratado || null,
        monto_reclamado: payload.montoReclamado || null,
        descripcion: payload.descripcion,
        pedido_consumidor: payload.pedidoConsumidor || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapRowToComplaint(data as Record<string, unknown>);
  },

  async respond(id: string, respuesta: string): Promise<Complaint> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("libro_reclamaciones")
      .update({
        respuesta,
        respondido_el: new Date().toISOString(),
        estado: "respondido",
        actualizado_en: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapRowToComplaint(data as Record<string, unknown>);
  },

  async updateStatus(id: string, estado: "pendiente" | "respondido" | "cerrado"): Promise<Complaint> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("libro_reclamaciones")
      .update({
        estado,
        actualizado_en: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapRowToComplaint(data as Record<string, unknown>);
  },
};
