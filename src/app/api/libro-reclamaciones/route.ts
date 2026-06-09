import emailjs from "@emailjs/nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID!;
const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY!;
const EMAILJS_PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY!;
const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID!;

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

    // Validaciones de campos obligatorios
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

    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        numeroReclamo,
        tipo: tipo === "reclamo" ? "Reclamo" : "Queja",
        nombres,
        apellidos,
        dni: dni || "No especificado",
        domicilio: domicilio || "No especificado",
        telefono: telefono || "No especificado",
        email,
        bienContratado: bienContratado || "No especificado",
        montoReclamado: montoReclamado ? Number(montoReclamado).toFixed(2) : "0.00",
        descripcion,
        pedidoConsumidor: pedidoConsumidor || "No especificado",
        fecha,
        tenantName,
        to_email: email,
      },
      {
        publicKey: EMAILJS_PUBLIC_KEY,
        privateKey: EMAILJS_PRIVATE_KEY,
      }
    );

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