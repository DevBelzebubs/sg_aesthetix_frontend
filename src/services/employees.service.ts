import { createClient } from "@/lib/supabase/client";
import type { Employee, EmployeeRow } from "@/types/employee";
import bcrypt from "bcryptjs";

function mapRowToEmployee(row: EmployeeRow, specialties: string[]): Employee {
  return {
    id: row.id,
    name: `${row.nombres} ${row.apellidos}`,
    nombres: row.nombres,
    apellidos: row.apellidos,
    role: row.rol,
    phone: row.telefono ?? "",
    email: row.correo_electronico,
    status: row.esta_activo ? "Activo" : "Inactivo",
    specialties,
    weeklyLoad: "",
    commission: "",
    auth_user_id: row.auth_user_id,
    creadoEn: row.creado_en ?? "",
    actualizadoEn: row.actualizado_en ?? "",
    imagenUrl: row.imagen_url ?? null,
    instagram: row.instagram ?? "",
    facebook: row.facebook ?? "",
    tiktok: row.tiktok ?? "",
    public: row.public ?? false,
  };
}

async function fetchSpecialties(usuarioId: string): Promise<string[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("usuario_servicio")
    .select("servicios!inner(nombre)")
    .eq("usuario_id", usuarioId);
  if (!data) return [];
  return data.map((item: { servicios: { nombre: string }[] }) => item.servicios[0]?.nombre).filter(Boolean) as string[];
}

export const EmployeesService = {
  async getAll(): Promise<Employee[]> {
    const supabase = createClient();
    const { data: rows, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("esta_activo", true)
      .order("creado_en", { ascending: false });
    if (error) throw new Error(error.message);
    if (!rows) return [];
    const employees = await Promise.all(
      (rows as EmployeeRow[]).map(async (row) => {
        const specialties = await fetchSpecialties(row.id);
        return mapRowToEmployee(row, specialties);
      }),
    );
    return employees;
  },

  async getById(id: string): Promise<Employee | null> {
    const supabase = createClient();
    const { data: row, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw new Error(error.message);
    if (!row) return null;
    const specialties = await fetchSpecialties((row as EmployeeRow).id);
    return mapRowToEmployee(row as EmployeeRow, specialties);
  },

  async getByAuthUserId(authUserId: string): Promise<Employee | null> {
    const supabase = createClient();
    const { data: row, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("auth_user_id", authUserId)
      .single();
    if (error) return null;
    if (!row) return null;
    const specialties = await fetchSpecialties((row as EmployeeRow).id);
    return mapRowToEmployee(row as EmployeeRow, specialties);
  },

  async create(data: {
    nombres: string;
    apellidos: string;
    correo_electronico: string;
    telefono: string;
    esta_activo: boolean;
    clave_hash?: string;
    servicio_ids?: string[];
    imagen_url?: string;
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    public?: boolean;
  }  ): Promise<Employee> {
    const supabase = createClient();
    const clave_hash = data.clave_hash ? await bcrypt.hash(data.clave_hash, 10) : "";
    const { data: row, error } = await supabase
      .from("usuarios")
      .insert({
        nombres: data.nombres,
        apellidos: data.apellidos,
        rol: "empleado",
        correo_electronico: data.correo_electronico,
        clave_hash: clave_hash,
        telefono: data.telefono || null,
        esta_activo: data.esta_activo,
        imagen_url: data.imagen_url || null,
        instagram: data.instagram || null,
        facebook: data.facebook || null,
        tiktok: data.tiktok || null,
        public: data.public ?? false,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    if (data.servicio_ids?.length) {
      const { error: relError } = await supabase.from("usuario_servicio").insert(
        data.servicio_ids.map((servicio_id) => ({
          usuario_id: (row as EmployeeRow).id,
          servicio_id,
        })),
      );
      if (relError) throw new Error(relError.message);
    }
    const specialties = await fetchSpecialties((row as EmployeeRow).id);
    return mapRowToEmployee(row as EmployeeRow, specialties);
  },

  async update(
    id: string,
    data: {
      nombres?: string;
      apellidos?: string;
      correo_electronico?: string;
      telefono?: string;
      esta_activo?: boolean;
      clave_hash?: string;
      servicio_ids?: string[];
      imagen_url?: string;
      instagram?: string;
      facebook?: string;
      tiktok?: string;
      public?: boolean;
    },
  ): Promise<Employee> {
    const supabase = createClient();
    const updateData: Record<string, unknown> = {};
    if (data.nombres !== undefined) updateData.nombres = data.nombres;
    if (data.apellidos !== undefined) updateData.apellidos = data.apellidos;
    if (data.correo_electronico !== undefined) updateData.correo_electronico = data.correo_electronico;
    if (data.telefono !== undefined) updateData.telefono = data.telefono || null;
    if (data.esta_activo !== undefined) updateData.esta_activo = data.esta_activo;
    if (data.clave_hash !== undefined) updateData.clave_hash = await bcrypt.hash(data.clave_hash, 10);
    if (data.imagen_url !== undefined) updateData.imagen_url = data.imagen_url || null;
    if (data.instagram !== undefined) updateData.instagram = data.instagram || null;
    if (data.facebook !== undefined) updateData.facebook = data.facebook || null;
    if (data.tiktok !== undefined) updateData.tiktok = data.tiktok || null;
    if (data.public !== undefined) updateData.public = data.public;
    const { error } = await supabase.from("usuarios").update(updateData).eq("id", id);
    if (error) throw new Error(error.message);
    if (data.servicio_ids !== undefined) {
      await supabase.from("usuario_servicio").delete().eq("usuario_id", id);
      if (data.servicio_ids.length) {
        const { error: relError } = await supabase.from("usuario_servicio").insert(
          data.servicio_ids.map((servicio_id) => ({
            usuario_id: id,
            servicio_id,
          })),
        );
        if (relError) throw new Error(relError.message);
      }
    }
    return (await this.getById(id))!;
  },

  async remove(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from("usuarios")
      .update({ esta_activo: false })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  async restore(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from("usuarios")
      .update({ esta_activo: true })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  async getInactivos(): Promise<Employee[]> {
    const supabase = createClient();
    const { data: rows, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("esta_activo", false)
      .order("creado_en", { ascending: false });
    if (error) throw new Error(error.message);
    if (!rows) return [];
    const employees = await Promise.all(
      (rows as EmployeeRow[]).map(async (row) => {
        const specialties = await fetchSpecialties(row.id);
        return mapRowToEmployee(row, specialties);
      }),
    );
    return employees;
  },
};
