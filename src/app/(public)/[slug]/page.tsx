"use client";

import Link from "next/link";
import { useState } from "react";

type LandingPageProps = {
  slug: string;
};

const services = [
  {
    name: "Corte clásico",
    duration: "45 min",
    price: "$25",
    description: "Limpieza de contornos, acabado con producto y asesoría de estilo.",
  },
  {
    name: "Corte + barba",
    duration: "60 min",
    price: "$35",
    description: "Corte completo con perfilado de barba y toalla caliente.",
  },
  {
    name: "Afeitado premium",
    duration: "30 min",
    price: "$15",
    description: "Afeitado tradicional con crema premium y loción final.",
  },
];

const team = [
  { name: "Alejandro", role: "Master Barber" },
  { name: "Matias", role: "Fade Specialist" },
  { name: "Sergio", role: "Beard Artist" },
];

const availableSlots = ["10:00", "11:30", "13:00", "15:30", "17:00", "18:30"];

const testimonials = [
  {
    name: "Carlos M.",
    label: "Cliente habitual",
    quote:
      "La mejor barbería del barrio. Siempre salgo impecable, el nivel de detalle es increíble.",
  },
  {
    name: "Fernando Alfaro",
    label: "Cliente For Men Castilla",
    quote:
      "La atención al cliente es otro nivel. Desde el saludo cálido hasta el cuidado en cada paso del proceso, se nota que se esfuerzan por la excelencia.",
  },
  {
    name: "Julián R.",
    label: "Cliente frecuente",
    quote:
      "Excelente atención, ambiente cuidado y puntualidad total. No voy a ningún otro lado.",
  },
];

// Navaja decorativa SVG
function RazorDecor() {
  return (
    <svg
      viewBox="0 0 340 200"
      className="absolute bottom-0 right-0 w-72 md:w-96 opacity-[0.07] pointer-events-none select-none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Hoja de la navaja */}
      <path
        d="M10 170 Q90 10 290 20 L300 50 Q100 55 45 185 Z"
        fill="white"
      />
      <path
        d="M10 170 Q90 10 290 20"
        stroke="white"
        strokeWidth="2"
        fill="none"
      />
      {/* Mango */}
      <rect x="270" y="18" width="60" height="26" rx="3" fill="white" opacity="0.8" />
      <line x1="285" y1="24" x2="285" y2="38" stroke="black" strokeWidth="1.5" strokeOpacity="0.4" />
      <line x1="297" y1="24" x2="297" y2="38" stroke="black" strokeWidth="1.5" strokeOpacity="0.4" />
      <line x1="309" y1="24" x2="309" y2="38" stroke="black" strokeWidth="1.5" strokeOpacity="0.4" />
      {/* Tornillo mango */}
      <circle cx="322" cy="31" r="4" fill="white" opacity="0.5" />
    </svg>
  );
}

