import { useState, useEffect, useRef } from "react";

/* ═══ ESTILOS GLOBALES DE IMPRESIÓN ═══ */
const printStyles = `
  @media print {
    @page { size: A4; margin: 0; }
    body { margin: 0; }
    .no-print { display: none !important; }
    .pagina {
      page-break-after: always;
      page-break-inside: avoid;
      box-shadow: none !important;
    }
    .pagina:last-child { page-break-after: auto; }
    .tabla-section { page-break-inside: avoid; }
    .sec-bloque { page-break-inside: avoid; }
  }
  @media screen {
    body { background: #374151; }
  }
`;

const A4 = {
  width: "210mm",
  minHeight: "297mm",
  background: "#fff",
  margin: "0 auto 16px",
  padding: "16mm 18mm 16mm 18mm",
  boxShadow: "0 4px 32px rgba(0,0,0,0.35)",
  boxSizing: "border-box",
  position: "relative",
  fontFamily: "'Segoe UI', system-ui, sans-serif",
  color: "#1e293b",
  fontSize: "8.5pt",
};

const AZUL     = "#1e3a8a";
const AZUL_MED = "#2563eb";
const AZUL_CLR = "#dbeafe";
const GRIS     = "#64748b";
const GRIS_CLR = "#f8fafc";
const BORDE    = "#e2e8f0";
const VERDE    = "#166534";
const VERDE_CLR= "#dcfce7";
const NARANJA  = "#92400e";
const NARANJA_CLR = "#fef3c7";
const MORADO   = "#5b21b6";
const MORADO_CLR  = "#ede9fe";
const TEAL     = "#115e59";
const TEAL_CLR = "#ccfbf1";

const thStyle = {
  background: AZUL,
  color: "#fff",
  padding: "5px 8px",
  textAlign: "left",
  fontWeight: 700,
  fontSize: "7.5pt",
  border: `1px solid ${AZUL}`,
  whiteSpace: "nowrap",
};
const tdStyle = {
  padding: "4px 8px",
  border: `1px solid ${BORDE}`,
  fontSize: "8pt",
  verticalAlign: "middle",
};

const f2 = (v) => { const n = parseFloat(v); return isNaN(n) ? "—" : n.toFixed(2); };
const fmtBTU = (v) => Math.round(parseFloat(v) || 0).toLocaleString("es-MX");

/* ═══ COMPONENTES BASE ═══ */
function HeaderPagina({ logoEmpresa, numero, total }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:`2px solid ${AZUL}`, paddingBottom:"8px", marginBottom:"14px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
        <div style={{ background:AZUL, borderRadius:"6px", padding:"4px 10px" }}>
          <span style={{ color:"#fff", fontWeight:800, fontSize:"9pt", letterSpacing:"0.05em" }}>POOL<span style={{ color:"#60a5fa" }}>METRIC</span></span>
        </div>
        <span style={{ fontSize:"7pt", color:GRIS, fontWeight:600 }}>HYDRAULIC DESIGN</span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
        {logoEmpresa && <img src={logoEmpresa} alt="Logo empresa" style={{ maxHeight:"28px", maxWidth:"70px", objectFit:"contain" }} />}
        <span style={{ fontSize:"7pt", color:GRIS }}>Pág. {numero} / {total}</span>
      </div>
    </div>
  );
}

