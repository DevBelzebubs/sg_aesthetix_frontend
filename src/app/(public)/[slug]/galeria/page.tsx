import { createServerSupabase } from "@/lib/supabase/server";
import { GaleriaContent } from "./galeria-content";

export const revalidate = 60;

type GaleriaPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function GaleriaPage({ params }: GaleriaPageProps) {
  const { slug } = await params;
  const supabase = await createServerSupabase();

  const { data: photos } = await supabase
    .from("galeria_cortes")
    .select("id, titulo, imagen_url, orden")
    .eq("esta_activo", true)
    .order("orden", { ascending: true });

  return <GaleriaContent slug={slug} photos={photos ?? []} />;
}
