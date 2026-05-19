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
  padding: "18mm 20mm 18mm 20mm",
  boxShadow: "0 4px 32px rgba(0,0,0,0.35)",
  boxSizing: "border-box",
  position: "relative",
  fontFamily: "'Segoe UI', system-ui, sans-serif",
  color: "#1e293b",
  fontSize: "9pt",
};

const AZUL     = "#1e3a8a";
const AZUL_MED = "#2563eb";
const AZUL_CLR = "#dbeafe";
const GRIS     = "#64748b";
const GRIS_CLR = "#f8fafc";
const BORDE    = "#e2e8f0";

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

const SeccionTitulo = ({ children, color = AZUL }) => (
  <div style={{ borderLeft: `4px solid ${color}`, paddingLeft: "10px", marginBottom: "10px", marginTop: "16px" }}>
    <span style={{ fontSize: "10pt", fontWeight: 800, color, textTransform: "uppercase", letterSpacing: "0.05em" }}>
      {children}
    </span>
  </div>
);

const f2 = (v) => { const n = parseFloat(v); return isNaN(n) ? "—" : n.toFixed(2); };
const fmtBTU = (v) => Math.round(parseFloat(v) || 0).toLocaleString("es-MX");

/* ═══ HEADER DE PÁGINA ═══ */
function HeaderPagina({ logoEmpresa, numero, total }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:`2px solid ${AZUL}`, paddingBottom:"8px", marginBottom:"16px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
        {/* Logo PoolMetric */}
        <div style={{ background:AZUL, borderRadius:"6px", padding:"4px 10px" }}>
          <span style={{ color:"#fff", fontWeight:800, fontSize:"9pt", letterSpacing:"0.05em" }}>POOL<span style={{ color:"#60a5fa" }}>METRIC</span></span>
        </div>
        <span style={{ fontSize:"7pt", color:GRIS, fontWeight:600 }}>HYDRAULIC DESIGN</span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
        {logoEmpresa && <img src={logoEmpresa} alt="Logo empresa" style={{ maxHeight:"32px", maxWidth:"80px", objectFit:"contain" }} />}
        <span style={{ fontSize:"7pt", color:GRIS }}>Página {numero} / {total}</span>
      </div>
    </div>
  );
}

