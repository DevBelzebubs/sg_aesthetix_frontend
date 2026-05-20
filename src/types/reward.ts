export interface CuentaPuntos {
  id: string;
  clienteId: string;
  puntosDisponibles: number;
  puntosAcumulados: number;
  puntosCanjeados: number;
}

export interface TransaccionPuntos {
  id: string;
  cuentaPuntosId: string;
  ventaId?: string;
  canjeId?: string;
  tipo: string;
  puntos: number;
  saldoAnterior: number;
  saldoNuevo: number;
  descripcion?: string;
  creadoEn?: string;
}

export interface WelcomeReward {
  puntos: number;
  saldoNuevo: number;
  message: string;
}
