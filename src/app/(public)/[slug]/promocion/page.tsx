import { createServerSupabase } from "@/lib/supabase/server";
import { PromocionContent } from "./promocion-content";

export const revalidate = 60;

type RecompensaRow = {
  id: string;
  nombre: string;
  descripcion: string | null;
  puntos_requeridos: number;
  imagen_url: string | null;
};

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createServerSupabase();

  const { data: recompensasData } = await supabase
    .from("recompensas_puntos")
    .select("id, nombre, descripcion, puntos_requeridos, imagen_url")
    .eq("esta_activo", true)
    .order("puntos_requeridos", { ascending: true });

  const recompensas = ((recompensasData ?? []) as RecompensaRow[]).map(
    (r) => ({
      id: r.id,
      nombre: r.nombre,
      descripcion: r.descripcion ?? undefined,
      puntosRequeridos: r.puntos_requeridos,
      imagenUrl: r.imagen_url ?? undefined,
    }),
  );

  return (
    <PromocionContent
      slug={slug}
      recompensas={recompensas}
    />
  );
}
