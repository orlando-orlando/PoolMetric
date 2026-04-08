import { useState, useEffect } from "react";

const f2 = (v) => { const n = parseFloat(v); return isNaN(n) ? "—" : n.toFixed(2); };

/* ═══════════════════════════════════════════════════════
   TABLA DE TRAMOS — compartida por todos los sistemas
   Acepta tanto keys de empotrables (cantidadTees) como
   de equipos (cantTees) porque normalizamos en memoriaCalculo.js
════════════════════════════════════════════════════════ */
function TablaTramos({ resultado, titulo }) {
  if (!resultado?.length) return null;
  const suma = resultado.reduce((acc, d) => acc + parseFloat(d.cargaTotal || 0), 0);
  return (
    <div className="mc-tabla-wrap">
      <p className="mc-tabla-titulo">{titulo}</p>
      <table className="mc-tabla">
        <thead>
          <tr>
            <th>#</th><th>Flujo (gpm)</th><th>Tubería (in)</th><th>Vel. (ft/s)</th>
            <th>Carga base (ft/100ft)</th><th>Long. (m)</th><th>Carga tramo (ft)</th>
            <th>Tees</th><th>L.Eq. Tee</th><th>Carga tee</th>
            <th>Codos</th><th>L.Eq. Codo</th><th>Carga codo</th>
            <th>Red.</th><th>L.Eq. Red.</th><th>Carga red.</th>
            <th className="mc-th-total">Carga total (ft)</th>
          </tr>
        </thead>
        <tbody>
          {resultado.map((d, i) => (
            <tr key={i}>
              <td>{d.tramo}</td><td>{d.flujo}</td><td>{d.tuberia}</td><td>{d.velocidad}</td>
              <td>{d.cargaBase}</td><td>{d.longitud}</td><td>{d.cargaTramo}</td>
              <td>{d.cantidadTees}</td><td>{d.longEqTee}</td><td>{d.cargaTee}</td>
              <td>{d.cantidadCodos}</td><td>{d.longEqCodo}</td><td>{d.cargaCodo}</td>
              <td>{d.cantidadReducciones}</td><td>{d.longEqReduccion}</td><td>{d.cargaReduccion}</td>
              <td className="mc-td-total">{d.cargaTotal}</td>
            </tr>
          ))}
          <tr className="mc-tr-suma">
            <td colSpan={16} style={{textAlign:"right"}}>Σ carga tramos (ft):</td>
            <td>{f2(suma)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/* Panel solar tiene filas especiales con tándems */
function TablaTandems({ resultado, titulo }) {
  if (!resultado?.length) return null;
  const suma = resultado.reduce((acc, d) => acc + parseFloat(d.cargaTotal || 0), 0);
  return (
    <div className="mc-tabla-wrap">
      <p className="mc-tabla-titulo">{titulo}</p>
      <table className="mc-tabla">
        <thead>
          <tr>
            <th>Tándem</th><th>Paneles</th><th>Flujo (gpm)</th><th>Tubería</th><th>Vel. (ft/s)</th>
            <th>Carga base</th><th>Long. (m)</th><th>Carga tramo</th>
            <th>Flujo tándem</th><th>Carga entrada</th>
            <th>Tees</th><th>L.Eq. Tee</th><th>Carga tee</th>
            <th>Codos</th><th>L.Eq. Codo</th><th>Carga codo</th>
            <th className="mc-th-total">Carga total (ft)</th>
          </tr>
        </thead>
        <tbody>
          {resultado.map((d, i) => (
            <tr key={i}>
              <td>{d.tramo}</td><td>{d.paneles ?? "—"}</td><td>{d.flujo}</td>
              <td>{d.tuberia}</td><td>{d.velocidad}</td><td>{d.cargaBase}</td>
              <td>{d.longitud}</td><td>{d.cargaTramo}</td>
              <td>{d.flujoTandem ?? "—"}</td><td>{d.cargaEntrada ?? "—"}</td>
              <td>{d.cantidadTees}</td><td>{d.longEqTee}</td><td>{d.cargaTee}</td>
              <td>{d.cantidadCodos}</td><td>{d.longEqCodo}</td><td>{d.cargaCodo}</td>
              <td className="mc-td-total">{d.cargaTotal}</td>
            </tr>
          ))}
          <tr className="mc-tr-suma">
            <td colSpan={16} style={{textAlign:"right"}}>Σ carga tándems (ft):</td>
            <td>{f2(suma)}</td>
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
    <div className="mc-tabla-wrap">
      <p className="mc-tabla-titulo">Tramo cuarto de máquinas</p>
      <table className="mc-tabla">
        <thead>
          <tr>
            <th>Flujo (gpm)</th><th>Tubería</th><th>Vel. (ft/s)</th>
            <th>Carga base (ft/100ft)</th><th>Long. (m)</th><th>Carga tramo</th>
            <th>Codos</th><th>L.Eq. Codo</th><th>Carga codo</th>
            <th className="mc-th-total">Carga total (ft)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{k("flujo")}</td><td>{k("tuberia")}</td><td>{k("velocidad")}</td>
            <td>{k("cargaBase")}</td><td>{k("distancia")}</td><td>{k("cargaTramo")}</td>
            <td>1</td><td>{k("longEqCodo")}</td><td>{k("cargaCodo")}</td>
            <td className="mc-td-total">{k("cargaTotal")}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function TablaDistanciaCalentamiento({ tablaDistancia }) {
  if (!tablaDistancia) return null;
  const d = tablaDistancia;
  return (
    <div className="mc-tabla-wrap">
      <p className="mc-tabla-titulo">Tramo cuarto de máquinas (ida + regreso)</p>
      <table className="mc-tabla">
        <thead>
          <tr>
            <th>Tramo</th><th>Flujo (gpm)</th><th>Tubería</th><th>Vel. (ft/s)</th>
            <th>Carga base</th><th>Long. (m)</th><th>Carga tubería</th>
            <th>Codos</th><th>L.Eq. Codo</th><th>Carga codo</th>
            <th className="mc-th-total">Total (ft)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Ida</td><td>{d.flujo}</td><td>{d.tuberia}</td><td>{d.velocidad}</td>
            <td>{d.cargaBase}</td><td>{d.distancia_m}</td>
            <td>{d.cargaTuberiaIda}</td><td>1</td><td>{d.longEqCodo}</td>
            <td>{d.cargaCodoIda}</td><td className="mc-td-total">{d.cargaTotalIda}</td>
          </tr>
          <tr>
            <td>Regreso</td><td>{d.flujo}</td><td>{d.tuberia}</td><td>{d.velocidad}</td>
            <td>{d.cargaBase}</td><td>{d.distancia_m}</td>
            <td>{d.cargaTuberiaReg}</td><td>1</td><td>{d.longEqCodo}</td>
            <td>{d.cargaCodoReg}</td><td className="mc-td-total">{d.cargaTotalReg}</td>
          </tr>
          <tr className="mc-tr-suma">
            <td colSpan={10} style={{textAlign:"right"}}>Carga total CM (ft):</td>
            <td>{d.cargaTotal}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function TablaAltura({ tablaAltura, labelEquipo = "equipo" }) {
  if (!tablaAltura) return null;
  const d = tablaAltura;
  const alturaKey = d.alturaBDC_m ?? d.alturaCaldera_m ?? d.alturaCE_m ?? d.alturaPS_m ?? d.alturaPS_ft;
  const llevaEstatica = d.bdcLlevaCargaEstatica ?? d.calderaLlevaCargaEstatica ?? d.ceLlevaCargaEstatica ?? d.psLlevaCargaEstatica ?? false;
  return (
    <div className="mc-tabla-wrap">
      <p className="mc-tabla-titulo">Altura vertical y carga estática</p>
      <table className="mc-tabla">
        <tbody>
          <tr><td className="mc-sum-label">Altura {labelEquipo} (m):</td><td>{alturaKey ?? "—"}</td></tr>
          <tr><td className="mc-sum-label">Altura máx. sistema (m):</td><td>{d.alturaMaxSist_m}</td></tr>
          <tr><td className="mc-sum-label">Lleva carga estática:</td><td>{llevaEstatica ? "Sí" : "No"}</td></tr>
          <tr><td className="mc-sum-label">Carga estática (ft):</td><td>{d.cargaEstatica}</td></tr>
          <tr><td className="mc-sum-label">Carga fricción tubería (ft):</td><td>{d.cargaFriccion}</td></tr>
          <tr className="mc-tr-suma"><td className="mc-sum-label">Total altura (ft):</td><td>{d.cargaTotal}</td></tr>
        </tbody>
      </table>
    </div>
  );
}

function TablaDisparo({ disparo, titulo }) {
  if (!disparo) return null;
  const d = disparo;
  return (
    <div className="mc-tabla-wrap">
      <p className="mc-tabla-titulo">{titulo}</p>
      <table className="mc-tabla">
        <thead>
          <tr>
            <th>Flujo (gpm)</th><th>Tubería</th><th>Vel. (ft/s)</th>
            <th>Carga base</th><th>Long. (m)</th><th>Carga tramo</th>
            <th>Codos</th><th>L.Eq. Codo</th><th>Carga codo</th>
            <th>Red.</th><th>L.Eq. Red.</th><th>Carga red.</th>
            <th className="mc-th-total">Carga disparo (ft)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{f2(d.flujoDisparo)}</td><td>{d.diametroDisparo}</td>
            <td>{f2(d.velocidadDisparo)}</td><td>{f2(d.cargaBaseDisparo)}</td>
            <td>{f2(d.longitudDisparo)}</td><td>{f2(d.cargaDisparo)}</td>
            <td>1</td><td>{f2(d.longEqCodoDisparo)}</td><td>{f2(d.cargaCodoDisparo)}</td>
            <td>{d.longEqReduccionDisparo !== 0 ? 1 : 0}</td>
            <td>{f2(d.longEqReduccionDisparo)}</td><td>{f2(d.cargaReduccionDisparo)}</td>
            <td className="mc-td-total">{f2(d.cargaDisparoTotal)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function TablaResumen({ resumen, titulo }) {
  if (!resumen || !Object.keys(resumen).length) return null;
  return (
    <div>
      <p className="mc-tabla-titulo">{titulo}</p>
      <table className="mc-tabla mc-tabla-resumen">
        <thead>
          <tr><th>Diámetro (in)</th><th>Tubería (m)</th><th>Tees</th><th>Codos</th><th>Reducciones</th></tr>
        </thead>
        <tbody>
          {Object.entries(resumen).map(([diam, r]) => (
            <tr key={diam}>
              <td>{diam.replace("tuberia ", "")}</td>
              <td>{f2(r.tuberia_m)}</td><td>{r.tees}</td><td>{r.codos}</td><td>{r.reducciones}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TablaSumatoria({ items, total }) {
  return (
    <div className="mc-sumatoria">
      <p className="mc-tabla-titulo">Sumatoria de cargas</p>
      <table className="mc-tabla mc-tabla-sumatoria">
        <tbody>
          {items.map(({ label, valor }) => (
            <tr key={label}><td className="mc-sum-label">{label}</td><td>{f2(valor)} ft</td></tr>
          ))}
          <tr className="mc-tr-total">
            <td className="mc-sum-label">Carga dinámica total (ft):</td>
            <td>{f2(total)} ft</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function SumatoriaEquipoSimple({ data }) {
  return (
    <div className="mc-sumatoria">
      <p className="mc-tabla-titulo">Sumatoria de cargas</p>
      <table className="mc-tabla mc-tabla-sumatoria">
        <tbody>
          <tr><td className="mc-sum-label">Σ carga tramos (ft):</td><td>{f2(data.cargaTramos)} ft</td></tr>
          <tr><td className="mc-sum-label">Carga fija (ft):</td><td>{f2(data.cargaFija)} ft</td></tr>
          <tr className="mc-tr-total">
            <td className="mc-sum-label">Carga dinámica total (ft):</td>
            <td>{f2(data.cargaTotal)} ft</td>
          </tr>
          <tr><td className="mc-sum-label">Carga total (PSI):</td><td>{f2(data.cargaTotalPSI)} PSI</td></tr>
        </tbody>
      </table>
    </div>
  );
}

function SumatoriaCalentamiento({ data }) {
  return (
    <div className="mc-sumatoria">
      <p className="mc-tabla-titulo">Sumatoria de cargas</p>
      <table className="mc-tabla mc-tabla-sumatoria">
        <tbody>
          <tr><td className="mc-sum-label">Σ carga tramos (ft):</td><td>{f2(data.cargaTramos)} ft</td></tr>
          <tr><td className="mc-sum-label">Carga CM ida (ft):</td><td>{f2(data.cargaDistanciaIda)} ft</td></tr>
          <tr><td className="mc-sum-label">Carga CM regreso (ft):</td><td>{f2(data.cargaDistanciaReg)} ft</td></tr>
          <tr><td className="mc-sum-label">Carga estática (ft):</td><td>{f2(data.cargaEstatica)} ft</td></tr>
          <tr><td className="mc-sum-label">Carga fricción altura (ft):</td><td>{f2(data.cargaFriccion)} ft</td></tr>
          <tr><td className="mc-sum-label">Carga fija (ft):</td><td>{f2(data.cargaFija)} ft</td></tr>
          <tr className="mc-tr-total">
            <td className="mc-sum-label">Carga dinámica total (ft):</td>
            <td>{f2(data.cargaTotal)} ft</td>
          </tr>
          <tr><td className="mc-sum-label">Carga total (PSI):</td><td>{f2(data.cargaTotalPSI)} PSI</td></tr>
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════ SECCIONES ═══════════ */

function SeccionEmpotrable({ data, titulo, tituloTramos, tituloDisparo, sufijoCM, tituloDisparos }) {
  const { resultado, sumaTramos, disparo, cargaDisparoTotal, tablaDistanciaCM, cargaDinamicaTotal, resumenTramos, resumenDisparos } = data;
  const items = [
    { label: `Carga tramo ${titulo.toLowerCase()} (ft):`, valor: sumaTramos },
    { label: "Carga a cuarto de máquinas (ft):", valor: tablaDistanciaCM ? parseFloat(tablaDistanciaCM[`cargaTotal${sufijoCM}`] ?? 0) : 0 },
  ];
  if (disparo) items.push({ label: "Carga disparos (ft):", valor: cargaDisparoTotal });
  items.push({ label: `Carga accesorio ${titulo.toLowerCase()} (ft):`, valor: 1.5 });
  return (
    <div className="mc-seccion">
      <TablaTramos resultado={resultado} titulo={tituloTramos} />
      <TablaCuarto tablaDistanciaCM={tablaDistanciaCM} sufijo={sufijoCM} />
      {disparo && <TablaDisparo disparo={disparo} titulo={tituloDisparo} />}
      <div className="mc-bottom-row">
        <div className="mc-resumen-row">
          <TablaResumen resumen={resumenTramos} titulo="Resumen materiales — tramos" />
          {resumenDisparos && <TablaResumen resumen={resumenDisparos} titulo={`Resumen materiales — ${tituloDisparos ?? "disparos"}`} />}
        </div>
        <TablaSumatoria items={items} total={cargaDinamicaTotal} />
      </div>
    </div>
  );
}

function SeccionEquipoSimple({ data }) {
  return (
    <div className="mc-seccion">
      {data.seleccion && (
        <div className="mc-info-equipo">
          <span><strong>Modelo:</strong> {data.seleccion.marca} {data.seleccion.modelo}</span>
          <span><strong>Cantidad:</strong> {data.seleccion.cantidad}</span>
          <span><strong>Flujo total:</strong> {f2(data.seleccion.flujoTotal)} GPM</span>
          {data.kgDiaNecesario && <span><strong>Cloro necesario:</strong> {f2(data.kgDiaNecesario)} kg/día</span>}
          {data.kgDiaInstalado && <span><strong>Cloro instalado:</strong> {f2(data.kgDiaInstalado)} kg/día</span>}
        </div>
      )}
      <TablaTramos resultado={data.tablaTramos} titulo="Tramos hidráulicos" />
      <div className="mc-bottom-row">
        <TablaResumen resumen={data.resumenMateriales} titulo="Resumen materiales" />
        <SumatoriaEquipoSimple data={data} />
      </div>
    </div>
  );
}

function SeccionCalentamiento({ data }) {
  const esPanelSolar = data.key === "panelSolar";
  return (
    <div className="mc-seccion">
      {data.seleccion && (
        <div className="mc-info-equipo">
          <span><strong>Modelo:</strong> {data.seleccion.marca} {data.seleccion.modelo}</span>
          <span><strong>Cantidad:</strong> {data.seleccion.cantidad}</span>
          <span><strong>Flujo total:</strong> {f2(data.seleccion.flujoTotal)} GPM</span>
          {data.tandems && <span><strong>Tándems:</strong> {data.tandems.join(" + ")} paneles</span>}
        </div>
      )}
      {esPanelSolar
        ? <TablaTandems resultado={data.tablaTramos} titulo="Tramos por tándem" />
        : <TablaTramos resultado={data.tablaTramos} titulo="Tramos entre equipos" />
      }
      <TablaDistanciaCalentamiento tablaDistancia={data.tablaDistancia} />
      <TablaAltura tablaAltura={data.tablaAltura} labelEquipo={data.label.toLowerCase()} />
      <div className="mc-bottom-row">
        <TablaResumen resumen={data.resumenMateriales} titulo="Resumen materiales" />
        <SumatoriaCalentamiento data={data} />
      </div>
    </div>
  );
}

/* ═══════════ COMPONENTE PRINCIPAL ═══════════ */

export default function MemoriaCalculo() {
  const [memoria, setMemoria] = useState(null);
  const [tabActiva, setTabActiva] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("memoriaCalculo");
      if (!raw) throw new Error("No se encontraron datos. Cierra esta ventana y genera la memoria desde Equipamiento.");
      setMemoria(JSON.parse(raw));
    } catch (e) {
      setError(e.message);
    }
  }, []);

  if (error) return <div className="mc-error"><p>⚠️ {error}</p></div>;
  if (!memoria) return <div className="mc-loading">Cargando memoria de cálculo…</div>;

  const { resumen, retornos, desnatadores, drenFondo, drenCanal, barredoras,
          filtroArena, prefiltro, filtroCartucho,
          cloradorSalino, lamparaUV, cloradorAutomatico,
          calentamiento } = memoria;

  const tabs = [
    retornos     && { label: "Retornos",      comp: <SeccionEmpotrable data={retornos}     titulo="Retornos"     tituloTramos="Tramos retornos"     tituloDisparo="Disparo — retorno"     sufijoCM="CM"   tituloDisparos="Disparos al retorno"     /> },
    desnatadores && { label: "Desnatadores",  comp: <SeccionEmpotrable data={desnatadores} titulo="Desnatadores" tituloTramos="Tramos desnatadores" tituloDisparo="Disparo — desnatador" sufijoCM="CMD"  tituloDisparos="Disparos al desnatador"  /> },
    drenFondo    && { label: "Drenes Fondo",  comp: <SeccionEmpotrable data={drenFondo}    titulo="Drenes fondo" tituloTramos="Tramos drenes fondo" tituloDisparo={null}                 sufijoCM="CMDF" /> },
    drenCanal    && { label: "Drenes Canal",  comp: <SeccionEmpotrable data={drenCanal}    titulo="Drenes canal" tituloTramos="Tramos drenes canal" tituloDisparo={null}                 sufijoCM="CMDC" /> },
    barredoras   && { label: "Barredoras",    comp: <SeccionEmpotrable data={barredoras}   titulo="Barredoras"   tituloTramos="Tramos barredoras"   tituloDisparo="Disparo — barredora"  sufijoCM="CMB"  tituloDisparos="Disparos a barredora"    /> },
    filtroArena      && { label: "Filtro Arena",    comp: <SeccionEquipoSimple data={filtroArena}      /> },
    prefiltro        && { label: "Prefiltro",        comp: <SeccionEquipoSimple data={prefiltro}        /> },
    filtroCartucho   && { label: "F. Cartucho",     comp: <SeccionEquipoSimple data={filtroCartucho}   /> },
    cloradorSalino   && { label: "Cloro Salino",    comp: <SeccionEquipoSimple data={cloradorSalino}   /> },
    lamparaUV        && { label: "Lámpara UV",       comp: <SeccionEquipoSimple data={lamparaUV}        /> },
    cloradorAutomatico && { label: "Clorador Auto",  comp: <SeccionEquipoSimple data={cloradorAutomatico} /> },
    ...(calentamiento ?? []).map(c => ({ label: c.label, comp: <SeccionCalentamiento data={c} /> })),
  ].filter(Boolean);

  return (
    <div className="mc-root">
      <header className="mc-header">
        <h1 className="mc-titulo">Memoria de cálculo hidráulico</h1>
        <div className="mc-resumen-general">
          <span><strong>Volumen:</strong> {resumen.vol} m³</span>
          <span><strong>Flujo vol.:</strong> {resumen.flujoVol} gpm</span>
          {parseFloat(resumen.flujoInf) > 0 && <span><strong>Flujo infinity:</strong> {resumen.flujoInf} gpm</span>}
          <span><strong>Flujo máximo:</strong> {resumen.flujoMax} gpm</span>
          <span><strong>Tubería succión:</strong> {resumen.tubSuccion}</span>
          <span><strong>Tubería descarga:</strong> {resumen.tubDescarga}</span>
        </div>
      </header>

      <nav className="mc-tabs">
        {tabs.map((tab, i) => (
          <button key={i} className={`mc-tab ${tabActiva === i ? "mc-tab-activa" : ""}`} onClick={() => setTabActiva(i)}>
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="mc-contenido">{tabs[tabActiva]?.comp}</main>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; }
        .mc-root { min-height: 100vh; display: flex; flex-direction: column; }
        .mc-header { background: #1e293b; border-bottom: 1px solid #334155; padding: 16px 24px; }
        .mc-titulo { font-size: 1.25rem; font-weight: 700; color: #60a5fa; margin-bottom: 10px; }
        .mc-resumen-general { display: flex; flex-wrap: wrap; gap: 16px; font-size: 0.82rem; color: #94a3b8; }
        .mc-resumen-general strong { color: #e2e8f0; }
        .mc-tabs { display: flex; gap: 2px; flex-wrap: wrap; background: #1e293b; border-bottom: 2px solid #334155; padding: 0 16px; }
        .mc-tab { padding: 8px 16px; border: none; background: transparent; color: #94a3b8; font-size: 0.82rem; font-weight: 500; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: color 0.15s, border-color 0.15s; white-space: nowrap; }
        .mc-tab:hover { color: #e2e8f0; }
        .mc-tab-activa { color: #60a5fa; border-bottom-color: #60a5fa; }
        .mc-contenido { flex: 1; padding: 20px 16px; overflow-x: auto; }
        .mc-seccion { display: flex; flex-direction: column; gap: 20px; }
        .mc-info-equipo { display: flex; flex-wrap: wrap; gap: 16px; padding: 10px 14px; background: #1e293b; border: 1px solid #334155; border-radius: 6px; font-size: 0.82rem; color: #94a3b8; }
        .mc-info-equipo strong { color: #e2e8f0; }
        .mc-tabla-wrap { overflow-x: auto; }
        .mc-tabla-titulo { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #60a5fa; background: #1e293b; border: 1px solid #334155; border-bottom: none; padding: 5px 12px; border-radius: 6px 6px 0 0; display: inline-block; }
        .mc-tabla { width: 100%; border-collapse: collapse; font-size: 0.77rem; background: #1e293b; border: 1px solid #334155; border-radius: 0 6px 6px 6px; }
        .mc-tabla th { background: #0f172a; color: #94a3b8; font-weight: 600; padding: 6px 8px; text-align: center; border: 1px solid #334155; white-space: nowrap; }
        .mc-tabla td { padding: 4px 8px; text-align: center; border: 1px solid #1e3a5f; color: #cbd5e1; }
        .mc-tabla tbody tr:hover { background: #0f2d4a; }
        .mc-th-total, .mc-td-total { background: #0c2340 !important; color: #60a5fa !important; font-weight: 700 !important; }
        .mc-tr-suma td { background: #1a3a5c; font-weight: 700; color: #93c5fd; }
        .mc-tabla-resumen { width: auto; min-width: 260px; }
        .mc-bottom-row { display: flex; gap: 24px; align-items: flex-start; flex-wrap: wrap; }
        .mc-resumen-row { display: flex; gap: 16px; flex-wrap: wrap; align-items: flex-start; }
        .mc-sumatoria { min-width: 300px; }
        .mc-tabla-sumatoria { width: 100%; }
        .mc-sum-label { text-align: left !important; font-weight: 600; color: #94a3b8 !important; padding-right: 16px !important; }
        .mc-tr-total td { background: #0c2340; color: #60a5fa !important; font-weight: 700; }
        .mc-error, .mc-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; gap: 12px; color: #94a3b8; font-size: 0.9rem; }
        .mc-error { color: #f87171; }
      `}</style>
    </div>
  );
}