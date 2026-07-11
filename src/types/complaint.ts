export interface Complaint {
  id: string;
  tenantSlug: string;
  tipo: "queja" | "reclamo";
  nombres: string;
  apellidos: string;
  domicilio?: string;
  telefono?: string;
  email: string;
  bienContratado?: string;
  montoReclamado?: number;
  descripcion: string;
  pedidoConsumidor?: string;
  respuesta?: string;
  respondidoEl?: string;
  estado: "pendiente" | "respondido" | "cerrado";
  creadoEn?: string;
  actualizadoEn?: string;
}

export interface CreateComplaintPayload {
  tenantSlug: string;
  tipo: "queja" | "reclamo";
  nombres: string;
  apellidos: string;
  domicilio?: string;
  telefono?: string;
  email: string;
  bienContratado?: string;
  montoReclamado?: number;
  descripcion: string;
  pedidoConsumidor?: string;
}

export interface UpdateComplaintPayload {
  respuesta?: string;
  estado?: "pendiente" | "respondido" | "cerrado";
}
