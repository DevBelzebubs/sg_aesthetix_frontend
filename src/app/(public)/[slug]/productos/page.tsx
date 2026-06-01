import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ProductCard } from "@/components/public/product-card";

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

  const categories = ["Todos", "Fijación", "Barba", "Afeitado"];

  return (
    <section className="space-y-10 pt-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]">Tienda</p>
          <h1 className="mt-2 text-5xl font-black uppercase tracking-tight sm:text-6xl">Productos</h1>
          <p className="mt-3 max-w-md text-lg font-light leading-relaxed text-[var(--text-muted)]">
            Todo lo que usamos en el local, disponible para llevarte a casa.
          </p>
        </div>
        <div className="flex flex-wrap gap-[2px]">
          {categories.map((cat, i) => (
            <button key={cat} className={`px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] transition ${i === 0 ? "bg-[var(--tenant-primary)] text-white" : "bg-[var(--background-secondary)] text-[var(--text-muted)] hover:bg-[var(--background)]"}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-[2px] sm:grid-cols-2 lg:grid-cols-3" style={{ background: "var(--border, #e0e0e0)" }}>
        {(products ?? []).map((product, index) => {
          const catArray = product.categoria_producto as { nombre: string }[] | null;
          const categoryName = catArray?.[0]?.nombre ?? "";
          return (
            <ProductCard
              key={product.id}
              productId={product.id}
              nombre={product.nombre}
              descripcion={product.descripcion ?? ""}
              precio={product.precio_venta}
              puntos={product.puntos_otorgados ?? 0}
              imagenUrl={product.imagen_url ?? undefined}
              categoriaNombre={categoryName}
              featured={index === 0}
              index={index}
            />
          );
        })}
      </div>

      <div className="pt-8 pb-12">
        <Link href={`/${slug}`} className="inline-flex items-center gap-2 border border-[var(--border)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] transition hover:border-[var(--hover)] hover:text-[var(--hover)]">
          ← Volver al inicio
        </Link>
      </div>
    </section>
  );
}
