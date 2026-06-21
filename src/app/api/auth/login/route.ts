import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json({ error: "Email y contraseña requeridos" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const userRes = await fetch(
      `${supabaseUrl}/rest/v1/usuarios?correo_electronico=eq.${encodeURIComponent(email)}&select=*`,
      { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } },
    );
    const usuarios = await userRes.json();

    if (!usuarios?.length) {
      return Response.json({ error: "Credenciales incorrectas" }, { status: 401 });
    }

    const usuario = usuarios[0];

    if (!usuario.esta_activo) {
      return Response.json({ error: "Cuenta desactivada" }, { status: 403 });
    }

    const valid = await bcrypt.compare(password, usuario.clave_hash);
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
