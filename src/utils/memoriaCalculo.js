/* ================================================================
   memoriaCalculo.js — v4
   Genera 3 reportes: diseño original, iter 1, iter 2
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

function normEquipo(filas) {
  return (filas ?? []).map(f => ({
    tramo: f.tramo ?? f.tandem, flujo: f.flujo, tuberia: f.tuberia,
    velocidad: f.velocidad, cargaBase: f.cargaBase,
    longitud: f.longitud_m ?? f.longitud ?? "1.00", cargaTramo: f.cargaTramo,
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
    paneles: f.paneles ?? null, flujoTandem: f.flujoTandem ?? null, cargaEntrada: f.cargaEntrada ?? null,
  }));
}

function arrAObj(arr) {
  if (!arr) return {};
  const obj = {};
  (Array.isArray(arr) ? arr : Object.entries(arr).map(([k,v]) => ({ tuberia: k, ...v }))).forEach(r => {
    obj[r.tuberia] = { tuberia_m: r.tuberia_m, tees: r.tees, codos: r.codos, reducciones: r.reducciones };
  });
  return obj;
}

function cdtTotal(sumaTramos, tabDist, disparo, sufijo) {
  const cm = tabDist ? parseFloat(tabDist[`cargaTotal${sufijo}`] ?? 0) : 0;
  return parseFloat(sumaTramos) + cm + disparo + 1.5;
}

/* ── Empaca un resultado de retorno/desnatador/barredora/drenFondo/drenCanal ── */
function empacarEmpotrable(res, tipo) {
  if (!res) return null;
  const resultados = {
    retorno:    res.resultadoR,
    desnatador: res.resultadoD,
    barredora:  res.resultadoB,
    drenFondo:  res.resultadoDF,
    drenCanal:  res.resultadoDC,
  };
  const tablasCM = {
    retorno:    { tabla: res.tablaDistanciaCM,  sufijo: "CM"   },
    desnatador: { tabla: res.tablaDistanciaCMD, sufijo: "CMD"  },
    barredora:  { tabla: res.tablaDistanciaCMB, sufijo: "CMB"  },
    drenFondo:  { tabla: res.tablaDistanciaCMDF, sufijo: "CMDF" },
    drenCanal:  { tabla: res.tablaDistanciaCMDC, sufijo: "CMDC" },
  };
  const resumenesTramos = {
    retorno:    res.resumenTramosR,
    desnatador: res.resumenTramosD,
    barredora:  res.resumenTramosB,
    drenFondo:  res.resumenTramosDF,
    drenCanal:  res.resumenTramosDC,
  };
  const resumenesDisparos = {
    retorno:    res.resumenDisparosR,
    desnatador: res.resumenDisparosD,
    barredora:  res.resumenDisparosB,
  };

  const filas = resultados[tipo];
  if (!filas?.length) return null;

  const { tabla: tabDist, sufijo } = tablasCM[tipo];
  const tieneDisparo = ["retorno","desnatador","barredora"].includes(tipo);
  const disparo = tieneDisparo ? extraerDisparo(filas) : null;
  const cm = tabDist ? parseFloat(tabDist[`cargaTotal${sufijo}`] ?? 0) : 0;
  const st = parseFloat(res.sumaFinal) - parseFloat(disparo?.cargaDisparoTotal ?? 0) - cm;

  return {
    resultado:          normEmp(filas),
    sumaTramos:         f2(st),
    disparo,
    cargaDisparoTotal:  parseFloat(disparo?.cargaDisparoTotal ?? 0),
    tablaDistanciaCM:   tabDist,
    cargaDinamicaTotal: cdtTotal(st, tabDist, parseFloat(disparo?.cargaDisparoTotal ?? 0), sufijo),
    resumenTramos:      resumenesTramos[tipo],
    resumenDisparos:    resumenesDisparos[tipo] ?? null,
  };
}

