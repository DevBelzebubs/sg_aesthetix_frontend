"use client";

import { useState } from "react";
import { useCart } from "@/contexts/cart-context";

type ProductCardProps = {
  productId: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagenUrl?: string;
  categoriaNombre: string;
  puntos: number;
  featured?: boolean;
  index: number;
};

export function ProductCard({
  productId,
  nombre,
  descripcion,
  precio,
  puntos,
  imagenUrl,
  categoriaNombre,
  featured = false,
  index,
}: ProductCardProps) {
  const { addItem, items } = useCart();
  const [added, setAdded] = useState(false);

  const cartItem = items.find((i) => i.productId === productId);
  const cantidadEnCarrito = cartItem?.cantidad ?? 0;

  const handleAdd = () => {
    addItem({ productId, nombre, precio, cantidad: 1, imagenUrl });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <article
      className={`group relative flex flex-col justify-between p-8 transition hover:-translate-y-px ${
        featured
          ? "bg-neutral-900 text-white"
          : "bg-[var(--tenant-surface)]"
      }`}
    >
      <span
        className={`pointer-events-none absolute bottom-6 right-6 font-black leading-none ${
          featured ? "text-white/5" : "text-black/5"
        }`}
        style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "80px" }}
      >
        {String(index + 1).padStart(2, "0")}
      </span>

      <div className="space-y-4">
        <p
          className={`text-[9px] font-semibold uppercase tracking-[0.22em] ${
            featured ? "text-[var(--tenant-primary)]" : "text-[var(--tenant-muted)]"
          }`}
        >
          {categoriaNombre}
        </p>

        {imagenUrl && (
          <img
            src={imagenUrl}
            alt={nombre}
            className="aspect-square w-full rounded-2xl object-cover"
          />
        )}

        <h2
          className={`font-black uppercase tracking-tight ${
            featured ? "text-white" : "text-neutral-900"
          }`}
          style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(22px,3vw,30px)" }}
        >
          {nombre}
        </h2>

        <p
          className={`text-sm font-light leading-relaxed ${
            featured ? "text-white/55" : "text-[var(--tenant-muted)]"
          }`}
        >
          {descripcion}
        </p>
      </div>

      <div className="mt-8 flex items-end justify-between">
        <div>
          <span
            className={`font-black leading-none ${
              featured ? "text-white" : "text-[var(--tenant-primary)]"
            }`}
            style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "44px" }}
          >
            S/{precio}
          </span>
          {puntos > 0 && (
            <p
              className={`mt-1 text-[9px] font-semibold uppercase tracking-widest ${
                featured ? "text-white/40" : "text-[var(--tenant-muted)]"
              }`}
            >
              +{puntos} pts
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {cantidadEnCarrito > 0 && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/10 text-[10px] font-bold">
              {cantidadEnCarrito}
            </span>
          )}
          <button
            type="button"
            onClick={handleAdd}
            className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] transition ${
              added
                ? "bg-emerald-500 text-white"
                : featured
                  ? "bg-white text-black hover:bg-neutral-200"
                  : "bg-neutral-900 text-white hover:bg-neutral-700"
            }`}
          >
            {added ? "✓ Agregado" : "Agregar"}
          </button>
        </div>
      </div>
    </article>
  );
}
