export type EmployeeRow = {
  id: string;
  rol: "admin" | "empleado";
  nombres: string;
  apellidos: string;
  correo_electronico: string;
  clave_hash: string;
  telefono: string | null;
  esta_activo: boolean;
  creado_en: string;
  actualizado_en: string;
  imagen_url: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  public: boolean | null;
};

export type Employee = {
  id: string;
  name: string;
  nombres: string;
  apellidos: string;
  role: string;
  phone: string;
  email: string;
  status: "Activo" | "Inactivo";
  specialties: string[];
  weeklyLoad: string;
  commission: string;
  creadoEn: string;
  actualizadoEn: string;
  imagenUrl: string | null;
  instagram: string;
  facebook: string;
  tiktok: string;
  public: boolean;
};

export type EmployeeDraft = {
  nombres: string;
  apellidos: string;
  rol: string;
  telefono: string;
  correo_electronico: string;
  esta_activo: boolean;
  specialties: string;
  weeklyLoad: string;
  commission: string;
  imagen_url: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  public: boolean;
};

export type EmployeeFilter = "Todos" | "Activo" | "Inactivo";
