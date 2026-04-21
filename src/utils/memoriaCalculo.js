/* ================================================================
   memoriaCalculo.js — v4 fixed
   Genera 3 reportes: diseño original, iter 1 (★), iter 2 (★)
   Los puntos de iteración corresponden exactamente a los puntos
   de equilibrio encontrados, con sus equipos recalculados.
   ================================================================ */

import { retorno }        from "./retorno";
import { getClimaMensual } from "../data/clima";
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

function empacarEmpotrable(res, tipo) {
  if (!res) return null;
  const resultados = {
    retorno: res.resultadoR, desnatador: res.resultadoD,
    barredora: res.resultadoB, drenFondo: res.resultadoDF, drenCanal: res.resultadoDC,
  };
  const tablasCM = {
    retorno:    { tabla: res.tablaDistanciaCM,   sufijo: "CM"   },
    desnatador: { tabla: res.tablaDistanciaCMD,  sufijo: "CMD"  },
    barredora:  { tabla: res.tablaDistanciaCMB,  sufijo: "CMB"  },
    drenFondo:  { tabla: res.tablaDistanciaCMDF, sufijo: "CMDF" },
    drenCanal:  { tabla: res.tablaDistanciaCMDC, sufijo: "CMDC" },
  };
  const resumenesTramos   = { retorno: res.resumenTramosR, desnatador: res.resumenTramosD, barredora: res.resumenTramosB, drenFondo: res.resumenTramosDF, drenCanal: res.resumenTramosDC };
  const resumenesDisparos = { retorno: res.resumenDisparosR, desnatador: res.resumenDisparosD, barredora: res.resumenDisparosB };

  const filas = resultados[tipo];
  if (!filas?.length) return null;

  const { tabla: tabDist, sufijo } = tablasCM[tipo];
  const tieneDisparo = ["retorno","desnatador","barredora"].includes(tipo);
  const disparo = tieneDisparo ? extraerDisparo(filas) : null;
  const cm = tabDist ? parseFloat(tabDist[`cargaTotal${sufijo}`] ?? 0) : 0;
  const st = parseFloat(res.sumaFinal) - parseFloat(disparo?.cargaDisparoTotal ?? 0) - cm;

  return {
    resultado: normEmp(filas), sumaTramos: f2(st), disparo,
    cargaDisparoTotal: parseFloat(disparo?.cargaDisparoTotal ?? 0),
    tablaDistanciaCM: tabDist,
    cargaDinamicaTotal: cdtTotal(st, tabDist, parseFloat(disparo?.cargaDisparoTotal ?? 0), sufijo),
    resumenTramos: resumenesTramos[tipo],
    resumenDisparos: resumenesDisparos[tipo] ?? null,
    // seleccion: se agrega en generarReporte con datos del estado
  };
}

function empacarFiltroRes(res, label, seleccion) {
  if (!res || res.error || !res.tablaTramos?.length) return null;
  return {
    label, seleccion: seleccion ?? res.seleccion ?? null,
    tablaTramos: normEquipo(res.tablaTramos),
    cargaTramos: res.cargaTramos, cargaFija: res.cargaFija_ft,
    cargaTotal: res.cargaTotal, cargaTotalPSI: res.cargaTotalPSI,
    resumenMateriales: arrAObj(res.resumenMateriales),
    kgDiaNecesario: res.kgDiaNecesario ?? null, modoCloro: res.modoCloro ?? null,
  };
}

