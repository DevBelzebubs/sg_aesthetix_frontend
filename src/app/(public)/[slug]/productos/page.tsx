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
    .select("id, nombre, descripcion, imagen_url, precio_venta, esta_activo, categoria_producto_id, categoria_producto(nombre)")
    .eq("esta_activo", true)
    .order("categoria_producto_id", { ascending: true });

  const categories = ["Todos", "Fijación", "Barba", "Afeitado"];

  return (
    <section className="space-y-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--tenant-muted)]">Tienda</p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-tight sm:text-5xl">Productos</h1>
          <p className="mt-3 max-w-md text-sm font-light leading-relaxed text-[var(--tenant-muted)]">
            Todo lo que usamos en el local, disponible para llevarte a casa.
          </p>
        </div>
        <div className="flex flex-wrap gap-[2px]">
          {categories.map((cat, i) => (
            <button key={cat} className={`px-4 py-2 text-[10px] font-bold uppercase tracking-[0.15em] transition ${i === 0 ? "bg-[var(--tenant-primary)] text-white" : "bg-[var(--tenant-surface)] text-[var(--tenant-muted)] hover:bg-black/5"}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-[2px] sm:grid-cols-2 lg:grid-cols-3" style={{ background: "var(--tenant-border, #e5e5e5)" }}>
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
              puntos={Math.floor(product.precio_venta / 2)}
              imagenUrl={product.imagen_url ?? undefined}
              categoriaNombre={categoryName}
              featured={index === 0}
              index={index}
            />
          );
        })}
      </div>

      <Link href={`/${slug}`} className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--tenant-muted)] transition hover:text-[var(--tenant-primary)]">
        ← Volver al inicio
      </Link>
    </section>
  );
}
