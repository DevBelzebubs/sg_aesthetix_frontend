export function complaintResponseEmailHtml({
  numeroReclamo,
  nombres,
  apellidos,
  tipo,
  respuesta,
  tenantName,
}: {
  numeroReclamo: string;
  nombres: string;
  apellidos: string;
  tipo: string;
  respuesta: string;
  tenantName: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
    <tr>
      <td style="background: #0B5D2A; padding: 32px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.05em;">RESPUESTA A SU ${tipo.toUpperCase()}</h1>
        <p style="color: #d4edda; margin: 8px 0 0 0; font-size: 13px;">${tenantName}</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 24px;">
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #333;">Estimado/a <strong>${nombres} ${apellidos}</strong>,</p>
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #333;">
          Hemos dado respuesta a su <strong>${tipo}</strong> registrado en nuestro Libro de Reclamaciones (N° <strong>${numeroReclamo}</strong>):
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f0faf0; border-radius: 12px; padding: 20px; margin: 16px 0; border-left: 4px solid #0B5D2A;">
          <tr>
            <td style="padding: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #0B5D2A; text-transform: uppercase; letter-spacing: 0.1em;">Respuesta</td>
          </tr>
          <tr>
            <td style="padding: 0; font-size: 14px; color: #333; line-height: 1.6;">${respuesta.replace(/\n/g, "<br>")}</td>
          </tr>
        </table>
        <p style="margin: 16px 0 0 0; font-size: 14px; color: #555;">
          Agradecemos su preferencia y quedamos atentos a cualquier consulta adicional.
        </p>
        <p style="margin: 24px 0 0 0; font-size: 13px; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 16px;">
          ${tenantName} — Todos los derechos reservados
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
