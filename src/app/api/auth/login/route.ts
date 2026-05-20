import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return Response.json({ error: "Email y contraseña requeridos" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    },
  );

  // 1. Look up user in `usuarios` table
  const { data: usuario, error: userError } = await supabase
    .from("usuarios")
    .select("*")
    .eq("correo_electronico", email)
    .single();

  if (userError || !usuario) {
    return Response.json({ error: "Credenciales incorrectas" }, { status: 401 });
  }

  const u = usuario as Record<string, unknown>;

  if (!u.esta_activo) {
    return Response.json({ error: "Cuenta desactivada" }, { status: 403 });
  }

  // 2. Try to create/update the auth user via signUp
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role: u.rol } },
  });

  const newUserId = signUpData?.user?.id;

  if (newUserId && !u.auth_user_id) {
    // New auth user was created, link it
    await supabase
      .from("usuarios")
      .update({ auth_user_id: newUserId })
      .eq("id", u.id);
    return Response.json({ created: true, email });
  }

  if (newUserId && u.auth_user_id) {
    // Auth user was re-created with new password
    await supabase
      .from("usuarios")
      .update({ auth_user_id: newUserId })
      .eq("id", u.id);
    return Response.json({ created: true, email });
  }

  // signUp didn't create a new user (existing auth user, password unchanged)
  // Try signing in directly — maybe the password matches auth.users already
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

  if (signInData?.session) {
    return Response.json({ created: false, email });
  }

  // Neither signIn nor signUp worked — user needs to reset password in dashboard
  return Response.json({
    error: `El usuario existe pero la contraseña no es válida. Ve a Supabase Dashboard > SQL Editor y ejecuta:
UPDATE auth.users SET encrypted_password = crypt('${password}', gen_salt('bf')) WHERE email = '${email}';`,
    needsReset: true,
  }, { status: 409 });
}
