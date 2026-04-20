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
const td = { padding:"4px 7px", textAlign:"center", border:"1px solid #1e3a5f", color:"#cbd5e1", verticalAlign:"middle", whiteSpace:"nowrap" };
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

/* ═══════════ CALENTAMIENTO ═══════════ */
function ContenidoCalentamiento({ data }) {
  if (!data) return <p style={{ color:"#475569", fontSize:"0.75rem", padding:"0.75rem" }}>Sin datos para esta iteracion.</p>;
  const d = data.tablaDistancia;
  const a = data.tablaAltura;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
      {data.seleccion && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:"1rem", padding:"0.5rem 0.75rem", background:"rgba(15,23,42,0.4)", border:"1px solid #1e3a5f", borderRadius:"6px", fontSize:"0.78rem", color:"#94a3b8" }}>
          {data.seleccion.marca && <span><strong style={{ color:"#e2e8f0" }}>Modelo:</strong> {data.seleccion.marca} {data.seleccion.modelo}</span>}
          {data.seleccion.cantidad && <span><strong style={{ color:"#e2e8f0" }}>Cantidad:</strong> {data.seleccion.cantidad}</span>}
          {data.seleccion.flujoTotal && <span><strong style={{ color:"#e2e8f0" }}>Flujo total:</strong> {f2(data.seleccion.flujoTotal)} GPM</span>}
        </div>
      )}

      {/* Tramos entre equipos */}
      <TablaTramos resultado={data.tablaTramos} titulo="Tramos hidráulicos" />

      {/* Tramo cuarto de máquinas — IDA y REGRESO en filas separadas */}
      {d && (
        <div style={{ overflowX:"auto" }}>
          <p style={tituloStyle}>Tramo cuarto de máquinas</p>
          <table style={{ borderCollapse:"collapse", fontSize:"0.73rem", background:"#1e293b", border:"1px solid #334155" }}>
            <thead><tr style={{ background:"#0f172a" }}>
              {["","Flujo","Tubería","Vel.","C.Base","Dist.(m)","C.Tubería","Codos","C.Codos","Total"].map(h => (
                <th key={h} style={{ padding:"5px 8px", color:"#94a3b8", fontWeight:600, border:"1px solid #334155", whiteSpace:"nowrap", fontSize:"0.68rem" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              <tr>
                <td style={{ ...td, color:"#7dd3fc", fontWeight:600, textAlign:"left", paddingLeft:"10px" }}>Ida</td>
                <td style={td}>{d.flujo} GPM</td>
                <td style={td}>{d.tuberia}</td>
                <td style={td}>{d.velocidad} ft/s</td>
                <td style={td}>{d.cargaBase}</td>
                <td style={td}>{d.distancia_m} m</td>
                <td style={td}>{d.cargaTuberiaIda} ft</td>
                <td style={td}>1</td>
                <td style={td}>{d.cargaCodoIda} ft</td>
                <td style={{ ...td, color:"#7dd3fc", fontWeight:600 }}>{d.cargaTotalIda} ft</td>
              </tr>
              <tr style={{ background:"rgba(30,41,59,0.4)" }}>
                <td style={{ ...td, color:"#7dd3fc", fontWeight:600, textAlign:"left", paddingLeft:"10px" }}>Regreso</td>
                <td style={td}>{d.flujo} GPM</td>
                <td style={td}>{d.tuberia}</td>
                <td style={td}>{d.velocidad} ft/s</td>
                <td style={td}>{d.cargaBase}</td>
                <td style={td}>{d.distancia_m} m</td>
                <td style={td}>{d.cargaTuberiaReg} ft</td>
                <td style={td}>1</td>
                <td style={td}>{d.cargaCodoReg} ft</td>
                <td style={{ ...td, color:"#7dd3fc", fontWeight:600 }}>{d.cargaTotalReg} ft</td>
              </tr>
              <tr style={{ background:"#0c2340", borderTop:"2px solid #1e4a7a" }}>
                <td colSpan={9} style={{ ...td, textAlign:"right", color:"#60a5fa", fontWeight:600 }}>Total cuarto de máquinas:</td>
                <td style={{ ...td, color:"#60a5fa", fontWeight:700 }}>{d.cargaTotal} ft</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Altura vertical al equipo */}
      {a && (
        <div style={{ overflowX:"auto" }}>
          <p style={tituloStyle}>Altura vertical al equipo</p>
          <table style={{ borderCollapse:"collapse", fontSize:"0.73rem", background:"#1e293b", border:"1px solid #334155" }}>
            <thead><tr style={{ background:"#0f172a" }}>
              {["Altura equipo (m)","Altura máx. sistema (m)","Carga estática","Flujo","Tubería","C.Base","C.Estática (ft)","C.Fricción (ft)","Total (ft)"].map(h => (
                <th key={h} style={{ padding:"5px 7px", color:"#94a3b8", fontWeight:600, border:"1px solid #334155", whiteSpace:"nowrap", fontSize:"0.68rem" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody><tr>
              {/* Cubrir todos los nombres posibles del campo de altura según el equipo */}
              <td style={td}>{f2(a.alturaBDC_m ?? a.alturaCE_m ?? a.alturaCaldera_m ?? a.alturaPS_m ?? a.alturaEquipo_m ?? 0)} m</td>
              <td style={td}>{f2(a.alturaMaxSist_m ?? 0)} m</td>
              <td style={{ ...td, color: (a.bdcLlevaCargaEstatica ?? a.ceLlevaCargaEstatica ?? a.calderaLlevaCargaEstatica ?? a.psLlevaCargaEstatica) ? "#34d399" : "#f97316" }}>
                {(a.bdcLlevaCargaEstatica ?? a.ceLlevaCargaEstatica ?? a.calderaLlevaCargaEstatica ?? a.psLlevaCargaEstatica) ? "Sí — gobierna" : "No"}
              </td>
              <td style={td}>{a.flujo} GPM</td>
              <td style={td}>{a.tuberia}</td>
              <td style={td}>{a.cargaBase}</td>
              <td style={td}>{f2(a.cargaEstatica)} ft</td>
              <td style={td}>{f2(a.cargaFriccion)} ft</td>
              <td style={{ ...td, background:"#0c2340", color:"#60a5fa", fontWeight:700 }}>{f2(a.cargaTotal)} ft</td>
            </tr></tbody>
          </table>
        </div>
      )}

      {/* Resumen materiales + Sumatoria */}
      <div style={{ display:"flex", gap:"1.5rem", flexWrap:"wrap", alignItems:"flex-start" }}>
        <TablaResumen resumen={data.resumenMateriales} titulo="Resumen materiales" />
        <div>
          <p style={tituloStyle}>Sumatoria</p>
          <table style={{ borderCollapse:"collapse", fontSize:"0.73rem", background:"#1e293b", border:"1px solid #334155", minWidth:"260px" }}>
            <tbody>
              <tr><td style={{ ...td, textAlign:"left", color:"#94a3b8", fontWeight:600 }}>Σ tramos (ft):</td><td style={td}>{f2(data.cargaTramos)} ft</td></tr>
              {data.cargaDistanciaIda  != null && <tr><td style={{ ...td, textAlign:"left", color:"#94a3b8", fontWeight:600 }}>Cuarto máq. ida (ft):</td><td style={td}>{f2(data.cargaDistanciaIda)} ft</td></tr>}
              {data.cargaDistanciaReg  != null && <tr><td style={{ ...td, textAlign:"left", color:"#94a3b8", fontWeight:600 }}>Cuarto máq. reg. (ft):</td><td style={td}>{f2(data.cargaDistanciaReg)} ft</td></tr>}
              {data.cargaEstatica      != null && parseFloat(data.cargaEstatica) > 0 && <tr><td style={{ ...td, textAlign:"left", color:"#94a3b8", fontWeight:600 }}>Carga estática (ft):</td><td style={td}>{f2(data.cargaEstatica)} ft</td></tr>}
              {data.cargaFriccion      != null && <tr><td style={{ ...td, textAlign:"left", color:"#94a3b8", fontWeight:600 }}>Fricción altura (ft):</td><td style={td}>{f2(data.cargaFriccion)} ft</td></tr>}
              {data.cargaFija          != null && <tr><td style={{ ...td, textAlign:"left", color:"#94a3b8", fontWeight:600 }}>Carga fija (ft):</td><td style={td}>{f2(data.cargaFija)} ft</td></tr>}
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
                : tipoRender === "calentamiento"
                ? <ContenidoCalentamiento data={data} />
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
  // Buscar en empotrables, filtros, sanitizacion, y calentamiento
  const cal = reporte.calentamiento?.find(c => c.key === key);
  return reporte.empotrables?.[key] ?? reporte.filtros?.[key] ?? reporte.sanitizacion?.[key] ?? cal ?? null;
}

/* ═══════════ TAB RESUMEN ═══════════ */
function TabResumen({ reportes, calentamiento, resumen = {} }) {
  const tieneDesbordeCanal = reportes.some(r => getEquipoData(r, "drenCanal") != null);
  const equiposOrden = ["retorno","desnatador","drenFondo","drenCanal","barredora","filtroArena","prefiltro","filtroCartucho","cloradorSalino","lamparaUV","cloradorAutomatico"];
  const nombresEq = { retorno:"Retornos", desnatador:"Desnatadores", drenFondo:"Drenes fondo", drenCanal:"Drenes canal", barredora:"Barredoras", filtroArena:"Filtro arena", prefiltro:"Prefiltro", filtroCartucho:"F. cartucho", cloradorSalino:"Cloro salino", lamparaUV:"Lámpara UV", cloradorAutomatico:"Clorador auto" };

  const getCDT = (reporte, key) => {
    const d = getEquipoData(reporte, key);
    if (!d) return null;
    return d.cargaDinamicaTotal ?? d.cargaTotal ?? null;
  };

  const getFlujo = (reporte, key) => {
    const d = getEquipoData(reporte, key);
    if (!d) return null;
    return d.seleccion?.flujoTotal ?? null;
  };

  const equiposPresentes = equiposOrden.filter(k => reportes.some(r => getEquipoData(r, k)));
  // Para flujos solo mostramos el reporte de diseño (reportes[0])
  const rDis = reportes[0];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1.5rem" }}>

      {/* ── Diagrama de progresión Diseño → Iter1 → Iter2 ── */}
      {resumen.flujoIter1 && parseFloat(resumen.flujoIter1) > 0 && (
      <div>
        <p style={{ ...tituloStyle, marginTop:0 }}>Progresión del punto de operación</p>
        <div style={{ display:"flex", alignItems:"stretch", gap:0, background:"rgba(15,23,42,0.5)", border:"1px solid #1e3a5f", borderRadius:"8px", overflow:"hidden" }}>
          {/* Diseño original */}
          <div style={{ flex:1, padding:"1rem", borderRight:"1px solid #1e3a5f" }}>
            <div style={{ fontSize:"0.65rem", color:"#94a3b8", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"0.5rem" }}>Diseño original</div>
            <div style={{ fontSize:"1.1rem", fontWeight:800, color:"#cbd5e1" }}>{resumen.flujoMax} <span style={{ fontSize:"0.7rem", fontWeight:400 }}>GPM</span></div>
            <div style={{ fontSize:"0.78rem", color:"#64748b", marginTop:"2px" }}>{resumen.cdtDiseno} ft CDT</div>
          </div>
          {/* Flecha */}
          <div style={{ display:"flex", alignItems:"center", padding:"0 0.5rem", color:"#334155", fontSize:"1.2rem" }}>→</div>
          {/* Iter 1 */}
          <div style={{ flex:1, padding:"1rem", borderRight:"1px solid #1e3a5f", background:"rgba(14,116,144,0.08)" }}>
            <div style={{ fontSize:"0.65rem", color:"#67e8f9", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"0.5rem" }}>Iteración 1</div>
            <div style={{ fontSize:"1.1rem", fontWeight:800, color:"#67e8f9" }}>{resumen.flujoIter1} <span style={{ fontSize:"0.7rem", fontWeight:400 }}>GPM</span></div>
            <div style={{ fontSize:"0.78rem", color:"#0891b2", marginTop:"2px" }}>{resumen.cdtIter1} ft CDT</div>
          </div>
          {/* Flecha → Iter2 siempre si existe */}
          {resumen.flujoIter2 && parseFloat(resumen.flujoIter2) > 0 && (
          <div style={{ display:"flex", alignItems:"center", padding:"0 0.5rem", color:"#334155", fontSize:"1.2rem" }}>→</div>
          )}
          {/* Iter 2 — siempre visible si existe, aunque flujo == iter1 (convergencia) */}
          {resumen.flujoIter2 && parseFloat(resumen.flujoIter2) > 0 && (
          <div style={{ flex:1, padding:"1rem", background:"rgba(21,128,61,0.08)" }}>
            <div style={{ fontSize:"0.65rem", color:"#86efac", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"0.5rem" }}>
              Iteración 2{resumen.flujoIter2 === resumen.flujoIter1 ? <span style={{ fontSize:"0.6rem", color:"#16a34a", marginLeft:"6px", fontWeight:400 }}>convergió</span> : null}
            </div>
            <div style={{ fontSize:"1.1rem", fontWeight:800, color:"#86efac" }}>{resumen.flujoIter2} <span style={{ fontSize:"0.7rem", fontWeight:400 }}>GPM</span></div>
            <div style={{ fontSize:"0.78rem", color:"#16a34a", marginTop:"2px" }}>{resumen.cdtIter2} ft CDT</div>
          </div>
          )}
        </div>
      </div>
      )}

      {/* ── Tabla de requerimientos de flujo por proceso/sistema ── */}
      {resumen.flujosRequeridos?.length > 0 && (
      <div>
        <p style={{ ...tituloStyle, marginTop:0 }}>Requerimientos de flujo por proceso (GPM)</p>
        <table style={{ borderCollapse:"collapse", fontSize:"0.78rem", background:"#1e293b", border:"1px solid #334155", width:"100%" }}>
          <thead><tr style={{ background:"#0f172a" }}>
            <th style={{ ...td, textAlign:"left", color:"#94a3b8", fontWeight:600, padding:"7px 14px" }}>Sistema / Proceso</th>
            <th style={{ ...td, color:"#94a3b8", fontWeight:600, padding:"7px 14px", width:"120px" }}>Flujo (GPM)</th>
            <th style={{ ...td, color:"#94a3b8", fontWeight:600, padding:"7px 14px", width:"90px" }}></th>
          </tr></thead>
          <tbody>
            {resumen.flujosRequeridos.map((item, ri) => {
              const esMáx = item.valor != null && f2(item.valor) === resumen.flujoMax;
              const esNull = item.valor == null;
              return (
                <tr key={ri} style={{ background: ri%2===0?"rgba(15,23,42,0.4)":"rgba(30,41,59,0.4)" }}>
                  <td style={{ ...td, textAlign:"left", color: esMáx?"#60a5fa":"#e2e8f0", fontWeight: esMáx?700:500, padding:"6px 14px" }}>
                    {item.label}
                  </td>
                  <td style={{ ...td, color: esNull?"#475569": esMáx?"#60a5fa":"#38bdf8", fontWeight: esMáx?700:400, padding:"6px 14px" }}>
                    {esNull ? <span style={{fontSize:"0.7rem",color:"#475569"}}>usa flujo máx</span> : f2(item.valor)+" GPM"}
                  </td>
                  <td style={{ ...td, padding:"6px 14px", fontSize:"0.72rem" }}>
                    {esMáx && <span style={{color:"#60a5fa",fontWeight:700}}>↑ máximo</span>}
                  </td>
                </tr>
              );
            })}
            <tr style={{ background:"#0c2340", borderTop:"2px solid #1e4a7a" }}>
              <td style={{ ...td, textAlign:"left", color:"#60a5fa", fontWeight:700, padding:"8px 14px" }}>Flujo máximo global</td>
              <td style={{ ...td, color:"#60a5fa", fontWeight:700, padding:"8px 14px" }}>{resumen.flujoMax} GPM</td>
              <td style={{ ...td, padding:"8px 14px" }}></td>
            </tr>
          </tbody>
        </table>
      </div>
      )}

      {/* ── Tabla comparativa de CDT ── */}
      <div>
        <p style={{ ...tituloStyle, marginTop:0 }}>Relación de cargas por equipo (ft)</p>
        <table style={{ borderCollapse:"collapse", fontSize:"0.78rem", background:"#1e293b", border:"1px solid #334155", width:"100%" }}>
          <thead><tr style={{ background:"#0f172a" }}>
            <th style={{ ...td, textAlign:"left", color:"#94a3b8", fontWeight:600, padding:"7px 12px", width:"130px" }}>Equipo</th>
            {reportes.filter(Boolean).map((r, i) => (
              <th key={i} style={{ ...td, color: ITER_CONFIG[i].textColor, fontWeight:700, padding:"7px 12px", width:"110px" }}>{ITER_CONFIG[i].label}<br/><span style={{ fontSize:"0.68rem", color:"#64748b", fontWeight:400 }}>{f2(r.flujo)} GPM</span></th>
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
                    return <td key={i} style={{ ...td, color: v==null?"#334155":noSuma?"#475569":"#60a5fa", padding:"6px 12px", textAlign:"center" }}>
                      <span style={{ display:"inline-flex", alignItems:"center", gap:"4px", justifyContent:"center" }}>
                        <span>{v!=null ? f2(v)+" ft" : "—"}</span>
                        {v!=null && noSuma && <span style={{ fontSize:"0.58rem", color:"#475569" }}>no suma</span>}
                        {v!=null && esSuccion && gobierna && <span style={{ fontSize:"0.58rem", color:"#34d399" }}>↑</span>}
                      </span>
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
                  <td key={i} style={{ ...td, color:"#fbbf24", padding:"6px 12px", textAlign:"center" }}>{f2(c.cargaTotal)} ft</td>
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

/* ═══════════ TAB EQUIPOS — formato cotización ═══════════ */
function TabEquiposConsiderar({ reportes, calentamiento, resumen = {} }) {
  const r = reportes[0];
  if (!r) return null;

  const secciones = [
    { titulo: "Motobomba",                 keys: ["motobomba"] },
    { titulo: "Empotrables e Hidráulica",  keys: ["retorno","desnatador","barredora","drenFondo","drenCanal"] },
    { titulo: "Filtración",                keys: ["filtroArena","prefiltro","filtroCartucho"] },
    { titulo: "Sanitización",              keys: ["cloradorSalino","lamparaUV","cloradorAutomatico"] },
    { titulo: "Calentamiento",             keys: ["bombaCalor","panelSolar","caldera","calentadorElectrico"] },
  ];

  const colores = {
    "Empotrables e Hidráulica": "#3b82f6",
    "Filtración":               "#8b5cf6",
    "Sanitización":             "#10b981",
    "Calentamiento":            "#f59e0b",
  };

  const nombres = {
    motobomba:"Motobomba",
    retorno:"Retornos", desnatador:"Desnatadores", barredora:"Barredoras",
    drenFondo:"Drenes de fondo", drenCanal:"Drenes de canal",
    filtroArena:"Filtro de arena", prefiltro:"Prefiltro", filtroCartucho:"Filtro de cartucho",
    cloradorSalino:"Generador de cloro salino", lamparaUV:"Lámpara UV",
    cloradorAutomatico:"Clorador automático",
    bombaCalor:"Bomba de calor", panelSolar:"Panel solar",
    caldera:"Caldera de gas", calentadorElectrico:"Calentador eléctrico",
  };

  // Para empotrables: extraer marca/modelo del resumenTramos o del resultado
  const getInfoEmpotrable = (key, data) => {
    // Los empotrables no tienen seleccion directa — extraer de resumenTramos o de la data
    const sel = data?.seleccion;
    // Buscar en el resultado hidráulico
    const res = data?.resultado?.[0]; // primera fila tiene info del tramo
    return {
      marca:    sel?.marca    ?? "—",
      modelo:   sel?.modelo   ?? "—",
      cantidad: sel?.cantidad ?? "—",
      flujo:    sel?.flujoTotal != null ? f2(sel.flujoTotal) + " GPM"
              : res?.flujo != null ? f2(res.flujo) + " GPM" : "—",
      cdt:      data?.cargaDinamicaTotal != null ? f2(data.cargaDinamicaTotal) + " ft" : "—",
    };
  };

  const getInfo = (key) => {
    if (key === "motobomba") {
      if (!resumen?.bomba || resumen.bomba === "—") return null;
      return {
        marca:    resumen.bomba?.split(" ")?.[0] ?? "—",
        modelo:   resumen.bomba?.split(" ")?.slice(1).join(" ") ?? "—",
        cantidad: resumen.nBombas ?? 1,
        flujo:    resumen.flujoMax ? resumen.flujoMax + " GPM" : "—",
        cdt:      resumen.cdtDiseno ? resumen.cdtDiseno + " ft" : "—",
      };
    }
    const data = getEquipoData(r, key);
    if (!data) return null;
    const isEmp = ["retorno","desnatador","barredora","drenFondo","drenCanal"].includes(key);
    if (isEmp) return getInfoEmpotrable(key, data);
    const sel = data.seleccion ?? {};
    return {
      marca:    sel.marca    ?? "—",
      modelo:   sel.modelo   ?? "—",
      cantidad: sel.cantidad ?? "—",
      flujo:    sel.flujoTotal != null ? f2(sel.flujoTotal) + " GPM" : "—",
      cdt:      data.cargaDinamicaTotal != null ? f2(data.cargaDinamicaTotal) + " ft"
              : data.cargaTotal          != null ? f2(data.cargaTotal)          + " ft" : "—",
    };
  };

  let itemNum = 0;

  return (
    <div style={{ background:"#fff", color:"#111", padding:"2rem", borderRadius:"8px", fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      {/* Encabezado cotización */}
      <div style={{ borderBottom:"3px solid #1e3a8a", paddingBottom:"1rem", marginBottom:"1.5rem", display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
        <div>
          <h2 style={{ fontSize:"1.3rem", fontWeight:800, color:"#1e3a8a", margin:0 }}>Relación de equipos</h2>
          <p style={{ fontSize:"0.8rem", color:"#64748b", margin:"4px 0 0" }}>Memoria de cálculo hidráulico — PoolMetric</p>
        </div>
        <div style={{ textAlign:"right", fontSize:"0.78rem", color:"#64748b" }}>
          <div>Flujo máximo: <strong style={{ color:"#1e3a8a" }}>{reportes[0]?.flujo} GPM</strong></div>
        </div>
      </div>

      {secciones.map(sec => {
        const filas = sec.keys.map(k => ({ key: k, info: getInfo(k) })).filter(x => x.info);
        if (!filas.length) return null;
        const color = colores[sec.titulo];
        return (
          <div key={sec.titulo} style={{ marginBottom:"2rem" }}>
            {/* Header de sección */}
            <div style={{ background:color, color:"#fff", padding:"6px 14px", borderRadius:"4px", fontSize:"0.75rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"0" }}>
              {sec.titulo}
            </div>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"0.82rem" }}>
              <thead>
                <tr style={{ background:"#f8fafc", borderBottom:"2px solid #e2e8f0" }}>
                  <th style={{ padding:"8px 10px", textAlign:"center", color:"#64748b", fontWeight:600, width:"40px", borderRight:"1px solid #e2e8f0" }}>#</th>
                  <th style={{ padding:"8px 10px", textAlign:"left",   color:"#64748b", fontWeight:600, borderRight:"1px solid #e2e8f0" }}>Descripción</th>
                  <th style={{ padding:"8px 10px", textAlign:"left",   color:"#64748b", fontWeight:600, borderRight:"1px solid #e2e8f0" }}>Marca</th>
                  <th style={{ padding:"8px 10px", textAlign:"left",   color:"#64748b", fontWeight:600, borderRight:"1px solid #e2e8f0" }}>Modelo</th>
                  <th style={{ padding:"8px 10px", textAlign:"center", color:"#64748b", fontWeight:600, borderRight:"1px solid #e2e8f0", width:"70px" }}>Cant.</th>
                  <th style={{ padding:"8px 10px", textAlign:"center", color:"#64748b", fontWeight:600, borderRight:"1px solid #e2e8f0", width:"90px" }}>Flujo total</th>
                  <th style={{ padding:"8px 10px", textAlign:"center", color:"#64748b", fontWeight:600, width:"80px" }}>CDT</th>
                </tr>
              </thead>
              <tbody>
                {filas.map(({ key, info }, i) => {
                  itemNum++;
                  return (
                    <tr key={key} style={{ borderBottom:"1px solid #e2e8f0", background: i%2===0?"#fff":"#f8fafc" }}>
                      <td style={{ padding:"9px 10px", textAlign:"center", color:"#94a3b8", fontWeight:600, fontSize:"0.75rem", borderRight:"1px solid #e2e8f0" }}>{itemNum}</td>
                      <td style={{ padding:"9px 10px", textAlign:"left",   color:"#1e293b", fontWeight:600, borderRight:"1px solid #e2e8f0" }}>{nombres[key]}</td>
                      <td style={{ padding:"9px 10px", textAlign:"left",   color:"#475569", borderRight:"1px solid #e2e8f0" }}>{info.marca}</td>
                      <td style={{ padding:"9px 10px", textAlign:"left",   color:"#475569", borderRight:"1px solid #e2e8f0", fontFamily:"monospace", fontSize:"0.8rem" }}>{info.modelo}</td>
                      <td style={{ padding:"9px 10px", textAlign:"center", color:"#1e293b", fontWeight:700, borderRight:"1px solid #e2e8f0" }}>{info.cantidad}</td>
                      <td style={{ padding:"9px 10px", textAlign:"center", color:"#475569", borderRight:"1px solid #e2e8f0" }}>{info.flujo}</td>
                      <td style={{ padding:"9px 10px", textAlign:"center", color:color,     fontWeight:700 }}>{info.cdt}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}

      <div style={{ borderTop:"2px solid #e2e8f0", paddingTop:"0.75rem", marginTop:"0.5rem", fontSize:"0.72rem", color:"#94a3b8", textAlign:"center" }}>
        Generado por PoolMetric · Los valores de CDT corresponden al diseño original del sistema
      </div>
    </div>
  );
}

/* ═══════════ TAB EXPLOSIÓN DE MATERIALES — todas las tablas juntas ═══════════ */
function TabExplosionMateriales({ reportes }) {
  const [expandidos, setExpandidos] = useState({});
  const toggle = (key) => setExpandidos(prev => ({ ...prev, [key]: !prev[key] }));

  // Usar siempre iteración 2 (índice 2) — punto de operación real
  const r = reportes[2] ?? reportes[reportes.length - 1];
  if (!r) return null;

  const definicion = [
    { key:"retorno",             label:"Retornos"           },
    { key:"desnatador",          label:"Desnatadores"       },
    { key:"barredora",           label:"Barredoras"         },
    { key:"drenFondo",           label:"Drenes de fondo"    },
    { key:"drenCanal",           label:"Drenes de canal"    },
    { key:"filtroArena",         label:"Filtro de arena"    },
    { key:"prefiltro",           label:"Prefiltro"          },
    { key:"filtroCartucho",      label:"Filtro de cartucho" },
    { key:"cloradorSalino",      label:"Cloro salino"       },
    { key:"lamparaUV",           label:"Lámpara UV"         },
    { key:"cloradorAutomatico",  label:"Clorador automático"},
    { key:"bombaCalor",          label:"Bomba de calor"     },
    { key:"panelSolar",          label:"Panel solar"        },
    { key:"caldera",             label:"Caldera de gas"     },
    { key:"calentadorElectrico", label:"Calent. eléctrico"  },
  ];

  // Extraer resumen de materiales de cada equipo (solo tubería, tees, codos, reducciones)
  const extraerMateriales = (key) => {
    const data = getEquipoData(r, key);
    if (!data) return null;
    // Empotrables tienen resumenTramos + resumenDisparos + tablaDistanciaCM
    // Filtros y calentamiento tienen resumenMateriales
    const acum = {}; // { "tuberia X.XX": { tuberia_m, tees, codos, reducciones } }

    const sumar = (obj) => {
      if (!obj) return;
      // resumenTramos es objeto { "tuberia X": {...} }
      // resumenMateriales es array [{ tuberia, tuberia_m, tees, codos, reducciones }]
      const entries = Array.isArray(obj)
        ? obj.map(row => [row.tuberia, row])
        : Object.entries(obj);
      for (const [diam, vals] of entries) {
        if (!acum[diam]) acum[diam] = { tuberia_m: 0, tees: 0, codos: 0, reducciones: 0 };
        acum[diam].tuberia_m  += parseFloat(vals.tuberia_m  ?? 0);
        acum[diam].tees       += parseInt(vals.tees         ?? 0);
        acum[diam].codos      += parseInt(vals.codos        ?? 0);
        acum[diam].reducciones+= parseInt(vals.reducciones  ?? 0);
      }
    };

    // resumenTramos ya incluye el tramo de cuarto de máquinas (lo suma retorno.js internamente)
    // resumenDisparos incluye los disparos al empotrable
    sumar(data.resumenTramos);
    sumar(data.resumenDisparos);
    sumar(data.resumenMateriales);
    return Object.keys(acum).length ? acum : null;
  };

  // Construir lista de equipos con sus materiales
  const equiposConMat = definicion
    .map(eq => ({ ...eq, mat: extraerMateriales(eq.key) }))
    .filter(eq => eq.mat);

  if (!equiposConMat.length) return <p style={{ color:"#475569", fontSize:"0.78rem", padding:"1rem" }}>Sin materiales disponibles.</p>;

  // Acumulado global por diámetro
  const globalAcum = {};
  for (const eq of equiposConMat) {
    for (const [diam, vals] of Object.entries(eq.mat)) {
      if (!globalAcum[diam]) globalAcum[diam] = { tuberia_m: 0, tees: 0, codos: 0, reducciones: 0 };
      globalAcum[diam].tuberia_m  += vals.tuberia_m;
      globalAcum[diam].tees       += vals.tees;
      globalAcum[diam].codos      += vals.codos;
      globalAcum[diam].reducciones+= vals.reducciones;
    }
  }

  const thStyle = { padding:"7px 12px", color:"#94a3b8", fontWeight:600, border:"1px solid #1e3a5f", fontSize:"0.73rem", whiteSpace:"nowrap" };
  const tdM = (extra={}) => ({ ...td, ...extra });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1.5rem" }}>

      {/* ── Resumen global ── */}
      <div>
        <p style={{ ...tituloStyle, marginTop:0 }}>Resumen global de materiales</p>
        <table style={{ borderCollapse:"collapse", fontSize:"0.78rem", background:"#1e293b", border:"1px solid #334155", width:"100%" }}>
          <thead><tr style={{ background:"#0f172a" }}>
            <th style={{ ...thStyle, textAlign:"left" }}>Diámetro</th>
            <th style={thStyle}>Tubería (m)</th>
            <th style={thStyle}>Tees</th>
            <th style={thStyle}>Codos</th>
            <th style={thStyle}>Reducciones</th>
          </tr></thead>
          <tbody>
            {Object.entries(globalAcum)
              .sort((a,b) => parseFloat(a[0].replace("tuberia ","")) - parseFloat(b[0].replace("tuberia ","")))
              .map(([diam, vals], i) => (
              <tr key={diam} style={{ background: i%2===0?"rgba(15,23,42,0.4)":"rgba(30,41,59,0.4)" }}>
                <td style={{ ...tdM({ textAlign:"left", color:"#e2e8f0", fontWeight:600 }) }}>{diam.replace("tuberia ","") + '"'}</td>
                <td style={tdM()}>{f2(vals.tuberia_m)} m</td>
                <td style={tdM({ color: vals.tees        > 0 ? "#38bdf8" : "#334155" })}>{vals.tees        || "—"}</td>
                <td style={tdM({ color: vals.codos       > 0 ? "#38bdf8" : "#334155" })}>{vals.codos       || "—"}</td>
                <td style={tdM({ color: vals.reducciones > 0 ? "#fbbf24" : "#334155" })}>{vals.reducciones || "—"}</td>
              </tr>
            ))}
            {/* Fila total tubería */}
            <tr style={{ background:"#0c2340", borderTop:"2px solid #1e4a7a" }}>
              <td style={{ ...tdM({ textAlign:"left", color:"#60a5fa", fontWeight:700 }) }}>TOTAL</td>
              <td style={{ ...tdM({ color:"#60a5fa", fontWeight:700 }) }}>
                {f2(Object.values(globalAcum).reduce((a,v)=>a+v.tuberia_m,0))} m
              </td>
              <td style={{ ...tdM({ color:"#60a5fa", fontWeight:700 }) }}>
                {Object.values(globalAcum).reduce((a,v)=>a+v.tees,0) || "—"}
              </td>
              <td style={{ ...tdM({ color:"#60a5fa", fontWeight:700 }) }}>
                {Object.values(globalAcum).reduce((a,v)=>a+v.codos,0) || "—"}
              </td>
              <td style={{ ...tdM({ color:"#60a5fa", fontWeight:700 }) }}>
                {Object.values(globalAcum).reduce((a,v)=>a+v.reducciones,0) || "—"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Desglose por equipo (colapsable) ── */}
      <div>
        <p style={{ ...tituloStyle, marginTop:0 }}>Desglose por equipo</p>
        <div style={{ display:"flex", flexDirection:"column", gap:"2px", border:"1px solid #1e3a5f", borderRadius:"6px", overflow:"hidden" }}>
          {equiposConMat.map((eq, idx) => (
            <div key={eq.key}>
              {/* Header colapsable */}
              <button
                onClick={() => toggle(eq.key)}
                style={{
                  width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between",
                  padding:"8px 14px", background: expandidos[eq.key]?"rgba(96,165,250,0.08)":"rgba(15,23,42,0.4)",
                  border:"none", borderTop: idx>0?"1px solid #1e3a5f":"none",
                  color: expandidos[eq.key]?"#60a5fa":"#e2e8f0", cursor:"pointer",
                  fontSize:"0.78rem", fontWeight:600, transition:"background 0.15s",
                }}>
                <span>{eq.label}</span>
                <span style={{ display:"flex", alignItems:"center", gap:"1rem", fontSize:"0.7rem", color:"#64748b" }}>
                  {/* Mini resumen en la fila */}
                  {Object.entries(eq.mat)
                    .sort((a,b)=>parseFloat(a[0].replace("tuberia ",""))-parseFloat(b[0].replace("tuberia ","")))
                    .map(([d,v])=>(
                    <span key={d}>{d.replace("tuberia ","")+'"'}: {f2(v.tuberia_m)}m</span>
                  ))}
                  <span style={{ color: expandidos[eq.key]?"#60a5fa":"#475569", fontSize:"0.7rem" }}>
                    {expandidos[eq.key] ? "▲" : "▼"}
                  </span>
                </span>
              </button>
              {/* Contenido expandido */}
              {expandidos[eq.key] && (
                <div style={{ background:"rgba(15,23,42,0.6)", padding:"0.5rem 1rem 0.75rem" }}>
                  <table style={{ borderCollapse:"collapse", fontSize:"0.73rem", width:"100%" }}>
                    <thead><tr style={{ background:"#0f172a" }}>
                      <th style={{ ...thStyle, textAlign:"left" }}>Diámetro</th>
                      <th style={thStyle}>Tubería (m)</th>
                      <th style={thStyle}>Tees</th>
                      <th style={thStyle}>Codos</th>
                      <th style={thStyle}>Reducciones</th>
                    </tr></thead>
                    <tbody>
                      {Object.entries(eq.mat)
                        .sort((a,b)=>parseFloat(a[0].replace("tuberia ",""))-parseFloat(b[0].replace("tuberia ","")))
                        .map(([diam,vals],i)=>(
                        <tr key={diam} style={{ background: i%2===0?"rgba(15,23,42,0.3)":"transparent" }}>
                          <td style={{ ...tdM({ textAlign:"left", color:"#e2e8f0" }) }}>{diam.replace("tuberia ","")+'"'}</td>
                          <td style={tdM()}>{f2(vals.tuberia_m)} m</td>
                          <td style={tdM({ color: vals.tees        > 0?"#38bdf8":"#334155" })}>{vals.tees        || "—"}</td>
                          <td style={tdM({ color: vals.codos       > 0?"#38bdf8":"#334155" })}>{vals.codos       || "—"}</td>
                          <td style={tdM({ color: vals.reducciones > 0?"#fbbf24":"#334155" })}>{vals.reducciones || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
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
    // Calentamiento — aparece en todas las iteraciones
    { key:"bombaCalor",         label:"Bomba de calor",   tipo:"calentamiento" },
    { key:"panelSolar",         label:"Panel solar",      tipo:"calentamiento" },
    { key:"caldera",            label:"Caldera de gas",   tipo:"calentamiento" },
    { key:"calentadorElectrico",label:"Calent. eléctrico",tipo:"calentamiento" },
  ].filter(eq => reportes.some(r => getEquipoData(r, eq.key)));

  const tabs = [
    { label:"📊 Resumen",    comp: <TabResumen reportes={reportes} calentamiento={calentamiento} resumen={resumen} /> },
    { label:"🔧 Equipos",   comp: <TabEquiposConsiderar reportes={reportes} calentamiento={calentamiento} resumen={resumen} /> },
    { label:"📦 Materiales", comp: <TabExplosionMateriales reportes={reportes} /> },
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
        <div style={{ display:"flex", flexWrap:"wrap", gap:"20px", fontSize:"0.8rem", color:"#94a3b8", alignItems:"center" }}>
          {resumen.area   && parseFloat(resumen.area)   > 0 && <span><strong style={{ color:"#e2e8f0" }}>Área:</strong> {resumen.area} m²</span>}
          {resumen.vol    && parseFloat(resumen.vol)    > 0 && <span><strong style={{ color:"#e2e8f0" }}>Volumen:</strong> {resumen.vol} m³</span>}
          <span><strong style={{ color:"#38bdf8" }}>Flujo máximo:</strong> {resumen.flujoMax} GPM</span>
          {resumen.flujoFinal && <span><strong style={{ color:"#34d399" }}>Flujo operación:</strong> {resumen.flujoFinal} GPM</span>}
          {resumen.cdtFinal   && <span><strong style={{ color:"#34d399" }}>CDT operación:</strong> {resumen.cdtFinal} ft</span>}
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