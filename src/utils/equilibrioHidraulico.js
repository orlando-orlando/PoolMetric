import { motobombas1v }                   from "../data/motobombas1v";
import { retornos }                       from "../data/retornos";
import { desnatadores }                   from "../data/desnatadores";
import { barredoras }                     from "../data/barredoras";
import { drenesFondo }                    from "../data/drenesFondo";
import { drenesCanal }                    from "../data/drenesCanal";
import { filtrosArena }                   from "../data/filtrosArena";
import { prefiltros }                     from "../data/prefiltros";
import { filtrosCartucho }                from "../data/filtrosCartucho";
import { retorno }                        from "./retorno";
import { desnatador }                     from "./desnatador";
import { barredora }                      from "./barredora";
import { drenFondo }                      from "./drenFondo";
import { drenCanal }                      from "./drenCanal";
import { calcularCargaFiltroArenaManual }    from "./filtroArena";
import { calcularCargaPrefiltroManual }      from "./prefiltro";
import { calcularCargaFiltroCartuchoManual } from "./filtroCartucho";
import { calcularCargaUVManual }             from "./generadorUV";

// Dado un CDT objetivo, devuelve el flujo que entrega la bomba
function flujoEnCurva(curva, cargaObjetivo) {
  if (!curva || curva.length === 0) return null;
  if (cargaObjetivo > curva[0].carga_ft) return 0;
  if (cargaObjetivo < curva[curva.length - 1].carga_ft) {
    const ult = curva[curva.length - 1];
    const pen = curva[curva.length - 2];
    const dH  = ult.carga_ft - pen.carga_ft;
    const dQ  = ult.flujo_gpm - pen.flujo_gpm;
    if (Math.abs(dH) < 1e-10) return ult.flujo_gpm;
    const t = (cargaObjetivo - pen.carga_ft) / dH;
    return Math.max(0, pen.flujo_gpm + t * dQ);
  }
  for (let i = 0; i < curva.length - 1; i++) {
    const p1 = curva[i], p2 = curva[i + 1];
    if (cargaObjetivo <= p1.carga_ft && cargaObjetivo >= p2.carga_ft) {
      const t = (p1.carga_ft - cargaObjetivo) / (p1.carga_ft - p2.carga_ft);
      return p1.flujo_gpm + t * (p2.flujo_gpm - p1.flujo_gpm);
    }
  }
  return null;
}

// Dado un flujo, devuelve el CDT que entrega la bomba (con extrapolacion)
function cargaEnCurva(curva, flujo_gpm) {
  if (!curva || curva.length === 0) return null;
  if (flujo_gpm <= curva[0].flujo_gpm) return curva[0].carga_ft;
  for (let i = 0; i < curva.length - 1; i++) {
    const p1 = curva[i], p2 = curva[i + 1];
    if (flujo_gpm >= p1.flujo_gpm && flujo_gpm <= p2.flujo_gpm) {
      const t = (flujo_gpm - p1.flujo_gpm) / (p2.flujo_gpm - p1.flujo_gpm);
      return p1.carga_ft + t * (p2.carga_ft - p1.carga_ft);
    }
  }
  const ult  = curva[curva.length - 1];
  const pen  = curva[curva.length - 2];
  const dQ   = ult.flujo_gpm - pen.flujo_gpm;
  if (dQ === 0) return ult.carga_ft;
  const pend = (ult.carga_ft - pen.carga_ft) / dQ;
  return Math.max(0, ult.carga_ft + pend * (flujo_gpm - ult.flujo_gpm));
}

const TAMANO_A_TIPO = { "9x9": "9.0", "12x12": "12.0", "18x18": "18.0" };
function normTipo(raw) {
  return TAMANO_A_TIPO[String(raw)] ?? String(raw);
}

