/* ================================================================
   memoriaCalculo.js — v3
   Empaqueta todos los datos hidráulicos en sessionStorage
   para que MemoriaCalculo.jsx los lea.
   ================================================================ */

import { retorno }    from "./retorno";
import { desnatador } from "./desnatador";
import { barredora }  from "./barredora";
import { drenFondo }  from "./drenFondo";
import { drenCanal }  from "./drenCanal";
import { calcularCargaFiltroArenaManual }        from "./filtroArena";
import { calcularCargaPrefiltroManual }          from "./prefiltro";
import { calcularCargaFiltroCartuchoManual }     from "./filtroCartucho";
import { calcularCargaUVManual }                 from "./generadorUV";
import { calcularCargaCloradorAutomaticoManual } from "./cloradorAutomatico";

const f2 = (v) => (parseFloat(v) || 0).toFixed(2);

/* ── Extrae disparo del primer elemento ── */
function extraerDisparo(filas) {
  if (!filas?.length) return null;
  const r = filas[0];
  return {
    flujoDisparo: r.flujoDisparo, diametroDisparo: r.diametroDisparo,
    velocidadDisparo: r.velocidadDisparo, cargaBaseDisparo: r.cargaBaseDisparo,
    longitudDisparo: r.longitudDisparo, cargaDisparo: r.cargaDisparo,
    longEqCodoDisparo: r.longEqCodoDisparo, cargaCodoDisparo: r.cargaCodoDisparo,
    longEqReduccionDisparo: r.longEqReduccionDisparo,
    cargaReduccionDisparo: r.cargaReduccionDisparo,
    cargaDisparoTotal: r.cargaDisparoTotal,
  };
}

/* ── Normaliza filas de empotrables (keys con "cantidad" y sin _m) ── */
function normEmp(filas) {
  return (filas ?? []).map(f => ({
    tramo: f.tramo, flujo: f.flujo, tuberia: f.tuberia,
    velocidad: f.velocidad, cargaBase: f.cargaBase,
    longitud: f.longitud, cargaTramo: f.cargaTramo,
    cantidadTees: f.cantidadTees, longEqTee: f.longEqTee, cargaTee: f.cargaTee,
    cantidadCodos: f.cantidadCodos, longEqCodo: f.longEqCodo, cargaCodo: f.cargaCodo,
    cantidadReducciones: f.cantidadReducciones,
    longEqReduccion: f.longEqReduccion, cargaReduccion: f.cargaReduccion,
    cargaTotal: f.cargaTotal,
  }));
}

/* ── Normaliza filas de filtros/sanitización/calentamiento (keys con cant y _m) ── */
function normEquipo(filas) {
  return (filas ?? []).map(f => ({
    tramo: f.tramo ?? f.tandem, flujo: f.flujo, tuberia: f.tuberia,
    velocidad: f.velocidad, cargaBase: f.cargaBase,
    longitud: f.longitud_m ?? f.longitud ?? "1.00",
    cargaTramo: f.cargaTramo,
    cantidadTees: f.cantTees ?? f.cantidadTees ?? 0,
    longEqTee: f.longEqTee ?? "0.00",
    cargaTee: f.cargaTees ?? f.cargaTee ?? "0.00",
    cantidadCodos: f.cantCodos ?? f.cantidadCodos ?? 0,
    longEqCodo: f.longEqCodo ?? "0.00",
    cargaCodo: f.cargaCodos ?? f.cargaCodo ?? "0.00",
    cantidadReducciones: f.cantRed ?? f.cantidadReducciones ?? 0,
    longEqReduccion: f.longEqRed ?? f.longEqReduccion ?? "0.00",
    cargaReduccion: f.cargaRed ?? f.cargaReduccion ?? "0.00",
    cargaTotal: f.cargaTotal,
    // Panel solar extras
    paneles: f.paneles ?? null,
    flujoTandem: f.flujoTandem ?? null,
    cargaEntrada: f.cargaEntrada ?? null,
  }));
}

/* ── Convierte array de resumenMateriales a objeto keyed ── */
function arrAObj(arr) {
  if (!arr) return {};
  const obj = {};
  (Array.isArray(arr) ? arr : Object.entries(arr).map(([k,v]) => ({ tuberia: k, ...v }))).forEach(r => {
    obj[r.tuberia] = { tuberia_m: r.tuberia_m, tees: r.tees, codos: r.codos, reducciones: r.reducciones };
  });
  return obj;
}

