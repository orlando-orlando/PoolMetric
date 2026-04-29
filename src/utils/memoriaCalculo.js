/* ================================================================
   memoriaCalculo.js — v5
   Fix: clorador automático en línea excluido del CDT cuando
   el flujo de operación supera 90 GPM. Aparece como nota
   informativa en la memoria sin tabla hidráulica.
   ================================================================ */

import { retorno }        from "./retorno";
import { desnatador }     from "./desnatador";
import { barredora }      from "./barredora";
import { drenFondo }      from "./drenFondo";
import { drenCanal }      from "./drenCanal";
import { calcularCargaFiltroArenaManual }        from "./filtroArena";
import { calcularCargaPrefiltroManual }          from "./prefiltro";
import { calcularCargaFiltroCartuchoManual }     from "./filtroCartucho";
import { calcularCargaUVManual }                 from "./generadorUV";
import { calcularCargaCloradorAutomaticoManual } from "./cloradorAutomatico";

const FLUJO_MAX_CLORADOR_EN_LINEA = 90; // GPM

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

function generarReporte({
  label, flujo, flujoDiseno, estados, datosEmpotrable, tieneDesbordeCanal,
  sistemasSeleccionadosFilt, sistemasSeleccionadosSanit, resultadoClorador,
  equiposRecalcIter, seleccionesAjustadas,
}) {
  const est  = (k) => estados?.[k];
  const tipo = (k) => est(k)?.tipo ?? null;

  const marcaAjustada  = (k) => seleccionesAjustadas?.[k]?.marca  ?? equiposRecalcIter?.[k]?.marca  ?? est(k)?.marca;
  const modeloAjustado = (k) => seleccionesAjustadas?.[k]?.modelo ?? equiposRecalcIter?.[k]?.modelo ?? est(k)?.modelo;

  const cantParaKey = (k) => {
    if (equiposRecalcIter) return equiposRecalcIter[k]?.cantidad ?? est(k)?.cantidad ?? null;
    return est(k)?.cantidad ?? null;
  };

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
      const recKey = equiposRecalcIter?.[key];
      const cant   = cantParaKey(key) ?? est(key)?.cantidad ?? 1;
      data.seleccion = {
        marca:      recKey?.marca      ?? est(key)?.marca    ?? "—",
        modelo:     recKey?.modelo     ?? est(key)?.modelo   ?? "—",
        cantidad:   cant,
        spec:       est(key)?.spec     ?? null,
        flujoTotal: data.resultado?.[0]?.flujo != null
          ? f2(parseFloat(data.resultado[0].flujo) * cant)
          : null,
      };
      empotrables[key] = data;
    }
  }

  const filtros = {};

  if (sistemasSeleccionadosFilt?.filtroArena && est("filtroArena")?.selId) {
    const recIter = equiposRecalcIter?.filtroArena;
    const resIter = recIter?.resultadoHidraulico;
    const eq = est("filtroArena");
    const cant = cantParaKey("filtroArena") ?? 1;
    const marcaFiltro  = marcaAjustada("filtroArena")  ?? eq.marca;
    const modeloFiltro = modeloAjustado("filtroArena") ?? eq.modelo;
    const res = resIter ?? calcularCargaFiltroArenaManual(eq.flujoEf ?? 0, cant, flujoCalculo);
    const data = empacarFiltroRes(res, "Filtro de arena", { marca: marcaFiltro, modelo: modeloFiltro, cantidad: cant, flujoTotal: (eq.flujoEf ?? 0) * cant });
    if (data) filtros.filtroArena = data;
  }

  if (sistemasSeleccionadosFilt?.prefiltro && est("prefiltro")?.selId) {
    const recIter = equiposRecalcIter?.prefiltro;
    const resIter = recIter?.resultadoHidraulico;
    const eq = est("prefiltro");
    const cant = cantParaKey("prefiltro") ?? 1;
    const marcaFiltro  = marcaAjustada("prefiltro")  ?? eq.marca;
    const modeloFiltro = modeloAjustado("prefiltro") ?? eq.modelo;
    const res = resIter ?? calcularCargaPrefiltroManual(eq.flujoEf ?? 0, cant, flujoCalculo);
    const data = empacarFiltroRes(res, "Prefiltro", { marca: marcaFiltro, modelo: modeloFiltro, cantidad: cant, flujoTotal: (eq.flujoEf ?? 0) * cant });
    if (data) filtros.prefiltro = data;
  }

  if (sistemasSeleccionadosFilt?.filtroCartucho && est("filtroCartucho")?.selId) {
    const recIter = equiposRecalcIter?.filtroCartucho;
    const resIter = recIter?.resultadoHidraulico;
    const eq = est("filtroCartucho");
    const cant = cantParaKey("filtroCartucho") ?? 1;
    const marcaFiltro  = marcaAjustada("filtroCartucho")  ?? eq.marca;
    const modeloFiltro = modeloAjustado("filtroCartucho") ?? eq.modelo;
    const res = resIter ?? calcularCargaFiltroCartuchoManual(eq.flujoEf ?? 0, cant, flujoCalculo);
    const data = empacarFiltroRes(res, "Filtro de cartucho", { marca: marcaFiltro, modelo: modeloFiltro, cantidad: cant, flujoTotal: (eq.flujoEf ?? 0) * cant });
    if (data) filtros.filtroCartucho = data;
  }

  const sanitizacion = {};

  if (sistemasSeleccionadosSanit?.cloradorSalino) {
    const estCS = est("cloradorSalino");
    if (resultadoClorador && !resultadoClorador.error) {
      const selCS = (estCS?.marca && estCS?.modelo)
        ? { marca: estCS.marca, modelo: estCS.modelo, cantidad: estCS.cantidad ?? 1, flujoTotal: estCS.flujoTotal ?? flujoCalculo }
        : null;
      const data = empacarFiltroRes(resultadoClorador, "Generador de cloro salino", selCS);
      if (data) sanitizacion.cloradorSalino = data;
    }
  }

  if (sistemasSeleccionadosSanit?.lamparaUV) {
    const eqUV = est("lamparaUV");
    if (eqUV?.marca || eqUV?.modelo || eqUV?.cantidad) {
      // En iteraciones usar el resultadoHidraulico recalculado (que ya tiene el equipo correcto)
      const resIter = equiposRecalcIter?.lamparaUV?.resultadoHidraulico;
      // Si en iteraciones cambió el equipo, usar marca/modelo del recalc
      const marcaUV  = equiposRecalcIter?.lamparaUV?.marca  ?? eqUV?.marca;
      const modeloUV = equiposRecalcIter?.lamparaUV?.modelo ?? eqUV?.modelo;
      const cant = equiposRecalcIter?.lamparaUV?.cantidad ?? eqUV?.cantidad ?? cantParaKey("lamparaUV") ?? 1;
      const flujoTotalUV = eqUV?.flujoTotal ? parseFloat(eqUV.flujoTotal) : flujoCalculo;
      const flujoPorUV = cant > 0 ? flujoTotalUV / cant : flujoCalculo;
      const res = resIter ?? calcularCargaUVManual(flujoPorUV, cant, flujoCalculo);
      const data = empacarFiltroRes(res, "Lampara UV", { marca: marcaUV, modelo: modeloUV, cantidad: cant, flujoTotal: flujoTotalUV });
      if (data) sanitizacion.lamparaUV = data;
    }
  }

  if (sistemasSeleccionadosSanit?.cloradorAutomatico) {
    const eqCA = est("cloradorAutomatico");
    const tieneCA = eqCA?.selId || eqCA?.marca || eqCA?.modelo || eqCA?.cantidad;

    if (tieneCA) {
      const instalacion = eqCA?.instalacion ?? "enLinea";
      const flujoOp = parseFloat(flujoCalculo);

      // FIX: si es en línea y el flujo de operación supera 90 GPM → excluir del CDT
      const esEnLineaExcluido = instalacion === "enLinea" && flujoOp > FLUJO_MAX_CLORADOR_EN_LINEA;

      if (esEnLineaExcluido) {
        // Solo nota informativa — sin tabla hidráulica, sin carga
        sanitizacion.cloradorAutomatico = {
          label:    "Clorador automático (no aplicable)",
          excluido: true,
          motivo:   `Flujo de operación ${flujoOp.toFixed(1)} GPM supera el límite de ${FLUJO_MAX_CLORADOR_EN_LINEA} GPM para instalación en línea. No se incluye en el CDT del sistema.`,
          seleccion: {
            marca:      eqCA?.marca    ?? "—",
            modelo:     eqCA?.modelo   ?? "—",
            cantidad:   eqCA?.cantidad ?? 1,
            instalacion,
          },
        };
      } else {
        // Incluir normalmente con tabla hidráulica
        const cant = eqCA?.cantidad ?? cantParaKey("cloradorAutomatico") ?? 1;
        const flujoTotalCA = eqCA?.flujoTotal ? parseFloat(eqCA.flujoTotal) : flujoCalculo;
        const flujoPorCA = cant > 0 ? flujoTotalCA / cant : flujoCalculo;
        const res = calcularCargaCloradorAutomaticoManual(flujoPorCA, cant, instalacion);
        const data = empacarFiltroRes(res, "Clorador automatico", { marca: eqCA?.marca, modelo: eqCA?.modelo, cantidad: cant, flujoTotal: flujoTotalCA });
        if (data) sanitizacion.cloradorAutomatico = data;
      }
    }
  }

  return { label, flujo: f2(flujo), empotrables, filtros, sanitizacion };
}

