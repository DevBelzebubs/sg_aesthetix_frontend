export interface RecompensaPuntos {
  id: string;
  tipoRecompensa: string;
  servicioId?: string;
  productoId?: string;
  nombre: string;
  descripcion?: string;
  puntosRequeridos: number;
  cantidadEntregada: number;
  estaActivo: boolean;
  imagenUrl?: string;
  creadoEn?: string;
  actualizadoEn?: string;
}

export interface CanjePuntos {
  id: string;
  cuentaPuntosId: string;
  recompensaId: string;
  usuarioId?: string;
  ventaId?: string;
  puntosCanjeados: number;
  estado: string;
  observaciones?: string;
  creadoEn?: string;
  actualizadoEn?: string;
  recompensa?: RecompensaPuntos;
  cliente?: { nombres: string };
}