function generarReporte({ label, flujo, flujoDiseno, estados, datosEmpotrable, tieneDesbordeCanal,
  sistemasSeleccionadosFilt, sistemasSeleccionadosSanit, resultadoClorador, equiposRecalcIter }) {
  const est  = (k) => estados?.[k];
  const tipo = (k) => est(k)?.tipo ?? null;

  const cantParaKey = (k) => {
    if (equiposRecalcIter) return equiposRecalcIter[k]?.cantidad ?? est(k)?.cantidad ?? null;
    return est(k)?.cantidad ?? null;
  };

  // Para diseño original usar flujoDiseno, para iteraciones usar flujo del equilibrio
  const flujoCalculo = equiposRecalcIter ? flujo : flujoDiseno;

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
    if (data) {
      // Agregar info de seleccion para el tab de equipos
      // marca/modelo vienen de equiposRecalcIter (tiene los datos del catalogo)
      // o del estado si el diseño original no los tiene
      const recKey = equiposRecalcIter?.[key];
      const cant   = cantParaKey(key) ?? est(key)?.cantidad ?? 1;
      data.seleccion = {
        marca:      recKey?.marca      ?? est(key)?.marca    ?? "—",
        modelo:     recKey?.modelo     ?? est(key)?.modelo   ?? "—",
        cantidad:   cant,
        flujoTotal: data.resultado?.[0]?.flujo != null
          ? f2(parseFloat(data.resultado[0].flujo) * cant)
          : null,
      };
      empotrables[key] = data;
    }
  }

  const filtros = {};

  if (sistemasSeleccionadosFilt?.filtroArena && est("filtroArena")?.selId) {
    const resIter = equiposRecalcIter?.filtroArena?.resultadoHidraulico;
    const eq = est("filtroArena");
    const cant = cantParaKey("filtroArena") ?? 1;
    const res = resIter ?? calcularCargaFiltroArenaManual(eq.flujoEf ?? 0, cant, flujoCalculo);
    const data = empacarFiltroRes(res, "Filtro de arena", { marca: eq.marca, modelo: eq.modelo, cantidad: cant, flujoTotal: (eq.flujoEf ?? 0) * cant });
    if (data) filtros.filtroArena = data;
  }

  if (sistemasSeleccionadosFilt?.prefiltro && est("prefiltro")?.selId) {
    const resIter = equiposRecalcIter?.prefiltro?.resultadoHidraulico;
    const eq = est("prefiltro");
    const cant = cantParaKey("prefiltro") ?? 1;
    const res = resIter ?? calcularCargaPrefiltroManual(eq.flujoEf ?? 0, cant, flujoCalculo);
    const data = empacarFiltroRes(res, "Prefiltro", { marca: eq.marca, modelo: eq.modelo, cantidad: cant, flujoTotal: (eq.flujoEf ?? 0) * cant });
    if (data) filtros.prefiltro = data;
  }

  if (sistemasSeleccionadosFilt?.filtroCartucho && est("filtroCartucho")?.selId) {
    const resIter = equiposRecalcIter?.filtroCartucho?.resultadoHidraulico;
    const eq = est("filtroCartucho");
    const cant = cantParaKey("filtroCartucho") ?? 1;
    const res = resIter ?? calcularCargaFiltroCartuchoManual(eq.flujoEf ?? 0, cant, flujoCalculo);
    const data = empacarFiltroRes(res, "Filtro de cartucho", { marca: eq.marca, modelo: eq.modelo, cantidad: cant, flujoTotal: (eq.flujoEf ?? 0) * cant });
    if (data) filtros.filtroCartucho = data;
  }

  const sanitizacion = {};

  if (sistemasSeleccionadosSanit?.cloradorSalino && resultadoClorador && !resultadoClorador.error) {
    const data = empacarFiltroRes(resultadoClorador, "Generador de cloro salino");
    if (data) sanitizacion.cloradorSalino = data;
  }

  if (sistemasSeleccionadosSanit?.lamparaUV) {
    const eqUV = est("lamparaUV");
    // lamparaUV no usa selId — verifica que tenga datos validos
    if (eqUV?.marca || eqUV?.modelo || eqUV?.cantidad) {
      const resIter = equiposRecalcIter?.lamparaUV?.resultadoHidraulico;
      const cant = eqUV?.cantidad ?? cantParaKey("lamparaUV") ?? 1;
      // flujoTotal del estado UV (flujo por equipo × cantidad)
      const flujoTotalUV = eqUV?.flujoTotal ? parseFloat(eqUV.flujoTotal) : flujoCalculo;
      const flujoPorUV = cant > 0 ? flujoTotalUV / cant : flujoCalculo;
      const res = resIter ?? calcularCargaUVManual(flujoPorUV, cant, flujoCalculo);
      const data = empacarFiltroRes(res, "Lampara UV", { marca: eqUV?.marca, modelo: eqUV?.modelo, cantidad: cant, flujoTotal: flujoTotalUV });
      if (data) sanitizacion.lamparaUV = data;
    }
  }

  if (sistemasSeleccionadosSanit?.cloradorAutomatico) {
    const eqCA = est("cloradorAutomatico");
    // cloradorAutomatico puede no tener selId — verificar datos minimos
    const tieneCA = eqCA?.selId || eqCA?.marca || eqCA?.modelo || eqCA?.cantidad;
    if (tieneCA) {
      const cant = eqCA?.cantidad ?? cantParaKey("cloradorAutomatico") ?? 1;
      const flujoTotalCA = eqCA?.flujoTotal ? parseFloat(eqCA.flujoTotal) : flujoCalculo;
      const flujoPorCA = cant > 0 ? flujoTotalCA / cant : flujoCalculo;
      const instalacion = eqCA?.instalacion ?? "enLinea";
      const res = calcularCargaCloradorAutomaticoManual(flujoPorCA, cant, instalacion);
      const data = empacarFiltroRes(res, "Clorador automatico", { marca: eqCA?.marca, modelo: eqCA?.modelo, cantidad: cant, flujoTotal: flujoTotalCA });
      if (data) sanitizacion.cloradorAutomatico = data;
    }
  }

  return { label, flujo: f2(flujo), empotrables, filtros, sanitizacion };
}

