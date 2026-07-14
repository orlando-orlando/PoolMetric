import { createPortal } from "react-dom";

/* ────────────────────────────────────────────────────────────────
   ModalLegal — Política de privacidad y Términos y condiciones.
   tipo = "privacidad" | "terminos"
   onCerrar() cierra el modal.
   ──────────────────────────────────────────────────────────────── */

const PRIVACIDAD = {
  titulo: "Política de privacidad",
  actualizado: "Última actualización: julio de 2026",
  secciones: [
    {
      h: "1. Responsable del tratamiento de datos",
      p: [
        "El responsable del tratamiento de los datos personales recopilados a través de PoolMetric es [RESPONSABLE LEGAL], operando bajo la marca comercial PoolMetric Hydraulic Design.",
        "Correo de contacto: hola@poolmetric.app",
      ],
    },
    {
      h: "2. Qué datos recopilamos",
      p: [
        "Datos de registro: dirección de correo electrónico y contraseña (almacenada de forma encriptada mediante los protocolos de seguridad de Supabase Auth). Nunca almacenamos contraseñas en texto plano.",
        "Datos de uso y proyectos: proyectos creados dentro de la plataforma, incluyendo dimensiones, configuraciones de equipos, parámetros de diseño y resultados de cálculo. Estos datos son de uso exclusivo del usuario que los generó.",
        "Datos de pago: los pagos son procesados directamente por Stripe, Inc., un proveedor externo certificado PCI DSS. PoolMetric no almacena ni tiene acceso a los datos de tarjeta de crédito o débito del usuario en ningún momento. Solo conservamos el estado de la suscripción (activo, cancelado, vencido) y el plan contratado.",
        "Datos de retroalimentación: comentarios, reportes de bugs, sugerencias y respuestas a encuestas de satisfacción enviadas a través de la opción \"Danos tu opinión\" dentro de la plataforma, incluyendo valoraciones sobre el ahorro de tiempo, funciones utilizadas y perfil profesional cuando el usuario decide compartirlos.",
      ],
    },
    {
      h: "3. Para qué usamos tus datos",
      p: [
        "Utilizamos la información recopilada únicamente para los siguientes fines: prestarte el servicio de la plataforma PoolMetric y gestionar tu cuenta; guardar y recuperar tus proyectos de diseño entre sesiones; gestionar tu suscripción y procesar los pagos a través de Stripe; enviarte comunicaciones relacionadas con el servicio, como confirmaciones de pago, avisos de vencimiento del período de prueba o notificaciones de actualizaciones importantes; mejorar la plataforma con base en los patrones de uso y el feedback recibido; y cumplir con obligaciones legales aplicables.",
        "No utilizamos tus datos para publicidad de terceros ni para ningún fin distinto a los mencionados anteriormente.",
      ],
    },
    {
      h: "4. Con quién compartimos tus datos",
      p: [
        "PoolMetric no vende, alquila ni comparte tu información personal con terceros con fines comerciales. Los únicos proveedores externos que procesan datos en el contexto del servicio son:",
        "Supabase Inc. — Proveedor de base de datos y autenticación. Almacena de forma segura los datos de cuenta y proyectos.",
        "Stripe Inc. — Procesador de pagos. Gestiona las transacciones de suscripción.",
        "Vercel Inc. — Proveedor de alojamiento del frontend.",
        "Railway Corp. — Proveedor de alojamiento del backend.",
        "Todos estos proveedores cuentan con estándares de seguridad reconocidos internacionalmente y están sujetos a sus propias políticas de privacidad.",
      ],
    },
    {
      h: "5. Por cuánto tiempo conservamos tus datos",
      p: [
        "Conservamos tus datos mientras tu cuenta esté activa. Si decides cancelar tu cuenta y solicitar la eliminación de tus datos, procesaremos esa solicitud en un plazo máximo de 30 días calendario y eliminaremos toda la información asociada a tu cuenta, incluyendo proyectos, configuraciones y datos de perfil. Los registros de transacciones de pago pueden conservarse por el período que exija la legislación fiscal aplicable.",
      ],
    },
    {
      h: "6. Tus derechos sobre tus datos",
      p: [
        "Como usuario de PoolMetric tienes derecho a: acceder a los datos personales que tenemos sobre ti; corregir información incorrecta o desactualizada; eliminar tu cuenta y todos los datos asociados; exportar los reportes PDF de tus proyectos en cualquier momento; oponerte al tratamiento de tus datos para fines distintos a la prestación del servicio; y revocar tu consentimiento en cualquier momento, lo que implicará la cancelación del servicio.",
        "De acuerdo con la Ley 1581 de 2012 de Colombia y sus normas reglamentarias, tienes derecho a conocer, actualizar, rectificar y suprimir tus datos personales, así como a revocar la autorización otorgada para su tratamiento.",
        "Para ejercer cualquiera de estos derechos escríbenos a hola@poolmetric.app con el asunto \"Privacidad — [tu solicitud]\". Responderemos en un plazo máximo de 15 días hábiles.",
      ],
    },
    {
      h: "7. Cookies",
      p: [
        "PoolMetric utiliza únicamente cookies y almacenamiento técnico estrictamente necesarios para el funcionamiento del servicio, como los que mantienen tu inicio de sesión activo. No utilizamos cookies de seguimiento, publicidad ni análisis de comportamiento de terceros.",
      ],
    },
    {
      h: "8. Seguridad de tus datos",
      p: [
        "Implementamos medidas técnicas y organizativas para proteger tu información, incluyendo transmisión cifrada mediante HTTPS, autenticación segura mediante Supabase Auth, y control de acceso que garantiza que cada usuario solo puede ver sus propios proyectos. Sin embargo, ningún sistema es 100% infalible. En caso de incidente de seguridad que afecte tus datos, te notificaremos en el menor tiempo posible.",
      ],
    },
    {
      h: "9. Cambios a esta política",
      p: [
        "Nos reservamos el derecho de actualizar esta política de privacidad cuando sea necesario. En caso de cambios significativos, te notificaremos por correo electrónico con al menos 15 días de anticipación antes de que entren en vigor. El uso continuado del servicio después de esa fecha implica la aceptación de los cambios.",
      ],
    },
    {
      h: "10. Contacto",
      p: [
        "Para cualquier duda, solicitud o reclamo relacionado con el tratamiento de tus datos personales, escríbenos a: hola@poolmetric.app — PoolMetric Hydraulic Design.",
      ],
    },
  ],
};

