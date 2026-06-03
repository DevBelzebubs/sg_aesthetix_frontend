export function complaintCopyEmailHtml({
  numeroReclamo,
  nombres,
  apellidos,
  tipo,
  descripcion,
  fecha,
  tenantName,
}: {
  numeroReclamo: string;
  nombres: string;
  apellidos: string;
  tipo: string;
  descripcion: string;
  fecha: string;
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
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.05em;">LIBRO DE RECLAMACIONES</h1>
        <p style="color: #d4edda; margin: 8px 0 0 0; font-size: 13px;">${tenantName}</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 24px;">
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #333;">Estimado/a <strong>${nombres} ${apellidos}</strong>,</p>
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #333;">
          Hemos recibido su <strong>${tipo}</strong> en nuestro Libro de Reclamaciones. A continuación, los datos registrados:
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f9f9f9; border-radius: 12px; padding: 20px; margin: 16px 0;">
          <tr>
            <td style="padding: 6px 0; font-size: 13px; color: #888; width: 40%; vertical-align: top;">N° de Reclamo</td>
            <td style="padding: 6px 0; font-size: 14px; color: #333; font-weight: 600;">${numeroReclamo}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 13px; color: #888; vertical-align: top;">Fecha de registro</td>
            <td style="padding: 6px 0; font-size: 14px; color: #333;">${fecha}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 13px; color: #888; vertical-align: top;">Tipo</td>
            <td style="padding: 6px 0; font-size: 14px; color: #333; text-transform: capitalize;">${tipo}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 13px; color: #888; vertical-align: top;">Descripción</td>
            <td style="padding: 6px 0; font-size: 14px; color: #333;">${descripcion}</td>
          </tr>
        </table>
        <p style="margin: 16px 0 0 0; font-size: 14px; color: #555;">
          Nos comprometemos a dar respuesta en un plazo máximo de <strong>15 días hábiles</strong>, de acuerdo con la Ley N° 29571 - Código de Protección y Defensa del Consumidor.
        </p>
        <p style="margin: 16px 0 0 0; font-size: 14px; color: #555;">
          Ante cualquier consulta, puede comunicarse con nosotros.
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
