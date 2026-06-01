export interface Category {
  id: number;
  nombre: string;
  descripcion: string | null;
  orden: number;
  publico: boolean;
  esta_activo: boolean;
}
