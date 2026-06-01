import LandingPage from "./landing-page";
import { createClient } from "@/lib/supabase/client";

type BarberRow = {
  id: string;
  nombres: string;
  apellidos: string;
  telefono: string | null;
  imagen_url: string | null;
};

async function fetchBarbers() {
  const supabase = createClient();
  const { data: rows } = await supabase
    .from("usuarios")
    .select("id, nombres, apellidos, telefono, imagen_url")
    .eq("esta_activo", true)
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
        imagenUrl: row.imagen_url,
      };
    }),
  );

  return barbers;
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createClient();

  const [serviciosRes, productosRes, galeriaRes, barbers] = await Promise.all([
    supabase
      .from("servicios")
      .select("id, nombre, descripcion, precio, duracion_minutos")
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
    fetchBarbers(),
  ]);

  const services = (serviciosRes.data ?? []).map((s) => ({
    id: s.id,
    nombre: s.nombre,
    descripcion: s.descripcion ?? "",
    precio: s.precio,
    duracion_minutos: s.duracion_minutos,
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

  return (
    <LandingPage
      slug={slug}
      services={services}
      products={products}
      galleryItems={galleryItems}
      barbers={barbers}
    />
  );
}