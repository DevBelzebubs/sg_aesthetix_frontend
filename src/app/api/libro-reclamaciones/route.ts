import { resend, FROM_EMAIL } from "@/lib/email/resend";
import { complaintCopyEmailHtml } from "@/lib/email/templates/complaint-copy";
import { adminNotificationEmailHtml } from "@/lib/email/templates/admin-notification";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
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
    const {
      tenantSlug,
      tipo,
      nombres,
      apellidos,
      dni,
      domicilio,
      telefono,
      email,
      bienContratado,
      montoReclamado,
      descripcion,
      pedidoConsumidor,
    } = body;

    if (!tenantSlug || !tipo || !nombres || !apellidos || !email || !descripcion) {
      return Response.json(
        { error: "Faltan campos obligatorios: tenantSlug, tipo, nombres, apellidos, email, descripcion" },
        { status: 400 },
      );
    }

    if (!["queja", "reclamo"].includes(tipo)) {
      return Response.json({ error: "El campo tipo debe ser 'queja' o 'reclamo'" }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email)) {
      return Response.json({ error: "El correo electrónico no tiene un formato válido" }, { status: 400 });
    }

    if (dni && !/^\d{8}$/.test(dni)) {
      return Response.json({ error: "El DNI debe tener 8 dígitos" }, { status: 400 });
    }

    if (telefono && !/^(\+?\d{1,3})?\d{7,9}$/.test(String(telefono).replace(/\s/g, ""))) {
      return Response.json({ error: "El teléfono no tiene un formato válido" }, { status: 400 });
    }

    const insertRes = await fetch(
      `${SUPABASE_URL}/rest/v1/libro_reclamaciones`,
      {
        method: "POST",
        headers: apiHeaders(ANON_KEY),
        body: JSON.stringify({
          tenant_slug: tenantSlug,
          tipo,
          nombres,
          apellidos,
          dni: dni || null,
          domicilio: domicilio || null,
          telefono: telefono || null,
          email,
          bien_contratado: bienContratado || null,
          monto_reclamado: montoReclamado || null,
          descripcion,
          pedido_consumidor: pedidoConsumidor || null,
        }),
      },
    );

    if (!insertRes.ok) {
      const errBody = await insertRes.text();
      console.error("Insert complaint failed:", errBody);
      return Response.json({ error: "Error al registrar el reclamo" }, { status: 500 });
    }

    const records = await insertRes.json();
    const complaint = Array.isArray(records) ? records[0] : records;

    const numeroReclamo = complaint.id.slice(0, 8).toUpperCase();
    const fecha = new Date(complaint.creado_en).toLocaleDateString("es-PE", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const tenantName = tenantSlug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

    const consumerEmailHtml = complaintCopyEmailHtml({
      numeroReclamo,
      nombres,
      apellidos,
      tipo,
      descripcion,
      fecha,
      tenantName,
    });

    const emailPromises: Promise<unknown>[] = [];

    emailPromises.push(
      resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: `Copia de su ${tipo} - Libro de Reclamaciones - ${tenantName}`,
        html: consumerEmailHtml,
      }),
    );

    if (SERVICE_KEY) {
      const adminRes = await fetch(
        `${SUPABASE_URL}/rest/v1/usuarios?rol=eq.admin&esta_activo=eq.true&select=correo_electronico`,
        { headers: apiHeaders(SERVICE_KEY) },
      );
      const admins = await adminRes.json();

      if (Array.isArray(admins) && admins.length > 0) {
        const adminEmails = admins
          .map((a: Record<string, unknown>) => a.correo_electronico as string)
          .filter(Boolean);

        if (adminEmails.length > 0) {
          const adminHtml = adminNotificationEmailHtml({
            numeroReclamo,
            nombres,
            apellidos,
            tipo,
            email,
            telefono: telefono || undefined,
            tenantSlug,
          });

          emailPromises.push(
            resend.emails.send({
              from: FROM_EMAIL,
              to: adminEmails,
              subject: `Nuevo ${tipo} - Libro de Reclamaciones - ${tenantName}`,
              html: adminHtml,
            }),
          );
        }
      }
    }

    await Promise.allSettled(emailPromises);

    return Response.json({
      success: true,
      id: complaint.id,
      numeroReclamo,
      message: "Su reclamo ha sido registrado. Recibirá una copia por correo electrónico.",
    });
  } catch (error) {
    console.error("Libro reclamaciones error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Error interno del servidor" },
      { status: 500 },
    );
  }
}
