import { createClient } from "@/lib/supabase/client";
import type { RecompensaPuntos, CanjePuntos } from "@/types/redemption";

function mapRecompensa(row: Record<string, unknown>): RecompensaPuntos {
  return {
    id: row.id as string,
    tipoRecompensa: row.tipo_recompensa as string,
    servicioId: row.servicio_id as string | undefined,
    productoId: row.producto_id as string | undefined,
    nombre: row.nombre as string,
    descripcion: row.descripcion as string | undefined,
    puntosRequeridos: row.puntos_requeridos as number,
    cantidadEntregada: row.cantidad_entregada as number,
    estaActivo: row.esta_activo as boolean,
    imagenUrl: row.imagen_url as string | undefined,
    creadoEn: row.creado_en as string | undefined,
    actualizadoEn: row.actualizado_en as string | undefined,
  };
}

function mapCanje(row: Record<string, unknown>, recompensa?: RecompensaPuntos): CanjePuntos {
  return {
    id: row.id as string,
    cuentaPuntosId: row.cuenta_puntos_id as string,
    recompensaId: row.recompensa_id as string,
    usuarioId: row.usuario_id as string | undefined,
    ventaId: row.venta_id as string | undefined,
    puntosCanjeados: row.puntos_canjeados as number,
    estado: row.estado as string,
    observaciones: row.observaciones as string | undefined,
    creadoEn: row.creado_en as string | undefined,
    actualizadoEn: row.actualizado_en as string | undefined,
    recompensa,
  };
}

