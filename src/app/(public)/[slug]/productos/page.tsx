import { createServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";
import { ProductGrid } from "@/components/public/product-grid";

export const revalidate = 60;

type ProductosPageProps = {
  params: Promise<{ slug: string }>;
};

type Producto = {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio_venta: number;
  puntos_otorgados: number | null;
  imagen_url: string | null;
  categoriaNombre: string;
};

export default async function ProductosPage({ params }: ProductosPageProps) {
  const { slug } = await params;
  const supabase = await createServerSupabase();

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase
      .from("categoria_producto")
      .select("id, nombre, publico, esta_activo")
      .eq("esta_activo", true)
      .order("orden", { ascending: true }),
    supabase
      .from("productos")
      .select("id, nombre, descripcion, imagen_url, precio_venta, puntos_otorgados, categoria_producto_id")
      .eq("esta_activo", true)
      .eq("publico", true)
      .order("categoria_producto_id", { ascending: true }),
  ]);

  const categoryMap = new Map<number, { nombre: string; publico: boolean }>();
  const publicCategoryIds = new Set<number>();
  for (const c of (categories ?? [])) {
    categoryMap.set(c.id, { nombre: c.nombre, publico: c.publico === true });
    if (c.publico === true) publicCategoryIds.add(c.id);
  }

  const mapped: Producto[] = (products ?? [])
    .map((p) => {
      const cat = p.categoria_producto_id != null ? categoryMap.get(p.categoria_producto_id) : undefined;
      return {
        id: p.id,
        nombre: p.nombre,
        descripcion: p.descripcion as string | null,
        precio_venta: p.precio_venta,
        puntos_otorgados: p.puntos_otorgados as number | null,
        imagen_url: p.imagen_url as string | null,
        categoriaNombre: cat?.publico ? (cat.nombre) : "",
      };
    })
    .filter((p) => p.categoriaNombre !== "");

  const categoriasUnicas = [...new Set(mapped.map((p) => p.categoriaNombre))].sort();
  const categoriesList = ["Todos", ...categoriasUnicas];

  return (
    <section className="space-y-10 pt-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]">Tienda</p>
        <h1 className="mt-2 text-5xl font-black uppercase tracking-tight sm:text-6xl">Productos</h1>
        <p className="mt-3 max-w-md text-lg font-light leading-relaxed text-[var(--text-muted)]">
          Todo lo que usamos en el local, disponible para llevarte a casa.
        </p>
      </div>

      <ProductGrid products={mapped} categories={categoriesList} />

      <div className="pt-8 pb-12">
        <Link href={`/${slug}`} className="inline-flex items-center gap-2 border border-[var(--border)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] transition hover:border-[var(--hover)] hover:text-[var(--hover)]">
          ← Volver al inicio
        </Link>
      </div>
    </section>
  );
}
