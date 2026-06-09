"use client";

import emailjs from "@emailjs/browser";

emailjs.init("wlLKvAYcMcUff-SVa");

export async function sendConfirmationEmail(customerId: string, toEmail: string) {
  try {
    await emailjs.send("service_h3vf3lk", "template_5775tlq", {
      to_email: toEmail,
      subject: "Confirma tu correo - Aesthetix",
      message: "Gracias por registrarte en Aesthetix. Tu cuenta ha sido creada.",
      to_name: "Cliente",
      from_name: "Aesthetix",
    });
  } catch {}
}

export async function sendPinResetEmail(customerId: string, toEmail: string, tempPin: string) {
  try {
    await emailjs.send("service_h3vf3lk", "template_5775tlq", {
      to_email: toEmail,
      subject: "Recuperación de PIN - Aesthetix",
      message: `Tu PIN temporal es: ${tempPin}. Ingresa a la app con este PIN.`,
      to_name: "Cliente",
      from_name: "Aesthetix",
    });
  } catch {}
}

export async function sendNewClientPinEmail(toEmail: string, nombres: string, pin: string) {
  try {
    await emailjs.send("service_h3vf3lk", "template_5775tlq", {
      to_email: toEmail,
      subject: "Tu cuenta ha sido creada - Aesthetix",
      message: `Bienvenido a Aesthetix, ${nombres}. Tu PIN de acceso es: ${pin}`,
      to_name: nombres,
      from_name: "Aesthetix",
    });
  } catch {}
}

export async function sendVerificationEmail(toEmail: string, nombres: string, code: string) {
  try {
    await emailjs.send("service_h3vf3lk", "template_5775tlq", {
      to_email: toEmail,
      subject: "Código de verificación - Aesthetix",
      message: `${nombres}, tu código de verificación es: ${code}. Ingresa este código en la app.`,
      to_name: nombres,
      from_name: "Aesthetix",
    });
  } catch {}
}