function recalcularEmpotrable(key, estado, flujoNuevo, datosEmpotrable, fnCalculo, catalogo) {
  if (!estado?.selId || !flujoNuevo || !datosEmpotrable) return null;
  const eq = catalogo.find(e => e.id === estado.selId);
  if (!eq) return null;

  let cantMinNueva;
  if (key === "barredora") {
    const area = parseFloat(datosEmpotrable?.area) || 0;
    const manguera = parseFloat(datosEmpotrable?.mangueraBarredora) || 7.5;
    const largoFinal = manguera - manguera * 0.05;
    const areaSemiCirculo = (Math.PI * largoFinal * largoFinal) / 2;
    const numA = area / areaSemiCirculo;
    const numB = Math.sqrt(area) / (largoFinal * 2);
    const numGeom = largoFinal > Math.sqrt(area) ? numB : numA;
    cantMinNueva = Math.max(2, Math.ceil(numGeom));
  } else if (key === "desnatador") {
    const area       = parseFloat(datosEmpotrable?.area) || 0;
    const flujoPorEq = eq.specs.flujo ?? eq.specs.maxFlow ?? 0;
    const numPorArea  = area > 0 ? Math.ceil(area / 40) : 2;
    const numPorFlujo = flujoPorEq > 0 ? Math.max(2, Math.ceil(flujoNuevo / flujoPorEq)) : 2;
    cantMinNueva = Math.max(numPorArea, numPorFlujo, 2);
  } else if (key === "drenFondo" || key === "drenCanal") {
    const flujoPorEq = eq.specs.flujo ?? eq.specs.maxFlow ?? 0;
    let num = flujoPorEq > 0 ? Math.ceil((flujoNuevo * 2) / flujoPorEq) : estado.cantidad;
    if (num % 2 !== 0) num++;
    cantMinNueva = Math.max(2, num);
  } else {
    const flujoPorEq = eq.specs.flujo ?? eq.specs.maxFlow ?? 0;
    cantMinNueva = flujoPorEq > 0 ? Math.max(2, Math.ceil(flujoNuevo / flujoPorEq)) : estado.cantidad;
  }

  const cantFinal = Math.max(cantMinNueva, estado.cantidad ?? 1);
  const tipo = estado.tipo ?? normTipo(eq.specs.tamano ?? eq.specs.dimensionPuerto ?? "");

  try {
    const res = fnCalculo(flujoNuevo, tipo, datosEmpotrable, cantFinal);
    const sumaConAccesorio = res?.sumaFinal != null ? parseFloat(res.sumaFinal) + 1.5 : null;
    return {
      cantidad: cantFinal, cantOriginal: estado.cantidad,
      cambio: cantFinal !== estado.cantidad,
      sumaFinal: sumaConAccesorio,
      modelo: eq.modelo, marca: eq.marca,
      resultadoHidraulico: res,
    };
  } catch { return null; }
}

function recalcularFiltro(key, estado, flujoNuevo, fnManual, catalogo, usoGeneral) {
  if (!estado?.selId || !flujoNuevo) return null;
  let flujoEf, modelo, marca;
  const cantOriginal = estado.cantidad ?? 1;
  if (key === "filtroArena") {
    const f = catalogo.find(f => f.id === estado.selId);
    if (!f) return null;
    flujoEf = f.specs.maxFlow; modelo = f.modelo; marca = f.marca;
  } else if (key === "prefiltro") {
    const p = catalogo.find(p => p.id === estado.selId);
    if (!p) return null;
    flujoEf = p.specs.maxFlow; modelo = p.modelo; marca = p.marca;
  } else if (key === "filtroCartucho") {
    const f = catalogo.find(f => f.id === estado.selId);
    if (!f) return null;
    flujoEf = estado.flujoEf ?? f.specs.flujoComercial;
    modelo = f.modelo; marca = f.marca;
  }
  if (!flujoEf || flujoEf <= 0) return null;
  const cantMin   = Math.max(1, Math.ceil(flujoNuevo / flujoEf));
  const cantFinal = Math.max(cantMin, cantOriginal);
  try {
    const res = fnManual(flujoEf, cantFinal);
    return {
      cantidad: cantFinal, cantOriginal,
      cambio: cantFinal !== cantOriginal,
      cargaTotal: res?.cargaTotal ?? null,
      cargaTotalPSI: res?.cargaTotalPSI ?? null,
      modelo, marca,
      resultadoHidraulico: res,
    };
  } catch { return null; }
}

