import { NextRequest, NextResponse } from "next/server";

const encoder = new TextEncoder();

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyCodigo(codigo: string, salt: string, hash: string): Promise<boolean> {
  const data = encoder.encode(codigo + salt);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const computedHash = bytesToHex(new Uint8Array(digest));
  return computedHash === hash;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, codigo } = body;

    if (!id || !codigo) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const headers = {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
    };

    const res = await fetch(
      `${supabaseUrl}/rest/v1/clientes?id=eq.${id}&select=codigo_verificacion_hash,codigo_verificacion_salt,codigo_verificacion_expira,email_confirmado`,
      { headers },
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Error al buscar cliente" }, { status: 500 });
    }

    const customers = await res.json();
    if (!customers?.length) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    const customer = customers[0];

    if (customer.email_confirmado) {
      return NextResponse.json({ error: "El correo ya fue verificado" }, { status: 400 });
    }

    if (!customer.codigo_verificacion_hash || !customer.codigo_verificacion_salt) {
      return NextResponse.json({ error: "No hay código de verificación pendiente" }, { status: 400 });
    }

    if (customer.codigo_verificacion_expira && new Date(customer.codigo_verificacion_expira) < new Date()) {
      return NextResponse.json({ error: "El código de verificación ha expirado. Regístrate nuevamente." }, { status: 400 });
    }

    const valido = await verifyCodigo(codigo, customer.codigo_verificacion_salt, customer.codigo_verificacion_hash);
    if (!valido) {
      return NextResponse.json({ error: "Código de verificación incorrecto" }, { status: 400 });
    }

    await fetch(
      `${supabaseUrl}/rest/v1/clientes?id=eq.${id}`,
      {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          email_confirmado: true,
          codigo_verificacion_hash: null,
          codigo_verificacion_salt: null,
          codigo_verificacion_expira: null,
        }),
      },
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 },
    );
  }
}
