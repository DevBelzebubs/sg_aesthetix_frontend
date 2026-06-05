import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const id = searchParams.get("id");

  if (!token || !id) {
    return NextResponse.redirect(new URL("/?error=invalid_token", request.url));
  }

  const supabase = await createServerSupabase();

  const { data: cliente } = await supabase
    .from("clientes")
    .select("email_confirmado")
    .eq("id", id)
    .maybeSingle();

  if (!cliente) {
    return NextResponse.redirect(new URL("/?error=not_found", request.url));
  }

  const record = cliente as Record<string, unknown>;
  if (record.email_confirmado) {
    return NextResponse.redirect(new URL("/?confirmed=already", request.url));
  }

  const expectedToken = btoa(`${id}:confirm`);
  if (token !== expectedToken) {
    return NextResponse.redirect(new URL("/?error=invalid_token", request.url));
  }

  const { error } = await supabase
    .from("clientes")
    .update({ email_confirmado: true })
    .eq("id", id);

  if (error) {
    return NextResponse.redirect(new URL("/?error=update_failed", request.url));
  }

  return NextResponse.redirect(new URL("/?confirmed=true", request.url));
}
