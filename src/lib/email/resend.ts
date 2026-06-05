import { Resend } from "resend";

let _resend: Resend | null = null;

export const resend = new Proxy({} as Resend, {
  get(_, prop) {
    if (!_resend) {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) throw new Error("RESEND_API_KEY no está configurada");
      _resend = new Resend(apiKey);
    }
    return Reflect.get(_resend, prop);
  },
});

export const FROM_EMAIL = "Libro de Reclamaciones <onboarding@resend.dev>";