function FooterPagina({ fecha }) {
  return (
    <div style={{ position:"absolute", bottom:"10mm", left:"18mm", right:"18mm", borderTop:`1px solid ${BORDE}`, paddingTop:"5px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
      <span style={{ fontSize:"6.5pt", color:GRIS }}>Memoria de cálculo hidráulico — PoolMetric</span>
      <span style={{ fontSize:"6.5pt", color:GRIS }}>{fecha}</span>
    </div>
  );
}

function SeccionTitulo({ children, color = AZUL, bg = AZUL_CLR }) {
  return (
    <div style={{ borderLeft:`4px solid ${color}`, paddingLeft:"10px", marginBottom:"10px", marginTop:"14px", background:bg, padding:"6px 10px", borderRadius:"0 4px 4px 0" }}>
      <span style={{ fontSize:"9.5pt", fontWeight:800, color, textTransform:"uppercase", letterSpacing:"0.05em" }}>
        {children}
      </span>
    </div>
  );
}

function CajaFundamento({ titulo, color = AZUL, bg = AZUL_CLR, children }) {
  return (
    <div style={{ border:`1px solid ${color}22`, borderLeft:`3px solid ${color}`, borderRadius:"4px", padding:"8px 12px", background:bg+"44", marginBottom:"10px" }} className="sec-bloque">
      {titulo && <div style={{ fontSize:"7.5pt", fontWeight:700, color, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"5px" }}>{titulo}</div>}
      <div style={{ fontSize:"7.5pt", color:"#334155", lineHeight:1.65 }}>{children}</div>
    </div>
  );
}

function FormulaBox({ formula, descripcion }) {
  return (
    <div style={{ background:"#f1f5f9", border:`1px solid ${BORDE}`, borderRadius:"4px", padding:"6px 12px", margin:"6px 0", display:"flex", gap:"16px", alignItems:"center" }}>
      <code style={{ fontSize:"8.5pt", fontWeight:700, color:AZUL, fontFamily:"'Courier New', monospace", whiteSpace:"nowrap" }}>{formula}</code>
      {descripcion && <span style={{ fontSize:"7pt", color:GRIS, flex:1 }}>{descripcion}</span>}
    </div>
  );
}

function TablaParametros({ filas, color = AZUL }) {
  return (
    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"7.5pt", marginBottom:"8px" }}>
      <tbody>
        {filas.map(([label, val, desc], i) => (
          <tr key={i} style={{ background: i%2===0 ? "#fff" : GRIS_CLR }}>
            <td style={{ ...tdStyle, fontWeight:600, color:"#334155", width:"35%" }}>{label}</td>
            <td style={{ ...tdStyle, fontWeight:700, color, width:"20%" }}>{val}</td>
            {desc && <td style={{ ...tdStyle, color:GRIS, fontSize:"7pt" }}>{desc}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TablaEquipos({ filas, color = AZUL }) {
  return (
    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"7.5pt", marginBottom:"8px" }}>
      <thead>
        <tr>
          {["Equipo","Marca","Modelo","Especificación","Cant."].map(h => (
            <th key={h} style={{ ...thStyle, background: color }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {filas.map((fila, i) => (
          <tr key={i} style={{ background: i%2===0 ? "#fff" : GRIS_CLR }}>
            {fila.map((cel, j) => (
              <td key={j} style={{ ...tdStyle, textAlign: j===4 ? "center" : "left", fontWeight: j===4 ? 700 : 400 }}>{cel}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ═══ PÁGINA 1: PORTADA ═══ */
function Portada({ memoria, logoEmpresa, fecha }) {
  const { resumen } = memoria;
  return (
    <div className="pagina" style={{ ...A4, display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div style={{ background:AZUL, borderRadius:"8px", padding:"8px 18px" }}>
          <div style={{ color:"#fff", fontWeight:900, fontSize:"16pt", letterSpacing:"0.08em" }}>
            POOL<span style={{ color:"#93c5fd" }}>METRIC</span>
          </div>
          <div style={{ color:"#93c5fd", fontSize:"7pt", fontWeight:600, letterSpacing:"0.15em" }}>HYDRAULIC DESIGN</div>
        </div>
        {logoEmpresa && (
          <div style={{ border:`1px solid ${BORDE}`, borderRadius:"8px", padding:"8px 16px", display:"flex", alignItems:"center" }}>
            <img src={logoEmpresa} alt="Logo" style={{ maxHeight:"50px", maxWidth:"120px", objectFit:"contain" }} />
          </div>
        )}
      </div>

      <div style={{ textAlign:"center", padding:"20mm 0" }}>
        <div style={{ fontSize:"7pt", color:GRIS, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:"12px" }}>Documento técnico</div>
        <div style={{ fontSize:"26pt", fontWeight:900, color:AZUL, lineHeight:1.1, marginBottom:"8px" }}>Memoria de Cálculo</div>
        <div style={{ fontSize:"16pt", fontWeight:700, color:AZUL_MED, marginBottom:"24px" }}>Hidráulico de Alberca</div>
        <div style={{ width:"60px", height:"3px", background:AZUL_MED, margin:"0 auto 24px" }} />
        <div style={{ fontSize:"9pt", color:GRIS }}>Diseño y selección de equipos hidráulicos</div>
      </div>

      <div>
        <div style={{ background:AZUL_CLR, borderRadius:"8px", padding:"14px 18px", marginBottom:"16px" }}>
          <div style={{ fontSize:"7.5pt", fontWeight:700, color:AZUL, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"10px" }}>Datos del sistema</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px" }}>
            {[
              { label:"Área de alberca",    val: resumen.area ? `${resumen.area} m²` : "—" },
              { label:"Volumen",            val: resumen.vol  ? `${resumen.vol} m³`  : "—" },
              { label:"Flujo máximo",       val: `${resumen.flujoMax} GPM` },
              { label:"Flujo de operación", val: resumen.flujoFinal ? `${resumen.flujoFinal} GPM` : "—" },
              { label:"CDT operación",      val: resumen.cdtFinal   ? `${resumen.cdtFinal} fthd`  : "—" },
              { label:"CDT en PSI",         val: resumen.cdtFinal   ? `${f2(parseFloat(resumen.cdtFinal)*0.43353)} PSI` : "—" },
            ].map(({ label, val }) => (
              <div key={label}>
                <div style={{ fontSize:"7pt", color:GRIS, fontWeight:600 }}>{label}</div>
                <div style={{ fontSize:"10pt", fontWeight:800, color:AZUL }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {resumen.bomba && resumen.bomba !== "—" && (
          <div style={{ border:`2px solid ${AZUL_MED}`, borderRadius:"8px", padding:"10px 16px", display:"flex", alignItems:"center", gap:"16px" }}>
            <div style={{ background:AZUL_MED, borderRadius:"6px", padding:"6px 10px" }}>
              <span style={{ color:"#fff", fontSize:"7pt", fontWeight:700 }}>MOTOBOMBA</span>
            </div>
            <div>
              <span style={{ fontSize:"9pt", fontWeight:700, color:AZUL }}>{resumen.bombaMarca} {resumen.bombaModelo}</span>
              <span style={{ fontSize:"8pt", color:GRIS, marginLeft:"10px" }}>{resumen.bombaPotencia} HP · {resumen.nBombas} {resumen.nBombas === 1 ? "unidad" : "unidades"}</span>
            </div>
          </div>
        )}

        <div style={{ textAlign:"center", marginTop:"20px", fontSize:"7.5pt", color:GRIS }}>
          Generado el {fecha} · PoolMetric Hydraulic Design
        </div>
      </div>
    </div>
  );
}

/* ═══ PÁGINA 2: METODOLOGÍA HAZEN-WILLIAMS ═══ */
function PaginaMetodologia({ memoria, logoEmpresa, fecha }) {
  const { resumen } = memoria;
  return (
    <div className="pagina" style={{ ...A4 }}>
      <HeaderPagina logoEmpresa={logoEmpresa} numero={2} total="—" />
      <SeccionTitulo color={AZUL} bg={AZUL_CLR}>Metodología hidráulica — Ecuación de Hazen-Williams</SeccionTitulo>

      <CajaFundamento titulo="Origen y fundamento" color={AZUL} bg={AZUL_CLR}>
        La ecuación de Hazen-Williams fue desarrollada por Allen Hazen y Gardner Williams en 1906 como una fórmula empírica para calcular la pérdida de carga por fricción en tuberías a presión que conducen agua. A diferencia de la ecuación de Darcy-Weisbach, que requiere conocer el factor de fricción de Moody (dependiente del número de Reynolds y la rugosidad relativa), Hazen-Williams simplifica el cálculo mediante un coeficiente de rugosidad C que engloba las características del material de la tubería. Esta simplificación la hace especialmente adecuada para sistemas de distribución de agua a temperatura ambiente como los circuitos hidráulicos de albercas, donde las condiciones de flujo son prácticamente constantes y la viscosidad del agua no varía significativamente.
      </CajaFundamento>

      <CajaFundamento titulo="Ecuación base" color={AZUL} bg={AZUL_CLR}>
        <FormulaBox
          formula="V = 0.8492 · C · R^0.63 · S^0.54"
          descripcion="Velocidad media del flujo (m/s) — forma métrica"
        />
        <FormulaBox
          formula="hf = (10.67 · L · Q^1.852) / (C^1.852 · D^4.87)"
          descripcion="Pérdida de carga por fricción (m) — Q en m³/s, D en metros"
        />
        <div style={{ marginTop:"6px" }}>
          Donde: <strong>C</strong> = coeficiente de Hazen-Williams (PVC: 150, acero: 120, cobre: 130) · <strong>R</strong> = radio hidráulico (m) · <strong>S</strong> = pendiente hidráulica (m/m) · <strong>L</strong> = longitud del tramo (m) · <strong>D</strong> = diámetro interno (m) · <strong>Q</strong> = gasto volumétrico (m³/s)
        </div>
      </CajaFundamento>

      <CajaFundamento titulo="Conversión a pies de columna de agua (fthd)" color={AZUL} bg={AZUL_CLR}>
        En el diseño hidráulico de albercas se trabaja en unidades inglesas (GPM, pies) por convención del sector. La pérdida de carga en fthd (feet of head) se obtiene adaptando la ecuación:
        <FormulaBox
          formula="hf (fthd/100ft) = (1.318 · C · R^0.63 · S^0.54)^-1 · Q^1.852"
          descripcion="Forma adaptada para GPM y pulgadas de diámetro"
        />
        La carga dinámica total (CDT) del sistema es la suma de todas las pérdidas en los tramos de tubería más las pérdidas por accesorios (tees, codos, reducciones) calculadas mediante longitudes equivalentes.
      </CajaFundamento>

      <CajaFundamento titulo="Longitudes equivalentes de accesorios" color={AZUL} bg={AZUL_CLR}>
        Los accesorios hidráulicos (codos, tees, reducciones) generan pérdidas de presión que se expresan como la longitud de tubería recta que produciría la misma pérdida. Este método, denominado <em>longitud equivalente</em>, permite sumar todas las pérdidas de manera uniforme.
        <FormulaBox
          formula="h_accesorio = (C_base / 100) · L_equivalente"
          descripcion="Pérdida en accesorio = carga base × longitud equivalente del accesorio"
        />
        Las longitudes equivalentes se obtienen de tablas estándar según el diámetro de la tubería y el tipo de accesorio (codo 90°, tee paso directo, tee derivación, reducción concéntrica).
      </CajaFundamento>

      <CajaFundamento titulo="Velocidades de diseño" color={AZUL} bg={AZUL_CLR}>
        Para garantizar un diseño eficiente y evitar erosión o ruido excesivo, se aplican los siguientes límites de velocidad:
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px", marginTop:"6px" }}>
          {[
            ["Tubería de succión",  "≤ 1.2 m/s  (≤ 4.5 ft/s)",  "Evita cavitación en la bomba"],
            ["Tubería de descarga", "≤ 2.0 m/s  (≤ 6.5 ft/s)",  "Minimiza pérdidas y ruido"],
          ].map(([tipo, vel, desc]) => (
            <div key={tipo} style={{ background:AZUL_CLR, borderRadius:"4px", padding:"6px 10px" }}>
              <div style={{ fontWeight:700, color:AZUL, fontSize:"7.5pt" }}>{tipo}</div>
              <div style={{ fontSize:"8.5pt", fontWeight:700, color:AZUL_MED }}>{vel}</div>
              <div style={{ fontSize:"7pt", color:GRIS }}>{desc}</div>
            </div>
          ))}
        </div>
      </CajaFundamento>

      <CajaFundamento titulo="Carga dinámica total (CDT) del sistema" color={AZUL} bg={AZUL_CLR}>
        La CDT es la energía total por unidad de peso que la motobomba debe suministrar al fluido para mantener el caudal de diseño. Incluye:
        <div style={{ marginTop:"4px" }}>
          <strong>CDT = Σ pérdidas tramos + Σ pérdidas accesorios + carga estática + pérdidas en equipos</strong>
        </div>
        <div style={{ marginTop:"4px" }}>
          Donde la <em>carga estática</em> aplica solo cuando la bomba debe elevar el fluido a una altura mayor a la del nivel de succión. La conversión entre unidades es: <strong>1 fthd = 0.4335 PSI = 0.3048 m.c.a.</strong>
        </div>
      </CajaFundamento>

      {resumen.flujoMax && (
        <div style={{ marginTop:"10px" }}>
          <div style={{ fontSize:"7.5pt", fontWeight:700, color:AZUL, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"5px" }}>Parámetros generales del sistema diseñado</div>
          <TablaParametros color={AZUL} filas={[
            ["Flujo máximo de diseño",   `${resumen.flujoMax} GPM`,       "Flujo que gobierna la selección de equipos"],
            ["Flujo de operación real",  resumen.flujoFinal ? `${resumen.flujoFinal} GPM` : "—", "Punto de equilibrio bomba-sistema"],
            ["CDT de diseño",            resumen.cdtDiseno  ? `${resumen.cdtDiseno} fthd` : "—", "Suma total de pérdidas en diseño original"],
            ["CDT de operación",         resumen.cdtFinal   ? `${resumen.cdtFinal} fthd`  : "—", "CDT en el punto de operación real"],
            ["Variación flujo vs diseño",resumen.flujoFinal && resumen.flujoMax ? `${(((parseFloat(resumen.flujoFinal)-parseFloat(resumen.flujoMax))/parseFloat(resumen.flujoMax))*100).toFixed(1)}%` : "—", "Diferencia entre flujo diseño y operación"],
          ]} />
        </div>
      )}

      <FooterPagina fecha={fecha} />
    </div>
  );
}

/* ═══ PÁGINA 3: FILTRADO ═══ */
function PaginaFiltrado({ memoria, logoEmpresa, fecha }) {
  const { resumen, calentamiento: cal = [] } = memoria;
  const tieneInfinity = resumen.flujoInfinity && parseFloat(resumen.flujoInfinity) > 0;
  const tieneCanal    = resumen.flujoCanal    && parseFloat(resumen.flujoCanal)    > 0;

  return (
    <div className="pagina" style={{ ...A4 }}>
      <HeaderPagina logoEmpresa={logoEmpresa} numero={3} total="—" />
      <SeccionTitulo color={TEAL} bg={TEAL_CLR}>Sección 1 — Circuito de filtrado</SeccionTitulo>

      <CajaFundamento titulo="Fundamento del circuito de filtrado" color={TEAL} bg={TEAL_CLR}>
        El circuito de filtrado es el circuito hidráulico principal de la alberca. Su función es recircular el volumen total del agua a través de los equipos de filtración y sanitización para mantener la calidad del agua. La tasa de recirculación (turnover rate) determina el tiempo en que todo el volumen de agua pasa por el sistema de filtración, siendo el estándar para uso residencial de 6 horas y para uso comercial de 4 horas o menos.
        <FormulaBox
          formula="Q_filtrado = V_total (L) / t_recirculación (h) / 3,785"
          descripcion="Gasto de filtrado en GPM — V en litros, t en horas"
        />
        En sistemas con desborde tipo infinity o canal perimetral, el circuito de filtrado y el circuito de desborde pueden tener flujos independientes. El flujo que gobierna la selección de la motobomba principal es el mayor de todos los circuitos.
      </CajaFundamento>

      <div style={{ display:"grid", gridTemplateColumns: tieneInfinity || tieneCanal ? "1fr 1fr" : "1fr", gap:"10px", marginBottom:"10px" }}>
        <div>
          <div style={{ fontSize:"7.5pt", fontWeight:700, color:TEAL, textTransform:"uppercase", marginBottom:"5px" }}>Circuito principal de filtrado</div>
          <TablaParametros color={TEAL} filas={[
            ["Flujo de filtrado",    `${resumen.flujoMax} GPM`,  "Flujo máximo del circuito principal"],
            ["Área total",           resumen.area ? `${resumen.area} m²` : "—", "Superficie total de la alberca"],
            ["Volumen total",        resumen.vol  ? `${resumen.vol} m³`  : "—", "Volumen total del sistema"],
            ["Tubería de descarga",  resumen.tubDescarga ?? "—", "Diámetro seleccionado por velocidad"],
          ]} />
        </div>

        {tieneInfinity && (
          <div>
            <div style={{ fontSize:"7.5pt", fontWeight:700, color:TEAL, textTransform:"uppercase", marginBottom:"5px" }}>Circuito infinity / desborde</div>
            <CajaFundamento color={TEAL} bg={TEAL_CLR}>
              El circuito infinity recircula el agua que desborda por el borde de la alberca hacia el tanque de compensación. El flujo se calcula en función del largo del borde infinity y la lámina de agua de diseño. Este circuito puede tener su propia motobomba dedicada o compartir la principal.
              <FormulaBox
                formula="Q_infinity = L_borde (m) × e_lámina (m/s) × 264.17"
                descripcion="Flujo infinity en GPM — e_lámina = espesor de lámina de agua"
              />
            </CajaFundamento>
            <TablaParametros color={TEAL} filas={[
              ["Flujo infinity",       `${resumen.flujoInfinity} GPM`, "Flujo del circuito de desborde"],
              ["Motobomba dedicada",   resumen.bombaDedicadaInfinity ?? "—", "¿Se usa bomba exclusiva para infinity?"],
            ]} />
          </div>
        )}

        {tieneCanal && !tieneInfinity && (
          <div>
            <div style={{ fontSize:"7.5pt", fontWeight:700, color:TEAL, textTransform:"uppercase", marginBottom:"5px" }}>Circuito canal perimetral</div>
            <CajaFundamento color={TEAL} bg={TEAL_CLR}>
              El canal perimetral (rebosadero) es un sistema de recolección de agua que rodea parcial o totalmente la alberca. El agua rebosa por los bordes y es recogida en el canal, desde donde es bombeada de regreso al sistema. A diferencia del infinity, el canal perimetral generalmente comparte el circuito principal de filtrado.
            </CajaFundamento>
            <TablaParametros color={TEAL} filas={[
              ["Flujo canal perimetral", `${resumen.flujoCanal} GPM`, "Flujo del circuito de canal"],
            ]} />
          </div>
        )}
      </div>

      <div style={{ marginTop:"8px" }}>
        <div style={{ fontSize:"7.5pt", fontWeight:700, color:TEAL, textTransform:"uppercase", marginBottom:"5px" }}>Resumen de flujos por circuito</div>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"7.5pt" }}>
          <thead>
            <tr>
              {["Circuito","Flujo (GPM)","Tubería","Velocidad","Criterio"].map(h => (
                <th key={h} style={{ ...thStyle, background:TEAL }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ["Filtrado principal", resumen.flujoMax ?? "—", resumen.tubDescarga ?? "—", resumen.velDescarga ? `${resumen.velDescarga} ft/s` : "—", "Tasa de recirculación"],
              tieneInfinity ? ["Infinity / desborde", resumen.flujoInfinity, resumen.tubInfinity ?? "—", resumen.velInfinity ? `${resumen.velInfinity} ft/s` : "—", "Lámina de agua en borde"] : null,
              tieneCanal    ? ["Canal perimetral",    resumen.flujoCanal,    resumen.tubCanal    ?? "—", resumen.velCanal    ? `${resumen.velCanal} ft/s`    : "—", "Rebosadero perimetral"] : null,
            ].filter(Boolean).map((fila, i) => (
              <tr key={i} style={{ background: i%2===0 ? "#fff" : GRIS_CLR }}>
                {fila.map((cel, j) => (
                  <td key={j} style={{ ...tdStyle, fontWeight: j===0 ? 600 : 400, color: j===1 ? TEAL : "#1e293b" }}>{cel ?? "—"}</td>
                ))}
              </tr>
            ))}
            <tr style={{ background:TEAL_CLR }}>
              <td style={{ ...tdStyle, fontWeight:800, color:TEAL }}>FLUJO MÁXIMO GLOBAL</td>
              <td style={{ ...tdStyle, fontWeight:800, color:TEAL }}>{resumen.flujoMax} GPM</td>
              <td colSpan={3} style={{ ...tdStyle, color:GRIS, fontSize:"7pt" }}>Gobierna la selección de la motobomba principal</td>
            </tr>
          </tbody>
        </table>
      </div>

      <FooterPagina fecha={fecha} />
    </div>
  );
}

/* ═══ PÁGINA 4: CALENTAMIENTO ═══ */
function PaginaCalentamiento({ memoria, logoEmpresa, fecha }) {
  const { resumen, calentamiento = [] } = memoria;
  const pt = memoria.perfilTermico;

  const NOMBRES_CIUDAD = {
    guadalajara:"Guadalajara", mexicali:"Mexicali", losCabos:"Los Cabos",
    hermosillo:"Hermosillo", chihuahua:"Chihuahua", torreon:"Torreón",
    monterrey:"Monterrey", tampico:"Tampico", veracruz:"Veracruz",
    sanLuisPotosi:"San Luis Potosí", durango:"Durango", culiacan:"Culiacán",
    tepic:"Tepic", colima:"Colima", aguascalientes:"Aguascalientes",
    zacatecas:"Zacatecas", morelia:"Morelia", leon:"León",
    queretaro:"Querétaro", pachuca:"Pachuca", ciudadDeMexico:"Ciudad de México",
    acapulco:"Acapulco", cuernavaca:"Cuernavaca", puebla:"Puebla",
    tlaxcala:"Tlaxcala", oaxaca:"Oaxaca", villahermosa:"Villahermosa",
    tuxtlaGutierrez:"Tuxtla Gutiérrez", campeche:"Campeche", merida:"Mérida",
    cancun:"Cancún", manzanillo:"Manzanillo", puertoVallarta:"Puerto Vallarta",
  };

  const canvasPieRef = useRef(null);

  const PERDIDAS_DEF = [
    { key:"evaporacion",  label:"Evaporación",     color:"#1e40af" },
    { key:"conveccion",   label:"Convección",       color:"#0ea5e9" },
    { key:"radiacion",    label:"Radiación",        color:"#f43f5e" },
    { key:"transmision",  label:"Transmisión",      color:"#6b7280" },
    { key:"infinity",     label:"Infinity",         color:"#16a34a" },
    { key:"canal",        label:"Canal perimetral", color:"#3b82f6" },
    { key:"tuberia",      label:"+ Tubería",        color:"#d97706" },
  ];

  const perdidasBTU  = pt?.perdidasBTU ?? {};
  const perdidaTotal = parseFloat(pt?.perdidaTotalBTU) || 0;
  const PERDIDAS = PERDIDAS_DEF.filter(p => (parseFloat(perdidasBTU[p.key]) || 0) > 0);

  useEffect(() => {
    if (!pt) return;
    const canvas = canvasPieRef.current;
    if (!canvas || !PERDIDAS.length) return;
    const ctx = canvas.getContext("2d");
    const cx = canvas.width/2, cy = canvas.height/2;
    const r  = Math.min(cx,cy) - 30;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "#fff"; ctx.fillRect(0,0,canvas.width,canvas.height);
    let start = -Math.PI/2;
    for (const p of PERDIDAS) {
      const val   = parseFloat(perdidasBTU[p.key]) || 0;
      const slice = (val/perdidaTotal)*2*Math.PI;
      ctx.beginPath(); ctx.moveTo(cx,cy);
      ctx.arc(cx,cy,r,start,start+slice); ctx.closePath();
      ctx.fillStyle = p.color; ctx.fill();
      ctx.strokeStyle="#fff"; ctx.lineWidth=1.5; ctx.stroke();
      if (slice>0.3) {
        const mid=start+slice/2;
        ctx.fillStyle="#fff"; ctx.font="bold 11px system-ui";
        ctx.textAlign="center"; ctx.textBaseline="middle";
        ctx.fillText(`${((val/perdidaTotal)*100).toFixed(0)}%`, cx+(r*0.65)*Math.cos(mid), cy+(r*0.65)*Math.sin(mid));
      }
      start+=slice;
    }
  }, [pt]);

  if (!pt && !calentamiento.length) return null;

  return (
    <div className="pagina" style={{ ...A4 }}>
      <HeaderPagina logoEmpresa={logoEmpresa} numero={4} total="—" />
      <SeccionTitulo color={NARANJA} bg={NARANJA_CLR}>Sección 2 — Calentamiento</SeccionTitulo>

      <CajaFundamento titulo="Fundamento — Pérdidas de calor en albercas" color={NARANJA} bg={NARANJA_CLR}>
        El cálculo de la demanda de calentamiento en una alberca se basa en el balance energético del sistema: la potencia del equipo de calentamiento debe ser capaz de reponer todas las pérdidas de calor para mantener la temperatura deseada del agua en el mes más frío del año. Las principales pérdidas de calor son:
        <div style={{ marginTop:"5px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px" }}>
          {[
            ["Evaporación (mayor pérdida)",  "Q_evap = A × M_e × Calor_vap",          "Calor cedido al evaporar agua en la superficie. Depende de la diferencia de humedad entre el agua y el aire, la velocidad del viento y la temperatura del agua."],
            ["Convección",                   "Q_conv = h_c × A × (T_agua − T_aire)",  "Calor transferido por contacto del aire con la superficie del agua. Mayor con viento fuerte o albercas expuestas."],
            ["Radiación",                    "Q_rad = ε × σ × A × (T_agua⁴ − T_cielo⁴)", "Emisión de calor infrarrojo desde la superficie del agua hacia el cielo. Sigue la ley de Stefan-Boltzmann."],
            ["Transmisión (paredes/fondo)",  "Q_trans = U × A × (T_agua − T_suelo)",  "Pérdida de calor a través de las paredes y el fondo de la alberca. Depende del coeficiente de transmisión del material constructivo."],
          ].map(([t, f, d]) => (
            <div key={t} style={{ background:"#fff7ed", border:"1px solid #fed7aa", borderRadius:"3px", padding:"5px 8px", fontSize:"7pt" }}>
              <div style={{ fontWeight:700, color:NARANJA, marginBottom:"2px" }}>{t}</div>
              <code style={{ fontSize:"7pt", color:"#92400e", display:"block", marginBottom:"2px" }}>{f}</code>
              <div style={{ color:GRIS }}>{d}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:"6px" }}>
          <strong>Pérdida por tubería:</strong> calor cedido al ambiente a través de la tubería de distribución, calculada con la ecuación de transferencia de calor en cilindros huecos. La <strong>potencia total requerida</strong> es la suma de todas las pérdidas anteriores.
        </div>
      </CajaFundamento>

      {pt && (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"10px" }}>
            <div>
              <div style={{ fontSize:"7.5pt", fontWeight:700, color:NARANJA, textTransform:"uppercase", marginBottom:"5px" }}>Parámetros de diseño térmico</div>
              <TablaParametros color={NARANJA} filas={[
                ["Ciudad de diseño",          NOMBRES_CIUDAD[pt.ciudad] ?? pt.ciudad ?? "—",  "Ubicación geográfica del proyecto"],
                ["Temperatura deseada (Td)",  `${pt.tempDeseada} °C`,  "Temperatura objetivo del agua"],
                ["Temperatura ambiente (Ta)", pt.mesMasFrio ? `${pt.mesMasFrio.tProm} °C` : "—", `Mes más frío: ${pt.mesMasFrio?.mes ?? "—"}`],
                ["ΔT de diseño",              pt.mesMasFrio ? `${(pt.tempDeseada - parseFloat(pt.mesMasFrio.tProm)).toFixed(1)} °C` : "—", "Td − Ta"],
                ["Cubierta térmica",          pt.cubierta ? "Sí" : "No", pt.cubierta ? "Reduce pérdidas ~50%" : "Sin cubierta"],
                ["Alberca techada",           pt.techada  ? "Sí" : "No", pt.techada  ? "Menor convección" : "Expuesta al viento"],
                ["Vel. viento de diseño",     pt.mesMasFrio?.viento ?? "—", "km/h — mes más frío"],
                ["Humedad relativa",          pt.mesMasFrio ? `${pt.mesMasFrio.humedad}%` : "—", "Mes más frío"],
                ["Pérdida total requerida",   `${Math.round(perdidaTotal).toLocaleString("es-MX")} BTU/h`, "Capacidad mínima del equipo"],
              ]} />
            </div>
            <div>
              <div style={{ fontSize:"7.5pt", fontWeight:700, color:NARANJA, textTransform:"uppercase", marginBottom:"5px" }}>Distribución de pérdidas energéticas</div>
              <div style={{ display:"flex", justifyContent:"center", marginBottom:"6px" }}>
                <canvas ref={canvasPieRef} width={220} height={220} style={{ width:"180px", height:"180px" }} />
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:"2px" }}>
                {PERDIDAS.map(p => {
                  const val = parseFloat(perdidasBTU[p.key]) || 0;
                  return (
                    <div key={p.key} style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:"7pt" }}>
                      <span style={{ width:"9px", height:"9px", borderRadius:"2px", background:p.color, display:"inline-block", flexShrink:0 }} />
                      <span style={{ flex:1, color:GRIS }}>{p.label}</span>
                      <span style={{ fontWeight:600, color:"#334155" }}>{fmtBTU(val)}</span>
                      <span style={{ color:GRIS, width:"36px", textAlign:"right" }}>{perdidaTotal>0?`${(val/perdidaTotal*100).toFixed(1)}%`:"—"}</span>
                    </div>
                  );
                })}
                <div style={{ borderTop:`1px solid ${BORDE}`, paddingTop:"3px", display:"flex", gap:"5px", fontSize:"7.5pt", fontWeight:700 }}>
                  <span style={{ width:"9px", display:"inline-block" }} />
                  <span style={{ flex:1, color:NARANJA }}>Total</span>
                  <span style={{ color:NARANJA }}>{fmtBTU(perdidaTotal)} BTU/h</span>
                </div>
              </div>
            </div>
          </div>

          {pt.tablaClima?.length > 0 && (
            <div>
              <div style={{ fontSize:"7.5pt", fontWeight:700, color:NARANJA, textTransform:"uppercase", marginBottom:"5px" }}>Tabla climática mensual</div>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"7pt" }}>
                <thead>
                  <tr>
                    {["Mes","T° Min","T° Prom","T° Max","HR%","Viento","Pérdida clima (BTU/h)","Calentar"].map(h => (
                      <th key={h} style={{ ...thStyle, background:NARANJA, fontSize:"6.5pt", padding:"4px 6px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pt.tablaClima.map((m, i) => {
                    const esMas = pt.mesMasFrio?.mes === m.mes;
                    const sel   = pt.mesesCalentar?.[m.mes];
                    return (
                      <tr key={m.mes} style={{ background: esMas ? "#fff7ed" : i%2===0 ? "#fff" : GRIS_CLR, borderLeft: esMas ? "3px solid #f97316" : "3px solid transparent" }}>
                        <td style={{ ...tdStyle, fontWeight: esMas?700:400, color: esMas?"#ea580c":"#1e293b", fontSize:"7pt" }}>{m.mes}{esMas?" ★":""}</td>
                        <td style={{ ...tdStyle, textAlign:"center", fontSize:"7pt" }}>{m.tMin}°</td>
                        <td style={{ ...tdStyle, textAlign:"center", fontWeight: esMas?700:400, color: esMas?"#ea580c":"#1e293b", fontSize:"7pt" }}>{m.tProm}°</td>
                        <td style={{ ...tdStyle, textAlign:"center", fontSize:"7pt" }}>{m.tMax}°</td>
                        <td style={{ ...tdStyle, textAlign:"center", fontSize:"7pt" }}>{m.humedad}%</td>
                        <td style={{ ...tdStyle, textAlign:"center", fontSize:"7pt" }}>{m.viento}</td>
                        <td style={{ ...tdStyle, textAlign:"center", color: esMas?"#ea580c":GRIS, fontWeight: esMas?700:400, fontSize:"7pt" }}>
                          {m.perdidaClima>0 ? m.perdidaClima.toLocaleString("es-MX") : "—"}
                        </td>
                        <td style={{ ...tdStyle, textAlign:"center", color: sel?"#16a34a":"#9ca3af", fontSize:"7pt" }}>{sel?"✓":"—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {calentamiento.length > 0 && (
        <div style={{ marginTop:"10px" }}>
          <div style={{ fontSize:"7.5pt", fontWeight:700, color:NARANJA, textTransform:"uppercase", marginBottom:"5px" }}>Equipos de calentamiento seleccionados</div>
          <TablaEquipos color={NARANJA} filas={calentamiento.map(eq => {
            const sel = eq.seleccion ?? {};
            const cap = sel.capUnitaria ? `${Math.round(sel.capUnitaria).toLocaleString("es-MX")} BTU/h` : (eq.cargaTotal ? `CDT: ${f2(eq.cargaTotal)} fthd` : "—");
            return [eq.label ?? eq.key, sel.marca ?? "—", sel.modelo ?? "—", cap, sel.cantidad ?? "—"];
          })} />
        </div>
      )}

      <FooterPagina fecha={fecha} />
    </div>
  );
}

/* ═══ PÁGINA 5: SANITIZACIÓN ═══ */
function PaginaSanitizacion({ memoria, logoEmpresa, fecha }) {
  const { reportes = [], resumen } = memoria;
  const r = reportes[0];
  if (!r) return null;

  const clorSalino   = r.sanitizacion?.cloradorSalino;
  const clorAuto     = r.sanitizacion?.cloradorAutomatico;
  const uv           = r.sanitizacion?.lamparaUV;
  const hayAlgo      = clorSalino || clorAuto || uv;
  if (!hayAlgo) return null;

  return (
    <div className="pagina" style={{ ...A4 }}>
      <HeaderPagina logoEmpresa={logoEmpresa} numero={5} total="—" />
      <SeccionTitulo color={VERDE} bg={VERDE_CLR}>Sección 3 — Sanitización</SeccionTitulo>

      <CajaFundamento titulo="Fundamento — Desinfección de agua de alberca" color={VERDE} bg={VERDE_CLR}>
        La sanitización del agua de alberca tiene como objetivo eliminar microorganismos patógenos (bacterias, virus, algas) manteniendo el agua en condiciones higiénicas seguras para los usuarios. El cloro libre residual es el agente desinfectante estándar, y debe mantenerse en el rango de 1–3 ppm (partes por millón) para uso residencial y 2–4 ppm para uso comercial. La demanda de cloro depende del volumen de agua, la temperatura, la carga orgánica (bañistas, hojas, lluvia) y la radiación UV solar.
        <FormulaBox
          formula="D_cloro = V (m³) × C_residual (ppm) × f_seguridad"
          descripcion="Demanda diaria de cloro — f_seguridad ≈ 1.2–1.5 según uso"
        />
      </CajaFundamento>

      {clorSalino && (
        <>
          <CajaFundamento titulo="Generador de cloro salino — electrólisis" color={VERDE} bg={VERDE_CLR}>
            El generador de cloro salino produce cloro en el lugar mediante electrólisis del cloruro de sodio (sal) disuelto en el agua. Una corriente eléctrica de corriente directa hace pasar el agua salada por celdas electrolíticas donde se produce hipoclorito de sodio (NaClO) directamente en el flujo de agua. Ventajas: sin manejo de cloro líquido o pastillas, nivel de cloro constante, menor irritación en piel y ojos.
            <FormulaBox
              formula="NaCl + H₂O → NaClO + H₂  (electrólisis)"
              descripcion="Reacción de generación de hipoclorito de sodio"
            />
            La capacidad del generador se expresa en kg de cloro/día (uso comercial) o en litros de agua tratada (uso residencial). El flujo mínimo requerido a través de la celda electrolítica es determinante para la selección del equipo.
          </CajaFundamento>
          <div style={{ marginBottom:"8px" }}>
            <TablaEquipos color={VERDE} filas={[[
              "Generador de cloro salino",
              clorSalino.seleccion?.marca ?? "—",
              clorSalino.seleccion?.modelo ?? "—",
              clorSalino.seleccion?.flujoTotal ? `${f2(clorSalino.seleccion.flujoTotal)} GPM` : "—",
              clorSalino.seleccion?.cantidad ?? "—",
            ]]} />
          </div>
        </>
      )}

      {clorAuto && !clorAuto.excluido && (
        <>
          <CajaFundamento titulo="Clorador automático — dosificación" color={VERDE} bg={VERDE_CLR}>
            El clorador automático dosifica cloro (en pastillas de tricloroisocianúrico o hipoclorito de calcio) de forma controlada en el circuito hidráulico. Puede ser instalado <em>en línea</em> (el flujo pasa a través del clorador) o <em>fuera de línea</em> (derivación del circuito principal). La instalación en línea requiere que el flujo no exceda la capacidad del equipo; para flujos superiores a 90 GPM se prefiere la instalación fuera de línea.
          </CajaFundamento>
          <div style={{ marginBottom:"8px" }}>
            <TablaEquipos color={VERDE} filas={[[
              `Clorador automático (${clorAuto.seleccion?.instalacion === "enLinea" ? "en línea" : "fuera de línea"})`,
              clorAuto.seleccion?.marca ?? "—",
              clorAuto.seleccion?.modelo ?? "—",
              clorAuto.seleccion?.flujoTotal ? `${f2(clorAuto.seleccion.flujoTotal)} GPM` : "—",
              clorAuto.seleccion?.cantidad ?? "—",
            ]]} />
          </div>
        </>
      )}

      {uv && (
        <>
          <CajaFundamento titulo="Lámpara UV — desinfección por radiación ultravioleta" color={VERDE} bg={VERDE_CLR}>
            La desinfección UV utiliza radiación ultravioleta de onda corta (254 nm) para dañar el ADN de microorganismos, impidiendo su reproducción. Es altamente efectiva contra Cryptosporidium y Giardia, que son resistentes al cloro. La lámpara UV se instala en línea en el circuito de filtrado y actúa como complemento (no sustituto) del cloro, permitiendo reducir los niveles de cloro residual necesarios. La dosis UV mínima recomendada para desinfección de agua de alberca es de 40 mJ/cm².
            <FormulaBox
              formula="D_UV (mJ/cm²) = P_lámpara (W) × t_exposición (s) / A_sección (cm²)"
              descripcion="Dosis UV — P = potencia de la lámpara, t = tiempo de exposición al flujo"
            />
          </CajaFundamento>
          <div style={{ marginBottom:"8px" }}>
            <TablaEquipos color={VERDE} filas={[[
              "Lámpara UV",
              uv.seleccion?.marca ?? "—",
              uv.seleccion?.modelo ?? "—",
              uv.seleccion?.flujoTotal ? `${f2(uv.seleccion.flujoTotal)} GPM` : "—",
              uv.seleccion?.cantidad ?? "—",
            ]]} />
          </div>
        </>
      )}

      <div style={{ marginTop:"8px" }}>
        <div style={{ fontSize:"7.5pt", fontWeight:700, color:VERDE, textTransform:"uppercase", marginBottom:"5px" }}>Cargas hidráulicas — Sanitización</div>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"7.5pt" }}>
          <thead>
            <tr>{["Equipo","Flujo (GPM)","CDT (fthd)","CDT (PSI)"].map(h=><th key={h} style={{...thStyle,background:VERDE}}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {[
              clorSalino && ["Generador de cloro salino", f2(clorSalino.seleccion?.flujoTotal), f2(clorSalino.cargaTotal), f2(clorSalino.cargaTotalPSI)],
              clorAuto && !clorAuto.excluido && ["Clorador automático", f2(clorAuto.seleccion?.flujoTotal), f2(clorAuto.cargaTotal), f2(clorAuto.cargaTotalPSI)],
              uv && ["Lámpara UV", f2(uv.seleccion?.flujoTotal), f2(uv.cargaTotal), f2(uv.cargaTotalPSI)],
            ].filter(Boolean).map((fila,i)=>(
              <tr key={i} style={{background:i%2===0?"#fff":GRIS_CLR}}>
                {fila.map((c,j)=><td key={j} style={{...tdStyle,fontWeight:j===0?600:400,color:j===2?VERDE:"#1e293b"}}>{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <FooterPagina fecha={fecha} />
    </div>
  );
}

/* ═══ PÁGINA 6: FILTRACIÓN ═══ */
function PaginaFiltracion({ memoria, logoEmpresa, fecha }) {
  const { reportes = [] } = memoria;
  const r = reportes[0];
  if (!r) return null;

  const prefiltro      = r.filtros?.prefiltro;
  const filtroArena    = r.filtros?.filtroArena;
  const filtroCartucho = r.filtros?.filtroCartucho;
  const hayAlgo        = prefiltro || filtroArena || filtroCartucho;
  if (!hayAlgo) return null;

  return (
    <div className="pagina" style={{ ...A4 }}>
      <HeaderPagina logoEmpresa={logoEmpresa} numero={6} total="—" />
      <SeccionTitulo color={MORADO} bg={MORADO_CLR}>Sección 4 — Filtración</SeccionTitulo>

      <CajaFundamento titulo="Fundamento — Filtración mecánica del agua" color={MORADO} bg={MORADO_CLR}>
        La filtración mecánica retiene partículas en suspensión (tierra, algas muertas, residuos de protector solar, etc.) que enturbian el agua. El tamaño mínimo de partícula retenida depende del medio filtrante: arena de sílice retiene partículas de 20–40 micras, mientras que los cartuchos de polipropileno pueden llegar a 5–10 micras. La tasa de filtración (flujo por unidad de área del filtro) es el parámetro de diseño principal:
        <FormulaBox
          formula="v_filtración = Q (m³/h) / A_filtro (m²)  ≤  v_máx según medio"
          descripcion="Velocidad de filtración — límite típico: 20–40 m³/m²·h para arena, 40–60 para cartucho"
        />
      </CajaFundamento>

      {prefiltro && (
        <>
          <CajaFundamento titulo="Prefiltro — separador centrífugo" color={MORADO} bg={MORADO_CLR}>
            El prefiltro o separador centrífugo (Multicyclone) separa partículas pesadas mediante fuerza centrífuga antes de que lleguen al filtro principal, extendiendo significativamente el ciclo de lavado del filtro de arena o cartucho. Opera sin elementos filtrantes ni consumibles, por lo que no genera pérdida de carga significativa con el tiempo. Retiene partículas de más de 50 micras con eficiencias superiores al 80%.
          </CajaFundamento>
          <div style={{ marginBottom:"8px" }}>
            <TablaEquipos color={MORADO} filas={[[
              "Prefiltro / separador centrífugo",
              prefiltro.seleccion?.marca ?? "—",
              prefiltro.seleccion?.modelo ?? "—",
              prefiltro.seleccion?.diameter ? `${prefiltro.seleccion.diameter}"` : "—",
              prefiltro.seleccion?.cantidad ?? "—",
            ]]} />
          </div>
        </>
      )}

      {filtroArena && (
        <>
          <CajaFundamento titulo="Filtro de arena — medio granular" color={MORADO} bg={MORADO_CLR}>
            El filtro de arena es el sistema de filtración mecánica estándar en albercas. El agua pasa a presión a través de un lecho de arena de sílice (granulometría 0.45–0.85 mm) que retiene las partículas en suspensión. Cuando la presión diferencial supera los 7–10 PSI sobre la presión inicial, se realiza un retrolavado para limpiar el medio filtrante. La relación de arena/grava y el diámetro del filtro determinan el flujo máximo soportable:
            <FormulaBox
              formula="Q_max = v_filtración × (π/4) × D²"
              descripcion="Flujo máximo del filtro — D = diámetro interno del filtro (m)"
            />
          </CajaFundamento>
          <div style={{ marginBottom:"8px" }}>
            <TablaEquipos color={MORADO} filas={[[
              "Filtro de arena",
              filtroArena.seleccion?.marca ?? "—",
              filtroArena.seleccion?.modelo ?? "—",
              filtroArena.seleccion?.diameter ? `${filtroArena.seleccion.diameter}"  ·  Arena: ${filtroArena.seleccion.arena ?? "—"} kg` : "—",
              filtroArena.seleccion?.cantidad ?? "—",
            ]]} />
          </div>
        </>
      )}

      {filtroCartucho && (
        <>
          <CajaFundamento titulo="Filtro de cartucho — medio de polipropileno" color={MORADO} bg={MORADO_CLR}>
            El filtro de cartucho utiliza elementos filtrantes plegados de polipropileno que ofrecen una mayor superficie de filtración en menor espacio físico. Son más adecuados para albercas residenciales de bajo mantenimiento, ya que no requieren retrolavado con agua sino la limpieza o sustitución del cartucho. La tasa de filtración se basa en el área de filtración total del cartucho y el tipo de uso (residencial o comercial):
            <FormulaBox
              formula="Q = A_filtración (ft²) × v_específica (GPM/ft²)"
              descripcion="Flujo según uso: residencial ~0.375 GPM/ft², comercial ~0.25 GPM/ft²"
            />
          </CajaFundamento>
          <div style={{ marginBottom:"8px" }}>
            <TablaEquipos color={MORADO} filas={[[
              "Filtro de cartucho",
              filtroCartucho.seleccion?.marca ?? "—",
              filtroCartucho.seleccion?.modelo ?? "—",
              filtroCartucho.seleccion?.filtrationArea ? `${filtroCartucho.seleccion.filtrationArea} ft²` : "—",
              filtroCartucho.seleccion?.cantidad ?? "—",
            ]]} />
          </div>
        </>
      )}

      <div style={{ marginTop:"8px" }}>
        <div style={{ fontSize:"7.5pt", fontWeight:700, color:MORADO, textTransform:"uppercase", marginBottom:"5px" }}>Cargas hidráulicas — Filtración</div>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"7.5pt" }}>
          <thead>
            <tr>{["Equipo","Flujo (GPM)","CDT (fthd)","CDT (PSI)"].map(h=><th key={h} style={{...thStyle,background:MORADO}}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {[
              prefiltro      && ["Prefiltro",        f2(prefiltro.seleccion?.flujoTotal),      f2(prefiltro.cargaTotal),      f2(prefiltro.cargaTotalPSI)],
              filtroArena    && ["Filtro de arena",   f2(filtroArena.seleccion?.flujoTotal),    f2(filtroArena.cargaTotal),    f2(filtroArena.cargaTotalPSI)],
              filtroCartucho && ["Filtro de cartucho",f2(filtroCartucho.seleccion?.flujoTotal), f2(filtroCartucho.cargaTotal), f2(filtroCartucho.cargaTotalPSI)],
            ].filter(Boolean).map((fila,i)=>(
              <tr key={i} style={{background:i%2===0?"#fff":GRIS_CLR}}>
                {fila.map((c,j)=><td key={j} style={{...tdStyle,fontWeight:j===0?600:400,color:j===2?MORADO:"#1e293b"}}>{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <FooterPagina fecha={fecha} />
    </div>
  );
}

/* ═══ PÁGINA 7: EMPOTRABLES ═══ */
function PaginaEmpotrables({ memoria, logoEmpresa, fecha }) {
  const { reportes = [] } = memoria;
  const r = reportes[0];
  if (!r) return null;
  const emp = r.empotrables ?? {};
  const hayAlgo = Object.keys(emp).length > 0;
  if (!hayAlgo) return null;

  const NOMBRES = { retorno:"Retorno", desnatador:"Desnatador", barredora:"Barredora", drenFondo:"Dren de fondo", drenCanal:"Dren de canal" };

  return (
    <div className="pagina" style={{ ...A4 }}>
      <HeaderPagina logoEmpresa={logoEmpresa} numero={7} total="—" />
      <SeccionTitulo color="#0369a1" bg="#e0f2fe">Sección 5 — Empotrables hidráulicos</SeccionTitulo>

      <CajaFundamento titulo="Fundamento — Elementos hidráulicos empotrables" color="#0369a1" bg="#e0f2fe">
        Los empotrables son los accesorios hidráulicos instalados en las paredes y el fondo de la alberca que conforman los puntos de entrada y salida del agua. Su correcto dimensionamiento es crítico para garantizar una circulación uniforme del agua, evitar puntos muertos (zonas sin circulación) y cumplir con las normas de seguridad. El flujo por cada empotrable se calcula dividiendo el flujo total entre el número de unidades, verificando que la velocidad resultante en la tubería de cada disparo no exceda los límites de diseño.
        <FormulaBox
          formula="Q_unitario = Q_total / n_unidades  →  v_disparo = Q_unitario / A_tubería"
          descripcion="Flujo y velocidad por unidad empotrable"
        />
      </CajaFundamento>

      {emp.retorno && (
        <CajaFundamento titulo="Retornos — entrada de agua filtrada" color="#0369a1" bg="#e0f2fe">
          Los retornos son los inyectores que regresan el agua filtrada y tratada a la alberca. Deben distribuirse uniformemente para crear una circulación homogénea. El ángulo de inyección y la ubicación determinan el patrón de circulación. La velocidad en el orificio del retorno debe mantenerse entre 1.5–3.0 m/s para garantizar mezcla efectiva sin turbulencia excesiva.
        </CajaFundamento>
      )}

      {(emp.desnatador || emp.drenCanal) && (
        <CajaFundamento titulo="Succión superficial — desnatadores / dren de canal" color="#0369a1" bg="#e0f2fe">
          Los desnatadores (skimmers) recogen el agua de la superficie eliminando grasa, aceites, hojas y residuos flotantes antes de que se hundan y contaminen el fondo. Se dimensionan para captar entre el 60–80% del flujo de succión total. El dren de canal (rebosadero) cumple la misma función en albercas con desborde perimetral. La norma ANSI/APSP establece que ningún desnatador debe soportar más de 25 GPM para evitar riesgos de atrapamiento.
          <FormulaBox
            formula="Q_desnatador ≤ 0.8 × Q_total  (succión superficial)"
            descripcion="El resto del flujo de succión se reparte entre los drenes de fondo"
          />
        </CajaFundamento>
      )}

      {emp.drenFondo && (
        <CajaFundamento titulo="Drenes de fondo — norma de seguridad antiatrapamiento" color="#0369a1" bg="#e0f2fe">
          Los drenes de fondo (main drains) son los puntos de succión del fondo de la alberca. La norma de seguridad ANSI/APSP-7 y la Ley de Seguridad en Albercas y Spas de EUA (PSDA 2007) exigen que todo sistema de succión de fondo tenga al menos <strong>dos drenes separados</strong> conectados a la misma bomba, o una cubierta de seguridad certificada, para eliminar el riesgo de atrapamiento. El flujo máximo por dren se limita para mantener la velocidad en la cubierta por debajo de 0.5 m/s.
        </CajaFundamento>
      )}

      {emp.barredora && (
        <CajaFundamento titulo="Barredoras — limpieza automatizada del fondo" color="#0369a1" bg="#e0f2fe">
          Las barredoras (limpiafondos) son boquillas de pared que dirigen chorros de agua a baja velocidad sobre el fondo de la alberca, arrastrando la suciedad sedimentada hacia los drenes de fondo. Su flujo es informativo (no suma al CDT del sistema de filtrado principal) ya que generalmente operan desde un circuito o válvula independiente.
        </CajaFundamento>
      )}

      <div style={{ marginTop:"8px" }}>
        <div style={{ fontSize:"7.5pt", fontWeight:700, color:"#0369a1", textTransform:"uppercase", marginBottom:"5px" }}>Equipos empotrables seleccionados</div>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"7.5pt" }}>
          <thead>
            <tr>{["Equipo","Marca","Modelo","Diámetro/Tamaño","Cant.","CDT (fthd)","Rol en CDT"].map(h=><th key={h} style={{...thStyle,background:"#0369a1",fontSize:"6.5pt"}}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {Object.entries(emp).map(([key, data], i) => {
              const sel = data?.seleccion ?? {};
              const spec = sel.tamano ? `${sel.tamano}"` : sel.dimensionPuerto ? `${sel.dimensionPuerto}"` : "—";
              const rol = key === "barredora" ? "Informativo" : key === "retorno" ? "Suma CDT" : "Mayor gobierna";
              return (
                <tr key={key} style={{ background: i%2===0?"#fff":GRIS_CLR }}>
                  <td style={{ ...tdStyle, fontWeight:600 }}>{NOMBRES[key] ?? key}</td>
                  <td style={{ ...tdStyle }}>{sel.marca ?? "—"}</td>
                  <td style={{ ...tdStyle, fontFamily:"monospace", fontSize:"7pt" }}>{sel.modelo ?? "—"}</td>
                  <td style={{ ...tdStyle, textAlign:"center" }}>{spec}</td>
                  <td style={{ ...tdStyle, textAlign:"center", fontWeight:700 }}>{sel.cantidad ?? "—"}</td>
                  <td style={{ ...tdStyle, textAlign:"center", color:"#0369a1", fontWeight:600 }}>{f2(data.cargaDinamicaTotal ?? data.cargaTotal)}</td>
                  <td style={{ ...tdStyle, textAlign:"center", fontSize:"7pt", color: rol==="Informativo"?GRIS:rol==="Suma CDT"?"#16a34a":"#0369a1" }}>{rol}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <FooterPagina fecha={fecha} />
    </div>
  );
}

/* ═══ PÁGINA 8: MOTOBOMBA ═══ */
function PaginaMotobomba({ memoria, logoEmpresa, fecha }) {
  const { resumen, reportes = [] } = memoria;
  if (!resumen?.bomba || resumen.bomba === "—") return null;

  return (
    <div className="pagina" style={{ ...A4 }}>
      <HeaderPagina logoEmpresa={logoEmpresa} numero={8} total="—" />
      <SeccionTitulo color="#7c2d12" bg="#fff7ed">Sección 6 — Selección de motobomba</SeccionTitulo>

      <CajaFundamento titulo="Fundamento — Selección de motobomba centrífuga" color="#7c2d12" bg="#fff7ed">
        La motobomba centrífuga es el corazón del sistema hidráulico. Su selección se basa en el punto de operación del sistema: la intersección de la <em>curva característica de la bomba</em> (H-Q) con la <em>curva del sistema</em> (CDT vs flujo). La curva del sistema es parabólica porque las pérdidas por fricción varían con el cuadrado del flujo (ley de Hazen-Williams). El punto de operación real puede diferir del punto de diseño, razón por la cual se realiza el análisis iterativo de equilibrio hidráulico.
        <FormulaBox
          formula="CDT_sistema = K × Q^1.852  →  punto operación: H_bomba(Q) = CDT_sistema(Q)"
          descripcion="Equilibrio hidráulico — intersección curva bomba con curva sistema"
        />
      </CajaFundamento>

      <CajaFundamento titulo="Proceso iterativo de verificación" color="#7c2d12" bg="#fff7ed">
        El diseño hidráulico de albercas requiere un proceso de dos iteraciones para garantizar que el sistema opera correctamente:
        <div style={{ marginTop:"5px" }}>
          <strong>Iteración 1 (Diseño original):</strong> Se calculan las pérdidas con el flujo de diseño máximo. Se selecciona la motobomba que satisface estos requerimientos. Con esta bomba, se encuentra el punto de equilibrio real mediante interpolación en la curva H-Q.
        </div>
        <div style={{ marginTop:"3px" }}>
          <strong>Iteración 2 (Verificación):</strong> Con el flujo de operación real (punto de equilibrio), se recalculan las cargas de todos los equipos y se ajustan las cantidades si es necesario. Se verifica la convergencia: si el flujo de la iteración 2 coincide con el de la iteración 1, el sistema ha convergido.
        </div>
      </CajaFundamento>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"10px" }}>
        <div>
          <div style={{ fontSize:"7.5pt", fontWeight:700, color:"#7c2d12", textTransform:"uppercase", marginBottom:"5px" }}>Motobomba seleccionada</div>
          <TablaParametros color="#7c2d12" filas={[
            ["Marca",             resumen.bombaMarca  ?? "—",  ""],
            ["Modelo",            resumen.bombaModelo ?? "—",  ""],
            ["Potencia unitaria",  resumen.bombaPotencia ? `${resumen.bombaPotencia} HP` : "—", "HP por unidad"],
            ["Número de bombas",   String(resumen.nBombas ?? 1), "Bombas en paralelo"],
            ["Potencia total",     resumen.bombaPotencia && resumen.nBombas ? `${(parseFloat(resumen.bombaPotencia) * parseInt(resumen.nBombas)).toFixed(2)} HP` : "—", ""],
          ]} />
        </div>
        <div>
          <div style={{ fontSize:"7.5pt", fontWeight:700, color:"#7c2d12", textTransform:"uppercase", marginBottom:"5px" }}>Punto de operación</div>
          <TablaParametros color="#7c2d12" filas={[
            ["Flujo de diseño",    resumen.flujoMax    ? `${resumen.flujoMax} GPM`     : "—", "Flujo máximo requerido"],
            ["CDT de diseño",      resumen.cdtDiseno   ? `${resumen.cdtDiseno} fthd`   : "—", "CDT en diseño original"],
            ["Flujo operación",    resumen.flujoFinal  ? `${resumen.flujoFinal} GPM`   : "—", "Punto de equilibrio real"],
            ["CDT operación",      resumen.cdtFinal    ? `${resumen.cdtFinal} fthd`    : "—", `${resumen.cdtFinal ? f2(parseFloat(resumen.cdtFinal)*0.43353) : "—"} PSI`],
            ["Δ flujo vs diseño",  resumen.flujoFinal && resumen.flujoMax ? `${(((parseFloat(resumen.flujoFinal)-parseFloat(resumen.flujoMax))/parseFloat(resumen.flujoMax))*100).toFixed(1)}%` : "—", "Variación aceptable ±10%"],
          ]} />
        </div>
      </div>

      {resumen.flujoIter1 && (
        <div style={{ marginBottom:"10px" }}>
          <div style={{ fontSize:"7.5pt", fontWeight:700, color:"#7c2d12", textTransform:"uppercase", marginBottom:"5px" }}>Progresión del equilibrio hidráulico</div>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"7.5pt" }}>
            <thead>
              <tr>{["Etapa","Flujo (GPM)","CDT (fthd)","CDT (PSI)","Estado"].map(h=><th key={h} style={{...thStyle,background:"#7c2d12"}}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {[
                ["Diseño original", resumen.flujoMax,   resumen.cdtDiseno, "Cálculo inicial"],
                ["Iteración 1",     resumen.flujoIter1, resumen.cdtIter1,  "Equilibrio bomba-sistema"],
                resumen.flujoIter2 ? ["Iteración 2", resumen.flujoIter2, resumen.cdtIter2, resumen.flujoIter2 === resumen.flujoIter1 ? "✓ Convergido" : "Recálculo"] : null,
              ].filter(Boolean).map((fila, i) => (
                <tr key={i} style={{ background: i%2===0?"#fff":GRIS_CLR }}>
                  <td style={{ ...tdStyle, fontWeight:600 }}>{fila[0]}</td>
                  <td style={{ ...tdStyle, textAlign:"center", color:"#7c2d12", fontWeight:600 }}>{fila[1]} GPM</td>
                  <td style={{ ...tdStyle, textAlign:"center" }}>{fila[2]} fthd</td>
                  <td style={{ ...tdStyle, textAlign:"center" }}>{fila[2] ? f2(parseFloat(fila[2])*0.43353) : "—"} PSI</td>
                  <td style={{ ...tdStyle, textAlign:"center", color: fila[3]?.includes("✓") ? "#16a34a" : GRIS, fontWeight: fila[3]?.includes("✓") ? 700 : 400 }}>{fila[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CajaFundamento titulo="Criterios de aceptación del diseño" color="#7c2d12" bg="#fff7ed">
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"8px" }}>
          {[
            ["Variación de flujo",   "±10% del flujo de diseño",      "Garantiza que todos los equipos operan dentro de su rango nominal"],
            ["CDT disponible",       "≥ CDT requerida del sistema",   "La bomba debe superar todas las pérdidas del sistema"],
            ["Velocidades",          "Succión ≤4.5 ft/s · Descarga ≤6.5 ft/s", "Evitar cavitación y desgaste prematuro"],
          ].map(([t,v,d]) => (
            <div key={t} style={{ background:"#fff7ed", border:"1px solid #fed7aa", borderRadius:"3px", padding:"5px 8px" }}>
              <div style={{ fontWeight:700, color:"#7c2d12", fontSize:"7pt", marginBottom:"2px" }}>{t}</div>
              <div style={{ fontWeight:700, color:"#92400e", fontSize:"8pt" }}>{v}</div>
              <div style={{ fontSize:"6.5pt", color:GRIS, marginTop:"2px" }}>{d}</div>
            </div>
          ))}
        </div>
      </CajaFundamento>

      <FooterPagina fecha={fecha} />
    </div>
  );
}

/* ═══ PÁGINA 9: RESUMEN EJECUTIVO + MATERIALES ═══ */
function PaginaResumen({ memoria, logoEmpresa, fecha }) {
  const { resumen, reportes = [], calentamiento = [] } = memoria;

  const equiposOrden = [
    { key:"motobomba",           label:"Motobomba",                seccion:"Motobomba"    },
    { key:"retorno",             label:"Retornos",                 seccion:"Empotrables"  },
    { key:"desnatador",          label:"Desnatadores",             seccion:"Empotrables"  },
    { key:"barredora",           label:"Barredoras",               seccion:"Empotrables"  },
    { key:"drenFondo",           label:"Drenes de fondo",          seccion:"Empotrables"  },
    { key:"drenCanal",           label:"Drenes de canal",          seccion:"Empotrables"  },
    { key:"filtroArena",         label:"Filtro de arena",          seccion:"Filtración"   },
    { key:"prefiltro",           label:"Prefiltro",                seccion:"Filtración"   },
    { key:"filtroCartucho",      label:"Filtro de cartucho",       seccion:"Filtración"   },
    { key:"cloradorSalino",      label:"Generador cloro salino",   seccion:"Sanitización" },
    { key:"lamparaUV",           label:"Lámpara UV",               seccion:"Sanitización" },
    { key:"cloradorAutomatico",  label:"Clorador automático",      seccion:"Sanitización" },
    { key:"bombaCalor",          label:"Bomba de calor",           seccion:"Calentamiento"},
    { key:"panelSolar",          label:"Panel solar",              seccion:"Calentamiento"},
    { key:"caldera",             label:"Caldera de gas",           seccion:"Calentamiento"},
    { key:"calentadorElectrico", label:"Calentador eléctrico",     seccion:"Calentamiento"},
  ];

  const coloresSec = {
    "Motobomba":     "#7c2d12",
    "Empotrables":   "#0369a1",
    "Filtración":    MORADO,
    "Sanitización":  VERDE,
    "Calentamiento": NARANJA,
  };

  const r = reportes[0];
  const getInfo = (key) => {
    if (key === "motobomba") {
      if (!resumen?.bombaMarca) return null;
      return { marca: resumen.bombaMarca, modelo: resumen.bombaModelo, cantidad: resumen.nBombas ?? 1, spec: resumen.bombaPotencia ? `${resumen.bombaPotencia} HP` : "—" };
    }
    const cal = Array.isArray(calentamiento) ? calentamiento.find(c => c?.key === key) : null;
    if (cal) {
      const sel = cal.seleccion ?? {};
      return { marca: sel.marca ?? "—", modelo: sel.modelo ?? "—", cantidad: sel.cantidad ?? "—", spec: sel.capUnitaria ? `${Math.round(sel.capUnitaria).toLocaleString("es-MX")} BTU/h` : "—" };
    }
    const data = r ? (r.empotrables?.[key] ?? r.filtros?.[key] ?? r.sanitizacion?.[key]) : null;
    if (!data) return null;
    const sel = data.seleccion ?? {};
    return { marca: sel.marca ?? "—", modelo: sel.modelo ?? "—", cantidad: sel.cantidad ?? "—", spec: "—" };
  };

  const filas = equiposOrden.map(e => ({ ...e, info: getInfo(e.key) })).filter(e => e.info);

  // Materiales
  const rMat = reportes[2] ?? reportes[reportes.length-1];
  const globalAcum = {};
  if (rMat) {
    const sumar = (obj) => {
      if (!obj) return;
      const entries = Array.isArray(obj) ? obj.map(row=>[row.tuberia,row]) : Object.entries(obj);
      for (const [diam,vals] of entries) {
        if (!globalAcum[diam]) globalAcum[diam] = { tuberia_m:0, tees:0, codos:0, reducciones:0 };
        globalAcum[diam].tuberia_m   += parseFloat(vals.tuberia_m   ?? 0);
        globalAcum[diam].tees        += parseInt(vals.tees           ?? 0);
        globalAcum[diam].codos       += parseInt(vals.codos          ?? 0);
        globalAcum[diam].reducciones += parseInt(vals.reducciones    ?? 0);
      }
    };
    const allData = { ...rMat.empotrables, ...rMat.filtros, ...rMat.sanitizacion };
    if (rMat.calentamiento) rMat.calentamiento.forEach(c => { sumar(c.resumenMateriales); });
    Object.values(allData).forEach(d => { sumar(d?.resumenTramos); sumar(d?.resumenDisparos); sumar(d?.resumenMateriales); });
  }

  return (
    <div className="pagina" style={{ ...A4 }}>
      <HeaderPagina logoEmpresa={logoEmpresa} numero={9} total="—" />
      <SeccionTitulo color={AZUL} bg={AZUL_CLR}>Resumen ejecutivo — Equipos del sistema</SeccionTitulo>

      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"7pt", marginBottom:"14px" }}>
        <thead>
          <tr>
            <th style={{ ...thStyle, width:"24px", textAlign:"center" }}>#</th>
            <th style={thStyle}>Sección</th>
            <th style={thStyle}>Equipo</th>
            <th style={thStyle}>Marca</th>
            <th style={thStyle}>Modelo</th>
            <th style={thStyle}>Especificación</th>
            <th style={{ ...thStyle, textAlign:"center", width:"40px" }}>Cant.</th>
          </tr>
        </thead>
        <tbody>
          {filas.map(({ key, label, seccion, info }, i) => (
            <tr key={key} style={{ background: i%2===0 ? "#fff" : GRIS_CLR }}>
              <td style={{ ...tdStyle, textAlign:"center", color:GRIS, fontWeight:600, fontSize:"7pt" }}>{i+1}</td>
              <td style={{ ...tdStyle }}>
                <span style={{ background: coloresSec[seccion]??AZUL, color:"#fff", borderRadius:"3px", padding:"1px 5px", fontSize:"6.5pt", fontWeight:700 }}>{seccion}</span>
              </td>
              <td style={{ ...tdStyle, fontWeight:600, color:AZUL, fontSize:"7pt" }}>{label}</td>
              <td style={{ ...tdStyle, color:GRIS, fontSize:"7pt" }}>{info.marca}</td>
              <td style={{ ...tdStyle, fontFamily:"monospace", fontSize:"7pt" }}>{info.modelo}</td>
              <td style={{ ...tdStyle, color:AZUL_MED, fontWeight:600, fontSize:"7pt" }}>{info.spec}</td>
              <td style={{ ...tdStyle, textAlign:"center", fontWeight:700, fontSize:"7pt" }}>{info.cantidad}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <SeccionTitulo color={AZUL} bg={AZUL_CLR}>Explosión de materiales — Punto de operación final</SeccionTitulo>
      {Object.keys(globalAcum).length > 0 ? (
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"7.5pt" }}>
          <thead>
            <tr>
              {["Diámetro (in)","Tubería (m)","Tees (pza.)","Codos (pza.)","Reducciones (pza.)"].map(h=>(
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(globalAcum)
              .sort((a,b)=>parseFloat(a[0].replace("tuberia ",""))-parseFloat(b[0].replace("tuberia ","")))
              .map(([diam,vals],i)=>(
              <tr key={diam} style={{background:i%2===0?"#fff":GRIS_CLR}}>
                <td style={{...tdStyle,fontWeight:700,color:AZUL}}>{diam.replace("tuberia ","")+'"'}</td>
                <td style={{...tdStyle,textAlign:"center"}}>{f2(vals.tuberia_m)} m</td>
                <td style={{...tdStyle,textAlign:"center"}}>{vals.tees||"—"}</td>
                <td style={{...tdStyle,textAlign:"center"}}>{vals.codos||"—"}</td>
                <td style={{...tdStyle,textAlign:"center"}}>{vals.reducciones||"—"}</td>
              </tr>
            ))}
            <tr style={{background:AZUL_CLR}}>
              <td style={{...tdStyle,fontWeight:800,color:AZUL}}>TOTAL</td>
              <td style={{...tdStyle,textAlign:"center",fontWeight:800,color:AZUL}}>{f2(Object.values(globalAcum).reduce((a,v)=>a+v.tuberia_m,0))} m</td>
              <td style={{...tdStyle,textAlign:"center",fontWeight:800,color:AZUL}}>{Object.values(globalAcum).reduce((a,v)=>a+v.tees,0)||"—"}</td>
              <td style={{...tdStyle,textAlign:"center",fontWeight:800,color:AZUL}}>{Object.values(globalAcum).reduce((a,v)=>a+v.codos,0)||"—"}</td>
              <td style={{...tdStyle,textAlign:"center",fontWeight:800,color:AZUL}}>{Object.values(globalAcum).reduce((a,v)=>a+v.reducciones,0)||"—"}</td>
            </tr>
          </tbody>
        </table>
      ) : (
        <div style={{fontSize:"7.5pt",color:GRIS,padding:"8px"}}>Sin datos de materiales disponibles.</div>
      )}

      <FooterPagina fecha={fecha} />
    </div>
  );
}

/* ═══ COMPONENTE PRINCIPAL ═══ */
export default function MemoriaPDF() {
  const [memoria, setMemoria]     = useState(null);
  const [error, setError]         = useState(null);
  const [logoEmpresa, setLogoEmpresa] = useState(null);
  const inputRef = useRef(null);

  const fecha = new Date().toLocaleDateString("es-MX", { year:"numeric", month:"long", day:"numeric" });

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("memoriaCalculo");
      if (!raw) throw new Error("No se encontraron datos.");
      setMemoria(JSON.parse(raw));
    } catch(e) { setError(e.message); }
  }, []);

  const handleLogo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogoEmpresa(ev.target.result);
    reader.readAsDataURL(file);
  };

  if (error)   return <div style={{padding:"2rem",color:"red"}}>⚠️ {error}</div>;
  if (!memoria) return <div style={{padding:"2rem",color:"#94a3b8"}}>Cargando…</div>;

  const hayCalentamiento = memoria.calentamiento?.length > 0 || !!memoria.perfilTermico;
  const haySanitizacion  = !!memoria.reportes?.[0]?.sanitizacion && Object.keys(memoria.reportes[0].sanitizacion).length > 0;
  const hayFiltracion    = !!memoria.reportes?.[0]?.filtros     && Object.keys(memoria.reportes[0].filtros).length     > 0;
  const hayEmpotrables   = !!memoria.reportes?.[0]?.empotrables && Object.keys(memoria.reportes[0].empotrables).length > 0;
  const hayMotobomba     = !!memoria.resumen?.bombaMarca;

  return (
    <>
      <style>{printStyles}</style>

      {/* Barra de control */}
      <div className="no-print" style={{ background:"#1e293b", borderBottom:"1px solid #334155", padding:"10px 20px", display:"flex", alignItems:"center", gap:"12px", position:"sticky", top:0, zIndex:100 }}>
        <span style={{ color:"#60a5fa", fontWeight:700, fontSize:"0.85rem" }}>Reporte PDF — PoolMetric</span>
        <div style={{ flex:1 }} />
        <button onClick={()=>inputRef.current?.click()} style={{ padding:"5px 12px", background:"#334155", border:"1px solid #475569", borderRadius:"5px", color:"#e2e8f0", fontSize:"0.75rem", cursor:"pointer" }}>
          {logoEmpresa ? "✓ Logo cargado" : "Cargar logo empresa"}
        </button>
        <input ref={inputRef} type="file" accept="image/*" onChange={handleLogo} style={{ display:"none" }} />
        {logoEmpresa && (
          <button onClick={()=>setLogoEmpresa(null)} style={{ padding:"5px 10px", background:"transparent", border:"1px solid #475569", borderRadius:"5px", color:"#94a3b8", fontSize:"0.75rem", cursor:"pointer" }}>
            Quitar logo
          </button>
        )}
        <button onClick={()=>window.print()} style={{ padding:"6px 18px", background:"#1d4ed8", border:"none", borderRadius:"5px", color:"#fff", fontSize:"0.8rem", fontWeight:700, cursor:"pointer" }}>
          🖨 Imprimir / Guardar PDF
        </button>
      </div>

      {/* Páginas */}
      <div style={{ padding:"20px 0", background:"#374151", minHeight:"100vh" }}>
        <Portada             memoria={memoria} logoEmpresa={logoEmpresa} fecha={fecha} />
        <PaginaMetodologia   memoria={memoria} logoEmpresa={logoEmpresa} fecha={fecha} />
        <PaginaFiltrado      memoria={memoria} logoEmpresa={logoEmpresa} fecha={fecha} />
        {hayCalentamiento && <PaginaCalentamiento memoria={memoria} logoEmpresa={logoEmpresa} fecha={fecha} />}
        {haySanitizacion  && <PaginaSanitizacion  memoria={memoria} logoEmpresa={logoEmpresa} fecha={fecha} />}
        {hayFiltracion    && <PaginaFiltracion     memoria={memoria} logoEmpresa={logoEmpresa} fecha={fecha} />}
        {hayEmpotrables   && <PaginaEmpotrables    memoria={memoria} logoEmpresa={logoEmpresa} fecha={fecha} />}
        {hayMotobomba     && <PaginaMotobomba      memoria={memoria} logoEmpresa={logoEmpresa} fecha={fecha} />}
        <PaginaResumen       memoria={memoria} logoEmpresa={logoEmpresa} fecha={fecha} />
      </div>
    </>
  );
}