import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, html, templateId } = body;

    if (!to || !subject || !html) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const result = await sendEmail({ to, subject, html, templateId });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 }
    );
  }
}
