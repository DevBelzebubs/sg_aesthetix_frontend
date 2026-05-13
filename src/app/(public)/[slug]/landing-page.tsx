"use client";

import Link from "next/link";
import { useState } from "react";

type Service = {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  duracion_minutos: number;
};

type LandingPageProps = {
  slug: string;
  services: Service[];
};

const locations = [
  {
    name: "San Borja",
    address: "Av. Aviación 3464 · San Borja",
    hours: "Lun – Sáb · 8:00 AM – 8:00 PM",
    phone: "+51 999 999 999",
    mapsUrl: "https://maps.google.com/?q=Av.+Aviación+3464,+San+Borja,+Lima",
    lat: -12.0943,
    lng: -77.0073,
  },
];

const testimonials = [
  {
    name: "Carlos M.",
    label: "Cliente habitual",
    quote: "La mejor barbería del barrio. Siempre salgo impecable, el nivel de detalle es increíble.",
  },
  {
    name: "Fernando Alfaro",
    label: "Cliente For Men Castilla",
    quote: "La atención al cliente es otro nivel. Desde el saludo cálido hasta el cuidado en cada paso del proceso, se nota que se esfuerzan por la excelencia.",
  },
  {
    name: "Julián R.",
    label: "Cliente frecuente",
    quote: "Excelente atención, ambiente cuidado y puntualidad total. No voy a ningún otro lado.",
  },
];

function RazorDecor() {
  return (
    <svg viewBox="0 0 340 200" className="absolute bottom-0 right-0 w-72 md:w-96 opacity-[0.07] pointer-events-none select-none" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 170 Q90 10 290 20 L300 50 Q100 55 45 185 Z" fill="white" />
      <path d="M10 170 Q90 10 290 20" stroke="white" strokeWidth="2" fill="none" />
      <rect x="270" y="18" width="60" height="26" rx="3" fill="white" opacity="0.8" />
      <line x1="285" y1="24" x2="285" y2="38" stroke="black" strokeWidth="1.5" strokeOpacity="0.4" />
      <line x1="297" y1="24" x2="297" y2="38" stroke="black" strokeWidth="1.5" strokeOpacity="0.4" />
      <line x1="309" y1="24" x2="309" y2="38" stroke="black" strokeWidth="1.5" strokeOpacity="0.4" />
      <circle cx="322" cy="31" r="4" fill="white" opacity="0.5" />
    </svg>
  );
}

