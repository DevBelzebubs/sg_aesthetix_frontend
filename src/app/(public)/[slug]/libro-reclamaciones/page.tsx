import type { Metadata } from "next";
import Link from "next/link";
import { ComplaintBookForm } from "@/components/public/complaint-book-form";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Libro de Reclamaciones | ${slug}`,
    description:
      "Registre su queja o reclamo de acuerdo a la Ley N° 29571 - Código de Protección y Defensa del Consumidor.",
  };
}

export default async function LibroReclamacionesPage({ params }: Props) {
  const { slug } = await params;

  return (
    <section className="space-y-6 py-8">
      <ComplaintBookForm slug={slug} />

      <div className="pt-4 pb-12">
        <Link
          href={`/${slug}`}
          className="inline-flex items-center gap-2 border border-[var(--border)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] transition hover:border-[var(--hover)] hover:text-[var(--hover)]"
        >
          Volver al inicio
        </Link>
      </div>
    </section>
  );
}
