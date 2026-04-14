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
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
      {data.seleccion && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:"1rem", padding:"0.5rem 0.75rem", background:"rgba(15,23,42,0.4)", border:"1px solid #1e3a5f", borderRadius:"6px", fontSize:"0.78rem", color:"#94a3b8" }}>
          {data.seleccion.marca && <span><strong style={{ color:"#e2e8f0" }}>Modelo:</strong> {data.seleccion.marca} {data.seleccion.modelo}</span>}
          {data.seleccion.cantidad && <span><strong style={{ color:"#e2e8f0" }}>Cantidad:</strong> {data.seleccion.cantidad}</span>}
          {data.seleccion.flujoTotal && <span><strong style={{ color:"#e2e8f0" }}>Flujo total:</strong> {f2(data.seleccion.flujoTotal)} GPM</span>}
        </div>
      )}
      <TablaTramos resultado={data.tablaTramos} titulo="Tramos hidraulicos" />
      <div style={{ display:"flex", gap:"1.5rem", flexWrap:"wrap", alignItems:"flex-start" }}>
        <TablaResumen resumen={data.resumenMateriales} titulo="Resumen materiales" />
        <div>
          <p style={tituloStyle}>Sumatoria</p>
          <table style={{ borderCollapse:"collapse", fontSize:"0.73rem", background:"#1e293b", border:"1px solid #334155", minWidth:"260px" }}>
            <tbody>
              <tr><td style={{ ...td, textAlign:"left", color:"#94a3b8", fontWeight:600 }}>Σ tramos (ft):</td><td style={td}>{f2(data.cargaTramos)} ft</td></tr>
              {data.cargaDistanciaIda != null && <tr><td style={{ ...td, textAlign:"left", color:"#94a3b8", fontWeight:600 }}>Distancia ida (ft):</td><td style={td}>{f2(data.cargaDistanciaIda)} ft</td></tr>}
              {data.cargaDistanciaReg != null && <tr><td style={{ ...td, textAlign:"left", color:"#94a3b8", fontWeight:600 }}>Distancia reg. (ft):</td><td style={td}>{f2(data.cargaDistanciaReg)} ft</td></tr>}
              {data.cargaEstatica     != null && <tr><td style={{ ...td, textAlign:"left", color:"#94a3b8", fontWeight:600 }}>Carga estatica (ft):</td><td style={td}>{f2(data.cargaEstatica)} ft</td></tr>}
              {data.cargaFija        != null && <tr><td style={{ ...td, textAlign:"left", color:"#94a3b8", fontWeight:600 }}>Carga fija (ft):</td><td style={td}>{f2(data.cargaFija)} ft</td></tr>}
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
function TabEquiposConsiderar({ reportes, calentamiento }) {
  const r = reportes[0];
  if (!r) return null;

  const secciones = [
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
  // Usar el reporte de diseño original para la explosión
  const r = reportes[0];
  if (!r) return null;

  const equipos = [
    { key:"retorno",            label:"Retornos",          tipo:"empotrable", sufijoCM:"CM",   tituloTramos:"Tramos retornos",     tituloDisparo:"Disparo al retorno"    },
    { key:"desnatador",         label:"Desnatadores",      tipo:"empotrable", sufijoCM:"CMD",  tituloTramos:"Tramos desnatadores", tituloDisparo:"Disparo al desnatador" },
    { key:"barredora",          label:"Barredoras",        tipo:"empotrable", sufijoCM:"CMB",  tituloTramos:"Tramos barredoras",   tituloDisparo:"Disparo a barredora"   },
    { key:"drenFondo",          label:"Drenes fondo",      tipo:"empotrable", sufijoCM:"CMDF", tituloTramos:"Tramos drenes fondo", tituloDisparo:null                    },
    { key:"drenCanal",          label:"Drenes canal",      tipo:"empotrable", sufijoCM:"CMDC", tituloTramos:"Tramos drenes canal", tituloDisparo:null                    },
    { key:"filtroArena",        label:"Filtro arena",      tipo:"filtro" },
    { key:"prefiltro",          label:"Prefiltro",         tipo:"filtro" },
    { key:"filtroCartucho",     label:"F. cartucho",       tipo:"filtro" },
    { key:"cloradorSalino",     label:"Cloro salino",      tipo:"filtro" },
    { key:"lamparaUV",          label:"Lámpara UV",        tipo:"filtro" },
    { key:"cloradorAutomatico", label:"Clorador automático", tipo:"filtro" },
    { key:"bombaCalor",         label:"Bomba de calor",    tipo:"calentamiento" },
    { key:"panelSolar",         label:"Panel solar",       tipo:"calentamiento" },
    { key:"caldera",            label:"Caldera de gas",    tipo:"calentamiento" },
    { key:"calentadorElectrico",label:"Calent. eléctrico", tipo:"calentamiento" },
  ].filter(eq => getEquipoData(r, eq.key));

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"2.5rem" }}>
      {equipos.map(eq => {
        const data = getEquipoData(r, eq.key);
        if (!data) return null;
        return (
          <div key={eq.key}>
            <h3 style={{ fontSize:"0.85rem", fontWeight:700, color:"#60a5fa", marginBottom:"0.5rem", textTransform:"uppercase", letterSpacing:"0.05em", borderBottom:"1px solid #1e3a5f", paddingBottom:"0.3rem" }}>
              {eq.label}
            </h3>
            {eq.tipo === "empotrable"
              ? <ContenidoEmpotrable data={data} tituloTramos={eq.tituloTramos} sufijoCM={eq.sufijoCM} tituloDisparo={eq.tituloDisparo} />
              : eq.tipo === "calentamiento"
              ? <ContenidoCalentamiento data={data} />
              : <ContenidoFiltro data={data} />
            }
          </div>
        );
      })}
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
    { label:"🔧 Equipos",   comp: <TabEquiposConsiderar reportes={reportes} calentamiento={calentamiento} /> },
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
        <div style={{ display:"flex", flexWrap:"wrap", gap:"16px", fontSize:"0.8rem", color:"#94a3b8" }}>
          {resumen.area   && <span><strong style={{ color:"#e2e8f0" }}>Área:</strong> {resumen.area} m²</span>}
          {resumen.vol && parseFloat(resumen.vol) > 0 && <span><strong style={{ color:"#e2e8f0" }}>Volumen:</strong> {resumen.vol} m³</span>}
          {resumen.flujoVol && parseFloat(resumen.flujoVol) > 0 && <span><strong style={{ color:"#e2e8f0" }}>Flujo recirculación:</strong> {resumen.flujoVol} GPM</span>}
          {resumen.flujoInf && parseFloat(resumen.flujoInf) > 0 && <span><strong style={{ color:"#e2e8f0" }}>Flujo Infinity:</strong> {resumen.flujoInf} GPM</span>}
          {resumen.vol && parseFloat(resumen.vol) > 0 && <span><strong style={{ color:"#e2e8f0" }}>Volumen:</strong> {resumen.vol} m³</span>}
          <span><strong style={{ color:"#38bdf8" }}>Flujo máximo:</strong> {resumen.flujoMax} GPM</span>
          {resumen.flujoFinal && <span><strong style={{ color:"#34d399" }}>Flujo operación:</strong> {resumen.flujoFinal} GPM</span>}
          {resumen.cdtFinal && <span><strong style={{ color:"#34d399" }}>CDT operación:</strong> {resumen.cdtFinal} ft</span>}
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