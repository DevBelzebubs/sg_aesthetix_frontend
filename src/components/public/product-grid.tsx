"use client";

import { useState } from "react";
import { ProductCard } from "@/components/public/product-card";

type Product = {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio_venta: number;
  puntos_otorgados: number | null;
  imagen_url: string | null;
  categoriaNombre: string;
};

type ProductGridProps = {
  products: Product[];
  categories: string[];
};

export function ProductGrid({ products, categories }: ProductGridProps) {
  const [activeCategory, setActiveCategory] = useState("Todos");

  const filtered =
    activeCategory === "Todos"
      ? products
      : products.filter((p) => p.categoriaNombre === activeCategory);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap gap-[2px]">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] transition ${
              activeCategory === cat
                ? "bg-[var(--tenant-primary)] text-white"
                : "bg-[var(--background-secondary)] text-[var(--text-muted)] hover:bg-[var(--background)]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid gap-[2px] sm:grid-cols-2 lg:grid-cols-3" style={{ background: "var(--background)" }}>
        {filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center">
            <p className="text-sm uppercase tracking-widest text-[var(--text-muted)]">
              No hay productos en esta categoría.
            </p>
          </div>
        ) : (
          filtered.map((product, index) => (
            <ProductCard
              key={product.id}
              productId={product.id}
              nombre={product.nombre}
              descripcion={product.descripcion ?? ""}
              precio={product.precio_venta}
              puntos={product.puntos_otorgados ?? 0}
              imagenUrl={product.imagen_url ?? undefined}
              categoriaNombre={product.categoriaNombre}
              featured={index === 0}
              index={index}
            />
          ))
        )}
      </div>
    </div>
  );
}