function TestimonialCarousel() {
  const [current, setCurrent] = useState(0);

  const prev = () =>
    setCurrent((c) => (c === 0 ? testimonials.length - 1 : c - 1));
  const next = () =>
    setCurrent((c) => (c === testimonials.length - 1 ? 0 : c + 1));

  const t = testimonials[current];

  return (
    <div
      className="relative bg-neutral-950 overflow-hidden"
      style={{ minHeight: 320 }}
    >
      <RazorDecor />

      <div className="relative z-10 px-8 py-14 md:px-16 md:py-16 max-w-2xl">
        {/* Avatar circular */}
        <div
          className="mb-7 h-16 w-16 overflow-hidden border-2 border-white/20 bg-neutral-800 flex items-center justify-center"
          style={{ borderRadius: "50%" }}
        >
          <span className="text-white text-xl font-black">
            {t.name.charAt(0)}
          </span>
        </div>

        {/* Cita */}
        <p className="text-white/80 text-base md:text-lg leading-relaxed font-light">
          &ldquo;{t.quote}&rdquo;
        </p>

        {/* Autor */}
        <p className="mt-6 text-white font-black uppercase tracking-wide text-sm">
          {t.name}
        </p>
        <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/30">
          {t.label}
        </p>

        {/* Controles */}
        <div className="mt-8 flex items-center gap-5">
          {/* Dots */}
          <div className="flex items-center gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 transition-all duration-300 ${
                  i === current ? "w-6 bg-white" : "w-1.5 bg-white/25 hover:bg-white/50"
                }`}
                aria-label={`Testimonio ${i + 1}`}
              />
            ))}
          </div>

          {/* Flechas */}
          <div className="flex gap-1.5">
            <button
              onClick={prev}
              className="h-8 w-8 border border-white/20 text-white/50 hover:border-white/60 hover:text-white transition-all flex items-center justify-center text-sm"
              aria-label="Anterior"
            >
              ←
            </button>
            <button
              onClick={next}
              className="h-8 w-8 border border-white/20 text-white/50 hover:border-white/60 hover:text-white transition-all flex items-center justify-center text-sm"
              aria-label="Siguiente"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────

export default function LandingPage({ slug }: LandingPageProps) {
  // ⚠️ Reemplaza con el número real en formato internacional sin + ni espacios
  const WA_NUMBER = "5491112345678";
  const WA_MESSAGE = encodeURIComponent("Hola, quiero reservar un turno.");

  return (
    <div className="space-y-20 pb-8">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="-mx-6 -mt-10 sm:-mt-14">

        {/* MOBILE */}
        <div className="md:hidden">
          <div
            className="relative w-full overflow-hidden bg-black"
            style={{ height: "56vw", minHeight: 220 }}
          >
            <video
              autoPlay muted loop playsInline
              className="h-full w-full object-cover opacity-90"
              src="https://video.wixstatic.com/video/5d3a2a_196d0b31232e4c658ab94f9cb876282b/720p/mp4/file.mp4"
            />
            <span className="absolute bottom-3 left-3 bg-black/75 px-3 py-1.5 text-[9px] font-bold tracking-[0.18em] uppercase text-white">
              Reserva online · Sin esperas
            </span>
          </div>

          <div className="border-b border-black/10 bg-white px-6 py-8">
            <div className="mb-4 h-px w-8 bg-black" />
            <p className="mb-3 text-[9px] font-semibold tracking-[0.2em] uppercase text-neutral-400">
              San Miguel · Barbería
            </p>
            <h1 className="text-4xl font-black uppercase leading-none tracking-tight text-black">
              Redefi&shy;niendo<br />el corte
            </h1>
            <Link
              href={`/${slug}/reservar`}
              className="mt-6 inline-block bg-black px-6 py-3 text-[10px] font-bold tracking-[0.15em] uppercase text-white transition hover:opacity-75"
            >
              Reservar turno
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-px bg-black/10">
            <div className="bg-neutral-50 px-6 py-5">
              <p className="text-[9px] font-semibold tracking-[0.18em] uppercase text-neutral-400">Clientes</p>
              <p className="mt-1 text-4xl font-black tracking-tight">+2K</p>
              <p className="mt-1 text-[9px] tracking-widest uppercase text-neutral-400">Atendidos</p>
            </div>
            <div className="bg-neutral-900 px-6 py-5 text-white">
              <p className="text-[9px] font-semibold tracking-[0.18em] uppercase text-white/40">Promedio</p>
              <p className="mt-1 text-4xl font-black tracking-tight">4.9</p>
              <p className="mt-1 text-[9px] tracking-widest uppercase text-white/40">Puntuación</p>
            </div>
          </div>
        </div>

        {/* DESKTOP */}
        <div className="hidden md:block">
          <div
            className="grid gap-px bg-neutral-300"
            style={{ gridTemplateColumns: "1fr 1.6fr 1fr", gridTemplateRows: "380px 260px" }}
          >
            <div className="flex flex-col justify-end bg-white px-10 py-10">
              <div className="mb-4 h-px w-8 bg-black" />
              <p className="mb-3 text-[9px] font-semibold tracking-[0.2em] uppercase text-neutral-400">
                San Miguel · Barbería
              </p>
              <h1 className="text-5xl font-black uppercase leading-none tracking-tight text-black xl:text-6xl">
                Redefi<br />niendo<br />el corte
              </h1>
            </div>

            <div
              className="relative overflow-hidden bg-black"
              style={{ gridColumn: "2 / 4" }}
            >
              <video
                autoPlay muted loop playsInline
                className="h-full w-full object-cover opacity-90"
                src="https://video.wixstatic.com/video/5d3a2a_196d0b31232e4c658ab94f9cb876282b/720p/mp4/file.mp4"
              />
              <span className="absolute bottom-5 left-5 bg-black/80 px-4 py-2 text-[10px] font-bold tracking-[0.2em] uppercase text-white">
                Reserva online · Sin esperas
              </span>
            </div>

            <div className="flex flex-col justify-center bg-neutral-50 px-10 py-8">
              <p className="text-[9px] font-semibold tracking-[0.18em] uppercase text-neutral-400">Clientes</p>
              <p className="mt-2 text-6xl font-black leading-none tracking-tight">+2K</p>
              <p className="mt-2 text-[9px] tracking-widest uppercase text-neutral-400">Atendidos</p>
            </div>

            <div className="flex flex-col justify-center bg-neutral-900 px-10 py-8 text-white">
              <p className="text-[9px] font-semibold tracking-[0.18em] uppercase text-white/40">Promedio</p>
              <p className="mt-2 text-6xl font-black leading-none tracking-tight">4.9</p>
              <p className="mt-2 text-[9px] tracking-widest uppercase text-white/40">Puntuación</p>
            </div>

            <div className="flex flex-col justify-center bg-stone-100 px-10 py-8">
              <p className="text-[9px] font-semibold tracking-[0.18em] uppercase text-neutral-400">Horario</p>
              <p className="mt-2 text-2xl font-black uppercase tracking-tight">Lun – Sáb</p>
              <p className="mt-1 text-[9px] tracking-widest uppercase text-neutral-500">8:00 AM – 8:00 PM</p>
              <p className="mt-4 text-sm leading-relaxed text-neutral-500">
                Tres especialistas, un espacio cuidado y puntualidad garantizada.
              </p>
              <Link
                href={`/${slug}/reservar`}
                className="mt-5 inline-block bg-black px-5 py-2.5 text-[10px] font-bold tracking-[0.14em] uppercase text-white transition hover:opacity-75 w-fit"
              >
                Reservar turno
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* ── RESERVAS ─────────────────────────────────────────────────── */}
      <section
        id="reservas"
        className="grid gap-px bg-neutral-200 border border-neutral-200 lg:grid-cols-[1.2fr_1fr]"
      >
        <div className="bg-white px-8 py-10">
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
            Reservas rápidas
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">
            Agenda tu cita con una vista clara
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-neutral-500">
            Elige servicio, fecha y hora en un flujo visual más limpio y directo.
          </p>
          <div className="mt-6 grid gap-px bg-neutral-200 sm:grid-cols-3">
            {["Servicio", "Fecha", "Hora"].map((title, index) => (
              <div key={title} className="bg-neutral-50 px-5 py-4">
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                  Paso {index + 1}
                </p>
                <p className="mt-2 text-sm font-bold uppercase tracking-tight">{title}</p>
              </div>
            ))}
          </div>
          <Link
            href={`/${slug}/reservar`}
            className="mt-6 inline-block bg-[var(--tenant-primary)] px-6 py-3 text-[10px] font-bold tracking-[0.15em] uppercase text-white transition hover:opacity-75"
          >
            Empezar reserva
          </Link>
        </div>

        <aside className="bg-neutral-50 px-8 py-10">
          <p className="text-sm font-bold uppercase tracking-tight">Hoy hay disponibilidad</p>
          <p className="mt-1 text-[9px] uppercase tracking-widest text-neutral-400">Horarios de ejemplo</p>
          <div className="mt-5 grid grid-cols-3 gap-px bg-neutral-200">
            {availableSlots.map((slot, index) => (
              <span
                key={slot}
                className={`px-2 py-3 text-center text-xs font-bold tracking-wide ${
                  index % 2 === 0
                    ? "bg-white text-black"
                    : "bg-[var(--tenant-primary)] text-white"
                }`}
              >
                {slot}
              </span>
            ))}
          </div>
          <p className="mt-4 text-[10px] text-neutral-400">
            Los horarios reales se verán al conectar la disponibilidad del negocio.
          </p>
        </aside>
      </section>


      {/* ── SERVICIOS ────────────────────────────────────────────────── */}
      <section id="servicios" className="space-y-6">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-neutral-400">Servicios</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">Lo más solicitado</h2>
        </div>
        <div className="grid gap-px bg-neutral-200 md:grid-cols-3">
          {services.map((service, index) => (
            <article
              key={service.name}
              className={`p-8 transition hover:-translate-y-px ${
                index === 1 ? "bg-neutral-900 text-white" : "bg-white"
              }`}
            >
              <div className="mb-6 flex items-start justify-between">
                <h3 className="text-base font-bold uppercase tracking-tight">{service.name}</h3>
                <span className={`text-[9px] font-semibold uppercase tracking-widest ${
                  index === 1 ? "text-white/40" : "text-neutral-400"
                }`}>
                  {service.duration}
                </span>
              </div>
              <p className={`text-sm leading-relaxed ${
                index === 1 ? "text-white/60" : "text-neutral-500"
              }`}>
                {service.description}
              </p>
              <p className={`mt-6 text-3xl font-black tracking-tight ${
                index === 1 ? "text-white" : "text-[var(--tenant-primary)]"
              }`}>
                {service.price}
              </p>
            </article>
          ))}
        </div>
      </section>


      {/* ── EQUIPO ───────────────────────────────────────────────────── */}
      <section id="equipo" className="space-y-6">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-neutral-400">Equipo</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">Profesionales de la casa</h2>
        </div>
        <div className="grid gap-px bg-neutral-200 sm:grid-cols-2 md:grid-cols-3">
          {team.map((member, index) => (
            <article
              key={member.name}
              className={`p-8 ${index === 1 ? "bg-neutral-900 text-white" : "bg-white"}`}
            >
              <div className={`mb-5 inline-flex h-10 w-10 items-center justify-center text-sm font-black ${
                index === 1 ? "bg-white text-neutral-900" : "bg-[var(--tenant-primary)] text-white"
              }`}>
                {member.name.charAt(0)}
              </div>
              <h3 className="text-base font-bold uppercase tracking-tight">{member.name}</h3>
              <p className={`mt-1 text-[9px] uppercase tracking-widest ${
                index === 1 ? "text-white/40" : "text-neutral-400"
              }`}>
                {member.role}
              </p>
              <p className={`mt-4 text-sm leading-relaxed ${
                index === 1 ? "text-white/60" : "text-neutral-500"
              }`}>
                Especialista en cortes modernos, perfiles limpios y acabados que respetan tu estilo.
              </p>
            </article>
          ))}
        </div>
      </section>


      {/* ── TESTIMONIOS — CARRUSEL ───────────────────────────────────── */}
      <section className="space-y-6">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
            Testimonios
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">
            Lo que dicen nuestros clientes
          </h2>
        </div>
        <TestimonialCarousel />
      </section>


      {/* ── CTA FINAL ────────────────────────────────────────────────── */}
      <section className="bg-neutral-900 p-8 sm:p-12">
        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/30">
          Reserva tu lugar
        </p>
        <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white">
          ¿Listo para tu<br />próximo look?
        </h2>
        <p className="mt-3 max-w-md text-sm text-white/50">
          Agenda ahora y asegura tu horario preferido.
        </p>
        <Link
          href={`/${slug}/reservar`}
          className="mt-6 inline-block bg-[var(--tenant-primary)] px-7 py-3 text-[10px] font-bold tracking-[0.15em] uppercase text-white transition hover:opacity-75"
        >
          Reservar mi turno
        </Link>
      </section>


      {/* ── BOTÓN WHATSAPP FLOTANTE ──────────────────────────────────── */}
      {/*
        ⚠️  Cambia WA_NUMBER por el número real del negocio
            Formato: código de país + número, sin + ni espacios
            Ejemplo Argentina: 5491112345678
            Ejemplo España:    34612345678
      */}
      <a
        href={`https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center bg-[#25D366] shadow-lg transition-transform hover:scale-105"
        aria-label="Contactar por WhatsApp"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-7 w-7 fill-white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.6 12.6 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
        </svg>
      </a>

    </div>
  );
}