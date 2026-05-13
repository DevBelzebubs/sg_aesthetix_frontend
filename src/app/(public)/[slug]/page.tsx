import LandingPage from "./landing-page";
import { createClient } from "@/lib/supabase/client";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createClient();

  const { data: serviciosData } = await supabase
    .from("servicios")
    .select("id, nombre, descripcion, precio, duracion_minutos")
    .eq("esta_activo", true)
    .order("precio", { ascending: true });

  const services = (serviciosData ?? []).map((s) => ({
    id: s.id,
    nombre: s.nombre,
    descripcion: s.descripcion ?? "",
    precio: s.precio,
    duracion_minutos: s.duracion_minutos,
  }));

  return <LandingPage slug={slug} services={services} />;
}