/* ── Genera las tablas de calentamiento para un reporte (carga fija, no cambia) ── */
function generarCalentamientoReporte(calentamiento) {
  if (!calentamiento) return [];
  const calSistemas = calentamiento?.sistemasSeleccionados ?? {};
  const result = [];
  if (calSistemas.bombaCalor)          { const d = empacarCalentamiento("bombaCalor",          "Bomba de calor",        calentamiento); if (d) result.push(d); }
  if (calSistemas.panelSolar)          { const d = empacarCalentamiento("panelSolar",           "Panel solar",           calentamiento); if (d) result.push(d); }
  if (calSistemas.caldera)             { const d = empacarCalentamiento("caldera",              "Caldera de gas",        calentamiento); if (d) result.push(d); }
  if (calSistemas.calentadorElectrico) { const d = empacarCalentamiento("calentadorElectrico",  "Calentador electrico",  calentamiento); if (d) result.push(d); }
  return result;
}

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

  let tablaDistancia = res.tablaDistancia ?? null;

  // Limpiar tablaAltura: alturaMaxSist_m no debe mostrar valores > 999
  // (el componente pasa alturaMax + 1000 cuando el equipo no gobierna)
  let tablaAltura = res.tablaAltura ?? null;
  if (tablaAltura) {
    const altMax = parseFloat(tablaAltura.alturaMaxSist_m ?? 0);
    // Altura propia del equipo — buscar en todos los nombres posibles
    const altPropia = parseFloat(
      tablaAltura.alturaBDC_m ?? tablaAltura.alturaCE_m ??
      tablaAltura.alturaCaldera_m ?? tablaAltura.alturaPS_m ??
      tablaAltura.alturaEquipo_m ?? 0
    );
    tablaAltura = {
      ...tablaAltura,
      // Si alturaMax > 999 es el truco del componente — mostrar la propia
      alturaMaxSist_m: f2(altMax > 999 ? altPropia : altMax),
      alturaBDC_m:     tablaAltura.alturaBDC_m     ?? undefined,
      alturaCE_m:      tablaAltura.alturaCE_m      ?? undefined,
      alturaCaldera_m: tablaAltura.alturaCaldera_m ?? undefined,
      alturaPS_m:      tablaAltura.alturaPS_m      ?? undefined,
      alturaEquipo_m:  tablaAltura.alturaEquipo_m  ?? undefined,
    };
  }

  return {
    key, label,
    seleccion: res.seleccion ?? null,
    tablaTramos: normEquipo(res.tablaTramos),
    tablaDistancia,
    tablaAltura,
    cargaTramos: res.cargaTramos, cargaDistanciaIda: res.cargaDistanciaIda,
    cargaDistanciaReg: res.cargaDistanciaReg, cargaEstatica: res.cargaEstatica,
    cargaFriccion: res.cargaFriccionAltura, cargaFija: res.cargaFija_ft,
    cargaTotal: res.cargaTotal, cargaTotalPSI: res.cargaTotalPSI,
    resumenMateriales: arrAObj(res.resumenMateriales),
  };
}

/* ================================================================
   FUNCION PRINCIPAL
   ================================================================ */
