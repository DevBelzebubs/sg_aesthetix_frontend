"use client";

export async function sendConfirmationEmail(customerId: string, toEmail: string) {
  if (!toEmail) { console.warn("[EMAIL] No hay email, se omite confirmación"); return; }
  try {
    const token = btoa(`${customerId}:confirm`);
    const confirmUrl = `${window.location.origin}/api/email/confirm?id=${customerId}&token=${token}`;
    const res = await fetch("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: toEmail,
        templateId: "template_nhrtjp9",
        templateParams: { to_name: toEmail.split("@")[0] },
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[EMAIL] Error enviando confirmación:", err);
    } else {
      console.log("[EMAIL] Confirmación enviada a", toEmail);
    }
  } catch (e) {
    console.error("[EMAIL] Error de red al enviar confirmación:", e);
  }
}

export async function sendPinResetEmail(customerId: string, toEmail: string, tempPin: string) {
  if (!toEmail) { console.warn("[EMAIL] No hay email, se omite reset PIN"); return; }
  try {
    const res = await fetch("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: toEmail,
        templateId: "template_nhrtjp9",
        templateParams: { to_name: toEmail.split("@")[0], pin: tempPin },
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[EMAIL] Error enviando PIN reset:", err);
    } else {
      console.log("[EMAIL] PIN reset enviado a", toEmail);
    }
  } catch (e) {
    console.error("[EMAIL] Error de red al enviar PIN reset:", e);
  }
}

export async function sendNewClientPinEmail(toEmail: string, nombres: string, pin: string) {
  if (!toEmail) { console.warn("[EMAIL] No hay email, se omite nuevo cliente"); return; }
  try {
    const res = await fetch("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: toEmail,
        templateId: "template_nhrtjp9",
        templateParams: { to_name: nombres, pin },
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[EMAIL] Error enviando nuevo cliente:", err);
    } else {
      console.log("[EMAIL] Nuevo cliente email enviado a", toEmail);
    }
  } catch (e) {
    console.error("[EMAIL] Error de red al enviar nuevo cliente:", e);
  }
}
