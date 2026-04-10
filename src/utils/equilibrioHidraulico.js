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

/* ================================================================
   INTERPOLACIÓN/EXTRAPOLACIÓN — flujo dado CDT en curva de bomba
   Dado un CDT objetivo, devuelve el flujo que entrega la bomba.
   La curva es decreciente: a mayor CDT requerido, menor flujo.
   ================================================================ */
function flujoEnCurva(curva, cargaObjetivo) {
  if (!curva || curva.length === 0) return null;

  // CDT mayor que el máximo de la bomba (shut-off) → bomba no arranca
  if (cargaObjetivo > curva[0].carga_ft) return 0;

  // CDT menor que el mínimo tabulado → extrapolar con últimos 2 puntos
  if (cargaObjetivo < curva[curva.length - 1].carga_ft) {
    const ult = curva[curva.length - 1];
    const pen = curva[curva.length - 2];
    const dH  = ult.carga_ft - pen.carga_ft;
    const dQ  = ult.flujo_gpm - pen.flujo_gpm;
    if (Math.abs(dH) < 1e-10) return ult.flujo_gpm;
    const t = (cargaObjetivo - pen.carga_ft) / dH;
    return Math.max(0, pen.flujo_gpm + t * dQ);
  }

  // Interpolar dentro del rango
  for (let i = 0; i < curva.length - 1; i++) {
    const p1 = curva[i], p2 = curva[i + 1];
    if (cargaObjetivo <= p1.carga_ft && cargaObjetivo >= p2.carga_ft) {
      const t = (p1.carga_ft - cargaObjetivo) / (p1.carga_ft - p2.carga_ft);
      return p1.flujo_gpm + t * (p2.flujo_gpm - p1.flujo_gpm);
    }
  }
  return null;
}

/* ================================================================
   INTERPOLACIÓN/EXTRAPOLACIÓN — CDT dado flujo en curva de bomba
   ================================================================ */
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

  // Extrapolar con últimos 2 puntos
  const ult = curva[curva.length - 1];
  const pen = curva[curva.length - 2];
  const dQ  = ult.flujo_gpm - pen.flujo_gpm;
  if (dQ === 0) return ult.carga_ft;
  const pend = (ult.carga_ft - pen.carga_ft) / dQ;
  return Math.max(0, ult.carga_ft + pend * (flujo_gpm - ult.flujo_gpm));
}

/* ================================================================
   NORMALIZA TIPO para funciones de empotrables
   ================================================================ */
const TAMANO_A_TIPO = { "9x9": "9.0", "12x12": "12.0", "18x18": "18.0" };
function normTipo(raw) {
  return TAMANO_A_TIPO[String(raw)] ?? String(raw);
}

/* ================================================================
   RECALCULAR CARGA DE UN EMPOTRABLE dado flujo nuevo
   ================================================================ */
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
    // Desnatadores: mayor entre criterio de área (area/40) y criterio de flujo
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

/* ================================================================
   RECALCULAR CARGA DE UN FILTRO dado flujo nuevo
   ================================================================ */
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
      resultadoHidraulico: res,   // resultado completo para la memoria de cálculo
    };
  } catch { return null; }
}

