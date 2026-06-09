type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey || !privateKey) {
    console.warn("[EMAIL] EmailJS no configurado. Email no enviado:", payload.subject);
    return { success: false, error: "EmailJS no configurado" };
  }

  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        accessToken: privateKey,
        template_params: {
          to_name: payload.to.split("@")[0],
          to_email: payload.to,
          from_name: "Aesthetix",
          subject: payload.subject,
          message_html: payload.html,
        },
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
