import { useState, useEffect, useRef } from "react";

const FLUJO_MAX_CLORADOR_EN_LINEA = 90; // GPM
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
          {["#","Flujo (gpm)","Tubería (in)","Vel. (ft/s)","C.Base (fthd/100)","Long. (m)","C.Tramo (fthd)","Tees (pza.)","L.Tee (ft)","C.Tee (fthd)","Codos (pza.)","L.Codo (ft)","C.Codo (fthd)","Red. (pza.)","L.Red. (ft)","C.Red. (fthd)","Total (fthd)"].map(h => (
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
            <td colSpan={16} style={{ ...td, textAlign:"right", color:"#93c5fd", fontWeight:700 }}>Σ tramos (fthd):</td>
            <td style={{ ...td, color:"#93c5fd", fontWeight:700 }}>{f2(suma)} fthd</td>
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
              {["Flujo (GPM)","Tubería (in)","Vel. (ft/s)","C.Base (fthd/100)","Long. (m)","C.Tramo (fthd)","Codos (pza.)","L.Codo (ft)","C.Codo (fthd)","Total (fthd)"].map(h => (
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
              {["Flujo (GPM)","Tubería (in)","Vel. (ft/s)","C.Base (fthd/100)","Long. (m)","C.Tramo (fthd)","Codos (pza.)","L.Codo (ft)","C.Codo (fthd)","Red. (pza.)","L.Red. (ft)","C.Red. (fthd)","Total (fthd)"].map(h => (
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
              {["Diámetro (in)","Tubería (m)","Tees (pza.)","Codos (pza.)","Red. (pza.)"].map(h=>(
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
              <tr><td style={{ ...td, textAlign:"left", color:"#94a3b8", fontWeight:600 }}>Σ tramos (fthd):</td><td style={td}>{f2(sumaTramos)} fthd</td></tr>
              <tr><td style={{ ...td, textAlign:"left", color:"#94a3b8", fontWeight:600 }}>Cuarto de máquinas (fthd):</td><td style={td}>{f2(cmVal)} fthd</td></tr>
              {disparo && <tr><td style={{ ...td, textAlign:"left", color:"#94a3b8", fontWeight:600 }}>Disparos (fthd):</td><td style={td}>{f2(cargaDisparoTotal)} fthd</td></tr>}
              <tr><td style={{ ...td, textAlign:"left", color:"#94a3b8", fontWeight:600 }}>Accesorio (fthd):</td><td style={td}>1.50 fthd</td></tr>
              <tr style={{ background:"#0c2340" }}><td style={{ ...td, textAlign:"left", color:"#60a5fa", fontWeight:700 }}>CDT total (fthd):</td><td style={{ ...td, color:"#60a5fa", fontWeight:700 }}>{f2(cargaDinamicaTotal)} fthd</td></tr>
              <tr><td style={{ ...td, textAlign:"left", color:"#94a3b8", fontWeight:600 }}>CDT total (PSI):</td><td style={td}>{f2(parseFloat(cargaDinamicaTotal) * 0.43353)} PSI</td></tr>
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
              <tr><td style={{ ...td, textAlign:"left", color:"#94a3b8", fontWeight:600 }}>Σ tramos (fthd):</td><td style={td}>{f2(data.cargaTramos)} fthd</td></tr>
              <tr><td style={{ ...td, textAlign:"left", color:"#94a3b8", fontWeight:600 }}>Carga fija (fthd):</td><td style={td}>{f2(data.cargaFija)} fthd</td></tr>
              <tr style={{ background:"#0c2340" }}><td style={{ ...td, textAlign:"left", color:"#60a5fa", fontWeight:700 }}>CDT total (fthd):</td><td style={{ ...td, color:"#60a5fa", fontWeight:700 }}>{f2(data.cargaTotal)} fthd</td></tr>
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
                  {["","Flujo (GPM)","Tubería (in)","Vel. (ft/s)","C.Base (fthd/100)","Dist. (m)","C.Tramo (fthd)","Codos (pza.)","C.Codo (fthd)","Total (fthd)"].map(h => (
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
                  {["Altura equipo (m)","Altura máx. sistema (m)","Carga estática","Flujo (GPM)","Tubería (in)","C.Base (fthd/100)","C.Estática (fthd)","C.Fricción (fthd)","Total (fthd)"].map(h => (
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
              <tr><td style={{ ...td, textAlign:"left", color:"#94a3b8", fontWeight:600 }}>Σ tramos (fthd):</td><td style={td}>{f2(data.cargaTramos)} fthd</td></tr>
              {data.cargaDistanciaIda  != null && <tr><td style={{ ...td, textAlign:"left", color:"#94a3b8", fontWeight:600 }}>Cuarto máq. ida (fthd):</td><td style={td}>{f2(data.cargaDistanciaIda)} fthd</td></tr>}
              {data.cargaDistanciaReg  != null && <tr><td style={{ ...td, textAlign:"left", color:"#94a3b8", fontWeight:600 }}>Cuarto máq. reg. (fthd):</td><td style={td}>{f2(data.cargaDistanciaReg)} fthd</td></tr>}
              {data.cargaEstatica      != null && parseFloat(data.cargaEstatica) > 0 && <tr><td style={{ ...td, textAlign:"left", color:"#94a3b8", fontWeight:600 }}>Carga estática (fthd):</td><td style={td}>{f2(data.cargaEstatica)} fthd</td></tr>}
              {data.cargaFriccion      != null && <tr><td style={{ ...td, textAlign:"left", color:"#94a3b8", fontWeight:600 }}>Fricción altura (fthd):</td><td style={td}>{f2(data.cargaFriccion)} fthd</td></tr>}
              {data.cargaFija          != null && <tr><td style={{ ...td, textAlign:"left", color:"#94a3b8", fontWeight:600 }}>Carga fija (fthd):</td><td style={td}>{f2(data.cargaFija)} fthd</td></tr>}
              <tr style={{ background:"#0c2340" }}><td style={{ ...td, textAlign:"left", color:"#60a5fa", fontWeight:700 }}>CDT total (fthd):</td><td style={{ ...td, color:"#60a5fa", fontWeight:700 }}>{f2(data.cargaTotal)} fthd</td></tr>
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
  const reportesValidos = reportes.filter(Boolean);
  const [subTab, setSubTab] = useState(0);

  const reporte = reportesValidos[subTab];
  const data    = reporte ? getEquipoData(reporte, equipoKey) : null;

  return (
    <div style={{ display:"flex", flexDirection:"column" }}>
      {/* ── Pestañas de carpeta ── */}
      <div style={{ display:"flex", alignItems:"flex-end", gap:"3px", paddingLeft:"4px" }}>
        {reportesValidos.map((rep, i) => {
          const c      = ITER_CONFIG[i];
          const activa = subTab === i;
          return (
            <button
              key={i}
              onClick={() => setSubTab(i)}
              style={{
                padding: "6px 18px 8px",
                fontSize: "0.72rem",
                fontWeight: activa ? 700 : 500,
                color: activa ? c.textColor : "#64748b",
                background: activa
                  ? `rgba(15,23,42,0.85)`
                  : `rgba(15,23,42,0.3)`,
                border: `1px solid ${activa ? c.border : "#1e3a5f"}`,
                borderBottom: activa ? `1px solid rgba(15,23,42,0.85)` : "1px solid #1e3a5f",
                borderRadius: "6px 6px 0 0",
                cursor: "pointer",
                transition: "all 0.15s",
                position: "relative",
                top: "1px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                letterSpacing: "0.04em",
              }}
            >
              <span style={{
                width: "8px", height: "8px", borderRadius: "50%",
                background: activa ? c.textColor : "#334155",
                display: "inline-block", flexShrink: 0,
                boxShadow: activa ? `0 0 6px ${c.textColor}` : "none",
                transition: "all 0.15s",
              }} />
              {c.label}
              <span style={{ fontSize:"0.65rem", color: activa ? "#94a3b8" : "#334155", fontWeight:400 }}>
                {f2(rep.flujo)} GPM
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Contenido de la sub-pestaña activa ── */}
      {reporte && (() => {
        const c = ITER_CONFIG[subTab];
        return (
          <div style={{
            border: `1px solid ${c.border}`,
            borderRadius: subTab === 0 ? "0 8px 8px 8px" : "8px",
            overflow: "hidden",
            background: "rgba(15,23,42,0.85)",
          }}>
            {/* Mini header informativo */}
            <div style={{
              background: c.bg,
              borderBottom: `1px solid ${c.border}`,
              padding: "0.4rem 1rem",
              display: "flex", alignItems: "center", gap: "1.2rem",
            }}>
              <span style={{ fontSize:"0.68rem", fontWeight:700, color:c.textColor, textTransform:"uppercase", letterSpacing:"0.07em" }}>
                {c.label}
              </span>
              <span style={{ fontSize:"0.68rem", color:"#94a3b8" }}>
                Flujo: <strong style={{ color:"#38bdf8" }}>{f2(reporte.flujo)} GPM</strong>
              </span>
            </div>
            <div style={{ padding:"1rem" }}>
              {tipoRender === "empotrable"
                ? <ContenidoEmpotrable data={data} tituloTramos={tituloTramos} sufijoCM={sufijoCM} tituloDisparo={tituloDisparo} />
                : tipoRender === "calentamiento"
                ? <ContenidoCalentamiento data={data} />
                : <ContenidoFiltro data={data} />
              }
            </div>
          </div>
        );
      })()}
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
  const equiposOrden = ["bombaCalor","panelSolar","caldera","calentadorElectrico","cloradorSalino","cloradorAutomatico","lamparaUV","prefiltro","filtroArena","filtroCartucho","retorno","desnatador","drenCanal","drenFondo","barredora"];
  const nombresEq = {
    bombaCalor:          "Bomba de calor",
    panelSolar:          "Panel solar",
    caldera:             "Caldera de gas",
    calentadorElectrico: "Calentador eléctrico",
    cloradorSalino:      "Generador de cloro salino",
    cloradorAutomatico:  "Clorador automático",
    lamparaUV:           "Lámpara UV",
    filtroArena:         "Filtro de arena",
    prefiltro:           "Prefiltro",
    filtroCartucho:      "Filtro de cartucho",
    retorno:             "Retorno",
    desnatador:          "Desnatador",
    drenCanal:           "Dren de canal",
    drenFondo:           "Dren de fondo",
    barredora:           "Barredora",
  };

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

const equiposPresentes = equiposOrden.filter(k => {
  if (["bombaCalor","panelSolar","caldera","calentadorElectrico"].includes(k)) {
    return Array.isArray(calentamiento) && calentamiento.some(c => c?.key === k);
  }
  return reportes.some(r => {
    const d = getEquipoData(r, k);
    if (!d) return false;
    return true;
  });
});
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
            <div style={{ fontSize:"0.78rem", color:"#64748b", marginTop:"2px" }}>{resumen.cdtDiseno} fthd · {f2(parseFloat(resumen.cdtDiseno) * 0.43353)} PSI</div>
          </div>
          {/* Flecha */}
          <div style={{ display:"flex", alignItems:"center", padding:"0 0.5rem", color:"#334155", fontSize:"1.2rem" }}>→</div>
          {/* Iter 1 */}
          <div style={{ flex:1, padding:"1rem", borderRight:"1px solid #1e3a5f", background:"rgba(14,116,144,0.08)" }}>
            <div style={{ fontSize:"0.65rem", color:"#67e8f9", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"0.5rem" }}>Iteración 1</div>
            <div style={{ fontSize:"1.1rem", fontWeight:800, color:"#67e8f9" }}>{resumen.flujoIter1} <span style={{ fontSize:"0.7rem", fontWeight:400 }}>GPM</span></div>
            <div style={{ fontSize:"0.78rem", color:"#0891b2", marginTop:"2px" }}>{resumen.cdtIter1} fthd · {f2(parseFloat(resumen.cdtIter1) * 0.43353)} PSI</div>
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
            <div style={{ fontSize:"0.78rem", color:"#16a34a", marginTop:"2px" }}>{resumen.cdtIter2} fthd · {f2(parseFloat(resumen.cdtIter2) * 0.43353)} PSI</div>
          </div>
          )}
        </div>
      </div>
      )}

      {/* ── Tabla de requerimientos de flujo por proceso/sistema ── */}
      {resumen.flujosRequeridos?.length > 0 && (
      <div>
        <p style={{ ...tituloStyle, marginTop:0 }}>Requerimientos de flujo por proceso (GPM)</p>
<table style={{ borderCollapse:"collapse", fontSize:"0.73rem", background:"#1e293b", border:"1px solid #334155", width:"100%" }}>
  <thead><tr style={{ background:"#0f172a" }}>
    <th style={{ ...td, textAlign:"left", color:"#94a3b8", fontWeight:600, padding:"5px 10px" }}>Sistema / Proceso</th>
    <th style={{ ...td, color:"#94a3b8", fontWeight:600, padding:"5px 10px", width:"100px" }}>Flujo (GPM)</th>
    <th style={{ ...td, color:"#94a3b8", fontWeight:600, padding:"5px 10px", width:"80px" }}>Nota</th>
  </tr></thead>
  <tbody>
    {resumen.flujosRequeridos.map((item, ri) => {
      const esNull     = item.valor == null;
      const esExcluido = item.excluido === true;
      const esMáx      = !esExcluido && item.valor != null
        && Math.abs(parseFloat(item.valor) - parseFloat(resumen.flujoMax)) < 0.01;
      return (
        <tr key={ri} style={{ background: ri%2===0?"rgba(15,23,42,0.4)":"rgba(30,41,59,0.4)", opacity: esExcluido ? 0.5 : 1 }}>
          <td style={{ ...td, textAlign:"left", fontWeight: esMáx?600:400, color: esExcluido?"#475569": esMáx?"#60a5fa":"#e2e8f0", padding:"4px 10px" }}>
            {item.label}
          </td>
          <td style={{ ...td, color: esExcluido?"#475569": esNull?"#475569": esMáx?"#60a5fa":"#38bdf8", fontWeight: esMáx?600:400, padding:"4px 10px" }}>
            {esNull
              ? <span style={{fontSize:"0.68rem",color:"#475569"}}>— flujo máx</span>
              : f2(item.valor)+" GPM"
            }
          </td>
          <td style={{ ...td, fontSize:"0.68rem", padding:"4px 10px" }}>
            {esMáx     && <span style={{color:"#60a5fa",fontWeight:700}}>↑ máximo</span>}
            {esExcluido && <span style={{color:"#f97316",fontWeight:600}}>excluido — {">"}{FLUJO_MAX_CLORADOR_EN_LINEA} GPM</span>}
          </td>
        </tr>
      );
    })}
    <tr style={{ background:"#0c2340", borderTop:"2px solid #1e4a7a" }}>
      <td style={{ ...td, textAlign:"left", color:"#60a5fa", fontWeight:700, padding:"5px 10px" }}>Flujo máximo global</td>
      <td style={{ ...td, color:"#60a5fa", fontWeight:700, padding:"5px 10px" }}>{resumen.flujoMax} GPM</td>
      <td style={{ ...td, padding:"5px 10px" }}></td>
    </tr>
  </tbody>
</table>
      </div>
      )}

      {/* ── Tabla comparativa de CDT ── */}
      <div>
        <p style={{ ...tituloStyle, marginTop:0 }}>Relación de cargas por equipo (fthd)</p>
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
                    // Calentamiento: la carga viene del array calentamiento, no de reportes
                    if (["bombaCalor","panelSolar","caldera","calentadorElectrico"].includes(key)) {
                      const item = Array.isArray(calentamiento) ? calentamiento.find(c => c?.key === key) : null;
                      const v = item?.cargaTotal != null ? parseFloat(item.cargaTotal) : null;
                      const noSuma = false;
                      return <td key={i} style={{ ...td, color: v==null?"#334155":"#fbbf24", padding:"6px 12px", textAlign:"center" }}>
                        <span>{v!=null ? f2(v)+" fthd" : "—"}</span>
                      </td>;
                    }
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
                    const esExcluidoCA = key === "cloradorAutomatico"
                      && (r?.sanitizacion?.cloradorAutomatico?.excluido === true
                        || r?.equilibrio?.equipos?.cloradorAutomatico?.excluido === true);
                    return <td key={i} style={{
                      ...td,
                      color: v==null ? "#334155" : esExcluidoCA ? "#475569" : noSuma ? "#475569" : "#60a5fa",
                      padding:"6px 12px",
                      textAlign:"center",
                    }}>
                      <span style={{ display:"inline-flex", alignItems:"center", gap:"4px", justifyContent:"center" }}>
                        <span style={{ color: esExcluidoCA ? "#475569" : undefined }}>
                          {esExcluidoCA ? "—" : (v!=null ? f2(v)+" fthd" : "—")}
                        </span>
                        {esExcluidoCA && i > 0 && (
                          <span style={{ fontSize:"0.58rem", color:"#f97316", fontWeight:600 }}>excluido</span>
                        )}
                        {!esExcluidoCA && v!=null && noSuma && (
                          <span style={{ fontSize:"0.58rem", color:"#475569" }}>no suma</span>
                        )}
                        {!esExcluidoCA && v!=null && esSuccion && gobierna && (
                          <span style={{ fontSize:"0.58rem", color:"#34d399" }}>↑</span>
                        )}
                      </span>
                    </td>;
                  })}
                </tr>
              );
            })}
            {/* Fila CDT Total — usa los valores reales del equilibrio hidráulico */}
              <tr style={{ background:"#0c2340", borderTop:"2px solid #1e4a7a" }}>
              <td style={{ ...td, textAlign:"left", color:"#60a5fa", fontWeight:700, padding:"8px 12px" }}>CDT Total sistema</td>
              {[resumen.cdtDiseno, resumen.cdtIter1, resumen.cdtIter2].slice(0, reportes.filter(Boolean).length).map((cdt, i) => (
                <td key={i} style={{ ...td, color:"#60a5fa", fontWeight:700, padding:"8px 12px" }}>
                  <div>{cdt} fthd</div>
                  <div style={{ fontSize:"0.68rem", color:"#94a3b8", fontWeight:400 }}>{f2(parseFloat(cdt) * 0.43353)} PSI</div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>


    </div>
  );
}

/* ═══════════ TAB EQUIPOS — formato cotización ═══════════ */
function TabEquiposConsiderar({ reportes, calentamiento, resumen = {}, equiposConfirmados = null, estadosDiseno = null, specsEquipos = null, specsSanitizacion = null, specsCalentamiento = null }) {
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
    "Motobomba":                "#1d6fa8",
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

  const getInfoEmpotrable = (key, data, esDiseno) => {
    const sel = data?.seleccion;
    const conf = equiposConfirmados?.[key];
    // Diseño original → cantidad original antes del ajuste
    // Iteraciones → cantidad ajustada por el equilibrio
    const cantidad = esDiseno
      ? (conf?.cantOriginal ?? sel?.cantidad ?? "—")
      : (conf?.cantidad     ?? sel?.cantidad ?? "—");
    return {
      marca:    sel?.marca  ?? "—",
      modelo:   sel?.modelo ?? "—",
      cantidad,
    };
  };

  const getInfo = (key) => {
    if (key === "motobomba") {
      if (!resumen?.bomba || resumen.bomba === "—") return null;
      return {
        marca:    resumen.bombaMarca  ?? resumen.bomba?.split(" ")?.[0] ?? "—",
        modelo:   resumen.bombaModelo ?? resumen.bomba?.split(" ")?.slice(1).join(" ") ?? "—",
        cantidad: resumen.nBombas ?? 1,
      };
    }
    const data = getEquipoData(r, key);
    if (!data) return null;

    // Si el clorador está excluido en CUALQUIER reporte (flujo operación > 90 GPM), no mostrarlo
    if (key === "cloradorAutomatico") {
      const excluido = reportes.some(rep => getEquipoData(rep, "cloradorAutomatico")?.excluido === true);
      if (excluido) {
        const sel = data.seleccion ?? {};
        return {
          marca:    sel.marca    ?? "—",
          modelo:   sel.modelo   ?? "—",
          cantidad: sel.cantidad ?? "—",
          excluido: true,
        };
      }
    }

    const conf = equiposConfirmados?.[key];
    const sel  = data.seleccion ?? {};
    const cantidad = conf?.cantidad ?? sel?.cantidad ?? "—";
    const marca    = conf?.marca    ?? sel?.marca    ?? "—";
    const modelo   = conf?.modelo   ?? sel?.modelo   ?? "—";
    return { marca, modelo, cantidad };
  };

  const getSpec = (key) => {
    if (key === "motobomba") {
      const hp = resumen.bombaPotencia;
      return hp ? `${hp} HP` : null;
    }
    // specsEquipos tiene los specs capturados al momento de generar la memoria
    const sp = specsEquipos?.[key]?.spec ?? estadosDiseno?.[key]?.spec;
    const isEmp = ["retorno","desnatador","barredora","drenFondo","drenCanal"].includes(key);
    if (isEmp) return sp != null ? `${sp}"` : null;
    if (key === "filtroArena" || key === "prefiltro") {
      // Prioridad: diameter del recálculo (equiposConfirmados) > spec del estado > reporte
      const conf = equiposConfirmados?.[key];
      if (conf?.diameter != null) return `${conf.diameter}"`;
      if (sp != null) return `${sp}"`;
      const data = getEquipoData(r, key);
      const sp2 = data?.seleccion?.diameter ?? data?.seleccion?.spec;
      return sp2 != null ? `${sp2}"` : null;
    }
    if (key === "filtroCartucho") {
      const conf = equiposConfirmados?.[key];
      if (conf?.filtrationArea != null) return `${conf.filtrationArea} ft²`;
      if (sp != null) return `${sp} ft²`;
      const data = getEquipoData(r, key);
      const sp2 = data?.seleccion?.filtrationArea ?? data?.seleccion?.spec;
      return sp2 != null ? `${sp2} ft²` : null;
    }
    if (["cloradorSalino","cloradorAutomatico","lamparaUV"].includes(key)) {
      // Usar specsSanitizacion que viene directamente de memoriaCalculo
      const capStr = specsSanitizacion?.[key];
      if (capStr) return capStr;
      return sp != null ? `${sp}` : null;
    }
    if (["bombaCalor","panelSolar","caldera","calentadorElectrico"].includes(key)) {
      // Prioridad: specsCalentamiento precalculado > buscar en array
      if (specsCalentamiento?.[key]) return specsCalentamiento[key];
      const item = Array.isArray(calentamiento) ? calentamiento.find(c => c?.key === key) : null;
      const cap = item?.seleccion?.capUnitaria ?? item?.capUnitaria;
      return cap ? `${Math.round(cap).toLocaleString("es-MX")} BTU/h` : null;
    }
    return null;
  };

  // Header dinámico de especificación según sección
  const headerSpec = (secTitulo) => {
    if (secTitulo === "Motobomba") return "Potencia";
    if (secTitulo === "Empotrables e Hidráulica") return "Diámetro";
    if (secTitulo === "Filtración") return "Diámetro / Área";
    if (secTitulo === "Sanitización") return "Capacidad";
    if (secTitulo === "Calentamiento") return "Capacidad";
    return "Especificación";
  };

  let itemNum = 0;

return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1.5rem" }}>

      {secciones.map(sec => {
        const filas = sec.keys.map(k => ({ key: k, info: getInfo(k) })).filter(x => x.info);
        if (!filas.length) return null;
        const color = colores[sec.titulo] ?? "#64748b";
        return (
          <div key={sec.titulo}>
            {/* Header de sección estilo tituloStyle con badge de color */}
            <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"0" }}>
              <span style={{ display:"inline-block", width:"10px", height:"10px", borderRadius:"2px", background:color, flexShrink:0 }} />
              <p style={{ fontSize:"0.7rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:"#60a5fa", background:"#1e293b", border:"1px solid #334155", borderBottom:"none", padding:"4px 10px", borderRadius:"6px 6px 0 0", display:"inline-block", margin:0 }}>
                {sec.titulo}
              </p>
            </div>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"0.78rem", background:"#1e293b", border:"1px solid #334155" }}>
              <thead>
                <tr style={{ background:"#0f172a" }}>
                  <th style={{ padding:"7px 10px", textAlign:"center", color:"#94a3b8", fontWeight:600, width:"36px", border:"1px solid #334155" }}>#</th>
                  <th style={{ padding:"7px 10px", textAlign:"left",   color:"#94a3b8", fontWeight:600, width:"25%", border:"1px solid #334155" }}>Descripción</th>
                  <th style={{ padding:"7px 10px", textAlign:"left",   color:"#94a3b8", fontWeight:600, width:"18%", border:"1px solid #334155" }}>Marca</th>
                  <th style={{ padding:"7px 10px", textAlign:"left",   color:"#94a3b8", fontWeight:600, border:"1px solid #334155" }}>Modelo</th>
                  <th style={{ padding:"7px 10px", textAlign:"left",   color:"#94a3b8", fontWeight:600, width:"14%", border:"1px solid #334155" }}>{headerSpec(sec.titulo)}</th>
                  <th style={{ padding:"7px 10px", textAlign:"center", color:"#94a3b8", fontWeight:600, width:"60px", border:"1px solid #334155" }}>Cant.</th>
                </tr>
              </thead>
              <tbody>
                {filas.map(({ key, info }, i) => {
                  itemNum++;
                  return (
                    <tr key={key} style={{ background: i%2===0 ? "#1e293b" : "#162032", borderBottom:"1px solid #1e3a5f" }}>
                      <td style={{ padding:"8px 10px", textAlign:"center", color:"#475569", fontWeight:600, fontSize:"0.73rem", border:"1px solid #1e3a5f" }}>{itemNum}</td>
                      <td style={{ padding:"8px 10px", textAlign:"left", color: info.excluido ? "#475569" : "#e2e8f0", fontWeight:600, border:"1px solid #1e3a5f" }}>
                        {nombres[key]}
                        {info.excluido && <span style={{ marginLeft:"8px", fontSize:"0.68rem", fontWeight:600, color:"#ef4444", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:"4px", padding:"1px 6px" }}>excluido</span>}
                      </td>
                      <td style={{ padding:"8px 10px", textAlign:"left", color:"#94a3b8", border:"1px solid #1e3a5f" }}>{info.marca}</td>
                      <td style={{ padding:"8px 10px", textAlign:"left", color:"#cbd5e1", border:"1px solid #1e3a5f", fontFamily:"monospace", fontSize:"0.78rem" }}>{info.modelo}</td>
                      <td style={{ padding:"8px 10px", textAlign:"left", color:"#38bdf8", fontWeight:500, border:"1px solid #1e3a5f", fontSize:"0.76rem" }}>{getSpec(key, info) ?? "—"}</td>
                      <td style={{ padding:"8px 10px", textAlign:"center", color:"#e2e8f0", fontWeight:700, border:"1px solid #1e3a5f" }}>{info.cantidad}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}

<div style={{ borderTop:"1px solid #1e3a5f", paddingTop:"0.75rem", fontSize:"0.7rem", color:"#334155", textAlign:"center" }}>
        Generado por PoolMetric · Memoria de cálculo hidráulico
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

function TabPerfilTermico({ perfilTermico }) {
  const canvasPieRef = useRef(null);
  const canvasBarRef = useRef(null);

  if (!perfilTermico) return (
    <div style={{ padding:"2rem", color:"#475569", fontSize:"0.78rem", textAlign:"center" }}>
      No se configuró calentamiento en este proyecto.
    </div>
  );

  const { ciudad, tempDeseada, cubierta, techada, tablaClima = [], mesMasFrio,
          mesesCalentar = {}, perdidasBTU = {}, perdidaTotalBTU } = perfilTermico;

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

  const fmtBTU = (v) => Math.round(parseFloat(v) || 0).toLocaleString("es-MX");
  const total  = parseFloat(perdidaTotalBTU) || 0;

  const PERDIDAS = [
    { key:"evaporacion",  label:"Evaporación",       color:"rgba(30,64,175,0.85)"  },
    { key:"conveccion",   label:"Convección",         color:"rgba(56,189,248,0.85)" },
    { key:"radiacion",    label:"Radiación",          color:"rgba(251,113,133,0.85)"},
    { key:"transmision",  label:"Transmisión",        color:"rgba(163,163,163,0.85)"},
    { key:"infinity",     label:"Infinity",           color:"rgba(34,197,94,0.85)"  },
    { key:"canal",        label:"Canal perimetral",   color:"rgba(96,165,250,0.85)" },
    { key:"tuberia",      label:"+ Tubería",          color:"rgba(251,191,36,0.85)" },
  ].filter(p => (parseFloat(perdidasBTU[p.key]) || 0) > 0);

  const perdidaClima = ["evaporacion","conveccion","radiacion","transmision","infinity","canal"]
    .reduce((s, k) => s + (parseFloat(perdidasBTU[k]) || 0), 0);

  const MESES_CORTOS = {
    Enero:"Ene", Febrero:"Feb", Marzo:"Mar", Abril:"Abr", Mayo:"May",
    Junio:"Jun", Julio:"Jul", Agosto:"Ago", Septiembre:"Sep",
    Octubre:"Oct", Noviembre:"Nov", Diciembre:"Dic",
  };

  // ── Gráfica de pie con animación ──
  useEffect(() => {
    const canvas = canvasPieRef.current;
    if (!canvas || PERDIDAS.length === 0) return;
    const ctx = canvas.getContext("2d");
    const cx  = canvas.width / 2;
    const cy  = canvas.height / 2;
    const r   = Math.min(cx, cy) - 40;

    // Precalcular slices
    const slices = PERDIDAS.map(p => ({
      ...p,
      val:   parseFloat(perdidasBTU[p.key]) || 0,
      slice: ((parseFloat(perdidasBTU[p.key]) || 0) / total) * 2 * Math.PI,
    }));

    const DURACION = 800; // ms
    const inicio   = performance.now();

    const dibujar = (progreso) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const totalAngle = progreso * 2 * Math.PI;
      let startAngle   = -Math.PI / 2;
      let acumAngle    = 0;

      for (const s of slices) {
        if (acumAngle >= totalAngle) break;
        const sliceActual = Math.min(s.slice, totalAngle - acumAngle);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, startAngle, startAngle + sliceActual);
        ctx.closePath();
        ctx.fillStyle = s.color;
        ctx.fill();
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth   = 2;
        ctx.stroke();

        // Label solo cuando el slice está completo (progreso > umbral)
        const completoPct = (acumAngle + s.slice) / (2 * Math.PI);
        if (progreso >= completoPct && s.slice > 0.25) {
          const midAngle = startAngle + s.slice / 2;
          const lx = cx + (r * 0.62) * Math.cos(midAngle);
          const ly = cy + (r * 0.62) * Math.sin(midAngle);
          ctx.fillStyle = "#fff";
          ctx.font      = `bold ${Math.round(canvas.width / 28)}px system-ui`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`${((s.val / total) * 100).toFixed(0)}%`, lx, ly);
        }

        startAngle  += sliceActual;
        acumAngle   += sliceActual;
      }
    };

    let rafId;
    const animar = (ahora) => {
      const elapsed  = ahora - inicio;
      // Ease out cubic
      const t        = Math.min(elapsed / DURACION, 1);
      const progreso = 1 - Math.pow(1 - t, 3);
      dibujar(progreso);
      if (t < 1) rafId = requestAnimationFrame(animar);
    };

    rafId = requestAnimationFrame(animar);
    return () => cancelAnimationFrame(rafId);
  }, [perdidaTotalBTU, JSON.stringify(perdidasBTU)]);

  // ── Gráfica de barras ──
  const drawBarChart = (canvas) => {
    if (!canvas) return;
    const W = 1200, H = 480, PAD_L = 52, PAD_R = 20, PAD_T = 28, PAD_B = 56;
    canvas.width  = W;
    canvas.height = H;
    const ctx    = canvas.getContext("2d");
    const areaW  = W - PAD_L - PAD_R;
    const areaH  = H - PAD_T - PAD_B;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, W, H);

    const temps  = tablaClima.map(m => parseFloat(m.tProm));
    const minT   = Math.floor(Math.min(...temps, tempDeseada) - 3);
    const maxT   = Math.ceil( Math.max(...temps, tempDeseada) + 3);
    const n      = tablaClima.length;
    const gap    = areaW / n;
    const barW   = Math.floor(gap * 0.55);
    const yScale = (t) => PAD_T + areaH - ((t - minT) / (maxT - minT)) * areaH;
    const xBar   = (i) => PAD_L + gap * i + (gap - barW) / 2;

    // Cuadrícula
    const steps = 5;
    for (let s = 0; s <= steps; s++) {
      const t = minT + ((maxT - minT) / steps) * s;
      const y = yScale(t);
      ctx.strokeStyle = "#1e3a5f";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(PAD_L, y); ctx.lineTo(W - PAD_R, y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#475569";
      ctx.font = "11px system-ui";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(`${Math.round(t)}°`, PAD_L - 6, y);
    }

    // Línea temperatura deseada
    const yDes = yScale(tempDeseada);
    ctx.strokeStyle = "#34d399";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(PAD_L, yDes); ctx.lineTo(W - PAD_R, yDes); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#34d399";
    ctx.font = "bold 11px system-ui";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`Td ${tempDeseada}°C`, W - PAD_R - 72, yDes - 10);

    // Barras
    tablaClima.forEach((mes, i) => {
      const t    = parseFloat(mes.tProm);
      const x    = xBar(i);
      const yTop = yScale(t);
      const barH = yScale(minT) - yTop;
      const esMes    = mesMasFrio?.mes === mes.mes;
      const seCalien = mesesCalentar[mes.mes];
      const necesita = t < tempDeseada;

      let color = "#334155";
      if (esMes)                      color = "#f97316";
      else if (necesita && seCalien)  color = "#0891b2";
      else if (necesita)              color = "#1e40af";
      else                            color = "#166534";

      ctx.fillStyle = color;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x, yTop, barW, barH, [3, 3, 0, 0]);
      } else {
        ctx.rect(x, yTop, barW, barH);
      }
      ctx.fill();

      // Temperatura encima
      ctx.fillStyle = esMes ? "#f97316" : "#94a3b8";
      ctx.font = `${esMes ? "bold " : ""}11px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(`${t}°`, x + barW / 2, yTop - 2);

      // Estrella mes más frío
      if (esMes) {
        ctx.fillStyle = "#f97316";
        ctx.font = "12px system-ui";
        ctx.textBaseline = "bottom";
        ctx.fillText("★", x + barW / 2, yTop - 14);
      }

      // Nombre mes
      ctx.fillStyle = esMes ? "#f97316" : "#64748b";
      ctx.font = `${esMes ? "bold " : ""}11px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(MESES_CORTOS[mes.mes] ?? mes.mes.slice(0,3), x + barW / 2, yScale(minT) + 7);
    });

    // Eje X
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD_L, yScale(minT)); ctx.lineTo(W - PAD_R, yScale(minT)); ctx.stroke();
  };

  const thS = { padding:"6px 10px", color:"#94a3b8", fontWeight:600, border:"1px solid #334155", fontSize:"0.7rem", whiteSpace:"nowrap" };
  const tdS = (extra={}) => ({ padding:"5px 8px", border:"1px solid #1e3a5f", color:"#cbd5e1", textAlign:"center", fontSize:"0.72rem", verticalAlign:"middle", ...extra });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1.5rem" }}>

      {/* ── 1. Tabla de parámetros de diseño — ancho completo ── */}
      <div>
        <p style={tituloStyle}>Parámetros del diseño térmico</p>
        <div style={{ background:"#1e293b", border:"1px solid #334155", borderRadius:"0 6px 6px 6px", overflow:"hidden" }}>
          <table style={{ borderCollapse:"collapse", fontSize:"0.73rem", width:"100%" }}>
            <thead>
              <tr style={{ background:"#0f172a" }}>
                {["Parámetro","Valor","Descripción"].map(h => (
                  <th key={h} style={{ padding:"7px 12px", color:"#94a3b8", fontWeight:600, border:"1px solid #334155", textAlign:"left", fontSize:"0.7rem" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { param:"Ciudad", val: NOMBRES_CIUDAD[ciudad] ?? ciudad, desc:"Ubicación geográfica del proyecto" },
                { param:"Temperatura deseada (Td)", val:`${tempDeseada} °C`, desc:"Temperatura objetivo del agua de la alberca" },
                { param:"Temperatura ambiente diseño (Ta)", val: mesMasFrio ? `${mesMasFrio.tProm} °C` : "—", desc:`Temperatura promedio del mes más frío (${mesMasFrio?.mes ?? "—"})` },
                { param:"ΔT de diseño", val: mesMasFrio ? `${(tempDeseada - parseFloat(mesMasFrio.tProm)).toFixed(1)} °C` : "—", desc:"Diferencia Td − Ta — mayor ΔT implica mayor demanda energética" },
                { param:"Cubierta térmica nocturna", val: cubierta ? "Sí" : "No", desc: cubierta ? "Reduce pérdidas por evaporación y convección hasta ~50%" : "Sin cubierta — pérdidas máximas en horas nocturnas" },
                { param:"Alberca techada", val: techada ? "Sí" : "No", desc: techada ? "Protegida del viento directo — menor convección" : "Expuesta al exterior — convección libre por viento" },
                { param:"Velocidad de viento de diseño", val: mesMasFrio?.viento ?? "—", desc:"Velocidad usada para calcular pérdidas por convección forzada" },
                { param:"Humedad relativa de diseño", val: mesMasFrio ? `${mesMasFrio.humedad}%` : "—", desc:"Humedad del mes más frío — afecta la tasa de evaporación" },
                { param:"Pérdida total del sistema", val:`${Math.round(parseFloat(perdidaTotalBTU)||0).toLocaleString("es-MX")} BTU/h`, desc:"Capacidad mínima requerida del equipo de calentamiento" },
              ].map(({ param, val, desc }, i) => (
                <tr key={param} style={{ background: i%2===0 ? "#1e293b" : "#162032" }}>
                  <td style={{ padding:"7px 12px", border:"1px solid #1e3a5f", color:"#e2e8f0", fontWeight:600, fontSize:"0.73rem", whiteSpace:"nowrap" }}>{param}</td>
                  <td style={{ padding:"7px 12px", border:"1px solid #1e3a5f", color:"#38bdf8", fontWeight:700, fontSize:"0.78rem", whiteSpace:"nowrap" }}>{val}</td>
                  <td style={{ padding:"7px 12px", border:"1px solid #1e3a5f", color:"#64748b", fontSize:"0.7rem", lineHeight:1.5 }}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

{/* ── 2. Gráficas lado a lado — misma altura ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem", alignItems:"stretch" }}>

        {/* Gráfica de barras */}
        <div style={{ display:"flex", flexDirection:"column" }}>
          <p style={tituloStyle}>Temperatura promedio mensual vs Td</p>
          <div style={{ background:"#1e293b", border:"1px solid #334155", borderRadius:"0 6px 6px 6px", padding:"0.75rem", display:"flex", flexDirection:"column", flex:1 }}>
            <div style={{ flex:1, minHeight:0 }}>
              <canvas
                ref={drawBarChart}
                style={{ width:"100%", height:"100%", borderRadius:"4px", display:"block" }}
              />
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"0.5rem", marginTop:"0.6rem" }}>
              {[
                { color:"#f97316", label:"Mes de diseño" },
                { color:"#0891b2", label:"Requiere calent. — seleccionado" },
                { color:"#1e40af", label:"Requiere calent. — no seleccionado" },
                { color:"#166534", label:"No requiere calentamiento" },
              ].map(({ color, label }) => (
                <span key={label} style={{ display:"flex", alignItems:"center", gap:"4px", fontSize:"0.65rem", color:"#64748b" }}>
                  <span style={{ width:"9px", height:"9px", background:color, borderRadius:"2px", display:"inline-block", flexShrink:0 }} />
                  {label}
                </span>
              ))}
              <span style={{ display:"flex", alignItems:"center", gap:"4px", fontSize:"0.65rem", color:"#64748b" }}>
                <span style={{ width:"16px", height:"2px", borderTop:"2px dashed #34d399", display:"inline-block", flexShrink:0 }} />
                Temperatura deseada
              </span>
            </div>
          </div>
        </div>

        {/* Gráfica de pie */}
        <div style={{ display:"flex", flexDirection:"column" }}>
          <p style={tituloStyle}>Distribución de pérdidas</p>
          <div style={{ background:"#1e293b", border:"1px solid #334155", borderRadius:"0 6px 6px 6px", padding:"0.75rem 0.75rem 0.5rem", display:"flex", flexDirection:"column", flex:1 }}>
            {/* Canvas centrado y grande */}
            <div style={{ display:"flex", justifyContent:"center", flex:1, minHeight:0 }}>
              <canvas
                ref={canvasPieRef}
                width={480}
                height={480}
                style={{ width:"100%", maxWidth:"340px", height:"auto" }}
              />
            </div>
            {/* Leyenda compacta abajo */}
            <div style={{ display:"flex", flexDirection:"column", gap:"0.2rem", marginTop:"0.5rem" }}>
              {PERDIDAS.map(p => {
                const val = parseFloat(perdidasBTU[p.key]) || 0;
                const pct = total > 0 ? (val/total*100).toFixed(1) : "0.0";
                return (
                  <div key={p.key} style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"0.68rem" }}>
                    <span style={{ width:"10px", height:"10px", borderRadius:"2px", background:p.color, display:"inline-block", flexShrink:0 }} />
                    <span style={{ flex:1, color:"#94a3b8" }}>{p.label}</span>
                    <span style={{ color:"#e2e8f0", fontWeight:600, fontVariantNumeric:"tabular-nums" }}>{fmtBTU(val)}</span>
                    <span style={{ color:"#475569", width:"40px", textAlign:"right", fontVariantNumeric:"tabular-nums" }}>{pct}%</span>
                  </div>
                );
              })}
              <div style={{ borderTop:"1px solid #1e3a5f", paddingTop:"0.3rem", marginTop:"0.1rem", display:"flex", alignItems:"center", gap:"6px", fontSize:"0.7rem" }}>
                <span style={{ width:"10px", height:"10px", display:"inline-block", flexShrink:0 }} />
                <span style={{ flex:1, color:"#60a5fa", fontWeight:700 }}>Total</span>
                <span style={{ color:"#60a5fa", fontWeight:700, fontVariantNumeric:"tabular-nums" }}>{fmtBTU(total)}</span>
                <span style={{ color:"#60a5fa", width:"40px", textAlign:"right", fontWeight:700 }}>100%</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── 3. Tablas debajo de las gráficas — mismo grid ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem", alignItems:"start" }}>

        {/* Tabla climática mensual */}
        <div>
          <p style={tituloStyle}>Tabla climática mensual</p>
          <div style={{ background:"#1e293b", border:"1px solid #334155", borderRadius:"0 6px 6px 6px", overflow:"hidden" }}>
            <table style={{ borderCollapse:"collapse", fontSize:"0.7rem", width:"100%" }}>
              <thead>
                <tr style={{ background:"#0f172a" }}>
                  {["Mes","T° Min","T° Prom","T° Max","HR%","Viento","Pérdida (BTU/h)","Calent."].map(h => (
                    <th key={h} style={{ ...thS, textAlign:"center", padding:"6px 8px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tablaClima.map((m, i) => {
                  const esMasFrio   = mesMasFrio?.mes === m.mes;
                  const seleccionado = mesesCalentar[m.mes];
                  return (
                    <tr key={m.mes} style={{
                      background: esMasFrio ? "rgba(249,115,22,0.12)" : i%2===0 ? "#1e293b" : "#162032",
                      borderLeft: esMasFrio ? "3px solid #f97316" : "3px solid transparent",
                    }}>
                      <td style={tdS({ textAlign:"left", fontWeight: esMasFrio?700:400, color: esMasFrio?"#f97316":"#e2e8f0", padding:"5px 8px" })}>
                        {m.mes}{esMasFrio ? " ★" : ""}
                      </td>
                      <td style={tdS({ color:"#7dd3fc" })}>{m.tMin}°</td>
                      <td style={tdS({ fontWeight: esMasFrio?700:400, color: esMasFrio?"#f97316":"#e2e8f0" })}>{m.tProm}°</td>
                      <td style={tdS()}>{m.tMax}°</td>
                      <td style={tdS()}>{m.humedad}%</td>
                      <td style={tdS()}>{m.viento}</td>
                      <td style={tdS({ color: esMasFrio?"#f97316": m.perdidaClima>0?"#94a3b8":"#475569", fontWeight: esMasFrio?700:400 })}>
                        {m.perdidaClima > 0 ? m.perdidaClima.toLocaleString("es-MX") : "—"}
                      </td>
                      <td style={tdS({ color: seleccionado?"#34d399":"#475569" })}>
                        {seleccionado ? "✓" : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabla de pérdidas energéticas */}
        <div>
          <p style={tituloStyle}>Pérdidas energéticas del sistema</p>
          <div style={{ background:"#1e293b", border:"1px solid #334155", borderRadius:"0 6px 6px 6px", overflow:"hidden" }}>
            <table style={{ borderCollapse:"collapse", fontSize:"0.73rem", width:"100%" }}>
              <thead>
                <tr style={{ background:"#0f172a" }}>
                  {["Concepto","BTU/h","%"].map(h => (
                    <th key={h} style={{ ...thS, textAlign: h==="Concepto"?"left":"center" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERDIDAS.map((p, i) => {
                  const val = parseFloat(perdidasBTU[p.key]) || 0;
                  const pct = total > 0 ? (val/total*100).toFixed(1) : "0.0";
                  const esTuberia = p.key === "tuberia";
                  return (
                    <>
                      {esTuberia && perdidaClima > 0 && (
                        <tr key="subtotal" style={{ background:"#162032", borderTop:"1px dashed #334155" }}>
                          <td style={tdS({ textAlign:"left", color:"#94a3b8", fontStyle:"italic", paddingLeft:"28px" })}>Subtotal clima</td>
                          <td style={tdS({ color:"#94a3b8", fontStyle:"italic" })}>{fmtBTU(perdidaClima)}</td>
                          <td style={tdS({ color:"#94a3b8", fontStyle:"italic" })}>{total>0?(perdidaClima/total*100).toFixed(1):"0.0"}%</td>
                        </tr>
                      )}
                      <tr key={p.key} style={{ background: esTuberia?"#1a2d1a":i%2===0?"#1e293b":"#162032" }}>
                        <td style={tdS({ textAlign:"left", display:"flex", alignItems:"center", gap:"7px", color: esTuberia?"#fbbf24":"#cbd5e1" })}>
                          <span style={{ width:"10px", height:"10px", borderRadius:"2px", background:p.color, display:"inline-block", flexShrink:0 }} />
                          {p.label}
                        </td>
                        <td style={tdS({ color: esTuberia?"#fbbf24":"#e2e8f0", fontWeight:500 })}>{fmtBTU(val)}</td>
                        <td style={tdS({ color:"#94a3b8" })}>{pct}%</td>
                      </tr>
                    </>
                  );
                })}
                <tr style={{ background:"#0c2340", borderTop:"2px solid #1e4a7a" }}>
                  <td style={tdS({ textAlign:"left", color:"#60a5fa", fontWeight:700 })}>TOTAL</td>
                  <td style={tdS({ color:"#60a5fa", fontWeight:700 })}>{fmtBTU(total)}</td>
                  <td style={tdS({ color:"#60a5fa", fontWeight:700 })}>100%</td>
                </tr>
              </tbody>
            </table>
          </div>
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

  const { resumen, reportes = [], calentamiento = [], perfilTermico = null, equiposConfirmados = null, estadosDiseno = null, specsEquipos = null, specsSanitizacion = null, specsCalentamiento = null } = memoria;

const defEquipos = [
    { key:"bombaCalor",         label:"Bomba de calor",   tipo:"calentamiento" },
    { key:"panelSolar",         label:"Panel solar",      tipo:"calentamiento" },
    { key:"caldera",            label:"Caldera de gas",   tipo:"calentamiento" },
    { key:"calentadorElectrico",label:"Calentador eléctrico",tipo:"calentamiento" },
    { key:"cloradorSalino",     label:"Generador de cloro salino",     tipo:"filtro" },
    { key:"cloradorAutomatico", label:"Clorador automático",    tipo:"filtro" },
    { key:"lamparaUV",          label:"Lámpara UV",       tipo:"filtro" },
    { key:"prefiltro",          label:"Prefiltro",        tipo:"filtro" },
    { key:"filtroArena",        label:"Filtro de arena",     tipo:"filtro" },
    { key:"filtroCartucho",     label:"Filtro de cartucho",      tipo:"filtro" },
    { key:"retorno",            label:"Retorno",         tipo:"empotrable", sufijoCM:"CM",   tituloTramos:"Tramos retornos",     tituloDisparo:"Disparo al retorno"     },
    { key:"desnatador",         label:"Desnatador",     tipo:"empotrable", sufijoCM:"CMD",  tituloTramos:"Tramos desnatadores", tituloDisparo:"Disparo al desnatador"  },
    { key:"drenCanal",          label:"Dren de canal",     tipo:"empotrable", sufijoCM:"CMDC", tituloTramos:"Tramos drenes canal", tituloDisparo:null                     },
    { key:"drenFondo",          label:"Dren de fondo",     tipo:"empotrable", sufijoCM:"CMDF", tituloTramos:"Tramos drenes fondo", tituloDisparo:null                     },
    { key:"barredora",          label:"Barredora",       tipo:"empotrable", sufijoCM:"CMB",  tituloTramos:"Tramos barredoras",   tituloDisparo:"Disparo a barredora"    },
    ].filter(eq => reportes.some(r => {
      const data = getEquipoData(r, eq.key);
      if (!data) return false;
      if (eq.key === "cloradorAutomatico" && data.excluido === true) return false;
      return true;
    }));

const ContenidorTab = ({ children }) => (
    <div style={{
      background: "#0f172a",
      border: "1px solid #334155",
      borderRadius: "0 8px 8px 8px",
      padding: "1.5rem",
      minHeight: "400px",
    }}>
      {children}
    </div>
  );

const tabs = [
    { label:"📊 Resumen",    comp: <ContenidorTab><TabResumen reportes={reportes} calentamiento={calentamiento} resumen={resumen} /></ContenidorTab> },
    { label:"🔧 Equipos",   comp: <ContenidorTab><TabEquiposConsiderar reportes={reportes} calentamiento={calentamiento} resumen={resumen} equiposConfirmados={equiposConfirmados} estadosDiseno={estadosDiseno} specsEquipos={specsEquipos} specsSanitizacion={specsSanitizacion} specsCalentamiento={specsCalentamiento} /></ContenidorTab> },
    { label:"📦 Materiales", comp: <ContenidorTab><TabExplosionMateriales reportes={reportes} /></ContenidorTab> },
    ...(perfilTermico ? [{ label:"🌡 Perfil térmico", comp: <ContenidorTab><TabPerfilTermico perfilTermico={perfilTermico} /></ContenidorTab> }] : []),
    ...defEquipos.map(eq => ({
      label: eq.label,
      comp: <TabEquipo equipoKey={eq.key} reportes={reportes} tipoRender={eq.tipo} sufijoCM={eq.sufijoCM} tituloTramos={eq.tituloTramos} tituloDisparo={eq.tituloDisparo} />,
    })),
  ];
 
  return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column", fontFamily:"'Segoe UI',system-ui,sans-serif", background:"#0f172a", color:"#e2e8f0", overflow:"hidden" }}>
        {/* Header */}
      <div style={{ background:"#1e293b", borderBottom:"1px solid #334155", padding:"14px 24px" }}>
        <h1 style={{ fontSize:"1.1rem", fontWeight:700, color:"#60a5fa", marginBottom:"8px" }}>Memoria de cálculo hidráulico</h1>
        <div style={{ display:"flex", flexWrap:"wrap", gap:"20px", fontSize:"0.8rem", color:"#94a3b8", alignItems:"center" }}>
          {resumen.area   && parseFloat(resumen.area)   > 0 && <span><strong style={{ color:"#e2e8f0" }}>Área:</strong> {resumen.area} m²</span>}
          {resumen.vol    && parseFloat(resumen.vol)    > 0 && <span><strong style={{ color:"#e2e8f0" }}>Volumen:</strong> {resumen.vol} m³</span>}
          <span><strong style={{ color:"#38bdf8" }}>Flujo máximo:</strong> {resumen.flujoMax} GPM</span>
          {resumen.flujoFinal && <span><strong style={{ color:"#34d399" }}>Flujo operación:</strong> {resumen.flujoFinal} GPM</span>}
          {resumen.cdtFinal   && <span><strong style={{ color:"#34d399" }}>CDT operación:</strong> {resumen.cdtFinal} fthd · {f2(parseFloat(resumen.cdtFinal) * 0.43353)} PSI</span>}
        </div>
        {/* Leyenda */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:"8px", flexWrap:"wrap", gap:"8px" }}>
          <div style={{ display:"flex", gap:"14px", flexWrap:"wrap" }}>
            {ITER_CONFIG.map(c => (
              <span key={c.label} style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:"0.73rem", color:"#94a3b8" }}>
                <span style={{ width:"10px", height:"10px", borderRadius:"2px", background:c.bg, border:`1px solid ${c.border}`, display:"inline-block" }} />
                {c.label}
              </span>
            ))}
          </div>
          <button
            onClick={() => window.open("/memoria-pdf", "_blank")}
            style={{ padding:"5px 14px", background:"#1d4ed8", border:"1px solid #3b82f6", borderRadius:"6px", color:"#e2e8f0", fontSize:"0.73rem", fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:"6px" }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 1h7l3 3v11H3V1z" stroke="currentColor" strokeWidth="1.2"/><path d="M10 1v3h3" stroke="currentColor" strokeWidth="1.2"/><line x1="5" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/><line x1="5" y1="9.5" x2="11" y2="9.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/><line x1="5" y1="12" x2="8" y2="12" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
            Generar reporte PDF
          </button>
        </div>
      </div>

{/* Tabs — carrusel con flechas */}
      {(() => {
        const scrollRef = { current: null };
        const scroll = (dir) => {
          if (scrollRef.current) scrollRef.current.scrollLeft += dir * 200;
        };
        return (
          <div style={{ background:"#0f172a", borderBottom:"1px solid #1e3a5f", paddingTop:"8px", display:"flex", alignItems:"flex-end", position:"relative" }}>
            {/* Flecha izquierda */}
            <button onClick={() => scroll(-1)} style={{ flexShrink:0, background:"rgba(15,23,42,0.95)", border:"1px solid #1e3a5f", borderBottom:"none", borderRadius:"6px 6px 0 0", color:"#64748b", cursor:"pointer", padding:"7px 10px 9px", fontSize:"0.8rem", position:"relative", top:"1px", transition:"color 0.15s", zIndex:2 }}
              onMouseEnter={e=>e.currentTarget.style.color="#e2e8f0"} onMouseLeave={e=>e.currentTarget.style.color="#64748b"}>
              ◀
            </button>
            {/* Contenedor scrollable con fade */}
            <div style={{ position:"relative", flex:1, overflow:"hidden" }}>
              {/* Fade izquierda */}
              <div style={{ position:"absolute", left:0, top:0, bottom:"1px", width:"24px", background:"linear-gradient(to right, #0f172a, transparent)", zIndex:1, pointerEvents:"none" }} />
              {/* Fade derecha */}
              <div style={{ position:"absolute", right:0, top:0, bottom:"1px", width:"24px", background:"linear-gradient(to left, #0f172a, transparent)", zIndex:1, pointerEvents:"none" }} />
              <div
                ref={el => scrollRef.current = el}
                style={{ display:"flex", gap:"3px", alignItems:"flex-end", overflowX:"auto", paddingLeft:"8px", paddingRight:"8px", scrollbarWidth:"none", scrollBehavior:"smooth" }}>
                {tabs.map((tab, i) => {
                  const activa = tabActiva === i;
                  const iconos = {
                    "Resumen":      <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="1" y="8" width="3" height="7" rx="0.8" fill="currentColor" opacity="0.7"/><rect x="6" y="5" width="3" height="10" rx="0.8" fill="currentColor" opacity="0.85"/><rect x="11" y="2" width="3" height="13" rx="0.8" fill="currentColor"/></svg>,
                    "Equipos":      <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.22 3.22l1.41 1.41M11.37 11.37l1.41 1.41M3.22 12.78l1.41-1.41M11.37 4.63l1.41-1.41" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
                    "Materiales":   <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M8 1L8 15M2 4.5L14 4.5" stroke="currentColor" strokeWidth="1" opacity="0.6"/></svg>,
                    "Perfil térmico": <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="5" y="2" width="3" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="6.5" cy="12" r="2" stroke="currentColor" strokeWidth="1.2"/><line x1="8" y1="5" x2="11" y2="5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6"/><line x1="8" y1="7" x2="10" y2="7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6"/></svg>,
                    "Bomba de calor":   <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="1" y="5" width="8" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.2"/><path d="M9 8h3l1-2h1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M9 8h3l1 2h1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><circle cx="5" cy="8.5" r="2" stroke="currentColor" strokeWidth="1"/></svg>,
                    "Panel solar":      <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="1" y="4" width="14" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/><line x1="5.5" y1="4" x2="5.5" y2="12" stroke="currentColor" strokeWidth="0.9" opacity="0.6"/><line x1="10.5" y1="4" x2="10.5" y2="12" stroke="currentColor" strokeWidth="0.9" opacity="0.6"/><line x1="1" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="0.9" opacity="0.6"/><line x1="8" y1="1" x2="8" y2="3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
                    "Caldera de gas":   <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="3" y="3" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M6 7Q7 5 8 7Q9 5 10 7" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round"/><line x1="5" y1="10" x2="11" y2="10" stroke="currentColor" strokeWidth="0.9" opacity="0.6"/></svg>,
                    "Calentador eléctrico": <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 1L6 7h4L7 15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
                    "Generador de cloro salino": <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2"/><line x1="8" y1="4" x2="8" y2="12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><line x1="4" y1="8" x2="12" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
                    "Lámpara UV":       <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><ellipse cx="8" cy="8" rx="2.5" ry="6" stroke="currentColor" strokeWidth="1.2"/><line x1="8" y1="2" x2="8" y2="1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><line x1="8" y1="15" x2="8" y2="14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><line x1="1.5" y1="8" x2="0.5" y2="8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6"/><line x1="14.5" y1="8" x2="15.5" y2="8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6"/></svg>,
                    "Prefiltro":        <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><ellipse cx="8" cy="4" rx="5" ry="2" stroke="currentColor" strokeWidth="1.2"/><rect x="3" y="4" width="10" height="8" stroke="currentColor" strokeWidth="1.2"/><line x1="5" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="0.9" opacity="0.6"/><line x1="5" y1="9" x2="11" y2="9" stroke="currentColor" strokeWidth="0.9" opacity="0.6"/></svg>,
                    "Filtro de arena":  <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><ellipse cx="8" cy="4" rx="5" ry="2" stroke="currentColor" strokeWidth="1.2"/><rect x="3" y="4" width="10" height="8" stroke="currentColor" strokeWidth="1.2"/><ellipse cx="8" cy="9" rx="3" ry="1.2" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="0.8"/></svg>,
                    "Retorno":          <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="5" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="11" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2"/><line x1="1" y1="8" x2="2.5" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><line x1="13.5" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
                    "Desnatador":       <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="1" y="8" width="14" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="4" y="4" width="4" height="5" rx="0.8" stroke="currentColor" strokeWidth="1"/><rect x="8" y="4" width="4" height="5" rx="0.8" stroke="currentColor" strokeWidth="1"/></svg>,
                    "Dren de canal":    <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="1" y="6" width="14" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="1" y="4" width="14" height="3" rx="0.8" stroke="currentColor" strokeWidth="1" opacity="0.6"/><rect x="5" y="11" width="3" height="3" rx="0.5" stroke="currentColor" strokeWidth="0.9"/><rect x="9" y="11" width="3" height="3" rx="0.5" stroke="currentColor" strokeWidth="0.9"/></svg>,
                    "Dren de fondo":    <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="9" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="4" y="10" width="3" height="3" rx="0.5" stroke="currentColor" strokeWidth="0.9"/><rect x="9" y="10" width="3" height="3" rx="0.5" stroke="currentColor" strokeWidth="0.9"/></svg>,
                    "Barredora":        <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="1" y="4" width="14" height="7" rx="1" stroke="currentColor" strokeWidth="1.2"/><circle cx="5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1"/><circle cx="11" cy="7.5" r="2" stroke="currentColor" strokeWidth="1"/><line x1="4" y1="11" x2="4" y2="13" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.7"/><line x1="8" y1="11" x2="8" y2="13" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.7"/><line x1="12" y1="11" x2="12" y2="13" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.7"/></svg>,
                  };
                  const labelLimpio = tab.label.replace(/^[\p{Emoji}\s📊🔧📦🌡]+/u, "").trim();
                  const icono = iconos[labelLimpio] ?? <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3"/></svg>;
                  return (
                    <button key={i} onClick={() => setTabActiva(i)}
                      style={{
                        padding: "7px 14px 9px",
                        fontSize: "0.73rem",
                        fontWeight: activa ? 700 : 400,
                        color: activa ? "#e2e8f0" : "#64748b",
                        background: activa ? "#0f172a" : "rgba(15,23,42,0.4)",
                        border: `1px solid ${activa ? "#334155" : "#1e3a5f"}`,
                        borderBottom: activa ? "1px solid #0f172a" : "1px solid #1e3a5f",
                        borderRadius: "6px 6px 0 0",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        transition: "all 0.15s",
                        position: "relative",
                        top: "1px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        flexShrink: 0,
                      }}>
                      <span style={{ color: activa ? "#60a5fa" : "#475569", display:"flex", alignItems:"center" }}>{icono}</span>
                      {labelLimpio}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Flecha derecha */}
            <button onClick={() => scroll(1)} style={{ flexShrink:0, background:"rgba(15,23,42,0.95)", border:"1px solid #1e3a5f", borderBottom:"none", borderRadius:"6px 6px 0 0", color:"#64748b", cursor:"pointer", padding:"7px 10px 9px", fontSize:"0.8rem", position:"relative", top:"1px", transition:"color 0.15s", zIndex:2 }}
              onMouseEnter={e=>e.currentTarget.style.color="#e2e8f0"} onMouseLeave={e=>e.currentTarget.style.color="#64748b"}>
              ▶
            </button>
          </div>
        );
      })()}
 
      {/* Contenido */}
      <div style={{ flex:1, padding:"16px", overflowX:"auto", overflowY:"auto", background:"#0f172a" }}>
        {tabs[tabActiva]?.comp}
      </div>
    </div>
  );
}