const TERMINOS = {
  titulo: "Términos y condiciones de uso",
  actualizado: "Última actualización: julio de 2026",
  secciones: [
    {
      h: "1. Aceptación de los términos",
      p: [
        "Al registrarte en PoolMetric y utilizar la plataforma, aceptas estos Términos y Condiciones en su totalidad. Si no estás de acuerdo con alguno de los términos aquí descritos, no debes utilizar el servicio. El uso continuado de la plataforma implica la aceptación de cualquier actualización a estos términos.",
      ],
    },
    {
      h: "2. Descripción del servicio",
      p: [
        "PoolMetric es una plataforma de ingeniería web para el diseño hidráulico y térmico de albercas y cuerpos de agua. La plataforma automatiza el cálculo de flujos, pérdidas de carga, perfiles térmicos y la selección de equipos, generando memorias de cálculo técnicas en formato PDF.",
        "PoolMetric es una herramienta de apoyo técnico. No reemplaza el criterio profesional del ingeniero ni la supervisión de un especialista certificado. Los resultados generados dependen directamente de la exactitud de los datos ingresados por el usuario. La validación técnica final, la firma del proyecto y la responsabilidad del diseño corresponden siempre al profesional responsable del proyecto.",
      ],
    },
    {
      h: "3. Registro y cuenta de usuario",
      p: [
        "Para acceder al servicio debes crear una cuenta con un correo electrónico válido y una contraseña. Eres responsable de mantener la confidencialidad de tus credenciales de acceso y de todas las actividades que ocurran bajo tu cuenta.",
        "Está expresamente prohibido: compartir tu cuenta o credenciales de acceso con terceros; usar una sola cuenta simultáneamente desde múltiples dispositivos o sesiones activas; crear múltiples cuentas para evadir el período de prueba gratuito o las limitaciones de plan; ceder, vender o transferir tu cuenta a otra persona.",
        "PoolMetric se reserva el derecho de suspender cuentas que violen estas condiciones sin previo aviso y sin derecho a reembolso.",
      ],
    },
    {
      h: "4. Planes, precios y pagos",
      p: [
        "Plan Gratis (Beta): acceso completo a todas las funciones de la plataforma durante 30 días calendario contados desde la fecha de registro. Al término del período gratuito, el acceso queda restringido hasta que se contrate un plan de pago.",
        "Plan Fundador: disponible únicamente para los primeros 5 usuarios que contraten este plan. Precio especial congelado mientras la suscripción se mantenga activa de forma continua. Si el usuario cancela su suscripción Fundador y desea reactivarla posteriormente, el precio aplicable será el del plan vigente en ese momento.",
        "Plan Pro: acceso completo sin restricciones. Facturación mensual recurrente al precio vigente en el momento de la contratación.",
        "Pagos: los pagos se procesan a través de Stripe. Al proporcionar tus datos de pago autorizas a PoolMetric a realizar cargos recurrentes mensuales hasta que canceles tu suscripción. Los precios se expresan en dólares estadounidenses (USD) e incluyen el servicio pero pueden estar sujetos a impuestos locales según la legislación de tu país.",
        "Política de reembolsos: las suscripciones mensuales no son reembolsables de forma proporcional. Si cancelas tu suscripción, mantendrás acceso al servicio hasta el final del período mensual ya pagado. No se emiten reembolsos parciales por días no utilizados.",
      ],
    },
    {
      h: "5. Uso aceptable de la plataforma",
      p: [
        "Al usar PoolMetric te comprometes a utilizarlo exclusivamente para fines legítimos de diseño e ingeniería. Queda expresamente prohibido: intentar acceder, extraer, copiar o reproducir el código fuente, los algoritmos de cálculo, la lógica de selección de equipos o el catálogo de datos de la plataforma por cualquier medio técnico o manual; usar herramientas automatizadas, bots o scripts para interactuar con la plataforma; realizar ingeniería inversa sobre cualquier componente del software; usar el servicio para actividades ilegales, fraudulentas o que infrinjan derechos de terceros; intentar comprometer la seguridad, disponibilidad o integridad del servicio; revender, sublicenciar o comercializar el acceso a la plataforma a terceros.",
        "El incumplimiento de cualquiera de estas condiciones puede resultar en la suspensión inmediata de la cuenta sin reembolso.",
      ],
    },
    {
      h: "6. Propiedad intelectual",
      p: [
        "Todo el software, código fuente, algoritmos de cálculo hidráulico y térmico, metodología de diseño, interfaz de usuario, catálogo de equipos, estructura de datos y documentación de PoolMetric son propiedad exclusiva de [RESPONSABLE LEGAL] bajo la marca PoolMetric Hydraulic Design, y están protegidos por las leyes de derechos de autor aplicables en Colombia y en los países donde opera el servicio.",
        "El usuario conserva la propiedad completa de los datos de sus proyectos, incluyendo las dimensiones, configuraciones y memorias de cálculo generadas. PoolMetric no reclama propiedad sobre el contenido técnico de los proyectos del usuario.",
        "El uso del servicio no otorga al usuario ninguna licencia sobre el software o la metodología de cálculo más allá del derecho de uso personal y no transferible descrito en estos términos.",
      ],
    },
    {
      h: "7. Limitación de responsabilidad",
      p: [
        "PoolMetric es una herramienta de apoyo al diseño de ingeniería. En consecuencia: PoolMetric no se hace responsable de errores en los resultados derivados de datos incorrectos, incompletos o no verificados ingresados por el usuario; no garantiza que los diseños generados cumplan con la normativa local específica de cada municipio, departamento o país, ya que los requisitos pueden variar, por lo que se recomienda la revisión por un ingeniero hidráulico colegiado para proyectos que requieran aprobación regulatoria; no asume responsabilidad por daños materiales, personales o económicos derivados de una instalación incorrecta, una interpretación errónea del documento técnico o el uso inapropiado de la plataforma; y no se hace responsable por decisiones de compra, selección de contratistas o resultados de obra basados en los reportes generados por la plataforma.",
        "La responsabilidad máxima de PoolMetric ante el usuario por cualquier concepto no excederá el monto total pagado por el usuario en los 3 meses anteriores al evento que origina el reclamo.",
      ],
    },
    {
      h: "8. Disponibilidad del servicio",
      p: [
        "PoolMetric se esfuerza por mantener el servicio disponible de forma continua pero no garantiza disponibilidad ininterrumpida. Pueden ocurrir interrupciones temporales por mantenimiento programado, actualizaciones del sistema o causas fuera del control de PoolMetric. Cuando sea posible, los mantenimientos programados se anunciarán con anticipación por correo electrónico.",
      ],
    },
    {
      h: "9. Modificaciones al servicio y a estos términos",
      p: [
        "PoolMetric se reserva el derecho de: agregar, modificar o eliminar funciones de la plataforma en cualquier momento, con el objetivo de mejorar el servicio; modificar los precios de los planes con un aviso mínimo de 30 días calendario por correo electrónico antes de que el cambio entre en vigor, manteniendo los usuarios con suscripción activa su precio durante el período ya pagado; modificar estos Términos y Condiciones con un aviso mínimo de 15 días por correo electrónico; y descontinuar el servicio con un aviso mínimo de 60 días calendario, período durante el cual los usuarios podrán exportar sus proyectos en PDF.",
      ],
    },
    {
      h: "10. Cancelación y terminación",
      p: [
        "Cancelación por el usuario: puedes cancelar tu suscripción en cualquier momento desde la configuración de tu cuenta. La cancelación es efectiva al término del período mensual ya pagado. No se realizan cargos adicionales después de la cancelación.",
        "Suspensión por PoolMetric: PoolMetric puede suspender o cancelar tu cuenta de forma inmediata y sin reembolso si se detecta violación a estos términos, uso fraudulento, o actividades que comprometan la seguridad o integridad del servicio. En caso de suspensión por error, puedes contactarnos a hola@poolmetric.app para revisión.",
        "Eliminación de datos: al cancelar tu cuenta puedes solicitar la eliminación completa de tus datos. Los reportes PDF ya descargados permanecen en posesión del usuario. Los datos en nuestros servidores serán eliminados en un plazo máximo de 30 días desde la solicitud.",
      ],
    },
    {
      h: "11. Legislación aplicable y resolución de disputas",
      p: [
        "Estos Términos y Condiciones se rigen por las leyes de la República de Colombia. Cualquier disputa derivada del uso del servicio se resolverá preferentemente de forma amistosa mediante comunicación directa a hola@poolmetric.app. En caso de no llegar a un acuerdo, las partes se someten a la jurisdicción de los jueces y tribunales competentes de Colombia, renunciando expresamente a cualquier otro fuero que pudiera corresponderles.",
      ],
    },
    {
      h: "12. Contacto",
      p: [
        "Para cualquier duda, reclamo o comunicación relacionada con estos términos: hola@poolmetric.app — PoolMetric Hydraulic Design.",
      ],
    },
  ],
};