/* ================================================================
   FUNCIÓN PRINCIPAL: calcularEquilibrio()

   ALGORITMO:
   ──────────
   El punto de partida es la CDT de diseño (cargaInicial).
   La bomba a esa CDT entrega cierto flujo → ese es el flujo de trabajo real.
   Con ese flujo se recalculan los equipos → nuevo CDT.
   La bomba a ese nuevo CDT entrega otro flujo → iteración 2.
   Con ese flujo se vuelven a recalcular los equipos → CDT final.

   Iter 1:
     - Flujo_1 = flujo que da 1 bomba a CDT_diseño × nBombas
     - Recalcular equipos con Flujo_1 → CDT_nuevo_1
   Iter 2:
     - Flujo_2 = flujo que da 1 bomba a CDT_nuevo_1 × nBombas
     - Recalcular equipos con Flujo_2 → CDT_nuevo_2 (resultado final)
   ================================================================ */
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
    return { error: "Flujo o carga de diseño no válidos." };

  // Verificar que la bomba alcanza la CDT de diseño
  const cargaMaxBomba = curva[0].carga_ft;
  if (cargaInicial > cargaMaxBomba) {
    return { error: `La motobomba no alcanza la CDT de diseño (${cargaInicial.toFixed(2)} ft > ${cargaMaxBomba} ft shut-off).` };
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

  /* ── Función: recalcular equipos con flujo dado y obtener CDT nuevo ──
     cargaBase:    CDT de referencia del paso anterior
     cargasRef:    cargas de referencia para calcular el delta
                   (iter1 usa cargasIniciales, iter2 usa cargas resultantes de iter1)
  ── */
  function recalcularYObtenerCDT(flujoNuevo, cargaBase, cargasRef) {
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

    // Generador UV — trabaja en línea con el flujo principal
    if (estados?.lamparaUV?.selId) {
      const est = estados.lamparaUV;
      const cantOriginal = est.cantidad ?? 1;
      const flujoPorUV   = flujoNuevo / cantOriginal;
      try {
        const res = calcularCargaUVManual(flujoPorUV, cantOriginal);
        if (res && !res.error) {
          equiposRecalc.lamparaUV = {
            cantidad: cantOriginal, cantOriginal, cambio: false,
            cargaTotal: res.cargaTotal, sumaFinal: res.cargaTotal,
          };
        }
      } catch { /* sin cambio */ }
    }

    // CDT nuevo = cargaBase + Σ(carga_nueva - carga_referencia_paso_anterior)
    // Así el delta refleja el cambio real desde el paso anterior, no desde el diseño original
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
    const cargaTotalNueva = Math.max(0.1, cargaBase + deltaCargas);

    // Límite físico: el CDT del sistema no puede superar lo que la bomba puede dar
    // a ese flujo. Si supera, significa que la bomba no alcanza y el sistema
    // opera en el máximo disponible de la bomba.
    const cargaDispBombaEnFlujo = cargaEnCurva(curva, flujoNuevo / nBombas);
    const cargaTotalLimitada = cargaDispBombaEnFlujo != null
      ? Math.min(cargaTotalNueva, cargaDispBombaEnFlujo)
      : cargaTotalNueva;

    // Construir las cargas resultantes de este paso para pasarlas como referencia al siguiente
    const cargasResultantes = { ...cargasRef };
    for (const key of keysRecalc) {
      const eq = equiposRecalc[key];
      cargasResultantes[key] = parseFloat(eq.sumaFinal ?? eq.cargaTotal ?? 0);
    }

    return { equiposRecalc, cargaTotalNueva: cargaTotalLimitada, cargasResultantes };
  }

  /* ══ Iteración 1 ══
     CDT entrada = CDT del sistema de diseño (31.39 ft)
     La bomba a ese CDT da más flujo que el de diseño (tiene exceso)
     → recalcular equipos con ese flujo mayor → CDT salida
  ══════════════════ */
  const cargaEntrada_1  = parseFloat(cargaInicial.toFixed(2));
  const flujoPorBomba_1 = flujoEnCurva(curva, cargaEntrada_1);
  if (flujoPorBomba_1 == null || flujoPorBomba_1 <= 0) {
    return { error: "No se puede determinar el flujo de la bomba en el CDT de diseño." };
  }
  const flujoTotal_1 = parseFloat((flujoPorBomba_1 * nBombas).toFixed(2));
  const { equiposRecalc: equip1, cargaTotalNueva: cdt1, cargasResultantes: cargas1 } =
    recalcularYObtenerCDT(flujoTotal_1, cargaInicial, cargasIniciales);

  /* ══ Iteración 2 ══
     CDT entrada = CDT salida de iter 1
     Flujo = lo que da la bomba a ese CDT × nBombas
     Delta se calcula vs cargas de iter 1 (no vs diseño original)
  ══════════════════ */
  const cargaEntrada_2  = parseFloat(cdt1.toFixed(2));
  const flujoPorBomba_2 = flujoEnCurva(curva, cargaEntrada_2);
  const flujoTotal_2 = flujoPorBomba_2 != null && flujoPorBomba_2 > 0
    ? parseFloat((flujoPorBomba_2 * nBombas).toFixed(2))
    : flujoTotal_1;
  const { equiposRecalc: equip2, cargaTotalNueva: cdt2 } =
    recalcularYObtenerCDT(flujoTotal_2, cdt1, cargas1);

  /* ── Flujo final: lo que da la bomba a CDT_salida_iter2 ── */
  const flujoPorBomba_final = flujoEnCurva(curva, cdt2);
  const flujoFinal = flujoPorBomba_final != null && flujoPorBomba_final > 0
    ? parseFloat((flujoPorBomba_final * nBombas).toFixed(2))
    : flujoTotal_2;

  /* ── CDT disponible de la bomba en el flujo final ── */
  const cargaDispFinal = parseFloat((cargaEnCurva(curva, flujoFinal / nBombas) ?? 0).toFixed(2));

  const iteraciones = [
    {
      iter:            1,
      flujoEquilibrio: flujoTotal_1,
      flujoPorBomba:   parseFloat(flujoPorBomba_1.toFixed(2)),
      cargaEntrada:    cargaEntrada_1,   // CDT que da la bomba en el punto de diseño
      cargaSalida:     parseFloat(cdt1.toFixed(2)),
      cargaDispBomba:  cargaEntrada_1,
      equiposRecalc:   equip1,
    },
    {
      iter:            2,
      flujoEquilibrio: flujoTotal_2,
      flujoPorBomba:   parseFloat((flujoPorBomba_2 ?? flujoPorBomba_1).toFixed(2)),
      cargaEntrada:    cargaEntrada_2,   // CDT salida de iter 1
      cargaSalida:     parseFloat(cdt2.toFixed(2)),
      cargaDispBomba:  cargaEntrada_2,
      equiposRecalc:   equip2,
    },
  ];

  return {
    iteraciones,
    equilibrio: {
      flujo:           flujoFinal,
      carga:           parseFloat(cdt2.toFixed(2)),
      cargaDisponible: cargaDispFinal,
      cubre:           cargaDispFinal >= cdt2,
      equipos:         equip2,
    },
    cargasIniciales,
    bomba,
    nBombas,
  };
}