export interface Customer {
  id: string;
  nombres: string;
  apellidos?: string;
  dni?: string;
  telefono?: string;
  correoElectronico?: string;
  authUserId?: string;
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
}

export interface CreateCustomerPayload {
  nombres: string;
  apellidos?: string;
  dni?: string;
  telefono?: string;
  correoElectronico?: string;
  authUserId?: string;
  promocionEstado?: string;
  fechaNacimiento?: string;
  pinHash?: string;
  pinSalt?: string;
  emailConfirmado?: boolean;
}

export interface UpdateCustomerPayload {
  authUserId?: string;
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
}