/* ── CDT dinámico empotrables ── */
function cdt(sumaTramos, tabDist, disparo = 0, sufijo) {
  const cm = tabDist ? parseFloat(tabDist[`cargaTotal${sufijo}`] ?? 0) : 0;
  return parseFloat(sumaTramos) + cm + disparo + 1.5;
}

/* ── Empaca un resultado de filtro o sanitización ── */
function empacarEquipoSimple(res, label) {
  if (!res || res.error || !res.tablaTramos?.length) return null;
  return {
    label,
    seleccion:         res.seleccion ?? null,
    tablaTramos:       normEquipo(res.tablaTramos),
    cargaTramos:       res.cargaTramos,
    cargaFija:         res.cargaFija_ft,
    cargaTotal:        res.cargaTotal,
    cargaTotalPSI:     res.cargaTotalPSI,
    resumenMateriales: arrAObj(res.resumenMateriales),
    // Sanitización extras
    kgDiaNecesario:    res.kgDiaNecesario ?? null,
    kgDiaInstalado:    res.kgDiaInstalado ?? null,
    modoCloro:         res.modoCloro ?? null,
  };
}

/* ── Empaca un resultado de calentamiento (BDC/caldera/CE/PS) ── */
function empacarCalentamiento(key, label, calentamiento) {
  if (!calentamiento) return null;

  let res = null;
  if (key === "bombaCalor") {
    const modo = calentamiento.modoBDC ?? "recomendado";
    res = modo === "manual" ? calentamiento.bdcManual : calentamiento.bdcSeleccionada;
    if (res?.hidraulica) res = { ...res, ...res.hidraulica, seleccion: res.seleccion ?? { marca: res.bomba?.marca, modelo: res.bomba?.modelo, cantidad: res.cantidad, flujoTotal: res.flujoTotal } };
  } else if (key === "panelSolar") {
    const modo = calentamiento.modoPS ?? "recomendado";
    const src = modo === "manual" ? calentamiento.psManual : calentamiento.psSeleccionado;
    if (!src || src.error) return null;
    res = { ...(src.hidraulica ?? {}), seleccion: src.seleccion ?? { marca: src.panel?.marca, modelo: src.panel?.modelo, cantidad: src.totalPaneles ?? src.seleccion?.cantidad, flujoTotal: src.flujoTotal ?? src.seleccion?.flujoTotal } };
  } else if (key === "caldera") {
    const modo = calentamiento.modoCaldera ?? "recomendado";
    res = modo === "manual" ? calentamiento.calderaManual?.hidraulica ? { ...calentamiento.calderaManual.hidraulica, seleccion: { marca: calentamiento.calderaManual.caldera?.marca, modelo: calentamiento.calderaManual.caldera?.modelo, cantidad: calentamiento.calderaManual.cantidad, flujoTotal: calentamiento.calderaManual.flujoTotal } } : null : calentamiento.calderaSeleccionada;
  } else if (key === "calentadorElectrico") {
    const modo = calentamiento.modoCE ?? "recomendado";
    res = modo === "manual" ? calentamiento.ceManual?.hidraulica ? { ...calentamiento.ceManual.hidraulica, seleccion: { marca: calentamiento.ceManual.equipo?.marca, modelo: calentamiento.ceManual.equipo?.modelo, cantidad: calentamiento.ceManual.cantidad, flujoTotal: calentamiento.ceManual.flujoTotal } } : null : calentamiento.ceSeleccionado;
  }

  if (!res || res.error || !res.tablaTramos?.length) return null;

  return {
    key, label,
    seleccion:         res.seleccion ?? null,
    tablaTramos:       normEquipo(res.tablaTramos),
    tablaDistancia:    res.tablaDistancia ?? null,
    tablaAltura:       res.tablaAltura ?? null,
    cargaTramos:       res.cargaTramos,
    cargaDistanciaIda: res.cargaDistanciaIda,
    cargaDistanciaReg: res.cargaDistanciaReg,
    cargaEstatica:     res.cargaEstatica,
    cargaFriccion:     res.cargaFriccionAltura,
    cargaFija:         res.cargaFija_ft,
    cargaTotal:        res.cargaTotal,
    cargaTotalPSI:     res.cargaTotalPSI,
    resumenMateriales: arrAObj(res.resumenMateriales),
  };
}

