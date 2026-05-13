import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
    let res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value)
          );
          res = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;
  const segments = pathname.split("/").filter(Boolean);
  const slug = segments[0];
  const section = segments[1];

  const isLoginPage = section === "login";

  // Con sesión en login → redirigir a su panel
  if (session && isLoginPage) {
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("rol")
      .eq("auth_user_id", session.user.id)
      .single();

    if (usuario?.rol === "admin") {
      const url = req.nextUrl.clone();
      url.pathname = `/admin`;
      return NextResponse.redirect(url);
    }

    if (usuario?.rol === "empleado") {
      const url = req.nextUrl.clone();
      url.pathname = `/empleado`;
      return NextResponse.redirect(url);
    }
  }

  // Sin sesión en /admin o /empleado → login
  if (!session && (pathname.startsWith("/admin") || pathname.startsWith("/empleado"))) {
    const url = req.nextUrl.clone();
    url.pathname = `/${slug}/login`;
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: [
    "/:slug((?!_next|favicon|api)[^/]+)/:section(login)/:path*",
    "/admin/:path*",
    "/empleado/:path*",
  ],
};