// Decoración de esquina verde
function GreenCorner({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute w-12 h-12 ${className}`}>
      <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: "#324730" }} />
      <div className="absolute top-0 left-0 h-full w-[2px]" style={{ background: "#324730" }} />
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-[2px] w-6 rounded-full" style={{ background: "#324730" }} />
      <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-neutral-400">{children}</p>
      <div className="h-[2px] w-6 rounded-full" style={{ background: "#324730" }} />
    </div>
  );
}

function TestimonialCarousel() {
  const [current, setCurrent] = useState(0);
  const prev = () => setCurrent((c) => (c === 0 ? testimonials.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === testimonials.length - 1 ? 0 : c + 1));
  const t = testimonials[current];

  return (
    <div className="relative bg-neutral-950 overflow-hidden" style={{ minHeight: 320 }}>
      {/* Acento verde lateral */}
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: "#324730" }} />
      <RazorDecor />
      <div className="relative z-10 px-8 py-14 md:px-16 md:py-16 max-w-2xl">
        <div className="mb-7 h-16 w-16 overflow-hidden border-2 flex items-center justify-center" style={{ borderRadius: "50%", borderColor: "#324730" }}>
          <span className="text-white text-xl font-black">{t.name.charAt(0)}</span>
        </div>
        <p className="text-white/80 text-base md:text-lg leading-relaxed font-light">&ldquo;{t.quote}&rdquo;</p>
        <p className="mt-6 text-white font-black uppercase tracking-wide text-sm">{t.name}</p>
        <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/30">{t.label}</p>
        <div className="mt-8 flex items-center gap-5">
          <div className="flex items-center gap-2">
            {testimonials.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className="h-1.5 transition-all duration-300"
                style={{ width: i === current ? 24 : 6, background: i === current ? "#324730" : "rgba(255,255,255,0.25)" }}
                aria-label={`Testimonio ${i + 1}`} />
            ))}
          </div>
          <div className="flex gap-1.5">
            <button onClick={prev} className="h-8 w-8 border border-white/20 text-white/50 hover:text-white transition-all flex items-center justify-center text-sm" style={{ borderColor: "#32473040" }} aria-label="Anterior">←</button>
            <button onClick={next} className="h-8 w-8 text-white/50 hover:text-white transition-all flex items-center justify-center text-sm border" style={{ borderColor: "#32473040" }} aria-label="Siguiente">→</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage({ slug, services }: LandingPageProps) {
  const WA_NUMBER = "5491112345678";
  const WA_MESSAGE = encodeURIComponent("Hola, quiero reservar un turno.");

  return (
    <div className="space-y-20 pb-8">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="-mx-6 -mt-10 sm:-mt-14">
        {/* MOBILE */}
        <div className="md:hidden">
          <div className="relative w-full overflow-hidden bg-black" style={{ height: "56vw", minHeight: 220 }}>
            <video autoPlay muted loop playsInline className="h-full w-full object-cover opacity-90"
              src="https://res.cloudinary.com/dp1vgjhsq/video/upload/v1777105289/WhatsApp_Video_2026-04-25_at_3.11.00_AM_1_aroels.mp4" />
            <span className="absolute bottom-3 left-3 bg-black/75 px-3 py-1.5 text-[9px] font-bold tracking-[0.18em] uppercase text-white">
              Reserva online · Sin esperas
            </span>
            {/* Acento verde en esquina del video */}
            <div className="absolute top-0 right-0 w-8 h-8">
              <div className="absolute top-0 right-0 w-full h-[3px]" style={{ background: "#324730" }} />
              <div className="absolute top-0 right-0 h-full w-[3px]" style={{ background: "#324730" }} />
            </div>
          </div>
          <div className="border-b bg-white px-6 py-8" style={{ borderColor: "#32473020" }}>
            {/* Línea verde en lugar de la negra */}
            <div className="mb-4 h-[3px] w-10 rounded-full" style={{ background: "#324730" }} />
            <p className="mb-3 text-[9px] font-semibold tracking-[0.2em] uppercase text-neutral-400">San Miguel · Barbería</p>
            <h1 className="text-4xl font-black uppercase leading-none tracking-tight text-black">Redefi&shy;niendo<br />el corte</h1>
            <Link href={`/${slug}/reservar`} className="mt-6 inline-block px-6 py-3 text-[10px] font-bold tracking-[0.15em] uppercase text-white transition hover:opacity-75" style={{ background: "#324730" }}>
              Reservar turno
            </Link>
          </div>
          <div className="w-full bg-white" style={{ height: 160 }}>
            <img src="https://res.cloudinary.com/dxuk9bogw/image/upload/v1777198980/Dise%C3%B1o_sin_t%C3%ADtulo_3_o2ipsz.png" alt="For Men Castilla" style={{ height: 160, width: "100%", objectFit: "contain" }} />
          </div>
        </div>

        {/* DESKTOP */}
        <div className="hidden md:block">
          <div className="grid gap-px" style={{ gridTemplateColumns: "1fr 1.6fr 1fr", gridTemplateRows: "380px 260px", background: "#324730" }}>
            <div className="relative flex flex-col justify-end bg-white px-10 py-10">
              <GreenCorner className="top-4 left-4" />
              {/* Línea verde */}
              <div className="mb-4 h-[3px] w-10 rounded-full" style={{ background: "#324730" }} />
              <p className="mb-3 text-[9px] font-semibold tracking-[0.2em] uppercase" style={{ color: "#324730" }}>San Miguel · Barbería</p>
              <h1 className="text-5xl font-black uppercase leading-none tracking-tight text-black xl:text-6xl">Redefi<br />niendo<br />el corte</h1>
            </div>
            <div className="relative overflow-hidden bg-black" style={{ gridColumn: "2 / 4" }}>
              <video autoPlay muted loop playsInline className="h-full w-full object-cover opacity-94"
                src="https://res.cloudinary.com/dp1vgjhsq/video/upload/v1777105289/WhatsApp_Video_2026-04-25_at_3.11.00_AM_1_aroels.mp4" />
              <span className="absolute bottom-5 left-5 bg-black/80 px-4 py-2 text-[10px] font-bold tracking-[0.2em] uppercase text-white">Reserva online · Sin esperas</span>
            </div>
            <div className="overflow-hidden bg-white flex items-center justify-center" style={{ gridColumn: "1 / 2", gridRow: "2 / 3" }}>
              <img src="https://res.cloudinary.com/dxuk9bogw/image/upload/v1777198980/Dise%C3%B1o_sin_t%C3%ADtulo_3_o2ipsz.png" alt="For Men Castilla" style={{ height: 160, width: 160, objectFit: "contain" }} />
            </div>
            <div className="flex flex-col justify-center bg-neutral-900 px-10 py-8 text-white">
              <p className="text-[9px] font-semibold tracking-[0.18em] uppercase" style={{ color: "#324730" }}>Promedio</p>
              <p className="mt-2 text-6xl font-black leading-none tracking-tight">4.9</p>
              <p className="mt-2 text-[9px] tracking-widest uppercase text-white/40">Puntuación</p>
            </div>
            <div className="relative flex flex-col justify-center bg-stone-100 px-10 py-8">
              <GreenCorner className="bottom-4 right-4 rotate-180" />
              <p className="text-[9px] font-semibold tracking-[0.18em] uppercase" style={{ color: "#324730" }}>Horario</p>
              <p className="mt-2 text-2xl font-black uppercase tracking-tight">Lun – Sáb</p>
              <p className="mt-1 text-[9px] tracking-widest uppercase text-neutral-500">8:00 AM – 8:00 PM</p>
              <p className="mt-4 text-sm leading-relaxed text-neutral-500">Tres especialistas, un espacio cuidado y puntualidad garantizada.</p>
              <Link href={`/${slug}/reservar`} className="mt-5 inline-block px-5 py-2.5 text-[10px] font-bold tracking-[0.14em] uppercase text-white transition hover:opacity-75 w-fit" style={{ background: "#324730" }}>
                Reservar turno
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICIOS ────────────────────────────────────────────────── */}
      <section id="servicios" className="space-y-6">
        <div className="space-y-2">
          <SectionLabel>Servicios</SectionLabel>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">Lo más solicitado</h2>
        </div>
        <div className="grid gap-px md:grid-cols-2" style={{ background: "#324730" }}>
          {services.map((service, index) => (
            <article key={service.id} className={`relative p-8 transition hover:-translate-y-px ${index === 1 ? "bg-neutral-900 text-white" : "bg-white"}`}>
              {index === 0 && <GreenCorner className="top-4 right-66" />}
              <div className="mb-6 flex items-start justify-between">
                <h3 className="text-base font-bold uppercase tracking-tight">{service.nombre}</h3>
                <span className={`text-[9px] font-semibold uppercase tracking-widest ${index === 1 ? "text-white/40" : "text-neutral-400"}`}>
                  {service.duracion_minutos} min
                </span>
              </div>
              <p className={`text-sm leading-relaxed ${index === 1 ? "text-white/60" : "text-neutral-500"}`}>
                {service.descripcion}
              </p>
              <p className="mt-6 text-3xl font-black tracking-tight" style={{ color: index === 1 ? "white" : "#324730" }}>
                S/{service.precio}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ── NUESTROS LOCALES ─────────────────────────────────────────── */}
      <section id="locales" className="-mx-6 space-y-0">
        <div className="px-6 pb-6 space-y-2">
          <SectionLabel>Locales</SectionLabel>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">Nuestro local</h2>
        </div>
        <div className="grid gap-px md:grid-cols-[1fr_1.4fr]" style={{ background: "#324730" }}>
          <div className="bg-white">
            {locations.map((loc, i) => (
              <div key={loc.name} className={`p-8 ${i === 0 ? "bg-neutral-900 text-white" : "bg-white"}`}>
                <div className={`mb-5 inline-flex h-7 w-7 items-center justify-center text-xs font-black`} style={{ background: i === 0 ? "#324730" : "#1a1a1a", color: "white" }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight">{loc.name}</h3>
                <p className={`mt-2 text-[9px] font-semibold uppercase tracking-widest ${i === 0 ? "text-white/40" : "text-neutral-400"}`}>{loc.address}</p>
                <div className="mt-6 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className={`text-[9px] font-semibold uppercase tracking-widest ${i === 0 ? "text-white/30" : "text-neutral-400"}`}>Horario</span>
                    <span className={`text-xs font-bold uppercase tracking-tight ${i === 0 ? "text-white" : "text-black"}`}>{loc.hours}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[9px] font-semibold uppercase tracking-widest ${i === 0 ? "text-white/30" : "text-neutral-400"}`}>Tel</span>
                    <a href={`tel:${loc.phone.replace(/\s/g, "")}`} className={`text-xs font-bold uppercase tracking-tight transition hover:opacity-70 ${i === 0 ? "text-white" : "text-black"}`}>{loc.phone}</a>
                  </div>
                </div>
                <div className="mt-8 flex items-center gap-3">
                  <a href={loc.mapsUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-block border px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] transition hover:opacity-75"
                    style={{ borderColor: i === 0 ? "#32473060" : "#324730", color: i === 0 ? "white" : "#324730" }}>
                    Ver en mapa
                  </a>
                  <Link href={`/${slug}/reservar`}
                    className="inline-block px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] transition hover:opacity-75 text-white"
                    style={{ background: "#324730" }}>
                    Reservar
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="relative min-h-[320px] overflow-hidden bg-neutral-200 md:min-h-0">
            <iframe
              title="Ubicación del local"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${locations[0].lng - 0.004},${locations[0].lat - 0.003},${locations[0].lng + 0.004},${locations[0].lat + 0.003}&layer=mapnik&marker=${locations[0].lat},${locations[0].lng}`}
              className="h-full w-full border-0"
              style={{ filter: "grayscale(1) contrast(1.1)" }}
              loading="lazy"
              allowFullScreen
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-6 py-5">
              {/* Línea verde sobre el overlay */}
              <div className="mb-3 h-[2px] w-8" style={{ background: "#324730" }} />
              <p className="text-[9px] font-semibold uppercase tracking-widest text-white/50">Local principal</p>
              <p className="mt-1 text-sm font-black uppercase tracking-tight text-white">{locations[0].name} · {locations[0].address}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIOS ──────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="space-y-2">
          <SectionLabel>Testimonios</SectionLabel>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">Lo que dicen nuestros clientes</h2>
        </div>
        <TestimonialCarousel />
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden p-8 sm:p-12" style={{ background: "#1a2b1e" }}>
        {/* Acento verde top */}
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: "#324730" }} />
        <GreenCorner className="top-6 right-6" />
        <p className="text-[9px] font-semibold uppercase tracking-[0.2em]" style={{ color: "#324730" }}>Reserva tu lugar</p>
        <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-white">¿Listo para tu<br />próximo look?</h2>
        <p className="mt-3 max-w-md text-sm text-white/50">Agenda ahora y asegura tu horario preferido.</p>
        <Link href={`/${slug}/reservar`} className="mt-6 inline-block px-7 py-3 text-[10px] font-bold tracking-[0.15em] uppercase text-white transition hover:opacity-75" style={{ background: "#324730" }}>
          Reservar mi turno
        </Link>
      </section>

      <a href={`https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`} target="_blank" rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center shadow-lg transition-transform hover:scale-105"
        style={{ background: "#25D366" }}
        aria-label="Contactar por WhatsApp">
        <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.6 12.6 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
        </svg>
      </a>
    </div>
  );
}