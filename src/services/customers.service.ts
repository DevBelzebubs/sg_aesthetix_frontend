import { createClient } from "@/lib/supabase/client";
import type { Customer, CreateCustomerPayload, UpdateCustomerPayload } from "@/types/customer";

function mapRowToCustomer(row: Record<string, unknown>): Customer {
  return {
    id: row.id as string,
    nombres: row.nombres as string,
    apellidos: row.apellidos as string | undefined,
    dni: row.dni as string | undefined,
    telefono: row.telefono as string | undefined,
    correoElectronico: row.correo_electronico as string | undefined,
    authUserId: row.auth_user_id as string | undefined,
    estaActivo: row.esta_activo as boolean,
    createdAt: row.creado_en as string | undefined,
    promocionEstado: row.promocion_estado as string | undefined,
    promocionCreadoEn: row.promocion_creado_en as string | undefined,
    fechaNacimiento: row.fecha_nacimiento as string | undefined,
  };
}

export type PromocionEstado = "pendiente" | "aprobado" | "rechazado";

export const CustomersService = {
  async getAll(): Promise<Customer[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .order("creado_en", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => mapRowToCustomer(row as Record<string, unknown>));
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("clientes").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  async findByPhone(telefono: string): Promise<Customer | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .eq("telefono", telefono)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;
    return mapRowToCustomer(data as Record<string, unknown>);
  },

  async findByDni(dni: string): Promise<Customer | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .eq("dni", dni)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;
    return mapRowToCustomer(data as Record<string, unknown>);
  },

  async create(data: CreateCustomerPayload): Promise<Customer> {
    const supabase = createClient();
    const { data: row, error } = await supabase
      .from("clientes")
      .insert({
        nombres: data.nombres,
        apellidos: data.apellidos || "",
        dni: data.dni || null,
        telefono: data.telefono || null,
        correo_electronico: data.correoElectronico || null,
        esta_activo: true,
        auth_user_id: data.authUserId || null,
        promocion_estado: data.promocionEstado || null,
        promocion_creado_en: data.promocionEstado ? new Date().toISOString() : null,
        fecha_nacimiento: data.fechaNacimiento || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapRowToCustomer(row as Record<string, unknown>);
  },

  async update(id: string, data: UpdateCustomerPayload): Promise<Customer> {
    const supabase = createClient();
    const updateData: Record<string, unknown> = {};
    if (data.dni !== undefined) updateData.dni = data.dni;
    if (data.nombres !== undefined) updateData.nombres = data.nombres;
    if (data.apellidos !== undefined) updateData.apellidos = data.apellidos;
    if (data.telefono !== undefined) updateData.telefono = data.telefono;
    if (data.correoElectronico !== undefined) updateData.correo_electronico = data.correoElectronico;
    if (data.authUserId !== undefined) updateData.auth_user_id = data.authUserId;
    if (data.promocionEstado !== undefined) updateData.promocion_estado = data.promocionEstado;
    if (data.fechaNacimiento !== undefined) updateData.fecha_nacimiento = data.fechaNacimiento;

    const { data: row, error } = await supabase
      .from("clientes")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapRowToCustomer(row as Record<string, unknown>);
  },

  async getPendingPromociones(): Promise<Customer[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .eq("promocion_estado", "pendiente")
      .order("promocion_creado_en", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => mapRowToCustomer(row as Record<string, unknown>));
  },

  async approvePromocion(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from("clientes")
      .update({ promocion_estado: "aprobado" })
      .eq("id", id);

    if (error) throw new Error(error.message);
  },

  async rejectPromocion(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from("clientes")
      .update({ promocion_estado: "rechazado" })
      .eq("id", id);

    if (error) throw new Error(error.message);
  },
};