export default function ModalLegal(props) {
  return createPortal(<ModalLegalInner {...props} />, document.body);
}

function ModalLegalInner({ tipo, onCerrar }) {
  const doc = tipo === "terminos" ? TERMINOS : PRIVACIDAD;

  return (
    <div style={S.fondo} onClick={onCerrar}>
      <div style={S.card} onClick={(e) => e.stopPropagation()}>
        <div style={S.header}>
          <div>
            <h2 style={S.titulo}>{doc.titulo}</h2>
            <div style={S.actualizado}>{doc.actualizado}</div>
          </div>
          <button onClick={onCerrar} style={S.cerrar} aria-label="Cerrar">×</button>
        </div>
        <div style={S.scroll}>
          {doc.secciones.map((sec, i) => (
            <div key={i} style={S.seccion}>
              <h3 style={S.h}>{sec.h}</h3>
              {sec.p.map((parrafo, j) => (
                <p key={j} style={S.p}>{parrafo}</p>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const S = {
  fondo: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1rem" },
  card: { position: "relative", background: "linear-gradient(135deg, rgba(15,23,42,.98), rgba(30,41,59,.98))", border: "1px solid rgba(148,163,184,.2)", borderRadius: 14, width: 640, maxWidth: "95vw", maxHeight: "88vh", boxShadow: "0 40px 80px rgba(0,0,0,.65)", color: "#e2e8f0", display: "flex", flexDirection: "column", overflow: "hidden" },
  header: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "1.2rem 1.5rem", borderBottom: "1px solid rgba(148,163,184,.12)" },
  titulo: { fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "#f1f5f9" },
  actualizado: { fontSize: "0.7rem", color: "#64748b", marginTop: "0.25rem" },
  cerrar: { background: "none", border: "none", color: "#94a3b8", fontSize: "1.6rem", lineHeight: 1, cursor: "pointer", padding: 0 },
  scroll: { overflowY: "auto", padding: "1rem 1.5rem 1.5rem" },
  seccion: { marginBottom: "1.3rem" },
  h: { fontSize: "0.9rem", fontWeight: 600, color: "#cbd5e1", margin: "0 0 0.5rem" },
  p: { fontSize: "0.8rem", color: "#94a3b8", lineHeight: 1.65, margin: "0 0 0.6rem" },
};