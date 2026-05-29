
export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return Response.json({ error: "Email y contraseña requeridos" }, { status: 400 });
  }

  // 1. Validar que el usuario existe y está activo en nuestra tabla
  const userRes = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/usuarios?correo_electronico=eq.${encodeURIComponent(email)}&select=*`,
    { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}` } },
  );
  const usuarios = await userRes.json();

  if (!usuarios?.length) {
    return Response.json({ error: "Credenciales incorrectas" }, { status: 401 });
  }

  const usuario = usuarios[0];
  if (!usuario.esta_activo) {
    return Response.json({ error: "Cuenta desactivada" }, { status: 403 });
  }

  // 2. Sincronizar contraseña en Supabase Auth
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return Response.json({ error: "Falta SUPABASE_SERVICE_ROLE_KEY en .env" }, { status: 500 });
  }

  // 2. Sincronizar usuario en Auth (sin enviar emails)
  const listRes = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users?filter=email&filter_value=${encodeURIComponent(email)}`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
  );
  const authUsers = await listRes.json();
  const existingAuthUser = authUsers?.users?.[0];

  if (existingAuthUser?.id) {
    // Ya existe → solo actualizar contraseña (sin email)
    await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${existingAuthUser.id}`,
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
  } else {
    // No existe → crear (sin email de confirmación)
    const createRes = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`,
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
    if (createData?.user?.id) {
      await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/usuarios?id=eq.${usuario.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
            Prefer: "return=minimal",
          },
          body: JSON.stringify({ auth_user_id: createData.user.id }),
        },
      );
    }
  }

  // Crear nuevo usuario Auth via admin API (sin enviar email)
  const createRes = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: usuario.rol },
      }),
    },
  );
  const createData = await createRes.json();

  if (!createData?.user?.id) {
    console.error("Create auth user failed:", createData);
    return Response.json({ error: `No se pudo crear el usuario en Auth: ${JSON.stringify(createData)}` }, { status: 500 });
  }

  // Vincular nuevo auth_user_id
  const patchRes = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/usuarios?id=eq.${usuario.id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ auth_user_id: createData.user.id }),
    },
  );

  if (!patchRes.ok) {
    console.error("Patch auth_user_id failed:", await patchRes.text());
  }

  return Response.json({ success: true, email });
}
