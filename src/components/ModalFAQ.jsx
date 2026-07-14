import { useState } from "react";
import { createPortal } from "react-dom";

/* ────────────────────────────────────────────────────────────────
   ModalFAQ — Preguntas frecuentes en formato acordeón.
   onCerrar() cierra el modal.
   ──────────────────────────────────────────────────────────────── */

const PREGUNTAS = [
  {
    q: "¿PoolMetric reemplaza el criterio del ingeniero?",
    a: "No. PoolMetric es una herramienta de apoyo técnico que automatiza y estandariza los cálculos de ingeniería. La validación final, la firma del proyecto y la responsabilidad del diseño corresponden siempre al profesional encargado. PoolMetric te da los números correctos y el documento técnico; tú aportas el criterio profesional y el conocimiento del proyecto específico.",
  },
  {
    q: "¿Qué es PoolMetric?",
    a: "PoolMetric es una plataforma de ingeniería para el diseño hidráulico y térmico de albercas y cuerpos de agua. Automatiza el cálculo de flujos, pérdidas de carga, perfiles térmicos y la selección de equipos, generando una memoria de cálculo profesional lista para entregar y firmar. Lo que antes tomaba horas de trabajo manual en Excel, PoolMetric lo resuelve en minutos.",
  },
  {
    q: "¿A quién está dirigido?",
    a: "Está diseñado para cualquier profesional involucrado en el diseño, construcción o equipamiento de albercas: ingenieros hidráulicos, constructores, instaladores, distribuidores de equipos, contratistas, arquitectos y empresas constructoras.",
  },
  {
    q: "¿Qué tipos de proyectos puedo diseñar?",
    a: "Actualmente puedes diseñar albercas residenciales y comerciales con desborde tipo infinity, canal perimetral o ambos, chapoteaderos, espejos de agua y combinaciones de hasta 3 cuerpos de agua interconectados. Jacuzzi independiente y otras configuraciones estarán disponibles próximamente.",
  },
  {
    q: "¿En qué países está disponible?",
    a: "PoolMetric está disponible actualmente en Colombia, con catálogo de equipos, ciudades y datos climáticos específicos para ese mercado. La expansión a Perú, Chile, Panamá y México está en proceso. Si tu país no está disponible todavía, puedes contactarnos para ser notificado cuando llegue a tu región.",
  },
  {
    q: "¿Qué es el punto de equilibrio hidráulico y por qué importa?",
    a: "La mayoría de herramientas calculan con el flujo de diseño y seleccionan una bomba sin verificar si realmente opera en ese punto. En la realidad, la bomba opera donde su curva característica se intersecta con la curva del sistema, que casi siempre es un flujo diferente al de diseño. PoolMetric realiza dos iteraciones automáticas para encontrar el punto de operación real bomba-sistema. Primero selecciona la bomba con el flujo de diseño. Luego recalcula todo el sistema con el flujo real de operación y verifica que los equipos sigan cumpliendo, ajustando las cantidades si es necesario. Eso garantiza que lo que diseñas es lo que realmente va a operar en campo.",
  },
  {
    q: "¿Cómo calcula el sistema de calentamiento necesario?",
    a: "PoolMetric utiliza datos climáticos reales por ciudad y mes para calcular las pérdidas energéticas del sistema en el mes más frío del año. Calcula independientemente las pérdidas por evaporación, convección, radiación, transmisión de paredes y fondo, tubería de distribución, infinity y canal perimetral. La suma de todas esas pérdidas define la capacidad mínima del equipo de calentamiento requerido. Puedes seleccionar bomba de calor, panel solar, caldera de gas o calentador eléctrico, solos o en combinación, y el sistema calcula la contribución de cada uno.",
  },
  {
    q: "¿Los cálculos cumplen normas?",
    a: "El diseño hidráulico sigue los criterios establecidos por ANSI/APSP/ICC-1 (albercas públicas y comerciales), ANSI/APSP/ICC-5 (albercas residenciales enterradas), ANSI/APSP/ICC-15 (tasas de recirculación, velocidades y selección de equipos hidráulicos), ANSI/APSP-7 (seguridad antiatrapamiento en drenes de fondo) y PSDA 2007 — Pool and Spa Safety Act, con las recomendaciones del PHTA (Pool & Hot Tub Alliance). El método de cálculo hidráulico está respaldado por AWWA M51 y Crane Technical Paper 410. Para proyectos que requieran cumplimiento normativo certificado, se recomienda la revisión por un ingeniero hidráulico colegiado.",
  },
  {
    q: "¿Considera normas de seguridad antiatrapamiento?",
    a: "Sí. El diseño cumple con ANSI/APSP-7, que exige un mínimo de dos drenes de fondo separados conectados a la misma bomba, o una cubierta de seguridad certificada, para eliminar el riesgo de atrapamiento. PoolMetric verifica automáticamente que el número de drenes de fondo sea suficiente para el flujo del sistema y que la velocidad en cada dren no exceda los límites permitidos por norma. Esto es requisito legal en proyectos comerciales y de uso público en la mayoría de países de Latinoamérica.",
  },
  {
    q: "¿Cómo selecciona los equipos?",
    a: "PoolMetric calcula el volumen, el caudal requerido por cada circuito, las pérdidas de carga totales del sistema (CDT), las velocidades en cada tramo de tubería, el perfil térmico mensual y el punto de equilibrio hidráulico. Con esos datos selecciona automáticamente la motobomba, filtros, prefiltro, equipos de sanitización, calentamiento y empotrables que cumplen con los requerimientos del sistema. También puedes modificar cualquier selección manualmente y el sistema recalculará en tiempo real.",
  },
  {
    q: "¿Puedo elegir la marca de los equipos?",
    a: "Sí. Puedes filtrar el catálogo por marca y seleccionar únicamente los fabricantes que prefieres o que tienes disponibles en tu mercado. PoolMetric hará las recomendaciones dentro de ese catálogo filtrado.",
  },
  {
    q: "¿Qué marcas están disponibles?",
    a: "El catálogo varía según el país seleccionado. Actualmente incluye marcas como Pentair, Hayward, Inter Water, Carvin, Jandy y Chlorking, entre otras. El catálogo se actualiza continuamente con nuevos fabricantes y modelos.",
  },
  {
    q: "¿Puedo modificar manualmente los equipos?",
    a: "Sí. Cualquier equipo puede cambiarse manualmente desde el catálogo. PoolMetric recalculará automáticamente el comportamiento del sistema con la nueva selección, mostrando el impacto en flujo, CDT, velocidades y cargas hidráulicas de todos los demás equipos.",
  },
  {
    q: "¿Qué sucede si modifico una bomba, filtro o equipo de calentamiento?",
    a: "PoolMetric recalcula automáticamente el sistema completo porque cualquier modificación puede afectar el caudal, las pérdidas de carga, la velocidad del agua, la potencia requerida y las pérdidas térmicas de los demás equipos. Un aviso te notifica cuando un cambio afecta los requerimientos de otros componentes del sistema.",
  },
  {
    q: "¿Qué incluye el reporte PDF?",
    a: "El reporte PDF incluye portada con datos del proyecto, metodología hidráulica con fundamento técnico y normas de referencia, parámetros generales del sistema diseñado, progresión del punto de equilibrio hidráulico, análisis térmico con distribución de pérdidas energéticas, tabla climática mensual, selección y especificación de cada equipo con su memoria de cálculo hidráulica individual (tramos, accesorios, carga estática, sumatoria), resumen ejecutivo con equipos del diseño original y equipos finales ajustados al punto de equilibrio, explosión de materiales, y notas legales de alcance, limitaciones y responsabilidad. También puedes cargar el logo de tu empresa para personalizar el documento.",
  },
  {
    q: "¿Qué incluye la explosión de materiales?",
    a: "La explosión de materiales detalla exactamente los metros de tubería requeridos por diámetro, el número de codos, tees y reducciones de cada medida, tanto en resumen global como desglosado por equipo. Es la lista de compra ejecutable que puedes entregar directamente a tu proveedor de materiales o incluir en tu cotización al cliente sin trabajo adicional.",
  },
  {
    q: "¿Qué pasa si no sé el área de la alberca?",
    a: "Puedes cargar el plano en PDF o imagen directamente en PoolMetric y medir el área ahí mismo usando la herramienta de dimensionamiento con detección automática de líneas tipo snap nearest, similar a AutoCAD. Defines la escala con una medida de referencia conocida y el sistema calcula el área del cuerpo de agua automáticamente sin necesidad de medir a mano ni salir a otra herramienta.",
  },
  {
    q: "¿Mis proyectos quedan guardados?",
    a: "Sí. Cada usuario tiene su propio espacio donde todos los proyectos quedan guardados con sus configuraciones, selecciones de equipos y resultados de cálculo. Puedes retomar cualquier proyecto en cualquier momento desde cualquier dispositivo.",
  },
  {
    q: "¿Puedo exportar mis proyectos?",
    a: "Sí. Cada proyecto puede exportarse en formato PDF con la memoria de cálculo completa lista para entregar al cliente, a una autoridad regulatoria o para archivar como respaldo técnico del proyecto.",
  },
  {
    q: "¿Necesito instalar algún programa?",
    a: "No. PoolMetric funciona completamente desde el navegador, en computadora o dispositivo móvil, sin instalaciones ni actualizaciones manuales.",
  },
  {
    q: "¿Cómo funciona la prueba gratuita?",
    a: "Los nuevos usuarios acceden a 30 días de uso gratuito sin límite de proyectos. Al término del período gratuito puedes elegir el plan que mejor se adapte a tus necesidades para continuar usando la plataforma.",
  },
  {
    q: "¿Cómo funciona la suscripción?",
    a: "La suscripción es mensual y puede cancelarse en cualquier momento sin penalización. No existen contratos de permanencia ni costos ocultos.",
  },
  {
    q: "¿Mis datos están seguros?",
    a: "Sí. Cada usuario accede únicamente a sus propios proyectos. La información técnica de tus proyectos no es compartida con terceros bajo ninguna circunstancia. Puedes consultar nuestra política de privacidad completa para más detalle.",
  },
  {
    q: "¿También realizan la ingeniería por mí?",
    a: "Sí. Si prefieres que nuestro equipo realice el diseño completo, ofrecemos un servicio de Ingeniería Asistida. Tú nos mandas el plano de la alberca y la ubicación del proyecto, y nosotros entregamos la memoria de cálculo completa lista para revisar y firmar. Contáctanos en hola@poolmetric.app para más información y precios.",
  },
  {
    q: "¿Cómo puedo enviar comentarios o solicitar nuevas funciones?",
    a: "Dentro de PoolMetric encontrarás la opción \"Danos tu opinión\" donde puedes reportar bugs, hacer sugerencias y decirnos qué funciones necesitas. Cada comentario es revisado por el equipo y tomado en cuenta para las próximas actualizaciones.",
  },
];

