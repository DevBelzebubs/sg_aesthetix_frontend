import Link from "next/link";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function QrPage({ params }: Props) {
  const { slug } = await params;
  const url = `https://${process.env.NEXT_PUBLIC_VERCEL_URL || "localhost:3000"}/${slug}/promocion`;

  return (
    <section className="mx-auto flex max-w-md flex-col items-center px-6 py-16 text-center">
      <div
        className="mb-2 h-[3px] w-10 rounded-full"
        style={{ background: "#324730" }}
      />
      <p
        className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em]"
        style={{ color: "#324730" }}
      >
        For Men Castilla
      </p>
      <h1 className="text-2xl font-black uppercase tracking-tight">
        Recibe tu recompensa
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        Escanea el c&oacute;digo con tu celular para registrarte y recibir puntos de bienvenida.
      </p>

      <div className="mt-8 border-4 border-black p-4">
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`}
          alt="QR para recompensas"
          className="h-64 w-64"
        />
      </div>

      <p className="mt-6 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
        O ingresa desde tu navegador en
      </p>
      <p className="mt-1 text-xs text-neutral-600 break-all">{url}</p>

      <Link
        href={`/${slug}`}
        className="mt-10 inline-block border border-black/15 px-6 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-black transition hover:border-black/40"
      >
        Volver al inicio
      </Link>
    </section>
  );
}
