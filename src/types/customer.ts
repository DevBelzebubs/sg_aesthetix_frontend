export interface Customer {
  id: string;
  nombres: string;
  apellidos?: string;
  dni?: string;
  telefono?: string;
  correoElectronico?: string;
  estaActivo: boolean;
  createdAt?: string;
  promocionEstado?: string;
  promocionCreadoEn?: string;
  fechaNacimiento?: string;
  pinHash?: string;
  pinSalt?: string;
  intentosFallidos: number;
  bloqueadoHasta?: string;
  emailConfirmado: boolean;
  codigoVerificacionHash?: string;
  codigoVerificacionSalt?: string;
  codigoVerificacionExpira?: string;
  esFrecuente?: boolean;
}

export interface CreateCustomerPayload {
  nombres: string;
  apellidos?: string;
  dni?: string;
  telefono?: string;
  correoElectronico?: string;
  promocionEstado?: string;
  fechaNacimiento?: string;
  pinHash?: string;
  pinSalt?: string;
  emailConfirmado?: boolean;
  esFrecuente?: boolean;
}

export interface UpdateCustomerPayload {
  dni?: string;
  nombres?: string;
  apellidos?: string;
  telefono?: string;
  correoElectronico?: string;
  promocionEstado?: string;
  fechaNacimiento?: string;
  pinHash?: string;
  pinSalt?: string;
  intentosFallidos?: number;
  bloqueadoHasta?: string;
  emailConfirmado?: boolean;
  codigoVerificacionHash?: string | null;
  codigoVerificacionSalt?: string | null;
  codigoVerificacionExpira?: string | null;
  esFrecuente?: boolean;
}
