import type { Metadata } from "next";
import Link from "next/link";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Términos y Condiciones | ${slug}`,
    description:
      "Términos y condiciones de uso del sitio web y servicios, conforme al Código de Protección y Defensa del Consumidor (Ley N° 29571) y el Código Civil Peruano.",
  };
}

export default async function TerminosPage({ params }: Props) {
  const { slug } = await params;

  const ultimaActualizacion = "13 de junio de 2026";

  return (
    <section className="space-y-6 py-8">
      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--hover)]">
          Legal
        </p>
        <h1 className="text-3xl font-black tracking-tight text-[var(--foreground)]">
          Términos y Condiciones
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Última actualización: {ultimaActualizacion}
        </p>
      </div>

      <div className="prose prose-sm max-w-none space-y-5 text-[var(--foreground)] [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:tracking-tight [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-[var(--text-muted)] [&_strong]:text-[var(--foreground)] [&_ul]:text-sm [&_ul]:text-[var(--text-muted)] [&_li]:mt-1">
        <p>
          Los presentes Términos y Condiciones regulan el acceso y uso del sitio
          web de <strong>{slug}</strong> (en adelante, &ldquo;el Establecimiento&rdquo;)
          y la contratación de los servicios ofrecidos a través del mismo, en
          cumplimiento de la <strong>Ley N° 29571 &mdash; Código de Protección y
          Defensa del Consumidor</strong> y demás disposiciones del ordenamiento
          jurídico peruano.
        </p>

        <h2>1. Información del establecimiento</h2>
        <p>
          <strong>Nombre comercial:</strong> {slug}<br />
          <strong>Dirección:</strong> La consignada en cada local del Establecimiento.<br />
          <strong>Contacto:</strong> A través de los canales indicados en el sitio web.
        </p>

        <h2>2. Servicios ofrecidos</h2>
        <p>
          El Establecimiento ofrece servicios de barbería y estética masculina,
          incluyendo corte de cabello, arreglo de barba, tratamientos capilares
          y productos de cuidado personal. Los servicios y precios se encuentran
          detallados en el sitio web y están expresados en moneda nacional (Soles).
        </p>
        <p>
          Los precios mostrados incluyen el Impuesto General a las Ventas (IGV)
          conforme a la legislación tributaria peruana, salvo que se indique
          expresamente lo contrario.
        </p>

        <h2>3. Proceso de reserva</h2>
        <p>
          Para reservar un turno, el usuario debe seleccionar el servicio deseado,
          el profesional de su preferencia y el horario disponible. La reserva se
          confirma una vez completado el proceso en el sitio web.
        </p>
        <p>
          El Establecimiento se reserva el derecho de confirmar o rechazar
          cualquier reserva en caso de detectar inconsistencias en los datos
          proporcionados o cuando el horario solicitado ya no se encuentre
          disponible.
        </p>

        <h2>4. Política de cancelación</h2>
        <p>
          El usuario podrá cancelar o reprogramar su reserva sin costo alguno
          hasta con <strong>dos (2) horas de anticipación</strong> a la hora
          programada. Las cancelaciones realizadas fuera de este plazo o las
          inasistencias podrán ser registradas y consideradas para futuras reservas.
        </p>

        <h2>5. Programa de fidelización</h2>
        <p>
          El Establecimiento ofrece un programa de puntos de fidelización
          sujeto a términos adicionales. Los puntos acumulados no tienen valor
          monetario, no son transferibles y caducan según los plazos establecidos
          en las reglas del programa. El Establecimiento se reserva el derecho
          de modificar o discontinuar el programa en cualquier momento, previa
          comunicación a los usuarios.
        </p>

        <h2>6. Obligaciones del usuario</h2>
        <ul>
          <li>Proporcionar información veraz y actualizada al momento de registrarse o reservar.</li>
          <li>No utilizar el sitio web para fines ilícitos o contrarios a la moral y las buenas costumbres.</li>
          <li>Mantener la confidencialidad de su PIN o contraseña de acceso.</li>
          <li>Asistir puntualmente a las citas reservadas.</li>
        </ul>

        <h2>7. Propiedad intelectual</h2>
        <p>
          Todos los contenidos del sitio web, incluyendo textos, imágenes, logotipos,
          videos y diseños, son propiedad del Establecimiento o cuentan con la
          autorización correspondiente para su uso. Queda prohibida la reproducción,
          distribución o modificación sin autorización expresa.
        </p>

        <h2>8. Limitación de responsabilidad</h2>
        <p>
          El Establecimiento no será responsable por daños o perjuicios derivados
          del uso indebido del sitio web, de la imposibilidad de acceso por causas
          ajenas a su voluntad, o de eventos de fuerza mayor o caso fortuito
          conforme al artículo 1315° del Código Civil Peruano.
        </p>

        <h2>9. Protección al consumidor</h2>
        <p>
          El Establecimiento cumple con lo dispuesto en la Ley N° 29571 y sus
          modificatorias. El usuario tiene derecho a:
        </p>
        <ul>
          <li>Recibir información veraz, clara y oportuna sobre los servicios ofrecidos.</li>
          <li>Exigir la prestación del servicio en las condiciones contratadas.</li>
          <li>Presentar reclamos y quejas a través del Libro de Reclamaciones.</li>
        </ul>

        <h2>10. Legislación aplicable y jurisdicción</h2>
        <p>
          Los presentes Términos y Condiciones se rigen por la legislación de la
          República del Perú. Para cualquier controversia derivada de su
          interpretación o ejecución, las partes se someten a la jurisdicción de
          los jueces y tribunales de la ciudad de Lima, renunciando expresamente
          a cualquier otro fuero o jurisdicción que pudiera corresponderles.
        </p>

        <h2>11. Libro de Reclamaciones</h2>
        <p>
          De conformidad con el artículo 150° del Código de Protección y Defensa
          del Consumidor, el Establecimiento pone a disposición del usuario un
          Libro de Reclamaciones virtual al que puede acceder a través del
          siguiente enlace:
        </p>
        <p>
          <Link
            href={`/${slug}/libro-reclamaciones`}
            className="text-[var(--hover)] underline underline-offset-2 hover:opacity-80 transition"
          >
            Libro de Reclamaciones
          </Link>
        </p>

        <h2>12. Modificaciones</h2>
        <p>
          El Establecimiento se reserva el derecho de modificar los presentes
          Términos y Condiciones en cualquier momento. Las modificaciones
          entrarán en vigor desde su publicación en el sitio web.
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
