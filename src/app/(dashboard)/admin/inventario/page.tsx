import { ModulePageShell } from "@/components/dashboard/module-page-shell";

const stock = [
  { product: "Cera mate", category: "Estilizado", level: "12", min: "10" },
  { product: "Shampoo detox", category: "Lavado", level: "4", min: "8" },
  { product: "Navajas", category: "Herramientas", level: "22", min: "15" },
];

export default function InventarioPage() {
  return (
    <ModulePageShell
      title="Inventario"
      description="Controla productos, entradas, salidas y alertas por stock bajo."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {stock.map((item) => (
          <article key={item.product} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-base font-semibold">{item.product}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-zinc-500">{item.category}</p>
            <p className="mt-4 text-sm text-zinc-700">Stock actual: {item.level}</p>
            <p className="text-sm text-zinc-700">Mínimo recomendado: {item.min}</p>
          </article>
        ))}
      </div>
    </ModulePageShell>
  );
}
