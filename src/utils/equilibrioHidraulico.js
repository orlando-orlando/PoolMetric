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
    // Barredora: cantidad fija por geometria, NO cambia con el flujo
    cantMinNueva = estado.cantidad ?? 1;
  } else if (key === "desnatador") {
    const area       = parseFloat(datosEmpotrable?.area) || 0;
    const flujoPorEq = eq.specs.flujo ?? eq.specs.maxFlow ?? 0;
    const numPorArea  = area > 0 ? Math.ceil(area / 40) : 1;
    const numPorFlujo = flujoPorEq > 0 ? Math.max(1, Math.ceil(flujoNuevo / flujoPorEq)) : 1;
    cantMinNueva = Math.max(numPorArea, numPorFlujo, 1);
  } else if (key === "drenFondo") {
    // Drenes de fondo: minimo 2 por norma antiatrapamiento
    const flujoPorEq = eq.specs.flujo ?? eq.specs.maxFlow ?? 0;
    let num = flujoPorEq > 0 ? Math.ceil((flujoNuevo * 2) / flujoPorEq) : estado.cantidad;
    if (num % 2 !== 0) num++;
    cantMinNueva = Math.max(2, num);
  } else if (key === "drenCanal") {
    // Drenes de canal: minimo 1
    const flujoPorEq = eq.specs.flujo ?? eq.specs.maxFlow ?? 0;
    let num = flujoPorEq > 0 ? Math.ceil((flujoNuevo * 2) / flujoPorEq) : estado.cantidad;
    if (num % 2 !== 0) num++;
    cantMinNueva = Math.max(1, num);
  } else {
    // Retorno y otros: minimo 1, no forzar 2
    const flujoPorEq = eq.specs.flujo ?? eq.specs.maxFlow ?? 0;
    cantMinNueva = flujoPorEq > 0 ? Math.max(1, Math.ceil(flujoNuevo / flujoPorEq)) : estado.cantidad;
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

const FLUJO_UMBRAL_MULTIPLICAR = 62; // GPM — filtros > este valor pueden ser múltiples
const CANT_MAX_FILTROS = 20;           // máximo de unidades antes de subir capacidad

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

  const catalActivos = catalogo
    .filter(c => c.metadata?.activo !== false)
    .map(c => ({ c, cap: c.specs?.maxFlow ?? c.specs?.flujoComercial ?? 0 }))
    .sort((a, b) => a.cap - b.cap); // orden ascendente de capacidad

  // ── Buscar el filtro de mayor capacidad que cubra el flujo con 1 unidad ──
  const buscarMayorCapacidad = (flujoReq) => {
    const candidatos = catalActivos.filter(({ cap }) => cap >= flujoReq);
    return candidatos.length > 0 ? candidatos[0] : null; // el más ajustado
  };

  let cantFinal    = cantOriginal;
  let flujoEfFinal = flujoEf;
  let modeloFinal  = modelo;
  let marcaFinal   = marca;

  const flujoTotalActual = flujoEf * cantOriginal;

  if (flujoTotalActual >= flujoNuevo) {
    // Ya cubre — sin cambio
    cantFinal = cantOriginal;

  } else if (flujoEf <= FLUJO_UMBRAL_MULTIPLICAR) {
    // Filtro pequeño (≤ 62 GPM): intentar subir capacidad primero
    const mejor = buscarMayorCapacidad(flujoNuevo);
    if (mejor) {
      // Hay un filtro grande que cubre solo — usar 1 unidad
      flujoEfFinal = mejor.cap;
      modeloFinal  = mejor.c.modelo;
      marcaFinal   = mejor.c.marca;
      cantFinal    = 1;
    } else {
      // No hay filtro que cubra solo — usar el de mayor capacidad disponible
      // y calcular cuántas unidades se necesitan
      const mayorDisponible = catalActivos.length > 0
        ? catalActivos[catalActivos.length - 1]  // el de mayor capacidad
        : null;
      if (mayorDisponible && mayorDisponible.cap > 0) {
        const cantNec = Math.ceil(flujoNuevo / mayorDisponible.cap);
        flujoEfFinal = mayorDisponible.cap;
        modeloFinal  = mayorDisponible.c.modelo;
        marcaFinal   = mayorDisponible.c.marca;
        cantFinal    = cantNec;
      } else {
        // No hay solución — escalar con el filtro actual
        cantFinal = Math.ceil(flujoNuevo / flujoEf);
      }
    }

  } else {
    // Filtro grande (> 62 GPM): intentar poner hasta CANT_MAX_FILTROS unidades
    const cantNecesaria = Math.ceil(flujoNuevo / flujoEf);
    if (cantNecesaria <= CANT_MAX_FILTROS) {
      // Cabe dentro del límite → subir cantidad
      cantFinal = Math.max(cantOriginal, cantNecesaria);
    } else {
      // Necesitaría más de 4 → buscar filtro de mayor capacidad
      // Intentar con 1 filtro mayor, luego con 2, 3, hasta 4
      let resuelto = false;
      for (let cant = 1; cant <= CANT_MAX_FILTROS; cant++) {
        const capNecesariaPorUnidad = flujoNuevo / cant;
        const mejor = buscarMayorCapacidad(capNecesariaPorUnidad);
        if (mejor && mejor.cap > flujoEf) {
          // Preferir el filtro más grande con la menor cantidad
          flujoEfFinal = mejor.cap;
          modeloFinal  = mejor.c.modelo;
          marcaFinal   = mejor.c.marca;
          cantFinal    = cant;
          resuelto     = true;
          break;
        }
      }
      if (!resuelto) {
        // No se encontró solución óptima — máximo 4 del filtro original
        cantFinal = CANT_MAX_FILTROS;
      }
    }
  }

  try {
    const res = fnManual(flujoEfFinal, cantFinal, flujoNuevo);
    return {
      cantidad: cantFinal, cantOriginal,
      cambio: cantFinal !== cantOriginal || flujoEfFinal !== flujoEf,
      cargaTotal: res?.cargaTotal ?? null,
      cargaTotalPSI: res?.cargaTotalPSI ?? null,
      modelo: modeloFinal, marca: marcaFinal,
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

  // Cargas de referencia al flujo de diseno
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

  // Recalcular equipos y obtener CDT del sistema al flujo dado
  function calcularCDTSistema(flujoNuevo, cargasRef) {
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
        // flujoPorEquipo = capacidad unitaria, flujoRealSistema = flujo real del sistema
        const res = calcularCargaUVManual(flujoNuevo / cantOriginal, cantOriginal, flujoNuevo);
        if (res && !res.error) {
          equiposRecalc.lamparaUV = {
            cantidad: cantOriginal, cantOriginal, cambio: false,
            cargaTotal: res.cargaTotal, sumaFinal: res.cargaTotal,
            resultadoHidraulico: res,  // necesario para la memoria de calculo
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
    const cdt = Math.max(0.1, cargaInicial + deltaCargas);
    return { equiposRecalc, cdt };
  }

  const cargasRef0      = calcularCargasRef(flujoInicial);
  const cargaBombaEnDis = parseFloat((cargaEnCurva(curva, flujoInicial / nBombas) ?? cargaInicial).toFixed(2));

  /* ============================================================
     BUSQUEDA INCREMENTAL DEL PUNTO DE EQUILIBRIO

     Partimos del flujo de diseño (flujoInicial) y avanzamos de
     GPM en GPM (paso de 0.5 GPM) calculando en cada punto:
       - CDT que da la bomba a ese flujo
       - CDT que requiere el sistema a ese flujo

     El equilibrio es donde CDT_bomba cruza CDT_sistema.
     Después de encontrar el equilibrio, continuamos 10 pasos más
     para ver cómo se comporta el sistema cerca del punto de operación.
  ============================================================ */
  const PASO = 0.5; // GPM por paso
  const PASOS_POST_EQ = 10; // pasos a mostrar después del equilibrio
  const qMaxBusqueda = curva[curva.length - 1].flujo_gpm * nBombas * 1.3;

  let flujoEq    = null;
  let cdtEq      = null;
  let equiposEq  = {};

  const pasos = []; // todos los pasos evaluados

  let cdtBombaAnterior = null;
  let cdtSistAnterior  = null;
  let flujoAnterior    = null;
  let idxEquilibrio    = null; // índice en pasos donde ocurrió el cruce

  // Fase 1: buscar el equilibrio avanzando de PASO en PASO
  for (let q = flujoInicial; q <= qMaxBusqueda; q += PASO) {
    const qRound     = parseFloat(q.toFixed(2));
    const cdtBomba_q = cargaEnCurva(curva, qRound / nBombas);
    if (cdtBomba_q == null) break;

    const { equiposRecalc, cdt: cdtSist_q } = calcularCDTSistema(qRound, cargasRef0);
    pasos.push({ flujo: qRound, cdtBomba: cdtBomba_q, cdtSistema: cdtSist_q, equipos: equiposRecalc, esEquilibrio: false });

    if (cdtBombaAnterior !== null && cdtSistAnterior !== null) {
      if (cdtBombaAnterior >= cdtSistAnterior && cdtBomba_q <= cdtSist_q) {
        // Interpolacion del cruce exacto
        const diffAnterior = cdtBombaAnterior - cdtSistAnterior;
        const diffActual   = cdtBomba_q - cdtSist_q;
        const t = diffAnterior / (diffAnterior - diffActual);
        flujoEq = parseFloat((flujoAnterior + t * (qRound - flujoAnterior)).toFixed(2));
        cdtEq   = parseFloat((cdtSistAnterior + t * (cdtSist_q - cdtSistAnterior)).toFixed(2));
        const { equiposRecalc: eqFinal } = calcularCDTSistema(flujoEq, cargasRef0);
        equiposEq  = eqFinal;
        idxEquilibrio = pasos.length; // después de este índice van los post-eq
        // Insertar el punto interpolado de equilibrio
        pasos.push({
          flujo: flujoEq, cdtBomba: cdtEq, cdtSistema: cdtEq,
          equipos: eqFinal, esEquilibrio: true,
        });
        break;
      }
    }

    cdtBombaAnterior = cdtBomba_q;
    cdtSistAnterior  = cdtSist_q;
    flujoAnterior    = qRound;
  }

  // Si no hubo cruce
  if (flujoEq === null) {
    const ultimo = pasos[pasos.length - 1];
    flujoEq   = ultimo?.flujo ?? flujoInicial;
    cdtEq     = ultimo?.cdtSistema ?? cargaInicial;
    const { equiposRecalc: eqFinal } = calcularCDTSistema(flujoEq, cargasRef0);
    equiposEq = eqFinal;
    pasos.push({ flujo: flujoEq, cdtBomba: cdtEq, cdtSistema: cdtEq, equipos: eqFinal, esEquilibrio: true });
    idxEquilibrio = pasos.length - 1;
  }

  // Fase 2: segunda iteracion
  // Misma logica que iter 1, misma referencia de cargas (cargasRef0),
  // partiendo desde flujoEq de iter 1.
  // Si el primer paso ya supera la bomba, el sistema convergio — no buscar mas.
  let flujoEq2   = flujoEq;
  let cdtEq2     = cdtEq;
  let equiposEq2 = equiposEq;
  const pasosIter2 = [];

  let cdtBombaAnt2 = null;
  let cdtSistAnt2  = null;
  let flujoAnt2    = null;
  let encontradoIter2 = false;

  // Limite de pasos para iter 2: suficiente para ver la tendencia
  const MAX_PASOS_ITER2 = 20;
  let contPasosIter2 = 0;

  for (let q = flujoEq; q <= qMaxBusqueda; q += PASO) {
    const qRound     = parseFloat(q.toFixed(2));
    const cdtBomba_q = cargaEnCurva(curva, qRound / nBombas);
    if (cdtBomba_q == null) break;

    const { equiposRecalc, cdt: cdtSist_q } = calcularCDTSistema(qRound, cargasRef0);
    pasosIter2.push({ flujo: qRound, cdtBomba: cdtBomba_q, cdtSistema: cdtSist_q, equipos: equiposRecalc, esEquilibrio: false });
    contPasosIter2++;

    if (cdtBombaAnt2 !== null && cdtSistAnt2 !== null) {
      if (cdtBombaAnt2 >= cdtSistAnt2 && cdtBomba_q <= cdtSist_q) {
        const diffAnt = cdtBombaAnt2 - cdtSistAnt2;
        const diffAct = cdtBomba_q - cdtSist_q;
        const t = diffAnt / (diffAnt - diffAct);
        flujoEq2 = parseFloat((flujoAnt2 + t * (qRound - flujoAnt2)).toFixed(2));
        cdtEq2   = parseFloat((cdtSistAnt2 + t * (cdtSist_q - cdtSistAnt2)).toFixed(2));
        const { equiposRecalc: eqFinal2 } = calcularCDTSistema(flujoEq2, cargasRef0);
        equiposEq2 = eqFinal2;
        pasosIter2.push({ flujo: flujoEq2, cdtBomba: cdtEq2, cdtSistema: cdtEq2, equipos: eqFinal2, esEquilibrio: true });
        encontradoIter2 = true;
        break;
      }
    }

    // Si el sistema ya supera la bomba desde el primer paso -> convergido
    if (contPasosIter2 === 1 && cdtBomba_q < cdtSist_q) {
      // La bomba no puede desde el inicio de iter 2 -> equilibrio es el de iter 1
      pasosIter2.push({ flujo: flujoEq, cdtBomba: cdtEq, cdtSistema: cdtEq, equipos: equiposEq, esEquilibrio: true });
      encontradoIter2 = true;
      break;
    }

    // Limitar pasos de iter 2
    if (contPasosIter2 >= MAX_PASOS_ITER2) break;

    cdtBombaAnt2 = cdtBomba_q;
    cdtSistAnt2  = cdtSist_q;
    flujoAnt2    = qRound;
  }

  if (!encontradoIter2) {
    pasosIter2.push({ flujo: flujoEq, cdtBomba: cdtEq, cdtSistema: cdtEq, equipos: equiposEq, esEquilibrio: true });
  }

  pasos.push({ separador: true, label: "── Iteración 2 ──" });
  pasos.push(...pasosIter2);

  const cargaDispFinal = parseFloat((cargaEnCurva(curva, flujoEq2 / nBombas) ?? 0).toFixed(2));

  // Construir iteraciones desde todos los pasos (incluye separador entre iter1 e iter2)
  let iterCount = 0;
  const iteraciones = pasos.map((p) => {
    if (p.separador) return { separador: true, label: p.label };
    iterCount++;
    return {
      iter:            iterCount,
      flujoEquilibrio: parseFloat(p.flujo.toFixed(2)),
      flujoPorBomba:   parseFloat((p.flujo / nBombas).toFixed(2)),
      cargaSalida:     parseFloat(p.cdtSistema.toFixed(2)),
      cargaDispBomba:  parseFloat(p.cdtBomba.toFixed(2)),
      equiposRecalc:   p.equipos,
      esEquilibrio:    p.esEquilibrio === true,
    };
  });

  return {
    iteraciones,
    equilibrio: {
      flujo:           parseFloat(flujoEq2.toFixed(2)),
      carga:           parseFloat(cdtEq2.toFixed(2)),
      cargaDisponible: cargaDispFinal,
      cubre:           cargaDispFinal >= cdtEq2,
      equipos:         equiposEq2,
    },
    cargasIniciales,
    bomba,
    nBombas,
  };
}