/* ================================================================
   FUNCIÓN PRINCIPAL
   ================================================================ */
export function generarMemoriaCalculo({
  estados, datosEmpotrable, tieneDesbordeCanal,
  flujoMaxGlobal, tuberiaMaxGlobal, flujoVolumen, flujoInfinityVal, vol,
  estadoBomba, equilibrio,
  datosPorSistema,          // objeto completo — para extraer calentamiento/sanitización/filtros
  resultadoClorador,        // resultado de generadorDeCloro() del App
  sistemasSeleccionadosSanit,
  sistemasSeleccionadosFilt,
  cargas,
}) {
  if (!datosEmpotrable || !flujoMaxGlobal)
    throw new Error("Faltan datos de empotrable o flujo máximo.");

  const calentamiento = datosPorSistema?.calentamiento;

  /* ── Resumen general ── */
  const resumen = {
    vol:         f2(vol ?? 0),
    flujoVol:    f2(flujoVolumen ?? 0),
    flujoInf:    f2(flujoInfinityVal ?? 0),
    flujoMax:    f2(flujoMaxGlobal),
    tubSuccion:  estadoBomba?.tubSuccion  ?? "—",
    tubDescarga: tuberiaMaxGlobal ?? estadoBomba?.tubDescarga ?? "—",
  };

  const est      = (k) => estados?.[k];
  const tipo     = (k) => est(k)?.tipo ?? null;
  const cant     = (k) => equilibrio?.equipos?.[k]?.cantidad ?? est(k)?.cantidad ?? null;

  /* ════ EMPOTRABLES ════ */
  let retornosData = null;
  if (est("retorno")?.selId) {
    const res = retorno(flujoMaxGlobal, tipo("retorno"), datosEmpotrable, cant("retorno"));
    if (res?.resultadoR?.length) {
      const d = extraerDisparo(res.resultadoR);
      const cm = res.tablaDistanciaCM ? parseFloat(res.tablaDistanciaCM.cargaTotalCM ?? 0) : 0;
      const st = parseFloat(res.sumaFinal) - parseFloat(d?.cargaDisparoTotal ?? 0) - cm;
      retornosData = { resultado: normEmp(res.resultadoR), sumaTramos: f2(st), disparo: d, cargaDisparoTotal: parseFloat(d?.cargaDisparoTotal ?? 0), tablaDistanciaCM: res.tablaDistanciaCM, cargaDinamicaTotal: cdt(st, res.tablaDistanciaCM, parseFloat(d?.cargaDisparoTotal ?? 0), "CM"), resumenTramos: res.resumenTramosR, resumenDisparos: res.resumenDisparosR };
    }
  }

  let desnatadoresData = null;
  if (est("desnatador")?.selId && !tieneDesbordeCanal) {
    const res = desnatador(flujoMaxGlobal, tipo("desnatador"), datosEmpotrable, cant("desnatador"));
    if (res?.resultadoD?.length) {
      const d = extraerDisparo(res.resultadoD);
      const cm = res.tablaDistanciaCMD ? parseFloat(res.tablaDistanciaCMD.cargaTotalCMD ?? 0) : 0;
      const st = parseFloat(res.sumaFinal) - parseFloat(d?.cargaDisparoTotal ?? 0) - cm;
      desnatadoresData = { resultado: normEmp(res.resultadoD), sumaTramos: f2(st), disparo: d, cargaDisparoTotal: parseFloat(d?.cargaDisparoTotal ?? 0), tablaDistanciaCM: res.tablaDistanciaCMD, cargaDinamicaTotal: cdt(st, res.tablaDistanciaCMD, parseFloat(d?.cargaDisparoTotal ?? 0), "CMD"), resumenTramos: res.resumenTramosD, resumenDisparos: res.resumenDisparosD };
    }
  }

  let drenFondoData = null;
  if (est("drenFondo")?.selId) {
    const res = drenFondo(flujoMaxGlobal, tipo("drenFondo"), datosEmpotrable, cant("drenFondo"));
    if (res?.resultadoDF?.length) {
      const cm = res.tablaDistanciaCMDF ? parseFloat(res.tablaDistanciaCMDF.cargaTotalCMDF ?? 0) : 0;
      const st = parseFloat(res.sumaFinal) - cm;
      drenFondoData = { resultado: normEmp(res.resultadoDF), sumaTramos: f2(st), tablaDistanciaCM: res.tablaDistanciaCMDF, cargaDinamicaTotal: cdt(st, res.tablaDistanciaCMDF, 0, "CMDF"), resumenTramos: res.resumenTramosDF };
    }
  }

  let drenCanalData = null;
  if (est("drenCanal")?.selId && tieneDesbordeCanal) {
    const res = drenCanal(flujoMaxGlobal, tipo("drenCanal"), datosEmpotrable, cant("drenCanal"));
    if (res?.resultadoDC?.length) {
      const cm = res.tablaDistanciaCMDC ? parseFloat(res.tablaDistanciaCMDC.cargaTotalCMDC ?? 0) : 0;
      const st = parseFloat(res.sumaFinal) - cm;
      drenCanalData = { resultado: normEmp(res.resultadoDC), sumaTramos: f2(st), tablaDistanciaCM: res.tablaDistanciaCMDC, cargaDinamicaTotal: cdt(st, res.tablaDistanciaCMDC, 0, "CMDC"), resumenTramos: res.resumenTramosDC };
    }
  }

  let barredorasData = null;
  if (est("barredora")?.selId) {
    const res = barredora(flujoMaxGlobal, tipo("barredora"), datosEmpotrable, cant("barredora"));
    if (res?.resultadoB?.length) {
      const d = extraerDisparo(res.resultadoB);
      const cm = res.tablaDistanciaCMB ? parseFloat(res.tablaDistanciaCMB.cargaTotalCMB ?? 0) : 0;
      const st = parseFloat(res.sumaFinal) - parseFloat(d?.cargaDisparoTotal ?? 0) - cm;
      barredorasData = { resultado: normEmp(res.resultadoB), sumaTramos: f2(st), disparo: d, cargaDisparoTotal: parseFloat(d?.cargaDisparoTotal ?? 0), tablaDistanciaCM: res.tablaDistanciaCMB, cargaDinamicaTotal: cdt(st, res.tablaDistanciaCMB, parseFloat(d?.cargaDisparoTotal ?? 0), "CMB"), resumenTramos: res.resumenTramosB, resumenDisparos: res.resumenDisparosB };
    }
  }

  /* ════ FILTRACIÓN — usa el resultado completo guardado en el estado ════ */
  let filtroArenaData = null, prefiltroData = null, filtroCartuchoData = null;

  if (sistemasSeleccionadosFilt?.filtroArena && est("filtroArena")?.selId) {
    const eq = est("filtroArena");
    const res = eq.resultado ?? calcularCargaFiltroArenaManual(eq.flujoEf ?? 0, eq.cantidad ?? 1);
    filtroArenaData = empacarEquipoSimple({
      ...res,
      seleccion: res.seleccion ?? { marca: eq.marca, modelo: eq.modelo, cantidad: eq.cantidad, flujoTotal: (eq.flujoEf ?? 0) * (eq.cantidad ?? 1) }
    }, "Filtro de arena");
  }

  if (sistemasSeleccionadosFilt?.prefiltro && est("prefiltro")?.selId) {
    const eq = est("prefiltro");
    const res = eq.resultado ?? calcularCargaPrefiltroManual(eq.flujoEf ?? 0, eq.cantidad ?? 1);
    prefiltroData = empacarEquipoSimple({
      ...res,
      seleccion: res.seleccion ?? { marca: eq.marca, modelo: eq.modelo, cantidad: eq.cantidad, flujoTotal: (eq.flujoEf ?? 0) * (eq.cantidad ?? 1) }
    }, "Prefiltro");
  }

  if (sistemasSeleccionadosFilt?.filtroCartucho && est("filtroCartucho")?.selId) {
    const eq = est("filtroCartucho");
    const res = eq.resultado ?? calcularCargaFiltroCartuchoManual(eq.flujoEf ?? 0, eq.cantidad ?? 1);
    filtroCartuchoData = empacarEquipoSimple({
      ...res,
      seleccion: res.seleccion ?? { marca: eq.marca, modelo: eq.modelo, cantidad: eq.cantidad, flujoTotal: (eq.flujoEf ?? 0) * (eq.cantidad ?? 1) }
    }, "Filtro de cartucho");
  }

  /* ════ SANITIZACIÓN ════ */
  let cloradorSalinoData = null, lamparaUVData = null, cloradorAutomaticoData = null;

  if (sistemasSeleccionadosSanit?.cloradorSalino && resultadoClorador && !resultadoClorador.error) {
    cloradorSalinoData = empacarEquipoSimple(resultadoClorador, "Generador de cloro salino");
  }

  if (sistemasSeleccionadosSanit?.lamparaUV && est("lamparaUV")) {
    const eqUV = est("lamparaUV");
    // lamparaUV sube { marca, modelo, cantidad, flujoTotal } desde onEstadoChange
    const flujoPorUV = eqUV.flujoTotal ? parseFloat(eqUV.flujoTotal) / (eqUV.cantidad ?? 1) : flujoMaxGlobal;
    const resUV = calcularCargaUVManual(flujoPorUV, eqUV.cantidad ?? 1);
    if (!resUV?.error) {
      lamparaUVData = empacarEquipoSimple({
        ...resUV,
        seleccion: { marca: eqUV.marca, modelo: eqUV.modelo, cantidad: eqUV.cantidad, flujoTotal: eqUV.flujoTotal }
      }, "Lámpara UV");
    }
  }

  if (sistemasSeleccionadosSanit?.cloradorAutomatico && est("cloradorAutomatico")) {
    const eqCA = est("cloradorAutomatico");
    const flujoPorCA = eqCA.flujoTotal ? parseFloat(eqCA.flujoTotal) / (eqCA.cantidad ?? 1) : flujoMaxGlobal;
    const resCA = calcularCargaCloradorAutomaticoManual(flujoPorCA, eqCA.cantidad ?? 1, "enLinea");
    if (!resCA?.error) {
      cloradorAutomaticoData = empacarEquipoSimple({
        ...resCA,
        seleccion: { marca: eqCA.marca, modelo: eqCA.modelo, cantidad: eqCA.cantidad, flujoTotal: eqCA.flujoTotal }
      }, "Clorador automático");
    }
  }

  /* ════ CALENTAMIENTO ════ */
  const calentamientoData = [];
  if (calentamiento?.sistemasSeleccionados?.bombaCalor) {
    const d = empacarCalentamiento("bombaCalor", "Bomba de calor", calentamiento);
    if (d) calentamientoData.push(d);
  }
  if (calentamiento?.sistemasSeleccionados?.panelSolar) {
    const d = empacarCalentamiento("panelSolar", "Panel solar", calentamiento);
    if (d) calentamientoData.push(d);
  }
  if (calentamiento?.sistemasSeleccionados?.caldera) {
    const d = empacarCalentamiento("caldera", "Caldera de gas", calentamiento);
    if (d) calentamientoData.push(d);
  }
  if (calentamiento?.sistemasSeleccionados?.calentadorElectrico) {
    const d = empacarCalentamiento("calentadorElectrico", "Calentador eléctrico", calentamiento);
    if (d) calentamientoData.push(d);
  }

  /* ── Empaquetar ── */
  const memoria = {
    resumen,
    retornos: retornosData, desnatadores: desnatadoresData,
    drenFondo: drenFondoData, drenCanal: drenCanalData, barredoras: barredorasData,
    filtroArena: filtroArenaData, prefiltro: prefiltroData, filtroCartucho: filtroCartuchoData,
    cloradorSalino: cloradorSalinoData, lamparaUV: lamparaUVData, cloradorAutomatico: cloradorAutomaticoData,
    calentamiento: calentamientoData,
  };

  try {
    sessionStorage.setItem("memoriaCalculo", JSON.stringify(memoria));
  } catch (e) {
    throw new Error("No se pudo guardar en sessionStorage: " + e.message);
  }
  return memoria;
}