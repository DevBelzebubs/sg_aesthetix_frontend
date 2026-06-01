import { createClient } from "@/lib/supabase/client";
import type { WelcomeReward, CuentaPuntos, TransaccionPuntos } from "@/types/reward";

const WELCOME_POINTS = 50;

export const RewardsService = {
  async claimBirthdayReward(clienteId: string, fechaNacimiento: string): Promise<WelcomeReward | null> {
    const supabase = createClient();

    const today = new Date();
    const nacimiento = new Date(fechaNacimiento);

    if (
      today.getDate() !== nacimiento.getDate() ||
      today.getMonth() !== nacimiento.getMonth()
    ) {
      return null;
    }

    const year = today.getFullYear();

    const { data: cuenta, error: findError } = await supabase
      .from("cuenta_puntos")
      .select("*")
      .eq("cliente_id", clienteId)
      .maybeSingle();

    if (findError) throw new Error(findError.message);

    let cuentaId: string;
    let puntosDisponibles: number;
    let puntosAcumulados: number;

    if (cuenta) {
      const record = cuenta as Record<string, unknown>;
      cuentaId = record.id as string;
      puntosDisponibles = record.puntos_disponibles as number;
      puntosAcumulados = record.puntos_acumulados as number;
    } else {
      return null;
    }

    const { data: recibido } = await supabase
      .from("transacciones_puntos")
      .select("id")
      .eq("cuenta_puntos_id", cuentaId)
      .eq("tipo", "cumpleaños")
      .gte("creado_en", `${year}-01-01`)
      .lte("creado_en", `${year}-12-31`)
      .maybeSingle();

    if (recibido) return null;

    const BIRTHDAY_POINTS = 30;

    const { error: txError } = await supabase
      .from("transacciones_puntos")
      .insert({
        cuenta_puntos_id: cuentaId,
        tipo: "cumpleaños",
        puntos: BIRTHDAY_POINTS,
        saldo_anterior: puntosDisponibles,
        saldo_nuevo: puntosDisponibles + BIRTHDAY_POINTS,
        descripcion: `¡Feliz cumpleaños! Has recibido ${BIRTHDAY_POINTS} puntos de regalo.`,
      });

    if (txError) throw new Error(txError.message);

    const { error: updateError } = await supabase
      .from("cuenta_puntos")
      .update({
        puntos_disponibles: puntosDisponibles + BIRTHDAY_POINTS,
        puntos_acumulados: puntosAcumulados + BIRTHDAY_POINTS,
        actualizado_en: new Date().toISOString(),
      })
      .eq("id", cuentaId);

    if (updateError) throw new Error(updateError.message);

    return {
      puntos: BIRTHDAY_POINTS,
      saldoNuevo: puntosDisponibles + BIRTHDAY_POINTS,
      message: `¡Feliz cumpleaños! Has recibido ${BIRTHDAY_POINTS} puntos de regalo.`,
    };
  },

  async claimWelcomeReward(clienteId: string): Promise<WelcomeReward> {
    const supabase = createClient();

    const { data: cuentaExistente, error: findError } = await supabase
      .from("cuenta_puntos")
      .select("*")
      .eq("cliente_id", clienteId)
      .maybeSingle();

    if (findError) throw new Error(findError.message);

    let cuentaId: string;
    let puntosDisponibles: number;
    let puntosAcumulados: number;

    if (cuentaExistente) {
      const record = cuentaExistente as Record<string, unknown>;
      cuentaId = record.id as string;
      puntosDisponibles = record.puntos_disponibles as number;
      puntosAcumulados = record.puntos_acumulados as number;
    } else {
      const { data: newCuenta, error: createError } = await supabase
        .from("cuenta_puntos")
        .insert({
          cliente_id: clienteId,
          puntos_disponibles: 0,
          puntos_acumulados: 0,
          puntos_canjeados: 0,
        })
        .select()
        .single();

      if (createError) throw new Error(createError.message);

      const record = newCuenta as Record<string, unknown>;
      cuentaId = record.id as string;
      puntosDisponibles = 0;
      puntosAcumulados = 0;
    }

    const { error: txError } = await supabase
      .from("transacciones_puntos")
      .insert({
        cuenta_puntos_id: cuentaId,
        tipo: "bienvenida",
        puntos: WELCOME_POINTS,
        saldo_anterior: puntosDisponibles,
        saldo_nuevo: puntosDisponibles + WELCOME_POINTS,
        descripcion: "Puntos de bienvenida por registro vía promoción",
      });

    if (txError) throw new Error(txError.message);

    const { error: updateError } = await supabase
      .from("cuenta_puntos")
      .update({
        puntos_disponibles: puntosDisponibles + WELCOME_POINTS,
        puntos_acumulados: puntosAcumulados + WELCOME_POINTS,
        actualizado_en: new Date().toISOString(),
      })
      .eq("id", cuentaId);

    if (updateError) throw new Error(updateError.message);

    return {
      puntos: WELCOME_POINTS,
      saldoNuevo: puntosDisponibles + WELCOME_POINTS,
      message: `¡Bienvenido! Has recibido ${WELCOME_POINTS} puntos de regalo.`,
    };
  },

  async ensureCuenta(clienteId: string): Promise<{ cuentaId: string; puntosDisponibles: number; puntosAcumulados: number }> {
    const supabase = createClient();

    const { data: cuenta } = await supabase
      .from("cuenta_puntos")
      .select("*")
      .eq("cliente_id", clienteId)
      .maybeSingle();

    if (cuenta) {
      const r = cuenta as Record<string, unknown>;
      return {
        cuentaId: r.id as string,
        puntosDisponibles: r.puntos_disponibles as number,
        puntosAcumulados: r.puntos_acumulados as number,
      };
    }

    const { data: newCuenta, error: createError } = await supabase
      .from("cuenta_puntos")
      .insert({
        cliente_id: clienteId,
        puntos_disponibles: 0,
        puntos_acumulados: 0,
        puntos_canjeados: 0,
      })
      .select()
      .single();

    if (createError) throw new Error(createError.message);

    const nr = newCuenta as Record<string, unknown>;
    return {
      cuentaId: nr.id as string,
      puntosDisponibles: 0,
      puntosAcumulados: 0,
    };
  },

  async addPoints(clienteId: string, puntos: number, tipo: string, descripcion: string): Promise<void> {
    const supabase = createClient();
    const { cuentaId, puntosDisponibles, puntosAcumulados } = await this.ensureCuenta(clienteId);

    const { error: txError } = await supabase
      .from("transacciones_puntos")
      .insert({
        cuenta_puntos_id: cuentaId,
        tipo,
        puntos,
        saldo_anterior: puntosDisponibles,
        saldo_nuevo: puntosDisponibles + puntos,
        descripcion,
      });

    if (txError) throw new Error(txError.message);

    const { error: updateError } = await supabase
      .from("cuenta_puntos")
      .update({
        puntos_disponibles: puntosDisponibles + puntos,
        puntos_acumulados: puntosAcumulados + puntos,
        actualizado_en: new Date().toISOString(),
      })
      .eq("id", cuentaId);

    if (updateError) throw new Error(updateError.message);
  },

  async addPointsForCompletedAppointment(reservaId: string): Promise<void> {
    const supabase = createClient();

    const { data: reserva, error: rError } = await supabase
      .from("reservas")
      .select("cliente_id, servicio_id")
      .eq("id", reservaId)
      .single();

    if (rError) throw new Error(rError.message);
    if (!reserva) throw new Error("Reserva no encontrada");

    const r = reserva as Record<string, unknown>;
    const clienteId = r.cliente_id as string;
    const servicioId = r.servicio_id as string;

    const { data: servicio } = await supabase
      .from("servicios")
      .select("precio")
      .eq("id", servicioId)
      .single();

    const precio = (servicio ? (servicio as Record<string, unknown>).precio : 30) as number;
    const puntos = Math.max(1, Math.floor(precio));

    await this.addPoints(clienteId, puntos, "reserva", `Puntos por corte completado (S/${precio})`);
  },

  async getCuentaPuntosByClienteId(clienteId: string): Promise<CuentaPuntos | null> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("cuenta_puntos")
      .select("*")
      .eq("cliente_id", clienteId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    const row = data as Record<string, unknown>;
    return {
      id: row.id as string,
      clienteId: row.cliente_id as string,
      puntosDisponibles: row.puntos_disponibles as number,
      puntosAcumulados: row.puntos_acumulados as number,
      puntosCanjeados: row.puntos_canjeados as number,
    };
  },

  async getTransacciones(cuentaPuntosId: string): Promise<TransaccionPuntos[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("transacciones_puntos")
      .select("*")
      .eq("cuenta_puntos_id", cuentaPuntosId)
      .order("creado_en", { ascending: false })
      .limit(10);

    if (error) throw new Error(error.message);

    return (data ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: r.id as string,
        cuentaPuntosId: r.cuenta_puntos_id as string,
        ventaId: r.venta_id as string | undefined,
        canjeId: r.canje_id as string | undefined,
        tipo: r.tipo as string,
        puntos: r.puntos as number,
        saldoAnterior: r.saldo_anterior as number,
        saldoNuevo: r.saldo_nuevo as number,
        descripcion: r.descripcion as string | undefined,
        creadoEn: r.creado_en as string | undefined,
      };
    });
  },
};
