
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json({ error: "Email y contraseña requeridos" }, { status: 400 });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    console.log("[LOGIN] serviceKey exists:", !!serviceKey);
    console.log("[LOGIN] supabaseUrl:", supabaseUrl?.slice(0, 20) + "...");

    if (!serviceKey) {
      return Response.json({ error: "Falta SUPABASE_SERVICE_ROLE_KEY en .env" }, { status: 500 });
    }

    // 1. Validar que el usuario existe y está activo en nuestra tabla
    const userRes = await fetch(
      `${supabaseUrl}/rest/v1/usuarios?correo_electronico=eq.${encodeURIComponent(email)}&select=*`,
      { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } },
    );
    const usuarios = await userRes.json();

    if (!usuarios?.length) {
      console.log("[LOGIN] Usuario no encontrado en tabla usuarios");
      return Response.json({ error: "Credenciales incorrectas" }, { status: 401 });
    }

    const usuario = usuarios[0];
    if (!usuario.esta_activo) {
      return Response.json({ error: "Cuenta desactivada" }, { status: 403 });
    }

    // 2. Sincronizar usuario en Auth — intentar crear primero, si ya existe actualizar
    const createRes = await fetch(
      `${supabaseUrl}/auth/v1/admin/users`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { role: usuario.rol } }),
      },
    );
    const createData = await createRes.json();
    console.log("[LOGIN] Admin create response status:", createRes.status, "body:", JSON.stringify(createData).slice(0, 200));

    if (createData?.user?.id) {
      console.log("[LOGIN] Usuario creado en Auth, id:", createData.user.id);
      const patchRes = await fetch(
        `${supabaseUrl}/rest/v1/usuarios?id=eq.${usuario.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
            Prefer: "return=minimal",
          },
          body: JSON.stringify({ auth_user_id: createData.user.id }),
        },
      );

      if (!patchRes.ok) {
        console.error("[LOGIN] Patch auth_user_id failed:", await patchRes.text());
      }
    } else if (createData?.code === 422 || createData?.error_code === "email_exists") {
      console.log("[LOGIN] Usuario ya existe en Auth, actualizando password");
      const listRes = await fetch(
        `${supabaseUrl}/auth/v1/admin/users`,
        { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
      );
      const listData = await listRes.json();
      const existingUser = listData?.users?.find((u: { email?: string }) => u.email === email);
      if (existingUser?.id) {
        await fetch(
          `${supabaseUrl}/auth/v1/admin/users/${existingUser.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              apikey: serviceKey,
              Authorization: `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({ password, email_confirm: true }),
          },
        );
        console.log("[LOGIN] Password actualizado para:", existingUser.id);
      } else {
        console.error("[LOGIN] Could not find existing auth user by email");
      }
    } else {
      console.error("[LOGIN] Create auth user failed:", createData);
      return Response.json({ error: `No se pudo sincronizar el usuario en Auth` }, { status: 500 });
    }

    // 3. Crear sesión y devolver tokens (usando REST directo, no createClient)
    const signInRes = await fetch(
      `${supabaseUrl}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: anonKey,
        },
        body: JSON.stringify({ email, password }),
      },
    );
    const signInData = await signInRes.json();

    if (!signInRes.ok || !signInData?.access_token) {
      console.error("[LOGIN] signIn error:", signInData);
      return Response.json({ error: "Error al iniciar sesión" }, { status: 500 });
    }

    return Response.json({
      success: true,
      accessToken: signInData.access_token,
      refreshToken: signInData.refresh_token,
      rol: usuario.rol,
    });
  } catch (err) {
    console.error("[LOGIN] Error crítico:", err);
    return Response.json({ error: err instanceof Error ? err.message : "Error interno" }, { status: 500 });
  }
}
