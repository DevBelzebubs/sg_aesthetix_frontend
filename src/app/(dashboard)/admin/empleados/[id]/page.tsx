type EmpleadoDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EmpleadoDetailPage({ params }: EmpleadoDetailPageProps) {
  const { id } = await params;

  return (
    <section className="space-y-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Detalle</p>
      <h1 className="text-3xl font-bold tracking-tight">Perfil del empleado #{id}</h1>
      <p className="text-sm text-zinc-600">
        Aquí verás sus horarios, citas del día y desempeño semanal.
      </p>
    </section>
  );
}
