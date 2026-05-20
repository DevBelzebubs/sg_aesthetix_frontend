"use client";

import { useCart } from "@/contexts/cart-context";
import { Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

const WA_NUMBER = process.env.NEXT_PUBLIC_WA_NUMBER;

export function CartDrawer() {
  const params = useParams();
  const slug = params?.slug as string;
  const { items, removeItem, updateQuantity, clearCart, totalItems, totalPrice, isCartOpen, closeCart } = useCart();

  const handleWhatsApp = () => {
    const lines = items.map(
      (item, i) =>
        `${i + 1}. ${item.nombre} x${item.cantidad} — S/${(item.precio * item.cantidad).toFixed(2)}`,
    );

    const message = [
      " *Nuevo Pedido*",
      "",
      ...lines,
      "",
      `*Total: S/${totalPrice.toFixed(2)}*`,
      "",
      "Tienda online",
    ].join("\n");

    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <>
      {/* Overlay */}
      {isCartOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 transition-opacity"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-xl transition-transform duration-300 ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-5">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
              Tienda
            </p>
            <h2 className="mt-1 text-lg font-bold uppercase tracking-tight">
              Carrito{totalItems > 0 ? ` (${totalItems})` : ""}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {totalItems > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 transition hover:text-red-500"
              >
                Vaciar
              </button>
            )}
            <button
              type="button"
              onClick={closeCart}
              className="flex h-8 w-8 items-center justify-center border border-black/10 transition hover:bg-neutral-100"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {totalItems === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
              <ShoppingCart size={36} className="text-neutral-300" />
              <p className="mt-4 text-sm font-semibold text-neutral-500">Tu carrito está vacío</p>
              <Link
                href={`/${slug}/productos`}
                onClick={closeCart}
                className="mt-6 inline-block bg-black px-8 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-white transition hover:opacity-75"
              >
                Ver productos
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-black/5">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center gap-4 px-6 py-4">
                  {item.imagenUrl && (
                    <img
                      src={item.imagenUrl}
                      alt={item.nombre}
                      className="h-16 w-16 shrink-0 rounded-xl object-cover"
                    />
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-tight">{item.nombre}</p>
                    <p className="mt-0.5 text-sm font-black">
                      S/{(item.precio * item.cantidad).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, item.cantidad - 1)}
                      className="flex h-7 w-7 items-center justify-center border border-black/10 text-xs transition hover:bg-neutral-100"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="flex h-7 w-7 items-center justify-center text-xs font-bold">
                      {item.cantidad}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, item.cantidad + 1)}
                      className="flex h-7 w-7 items-center justify-center border border-black/10 text-xs transition hover:bg-neutral-100"
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center text-neutral-400 transition hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {totalItems > 0 && (
          <div className="border-t border-black/10 px-6 py-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-tight text-neutral-500">
                Total
              </p>
              <p className="text-xl font-black">S/{totalPrice.toFixed(2)}</p>
            </div>

            <button
              type="button"
              onClick={handleWhatsApp}
              className="mt-4 flex w-full items-center justify-center gap-3 bg-black px-8 py-4 text-[10px] font-bold uppercase tracking-[0.15em] text-white transition hover:opacity-75"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Confirmar pedido por WhatsApp
            </button>

            <Link
              href={`/${slug}/productos`}
              onClick={closeCart}
              className="mt-3 block text-center text-[10px] font-semibold uppercase tracking-widest text-neutral-400 transition hover:text-black"
            >
              ← Seguir comprando
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
