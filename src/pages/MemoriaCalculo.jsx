import { useState, useEffect } from "react";

const f2 = (v) => { const n = parseFloat(v); return isNaN(n) ? "—" : n.toFixed(2); };

/* ═══════════ TABLAS BASE ═══════════ */
function TablaTramos({ resultado, titulo }) {
  if (!resultado?.length) return null;
  const suma = resultado.reduce((s, d) => s + parseFloat(d.cargaTotal || 0), 0);
  return (
    <div style={{ overflowX: "auto" }}>
      {titulo && <p style={{ fontSize:"0.7rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:"#60a5fa", background:"#1e293b", border:"1px solid #334155", borderBottom:"none", padding:"4px 10px", borderRadius:"6px 6px 0 0", display:"inline-block" }}>{titulo}</p>}
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"0.73rem", background:"#1e293b", border:"1px solid #334155" }}>
        <thead><tr style={{ background:"#0f172a" }}>
          {["#","Flujo","Tubería","Vel.","C.Base","Long.","C.Tramo","Tees","L.Tee","C.Tee","Codos","L.Codo","C.Codo","Red.","L.Red.","C.Red.","Total ft"].map(h => (
            <th key={h} style={{ padding:"5px 6px", color:"#94a3b8", fontWeight:600, border:"1px solid #334155", whiteSpace:"nowrap", textAlign:"center" }}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {resultado.map((d, i) => (
            <tr key={i} style={{ background: i%2===0 ? "#1e293b" : "#162032" }}>
              <td style={td}>{d.tramo}</td><td style={td}>{d.flujo}</td><td style={td}>{d.tuberia}</td><td style={td}>{d.velocidad}</td>
              <td style={td}>{d.cargaBase}</td><td style={td}>{d.longitud}</td><td style={td}>{d.cargaTramo}</td>
              <td style={td}>{d.cantidadTees}</td><td style={td}>{d.longEqTee}</td><td style={td}>{d.cargaTee}</td>
              <td style={td}>{d.cantidadCodos}</td><td style={td}>{d.longEqCodo}</td><td style={td}>{d.cargaCodo}</td>
              <td style={td}>{d.cantidadReducciones}</td><td style={td}>{d.longEqReduccion}</td><td style={td}>{d.cargaReduccion}</td>
              <td style={{ ...td, background:"#0c2340", color:"#60a5fa", fontWeight:700 }}>{d.cargaTotal}</td>
            </tr>
          ))}
          <tr style={{ background:"#1a3a5c" }}>
            <td colSpan={16} style={{ ...td, textAlign:"right", color:"#93c5fd", fontWeight:700 }}>Σ tramos (ft):</td>
            <td style={{ ...td, color:"#93c5fd", fontWeight:700 }}>{f2(suma)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function TablaCuarto({ tablaDistanciaCM, sufijo = "CM" }) {
  if (!tablaDistanciaCM) return null;
  const d = tablaDistanciaCM;
  const k = (c) => d[c + sufijo] ?? d[c] ?? "—";
  return (
    <div style={{ overflowX:"auto" }}>
      <p style={tituloStyle}>Tramo cuarto de máquinas</p>
      <table style={{ borderCollapse:"collapse", fontSize:"0.73rem", background:"#1e293b", border:"1px solid #334155" }}>
        <thead><tr style={{ background:"#0f172a" }}>
          {["Flujo","Tubería","Vel.","C.Base","Long.(m)","C.Tramo","Codos","L.Codo","C.Codo","Total ft"].map(h => (
            <th key={h} style={{ padding:"5px 8px", color:"#94a3b8", fontWeight:600, border:"1px solid #334155", whiteSpace:"nowrap" }}>{h}</th>
          ))}
        </tr></thead>
        <tbody><tr>
          <td style={td}>{k("flujo")}</td><td style={td}>{k("tuberia")}</td><td style={td}>{k("velocidad")}</td>
          <td style={td}>{k("cargaBase")}</td><td style={td}>{k("distancia")}</td><td style={td}>{k("cargaTramo")}</td>
          <td style={td}>1</td><td style={td}>{k("longEqCodo")}</td><td style={td}>{k("cargaCodo")}</td>
          <td style={{ ...td, background:"#0c2340", color:"#60a5fa", fontWeight:700 }}>{k("cargaTotal")}</td>
        </tr></tbody>
      </table>
    </div>
  );
}

function TablaDisparo({ disparo, titulo }) {
  if (!disparo) return null;
  const d = disparo;
  return (
    <div style={{ overflowX:"auto" }}>
      <p style={tituloStyle}>{titulo}</p>
      <table style={{ borderCollapse:"collapse", fontSize:"0.73rem", background:"#1e293b", border:"1px solid #334155" }}>
        <thead><tr style={{ background:"#0f172a" }}>
          {["Flujo","Tubería","Vel.","C.Base","Long.","C.Tramo","Codos","L.Codo","C.Codo","Red.","L.Red.","C.Red.","Total ft"].map(h => (
            <th key={h} style={{ padding:"5px 6px", color:"#94a3b8", fontWeight:600, border:"1px solid #334155", whiteSpace:"nowrap" }}>{h}</th>
          ))}
        </tr></thead>
        <tbody><tr>
          <td style={td}>{f2(d.flujoDisparo)}</td><td style={td}>{d.diametroDisparo}</td>
          <td style={td}>{f2(d.velocidadDisparo)}</td><td style={td}>{f2(d.cargaBaseDisparo)}</td>
          <td style={td}>{f2(d.longitudDisparo)}</td><td style={td}>{f2(d.cargaDisparo)}</td>
          <td style={td}>1</td><td style={td}>{f2(d.longEqCodoDisparo)}</td><td style={td}>{f2(d.cargaCodoDisparo)}</td>
          <td style={td}>{d.longEqReduccionDisparo!==0?1:0}</td><td style={td}>{f2(d.longEqReduccionDisparo)}</td><td style={td}>{f2(d.cargaReduccionDisparo)}</td>
          <td style={{ ...td, background:"#0c2340", color:"#60a5fa", fontWeight:700 }}>{f2(d.cargaDisparoTotal)}</td>
        </tr></tbody>
      </table>
    </div>
  );
}

function TablaResumen({ resumen, titulo }) {
  if (!resumen || !Object.keys(resumen).length) return null;
  return (
    <div>
      <p style={tituloStyle}>{titulo}</p>
      <table style={{ borderCollapse:"collapse", fontSize:"0.73rem", background:"#1e293b", border:"1px solid #334155", minWidth:"220px" }}>
        <thead><tr style={{ background:"#0f172a" }}>
          {["Diámetro","Tubería (m)","Tees","Codos","Reductions"].map(h=>(
            <th key={h} style={{ padding:"5px 8px", color:"#94a3b8", fontWeight:600, border:"1px solid #334155" }}>{h}</th>
          ))}
        </tr></thead>
        <tbody>{Object.entries(resumen).map(([d,r])=>(
          <tr key={d}><td style={td}>{d}</td><td style={td}>{f2(r.tuberia_m)}</td><td style={td}>{r.tees}</td><td style={td}>{r.codos}</td><td style={td}>{r.reducciones}</td></tr>
        ))}</tbody>
      </table>
    </div>
  );
}

/* ═══════════ ESTILOS COMPARTIDOS ═══════════ */
const td = { padding:"4px 7px", textAlign:"center", border:"1px solid #1e3a5f", color:"#cbd5e1" };
const tituloStyle = { fontSize:"0.7rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:"#60a5fa", background:"#1e293b", border:"1px solid #334155", borderBottom:"none", padding:"4px 10px", borderRadius:"6px 6px 0 0", display:"inline-block", marginTop:"0.75rem" };

/* ═══════════ ENCABEZADO DE ITERACIÓN ═══════════ */
const ITER_CONFIG = [
  { label:"Diseño original", bg:"rgba(100,116,139,0.2)",  border:"#475569", textColor:"#cbd5e1" },
  { label:"Iteración 1",     bg:"rgba(14,116,144,0.25)",  border:"#0891b2", textColor:"#67e8f9" },
  { label:"Iteración 2",     bg:"rgba(21,128,61,0.2)",    border:"#16a34a", textColor:"#86efac" },
];

function HeaderIter({ idx, flujo }) {
  const c = ITER_CONFIG[idx];
  return (
    <div style={{ background:c.bg, border:`1px solid ${c.border}`, borderRadius:"6px 6px 0 0", padding:"0.45rem 1rem", display:"flex", alignItems:"center", gap:"1.2rem" }}>
      <span style={{ fontSize:"0.72rem", fontWeight:700, color:c.textColor, textTransform:"uppercase", letterSpacing:"0.07em" }}>{c.label}</span>
      <span style={{ fontSize:"0.72rem", color:"#94a3b8" }}>Flujo: <strong style={{ color:"#38bdf8" }}>{f2(flujo)} GPM</strong></span>
    </div>
  );
}

/* ═══════════ CONTENIDO DE UN EQUIPO EN UNA ITERACIÓN ═══════════ */
function ContenidoEmpotrable({ data, tituloTramos, sufijoCM, tituloDisparo }) {
  if (!data) return <p style={{ color:"#475569", fontSize:"0.75rem", padding:"0.75rem" }}>Sin datos para esta iteración.</p>;
  const { resultado, sumaTramos, disparo, cargaDisparoTotal, tablaDistanciaCM, cargaDinamicaTotal, resumenTramos, resumenDisparos } = data;
  const cmKey = `cargaTotal${sufijoCM}`;
  const cmVal = tablaDistanciaCM ? parseFloat(tablaDistanciaCM[cmKey] ?? 0) : 0;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
      <TablaTramos resultado={resultado} titulo={tituloTramos} />
      <TablaCuarto tablaDistanciaCM={tablaDistanciaCM} sufijo={sufijoCM} />
      {disparo && <TablaDisparo disparo={disparo} titulo={tituloDisparo} />}
      <div style={{ display:"flex", gap:"1.5rem", flexWrap:"wrap", alignItems:"flex-start" }}>
        <div style={{ display:"flex", gap:"1rem", flexWrap:"wrap" }}>
          <TablaResumen resumen={resumenTramos} titulo="Resumen — tramos" />
          {resumenDisparos && <TablaResumen resumen={resumenDisparos} titulo="Resumen — disparos" />}
        </div>
        <div>
          <p style={tituloStyle}>Sumatoria</p>
          <table style={{ borderCollapse:"collapse", fontSize:"0.73rem", background:"#1e293b", border:"1px solid #334155", minWidth:"260px" }}>
            <tbody>
              <tr><td style={{ ...td, textAlign:"left", color:"#94a3b8", fontWeight:600 }}>Σ tramos (ft):</td><td style={td}>{f2(sumaTramos)} ft</td></tr>
              <tr><td style={{ ...td, textAlign:"left", color:"#94a3b8", fontWeight:600 }}>Cuarto de máquinas (ft):</td><td style={td}>{f2(cmVal)} ft</td></tr>
              {disparo && <tr><td style={{ ...td, textAlign:"left", color:"#94a3b8", fontWeight:600 }}>Disparos (ft):</td><td style={td}>{f2(cargaDisparoTotal)} ft</td></tr>}
              <tr><td style={{ ...td, textAlign:"left", color:"#94a3b8", fontWeight:600 }}>Accesorio (ft):</td><td style={td}>1.50 ft</td></tr>
              <tr style={{ background:"#0c2340" }}><td style={{ ...td, textAlign:"left", color:"#60a5fa", fontWeight:700 }}>CDT total (ft):</td><td style={{ ...td, color:"#60a5fa", fontWeight:700 }}>{f2(cargaDinamicaTotal)} ft</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ContenidoFiltro({ data }) {
  if (!data) return <p style={{ color:"#475569", fontSize:"0.75rem", padding:"0.75rem" }}>Sin datos para esta iteración.</p>;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
      {data.seleccion && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:"1rem", padding:"0.5rem 0.75rem", background:"rgba(15,23,42,0.4)", border:"1px solid #1e3a5f", borderRadius:"6px", fontSize:"0.78rem", color:"#94a3b8" }}>
          <span><strong style={{ color:"#e2e8f0" }}>Modelo:</strong> {data.seleccion.marca} {data.seleccion.modelo}</span>
          <span><strong style={{ color:"#e2e8f0" }}>Cantidad:</strong> {data.seleccion.cantidad}</span>
          <span><strong style={{ color:"#e2e8f0" }}>Flujo total:</strong> {f2(data.seleccion.flujoTotal)} GPM</span>
          {data.kgDiaNecesario && <span><strong style={{ color:"#e2e8f0" }}>Cloro:</strong> {f2(data.kgDiaNecesario)} kg/día</span>}
        </div>
      )}
      <TablaTramos resultado={data.tablaTramos} titulo="Tramos hidráulicos" />
      <div style={{ display:"flex", gap:"1.5rem", flexWrap:"wrap", alignItems:"flex-start" }}>
        <TablaResumen resumen={data.resumenMateriales} titulo="Resumen materiales" />
        <div>
          <p style={tituloStyle}>Sumatoria</p>
          <table style={{ borderCollapse:"collapse", fontSize:"0.73rem", background:"#1e293b", border:"1px solid #334155", minWidth:"260px" }}>
            <tbody>
              <tr><td style={{ ...td, textAlign:"left", color:"#94a3b8", fontWeight:600 }}>Σ tramos (ft):</td><td style={td}>{f2(data.cargaTramos)} ft</td></tr>
              <tr><td style={{ ...td, textAlign:"left", color:"#94a3b8", fontWeight:600 }}>Carga fija (ft):</td><td style={td}>{f2(data.cargaFija)} ft</td></tr>
              <tr style={{ background:"#0c2340" }}><td style={{ ...td, textAlign:"left", color:"#60a5fa", fontWeight:700 }}>CDT total (ft):</td><td style={{ ...td, color:"#60a5fa", fontWeight:700 }}>{f2(data.cargaTotal)} ft</td></tr>
              <tr><td style={{ ...td, textAlign:"left", color:"#94a3b8", fontWeight:600 }}>CDT total (PSI):</td><td style={td}>{f2(data.cargaTotalPSI)} PSI</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ═══════════ TAB DE EQUIPO: 3 bloques uno bajo otro ═══════════ */
function TabEquipo({ equipoKey, reportes, tipoRender, sufijoCM, tituloTramos, tituloDisparo }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"0" }}>
      {reportes.map((reporte, i) => {
        if (!reporte) return null;
        const data = getEquipoData(reporte, equipoKey);
        const c = ITER_CONFIG[i];
        return (
          <div key={i} style={{ border:`1px solid ${c.border}`, borderRadius: i===0?"8px 8px 0 0" : i===reportes.filter(Boolean).length-1?"0 0 8px 8px":"0", marginTop: i===0?0:"-1px", overflow:"hidden" }}>
            <HeaderIter idx={i} flujo={reporte.flujo} />
            <div style={{ padding:"1rem", background:"rgba(15,23,42,0.5)" }}>
              {tipoRender === "empotrable"
                ? <ContenidoEmpotrable data={data} tituloTramos={tituloTramos} sufijoCM={sufijoCM} tituloDisparo={tituloDisparo} />
                : <ContenidoFiltro data={data} />
              }
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getEquipoData(reporte, key) {
  if (!reporte) return null;
  return reporte.empotrables?.[key] ?? reporte.filtros?.[key] ?? reporte.sanitizacion?.[key] ?? null;
}

/* ═══════════ TAB RESUMEN ═══════════ */
function TabResumen({ reportes, calentamiento, resumen = {} }) {
  // Inferir si tiene desborde canal basándose en los datos
  const tieneDesbordeCanal = reportes.some(r => getEquipoData(r, "drenCanal") != null);
  const equiposOrden = ["retorno","desnatador","drenFondo","drenCanal","barredora","filtroArena","prefiltro","filtroCartucho","cloradorSalino","lamparaUV","cloradorAutomatico"];
  const nombresEq = { retorno:"Retornos", desnatador:"Desnatadores", drenFondo:"Drenes fondo", drenCanal:"Drenes canal", barredora:"Barredoras", filtroArena:"Filtro arena", prefiltro:"Prefiltro", filtroCartucho:"F. cartucho", cloradorSalino:"Cloro salino", lamparaUV:"Lámpara UV", cloradorAutomatico:"Clorador auto" };

  const getCDT = (reporte, key) => {
    const d = getEquipoData(reporte, key);
    if (!d) return null;
    return d.cargaDinamicaTotal ?? d.cargaTotal ?? null;
  };

  const equiposPresentes = equiposOrden.filter(k => reportes.some(r => getEquipoData(r, k)));

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1.5rem" }}>
      {/* Tabla comparativa de CDT */}
      <div>
        <p style={{ ...tituloStyle, marginTop:0 }}>Comparativa de cargas por equipo (ft)</p>
        <table style={{ borderCollapse:"collapse", fontSize:"0.78rem", background:"#1e293b", border:"1px solid #334155", width:"100%" }}>
          <thead><tr style={{ background:"#0f172a" }}>
            <th style={{ ...td, textAlign:"left", color:"#94a3b8", fontWeight:600, padding:"7px 12px" }}>Equipo</th>
            {reportes.filter(Boolean).map((r, i) => (
              <th key={i} style={{ ...td, color: ITER_CONFIG[i].textColor, fontWeight:700, padding:"7px 12px" }}>{ITER_CONFIG[i].label}<br/><span style={{ fontSize:"0.68rem", color:"#64748b", fontWeight:400 }}>{f2(r.flujo)} GPM</span></th>
            ))}
          </tr></thead>
          <tbody>
            {equiposPresentes.map((key, ri) => {
              // Determinar si este equipo suma en cada reporte
              const esBarredora = key === "barredora";
              return (
                <tr key={key} style={{ background: ri%2===0?"rgba(15,23,42,0.4)":"rgba(30,41,59,0.4)" }}>
                  <td style={{ ...td, textAlign:"left", color: esBarredora?"#64748b":"#e2e8f0", fontWeight:500, padding:"6px 12px" }}>
                    {nombresEq[key]}
                    {esBarredora && <span style={{ fontSize:"0.65rem", color:"#475569", marginLeft:"6px" }}>informativo</span>}
                  </td>
                  {reportes.filter(Boolean).map((r, i) => {
                    const v = getCDT(r, key);
                    // Succión: verificar si gobierna
                    const succKeys = tieneDesbordeCanal ? ["drenCanal","drenFondo"] : ["desnatador","drenFondo"];
                    const esSuccion = succKeys.includes(key);
                    let gobierna = true;
                    if (esSuccion) {
                      const succVals = succKeys.map(k => ({ k, v: getCDT(r,k) })).filter(x=>x.v!=null);
                      if (succVals.length > 1) {
                        const max = succVals.reduce((a,b)=>parseFloat(b.v)>parseFloat(a.v)?b:a);
                        gobierna = max.k === key;
                      }
                    }
                    const noSuma = esBarredora || (esSuccion && !gobierna);
                    return <td key={i} style={{ ...td, color: v==null?"#334155":noSuma?"#475569":"#60a5fa", padding:"6px 12px" }}>
                      {v!=null ? f2(v)+" ft" : "—"}
                      {v!=null && noSuma && <span style={{ fontSize:"0.62rem", color:"#475569", display:"block" }}>no suma</span>}
                      {v!=null && esSuccion && gobierna && <span style={{ fontSize:"0.62rem", color:"#34d399", display:"block" }}>↑ gobierna</span>}
                    </td>;
                  })}
                </tr>
              );
            })}
            {/* Filas de calentamiento — carga fija, igual en todas las iteraciones */}
            {calentamiento?.length > 0 && calentamiento.map((c, ci) => (
              <tr key={"cal-"+ci} style={{ background: ci%2===0?"rgba(251,191,36,0.04)":"rgba(251,191,36,0.02)", borderTop: ci===0?"1px solid rgba(251,191,36,0.15)":"none" }}>
                <td style={{ ...td, textAlign:"left", color:"#fbbf24", fontWeight:500, padding:"6px 12px" }}>
                  {c.label}
                  <span style={{ fontSize:"0.65rem", color:"#92400e", marginLeft:"6px" }}>fijo</span>
                </td>
                {reportes.filter(Boolean).map((r, i) => (
                  <td key={i} style={{ ...td, color:"#fbbf24", padding:"6px 12px" }}>{f2(c.cargaTotal)} ft</td>
                ))}
              </tr>
            ))}
            {/* Fila CDT Total — usa los valores reales del equilibrio hidráulico */}
            <tr style={{ background:"#0c2340", borderTop:"2px solid #1e4a7a" }}>
              <td style={{ ...td, textAlign:"left", color:"#60a5fa", fontWeight:700, padding:"8px 12px" }}>CDT Total sistema</td>
              {[resumen.cdtDiseno, resumen.cdtIter1, resumen.cdtIter2].slice(0, reportes.filter(Boolean).length).map((cdt, i) => (
                <td key={i} style={{ ...td, color:"#60a5fa", fontWeight:700, padding:"8px 12px" }}>{cdt} ft</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>


    </div>
  );
}

/* ═══════════ COMPONENTE PRINCIPAL ═══════════ */
export default function MemoriaCalculo() {
  const [memoria, setMemoria]     = useState(null);
  const [tabActiva, setTabActiva] = useState(0);
  const [error, setError]         = useState(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("memoriaCalculo");
      if (!raw) throw new Error("No se encontraron datos. Genera la memoria desde Equipamiento.");
      const parsed = JSON.parse(raw);
      setMemoria(parsed);
    } catch (e) { setError(e.message); }
  }, []);

  if (error) return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", color:"#f87171", fontFamily:"system-ui" }}>⚠️ {error}</div>;
  if (!memoria) return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", color:"#94a3b8", fontFamily:"system-ui" }}>Cargando…</div>;

  const { resumen, reportes = [], calentamiento = [] } = memoria;

  const defEquipos = [
    { key:"retorno",            label:"Retornos",         tipo:"empotrable", sufijoCM:"CM",   tituloTramos:"Tramos retornos",     tituloDisparo:"Disparo al retorno"     },
    { key:"desnatador",         label:"Desnatadores",     tipo:"empotrable", sufijoCM:"CMD",  tituloTramos:"Tramos desnatadores", tituloDisparo:"Disparo al desnatador"  },
    { key:"barredora",          label:"Barredoras",       tipo:"empotrable", sufijoCM:"CMB",  tituloTramos:"Tramos barredoras",   tituloDisparo:"Disparo a barredora"    },
    { key:"drenFondo",          label:"Drenes fondo",     tipo:"empotrable", sufijoCM:"CMDF", tituloTramos:"Tramos drenes fondo", tituloDisparo:null                     },
    { key:"drenCanal",          label:"Drenes canal",     tipo:"empotrable", sufijoCM:"CMDC", tituloTramos:"Tramos drenes canal", tituloDisparo:null                     },
    { key:"filtroArena",        label:"Filtro arena",     tipo:"filtro" },
    { key:"prefiltro",          label:"Prefiltro",        tipo:"filtro" },
    { key:"filtroCartucho",     label:"F. cartucho",      tipo:"filtro" },
    { key:"cloradorSalino",     label:"Cloro salino",     tipo:"filtro" },
    { key:"lamparaUV",          label:"Lámpara UV",       tipo:"filtro" },
    { key:"cloradorAutomatico", label:"Clorador auto",    tipo:"filtro" },
  ].filter(eq => reportes.some(r => getEquipoData(r, eq.key)));

  const tabs = [
    { label:"📊 Resumen", comp: <TabResumen reportes={reportes} calentamiento={calentamiento} resumen={resumen} /> },
    ...defEquipos.map(eq => ({
      label: eq.label,
      comp: <TabEquipo equipoKey={eq.key} reportes={reportes} tipoRender={eq.tipo} sufijoCM={eq.sufijoCM} tituloTramos={eq.tituloTramos} tituloDisparo={eq.tituloDisparo} />,
    })),
  ];

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", fontFamily:"'Segoe UI',system-ui,sans-serif", background:"#0f172a", color:"#e2e8f0" }}>
      {/* Header */}
      <div style={{ background:"#1e293b", borderBottom:"1px solid #334155", padding:"14px 24px" }}>
        <h1 style={{ fontSize:"1.1rem", fontWeight:700, color:"#60a5fa", marginBottom:"8px" }}>Memoria de cálculo hidráulico</h1>
        <div style={{ display:"flex", flexWrap:"wrap", gap:"16px", fontSize:"0.8rem", color:"#94a3b8" }}>
          <span><strong style={{ color:"#e2e8f0" }}>Volumen:</strong> {resumen.vol} m³</span>
          <span><strong style={{ color:"#e2e8f0" }}>Flujo diseño:</strong> {resumen.flujoMax} GPM</span>
          {resumen.bomba && <span><strong style={{ color:"#e2e8f0" }}>Bomba:</strong> {resumen.bomba} × {resumen.nBombas}</span>}
          {resumen.flujoFinal && <span><strong style={{ color:"#38bdf8" }}>Flujo operación:</strong> {resumen.flujoFinal} GPM</span>}
          {resumen.cdtFinal && <span><strong style={{ color:"#38bdf8" }}>CDT operación:</strong> {resumen.cdtFinal} ft</span>}
          <span><strong style={{ color:"#e2e8f0" }}>Succ.:</strong> {resumen.tubSuccion}</span>
          <span><strong style={{ color:"#e2e8f0" }}>Desc.:</strong> {resumen.tubDescarga}</span>
        </div>
        {/* Leyenda */}
        <div style={{ display:"flex", gap:"14px", marginTop:"8px", flexWrap:"wrap" }}>
          {ITER_CONFIG.map(c => (
            <span key={c.label} style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:"0.73rem", color:"#94a3b8" }}>
              <span style={{ width:"10px", height:"10px", borderRadius:"2px", background:c.bg, border:`1px solid ${c.border}`, display:"inline-block" }} />
              {c.label}
            </span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:"2px", background:"#1e293b", borderBottom:"2px solid #334155", padding:"0 16px" }}>
        {tabs.map((tab, i) => (
          <button key={i} onClick={() => setTabActiva(i)}
            style={{ padding:"8px 14px", border:"none", background:"transparent", color: tabActiva===i ? "#60a5fa" : "#94a3b8", fontSize:"0.8rem", fontWeight: tabActiva===i ? 700 : 500, cursor:"pointer", borderBottom: tabActiva===i ? "2px solid #60a5fa" : "2px solid transparent", marginBottom:"-2px", whiteSpace:"nowrap", transition:"color 0.15s" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div style={{ flex:1, padding:"20px 16px", overflowX:"auto" }}>
        {tabs[tabActiva]?.comp}
      </div>
    </div>
  );
}