import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type ProductosPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductosPage({ params }: ProductosPageProps) {
  const { slug } = await params;
  const supabase = createClient();

  const { data: products } = await supabase
    .from("productos")
    .select("id, nombre, descripcion, precio_venta, esta_activo, categoria_producto_id, categoria_producto(nombre)")
    .eq("esta_activo", true)
    .order("categoria_producto_id", { ascending: true });

  const categories = ["Todos", "Fijación", "Barba", "Afeitado"];

  return (
    <section className="space-y-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--tenant-muted)]">
            Tienda
          </p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-tight sm:text-5xl">
            Productos
          </h1>
          <p className="mt-3 max-w-md text-sm font-light leading-relaxed text-[var(--tenant-muted)]">
            Todo lo que usamos en el local, disponible para llevarte a casa.
          </p>
        </div>

        <div className="flex flex-wrap gap-[2px]">
          {categories.map((cat, i) => (
            <button
              key={cat}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-[0.15em] transition ${
                i === 0
                  ? "bg-[var(--tenant-primary)] text-white"
                  : "bg-[var(--tenant-surface)] text-[var(--tenant-muted)] hover:bg-black/5"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-[2px] sm:grid-cols-2 lg:grid-cols-3" style={{ background: "var(--tenant-border, #e5e5e5)" }}>
        {(products ?? []).map((product, index) => {
          const featured = index === 0;
          // @ts-ignore
          const categoryName = product.categoria_producto?.nombre ?? "";

          return (
            <article
              key={product.id}
              className={`group relative flex flex-col justify-between p-8 transition hover:-translate-y-px ${
                featured ? "bg-neutral-900 text-white" : "bg-[var(--tenant-surface)]"
              }`}
            >
              <span
                className={`absolute bottom-6 right-6 font-black leading-none ${
                  featured ? "text-white/5" : "text-black/5"
                }`}
                style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "80px" }}
              >
                {String(index + 1).padStart(2, "0")}
              </span>

              <div className="space-y-4">
                <p className={`text-[9px] font-semibold uppercase tracking-[0.22em] ${
                  featured ? "text-[var(--tenant-primary)]" : "text-[var(--tenant-muted)]"
                }`}>
                  {categoryName}
                </p>

                <h2
                  className={`font-black uppercase tracking-tight ${
                    featured ? "text-white" : "text-neutral-900"
                  }`}
                  style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(22px,3vw,30px)" }}
                >
                  {product.nombre}
                </h2>

                <p className={`text-sm font-light leading-relaxed ${
                  featured ? "text-white/55" : "text-[var(--tenant-muted)]"
                }`}>
                  {product.descripcion}
                </p>
              </div>

              <div className="mt-8 flex items-end justify-between">
                <span
                  className={`font-black leading-none ${
                    featured ? "text-white" : "text-[var(--tenant-primary)]"
                  }`}
                  style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "44px" }}
                >
                  S/{product.precio_venta}
                </span>

                <button className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] transition ${
                  featured
                    ? "bg-white text-black hover:bg-neutral-200"
                    : "bg-neutral-900 text-white hover:bg-neutral-700"
                }`}>
                  Agregar
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <Link
        href={`/${slug}`}
        className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--tenant-muted)] transition hover:text-[var(--tenant-primary)]"
      >
        ← Volver al inicio
      </Link>
    </section>
  );
}