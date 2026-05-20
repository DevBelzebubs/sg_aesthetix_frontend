import { createClient } from "@/lib/supabase/client";

export interface CreatePublicAppointmentPayload {
  clienteId: string;
  servicioId: string;
  empleadoId: string;
  fechaReserva: string;
  horaInicio: string;
  horaFin: string;
  canalReserva: string;
  estado: string;
  observaciones?: string;
}

export interface AppointmentWithDetails {
  id: string;
  hora_inicio: string;
  hora_fin: string;
  fecha_reserva: string;
  estado: string;
  observaciones: string | null;
  cliente_nombre: string;
  servicio_nombre: string;
  empleado_nombre: string;
  cliente_id: string;
  servicio_id: string;
  usuario_id: string;
}

export const AppointmentsService = {
  async createPublic(payload: CreatePublicAppointmentPayload) {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("reservas")
      .insert({
        id: crypto.randomUUID(),
        cliente_id: payload.clienteId,
        usuario_id: payload.empleadoId,
        servicio_id: payload.servicioId,
        fecha_reserva: payload.fechaReserva,
        hora_inicio: payload.horaInicio,
        hora_fin: payload.horaFin,
        estado: payload.estado,
        canal_reserva: payload.canalReserva,
        observaciones: payload.observaciones || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async getAllForDate(fecha: string): Promise<AppointmentWithDetails[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("reservas")
      .select(`
        *,
        clientes!cliente_id (nombres, apellidos),
        servicios!servicio_id (nombre),
        usuarios!usuario_id (nombres, apellidos)
      `)
      .eq("fecha_reserva", fecha)
      .order("hora_inicio", { ascending: true });

    if (error) throw new Error(error.message);
    if (!data) return [];

    return (data as Array<{
      id: string;
      hora_inicio: string;
      hora_fin: string;
      fecha_reserva: string;
      estado: string;
      observaciones: string | null;
      cliente_id: string;
      servicio_id: string;
      usuario_id: string;
      clientes: { nombres: string; apellidos: string } | null;
      servicios: { nombre: string } | null;
      usuarios: { nombres: string; apellidos: string } | null;
    }>).map((row) => ({
      id: row.id,
      hora_inicio: row.hora_inicio,
      hora_fin: row.hora_fin,
      fecha_reserva: row.fecha_reserva,
      estado: row.estado,
      observaciones: row.observaciones,
      cliente_id: row.cliente_id,
      servicio_id: row.servicio_id,
      usuario_id: row.usuario_id,
      cliente_nombre: row.clientes
        ? `${row.clientes.nombres} ${row.clientes.apellidos}`.trim()
        : "—",
      servicio_nombre: row.servicios?.nombre ?? "—",
      empleado_nombre: row.usuarios
        ? `${row.usuarios.nombres} ${row.usuarios.apellidos}`.trim()
        : "—",
    }));
  },

  async update(
    id: string,
    data: {
      hora_inicio?: string;
      hora_fin?: string;
      estado?: string;
      observaciones?: string | null;
      usuario_id?: string;
      servicio_id?: string;
    },
  ): Promise<void> {
    const supabase = createClient();
    const payload: Record<string, unknown> = {};
    if (data.hora_inicio !== undefined) payload.hora_inicio = data.hora_inicio;
    if (data.hora_fin !== undefined) payload.hora_fin = data.hora_fin;
    if (data.estado !== undefined) payload.estado = data.estado;
    if (data.observaciones !== undefined) payload.observaciones = data.observaciones;
    if (data.usuario_id !== undefined) payload.usuario_id = data.usuario_id;
    if (data.servicio_id !== undefined) payload.servicio_id = data.servicio_id;

    const { error } = await supabase.from("reservas").update(payload).eq("id", id);
    if (error) throw new Error(error.message);
  },

  async remove(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("reservas").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};
