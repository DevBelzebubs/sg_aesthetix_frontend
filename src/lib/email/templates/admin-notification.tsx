export function adminNotificationEmailHtml({
  numeroReclamo,
  nombres,
  apellidos,
  tipo,
  email,
  telefono,
  tenantSlug,
}: {
  numeroReclamo: string;
  nombres: string;
  apellidos: string;
  tipo: string;
  email: string;
  telefono?: string;
  tenantSlug: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
    <tr>
      <td style="background: #B22234; padding: 32px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">NUEVO RECLAMO RECIBIDO</h1>
        <p style="color: #f8d7da; margin: 8px 0 0 0; font-size: 13px;">${tenantSlug}</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 24px;">
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #333;">Se ha registrado un nuevo ${tipo} en el Libro de Reclamaciones.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f9f9f9; border-radius: 12px; padding: 20px; margin: 16px 0;">
          <tr>
            <td style="padding: 6px 0; font-size: 13px; color: #888; width: 35%;">N° de Reclamo</td>
            <td style="padding: 6px 0; font-size: 14px; color: #333; font-weight: 600;">${numeroReclamo}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 13px; color: #888;">Cliente</td>
            <td style="padding: 6px 0; font-size: 14px; color: #333;">${nombres} ${apellidos}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 13px; color: #888;">Email</td>
            <td style="padding: 6px 0; font-size: 14px; color: #333;">${email}</td>
          </tr>
          ${telefono ? `<tr>
            <td style="padding: 6px 0; font-size: 13px; color: #888;">Teléfono</td>
            <td style="padding: 6px 0; font-size: 14px; color: #333;">${telefono}</td>
          </tr>` : ""}
          <tr>
            <td style="padding: 6px 0; font-size: 13px; color: #888;">Tipo</td>
            <td style="padding: 6px 0; font-size: 14px; color: #333; text-transform: capitalize;">${tipo}</td>
          </tr>
        </table>
        <p style="margin: 16px 0 0 0;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://sg-aesthetix.vercel.app"}/admin/libro-reclamaciones"
             style="display: inline-block; background: #0B5D2A; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">
            Ver en el panel de administración
          </a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
