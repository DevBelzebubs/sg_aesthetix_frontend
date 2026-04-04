import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { BookingForm } from "@/components/public/booking-form";

type ReservarPageProps = {
  params: Promise<{ slug: string }>;
};

const services = [
  { name: "Corte clasico", duration: "45 min", price: "$18" },
  { name: "Corte + barba", duration: "60 min", price: "$25" },
  { name: "Afeitado premium", duration: "30 min", price: "$15" },
];

const barbers = [
  { name: "Alejandro", role: "Master Barber" },
  { name: "Matias", role: "Fade Specialist" },
  { name: "Sergio", role: "Beard Artist" },
];

const availableSlots = ["10:00", "11:30", "13:00", "15:30", "17:00", "18:30"];

const weekdayShort = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
const weekdayLong = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
const monthShort = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];
const monthLong = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function buildAvailableDates(baseDate: Date, totalDays: number) {
  const dates = [];

  for (let index = 0; index < totalDays; index += 1) {
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
  noStore();
  const { slug } = await params;
  const today = new Date();
  const availableDates = buildAvailableDates(today, 12);

  return (
    <section className="space-y-6">
      <BookingForm
        businessName={slug}
        services={services}
        barbers={barbers}
        availableDates={availableDates}
        availableSlots={availableSlots}
      />

      <Link
        href={`/${slug}`}
        className="inline-flex rounded-full border border-black/15 px-5 py-2.5 text-sm font-medium transition hover:bg-black/5"
      >
        Volver al inicio
      </Link>
    </section>
  );
}
