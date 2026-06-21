"use client";

import { useCart } from "@/contexts/cart-context";

type ProductCardProps = {
  productId: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagenUrl?: string;
  categoriaNombre: string;
  puntos: number;
  index: number;
  onNotify: (message: string) => void;
};

export function ProductCard({
  productId,
  nombre,
  descripcion,
  precio,
  puntos,
  imagenUrl,
  categoriaNombre,
  onNotify,
}: ProductCardProps) {
  const { addItem, removeItem, updateQuantity, items } = useCart();

  const cartItem = items.find((i) => i.productId === productId);
  const cantidadEnCarrito = cartItem?.cantidad ?? 0;

  const handleAdd = () => {
    addItem({ productId, nombre, precio, cantidad: 1, imagenUrl });
    onNotify(`${nombre} agregado al carrito`);
  };

  const handleRemove = () => {
    if (cantidadEnCarrito === 0) return;
    const nuevaCantidad = cantidadEnCarrito - 1;
    if (nuevaCantidad === 0) {
      removeItem(productId);
    } else {
      updateQuantity(productId, nuevaCantidad);
    }
    onNotify(`1 unidad de ${nombre} quitada`);
  };

  return (
    <article className="group relative flex flex-col justify-between bg-[var(--background-secondary)] p-5 transition hover:-translate-y-px">
      <div className="space-y-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
          {categoriaNombre}
        </p>

        {imagenUrl && (
          <img
            src={imagenUrl}
            alt={nombre}
            className="aspect-[16/10] w-full rounded-lg object-cover"
          />
        )}

        <h2
          className="font-black uppercase tracking-tight text-[var(--foreground)]"
          style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(18px,2.2vw,24px)" }}
        >
          {nombre}
        </h2>

        <p className="text-sm font-light leading-relaxed text-[var(--text-muted)]">
          {descripcion}
        </p>
      </div>

      <div className="mt-5 flex items-end justify-between">
        <div>
          <span
            className="font-black leading-none text-[var(--tenant-primary)]"
            style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "32px" }}
          >
            S/{precio}
          </span>
          {puntos > 0 && (
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              +{puntos} pts
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {cantidadEnCarrito > 0 && (
            <>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--foreground)]/10 text-[10px] font-bold text-[var(--foreground)]">
                {cantidadEnCarrito}
              </span>
              <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--destructive)] transition hover:opacity-70"
            >
              Quitar
            </button>
            </>
          )}
          <button
            type="button"
            onClick={handleAdd}
            className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] bg-[var(--foreground)] text-[var(--background)] transition hover:bg-[var(--foreground)]/75"
          >
            Agregar
          </button>
        </div>
      </div>
    </article>
  );
}
