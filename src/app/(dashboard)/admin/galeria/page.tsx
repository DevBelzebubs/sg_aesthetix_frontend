import { GalleryManagement } from "@/components/dashboard/gallery-management";

export const dynamic = "force-dynamic";
import { ModulePageShell } from "@/components/dashboard/module-page-shell";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function GaleriaPage() {
  const supabase = await createServerSupabase();

  const { count } = await supabase
    .from("galeria_cortes")
    .select("*", { count: "exact", head: true });

  const { count: publicados } = await supabase
    .from("galeria_cortes")
    .select("*", { count: "exact", head: true })
    .eq("esta_activo", true);

  const { count: destacados } = await supabase
    .from("galeria_cortes")
    .select("*", { count: "exact", head: true })
    .eq("destacado", true);

  return (
    <ModulePageShell
      breadcrumb={[{ label: "Administracion", href: "/admin" }, { label: "Galeria" }]}
      title="Galeria"
      description="Sube y organiza las fotos de tus cortes y estilos."
    >
      <GalleryManagement totalEstilos={count ?? 0} totalPublicados={publicados ?? 0} totalDestacados={destacados ?? 0} />
    </ModulePageShell>
  );
}
