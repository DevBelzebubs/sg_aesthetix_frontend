export interface Sale {
  id: string;
  cliente_id: string | null;
  usuario_id: string;
  tipo_venta: string;
  subtotal: number;
  descuento: number;
  total: number;
  metodo_pago: string | null;
  puntos_ganados: number;
  estado: string;
  observaciones: string | null;
  creado_en: string;
}
