import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { credential } = await request.json();

    if (!credential) {
      return NextResponse.json({ error: "Credential required" }, { status: 400 });
    }

    const tokenRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
    );

    if (!tokenRes.ok) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const tokenData = await tokenRes.json();
    const { email, name, given_name, family_name, sub } = tokenData;

    if (!email) {
      return NextResponse.json({ error: "Email not available from Google" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const findRes = await fetch(
      `${supabaseUrl}/rest/v1/clientes?correo_electronico=eq.${encodeURIComponent(email)}&select=*`,
      { headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` } },
    );

    let customer: Record<string, unknown> | null = null;

    if (findRes.ok) {
      const existing = await findRes.json();
      if (existing?.length > 0) {
        customer = existing[0];
      }
    }

    if (customer) {
      const needsNameUpdate =
        given_name && family_name &&
        (customer.nombres !== given_name || customer.apellidos !== family_name);

      if (needsNameUpdate) {
        await fetch(
          `${supabaseUrl}/rest/v1/clientes?id=eq.${customer.id}`,
          {
            method: "PATCH",
            headers: {
              apikey: apiKey,
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              Prefer: "return=representation",
            },
            body: JSON.stringify({
              nombres: given_name,
              apellidos: family_name,
            }),
          },
        );
      }
    } else {
      const createRes = await fetch(
        `${supabaseUrl}/rest/v1/clientes`,
        {
          method: "POST",
          headers: {
            apikey: apiKey,
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            id: crypto.randomUUID(),
            nombres: given_name || name || "Usuario",
            apellidos: family_name || "",
            correo_electronico: email,
            email_confirmado: true,
            esta_activo: true,
          }),
        },
      );

      if (!createRes.ok) {
        const err = await createRes.text();
        return NextResponse.json({ error: `Failed to create customer: ${err}` }, { status: 500 });
      }

      const created = await createRes.json();
      customer = created[0] as Record<string, unknown>;
    }

    return NextResponse.json({
      id: customer.id,
      nombres: customer.nombres,
      apellidos: customer.apellidos || "",
      telefono: customer.telefono || null,
      correoElectronico: customer.correo_electronico || email,
      fechaNacimiento: customer.fecha_nacimiento || null,
    });
  } catch (err) {
    console.error("[GOOGLE_AUTH] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
