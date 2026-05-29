export interface InventoryMovement {
  id: string;
  producto_id: string;
  usuario_id: string | null;
  tipo: string;
  cantidad: number;
  motivo: string | null;
  stock_anterior: number;
  stock_nuevo: number;
  referencia_tipo: string | null;
  referencia_id: string | null;
  creado_en: string;
}
