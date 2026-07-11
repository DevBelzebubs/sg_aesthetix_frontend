import type { Metadata } from "next";
import Link from "next/link";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Política de Privacidad | ${slug}`,
    description:
      "Política de privacidad conforme a la Ley N° 29733 - Ley de Protección de Datos Personales y su Reglamento aprobado por DS N° 003-2013-JUS.",
  };
}

export default async function PrivacidadPage({ params }: Props) {
  const { slug } = await params;

  const ultimaActualizacion = "13 de junio de 2026";

  return (
    <section className="space-y-6 py-8">
      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--hover)]">
          Legal
        </p>
        <h1 className="text-3xl font-black tracking-tight text-[var(--foreground)]">
          Política de Privacidad
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Última actualización: {ultimaActualizacion}
        </p>
      </div>

      <div className="prose prose-sm max-w-none space-y-5 text-[var(--foreground)] [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:tracking-tight [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-[var(--text-muted)] [&_strong]:text-[var(--foreground)] [&_ul]:text-sm [&_ul]:text-[var(--text-muted)] [&_li]:mt-1">
        <p>
          La presente Política de Privacidad establece los términos en que{" "}
          <strong>{slug}</strong> (en adelante, &ldquo;el Establecimiento&rdquo;)
          trata y protege los datos personales de sus clientes y usuarios,
          en cumplimiento de la <strong>Ley N° 29733 &mdash; Ley de Protección
          de Datos Personales</strong> y su Reglamento aprobado mediante
          <strong> Decreto Supremo N° 003-2013-JUS</strong>.
        </p>

        <h2>1. Datos del responsable del tratamiento</h2>
        <p>
          <strong>Responsable:</strong> {slug}<br />
          <strong>Dirección:</strong> La consignada en cada local del Establecimiento.<br />
          <strong>Contacto:</strong> A través de los canales indicados en el sitio web.
        </p>

        <h2>2. Datos personales que recopilamos</h2>
        <p>Podemos recopilar las siguientes categorías de datos personales:</p>
        <ul>
          <li>Datos de identificación: nombres, apellidos.</li>
          <li>Datos de contacto: correo electrónico, número de teléfono.</li>
          <li>Datos de transacción: historial de servicios adquiridos, reservas realizadas, consumo de puntos de fidelización.</li>
          <li>Datos de navegación: dirección IP, tipo de navegador, páginas visitadas en nuestro sitio web.</li>
        </ul>

        <h2>3. Finalidades del tratamiento</h2>
        <p>Sus datos personales serán tratados para las siguientes finalidades:</p>
        <ul>
          <li>Gestión de reservas y prestación de servicios solicitados.</li>
          <li>Procesamiento de pagos y emisión de comprobantes electrónicos.</li>
          <li>Administración del programa de fidelización y puntos acumulados.</li>
          <li>Envío de comunicaciones comerciales personalizadas, previo consentimiento.</li>
          <li>Cumplimiento de obligaciones legales y regulatorias.</li>
        </ul>

        <h2>4. Base legal del tratamiento</h2>
        <p>
          El tratamiento de sus datos personales se sustenta en:
        </p>
        <ul>
          <li>Su consentimiento previo, expreso e informado (artículo 13° de la Ley N° 29733).</li>
          <li>La ejecución de la relación contractual derivada de la solicitud de nuestros servicios.</li>
          <li>El cumplimiento de obligaciones legales aplicables.</li>
        </ul>

        <h2>5. Derechos ARCO</h2>
        <p>
          De conformidad con la Ley N° 29733, usted tiene derecho a ejercer los
          derechos de <strong>Acceso, Rectificación, Cancelación y Oposición</strong>
          (derechos ARCO) respecto de sus datos personales. Para ejercerlos, puede
          presentar una solicitud a través de los canales de atención del
          Establecimiento, indicando su nombre y el derecho que desea ejercer.
        </p>
        <p>
          Su solicitud será atendida en el plazo máximo de <strong>veinte (20) días hábiles</strong>
          , conforme al artículo 38° del Reglamento de la Ley de Protección de Datos Personales.
        </p>

        <h2>6. Transferencia de datos</h2>
        <p>
          No compartimos sus datos personales con terceros, salvo cuando sea
          necesario para la prestación del servicio (plataformas de pago, servicios
          de envío de correos electrónicos) o cuando exista un mandato legal o
          judicial que así lo exija. En todos los casos, exigimos a los terceros
          el cumplimiento de estándares de protección de datos equivalentes a los
          nuestros.
        </p>

        <h2>7. Conservación de datos</h2>
        <p>
          Conservamos sus datos personales durante el tiempo necesario para cumplir
          con las finalidades descritas en esta política, y durante los plazos
          establecidos por las disposiciones legales aplicables. Una vez cumplidos
          dichos plazos, sus datos serán eliminados de forma segura.
        </p>

        <h2>8. Medidas de seguridad</h2>
        <p>
          Implementamos medidas de seguridad técnicas, organizativas y legales
          adecuadas para proteger sus datos personales contra acceso no autorizado,
          pérdida, destrucción o alteración, conforme al artículo 11° de la Ley
          N° 29733 y el Título IV del Reglamento.
        </p>

        <h2>9. Uso de cookies</h2>
        <p>
          Nuestro sitio web puede utilizar cookies y tecnologías similares para
          mejorar la experiencia de navegación. Puede configurar su navegador para
          rechazar todas las cookies o para indicar cuándo se envía una cookie.
        </p>

        <h2>10. Modificaciones</h2>
        <p>
          Nos reservamos el derecho de modificar la presente Política de Privacidad
          en cualquier momento. Las modificaciones serán publicadas en esta página
          con la fecha de actualización correspondiente.
        </p>

        <h2>11. Autoridad competente</h2>
        <p>
          Para cualquier consulta o reclamo relacionado con el tratamiento de sus
          datos personales, puede contactar a la{" "}
          <strong>Autoridad Nacional de Protección de Datos Personales</strong>
          del Ministerio de Justicia y Derechos Humanos del Perú.
        </p>
      </div>

      <div className="pt-6 border-t border-[var(--border)]">
        <Link
          href={`/${slug}`}
          className="inline-flex items-center gap-2 border border-[var(--border)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] transition hover:border-[var(--hover)] hover:text-[var(--hover)]"
        >
          Volver al inicio
        </Link>
      </div>
    </section>
  );
}
