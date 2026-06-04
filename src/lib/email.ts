type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "noreply@aesthetix.pe";

  if (!resendApiKey) {
    console.warn("[EMAIL] RESEND_API_KEY no configurada. Email no enviado:", payload.subject);
    return { success: false, error: "RESEND_API_KEY no configurada" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Aesthetix <${fromEmail}>`,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[EMAIL] Error enviando email:", body);
      return { success: false, error: body };
    }

    return { success: true };
  } catch (err) {
    console.error("[EMAIL] Error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Error desconocido" };
  }
}