/* ── Empaca filtro/UV desde resultado hidráulico ── */
function empacarFiltroRes(res, label, seleccion) {
  if (!res || res.error || !res.tablaTramos?.length) return null;
  return {
    label,
    seleccion:         seleccion ?? res.seleccion ?? null,
    tablaTramos:       normEquipo(res.tablaTramos),
    cargaTramos:       res.cargaTramos,
    cargaFija:         res.cargaFija_ft,
    cargaTotal:        res.cargaTotal,
    cargaTotalPSI:     res.cargaTotalPSI,
    resumenMateriales: arrAObj(res.resumenMateriales),
    kgDiaNecesario:    res.kgDiaNecesario ?? null,
    modoCloro:         res.modoCloro ?? null,
  };
}

/* ================================================================
   GENERAR UN REPORTE (diseño original, iter1, iter2)
   flujo: flujo total del sistema para este reporte
   equiposRecalc: resultados de calcularEquilibrio (null para diseño original)
   estados, tieneDesbordeCanal, datosEmpotrable: contexto del sistema
   ================================================================ */
function generarReporte({
  label, flujo, flujoDiseno,
  estados, datosEmpotrable, tieneDesbordeCanal,
  sistemasSeleccionadosFilt, sistemasSeleccionadosSanit,
  resultadoClorador, equilibrio,
  equiposRecalcIter,
}) {
  const est  = (k) => estados?.[k];
  const tipo = (k) => est(k)?.tipo ?? null;

  // Para diseño original: cantidad del estado original
  // Para iteraciones: cantidad recalculada de esa iteración
  const cantParaKey = (k) => {
    if (equiposRecalcIter) {
      return equiposRecalcIter[k]?.cantidad ?? est(k)?.cantidad ?? null;
    }
    return est(k)?.cantidad ?? null;
  };

  // Flujo a usar en los fallbacks:
  // - Diseño original: flujoDiseno (105.7 GPM)
  // - Iteraciones: flujo de esa iteración, pero solo si no hay resultadoHidraulico
  const flujoCalculo = equiposRecalcIter ? flujo : flujoDiseno;

  /* ── Empotrables ── */
  const empKeys = tieneDesbordeCanal
    ? ["retorno", "barredora", "drenFondo", "drenCanal"]
    : ["retorno", "desnatador", "barredora", "drenFondo"];

  const fnsEmp = {
    retorno:    (f,t,d,n) => retorno(f,t,d,n),
    desnatador: (f,t,d,n) => desnatador(f,t,d,n),
    barredora:  (f,t,d,n) => barredora(f,t,d,n),
    drenFondo:  (f,t,d,n) => drenFondo(f,t,d,n),
    drenCanal:  (f,t,d,n) => drenCanal(f,t,d,n),
  };

  const empotrables = {};
  for (const key of empKeys) {
    if (!est(key)?.selId) continue;
    const resIter = equiposRecalcIter?.[key]?.resultadoHidraulico;
    const res = resIter ?? fnsEmp[key](flujoCalculo, tipo(key), datosEmpotrable, cantParaKey(key));
    const data = empacarEmpotrable(res, key);
    if (data) empotrables[key] = data;
  }

  /* ── Filtros ── */
  const filtros = {};

  if (sistemasSeleccionadosFilt?.filtroArena && est("filtroArena")?.selId) {
    const resIter = equiposRecalcIter?.filtroArena?.resultadoHidraulico;
    const eq = est("filtroArena");
    const res = resIter ?? calcularCargaFiltroArenaManual(eq.flujoEf ?? 0, cantParaKey("filtroArena") ?? 1);
    const data = empacarFiltroRes(res, "Filtro de arena", { marca: eq.marca, modelo: eq.modelo, cantidad: cantParaKey("filtroArena"), flujoTotal: (eq.flujoEf ?? 0) * cantParaKey("filtroArena") });
    if (data) filtros.filtroArena = data;
  }

  if (sistemasSeleccionadosFilt?.prefiltro && est("prefiltro")?.selId) {
    const resIter = equiposRecalcIter?.prefiltro?.resultadoHidraulico;
    const eq = est("prefiltro");
    const res = resIter ?? calcularCargaPrefiltroManual(eq.flujoEf ?? 0, cantParaKey("prefiltro") ?? 1);
    const data = empacarFiltroRes(res, "Prefiltro", { marca: eq.marca, modelo: eq.modelo, cantidad: cantParaKey("prefiltro"), flujoTotal: (eq.flujoEf ?? 0) * cantParaKey("prefiltro") });
    if (data) filtros.prefiltro = data;
  }

  if (sistemasSeleccionadosFilt?.filtroCartucho && est("filtroCartucho")?.selId) {
    const resIter = equiposRecalcIter?.filtroCartucho?.resultadoHidraulico;
    const eq = est("filtroCartucho");
    const res = resIter ?? calcularCargaFiltroCartuchoManual(eq.flujoEf ?? 0, cantParaKey("filtroCartucho") ?? 1);
    const data = empacarFiltroRes(res, "Filtro de cartucho", { marca: eq.marca, modelo: eq.modelo, cantidad: cantParaKey("filtroCartucho"), flujoTotal: (eq.flujoEf ?? 0) * cantParaKey("filtroCartucho") });
    if (data) filtros.filtroCartucho = data;
  }

  /* ── Sanitización (UV en línea con flujo principal) ── */
  const sanitizacion = {};

  if (sistemasSeleccionadosSanit?.cloradorSalino && resultadoClorador && !resultadoClorador.error) {
    const data = empacarFiltroRes(resultadoClorador, "Generador de cloro salino");
    if (data) sanitizacion.cloradorSalino = data;
  }

  if (sistemasSeleccionadosSanit?.lamparaUV && est("lamparaUV")?.selId) {
    const resIter = equiposRecalcIter?.lamparaUV?.resultadoHidraulico;
    const eqUV = est("lamparaUV");
    const cant = cantParaKey("lamparaUV") ?? 1;
    const flujoPorUV = flujo / cant;
    const res = resIter ?? calcularCargaUVManual(flujoPorUV, cant);
    const data = empacarFiltroRes(res, "Lámpara UV", { marca: eqUV.marca, modelo: eqUV.modelo, cantidad: cant, flujoTotal: flujo });
    if (data) sanitizacion.lamparaUV = data;
  }

  if (sistemasSeleccionadosSanit?.cloradorAutomatico && est("cloradorAutomatico")?.selId) {
    const eqCA = est("cloradorAutomatico");
    const cant = cantParaKey("cloradorAutomatico") ?? 1;
    const flujoPorCA = (eqCA.flujoTotal ?? flujo) / cant;
    const res = calcularCargaCloradorAutomaticoManual(flujoPorCA, cant, "enLinea");
    const data = empacarFiltroRes(res, "Clorador automático", { marca: eqCA.marca, modelo: eqCA.modelo, cantidad: cant, flujoTotal: eqCA.flujoTotal ?? flujo });
    if (data) sanitizacion.cloradorAutomatico = data;
  }

  return { label, flujo: f2(flujo), empotrables, filtros, sanitizacion };
}

