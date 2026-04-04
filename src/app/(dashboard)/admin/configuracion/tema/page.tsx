import { ModulePageShell } from "@/components/dashboard/module-page-shell";

export default function TemaPage() {
  return (
    <ModulePageShell
      title="Tema y marca"
      description="Personaliza colores, logo y redes para que la web refleje tu barbería."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold">Color principal</p>
          <div className="mt-3 h-10 rounded-xl bg-zinc-900" />
        </article>
        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold">Color de acento</p>
          <div className="mt-3 h-10 rounded-xl bg-amber-400" />
        </article>
      </div>
    </ModulePageShell>
  );
}