export const RecompensasService = {
  async getActivas(): Promise<RecompensaPuntos[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("recompensas_puntos")
      .select("id, tipo_recompensa, servicio_id, producto_id, nombre, descripcion, puntos_requeridos, cantidad_entregada, esta_activo, imagen_url, creado_en, actualizado_en")
      .eq("esta_activo", true)
      .order("puntos_requeridos", { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => mapRecompensa(r as Record<string, unknown>));
  },

  async getAll(): Promise<RecompensaPuntos[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("recompensas_puntos")
      .select("id, tipo_recompensa, servicio_id, producto_id, nombre, descripcion, puntos_requeridos, cantidad_entregada, esta_activo, imagen_url, creado_en, actualizado_en")
      .order("creado_en", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => mapRecompensa(r as Record<string, unknown>));
  },

  async create(recompensa: {
    tipoRecompensa: string;
    servicioId?: string;
    productoId?: string;
    nombre: string;
    descripcion?: string;
    puntosRequeridos: number;
    cantidadEntregada: number;
    imagenUrl?: string;
  }): Promise<RecompensaPuntos> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("recompensas_puntos")
      .insert({
        tipo_recompensa: recompensa.tipoRecompensa,
        servicio_id: recompensa.servicioId ?? null,
        producto_id: recompensa.productoId ?? null,
        nombre: recompensa.nombre,
        descripcion: recompensa.descripcion ?? null,
        puntos_requeridos: recompensa.puntosRequeridos,
        cantidad_entregada: recompensa.cantidadEntregada,
        esta_activo: true,
        imagen_url: recompensa.imagenUrl ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapRecompensa(data as Record<string, unknown>);
  },

  async update(id: string, data: Partial<{
    nombre: string;
    descripcion: string;
    puntosRequeridos: number;
    cantidadEntregada: number;
    estaActivo: boolean;
    tipoRecompensa: string;
    servicioId: string;
    productoId: string;
    imagenUrl: string;
  }>): Promise<RecompensaPuntos> {
    const supabase = createClient();

    const payload: Record<string, unknown> = {};
    if (data.nombre !== undefined) payload.nombre = data.nombre;
    if (data.descripcion !== undefined) payload.descripcion = data.descripcion;
    if (data.puntosRequeridos !== undefined) payload.puntos_requeridos = data.puntosRequeridos;
    if (data.cantidadEntregada !== undefined) payload.cantidad_entregada = data.cantidadEntregada;
    if (data.estaActivo !== undefined) payload.esta_activo = data.estaActivo;
    if (data.tipoRecompensa !== undefined) payload.tipo_recompensa = data.tipoRecompensa;
    if (data.servicioId !== undefined) payload.servicio_id = data.servicioId;
    if (data.productoId !== undefined) payload.producto_id = data.productoId;
    if (data.imagenUrl !== undefined) payload.imagen_url = data.imagenUrl;
    payload.actualizado_en = new Date().toISOString();

    const { error } = await supabase
      .from("recompensas_puntos")
      .update(payload)
      .eq("id", id);

    if (error) throw new Error(error.message);

    const { data: updated, error: fetchError } = await supabase
      .from("recompensas_puntos")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) throw new Error(fetchError.message);
    return mapRecompensa(updated as Record<string, unknown>);
  },

  async solicitarCanje(cuentaPuntosId: string, recompensaId: string): Promise<CanjePuntos> {
    const supabase = createClient();

    const { data: recompensa, error: rError } = await supabase
      .from("recompensas_puntos")
      .select("*")
      .eq("id", recompensaId)
      .single();

    if (rError) throw new Error(rError.message);

    const puntosRequeridos = (recompensa as Record<string, unknown>).puntos_requeridos as number;

    const { data: cuenta, error: cError } = await supabase
      .from("cuenta_puntos")
      .select("*")
      .eq("id", cuentaPuntosId)
      .single();

    if (cError) throw new Error(cError.message);

    const puntosDisponibles = (cuenta as Record<string, unknown>).puntos_disponibles as number;

    if (puntosDisponibles < puntosRequeridos) {
      throw new Error("No tienes suficientes puntos para canjear esta recompensa.");
    }

    const { data, error } = await supabase
      .from("canjes_puntos")
      .insert({
        cuenta_puntos_id: cuentaPuntosId,
        recompensa_id: recompensaId,
        puntos_canjeados: puntosRequeridos,
        estado: "pendiente",
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapCanje(data as Record<string, unknown>, mapRecompensa(recompensa as Record<string, unknown>));
  },

  async getCanjesByCuentaPuntosId(cuentaPuntosId: string): Promise<CanjePuntos[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("canjes_puntos")
      .select("*, recompensa:recompensa_id(*)")
      .eq("cuenta_puntos_id", cuentaPuntosId)
      .order("creado_en", { ascending: false });

    if (error) throw new Error(error.message);

    return (data ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      const recompensaRaw = r.recompensa as Record<string, unknown> | undefined;
      return mapCanje(r, recompensaRaw ? mapRecompensa(recompensaRaw) : undefined);
    });
  },

  async getCanjesPendientes(): Promise<CanjePuntos[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("canjes_puntos")
      .select("*, recompensa:recompensa_id(*), cuenta:cuenta_puntos_id(cliente_id)")
      .eq("estado", "pendiente")
      .order("creado_en", { ascending: false });

    if (error) throw new Error(error.message);

    const results: CanjePuntos[] = [];

    for (const row of data ?? []) {
      const r = row as Record<string, unknown>;
      const recompensaRaw = r.recompensa as Record<string, unknown> | undefined;
      const cuenta = r.cuenta as Record<string, unknown> | undefined;
      const clienteId = (cuenta?.cliente_id as string) ?? "";

      let cliente: { nombres: string; dni?: string } | undefined;

      if (clienteId) {
        const { data: clienteData } = await supabase
          .from("clientes")
          .select("nombres, dni")
          .eq("id", clienteId)
          .maybeSingle();
        if (clienteData) {
          const c = clienteData as Record<string, unknown>;
          cliente = {
            nombres: (c.nombres as string) ?? "—",
            dni: c.dni as string | undefined,
          };
        }
      }

      results.push({
        ...mapCanje(r, recompensaRaw ? mapRecompensa(recompensaRaw) : undefined),
        cliente,
      });
    }

    return results;
  },

  async aprobarCanje(id: string, usuarioId?: string): Promise<void> {
    const supabase = createClient();

    const { data: canje, error: fetchError } = await supabase
      .from("canjes_puntos")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) throw new Error(fetchError.message);

    const r = canje as Record<string, unknown>;
    const cuentaPuntosId = r.cuenta_puntos_id as string;
    const puntosCanjeados = r.puntos_canjeados as number;

    const { error: updateCanje } = await supabase
      .from("canjes_puntos")
      .update({
        estado: "aprobado",
        usuario_id: usuarioId,
        actualizado_en: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateCanje) throw new Error(updateCanje.message);

    const { data: cuenta, error: cuentaError } = await supabase
      .from("cuenta_puntos")
      .select("*")
      .eq("id", cuentaPuntosId)
      .single();

    if (cuentaError) throw new Error(cuentaError.message);

    const c = cuenta as Record<string, unknown>;
    const puntosDisponibles = c.puntos_disponibles as number;
    const puntosCanjeadosTotal = c.puntos_canjeados as number;

    const { error: updateCuenta } = await supabase
      .from("cuenta_puntos")
      .update({
        puntos_disponibles: puntosDisponibles - puntosCanjeados,
        puntos_canjeados: puntosCanjeadosTotal + puntosCanjeados,
        actualizado_en: new Date().toISOString(),
      })
      .eq("id", cuentaPuntosId);

    if (updateCuenta) throw new Error(updateCuenta.message);

    const { error: txError } = await supabase
      .from("transacciones_puntos")
      .insert({
        cuenta_puntos_id: cuentaPuntosId,
        canje_id: id,
        tipo: "canje",
        puntos: -puntosCanjeados,
        saldo_anterior: puntosDisponibles,
        saldo_nuevo: puntosDisponibles - puntosCanjeados,
        descripcion: `Canje de ${puntosCanjeados} puntos aprobado`,
      });

    if (txError) throw new Error(txError.message);
  },

  async rechazarCanje(id: string, observaciones?: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
      .from("canjes_puntos")
      .update({
        estado: "rechazado",
        observaciones: observaciones ?? null,
        actualizado_en: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw new Error(error.message);
  },

  async remove(id: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
      .from("recompensas_puntos")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
  },
};
