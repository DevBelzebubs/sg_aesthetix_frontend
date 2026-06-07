"use client";

export async function sendConfirmationEmail(customerId: string, toEmail: string) {
  try {
    const token = btoa(`${customerId}:confirm`);
    const confirmUrl = `${window.location.origin}/api/email/confirm?id=${customerId}&token=${token}`;
    await fetch("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: toEmail,
        subject: "Confirma tu correo - Aesthetix",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="color:#111">Confirma tu cuenta</h2>
            <p>Gracias por registrarte en <strong>Aesthetix</strong>.</p>
            <p>Haz clic en el botón para verificar tu correo:</p>
            <a href="${confirmUrl}" style="display:inline-block;background:#111;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">Confirmar correo</a>
            <p style="color:#666;font-size:12px">Si no creaste esta cuenta, ignora este mensaje.</p>
          </div>`,
      }),
    });
  } catch {}
}

export async function sendPinResetEmail(customerId: string, toEmail: string, tempPin: string) {
  try {
    await fetch("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: toEmail,
        subject: "Recuperación de PIN - Aesthetix",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="color:#111">Recuperación de PIN</h2>
            <p>Has solicitado restablecer tu PIN de acceso.</p>
            <p>Tu PIN temporal es:</p>
            <div style="background:#f5f5f5;padding:16px;border-radius:8px;text-align:center;margin:16px 0">
              <span style="font-size:28px;font-weight:bold;letter-spacing:8px;color:#111">${tempPin}</span>
            </div>
            <p style="color:#666;font-size:12px">Ingresa a la app con este PIN y cámbialo desde tu perfil.</p>
          </div>`,
      }),
    });
  } catch {}
}

export async function sendNewClientPinEmail(toEmail: string, nombres: string, pin: string) {
  try {
    await fetch("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: toEmail,
        subject: "Tu cuenta ha sido creada - Aesthetix",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="color:#111">¡Bienvenido a Aesthetix, ${nombres}!</h2>
            <p>Tu cuenta de cliente ha sido creada exitosamente.</p>
            <p>Tu PIN de acceso es:</p>
            <div style="background:#f5f5f5;padding:16px;border-radius:8px;text-align:center;margin:16px 0">
              <span style="font-size:28px;font-weight:bold;letter-spacing:8px;color:#111">${pin}</span>
            </div>
            <p style="color:#666;font-size:12px">Usa tu DNI y este PIN para acceder a tus puntos y promociones.</p>
          </div>`,
      }),
    });
  } catch {}
}

export async function sendVerificationEmail(toEmail: string, nombres: string, code: string) {
  try {
    await fetch("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: toEmail,
        subject: "Código de verificación - Aesthetix",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="color:#111">Verifica tu cuenta, ${nombres}</h2>
            <p>Gracias por registrarte en <strong>Aesthetix</strong>.</p>
            <p>Tu código de verificación es:</p>
            <div style="background:#f5f5f5;padding:16px;border-radius:8px;text-align:center;margin:16px 0">
              <span style="font-size:28px;font-weight:bold;letter-spacing:8px;color:#111">${code}</span>
            </div>
            <p>Ingresa este código en la aplicación para completar tu registro.</p>
            <p style="color:#666;font-size:12px">Si no creaste esta cuenta, ignora este mensaje.</p>
          </div>`,
      }),
    });
  } catch {}
}