function empacarCalentamiento(key, label, calentamiento) {
  if (!calentamiento) return null;
  let res = null;
  if (key === "bombaCalor") {
    const modo = calentamiento.modoBDC ?? "recomendado";
    res = modo === "manual" ? calentamiento.bdcManual : calentamiento.bdcSeleccionada;
    if (res?.hidraulica) {
      const capU = res.bomba?.specs?.capacidadCalentamiento ?? res.seleccion?.capUnitaria ?? null;
      res = { ...res, ...res.hidraulica, seleccion: res.seleccion ?? { marca: res.bomba?.marca, modelo: res.bomba?.modelo, cantidad: res.cantidad, flujoTotal: res.flujoTotal, capUnitaria: capU } };
      if (res.seleccion && capU != null) res = { ...res, seleccion: { ...res.seleccion, capUnitaria: res.seleccion.capUnitaria ?? capU } };
    }
  } else if (key === "panelSolar") {
    const modo = calentamiento.modoPS ?? "recomendado";
    const src = modo === "manual" ? calentamiento.psManual : calentamiento.psSeleccionado;
    if (!src || src.error) return null;
    const marcaPS  = src.panel?.marca  ?? src.seleccion?.marca  ?? src.marca  ?? "—";
    const modeloPS = src.panel?.modelo ?? src.seleccion?.modelo ?? src.modelo ?? "—";
    const cantPS   = src.totalPaneles  ?? src.seleccion?.cantidad ?? src.cantidad ?? "—";
    const capPS    = src.panel?.specs?.capacidadCalentamiento ?? src.seleccion?.capUnitaria ?? null;
    res = { ...(src.hidraulica ?? {}), seleccion: { marca: marcaPS, modelo: modeloPS, cantidad: cantPS, flujoTotal: src.flujoTotal ?? src.seleccion?.flujoTotal, capUnitaria: capPS } };
  } else if (key === "caldera") {
    const modo = calentamiento.modoCaldera ?? "recomendado";
    if (modo === "manual" && calentamiento.calderaManual?.hidraulica) {
      const capC = calentamiento.calderaManual.caldera?.specs?.capacidadCalentamiento ?? null;
      res = { ...calentamiento.calderaManual.hidraulica, seleccion: { marca: calentamiento.calderaManual.caldera?.marca, modelo: calentamiento.calderaManual.caldera?.modelo, cantidad: calentamiento.calderaManual.cantidad, flujoTotal: calentamiento.calderaManual.flujoTotal, capUnitaria: capC } };
    } else {
      res = calentamiento.calderaSeleccionada;
    }
  } else if (key === "calentadorElectrico") {
    const modo = calentamiento.modoCE ?? "recomendado";
    if (modo === "manual" && calentamiento.ceManual?.hidraulica) {
      const capCE = calentamiento.ceManual.equipo?.specs?.capacidadCalentamiento ?? null;
      res = { ...calentamiento.ceManual.hidraulica, seleccion: { marca: calentamiento.ceManual.equipo?.marca, modelo: calentamiento.ceManual.equipo?.modelo, cantidad: calentamiento.ceManual.cantidad, flujoTotal: calentamiento.ceManual.flujoTotal, capUnitaria: capCE } };
    } else {
      res = calentamiento.ceSeleccionado;
    }
  }
  if (!res || res.error || !res.tablaTramos?.length) return null;

  let tablaDistancia = res.tablaDistancia ?? null;
  let tablaAltura = res.tablaAltura ?? null;
  if (tablaAltura) {
    const altMax = parseFloat(tablaAltura.alturaMaxSist_m ?? 0);
    const altPropia = parseFloat(
      tablaAltura.alturaBDC_m ?? tablaAltura.alturaCE_m ??
      tablaAltura.alturaCaldera_m ?? tablaAltura.alturaPS_m ??
      tablaAltura.alturaEquipo_m ?? 0
    );
    tablaAltura = {
      ...tablaAltura,
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
    tablaDistancia, tablaAltura,
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
  estados, estadosActuales, datosEmpotrable, tieneDesbordeCanal,
  flujoMaxGlobal, cargaTotalGlobal,
  tuberiaMaxGlobal, flujoVolumen, flujoInfinityVal, flujoFiltradoVal, vol,
  estadoBomba, equilibrio,
  datosPorSistema, resultadoClorador,
  sistemasSeleccionadosSanit, sistemasSeleccionadosFilt,
  cargas, equiposConfirmados, specsEquipos,
}) {
  const estadosMerged = {};
  const allKeys = new Set([...Object.keys(estados ?? {}), ...Object.keys(estadosActuales ?? {})]);
  for (const k of allKeys) {
    const snap   = estados?.[k]       ?? {};
    const actual = estadosActuales?.[k] ?? {};
    estadosMerged[k] = {
      ...snap,
      marca:  actual.marca  ?? snap.marca,
      modelo: actual.modelo ?? snap.modelo,
      spec:   actual.spec   ?? snap.spec,
      selId:  actual.selId  ?? snap.selId,
      tipo:   actual.tipo   ?? snap.tipo,
    };
  }
  if (!datosEmpotrable || !flujoMaxGlobal)
    throw new Error("Faltan datos de empotrable o flujo maximo.");

  const calentamiento   = datosPorSistema?.calentamiento;
  const iteraciones     = equilibrio?.iteraciones ?? [];
  const equilibrioFinal = equilibrio?.equilibrio  ?? null;

  let eqIter1 = null, eqIter2 = null;
  let pasadoSeparador = false;
  for (const it of iteraciones) {
    if (it.separador) { pasadoSeparador = true; continue; }
    if (it.esEquilibrio) {
      if (!pasadoSeparador && !eqIter1) eqIter1 = it;
      else if (pasadoSeparador && !eqIter2) eqIter2 = it;
    }
  }
  if (!eqIter2) eqIter2 = eqIter1;

  const resumen = {
    area:        f2(datosEmpotrable?.area ?? 0),
    vol:         f2(vol ?? 0),
    flujoVol:    f2(flujoFiltradoVal ?? flujoVolumen ?? 0),
    flujoInf:    f2(flujoInfinityVal ?? 0),
    flujoMax:    f2(flujoMaxGlobal),
    tubSuccion:  estadoBomba?.tubSuccion  ?? "—",
    tubDescarga: tuberiaMaxGlobal ?? estadoBomba?.tubDescarga ?? "—",
    bomba:        estadoBomba ? `${estadoBomba.marca} ${estadoBomba.modelo}` : "—",
    bombaMarca:   estadoBomba?.marca       ?? "—",
    bombaModelo:  estadoBomba?.modelo      ?? "—",
    bombaPotencia: estadoBomba?.potenciaHP ?? null,
    nBombas:      estadoBomba?.nBombas ?? 1,
    flujoFinal:  f2(equilibrioFinal?.flujo ?? flujoMaxGlobal),
    cdtFinal:    f2(equilibrioFinal?.carga ?? 0),
    cdtDiseno:   f2(cargaTotalGlobal ?? 0),
    cdtIter1:    f2(eqIter1?.cargaSalida ?? 0),
    cdtIter2:    f2(eqIter2?.cargaSalida ?? equilibrioFinal?.carga ?? 0),
    flujoIter1:  f2(eqIter1?.flujoEquilibrio ?? 0),
    flujoIter2:  f2(eqIter2?.flujoEquilibrio ?? 0),
    flujosRequeridos: [
      flujoFiltradoVal > 0 ? { label: "Filtrado",  valor: flujoFiltradoVal } : null,
      flujoInfinityVal > 0 ? { label: "Infinity",  valor: flujoInfinityVal } : null,
    ].filter(Boolean),
  };

  const ctx = {
    estados: estadosMerged, datosEmpotrable, tieneDesbordeCanal,
    sistemasSeleccionadosFilt, sistemasSeleccionadosSanit, resultadoClorador,
  };

  const reporteDiseno = generarReporte({
    ...ctx,
    estados: estadosMerged,
    label: "Diseno original",
    flujo: flujoMaxGlobal, flujoDiseno: flujoMaxGlobal,
    equiposRecalcIter: null,
    seleccionesAjustadas: equiposConfirmados ?? null,
  });

  const reporteIter1 = eqIter1 ? generarReporte({
    ...ctx, label: `Iter. 1 — ${f2(eqIter1.flujoEquilibrio)} GPM`,
    flujo: eqIter1.flujoEquilibrio, flujoDiseno: flujoMaxGlobal,
    equiposRecalcIter: eqIter1.equiposRecalc,
  }) : null;

  const reporteIter2 = eqIter2 ? generarReporte({
    ...ctx, label: `Iter. 2 — ${f2(eqIter2.flujoEquilibrio)} GPM`,
    flujo: eqIter2.flujoEquilibrio, flujoDiseno: flujoMaxGlobal,
    equiposRecalcIter: eqIter2.equiposRecalc,
  }) : null;

  const calentamientoData = [];
  const calSistemas = calentamiento?.sistemasSeleccionados ?? {};
  if (calSistemas.bombaCalor)          { const d = empacarCalentamiento("bombaCalor",          "Bomba de calor",       calentamiento); if (d) calentamientoData.push(d); }
  if (calSistemas.panelSolar)          { const d = empacarCalentamiento("panelSolar",           "Panel solar",          calentamiento); if (d) calentamientoData.push(d); }
  if (calSistemas.caldera)             { const d = empacarCalentamiento("caldera",              "Caldera de gas",       calentamiento); if (d) calentamientoData.push(d); }
  if (calSistemas.calentadorElectrico) { const d = empacarCalentamiento("calentadorElectrico",  "Calentador electrico", calentamiento); if (d) calentamientoData.push(d); }

  for (const c of calentamientoData) {
    const flujoC = parseFloat(c.seleccion?.flujoTotal ?? 0);
    if (flujoC > 0) resumen.flujosRequeridos.push({ label: c.label, valor: flujoC });
  }
  if (sistemasSeleccionadosSanit?.cloradorSalino && resultadoClorador && !resultadoClorador.error) {
    const flujoCS = parseFloat(resultadoClorador.seleccion?.flujoTotal ?? 0);
    if (flujoCS > 0) resumen.flujosRequeridos.push({ label: "Cloro salino", valor: flujoCS });
  }
  if (sistemasSeleccionadosSanit?.lamparaUV)          resumen.flujosRequeridos.push({ label: "Lámpara UV",          valor: null });
  if (sistemasSeleccionadosSanit?.cloradorAutomatico) resumen.flujosRequeridos.push({ label: "Clorador automático", valor: null });

  const calentamientoReporte = calentamientoData; // ya construido arriba
  if (reporteDiseno) reporteDiseno.calentamiento = calentamientoReporte;
  if (reporteIter1)  reporteIter1.calentamiento  = calentamientoReporte;
  if (reporteIter2)  reporteIter2.calentamiento  = calentamientoReporte;

  let perfilTermico = null;
  if (calentamiento?.ciudad && calentamiento?.perdidasBTU) {
    perfilTermico = {
      ciudad:          calentamiento.ciudad,
      tempDeseada:     calentamiento.tempDeseada,
      cubierta:        calentamiento.cubierta,
      techada:         calentamiento.techada,
      mesesCalentar:   calentamiento.mesesCalentar ?? {},
      tablaClima:      calentamiento.tablaClima    ?? [],
      mesMasFrio:      calentamiento.mesMasFrio    ?? null,
      perdidasBTU:     calentamiento.perdidasBTU,
      perdidaTotalBTU: calentamiento.perdidaTotalBTU,
    };
  }

  const specsCalentamiento = {};
  for (const item of calentamientoData) {
    const sel = item?.seleccion;
    const cap = sel?.capUnitaria ?? sel?.capUnitariaKcal ?? sel?.capacidad ?? null;
    if (cap != null) specsCalentamiento[item.key] = `${Math.round(cap).toLocaleString("es-MX")} BTU/h`;
  }
  if (!specsCalentamiento.panelSolar && calentamiento?.psSeleccionado?.panel?.specs?.capacidadCalentamiento) {
    specsCalentamiento.panelSolar = `${Math.round(calentamiento.psSeleccionado.panel.specs.capacidadCalentamiento).toLocaleString("es-MX")} BTU/h`;
  }
  if (!specsCalentamiento.panelSolar && calentamiento?.psManual?.panel?.specs?.capacidadCalentamiento) {
    specsCalentamiento.panelSolar = `${Math.round(calentamiento.psManual.panel.specs.capacidadCalentamiento).toLocaleString("es-MX")} BTU/h`;
  }
  if (!specsCalentamiento.caldera) {
    const capRec = calentamiento?.calderaSeleccionada?.seleccion?.capOutputUnitario ?? calentamiento?.calderaSeleccionada?.seleccion?.capUnitaria;
    const capMan = calentamiento?.calderaManual?.caldera?.specs?.capacidadCalentamiento;
    const cap = capRec ?? capMan ?? null;
    if (cap != null) specsCalentamiento.caldera = `${Math.round(cap).toLocaleString("es-MX")} BTU/h`;
  }

  const specsSanitizacion = {
    cloradorSalino: (() => {
      const estCS = estadosMerged?.cloradorSalino;
      if (estCS?.spec && estCS?.cantidad > 1) {
        const match = estCS.spec.match(/^([\d.]+)\s*(.+)$/);
        if (match) {
          const total   = parseFloat(match[1]);
          const unidad  = match[2];
          const unitaria = parseFloat((total / estCS.cantidad).toFixed(3));
          return `${unitaria} ${unidad}`;
        }
      }
      return estCS?.spec
        ?? (resultadoClorador?.kgDiaInstalado != null
          ? `${resultadoClorador.kgDiaInstalado} ${resultadoClorador.modoCloro === "comercial" ? "kg/día" : "litros"}`
          : null);
    })(),
    cloradorAutomatico: estadosMerged?.cloradorAutomatico?.spec ?? null,
    lamparaUV:          estadosMerged?.lamparaUV?.spec          ?? null,
  };

  const memoria = {
    resumen,
    reportes: [reporteDiseno, reporteIter1, reporteIter2].filter(Boolean),
    calentamiento: calentamientoData,
    perfilTermico,
    equiposConfirmados: equiposConfirmados ?? null,
    estadosDiseno: estadosMerged,
    specsEquipos:  specsEquipos ?? null,
    specsCalentamiento,
    specsSanitizacion,
  };

  try {
    sessionStorage.setItem("memoriaCalculo", JSON.stringify(memoria));
  } catch (e) {
    throw new Error("No se pudo guardar en sessionStorage: " + e.message);
  }
  return memoria;
}