export function generarMemoriaCalculo({
  estados, datosEmpotrable, tieneDesbordeCanal,
  flujoMaxGlobal, cargaTotalGlobal,
  tuberiaMaxGlobal, flujoVolumen, flujoInfinityVal, flujoFiltradoVal, vol,
  estadoBomba, equilibrio,
  datosPorSistema, resultadoClorador,
  sistemasSeleccionadosSanit, sistemasSeleccionadosFilt,
  cargas,
}) {
  if (!datosEmpotrable || !flujoMaxGlobal)
    throw new Error("Faltan datos de empotrable o flujo maximo.");

  const calentamiento   = datosPorSistema?.calentamiento;
  const iteraciones     = equilibrio?.iteraciones ?? [];
  const equilibrioFinal = equilibrio?.equilibrio ?? null;

  /* ── Buscar puntos de equilibrio ★ en iter1 e iter2
     El array tiene: [pasos iter1...] [★ iter1] [separador] [pasos iter2...] [★ iter2]
  ── */
  let eqIter1 = null;
  let eqIter2 = null;
  let pasadoSeparador = false;
  for (const it of iteraciones) {
    if (it.separador) { pasadoSeparador = true; continue; }
    if (it.esEquilibrio) {
      if (!pasadoSeparador && !eqIter1) eqIter1 = it;
      else if (pasadoSeparador && !eqIter2) eqIter2 = it;
    }
  }
  if (!eqIter2) eqIter2 = eqIter1; // fallback: iter2 mismo punto que iter1

  /* ── Resumen general ── */
  const resumen = {
    area:        f2(datosEmpotrable?.area ?? 0),
    vol:         f2(vol ?? 0),
    flujoVol:    f2(flujoFiltradoVal ?? flujoVolumen ?? 0),
    flujoInf:    f2(flujoInfinityVal ?? 0),
    flujoMax:    f2(flujoMaxGlobal),
    tubSuccion:  estadoBomba?.tubSuccion  ?? "—",
    tubDescarga: tuberiaMaxGlobal ?? estadoBomba?.tubDescarga ?? "—",
    bomba:       estadoBomba ? `${estadoBomba.marca} ${estadoBomba.modelo}` : "—",
    nBombas:     estadoBomba?.nBombas ?? 1,
    flujoFinal:  f2(equilibrioFinal?.flujo ?? flujoMaxGlobal),
    cdtFinal:    f2(equilibrioFinal?.carga ?? 0),
    cdtDiseno:   f2(cargaTotalGlobal ?? 0),
    cdtIter1:    f2(eqIter1?.cargaSalida ?? 0),
    cdtIter2:    f2(eqIter2?.cargaSalida ?? equilibrioFinal?.carga ?? 0),
    flujoIter1:  f2(eqIter1?.flujoEquilibrio ?? 0),
    flujoIter2:  f2(eqIter2?.flujoEquilibrio ?? 0),
    // Flujos por sistema/proceso — para tabla de requerimientos
    flujosRequeridos: [
      flujoFiltradoVal > 0   ? { label: "Filtrado",             valor: flujoFiltradoVal }  : null,
      flujoInfinityVal > 0   ? { label: "Infinity",             valor: flujoInfinityVal }  : null,
      // Calentamiento — se agrega después de construir calentamientoData
    ].filter(Boolean),
  };

  const ctx = {
    estados, datosEmpotrable, tieneDesbordeCanal,
    sistemasSeleccionadosFilt, sistemasSeleccionadosSanit, resultadoClorador,
  };

  /* ── 3 Reportes ── */
  const reporteDiseno = generarReporte({
    ...ctx, label: "Diseno original",
    flujo: flujoMaxGlobal, flujoDiseno: flujoMaxGlobal,
    equiposRecalcIter: null,
  });

  // Iter 1: equipos exactamente en el punto ★ de iter 1
  const reporteIter1 = eqIter1 ? generarReporte({
    ...ctx, label: `Iter. 1 — ${f2(eqIter1.flujoEquilibrio)} GPM`,
    flujo: eqIter1.flujoEquilibrio, flujoDiseno: flujoMaxGlobal,
    equiposRecalcIter: eqIter1.equiposRecalc,
  }) : null;

  // Iter 2: siempre se genera si existe eqIter2 (aunque converja al mismo flujo que iter1)
  const reporteIter2 = eqIter2 ? generarReporte({
    ...ctx, label: `Iter. 2 — ${f2(eqIter2.flujoEquilibrio)} GPM`,
    flujo: eqIter2.flujoEquilibrio, flujoDiseno: flujoMaxGlobal,
    equiposRecalcIter: eqIter2.equiposRecalc,
  }) : null;

  /* ── Calentamiento (igual en los 3 reportes) ── */
  const calentamientoData = [];
  const calSistemas = calentamiento?.sistemasSeleccionados ?? {};
  if (calSistemas.bombaCalor)          { const d = empacarCalentamiento("bombaCalor",          "Bomba de calor",       calentamiento); if (d) calentamientoData.push(d); }
  if (calSistemas.panelSolar)          { const d = empacarCalentamiento("panelSolar",           "Panel solar",          calentamiento); if (d) calentamientoData.push(d); }
  if (calSistemas.caldera)             { const d = empacarCalentamiento("caldera",              "Caldera de gas",       calentamiento); if (d) calentamientoData.push(d); }
  if (calSistemas.calentadorElectrico) { const d = empacarCalentamiento("calentadorElectrico",  "Calentador electrico", calentamiento); if (d) calentamientoData.push(d); }

  // Agregar flujos de calentamiento y sanitizacion a flujosRequeridos
  for (const c of calentamientoData) {
    const flujoC = parseFloat(c.seleccion?.flujoTotal ?? 0);
    if (flujoC > 0) resumen.flujosRequeridos.push({ label: c.label, valor: flujoC });
  }
  // Sanitizacion — clorador salino
  if (sistemasSeleccionadosSanit?.cloradorSalino && resultadoClorador && !resultadoClorador.error) {
    const flujoCS = parseFloat(resultadoClorador.seleccion?.flujoTotal ?? 0);
    if (flujoCS > 0) resumen.flujosRequeridos.push({ label: "Cloro salino", valor: flujoCS });
  }
  // UV y clorador automático — usan flujoMaxGlobal, no tienen flujo propio
  // Los incluimos para que se vea que están en el sistema
  if (sistemasSeleccionadosSanit?.lamparaUV)          resumen.flujosRequeridos.push({ label: "Lámpara UV",         valor: null });
  if (sistemasSeleccionadosSanit?.cloradorAutomatico) resumen.flujosRequeridos.push({ label: "Clorador automático", valor: null });

  // Calentamiento para el resumen (cargaTotal para la tabla comparativa)
  // Las tablas completas van en cada reporte para que aparezcan en todas las iteraciones
  const calentamientoReporte = generarCalentamientoReporte(calentamiento);

  // Agregar calentamiento a cada reporte para que aparezca en sus tabs
  if (reporteDiseno)  reporteDiseno.calentamiento  = calentamientoReporte;
  if (reporteIter1)   reporteIter1.calentamiento   = calentamientoReporte;
  if (reporteIter2)   reporteIter2.calentamiento   = calentamientoReporte;

  /* ── Perfil térmico — datos para la sección en memoria ── */
  let perfilTermico = null;
  if (calentamiento?.ciudad && calentamiento?.perdidasBTU) {
    const tablaClima = getClimaMensual(calentamiento.ciudad) ?? [];
    const mesesCalentar = calentamiento.mesesCalentar ?? {};
    // Mes más frío entre los seleccionados
    const mesesSel = tablaClima.filter(m => mesesCalentar[m.mes]);
    const mesMasFrio = mesesSel.length
      ? mesesSel.reduce((f, a) => a.tProm < f.tProm ? a : f)
      : null;
    perfilTermico = {
      ciudad:      calentamiento.ciudad,
      tempDeseada: calentamiento.tempDeseada,
      cubierta:    calentamiento.cubierta,
      techada:     calentamiento.techada,
      mesesCalentar,
      tablaClima,
      mesMasFrio,
      perdidasBTU: calentamiento.perdidasBTU,
      perdidaTotalBTU: calentamiento.perdidaTotalBTU,
    };
  }

  const memoria = {
    resumen,
    reportes: [reporteDiseno, reporteIter1, reporteIter2].filter(Boolean),
    calentamiento: calentamientoData,
    perfilTermico,
  };

  try {
    sessionStorage.setItem("memoriaCalculo", JSON.stringify(memoria));
  } catch (e) {
    throw new Error("No se pudo guardar en sessionStorage: " + e.message);
  }
  return memoria;
}