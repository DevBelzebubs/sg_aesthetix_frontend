import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ProductGrid } from "@/components/public/product-grid";

export const dynamic = "force-dynamic";

type ProductosPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductosPage({ params }: ProductosPageProps) {
  const { slug } = await params;
  const supabase = createClient();

  const { data: products } = await supabase
    .from("productos")
    .select("id, nombre, descripcion, imagen_url, precio_venta, puntos_otorgados, esta_activo, categoria_producto_id, categoria_producto(nombre)")
    .eq("esta_activo", true)
    .eq("publico", true)
    .order("categoria_producto_id", { ascending: true });

  const mapped = (products ?? []).map((p) => {
    const catArray = p.categoria_producto as { nombre: string }[] | null;
    return {
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion as string | null,
      precio_venta: p.precio_venta,
      puntos_otorgados: p.puntos_otorgados as number | null,
      imagen_url: p.imagen_url as string | null,
      categoriaNombre: catArray?.[0]?.nombre ?? "",
    };
  });

  const categoriasUnicas = [...new Set(mapped.map((p) => p.categoriaNombre).filter(Boolean))].sort();
  const categories = ["Todos", ...categoriasUnicas];

  return (
    <section className="space-y-10 pt-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]">Tienda</p>
        <h1 className="mt-2 text-5xl font-black uppercase tracking-tight sm:text-6xl">Productos</h1>
        <p className="mt-3 max-w-md text-lg font-light leading-relaxed text-[var(--text-muted)]">
          Todo lo que usamos en el local, disponible para llevarte a casa.
        </p>
      </div>

      <ProductGrid products={mapped} categories={categories} />

      <div className="pt-8 pb-12">
        <Link href={`/${slug}`} className="inline-flex items-center gap-2 border border-[var(--border)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] transition hover:border-[var(--hover)] hover:text-[var(--hover)]">
          ← Volver al inicio
        </Link>
      </div>
    </section>
  );
}
