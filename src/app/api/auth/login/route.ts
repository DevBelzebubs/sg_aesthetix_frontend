import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json({ error: "Email y contraseña requeridos" }, { status: 400 });
    }

    console.log("[LOGIN] Email:", email);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const keyType = process.env.SUPABASE_SERVICE_ROLE_KEY ? "service_role" : "anon";

    console.log("[LOGIN] Key type:", keyType);

    const userRes = await fetch(
      `${supabaseUrl}/rest/v1/usuarios?correo_electronico=eq.${encodeURIComponent(email)}&select=*`,
      { headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` } },
    );

    if (!userRes.ok) {
      const body = await userRes.text();
      console.error("[LOGIN] Supabase error:", userRes.status, body);
      return Response.json({ error: "Credenciales incorrectas" }, { status: 401 });
    }

    const usuarios = await userRes.json();
    console.log("[LOGIN] Usuarios encontrados:", usuarios?.length);

    if (!usuarios?.length) {
      console.error("[LOGIN] No se encontró usuario con ese email");
      return Response.json({ error: "Credenciales incorrectas" }, { status: 401 });
    }

    const usuario = usuarios[0];
    console.log("[LOGIN] Usuario ID:", usuario.id, "activo:", usuario.esta_activo);

    if (!usuario.esta_activo) {
      return Response.json({ error: "Cuenta desactivada" }, { status: 403 });
    }

    const storedHash = usuario.clave_hash;
    console.log("[LOGIN] Hash raw:", JSON.stringify(storedHash));
    console.log("[LOGIN] Hash prefix:", storedHash?.substring(0, 10), "length:", storedHash?.length);
    const testHash = await bcrypt.hash("admin123", 14);
    console.log("[LOGIN] Test hash for admin123:", testHash);
    const testCompare = await bcrypt.compare("admin123", testHash);
    console.log("[LOGIN] Test compare with fresh hash:", testCompare);
    const valid = storedHash ? await bcrypt.compare(password, storedHash) : false;
    console.log("[LOGIN] Password válido:", valid);

    if (!valid) {
      return Response.json({ error: "Credenciales incorrectas" }, { status: 401 });
    }

    return Response.json({
      success: true,
      userId: usuario.id,
      role: usuario.rol,
    });
  } catch (err) {
    console.error("[LOGIN] Error:", err);
    return Response.json({ error: "Error interno" }, { status: 500 });
  }
}
