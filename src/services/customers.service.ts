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
    pinHash: row.pin_hash as string | undefined,
    pinSalt: row.pin_salt as string | undefined,
    intentosFallidos: (row.intentos_fallidos as number) ?? 0,
    bloqueadoHasta: row.bloqueado_hasta as string | undefined,
    emailConfirmado: (row.email_confirmado as boolean) ?? false,
    codigoVerificacion: row.codigo_verificacion as string | undefined,
    codigoExpiracion: row.codigo_expiracion as string | undefined,
  };
}

export type PromocionEstado = "pendiente" | "aprobado" | "rechazado";

export const CustomersService = {
  async getAll(): Promise<Customer[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .eq("esta_activo", true)
      .order("creado_en", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => mapRowToCustomer(row as Record<string, unknown>));
  },

  async remove(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from("clientes")
      .update({ esta_activo: false })
      .eq("id", id);
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

  async findByEmail(email: string): Promise<Customer | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .eq("correo_electronico", email)
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
        pin_hash: data.pinHash || null,
        pin_salt: data.pinSalt || null,
        email_confirmado: data.emailConfirmado ?? false,
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
    if (data.pinHash !== undefined) updateData.pin_hash = data.pinHash;
    if (data.pinSalt !== undefined) updateData.pin_salt = data.pinSalt;
    if (data.intentosFallidos !== undefined) updateData.intentos_fallidos = data.intentosFallidos;
    if (data.bloqueadoHasta !== undefined) updateData.bloqueado_hasta = data.bloqueadoHasta;
    if (data.emailConfirmado !== undefined) updateData.email_confirmado = data.emailConfirmado;
    if (data.codigoVerificacion !== undefined) updateData.codigo_verificacion = data.codigoVerificacion;
    if (data.codigoExpiracion !== undefined) updateData.codigo_expiracion = data.codigoExpiracion;

    const { data: row, error } = await supabase
      .from("clientes")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapRowToCustomer(row as Record<string, unknown>);
  },

  async updatePin(id: string, pinHash: string, pinSalt: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from("clientes")
      .update({ pin_hash: pinHash, pin_salt: pinSalt, intentos_fallidos: 0, bloqueado_hasta: null })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  async confirmEmail(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from("clientes")
      .update({ email_confirmado: true })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  async saveVerificationCode(id: string, code: string): Promise<void> {
    const supabase = createClient();
    const expiracion = new Date(Date.now() + 15 * 60000).toISOString(); // 15 minutos
    const { error } = await supabase
      .from("clientes")
      .update({ codigo_verificacion: code, codigo_expiracion: expiracion })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  async verifyCode(id: string, code: string): Promise<boolean> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("clientes")
      .select("codigo_verificacion, codigo_expiracion")
      .eq("id", id)
      .single();

    if (error || !data) return false;
    
    if (data.codigo_expiracion && new Date(data.codigo_expiracion) < new Date()) {
      return false;
    }
    
    return data.codigo_verificacion === code;
  },

  async clearVerificationCode(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from("clientes")
      .update({ codigo_verificacion: null, codigo_expiracion: null })
      .eq("id", id);
    if (error) throw new Error(error.message);
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