export function calcularEquilibrio({
  bombaId, nBombas, flujoInicial, cargaInicial,
  estados, cargasIniciales, datosEmpotrable,
  tieneDesbordeCanal, usoGeneral,
}) {
  const bomba = motobombas1v.find(b => b.id === bombaId);
  if (!bomba) return { error: "Motobomba no encontrada." };
  const curva = bomba.curva;
  if (!curva || curva.length < 2) return { error: "La motobomba no tiene curva de rendimiento definida." };
  if (!flujoInicial || flujoInicial <= 0 || !cargaInicial || cargaInicial <= 0)
    return { error: "Flujo o carga de diseno no validos." };

  const cargaMaxBomba = curva[0].carga_ft;
  if (cargaInicial > cargaMaxBomba) {
    return { error: `La motobomba no alcanza la CDT de diseno (${cargaInicial.toFixed(2)} ft > ${cargaMaxBomba} ft shut-off).` };
  }

  const empotrablesConfig = {
    retorno:    { fn: (f,t,d,n) => retorno(f,t,d,n),    cat: retornos    },
    desnatador: { fn: (f,t,d,n) => desnatador(f,t,d,n), cat: desnatadores },
    barredora:  { fn: (f,t,d,n) => barredora(f,t,d,n),  cat: barredoras  },
    drenFondo:  { fn: (f,t,d,n) => drenFondo(f,t,d,n),  cat: drenesFondo },
    drenCanal:  { fn: (f,t,d,n) => drenCanal(f,t,d,n),  cat: drenesCanal },
  };
  const filtrosConfig = {
    filtroArena:    { fn: calcularCargaFiltroArenaManual,    cat: filtrosArena    },
    prefiltro:      { fn: calcularCargaPrefiltroManual,      cat: prefiltros      },
    filtroCartucho: { fn: calcularCargaFiltroCartuchoManual, cat: filtrosCartucho },
  };

  const empKeys = tieneDesbordeCanal
    ? ["retorno", "barredora", "drenFondo", "drenCanal"]
    : ["retorno", "desnatador", "barredora", "drenFondo"];

  // Cargas de referencia al flujo de diseno (calculadas frescas, no de cargasIniciales)
  function calcularCargasRef(flujoRef) {
    const ref = { ...cargasIniciales };
    for (const key of empKeys) {
      const est = estados[key];
      if (!est?.selId) continue;
      const cfg = empotrablesConfig[key];
      const rec = recalcularEmpotrable(key, est, flujoRef, datosEmpotrable, cfg.fn, cfg.cat);
      if (rec) ref[key] = parseFloat(rec.sumaFinal ?? 0);
    }
    for (const key of ["filtroArena", "prefiltro", "filtroCartucho"]) {
      const est = estados[key];
      if (!est?.selId) continue;
      const cfg = filtrosConfig[key];
      const rec = recalcularFiltro(key, est, flujoRef, cfg.fn, cfg.cat, usoGeneral);
      if (rec) ref[key] = parseFloat(rec.cargaTotal ?? 0);
    }
    return ref;
  }

  // Recalcular todos los equipos a un flujo dado y obtener el nuevo CDT del sistema
  // CDT nuevo = cargaInicial + delta(cargas_nuevo_flujo - cargas_flujo_diseno)
  function recalcularYObtenerCDT(flujoNuevo, cargasRef) {
    const equiposRecalc = {};
    for (const key of empKeys) {
      const est = estados[key];
      if (!est?.selId) continue;
      const cfg = empotrablesConfig[key];
      const rec = recalcularEmpotrable(key, est, flujoNuevo, datosEmpotrable, cfg.fn, cfg.cat);
      if (rec) equiposRecalc[key] = rec;
    }
    for (const key of ["filtroArena", "prefiltro", "filtroCartucho"]) {
      const est = estados[key];
      if (!est?.selId) continue;
      const cfg = filtrosConfig[key];
      const rec = recalcularFiltro(key, est, flujoNuevo, cfg.fn, cfg.cat, usoGeneral);
      if (rec) equiposRecalc[key] = rec;
    }
    if (estados?.lamparaUV?.selId) {
      const est = estados.lamparaUV;
      const cantOriginal = est.cantidad ?? 1;
      try {
        const res = calcularCargaUVManual(flujoNuevo / cantOriginal, cantOriginal);
        if (res && !res.error) {
          equiposRecalc.lamparaUV = {
            cantidad: cantOriginal, cantOriginal, cambio: false,
            cargaTotal: res.cargaTotal, sumaFinal: res.cargaTotal,
          };
        }
      } catch { /* sin cambio */ }
    }

    const keysRecalc = [
      ...empKeys.filter(k => equiposRecalc[k] != null),
      ...["filtroArena", "prefiltro", "filtroCartucho", "lamparaUV"].filter(k => equiposRecalc[k] != null),
    ];
    let deltaCargas = 0;
    for (const key of keysRecalc) {
      const cargaRef   = parseFloat(cargasRef[key] ?? 0);
      const eq         = equiposRecalc[key];
      const cargaNueva = parseFloat(eq.sumaFinal ?? eq.cargaTotal ?? 0);
      deltaCargas += (cargaNueva - cargaRef);
    }
    const cargaTotalNueva = Math.max(0.1, cargaInicial + deltaCargas);
    return { equiposRecalc, cargaTotalNueva };
  }

  // Referencia fresca al flujo de diseno
  const cargasRef0 = calcularCargasRef(flujoInicial);

  // CDT bomba en el punto de diseno (solo para mostrar el exceso)
  const cargaBombaEnDis = parseFloat((cargaEnCurva(curva, flujoInicial / nBombas) ?? cargaInicial).toFixed(2));

  /* ============================================================
     ITERACION 1
     CDT entrada = cargaInicial (CDT del SISTEMA en diseño, ej 65.5 ft)
     Q bomba     = flujo que da la bomba a ese CDT
     CDT salida  = sistema recalculado a ese Q
  ============================================================ */
  const cdtEntrada_1    = parseFloat(cargaInicial.toFixed(2));
  const flujoPorBomba_1 = flujoEnCurva(curva, cdtEntrada_1);
  if (flujoPorBomba_1 == null || flujoPorBomba_1 <= 0) {
    return { error: "No se puede determinar el flujo de la bomba en el CDT de diseno." };
  }
  const flujoTotal_1 = parseFloat((flujoPorBomba_1 * nBombas).toFixed(2));
  const { equiposRecalc: equip1, cargaTotalNueva: cdt1 } =
    recalcularYObtenerCDT(flujoTotal_1, cargasRef0);

  /* ============================================================
     ITERACION 2
     CDT entrada = CDT salida iter 1
     Q bomba     = flujo que da la bomba a ese CDT
     CDT salida  = sistema recalculado a ese Q
     Si CDT salida iter1 > shut-off: bomba subdimensionada, Q~0
  ============================================================ */
  const cdtEntrada_2    = parseFloat(cdt1.toFixed(2));
  const flujoPorBomba_2raw = flujoEnCurva(curva, cdtEntrada_2);
  // flujoEnCurva devuelve 0 si CDT > shut-off, null si error
  const flujoPorBomba_2 = (flujoPorBomba_2raw != null && flujoPorBomba_2raw > 0)
    ? flujoPorBomba_2raw
    : 0;
  const flujoTotal_2 = parseFloat((flujoPorBomba_2 * nBombas).toFixed(2));

  // Si flujoTotal_2 = 0 la bomba no puede vencer el CDT del sistema
  // Recalcular igual para mostrar las cargas al flujo minimo
  const flujoParaRecalc2 = flujoTotal_2 > 0 ? flujoTotal_2 : flujoInicial * 0.1;
  const { equiposRecalc: equip2, cargaTotalNueva: cdt2 } =
    recalcularYObtenerCDT(flujoParaRecalc2, cargasRef0);

  /* ============================================================
     PUNTO DE OPERACION
     CDT = cdt2 (CDT salida iter 2)
     Q   = flujo de la bomba a ese CDT
  ============================================================ */
  const flujoPorBomba_eq = flujoEnCurva(curva, cdt2);
  const flujoFinal = (flujoPorBomba_eq != null && flujoPorBomba_eq > 0)
    ? parseFloat((flujoPorBomba_eq * nBombas).toFixed(2))
    : flujoTotal_2;

  const cargaDispFinal = parseFloat((cargaEnCurva(curva, flujoFinal / nBombas) ?? 0).toFixed(2));
  const bombaSubdimensionada = cdt1 > cargaMaxBomba || cdt2 > cargaMaxBomba;

  const iteraciones = [
    {
      iter:            1,
      flujoEquilibrio: flujoTotal_1,
      flujoPorBomba:   parseFloat(flujoPorBomba_1.toFixed(2)),
      cargaEntrada:    cdtEntrada_1,    // CDT diseno del sistema
      cargaSalida:     parseFloat(cdt1.toFixed(2)),
      cargaDispBomba:  cargaBombaEnDis, // CDT que da la bomba en diseno (para referencia)
      equiposRecalc:   equip1,
    },
    {
      iter:            2,
      flujoEquilibrio: flujoTotal_2,
      flujoPorBomba:   parseFloat(flujoPorBomba_2.toFixed(2)),
      cargaEntrada:    cdtEntrada_2,    // CDT salida iter 1
      cargaSalida:     parseFloat(cdt2.toFixed(2)),
      cargaDispBomba:  cdtEntrada_2,
      shutOffSuperado: bombaSubdimensionada,
      equiposRecalc:   equip2,
    },
  ];

  return {
    iteraciones,
    equilibrio: {
      flujo:           flujoFinal,
      carga:           parseFloat(cdt2.toFixed(2)),
      cargaDisponible: cargaDispFinal,
      cubre:           !bombaSubdimensionada && cargaDispFinal >= cdt2,
      equipos:         equip2,
    },
    cargasIniciales,
    bomba,
    nBombas,
  };
}