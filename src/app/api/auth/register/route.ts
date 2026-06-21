export async function POST(request: Request) {
  try {
    const { email, password, role } = await request.json();

    if (!email || !password) {
      return Response.json({ error: "Email y contraseña requeridos" }, { status: 400 });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Try creating via admin API first (requires service role key)
    if (serviceKey) {
      const createRes = await fetch(
        `${supabaseUrl}/auth/v1/admin/users`,
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
            user_metadata: { role: role || "empleado" },
          }),
        },
      );

      const createData = await createRes.json();

      if (createRes.ok && createData?.user?.id) {
        return Response.json({ success: true, auth_user_id: createData.user.id });
      }

      if (createData?.code === 422 || createData?.error_code === "email_exists") {
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
              body: JSON.stringify({ password, email_confirm: true, user_metadata: { role: role || "empleado" } }),
            },
          );
          return Response.json({ success: true, auth_user_id: existingUser.id });
        }
      }

      return Response.json({ error: "No se pudo crear el usuario en Auth" }, { status: 500 });
    }

    // Fallback: use signup with anon key (requires auto-confirm enabled in Supabase)
    const signUpRes = await fetch(
      `${supabaseUrl}/auth/v1/signup`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: anonKey,
        },
        body: JSON.stringify({
          email,
          password,
          data: { role: role || "empleado" },
        }),
      },
    );

    const signUpData = await signUpRes.json();

    if (signUpRes.ok && signUpData?.id) {
      return Response.json({ success: true, auth_user_id: signUpData.id });
    }

    return Response.json({ error: signUpData?.msg || "No se pudo crear el usuario" }, { status: 500 });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Error interno" }, { status: 500 });
  }
}