export default function ModalFAQ(props) {
  return createPortal(<ModalFAQInner {...props} />, document.body);
}

function ModalFAQInner({ onCerrar }) {
  const [abierta, setAbierta] = useState(null);

  return (
    <div style={S.fondo} onClick={onCerrar}>
      <div style={S.card} onClick={(e) => e.stopPropagation()}>
        <div style={S.header}>
          <h2 style={S.titulo}>Preguntas frecuentes</h2>
          <button onClick={onCerrar} style={S.cerrar} aria-label="Cerrar">×</button>
        </div>
        <div style={S.scroll}>
          {PREGUNTAS.map((item, i) => {
            const activa = abierta === i;
            return (
              <div key={i} style={S.item}>
                <button
                  style={{ ...S.pregunta, ...(activa ? S.preguntaActiva : {}) }}
                  onClick={() => setAbierta(activa ? null : i)}
                >
                  <span>{item.q}</span>
                  <span style={{ ...S.flecha, transform: activa ? "rotate(90deg)" : "none" }}>›</span>
                </button>
                {activa && <div style={S.respuesta}>{item.a}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const S = {
  fondo: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1rem" },
  card: { position: "relative", background: "linear-gradient(135deg, rgba(15,23,42,.98), rgba(30,41,59,.98))", border: "1px solid rgba(148,163,184,.2)", borderRadius: 14, width: 620, maxWidth: "95vw", maxHeight: "88vh", boxShadow: "0 40px 80px rgba(0,0,0,.65)", color: "#e2e8f0", display: "flex", flexDirection: "column", overflow: "hidden" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.2rem 1.5rem", borderBottom: "1px solid rgba(148,163,184,.12)" },
  titulo: { fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "#f1f5f9" },
  cerrar: { background: "none", border: "none", color: "#94a3b8", fontSize: "1.6rem", lineHeight: 1, cursor: "pointer", padding: 0 },
  scroll: { overflowY: "auto", padding: "0.6rem 1rem 1rem" },
  item: { borderBottom: "1px solid rgba(148,163,184,.1)" },
  pregunta: { width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.8rem", textAlign: "left", padding: "0.85rem 0.4rem", background: "none", border: "none", color: "#cbd5e1", fontSize: "0.88rem", fontWeight: 500, cursor: "pointer", lineHeight: 1.4 },
  preguntaActiva: { color: "#7dd3fc" },
  flecha: { fontSize: "1.2rem", color: "#64748b", transition: "transform .18s", flexShrink: 0 },
  respuesta: { padding: "0 0.4rem 1rem", fontSize: "0.82rem", color: "#94a3b8", lineHeight: 1.6 },
};