/* ═══ FOOTER DE PÁGINA ═══ */
function FooterPagina({ fecha }) {
  return (
    <div style={{ position:"absolute", bottom:"12mm", left:"20mm", right:"20mm", borderTop:`1px solid ${BORDE}`, paddingTop:"6px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
      <span style={{ fontSize:"7pt", color:GRIS }}>Memoria de cálculo hidráulico — PoolMetric</span>
      <span style={{ fontSize:"7pt", color:GRIS }}>{fecha}</span>
    </div>
  );
}

/* ═══ PÁGINA 1: PORTADA ═══ */
function Portada({ memoria, logoEmpresa, fecha }) {
  const { resumen } = memoria;
  return (
    <div className="pagina" style={{ ...A4, display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
      {/* Top bar */}
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

      {/* Centro — título */}
      <div style={{ textAlign:"center", padding:"20mm 0" }}>
        <div style={{ fontSize:"7pt", color:GRIS, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:"12px" }}>
          Documento técnico
        </div>
        <div style={{ fontSize:"26pt", fontWeight:900, color:AZUL, lineHeight:1.1, marginBottom:"8px" }}>
          Memoria de Cálculo
        </div>
        <div style={{ fontSize:"16pt", fontWeight:700, color:AZUL_MED, marginBottom:"24px" }}>
          Hidráulico de Alberca
        </div>
        <div style={{ width:"60px", height:"3px", background:AZUL_MED, margin:"0 auto 24px" }} />
        <div style={{ fontSize:"9pt", color:GRIS }}>
          Diseño y selección de equipos hidráulicos
        </div>
      </div>

      {/* Datos del sistema */}
      <div>
        <div style={{ background:AZUL_CLR, borderRadius:"8px", padding:"14px 18px", marginBottom:"16px" }}>
          <div style={{ fontSize:"7.5pt", fontWeight:700, color:AZUL, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"10px" }}>
            Datos del sistema
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px" }}>
            {[
              { label:"Área de alberca", val: resumen.area ? `${resumen.area} m²` : "—" },
              { label:"Volumen", val: resumen.vol ? `${resumen.vol} m³` : "—" },
              { label:"Flujo máximo", val: `${resumen.flujoMax} GPM` },
              { label:"Flujo de operación", val: resumen.flujoFinal ? `${resumen.flujoFinal} GPM` : "—" },
              { label:"CDT operación", val: resumen.cdtFinal ? `${resumen.cdtFinal} fthd` : "—" },
              { label:"CDT en PSI", val: resumen.cdtFinal ? `${f2(parseFloat(resumen.cdtFinal)*0.43353)} PSI` : "—" },
            ].map(({ label, val }) => (
              <div key={label}>
                <div style={{ fontSize:"7pt", color:GRIS, fontWeight:600 }}>{label}</div>
                <div style={{ fontSize:"10pt", fontWeight:800, color:AZUL }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Motobomba destacada */}
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

/* ═══ PÁGINA 2: RESUMEN EJECUTIVO ═══ */
function ResumenEjecutivo({ memoria, logoEmpresa, fecha }) {
  const { resumen, reportes = [], calentamiento = [] } = memoria;

  const equiposOrden = [
    { key:"motobomba",           label:"Motobomba",                  seccion:"Motobomba" },
    { key:"retorno",             label:"Retornos",                   seccion:"Empotrables" },
    { key:"desnatador",          label:"Desnatadores",               seccion:"Empotrables" },
    { key:"barredora",           label:"Barredoras",                 seccion:"Empotrables" },
    { key:"drenFondo",           label:"Drenes de fondo",            seccion:"Empotrables" },
    { key:"drenCanal",           label:"Drenes de canal",            seccion:"Empotrables" },
    { key:"filtroArena",         label:"Filtro de arena",            seccion:"Filtración" },
    { key:"prefiltro",           label:"Prefiltro",                  seccion:"Filtración" },
    { key:"filtroCartucho",      label:"Filtro de cartucho",         seccion:"Filtración" },
    { key:"cloradorSalino",      label:"Generador cloro salino",     seccion:"Sanitización" },
    { key:"lamparaUV",           label:"Lámpara UV",                 seccion:"Sanitización" },
    { key:"cloradorAutomatico",  label:"Clorador automático",        seccion:"Sanitización" },
    { key:"bombaCalor",          label:"Bomba de calor",             seccion:"Calentamiento" },
    { key:"panelSolar",          label:"Panel solar",                seccion:"Calentamiento" },
    { key:"caldera",             label:"Caldera de gas",             seccion:"Calentamiento" },
    { key:"calentadorElectrico", label:"Calentador eléctrico",       seccion:"Calentamiento" },
  ];

  const coloresSec = {
    "Motobomba":     "#1d4ed8",
    "Empotrables":   "#3b82f6",
    "Filtración":    "#7c3aed",
    "Sanitización":  "#059669",
    "Calentamiento": "#d97706",
  };

  const getEquipoData = (key) => {
    const r = reportes[0];
    if (!r) return null;
    if (key === "motobomba") {
      if (!resumen?.bomba || resumen.bomba === "—") return null;
      return { marca: resumen.bombaMarca ?? "—", modelo: resumen.bombaModelo ?? "—", cantidad: resumen.nBombas ?? 1, spec: resumen.bombaPotencia ? `${resumen.bombaPotencia} HP` : "—" };
    }
    const cal = r.calentamiento?.find(c => c.key === key);
    const data = r.empotrables?.[key] ?? r.filtros?.[key] ?? r.sanitizacion?.[key] ?? cal ?? null;
    if (!data) {
      const calItem = Array.isArray(calentamiento) ? calentamiento.find(c => c?.key === key) : null;
      if (!calItem) return null;
      const sel = calItem.seleccion ?? {};
      return { marca: sel.marca ?? "—", modelo: sel.modelo ?? "—", cantidad: sel.cantidad ?? "—", spec: sel.capUnitaria ? `${Math.round(sel.capUnitaria).toLocaleString("es-MX")} BTU/h` : "—" };
    }
    const sel = data.seleccion ?? {};
    return { marca: sel.marca ?? "—", modelo: sel.modelo ?? "—", cantidad: sel.cantidad ?? "—", spec: "—" };
  };

  const filas = equiposOrden.map(e => ({ ...e, info: getEquipoData(e.key) })).filter(e => e.info);

  return (
    <div className="pagina" style={{ ...A4 }}>
      <HeaderPagina logoEmpresa={logoEmpresa} numero={2} total="—" />

      <SeccionTitulo>Resumen ejecutivo — Equipos del sistema</SeccionTitulo>

      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"8pt", marginBottom:"16px" }}>
        <thead>
          <tr>
            <th style={thStyle}>#</th>
            <th style={thStyle}>Sección</th>
            <th style={thStyle}>Equipo</th>
            <th style={thStyle}>Marca</th>
            <th style={thStyle}>Modelo</th>
            <th style={thStyle}>Especificación</th>
            <th style={{ ...thStyle, textAlign:"center" }}>Cant.</th>
          </tr>
        </thead>
        <tbody>
          {filas.map(({ key, label, seccion, info }, i) => (
            <tr key={key} style={{ background: i%2===0 ? "#fff" : GRIS_CLR }}>
              <td style={{ ...tdStyle, color:GRIS, fontWeight:600, width:"24px", textAlign:"center" }}>{i+1}</td>
              <td style={{ ...tdStyle, width:"90px" }}>
                <span style={{ background: coloresSec[seccion] ?? AZUL, color:"#fff", borderRadius:"3px", padding:"1px 6px", fontSize:"6.5pt", fontWeight:700 }}>
                  {seccion}
                </span>
              </td>
              <td style={{ ...tdStyle, fontWeight:600, color:AZUL }}>{label}</td>
              <td style={{ ...tdStyle, color:GRIS }}>{info.marca}</td>
              <td style={{ ...tdStyle, fontFamily:"monospace", fontSize:"7.5pt" }}>{info.modelo}</td>
              <td style={{ ...tdStyle, color:AZUL_MED, fontWeight:600 }}>{info.spec}</td>
              <td style={{ ...tdStyle, textAlign:"center", fontWeight:700 }}>{info.cantidad}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Punto de operación */}
      <SeccionTitulo color={AZUL_MED}>Punto de operación del sistema</SeccionTitulo>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:"10px", marginBottom:"16px" }}>
        {[
          { label:"Flujo diseño",     val: `${resumen.flujoMax} GPM`,         color: GRIS },
          { label:"Flujo operación",  val: resumen.flujoFinal ? `${resumen.flujoFinal} GPM` : "—", color: AZUL_MED },
          { label:"CDT operación",    val: resumen.cdtFinal ? `${resumen.cdtFinal} fthd` : "—",    color: AZUL },
          { label:"CDT en PSI",       val: resumen.cdtFinal ? `${f2(parseFloat(resumen.cdtFinal)*0.43353)} PSI` : "—", color: AZUL },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ border:`1px solid ${BORDE}`, borderRadius:"6px", padding:"10px 12px", background:GRIS_CLR }}>
            <div style={{ fontSize:"6.5pt", color:GRIS, fontWeight:700, textTransform:"uppercase", marginBottom:"4px" }}>{label}</div>
            <div style={{ fontSize:"13pt", fontWeight:800, color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Progresión */}
      {resumen.flujoIter1 && (
        <>
          <SeccionTitulo color="#475569">Progresión del equilibrio hidráulico</SeccionTitulo>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"8pt" }}>
            <thead>
              <tr>
                <th style={thStyle}>Iteración</th>
                <th style={{ ...thStyle, textAlign:"center" }}>Flujo (GPM)</th>
                <th style={{ ...thStyle, textAlign:"center" }}>CDT (fthd)</th>
                <th style={{ ...thStyle, textAlign:"center" }}>CDT (PSI)</th>
                <th style={{ ...thStyle, textAlign:"center" }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label:"Diseño original", flujo: resumen.flujoMax,   cdt: resumen.cdtDiseno, estado:"Diseño inicial" },
                { label:"Iteración 1",     flujo: resumen.flujoIter1, cdt: resumen.cdtIter1,  estado:"Recálculo" },
                resumen.flujoIter2 ? { label:"Iteración 2", flujo: resumen.flujoIter2, cdt: resumen.cdtIter2, estado: resumen.flujoIter2 === resumen.flujoIter1 ? "✓ Convergió" : "Recálculo" } : null,
              ].filter(Boolean).map((row, i) => (
                <tr key={i} style={{ background: i%2===0?"#fff":GRIS_CLR }}>
                  <td style={{ ...tdStyle, fontWeight:600 }}>{row.label}</td>
                  <td style={{ ...tdStyle, textAlign:"center" }}>{row.flujo} GPM</td>
                  <td style={{ ...tdStyle, textAlign:"center" }}>{row.cdt} fthd</td>
                  <td style={{ ...tdStyle, textAlign:"center" }}>{f2(parseFloat(row.cdt)*0.43353)} PSI</td>
                  <td style={{ ...tdStyle, textAlign:"center", color: row.estado.includes("✓") ? "#16a34a" : GRIS, fontWeight: row.estado.includes("✓") ? 700 : 400 }}>{row.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <FooterPagina fecha={fecha} />
    </div>
  );
}

/* ═══ PÁGINA 3+: CARGAS POR EQUIPO ═══ */
function PaginaCargas({ memoria, logoEmpresa, fecha }) {
  const { resumen, reportes = [], calentamiento = [] } = memoria;

  const getEquipoData = (reporte, key) => {
    if (!reporte) return null;
    const cal = reporte.calentamiento?.find(c => c.key === key);
    return reporte.empotrables?.[key] ?? reporte.filtros?.[key] ?? reporte.sanitizacion?.[key] ?? cal ?? null;
  };

  const getCDT = (reporte, key) => {
    if (["bombaCalor","panelSolar","caldera","calentadorElectrico"].includes(key)) {
      const item = Array.isArray(calentamiento) ? calentamiento.find(c => c?.key === key) : null;
      return item?.cargaTotal != null ? parseFloat(item.cargaTotal) : null;
    }
    const d = getEquipoData(reporte, key);
    if (!d) return null;
    return d.cargaDinamicaTotal ?? d.cargaTotal ?? null;
  };

  const equiposOrden = ["bombaCalor","panelSolar","caldera","calentadorElectrico","cloradorSalino","cloradorAutomatico","lamparaUV","prefiltro","filtroArena","filtroCartucho","retorno","desnatador","drenCanal","drenFondo","barredora"];
  const nombres = { bombaCalor:"Bomba de calor", panelSolar:"Panel solar", caldera:"Caldera de gas", calentadorElectrico:"Calentador eléctrico", cloradorSalino:"Gen. cloro salino", cloradorAutomatico:"Clorador automático", lamparaUV:"Lámpara UV", filtroArena:"Filtro de arena", prefiltro:"Prefiltro", filtroCartucho:"Filtro de cartucho", retorno:"Retorno", desnatador:"Desnatador", drenCanal:"Dren de canal", drenFondo:"Dren de fondo", barredora:"Barredora" };

  const equiposPresentes = equiposOrden.filter(k => reportes.some(r => getCDT(r, k) != null) || (["bombaCalor","panelSolar","caldera","calentadorElectrico"].includes(k) && Array.isArray(calentamiento) && calentamiento.some(c => c?.key === k)));

  const ITER_LABELS = ["Diseño original", "Iteración 1", "Iteración 2"];

  return (
    <div className="pagina" style={{ ...A4 }}>
      <HeaderPagina logoEmpresa={logoEmpresa} numero={3} total="—" />
      <SeccionTitulo>Relación de cargas dinámicas por equipo</SeccionTitulo>

      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"7.5pt", marginBottom:"16px" }}>
        <thead>
          <tr>
            <th style={thStyle}>Equipo</th>
            {reportes.filter(Boolean).map((_, i) => (
              <th key={i} style={{ ...thStyle, textAlign:"center" }}>{ITER_LABELS[i]}<br/><span style={{ fontWeight:400, fontSize:"6.5pt" }}>{f2(reportes[i]?.flujo)} GPM</span></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {equiposPresentes.map((key, ri) => (
            <tr key={key} style={{ background: ri%2===0?"#fff":GRIS_CLR }}>
              <td style={{ ...tdStyle, fontWeight:600 }}>{nombres[key]}</td>
              {reportes.filter(Boolean).map((r, i) => {
                const v = getCDT(r, key);
                return (
                  <td key={i} style={{ ...tdStyle, textAlign:"center", color: v==null ? "#ccc" : AZUL_MED, fontWeight: v!=null ? 600 : 400 }}>
                    {v != null ? `${f2(v)} fthd` : "—"}
                  </td>
                );
              })}
            </tr>
          ))}
          <tr style={{ background: AZUL_CLR }}>
            <td style={{ ...tdStyle, fontWeight:800, color:AZUL }}>CDT TOTAL SISTEMA</td>
            {[resumen.cdtDiseno, resumen.cdtIter1, resumen.cdtIter2].slice(0, reportes.filter(Boolean).length).map((cdt, i) => (
              <td key={i} style={{ ...tdStyle, textAlign:"center", fontWeight:800, color:AZUL }}>
                {cdt} fthd<br/>
                <span style={{ fontSize:"7pt", fontWeight:400, color:GRIS }}>{f2(parseFloat(cdt)*0.43353)} PSI</span>
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <SeccionTitulo color="#475569">Justificación del método iterativo</SeccionTitulo>
      <div style={{ background:GRIS_CLR, border:`1px solid ${BORDE}`, borderRadius:"6px", padding:"10px 14px", fontSize:"8pt", color:"#334155", lineHeight:1.6 }}>
        <p style={{ margin:"0 0 6px" }}>El cálculo hidráulico se realiza mediante un proceso iterativo de tres etapas:</p>
        <p style={{ margin:"0 0 4px" }}><strong>1. Diseño original:</strong> Se calculan las pérdidas de carga con el flujo de diseño máximo requerido por el sistema ({resumen.flujoMax} GPM). Se selecciona la motobomba que satisface estos requerimientos.</p>
        <p style={{ margin:"0 0 4px" }}><strong>2. Iteración 1:</strong> Con la motobomba seleccionada, se encuentra el punto de equilibrio real entre la curva de la bomba y la curva del sistema. El flujo resultante puede diferir del flujo de diseño, lo que obliga a recalcular las cargas de todos los equipos.</p>
        <p style={{ margin:"0" }}><strong>2. Iteración 2:</strong> Se verifica la convergencia. Si el flujo de la iteración 2 coincide con el de la iteración 1, el sistema ha convergido y el punto de operación es válido.</p>
      </div>

      <FooterPagina fecha={fecha} />
    </div>
  );
}

/* ═══ PÁGINA 4+: EXPLOSIÓN DE MATERIALES ═══ */
function PaginaMateriales({ memoria, logoEmpresa, fecha }) {
  const { reportes = [] } = memoria;
  const r = reportes[2] ?? reportes[reportes.length - 1];

  const getEquipoData = (key) => {
    if (!r) return null;
    const cal = r.calentamiento?.find(c => c.key === key);
    return r.empotrables?.[key] ?? r.filtros?.[key] ?? r.sanitizacion?.[key] ?? cal ?? null;
  };

  const definicion = ["retorno","desnatador","barredora","drenFondo","drenCanal","filtroArena","prefiltro","filtroCartucho","cloradorSalino","lamparaUV","bombaCalor","panelSolar","caldera","calentadorElectrico"];
  const nombres = { retorno:"Retornos", desnatador:"Desnatadores", barredora:"Barredoras", drenFondo:"Drenes de fondo", drenCanal:"Drenes de canal", filtroArena:"Filtro de arena", prefiltro:"Prefiltro", filtroCartucho:"Filtro de cartucho", cloradorSalino:"Cloro salino", lamparaUV:"Lámpara UV", bombaCalor:"Bomba de calor", panelSolar:"Panel solar", caldera:"Caldera de gas", calentadorElectrico:"Calent. eléctrico" };

  const globalAcum = {};
  const porEquipo = [];

  definicion.forEach(key => {
    const data = getEquipoData(key);
    if (!data) return;
    const acum = {};
    const sumar = (obj) => {
      if (!obj) return;
      const entries = Array.isArray(obj) ? obj.map(row => [row.tuberia, row]) : Object.entries(obj);
      for (const [diam, vals] of entries) {
        if (!acum[diam]) acum[diam] = { tuberia_m:0, tees:0, codos:0, reducciones:0 };
        acum[diam].tuberia_m   += parseFloat(vals.tuberia_m ?? 0);
        acum[diam].tees        += parseInt(vals.tees ?? 0);
        acum[diam].codos       += parseInt(vals.codos ?? 0);
        acum[diam].reducciones += parseInt(vals.reducciones ?? 0);
        if (!globalAcum[diam]) globalAcum[diam] = { tuberia_m:0, tees:0, codos:0, reducciones:0 };
        globalAcum[diam].tuberia_m   += parseFloat(vals.tuberia_m ?? 0);
        globalAcum[diam].tees        += parseInt(vals.tees ?? 0);
        globalAcum[diam].codos       += parseInt(vals.codos ?? 0);
        globalAcum[diam].reducciones += parseInt(vals.reducciones ?? 0);
      }
    };
    sumar(data.resumenTramos);
    sumar(data.resumenDisparos);
    sumar(data.resumenMateriales);
    if (Object.keys(acum).length) porEquipo.push({ key, label: nombres[key] ?? key, mat: acum });
  });

  const diams = Object.keys(globalAcum).sort((a,b) => parseFloat(a.replace("tuberia ","")) - parseFloat(b.replace("tuberia ","")));

  return (
    <div className="pagina" style={{ ...A4 }}>
      <HeaderPagina logoEmpresa={logoEmpresa} numero={4} total="—" />
      <SeccionTitulo>Explosión de materiales — Punto de operación final</SeccionTitulo>

      {/* Resumen global */}
      <div style={{ fontSize:"7.5pt", fontWeight:700, color:GRIS, textTransform:"uppercase", marginBottom:"6px" }}>Resumen global por diámetro</div>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"8pt", marginBottom:"16px" }}>
        <thead>
          <tr>
            <th style={thStyle}>Diámetro (in)</th>
            <th style={{ ...thStyle, textAlign:"center" }}>Tubería (m)</th>
            <th style={{ ...thStyle, textAlign:"center" }}>Tees (pza.)</th>
            <th style={{ ...thStyle, textAlign:"center" }}>Codos (pza.)</th>
            <th style={{ ...thStyle, textAlign:"center" }}>Reducciones (pza.)</th>
          </tr>
        </thead>
        <tbody>
          {diams.map((diam, i) => {
            const v = globalAcum[diam];
            return (
              <tr key={diam} style={{ background: i%2===0?"#fff":GRIS_CLR }}>
                <td style={{ ...tdStyle, fontWeight:700, color:AZUL }}>{diam.replace("tuberia ","")+'"'}</td>
                <td style={{ ...tdStyle, textAlign:"center" }}>{f2(v.tuberia_m)} m</td>
                <td style={{ ...tdStyle, textAlign:"center" }}>{v.tees || "—"}</td>
                <td style={{ ...tdStyle, textAlign:"center" }}>{v.codos || "—"}</td>
                <td style={{ ...tdStyle, textAlign:"center" }}>{v.reducciones || "—"}</td>
              </tr>
            );
          })}
          <tr style={{ background:AZUL_CLR }}>
            <td style={{ ...tdStyle, fontWeight:800, color:AZUL }}>TOTAL</td>
            <td style={{ ...tdStyle, textAlign:"center", fontWeight:800, color:AZUL }}>{f2(Object.values(globalAcum).reduce((a,v)=>a+v.tuberia_m,0))} m</td>
            <td style={{ ...tdStyle, textAlign:"center", fontWeight:800, color:AZUL }}>{Object.values(globalAcum).reduce((a,v)=>a+v.tees,0) || "—"}</td>
            <td style={{ ...tdStyle, textAlign:"center", fontWeight:800, color:AZUL }}>{Object.values(globalAcum).reduce((a,v)=>a+v.codos,0) || "—"}</td>
            <td style={{ ...tdStyle, textAlign:"center", fontWeight:800, color:AZUL }}>{Object.values(globalAcum).reduce((a,v)=>a+v.reducciones,0) || "—"}</td>
          </tr>
        </tbody>
      </table>

      {/* Desglose por equipo */}
      <div style={{ fontSize:"7.5pt", fontWeight:700, color:GRIS, textTransform:"uppercase", marginBottom:"6px" }}>Desglose por subsistema</div>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"7.5pt" }}>
        <thead>
          <tr>
            <th style={thStyle}>Subsistema</th>
            <th style={thStyle}>Diámetro</th>
            <th style={{ ...thStyle, textAlign:"center" }}>Tubería (m)</th>
            <th style={{ ...thStyle, textAlign:"center" }}>Tees</th>
            <th style={{ ...thStyle, textAlign:"center" }}>Codos</th>
            <th style={{ ...thStyle, textAlign:"center" }}>Red.</th>
          </tr>
        </thead>
        <tbody>
          {porEquipo.flatMap((eq, ei) =>
            Object.entries(eq.mat)
              .sort((a,b) => parseFloat(a[0].replace("tuberia ","")) - parseFloat(b[0].replace("tuberia ","")))
              .map(([diam, v], di) => (
                <tr key={`${eq.key}-${diam}`} style={{ background: ei%2===0?"#fff":GRIS_CLR }}>
                  <td style={{ ...tdStyle, fontWeight: di===0 ? 700 : 400, color: di===0 ? AZUL : "transparent" }}>{di===0 ? eq.label : ""}</td>
                  <td style={{ ...tdStyle, fontWeight:600 }}>{diam.replace("tuberia ","")+'"'}</td>
                  <td style={{ ...tdStyle, textAlign:"center" }}>{f2(v.tuberia_m)} m</td>
                  <td style={{ ...tdStyle, textAlign:"center" }}>{v.tees || "—"}</td>
                  <td style={{ ...tdStyle, textAlign:"center" }}>{v.codos || "—"}</td>
                  <td style={{ ...tdStyle, textAlign:"center" }}>{v.reducciones || "—"}</td>
                </tr>
              ))
          )}
        </tbody>
      </table>

      <FooterPagina fecha={fecha} />
    </div>
  );
}

/* ═══ COMPONENTE PRINCIPAL ═══ */
export default function MemoriaPDF() {
  const [memoria, setMemoria] = useState(null);
  const [error, setError]     = useState(null);
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

  if (error) return <div style={{ padding:"2rem", color:"red" }}>⚠️ {error}</div>;
  if (!memoria) return <div style={{ padding:"2rem", color:"#94a3b8" }}>Cargando…</div>;

  return (
    <>
      <style>{printStyles}</style>

      {/* Barra de control — no se imprime */}
      <div className="no-print" style={{ background:"#1e293b", borderBottom:"1px solid #334155", padding:"10px 20px", display:"flex", alignItems:"center", gap:"12px", position:"sticky", top:0, zIndex:100 }}>
        <span style={{ color:"#60a5fa", fontWeight:700, fontSize:"0.85rem" }}>Reporte PDF — PoolMetric</span>
        <div style={{ flex:1 }} />
        <button onClick={() => inputRef.current?.click()} style={{ padding:"5px 12px", background:"#334155", border:"1px solid #475569", borderRadius:"5px", color:"#e2e8f0", fontSize:"0.75rem", cursor:"pointer" }}>
          {logoEmpresa ? "✓ Logo cargado" : "Cargar logo empresa"}
        </button>
        <input ref={inputRef} type="file" accept="image/*" onChange={handleLogo} style={{ display:"none" }} />
        {logoEmpresa && (
          <button onClick={() => setLogoEmpresa(null)} style={{ padding:"5px 10px", background:"transparent", border:"1px solid #475569", borderRadius:"5px", color:"#94a3b8", fontSize:"0.75rem", cursor:"pointer" }}>
            Quitar logo
          </button>
        )}
        <button onClick={() => window.print()} style={{ padding:"6px 18px", background:"#1d4ed8", border:"none", borderRadius:"5px", color:"#fff", fontSize:"0.8rem", fontWeight:700, cursor:"pointer" }}>
          🖨 Imprimir / Guardar PDF
        </button>
      </div>

      {/* Páginas */}
      <div style={{ padding:"20px 0", background:"#374151", minHeight:"100vh" }}>
        <Portada        memoria={memoria} logoEmpresa={logoEmpresa} fecha={fecha} />
        <ResumenEjecutivo memoria={memoria} logoEmpresa={logoEmpresa} fecha={fecha} />
        <PaginaCargas   memoria={memoria} logoEmpresa={logoEmpresa} fecha={fecha} />
        <PaginaMateriales memoria={memoria} logoEmpresa={logoEmpresa} fecha={fecha} />
      </div>
    </>
  );
}