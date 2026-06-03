"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { Globe, Scissors } from "lucide-react";
import { StoreStatus } from "@/components/public/store-status";
import { useCart } from "@/contexts/cart-context";

type Service = {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  duracion_minutos: number;
  imagenUrl: string;
  puntos: number;
};

type ProductItem = {
  id: string;
  nombre: string;
  descripcion: string;
  imagenUrl: string;
  precioVenta: number;
};

type GalleryItem = {
  id: string;
  titulo: string;
  descripcion: string;
  imagenUrl: string;
};

type Barber = {
  id: string;
  nombre: string;
  specialties: string[];
  imagenUrl: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
};

type Location = {
  name: string;
  address: string;
  hours: string;
  phone: string;
  mapsUrl: string;
  lat: number;
  lng: number;
};

type LandingPageProps = {
  slug: string;
  services: Service[];
  products: ProductItem[];
  galleryItems: GalleryItem[];
  barbers: Barber[];
  locales: Location[];
};



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

function RazorDecor() {
  return (
    <svg
      viewBox="0 0 340 200"
      className="absolute bottom-0 right-0 w-72 md:w-96 opacity-[0.07] pointer-events-none select-none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M10 170 Q90 10 290 20 L300 50 Q100 55 45 185 Z" fill="white" />
      <path
        d="M10 170 Q90 10 290 20"
        stroke="white"
        strokeWidth="2"
        fill="none"
      />
      <rect
        x="270"
        y="18"
        width="60"
        height="26"
        rx="3"
        fill="white"
        opacity="0.8"
      />
      <line
        x1="285"
        y1="24"
        x2="285"
        y2="38"
        stroke="black"
        strokeWidth="1.5"
        strokeOpacity="0.4"
      />
      <line
        x1="297"
        y1="24"
        x2="297"
        y2="38"
        stroke="black"
        strokeWidth="1.5"
        strokeOpacity="0.4"
      />
      <line
        x1="309"
        y1="24"
        x2="309"
        y2="38"
        stroke="black"
        strokeWidth="1.5"
        strokeOpacity="0.4"
      />
      <circle cx="322" cy="31" r="4" fill="white" opacity="0.5" />
    </svg>
  );
}

