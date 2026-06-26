import LandingPage from "./landing-page";
import { createServerSupabase } from "@/lib/supabase/server";

export const revalidate = 60;

type BarberRow = {
  id: string;
  nombres: string;
  apellidos: string;
  telefono: string | null;
  imagen_url: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  public: boolean | null;
};

type LocationRow = {
  id: string;
  nombre: string;
  direccion: string;
  horario: string;
  telefono: string;
  maps_url: string;
  lat: number;
  lng: number;
};

async function fetchBarbers(supabase: Awaited<ReturnType<typeof createServerSupabase>>) {
  const { data: rows } = await supabase
    .from("usuarios")
    .select("id, nombres, apellidos, telefono, imagen_url, instagram, facebook, tiktok, public")
    .eq("esta_activo", true)
    .eq("public", true)
    .order("creado_en", { ascending: true });

  if (!rows) return [];

  const barbers = await Promise.all(
    (rows as BarberRow[]).map(async (row) => {
      const { data: servicios } = await supabase
        .from("usuario_servicio")
        .select("servicios!inner(nombre)")
        .eq("usuario_id", row.id);
      const specialties = ((servicios ?? []) as { servicios: { nombre: string }[] }[])
        .map((s) => s.servicios[0]?.nombre)
        .filter(Boolean) as string[];
      return {
        id: row.id,
        nombre: `${row.nombres} ${row.apellidos}`,
        specialties,
        imagenUrl: row.imagen_url ?? null,
        instagram: row.instagram ?? null,
        facebook: row.facebook ?? null,
        tiktok: row.tiktok ?? null,
      };
    }),
  );

  return barbers;
}

async function fetchLocales(supabase: Awaited<ReturnType<typeof createServerSupabase>>) {
  const { data } = await supabase
    .from("locales")
    .select("*")
    .order("nombre", { ascending: true });
  if (!data) return [];
  return (data as LocationRow[]).map((row) => ({
    name: row.nombre,
    address: row.direccion,
    hours: row.horario,
    phone: row.telefono,
    mapsUrl: row.maps_url,
    lat: row.lat,
    lng: row.lng,
  }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createServerSupabase();

  const [serviciosRes, productosRes, galeriaRes, barbers, locales, heroRes] = await Promise.all([
    supabase
      .from("servicios")
      .select("id, nombre, descripcion, precio, duracion_minutos, imagen_url, puntos_otorgados")
      .eq("esta_activo", true)
      .order("precio", { ascending: true }),
    supabase
      .from("productos")
      .select("id, nombre, descripcion, imagen_url, precio_venta")
      .eq("esta_activo", true)
      .eq("destacado", true)
      .order("creado_en", { ascending: false })
      .limit(50),
    supabase
      .from("galeria_cortes")
      .select("id, titulo, descripcion, imagen_url")
      .eq("esta_activo", true)
      .eq("destacado", true)
      .order("orden", { ascending: true })
      .limit(4),
    fetchBarbers(supabase),
    fetchLocales(supabase),
    supabase
      .from("hero_content")
      .select("*")
      .eq("activo", true)
      .limit(1)
      .maybeSingle(),
  ]);

  const services = (serviciosRes.data ?? []).map((s) => ({
    id: s.id,
    nombre: s.nombre,
    descripcion: s.descripcion ?? "",
    precio: s.precio,
    duracion_minutos: s.duracion_minutos,
    imagenUrl: s.imagen_url ?? "",
    puntos: s.puntos_otorgados ?? 0,
  }));

  const products = (productosRes.data ?? []).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    descripcion: p.descripcion ?? "",
    imagenUrl: p.imagen_url ?? "",
    precioVenta: p.precio_venta,
  }));

  const galleryItems = (galeriaRes.data ?? []).map((g) => ({
    id: g.id,
    titulo: g.titulo,
    descripcion: g.descripcion ?? "",
    imagenUrl: g.imagen_url,
  }));

  const hero = heroRes?.data
    ? {
        id: heroRes.data.id,
        tipo: heroRes.data.tipo,
        urlMedia: heroRes.data.url_media ?? "",
        titulo: heroRes.data.titulo ?? "Redefiniendo el corte",
        subtitulo: heroRes.data.subtitulo ?? "Reserva online · Sin esperas",
        urlLogoDark: heroRes.data.url_logo_dark ?? "",
        urlLogoLight: heroRes.data.url_logo_light ?? "",
      }
    : null;

  return (
    <LandingPage
      slug={slug}
      services={services}
      products={products}
      galleryItems={galleryItems}
      barbers={barbers}
      locales={locales}
      hero={hero}
    />
  );
}