import { resend, FROM_EMAIL } from "@/lib/email/resend";
import { complaintResponseEmailHtml } from "@/lib/email/templates/complaint-response";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function apiHeaders(key: string) {
  return {
    "Content-Type": "application/json",
    apikey: key,
    Authorization: `Bearer ${key}`,
    Prefer: "return=representation",
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, respuesta } = body;

    if (!id || !respuesta?.trim()) {
      return Response.json(
        { error: "Faltan campos obligatorios: id, respuesta" },
        { status: 400 },
      );
    }

    if (!SERVICE_KEY) {
      return Response.json(
        { error: "Falta SUPABASE_SERVICE_ROLE_KEY en .env" },
        { status: 500 },
      );
    }

    const updateRes = await fetch(
      `${SUPABASE_URL}/rest/v1/libro_reclamaciones?id=eq.${id}`,
      {
        method: "PATCH",
        headers: apiHeaders(SERVICE_KEY),
        body: JSON.stringify({
          respuesta: respuesta.trim(),
          respondido_el: new Date().toISOString(),
          estado: "respondido",
          actualizado_en: new Date().toISOString(),
        }),
      },
    );

    if (!updateRes.ok) {
      const errBody = await updateRes.text();
      console.error("Update complaint failed:", errBody);
      return Response.json({ error: "Error al actualizar el reclamo" }, { status: 500 });
    }

    const getRes = await fetch(
      `${SUPABASE_URL}/rest/v1/libro_reclamaciones?id=eq.${id}&select=*`,
      { headers: apiHeaders(SERVICE_KEY) },
    );
    const rows = await getRes.json();
    const complaint = Array.isArray(rows) ? rows[0] : rows;

    if (!complaint) {
      return Response.json({ error: "Reclamo no encontrado" }, { status: 404 });
    }

    const numeroReclamo = complaint.id.slice(0, 8).toUpperCase();
    const tenantName = (complaint.tenant_slug as string)
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c: string) => c.toUpperCase());

    const html = complaintResponseEmailHtml({
      numeroReclamo,
      nombres: complaint.nombres,
      apellidos: complaint.apellidos,
      tipo: complaint.tipo,
      respuesta: respuesta.trim(),
      tenantName,
    });

    const emailResult = await resend.emails.send({
      from: FROM_EMAIL,
      to: complaint.email,
      subject: `Respuesta a su ${complaint.tipo} - Libro de Reclamaciones - ${tenantName}`,
      html,
    });

    return Response.json({
      success: true,
      id: complaint.id,
      emailId: emailResult?.data?.id,
      message: "Respuesta enviada correctamente.",
    });
  } catch (error) {
    console.error("Responder reclamo error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Error interno del servidor" },
      { status: 500 },
    );
  }
}