/* ── Empaca calentamiento (igual para todos los reportes) ── */
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
    res = modo === "manual" ? (calentamiento.calderaManual?.hidraulica ? { ...calentamiento.calderaManual.hidraulica, seleccion: { marca: calentamiento.calderaManual.caldera?.marca, modelo: calentamiento.calderaManual.caldera?.modelo, cantidad: calentamiento.calderaManual.cantidad, flujoTotal: calentamiento.calderaManual.flujoTotal } } : null) : calentamiento.calderaSeleccionada;
  } else if (key === "calentadorElectrico") {
    const modo = calentamiento.modoCE ?? "recomendado";
    res = modo === "manual" ? (calentamiento.ceManual?.hidraulica ? { ...calentamiento.ceManual.hidraulica, seleccion: { marca: calentamiento.ceManual.equipo?.marca, modelo: calentamiento.ceManual.equipo?.modelo, cantidad: calentamiento.ceManual.cantidad, flujoTotal: calentamiento.ceManual.flujoTotal } } : null) : calentamiento.ceSeleccionado;
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
  flujoMaxGlobal, cargaTotalGlobal,
  tuberiaMaxGlobal, flujoVolumen, flujoInfinityVal, vol,
  estadoBomba, equilibrio,
  datosPorSistema,
  resultadoClorador,
  sistemasSeleccionadosSanit,
  sistemasSeleccionadosFilt,
  cargas,
}) {
  if (!datosEmpotrable || !flujoMaxGlobal)
    throw new Error("Faltan datos de empotrable o flujo máximo.");

  const calentamiento = datosPorSistema?.calentamiento;
  const iteraciones   = equilibrio?.iteraciones ?? [];
  const equilibrioFinal = equilibrio?.equilibrio ?? null;

  /* ── Resumen general ── */
  const resumen = {
    vol:         f2(vol ?? 0),
    flujoVol:    f2(flujoVolumen ?? 0),
    flujoInf:    f2(flujoInfinityVal ?? 0),
    flujoMax:    f2(flujoMaxGlobal),
    tubSuccion:  estadoBomba?.tubSuccion  ?? "—",
    tubDescarga: tuberiaMaxGlobal ?? estadoBomba?.tubDescarga ?? "—",
    bomba:       estadoBomba ? `${estadoBomba.marca} ${estadoBomba.modelo}` : "—",
    nBombas:     estadoBomba?.nBombas ?? 1,
    flujoFinal:  f2(equilibrioFinal?.flujo ?? flujoMaxGlobal),
    cdtFinal:    f2(equilibrioFinal?.carga ?? 0),
    // CDT totales reales de cada etapa (del equilibrio hidráulico, no recalculados)
    cdtDiseno:   f2(cargaTotalGlobal ?? flujoMaxGlobal),
    cdtIter1:    f2(iteraciones[0]?.cargaSalida ?? 0),
    cdtIter2:    f2(iteraciones[1]?.cargaSalida ?? equilibrioFinal?.carga ?? 0),
    flujoIter1:  f2(iteraciones[0]?.flujoEquilibrio ?? 0),
    flujoIter2:  f2(iteraciones[1]?.flujoEquilibrio ?? 0),
  };

  const ctx = {
    estados, datosEmpotrable, tieneDesbordeCanal,
    sistemasSeleccionadosFilt, sistemasSeleccionadosSanit,
    resultadoClorador,
  };

  /* ── 3 Reportes ── */
  const reporteDiseno = generarReporte({
    ...ctx,
    label: "Diseño original",
    flujo: flujoMaxGlobal,
    flujoDiseno: flujoMaxGlobal,
    equilibrio: equilibrioFinal,
    equiposRecalcIter: null,
  });

  const reporteIter1 = iteraciones[0] ? generarReporte({
    ...ctx,
    label: `Iter. 1 — ${f2(iteraciones[0].flujoEquilibrio)} GPM @ ${f2(iteraciones[0].cargaEntrada)} ft`,
    flujo: iteraciones[0].flujoEquilibrio,
    flujoDiseno: flujoMaxGlobal,
    equilibrio: equilibrioFinal,
    equiposRecalcIter: iteraciones[0].equiposRecalc,
  }) : null;

  const reporteIter2 = iteraciones[1] ? generarReporte({
    ...ctx,
    label: `Iter. 2 — ${f2(iteraciones[1].flujoEquilibrio)} GPM @ ${f2(iteraciones[1].cargaEntrada)} ft`,
    flujo: iteraciones[1].flujoEquilibrio,
    flujoDiseno: flujoMaxGlobal,
    equilibrio: equilibrioFinal,
    equiposRecalcIter: iteraciones[1].equiposRecalc,
  }) : null;

  /* ── Calentamiento (igual en los 3 reportes) ── */
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

  const memoria = {
    resumen,
    reportes: [reporteDiseno, reporteIter1, reporteIter2].filter(Boolean),
    calentamiento: calentamientoData,
  };

  try {
    sessionStorage.setItem("memoriaCalculo", JSON.stringify(memoria));
  } catch (e) {
    throw new Error("No se pudo guardar en sessionStorage: " + e.message);
  }
  return memoria;
}