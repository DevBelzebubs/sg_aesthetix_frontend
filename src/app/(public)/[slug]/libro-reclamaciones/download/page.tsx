"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { AlertCircle, Loader2, Download } from "lucide-react";

function wrapText(text: string, maxWidth: number, font: PDFFont, fontSize: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const textWidth = font.widthOfTextAtSize(testLine, fontSize);
    if (textWidth > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function DownloadContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const id = searchParams.get("id");
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [numeroReclamo, setNumeroReclamo] = useState("");

  useEffect(() => {
    if (!id) {
      setError("Falta el identificador del documento.");
      setLoading(false);
      return;
    }

    async function handlePdfGeneration() {
      try {
        // 1. Obtener la data directo de Supabase usando el cliente REST público
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        const res = await fetch(`${supabaseUrl}/rest/v1/libro_reclamaciones?id=eq.${id}`, {
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
        });

        if (!res.ok) throw new Error("No se pudo obtener la información del reclamo.");

        const data = await res.json();
        if (!data || data.length === 0) throw new Error("El reclamo especificado no existe.");

        const complaint = data[0];
        const numRec = complaint.id.slice(0, 8).toUpperCase();
        setNumeroReclamo(numRec);

        const fechaFormateada = new Date(complaint.creado_en).toLocaleDateString("es-PE", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        const tenantName = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

        // 2. Compilar el PDF usando pdf-lib en el navegador
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595.275, 841.89]);
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        let y = 800;

        // Estilo PDF Barbería Premium
        page.drawText("HOJA DE RECLAMACIÓN VIRTUAL", { x: 50, y, size: 16, font: boldFont, color: rgb(0.06, 0.06, 0.06) });
        page.drawText(tenantName.toUpperCase(), { x: 50, y: y - 18, size: 11, font, color: rgb(0.52, 0.43, 0.14) });
        page.drawLine({ start: { x: 50, y: y - 28 }, end: { x: 545, y: y - 28 }, thickness: 2, color: rgb(0.83, 0.69, 0.22) });

        y -= 60;
        page.drawRectangle({ x: 50, y: y - 10, width: 495, height: 40, color: rgb(0.98, 0.97, 0.95), borderColor: rgb(0.83, 0.69, 0.22), borderWidth: 1 });
        page.drawText(`N° DE RECLAMO: ${numRec}`, { x: 65, y: y + 14, size: 12, font: boldFont, color: rgb(0.06, 0.06, 0.06) });
        page.drawText(`Fecha: ${fechaFormateada}`, { x: 400, y: y + 14, size: 10, font, color: rgb(0.4, 0.4, 0.4) });

        y -= 40;

        const renderSection = (title: string) => {
          y -= 25;
          page.drawText(title, { x: 50, y, size: 10, font: boldFont, color: rgb(0.06, 0.06, 0.06) });
          page.drawLine({ start: { x: 50, y: y - 4 }, end: { x: 545, y: y - 4 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
          y -= 15;
        };

        const renderRow = (label: string, val: string) => {
          page.drawText(`${label}:`, { x: 50, y, size: 9, font: boldFont, color: rgb(0.4, 0.4, 0.4) });
          page.drawText(String(val || "No especificado"), { x: 180, y, size: 9, font, color: rgb(0.1, 0.1, 0.1) });
          y -= 16;
        };

        renderSection("1. IDENTIFICACIÓN DEL CONSUMIDOR");
        renderRow("Nombres y Apellidos", `${complaint.nombres} ${complaint.apellidos}`);
        renderRow("Teléfono", complaint.telefono);
        renderRow("Correo electrónico", complaint.email);
        renderRow("Domicilio", complaint.domicilio);

        renderSection("2. DETALLE DEL BIEN O SERVICIO CONTRATADO");
        renderRow("Tipo", complaint.tipo.toUpperCase());
        renderRow("Bien o Servicio", complaint.bien_contratado);
        renderRow("Monto Reclamado", complaint.monto_reclamado ? `S/ ${Number(complaint.monto_reclamado).toFixed(2)}` : "0.00");

        renderSection("3. DETALLE DE LA RECLAMACIÓN Y PEDIDO");
        page.drawText("Descripción de los hechos:", { x: 50, y, size: 9, font: boldFont, color: rgb(0.4, 0.4, 0.4) });
        y -= 14;
        const dLines = wrapText(complaint.descripcion, 495, font, 9);
        for (const l of dLines) {
          page.drawText(l, { x: 50, y, size: 9, font, color: rgb(0.1, 0.1, 0.1) });
          y -= 14;
        }

        y -= 10;
        page.drawText("Pedido del consumidor:", { x: 50, y, size: 9, font: boldFont, color: rgb(0.4, 0.4, 0.4) });
        y -= 14;
        const pLines = wrapText(complaint.pedido_consumidor || "No especificado", 495, font, 9);
        for (const l of pLines) {
          page.drawText(l, { x: 50, y, size: 9, font, color: rgb(0.1, 0.1, 0.1) });
          y -= 14;
        }

        page.drawText("* Copia electrónica de validez legal conforme a lo estipulado por la Ley N° 29571.", { x: 50, y: 40, size: 8, font, color: rgb(0.6, 0.6, 0.6) });

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        setPdfBlobUrl(url);

        const a = document.createElement("a");
        a.href = url;
        a.download = `Reclamo-${numRec}.pdf`;
        a.click();
        
        setLoading(false);
      } catch (err: unknown) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Error al procesar el documento.");
        setLoading(false);
      }
    }

    handlePdfGeneration();
  }, [id, slug]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--hover)]" style={{ color: "var(--hover, #d4af37)" }} />
        <h2 className="mt-4 text-lg font-bold text-[var(--foreground)]">Generando tu hoja de reclamación...</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Esto tomará solo unos segundos. La descarga iniciará automáticamente.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-[var(--destructive-border)] bg-[var(--destructive-hover)] p-6 text-center text-[var(--destructive)]">
        <AlertCircle className="mx-auto h-8 w-8" />
        <h2 className="mt-3 font-bold">No se pudo descargar el archivo</h2>
        <p className="mt-1 text-xs leading-relaxed">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md text-center py-12">
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--hover)]/15" style={{ backgroundColor: "rgba(212,175,55,0.15)" }}>
        <Download className="h-9 w-9" style={{ color: "#d4af37" }} />
      </div>
      <h2 className="text-xl font-bold text-[var(--foreground)]">¡Tu PDF está listo!</h2>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        La descarga de tu hoja de reclamación <strong className="text-[var(--foreground)]">N° {numeroReclamo}</strong> debió empezar.
      </p>
      {pdfBlobUrl && (
        <a
          href={pdfBlobUrl}
          download={`Reclamo-${numeroReclamo}.pdf`}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--hover)] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
          style={{ backgroundColor: "#111111", border: "1px solid #d4af37" }}
        >
          ¿No descargó? Haz clic aquí
        </a>
      )}
    </div>
  );
}

export default function DownloadComplaintPage() {
  return (
    <div className="container mx-auto px-4 py-24 min-h-[60vh] flex items-center justify-center">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center text-center">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          <h2 className="mt-4 text-lg font-medium">Cargando módulo de descargas...</h2>
        </div>
      }>
        <DownloadContent />
      </Suspense>
    </div>
  );
}