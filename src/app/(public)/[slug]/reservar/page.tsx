import Link from "next/link";
import { BookingForm } from "@/components/public/booking-form";
import { createServerSupabase } from "@/lib/supabase/server";

export const revalidate = 60;

type ReservarPageProps = {
  params: Promise<{ slug: string }>;
};

function generateTimeSlots(startHour = 9, endHour = 19): string[] {
  const slots: string[] = [];
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += 15) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
}

const availableSlots = generateTimeSlots();

const weekdayShort = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const weekdayLong = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const monthShort = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const monthLong = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function buildAvailableDates(baseDate: Date, totalDays: number) {
  const dates = [];
  for (let index = 0; index < totalDays; index++) {
    const currentDate = new Date(baseDate);
    currentDate.setDate(baseDate.getDate() + index);
    const weekdayIndex = currentDate.getDay();
    const monthIndex = currentDate.getMonth();
    const day = currentDate.getDate();
    dates.push({
      value: currentDate.toISOString().slice(0, 10),
      weekday: weekdayShort[weekdayIndex],
      day: String(day).padStart(2, "0"),
      month: monthShort[monthIndex],
      monthLabel: `${monthLong[monthIndex]} ${currentDate.getFullYear()}`,
      label: `${capitalize(weekdayLong[weekdayIndex])} ${day} de ${monthLong[monthIndex]}`,
    });
  }
  return dates;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default async function ReservarPage({ params }: ReservarPageProps) {
  const { slug } = await params;
  const supabase = await createServerSupabase();

  const today = new Date();
  const availableDates = buildAvailableDates(today, 10);
  const dateStrs = availableDates.map((d) => d.value);

  const [{ data: serviciosData }, { data: usuariosData }, { data: reservasData }] = await Promise.all([
    supabase
      .from("servicios")
      .select("id, nombre, precio, duracion_minutos, imagen_url")
      .eq("esta_activo", true)
      .order("precio", { ascending: true }),
    supabase
      .from("usuarios")
      .select("id, nombres, apellidos, rol, imagen_url")
      .in("rol", ["admin", "empleado"])
      .eq("esta_activo", true),
    supabase
      .from("reservas")
      .select("usuario_id, fecha_reserva, hora_inicio, hora_fin")
      .in("fecha_reserva", dateStrs)
      .neq("estado", "cancelada"),
  ]);

  const services = (serviciosData ?? []).map((s) => ({
    id: s.id,
    name: s.nombre,
    duration: `${s.duracion_minutos} min`,
    durationMinutes: s.duracion_minutos,
    price: `S/${s.precio}`,
    imageUrl: (s as Record<string, unknown>).imagen_url as string | null,
  }));

  const barbers = (usuariosData ?? []).map((u) => ({
    id: u.id,
    name: u.nombres,
    role: u.rol === "admin" ? "Master Barber" : "Barbero",
    imageUrl: (u as Record<string, unknown>).imagen_url as string | null,
  }));

  const existingReservations = (reservasData ?? []).map((r) => ({
    empleadoId: r.usuario_id,
    fecha: r.fecha_reserva,
    horaInicio: r.hora_inicio,
    horaFin: r.hora_fin,
  }));

  return (
    <section className="space-y-6 pt-8">
      <BookingForm
        businessName={slug}
        services={services}
        barbers={barbers}
        availableDates={availableDates}
        availableSlots={availableSlots}
        existingReservations={existingReservations}
      />

      <div className="pt-8 pb-12">
        <Link
          href={`/${slug}`}
          className="inline-flex items-center gap-2 border border-[var(--border)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] transition hover:border-[var(--hover)] hover:text-[var(--hover)]"
        >
          Volver al inicio
        </Link>
      </div>
    </section>
  );
}