// Decoración de esquina verde
function GreenCorner({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute w-12 h-12 ${className}`}>
      <div
        className="absolute top-0 left-0 w-full h-[2px]"
        style={{ background: "var(--hover)" }}
      />
      <div
        className="absolute top-0 left-0 h-full w-[2px]"
        style={{ background: "var(--hover)" }}
      />
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-[2px] w-6 rounded-full"
        style={{ background: "var(--hover)" }}
      />
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
        {children}
      </p>
      <div
        className="h-[2px] w-6 rounded-full"
        style={{ background: "var(--hover)" }}
      />
    </div>
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
      {/* Acento verde lateral */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ background: "var(--hover)" }}
      />
      <RazorDecor />
      <div className="relative z-10 px-8 py-14 md:px-16 md:py-16 max-w-2xl">
        <div
          className="mb-7 h-16 w-16 overflow-hidden border-2 flex items-center justify-center"
          style={{ borderRadius: "50%", borderColor: "var(--hover)" }}
        >
          <span className="text-white text-xl font-black">
            {t.name.charAt(0)}
          </span>
        </div>
        <p className="text-white/80 text-base md:text-lg leading-relaxed font-light">
          &ldquo;{t.quote}&rdquo;
        </p>
        <p className="mt-6 text-white font-black uppercase tracking-wide text-sm">
          {t.name}
        </p>
        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/30">
          {t.label}
        </p>
        <div className="mt-8 flex items-center gap-5">
          <div className="flex items-center gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className="h-1.5 transition-all duration-300"
                style={{
                  width: i === current ? 24 : 6,
                  background:
                    i === current ? "var(--hover)" : "rgba(255,255,255,0.25)",
                }}
                aria-label={`Testimonio ${i + 1}`}
              />
            ))}
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={prev}
              className="h-8 w-8 border border-white/20 text-white/50 hover:text-white transition-all flex items-center justify-center text-sm"
              style={{ borderColor: "color-mix(in srgb, var(--hover) 25%, transparent)" }}
              aria-label="Anterior"
            >
              ←
            </button>
            <button
              onClick={next}
              className="h-8 w-8 text-white/50 hover:text-white transition-all flex items-center justify-center text-sm border"
              style={{ borderColor: "color-mix(in srgb, var(--hover) 25%, transparent)" }}
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

function ProductCarousel({ products }: { products: ProductItem[] }) {
  const { addItem } = useCart();
  const [current, setCurrent] = useState(0);
  const [addedId, setAddedId] = useState<string | null>(null);
  const total = products.length;

  const prev = useCallback(
    () => setCurrent((c) => (c === 0 ? total - 1 : c - 1)),
    [total],
  );
  const next = useCallback(
    () => setCurrent((c) => (c === total - 1 ? 0 : c + 1)),
    [total],
  );

  if (total === 0) return null;

  const product = products[current];

  const handleAdd = () => {
    addItem({
      productId: product.id,
      nombre: product.nombre,
      precio: product.precioVenta,
      cantidad: 1,
      imagenUrl: product.imagenUrl || undefined,
    });
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <div className="relative overflow-hidden" style={{ background: "var(--hover)" }}>
      <div
        className="grid md:grid-cols-[1fr_1fr] gap-[1px] h-[400px] md:h-[440px]"
        style={{ background: "var(--hover)" }}
      >
        {/* Imagen */}
        <div className="flex items-center justify-center bg-[var(--background-secondary)] p-6">
          {product.imagenUrl ? (
            <img
              src={product.imagenUrl}
              alt={product.nombre}
              className="aspect-square w-full max-w-[340px] object-cover"
            />
          ) : (
            <div className="aspect-square w-full max-w-[340px] flex items-center justify-center bg-[var(--background-secondary)]">
              <span className="text-5xl font-black text-[var(--text-muted)]">
                {product.nombre.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col justify-end bg-[var(--background-secondary)] px-8 py-6 md:px-12 md:py-8 overflow-y-auto">
          <div className="mb-3 h-[2px] w-6" style={{ background: "var(--hover)" }} />
          <p
            className="text-[12px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: "var(--hover)" }}
          >
            Producto {String(current + 1).padStart(2, "0")} de{" "}
            {String(total).padStart(2, "0")}
          </p>
          <h3 className="mt-2 text-xl font-black uppercase tracking-tight leading-tight text-[var(--foreground)] md:text-2xl">
            {product.nombre}
          </h3>
          <p className="mt-3 text-base text-[var(--text-muted)] leading-relaxed">
            {product.descripcion}
          </p>
          <p className="mt-6 text-3xl font-black" style={{ color: "var(--hover)" }}>
            S/{product.precioVenta}
          </p>
          <button
            type="button"
            onClick={handleAdd}
            className="mt-5 inline-block px-6 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-white transition hover:opacity-75 w-fit"
            style={{
              background: addedId === product.id ? "#059669" : "var(--hover)",
            }}
          >
            {addedId === product.id ? "✓ Agregado" : "Agregar al carrito"}
          </button>
        </div>
      </div>

      {/* Navegación */}
      <div className="flex items-center justify-between bg-[var(--background-secondary)] px-8 py-4 md:px-12">
        <div className="flex items-center gap-2">
          {products.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="h-1.5 transition-all duration-300"
              style={{
                width: i === current ? 24 : 6,
                background: i === current ? "var(--hover)" : "rgba(0,0,0,0.15)",
              }}
              aria-label={`Producto ${i + 1}`}
            />
          ))}
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={prev}
            className="h-8 w-8 flex items-center justify-center text-sm border transition hover:opacity-70"
            style={{ borderColor: "color-mix(in srgb, var(--hover) 25%, transparent)", color: "var(--hover)" }}
            aria-label="Anterior"
          >
            ←
          </button>
          <button
            onClick={next}
            className="h-8 w-8 flex items-center justify-center text-sm border transition hover:opacity-70"
            style={{ borderColor: "color-mix(in srgb, var(--hover) 25%, transparent)", color: "var(--hover)" }}
            aria-label="Siguiente"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}

function BarberCarousel({ barbers }: { barbers: Barber[] }) {
  const [current, setCurrent] = useState(0);
  const total = barbers.length;

  const prev = useCallback(
    () => setCurrent((c) => (c === 0 ? total - 1 : c - 1)),
    [total],
  );
  const next = useCallback(
    () => setCurrent((c) => (c === total - 1 ? 0 : c + 1)),
    [total],
  );

  if (total === 0) return null;

  const barber = barbers[current];
  const hasSocial = barber.instagram || barber.facebook || barber.tiktok;

  return (
    <div
      className="grid gap-[1px] md:grid-cols-2"
      style={{ background: "var(--hover)" }}
    >
      {/* Foto */}
      <div className="relative overflow-hidden bg-neutral-900 min-h-[280px] md:min-h-[360px]">
        {barber.imagenUrl ? (
          <img
            src={barber.imagenUrl}
            alt={barber.nombre}
            className="h-full w-full object-cover absolute inset-0"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-7xl font-black text-white/30">
              {barber.nombre.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col justify-center bg-[var(--background-secondary)] px-8 py-10 md:px-12 md:py-12">
        <div className="mb-3 h-[2px] w-6" style={{ background: "var(--hover)" }} />
        <p
          className="text-[12px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: "var(--hover)" }}
        >
          Barber {String(current + 1).padStart(2, "0")} de{" "}
          {String(total).padStart(2, "0")}
        </p>
        <h3 className="mt-2 text-xl font-black uppercase tracking-tight leading-tight text-[var(--foreground)] md:text-2xl">
          {barber.nombre}
        </h3>
        {barber.specialties.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {barber.specialties.map((s) => (
              <span
                key={s}
                className="inline-block px-3 py-1 text-[10px] font-semibold uppercase tracking-widest"
                style={{
                  background: "color-mix(in srgb, var(--hover) 12%, transparent)",
                  color: "var(--hover)",
                }}
              >
                {s}
              </span>
            ))}
          </div>
        )}
        {hasSocial && (
          <div className="mt-5 flex items-center gap-4">
            {barber.instagram && (
                          <a
                            href={barber.instagram.startsWith("http") ? barber.instagram : `https://instagram.com/${barber.instagram.replace("@", "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="transition hover:text-[var(--hover)]"
                            title="Instagram"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><line x1="18" y1="5.5" x2="18.01" y2="5.5"/></svg>
                          </a>
            )}
            {barber.facebook && (
              <a
                href={barber.facebook.startsWith("http") ? barber.facebook : `https://facebook.com/${barber.facebook}`}
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-[var(--hover)]"
                title="Facebook"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
            )}
            {barber.tiktok && (
              <a
                href={barber.tiktok.startsWith("http") ? barber.tiktok : `https://tiktok.com/@${barber.tiktok.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-[var(--hover)]"
                title="TikTok"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
              </a>
            )}
          </div>
        )}
      </div>

      {/* Navegación */}
      <div className="col-span-full flex items-center justify-between bg-[var(--background-secondary)] px-8 py-4 md:px-12">
        <div className="flex items-center gap-2">
          {barbers.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="h-1.5 transition-all duration-300"
              style={{
                width: i === current ? 24 : 6,
                background: i === current ? "var(--hover)" : "rgba(0,0,0,0.15)",
              }}
              aria-label={`Barber ${i + 1}`}
            />
          ))}
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={prev}
            className="h-8 w-8 flex items-center justify-center text-sm border transition hover:opacity-70"
            style={{ borderColor: "color-mix(in srgb, var(--hover) 25%, transparent)", color: "var(--hover)" }}
            aria-label="Anterior"
          >
            ←
          </button>
          <button
            onClick={next}
            className="h-8 w-8 flex items-center justify-center text-sm border transition hover:opacity-70"
            style={{ borderColor: "color-mix(in srgb, var(--hover) 25%, transparent)", color: "var(--hover)" }}
            aria-label="Siguiente"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}

const defaultLocales: Location[] = [
  {
    name: "San Borja",
    address: "Av. Aviación 3464 · San Borja",
    hours: "Lun – Sáb · 8:00 AM – 8:00 PM",
    phone: "+51 999 999 999",
    mapsUrl: "https://maps.google.com/?q=Av.+Aviaci%C3%B3n+3464,+San+Borja,+Lima",
    lat: -12.0943,
    lng: -77.0073,
  },
];

export default function LandingPage({
  slug,
  services,
  products,
  galleryItems,
  barbers,
  locales: localesProp,
}: LandingPageProps) {
  const locales = localesProp.length > 0 ? localesProp : defaultLocales;
  const WA_NUMBER = "5491112345678";
  const WA_MESSAGE = encodeURIComponent("Hola, quiero reservar un turno.");

  return (
    <div className="space-y-20 pb-8">
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="-mx-6">
        {/* MOBILE */}
        <div className="md:hidden">
          <div
            className="relative w-full overflow-hidden bg-black"
            style={{ height: "56vw", minHeight: 220 }}
          >
            <video
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover opacity-90"
              src="https://res.cloudinary.com/dp1vgjhsq/video/upload/v1777105289/WhatsApp_Video_2026-04-25_at_3.11.00_AM_1_aroels.mp4"
            />
            <span className="absolute bottom-3 left-3 bg-black/75 px-3 py-1.5 text-[10px] font-bold tracking-[0.18em] uppercase text-white">
              Reserva online · Sin esperas
            </span>
            {/* Acento verde en esquina del video */}
            <div className="absolute top-0 right-0 w-8 h-8">
              <div
                className="absolute top-0 right-0 w-full h-[3px]"
                style={{ background: "var(--hover)" }}
              />
              <div
                className="absolute top-0 right-0 h-full w-[3px]"
                style={{ background: "var(--hover)" }}
              />
            </div>
          </div>
          <div
            className="border-b bg-[var(--background-secondary)] px-6 py-8"
            style={{ borderColor: "color-mix(in srgb, var(--hover) 12.5%, transparent)" }}
          >
            {/* Línea verde en lugar de la negra */}
            <div
              className="mb-4 h-[3px] w-10 rounded-full"
              style={{ background: "var(--hover)" }}
            />
            <div className="mb-3 flex items-center gap-3">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--text-muted)]">
                Barbería
              </p>
              <StoreStatus />
            </div>
            <h1 className="text-3xl font-black uppercase leading-none tracking-tight text-[var(--foreground)]">
              Redefi&shy;niendo
              <br />
              el corte
            </h1>
            <Link
              href={`/${slug}/reservar`}
              className="mt-6 inline-block px-6 py-3 text-[10px] font-bold tracking-[0.15em] uppercase text-white transition hover:opacity-75"
              style={{ background: "var(--hover)" }}
            >
              Reservar turno
            </Link>
          </div>
          <div className="w-full bg-[var(--background-secondary)]" style={{ height: 160 }}>
            <img
              src="https://res.cloudinary.com/dp1vgjhsq/image/upload/v1779981307/LOGOTIPO_tsrnvl.png"
              alt="For Men Castilla"
              style={{ height: 160, width: "100%", objectFit: "contain" }}
            />
          </div>
        </div>

        {/* DESKTOP */}
        <div className="hidden md:block">
          <div
            className="grid gap-px"
            style={{
              gridTemplateColumns: "1fr 1.6fr 1fr",
              gridTemplateRows: "380px 260px",
              background: "var(--hover)",
            }}
          >
            <div className="relative flex flex-col justify-end bg-[var(--background-secondary)] px-10 py-10">
              <GreenCorner className="top-4 left-4" />
              {/* Línea verde */}
              <div
                className="mb-4 h-[3px] w-10 rounded-full"
                style={{ background: "var(--hover)" }}
              />
              <div className="mb-3 flex items-center gap-3">
                <p
                  className="text-xs font-semibold tracking-[0.2em] uppercase"
                  style={{ color: "var(--hover)" }}
                >
                  Barbería
                </p>
                <StoreStatus />
              </div>
              <h1 className="text-4xl font-black uppercase leading-none tracking-tight text-[var(--foreground)] xl:text-5xl">
                Redefi
                <br />
                niendo
                <br />
                el corte
              </h1>
            </div>
            <div
              className="relative overflow-hidden bg-black"
              style={{ gridColumn: "2 / 4" }}
            >
              <video
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover opacity-94"
                src="https://res.cloudinary.com/dp1vgjhsq/video/upload/v1777105289/WhatsApp_Video_2026-04-25_at_3.11.00_AM_1_aroels.mp4"
              />
              <span className="absolute bottom-5 left-5 bg-black/80 px-4 py-2 text-[10px] font-bold tracking-[0.2em] uppercase text-white">
                Reserva online · Sin esperas
              </span>
            </div>
            <div
              className="overflow-hidden bg-[var(--background-secondary)] flex items-center justify-center"
              style={{ gridColumn: "1 / 2", gridRow: "2 / 3" }}
            >
              <img
                src="https://res.cloudinary.com/dp1vgjhsq/image/upload/v1779981307/LOGOTIPO_tsrnvl.png"
                alt="For Men Castilla"
                style={{ height: 160, width: 160, objectFit: "contain" }}
              />
            </div>
            <a
              href="https://www.instagram.com/zonafade_barber/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col justify-center bg-neutral-900 px-10 py-8 text-white transition hover:opacity-80"
            >
              <p
                className="text-[10px] font-semibold tracking-[0.18em] uppercase"
                style={{ color: "var(--hover)" }}
              >
                Instagram
              </p>
              <p className="mt-2 text-4xl font-black leading-none tracking-tight">
                @zonafade_barber
              </p>
              <p className="mt-2 text-[10px] tracking-widest uppercase text-white/40">
                Síguenos
              </p>
            </a>
            <div className="relative flex flex-col justify-center bg-[var(--background)] px-10 py-8">
              <GreenCorner className="bottom-4 right-4 rotate-180" />
              <p
                className="text-[10px] font-semibold tracking-[0.18em] uppercase"
                style={{ color: "var(--hover)" }}
              >
                Horario
              </p>
              <p className="mt-2 text-2xl font-black uppercase tracking-tight">
                Lun – Sáb
              </p>
              <p className="mt-1 text-[10px] tracking-widest uppercase text-[var(--text-muted)]">
                8:00 AM – 8:00 PM
              </p>
              <p className="mt-4 text-sm leading-relaxed text-[var(--text-muted)]">
                Tres especialistas, un espacio cuidado y puntualidad
                garantizada.
              </p>
              <Link
                href={`/${slug}/reservar`}
                className="mt-5 inline-block px-5 py-2.5 text-[10px] font-bold tracking-[0.14em] uppercase text-white transition hover:opacity-75 w-fit"
                style={{ background: "var(--hover)" }}
              >
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
          <h2 className="mt-2 text-2xl font-bold tracking-tight">
            Lo más solicitado
          </h2>
        </div>

        <div
          className="flex flex-col gap-[1px]"
          style={{ background: "var(--hover)" }}
        >
          {services.map((service, index) => {
            return (
              <article
                key={service.id}
                className="relative grid gap-[1px] transition group bg-[var(--background-secondary)]"
                style={{ gridTemplateColumns: "auto 1fr auto" }}
              >
                {/* Barra lateral izquierda animada al hover */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-[3px] scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top"
                  style={{ background: "var(--hover)" }}
                />

                {/* FOTO - columna 1 */}
                <div className="flex items-center justify-center px-6 py-7">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--background)]">
                    {service.imagenUrl ? (
                      <img
                        src={service.imagenUrl}
                        alt={service.nombre}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Scissors size={28} className="text-[var(--text-muted)]" />
                    )}
                  </div>
                </div>

                {/* INFO - columna 2 */}
                <div className="px-8 py-7">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black tabular-nums shrink-0" style={{ color: "var(--hover)" }}>
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <h3 className="text-base font-black uppercase tracking-tight text-[var(--foreground)]">
                          {service.nombre}
                        </h3>
                      </div>
                      <p className="text-sm leading-relaxed max-w-lg text-[var(--text-muted)]">
                        {service.descripcion}
                      </p>
                      {service.puntos > 0 && (
                        <span className="inline-block rounded-full px-3 py-0.5 text-[11px] font-semibold bg-[var(--hover)]/10 text-[var(--hover)]">
                          +{service.puntos} pts
                        </span>
                      )}
                    </div>
                    <span className="shrink-0 text-xs font-semibold uppercase tracking-widest pt-0.5 text-[var(--text-muted)]">
                      {service.duracion_minutos} min
                    </span>
                  </div>
                </div>

                {/* Precio — bloque derecho */}
                <div className="flex flex-col items-center justify-center px-7 py-7 min-w-[100px] bg-[var(--background)]">
                  <span className="text-xs font-semibold uppercase tracking-widest mb-1 text-[var(--text-muted)]">
                    Desde
                  </span>
                  <span className="text-3xl font-black tracking-tight" style={{ color: "var(--hover)" }}>
                    S/{service.precio}
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        {/* CTA reservar */}
        <div className="flex justify-end">
          <Link
            href={`/${slug}/reservar`}
            className="inline-block px-6 py-3 text-[10px] font-bold tracking-[0.15em] uppercase text-white transition hover:opacity-75"
            style={{ background: "var(--hover)" }}
          >
            Reservar turno
          </Link>
        </div>
      </section>

      {/* ── NUESTROS LOCALES ─────────────────────────────────────────── */}
      {locales.length > 0 && (
        <section id="locales" className="-mx-6 space-y-0">
          <div className="px-6 pb-6 space-y-2">
            <SectionLabel>Locales</SectionLabel>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Nuestro local
            </h2>
          </div>
          <div
            className="grid gap-px md:grid-cols-[1fr_1.4fr]"
            style={{ background: "var(--hover)" }}
          >
            <div className="bg-[var(--background-secondary)]">
              {locales.map((loc, i) => (
                <div
                  key={loc.name}
                  className={`p-8 ${i === 0 ? "bg-neutral-900 text-white" : "bg-[var(--background-secondary)]"}`}
                >
                  <div
                    className={`mb-5 inline-flex h-7 w-7 items-center justify-center text-xs font-black`}
                    style={{
                      background: i === 0 ? "var(--hover)" : "var(--background-secondary)",
                      color: "white",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tight">
                    {loc.name}
                  </h3>
                  <p
                    className={`mt-2 text-xs font-semibold uppercase tracking-widest ${i === 0 ? "text-white/40" : "text-[var(--text-muted)]"}`}
                  >
                    {loc.address}
                  </p>
                  <div className="mt-6 space-y-2">
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-semibold uppercase tracking-widest ${i === 0 ? "text-white/30" : "text-[var(--text-muted)]"}`}
                      >
                        Horario
                      </span>
                      <span
                        className={`text-sm font-bold uppercase tracking-tight ${i === 0 ? "text-white" : "text-[var(--foreground)]"}`}
                      >
                        {loc.hours}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-semibold uppercase tracking-widest ${i === 0 ? "text-white/30" : "text-[var(--text-muted)]"}`}
                      >
                        Tel
                      </span>
                      <a
                        href={`tel:${loc.phone.replace(/\s/g, "")}`}
                        className={`text-sm font-bold uppercase tracking-tight transition hover:opacity-70 ${i === 0 ? "text-white" : "text-[var(--foreground)]"}`}
                      >
                        {loc.phone}
                      </a>
                    </div>
                  </div>
                  <div className="mt-8 flex items-center gap-3">
                    <a
                      href={loc.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block border px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] transition hover:opacity-75"
                      style={{
                        borderColor: i === 0 ? "color-mix(in srgb, var(--hover) 37.5%, transparent)" : "var(--hover)",
                        color: i === 0 ? "white" : "var(--hover)",
                      }}
                    >
                      Ver en mapa
                    </a>
                    <Link
                      href={`/${slug}/reservar`}
                      className="inline-block px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] transition hover:opacity-75 text-white"
                      style={{ background: "var(--hover)" }}
                    >
                      Reservar
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <div className="relative min-h-[320px] overflow-hidden bg-[var(--background-secondary)] md:min-h-0">
              <iframe
                title="Ubicación del local"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${locales[0].lng - 0.004},${locales[0].lat - 0.003},${locales[0].lng + 0.004},${locales[0].lat + 0.003}&layer=mapnik&marker=${locales[0].lat},${locales[0].lng}`}
                className="h-full w-full border-0"
                style={{ filter: "grayscale(1) contrast(1.1)" }}
                loading="lazy"
                allowFullScreen
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-6 py-5">
                <div
                  className="mb-3 h-[2px] w-8"
                  style={{ background: "var(--hover)" }}
                />
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
                  Local principal
                </p>
                <p className="mt-1 text-sm font-black uppercase tracking-tight text-white">
                  {locales[0].name} · {locales[0].address}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── NUESTROS BARBERS ──────────────────────────────────────────── */}
      {barbers.length > 0 && (
        <section className="space-y-6">
          <div className="space-y-2">
            <SectionLabel>Equipo</SectionLabel>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              Nuestros barbers
            </h2>
          </div>
          <div
            className="grid gap-[1px] md:grid-cols-2 lg:grid-cols-3"
            style={{ background: "var(--background)" }}
          >
            {barbers.map((barber) => {
              return (
                <article
                  key={barber.id}
                  className="relative flex items-center gap-5 px-7 py-7 transition group bg-[var(--background-secondary)] border"
                  style={{ borderColor: "var(--border)" }}
                >
                  {/* Avatar con foto o inicial */}
                  <div
                    className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 text-xl font-black bg-[var(--background-secondary)] text-[var(--foreground)]"
                    style={{ borderColor: "var(--hover)" }}
                  >
                    {barber.imagenUrl ? (
                      <img
                        src={barber.imagenUrl}
                        alt={barber.nombre}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      barber.nombre.charAt(0)
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3
                      className="text-sm font-black uppercase tracking-tight truncate text-[var(--foreground)]"
                    >
                      {barber.nombre}
                    </h3>
                    {barber.specialties.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {barber.specialties.map((s) => (
                          <span
                            key={s}
                            className="inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest"
                            style={{
                              background: "color-mix(in srgb, var(--hover) 8.2%, transparent)",
                              color: "var(--hover)",
                            }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                    {(barber.instagram || barber.facebook || barber.tiktok) && (
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-[var(--text-muted)]">
                        {barber.instagram && (
                          <a
                            href={barber.instagram.startsWith("http") ? barber.instagram : `https://instagram.com/${barber.instagram.replace("@", "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="transition hover:text-[var(--hover)]"
                            title="Instagram"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><line x1="18" y1="5.5" x2="18.01" y2="5.5"/></svg>
                          </a>
                        )}
                        {barber.facebook && (
                          <a
                            href={barber.facebook.startsWith("http") ? barber.facebook : `https://facebook.com/${barber.facebook}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="transition hover:text-[var(--hover)]"
                            title="Facebook"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                          </a>
                        )}
                        {barber.tiktok && (
                          <a
                            href={barber.tiktok.startsWith("http") ? barber.tiktok : `https://tiktok.com/@${barber.tiktok.replace("@", "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="transition hover:text-[var(--hover)]"
                            title="TikTok"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* ── PRODUCTOS ───────────────────────────────────────────────── */}
      {products.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-end justify-between">
            <div className="space-y-2">
              <SectionLabel>Tienda</SectionLabel>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">
                Productos destacados
              </h2>
            </div>
            <Link
              href={`/${slug}/productos`}
              className="shrink-0 border px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] transition hover:opacity-75"
              style={{ borderColor: "var(--hover)", color: "var(--hover)" }}
            >
              Ver todos
            </Link>
          </div>

          <ProductCarousel products={products} />
        </section>
      )}

      {/* ── GALERÍA DE CORTES ───────────────────────────────────────── */}
      {galleryItems.length > 0 && (
        <section className="-mx-6 space-y-0">
          <div className="px-6 pb-6 flex items-end justify-between">
            <div className="space-y-2">
              <SectionLabel>Galería</SectionLabel>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">
                Algunos cortes
              </h2>
            </div>
            <Link
              href={`/${slug}/galeria`}
              className="shrink-0 border px-5 py-2.5 text-xs font-bold uppercase tracking-[0.15em] transition hover:opacity-75"
              style={{ borderColor: "var(--hover)", color: "var(--hover)" }}
            >
              Ver galería
            </Link>
          </div>

          <div className="flex flex-col gap-[1px]" style={{ background: "var(--hover)" }}>
            {galleryItems.map((item, i) => {
              const isEven = i % 2 === 0;
              return (
                <div key={item.id} className="bg-[var(--background-secondary)]">
                  {/* MOBILE: stack vertical imagen arriba, texto abajo */}
                  <div className="md:hidden">
                    <div
                      className="relative overflow-hidden bg-neutral-900 group"
                      style={{ aspectRatio: "16/9" }}
                    >
                      <img
                        src={item.imagenUrl}
                        alt={item.titulo}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                      <div
                        className="absolute top-3 left-3 h-6 w-6 flex items-center justify-center text-xs font-black text-white"
                        style={{ background: "var(--hover)" }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </div>
                    </div>
                    <div className="px-6 py-5">
                      <div className="mb-2 h-[2px] w-5" style={{ background: "var(--hover)" }} />
                      <p className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--hover)" }}>
                        Corte · 0{i + 1}
                      </p>
                      <h3 className="mt-1.5 text-xl font-black uppercase tracking-tight text-[var(--foreground)]">
                        {item.titulo}
                      </h3>
                      {item.descripcion && (
                        <p className="mt-2 text-base text-[var(--text-muted)] leading-relaxed">
                          {item.descripcion}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* DESKTOP: alternado izquierda/derecha */}
                  <div
                    className="hidden md:grid gap-[1px]"
                    style={{ gridTemplateColumns: "1fr 1fr", background: "var(--hover)" }}
                  >
                    <div
                      className={`relative overflow-hidden bg-neutral-900 group ${!isEven ? "order-2" : "order-1"}`}
                      style={{ aspectRatio: "4/3" }}
                    >
                      <img
                        src={item.imagenUrl}
                        alt={item.titulo}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                       <div
                        className="absolute top-4 left-4 h-7 w-7 flex items-center justify-center text-xs font-black text-white"
                        style={{ background: "var(--hover)" }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </div>
                    </div>
                    <div
                      className={`flex flex-col justify-center bg-[var(--background-secondary)] px-10 py-10 ${!isEven ? "order-1" : "order-2"}`}
                    >
                       <div className="mb-3 h-[2px] w-6" style={{ background: "var(--hover)" }} />
                      <p className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--hover)" }}>
                        Corte · 0{i + 1}
                      </p>
                      <h3 className="mt-2 text-4xl font-black uppercase tracking-tight text-[var(--foreground)]">
                        {item.titulo}
                      </h3>
                      {item.descripcion && (
                        <>
                          <div className="mt-4 h-px w-full bg-[var(--background-secondary)]" />
                          <p className="mt-4 text-base text-[var(--text-muted)] leading-relaxed">
                            {item.descripcion}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── PUNTOS Y RECOMPENSAS ────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="space-y-2">
          <SectionLabel>Fidelidad</SectionLabel>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">
            Gana puntos y reclama recompensas
          </h2>
        </div>
        <div
          className="relative overflow-hidden"
          style={{ background: "var(--background-secondary)" }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-[1px]"
            style={{ background: "var(--hover)" }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-[1px]"
            style={{ background: "var(--hover)" }}
          />
          <div className="grid md:grid-cols-[1fr_1.2fr] gap-[1px]" style={{ background: "var(--background)" }}>
            <div className="relative flex flex-col justify-center px-8 py-12 md:px-14 md:py-16 bg-neutral-950">
              <GreenCorner className="top-6 right-6" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--hover)" }}>
                Programa de fidelidad
              </p>
              <h3 className="mt-3 text-3xl font-black uppercase tracking-tight text-white md:text-4xl">
                Cada visita suma
              </h3>
              <p className="mt-3 text-sm text-white/50 leading-relaxed max-w-md">
                Acumula puntos por cada servicio o producto que compres y canjéalos
                por descuentos, productos gratis y más beneficios exclusivos.
              </p>
              <Link
                href={`/${slug}/promocion`}
                className="mt-8 inline-block px-7 py-3 text-[10px] font-bold tracking-[0.15em] uppercase text-white transition hover:opacity-75 w-fit"
                style={{ background: "var(--hover)" }}
              >
                Ver recompensas
              </Link>
            </div>
            <div className="flex flex-col justify-center gap-6 bg-[var(--background-secondary)] px-8 py-12 md:px-14 md:py-16">
              {[
                { num: "01", label: "Reserva", desc: "Agenda tu cita y ven al local." },
                { num: "02", label: "Acumula", desc: "Gana puntos en cada compra que realices." },
                { num: "03", label: "Canjea", desc: "Cambia tus puntos por recompensas exclusivas." },
              ].map((step) => (
                <div key={step.num} className="flex items-start gap-5 group">
                  <span
                    className="text-3xl font-black leading-none tabular-nums shrink-0 transition-colors duration-300"
                    style={{ color: "var(--hover)" }}
                  >
                    {step.num}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div
                      className="mb-2 h-[2px] w-5 transition-all duration-300 group-hover:w-8"
                      style={{ background: "var(--hover)" }}
                    />
                    <p className="font-black uppercase tracking-tight text-[var(--foreground)]">
                      {step.label}
                    </p>
                    <p className="mt-0.5 text-sm text-[var(--text-muted)] leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <a
        href={`https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center shadow-lg transition-transform hover:scale-105"
        style={{ background: "#25D366" }}
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
