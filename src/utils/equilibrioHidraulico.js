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
import { calcularCargaFiltroArenaManual } from "./filtroArena";
import { calcularCargaPrefiltroManual }   from "./prefiltro";
import { calcularCargaFiltroCartuchoManual, flujoEfectivo } from "./filtroCartucho";

/* ================================================================
   INTERPOLACIÓN/EXTRAPOLACIÓN — carga dado flujo en curva de bomba
   Si el flujo está fuera del rango tabulado, extrapola linealmente
   con los dos últimos puntos de la curva.
   ================================================================ */
function cargaEnCurva(curva, flujo_gpm) {
  if (!curva || curva.length === 0) return null;
  if (flujo_gpm <= curva[0].flujo_gpm) return curva[0].carga_ft;

  // Dentro del rango: interpolación
  for (let i = 0; i < curva.length - 1; i++) {
    const p1 = curva[i], p2 = curva[i + 1];
    if (flujo_gpm >= p1.flujo_gpm && flujo_gpm <= p2.flujo_gpm) {
      const t = (flujo_gpm - p1.flujo_gpm) / (p2.flujo_gpm - p1.flujo_gpm);
      return p1.carga_ft + t * (p2.carga_ft - p1.carga_ft);
    }
  }

  // Fuera del rango por la derecha: extrapolación lineal con últimos 2 puntos
  const ult = curva[curva.length - 1];
  const pen = curva[curva.length - 2];
  const dQ  = ult.flujo_gpm - pen.flujo_gpm;
  if (dQ === 0) return ult.carga_ft;
  const pendiente = (ult.carga_ft - pen.carga_ft) / dQ;
  const extrapolado = ult.carga_ft + pendiente * (flujo_gpm - ult.flujo_gpm);
  // No puede ser negativa (bomba no entrega carga negativa)
  return Math.max(0, extrapolado);
}

/* ================================================================
   NORMALIZA TIPO para funciones de empotrables
   ================================================================ */
const TAMANO_A_TIPO = { "9x9": "9.0", "12x12": "12.0", "18x18": "18.0" };
function normTipo(raw) {
  return TAMANO_A_TIPO[String(raw)] ?? String(raw);
}

/* ================================================================
   RECALCULAR CARGA DE UN EMPOTRABLE dado flujo y estado actual
   ================================================================ */
function recalcularEmpotrable(key, estado, flujoNuevo, datosEmpotrable, fnCalculo, catalogo) {
  if (!estado?.selId || !flujoNuevo || !datosEmpotrable) return null;
  const eq = catalogo.find(e => e.id === estado.selId);
  if (!eq) return null;

  const flujoPorEq  = eq.specs.flujo ?? eq.specs.maxFlow ?? 0;
  const cantMinNueva = flujoPorEq > 0 ? Math.max(2, Math.ceil(flujoNuevo / flujoPorEq)) : estado.cantidad;
  const cantFinal   = Math.max(cantMinNueva, estado.cantidad ?? 1);
  const tipo        = estado.tipo ?? normTipo(eq.specs.tamano ?? eq.specs.dimensionPuerto ?? "");

  try {
    const res = fnCalculo(flujoNuevo, tipo, datosEmpotrable, cantFinal);
    return {
      cantidad: cantFinal, cantOriginal: estado.cantidad,
      cambio: cantFinal !== estado.cantidad,
      sumaFinal: res?.sumaFinal ?? null,
      modelo: eq.modelo, marca: eq.marca,
    };
  } catch { return null; }
}

/* ================================================================
   RECALCULAR CARGA DE UN FILTRO dado flujo y estado actual
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
    flujoEf = flujoEfectivo(f, usoGeneral) ?? estado.flujoEf;
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
    };
  } catch { return null; }
}

/* ================================================================
   FUNCIÓN PRINCIPAL: calcularEquilibrio()

   Física correcta:
   ─────────────────
   La curva del SISTEMA es parabólica: CDT_sis(Q) = k · Q²
   donde k = cargaInicial / flujoInicial²   (punto de diseño)

   El punto de EQUILIBRIO es la intersección de la curva del sistema
   con la curva de la bomba (o banco en paralelo):
     CDT_bomba(Q/n) = k · Q²

   Se resuelve buscando el Q donde esa igualdad se cumple.
   A mayor flujo de diseño → mayor CDT del sistema → la bomba
   opera más a la izquierda de su curva.
   Si la bomba tiene exceso de carga en el punto de diseño, el
   equilibrio real estará a la DERECHA (mayor Q), no a la izquierda.

   Los empotrables y filtros se recalculan en el punto de equilibrio
   solo para informar cuántas unidades se necesitan.
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

  // ── Constante de la curva del sistema (parabólica, pasa por el origen) ──
  // CDT_sis(Q) = k · Q²   con   k = cargaInicial / flujoInicial²
  if (!flujoInicial || flujoInicial <= 0 || !cargaInicial || cargaInicial <= 0)
    return { error: "Flujo o carga de diseño no válidos." };

  const k = cargaInicial / (flujoInicial * flujoInicial);

  // Mapa de funciones y catálogos
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

  /* ── Buscar Q de equilibrio ──────────────────────────────────────
     Recorremos la curva de la bomba en paralelo punto a punto.
     Para cada punto (Q_b, H_b) de la curva de UNA bomba:
       - Q_total = Q_b * nBombas
       - CDT_sis  = k * Q_total²
     El equilibrio es donde H_b cruce CDT_sis(Q_total).
     Interpolamos la intersección entre los dos puntos donde ocurre.
  ──────────────────────────────────────────────────────────────── */
  let flujoEq = null;
  let cargaEq = null;

  for (let i = 0; i < curva.length - 1; i++) {
    const p1 = curva[i],     p2 = curva[i + 1];
    const Q1 = p1.flujo_gpm * nBombas;
    const Q2 = p2.flujo_gpm * nBombas;
    const H1_bomba = p1.carga_ft;
    const H2_bomba = p2.carga_ft;
    const H1_sis   = k * Q1 * Q1;
    const H2_sis   = k * Q2 * Q2;

    // Diferencia: bomba - sistema
    const d1 = H1_bomba - H1_sis;
    const d2 = H2_bomba - H2_sis;

    // Si cruzan de positivo a negativo (o igual a cero) → hay intersección
    if (d1 >= 0 && d2 <= 0) {
      // Interpolación lineal de la intersección
      const t   = d1 / (d1 - d2);          // fracción entre p1 y p2
      flujoEq   = Q1 + t * (Q2 - Q1);
      cargaEq   = H1_sis + t * (H2_sis - H1_sis); // CDT del sistema en ese punto
      break;
    }
  }

  // Si no encontramos intersección dentro del rango de la curva
  if (flujoEq == null) {
    const ultimo  = curva[curva.length - 1];
    const primero = curva[0];

    // Caso A: bomba siempre POR DEBAJO del sistema → subdimensionada
    const H0_bomba = primero.carga_ft;
    const H0_sis   = k * (primero.flujo_gpm * nBombas) ** 2;
    if (H0_bomba < H0_sis) {
      return { error: "La motobomba no alcanza la curva del sistema. Selecciona una bomba de mayor potencia." };
    }

    // Caso B: bomba siempre POR ENCIMA → equilibrio más allá del rango tabulado.
    // Extrapolamos linealmente con los últimos dos puntos de la curva para
    // encontrar el flujo donde la bomba entregaría la carga del sistema.
    const penultimo = curva[curva.length - 2];

    // Pendiente de la curva de la bomba (ft por GPM) entre los últimos dos puntos
    const dQ_curva = ultimo.flujo_gpm - penultimo.flujo_gpm;
    const dH_curva = ultimo.carga_ft  - penultimo.carga_ft;   // negativo (curva baja)
    const pendiente = dQ_curva !== 0 ? dH_curva / dQ_curva : 0;

    // Pendiente de la curva del sistema en el último punto (tangente de k·Q²)
    // d(k·Q²)/dQ = 2·k·Q  — evaluada en Q_total del último punto
    const Q_ult_total = ultimo.flujo_gpm * nBombas;
    const pendSis_Q   = 2 * k * Q_ult_total;           // ft por GPM (del sistema)
    // En términos de flujo por bomba: dividimos por nBombas
    const pendSis     = pendSis_Q * nBombas;            // ft por GPM_total

    // Diferencia en el último punto (bomba - sistema)
    const H_sis_ult = k * Q_ult_total * Q_ult_total;
    const diff_ult  = ultimo.carga_ft - H_sis_ult;      // positivo (bomba aún > sistema)

    // La diferencia cambia a razón de (pendiente_bomba - pendiente_sistema) por GPM
    // Extrapolamos cuántos GPM más necesitamos para que diff = 0
    const pendDiff = pendiente - pendSis / nBombas;     // pendiente de la diferencia
    let deltaQ_extra = 0;
    if (Math.abs(pendDiff) > 1e-10) {
      deltaQ_extra = -diff_ult / pendDiff;              // puede ser positivo (a la derecha)
    }

    const Q_b_extra   = ultimo.flujo_gpm + deltaQ_extra;
    flujoEq = parseFloat((Q_b_extra * nBombas).toFixed(2));
    const H_sis_extra = k * flujoEq * flujoEq;
    cargaEq = parseFloat(H_sis_extra.toFixed(2));
  }

  flujoEq = parseFloat(flujoEq.toFixed(2));
  cargaEq = parseFloat(cargaEq.toFixed(2));

  // CDT que la bomba entrega en el punto de equilibrio
  const cargaDispBomba = cargaEnCurva(curva, flujoEq / nBombas);

  /* ── Función auxiliar: buscar Q de equilibrio dado k (curva del sistema) ── */
  function buscarEquilibrio(kSis) {
    let fEq = null, hEq = null;
    for (let i = 0; i < curva.length - 1; i++) {
      const p1 = curva[i], p2 = curva[i + 1];
      const Q1 = p1.flujo_gpm * nBombas, Q2 = p2.flujo_gpm * nBombas;
      const d1 = p1.carga_ft - kSis * Q1 * Q1;
      const d2 = p2.carga_ft - kSis * Q2 * Q2;
      if (d1 >= 0 && d2 <= 0) {
        const t = d1 / (d1 - d2);
        fEq = Q1 + t * (Q2 - Q1);
        hEq = kSis * fEq * fEq;
        break;
      }
    }
    // Si no hay intersección dentro del rango → extrapolar con últimos 2 puntos
    if (fEq == null) {
      const ult = curva[curva.length - 1], pen = curva[curva.length - 2];
      // Verificar si la bomba está siempre por debajo (subdimensionada)
      const H0 = curva[0].carga_ft, H0sis = kSis * (curva[0].flujo_gpm * nBombas) ** 2;
      if (H0 < H0sis) return null; // subdimensionada
      // Extrapolación lineal
      const dQ = ult.flujo_gpm - pen.flujo_gpm;
      const dH = ult.carga_ft  - pen.carga_ft;
      const pend = dQ !== 0 ? dH / dQ : 0;
      const Q_ult = ult.flujo_gpm * nBombas;
      const H_sis_ult = kSis * Q_ult * Q_ult;
      const diff_ult  = ult.carga_ft - H_sis_ult;
      const pendSis   = 2 * kSis * Q_ult;
      const pendDiff  = pend - pendSis / nBombas;
      const deltaQ    = Math.abs(pendDiff) > 1e-10 ? -diff_ult / pendDiff : 0;
      fEq = (ult.flujo_gpm + deltaQ) * nBombas;
      hEq = kSis * fEq * fEq;
    }
    return { flujoEq: parseFloat(fEq.toFixed(2)), cargaEq: parseFloat(hEq.toFixed(2)) };
  }

  /* ── 2 iteraciones completas ─────────────────────────────────────────────
     Iter 1: equilibrio con curva de diseño original  (k = CDT_dis / Q_dis²)
             → recalcular equipos con Q_eq1
             → nuevo CDT sumando deltas de cargas recalculadas
     Iter 2: equilibrio con curva actualizada          (k2 = CDT_nuevo / Q_eq1²)
             → recalcular equipos con Q_eq2
             → resultado final
  ──────────────────────────────────────────────────────────────────────── */
  const iteraciones = [];
  const empKeys = tieneDesbordeCanal
    ? ["retorno", "barredora", "drenFondo", "drenCanal"]
    : ["retorno", "desnatador", "barredora", "drenFondo"];

  let kActual        = k;
  let flujoEqActual  = flujoEq;
  let cargaEqActual  = cargaEq;
  let equiposFinales = {};

  for (let iter = 0; iter < 2; iter++) {
    const flujoIter = flujoEqActual;

    // ── Recalcular empotrables y filtros con el flujo de esta iteración ──
    const equiposRecalc = {};

    for (const key of empKeys) {
      const est = estados[key];
      if (!est?.selId) continue;
      const cfg = empotrablesConfig[key];
      const rec = recalcularEmpotrable(key, est, flujoIter, datosEmpotrable, cfg.fn, cfg.cat);
      if (rec) equiposRecalc[key] = rec;
    }
    for (const key of ["filtroArena", "prefiltro", "filtroCartucho"]) {
      const est = estados[key];
      if (!est) continue;
      const cfg = filtrosConfig[key];
      const rec = recalcularFiltro(key, est, flujoIter, cfg.fn, cfg.cat, usoGeneral);
      if (rec) equiposRecalc[key] = rec;
    }

    // ── Calcular el nuevo CDT total con las cargas recalculadas ──
    // Parte 1: cargas que NO se recalculan (calentamiento, sanitización, etc.)
    //   → se preservan de cargasIniciales
    // Parte 2: cargas que SÍ se recalculan → nuevos valores
    const keysRecalc = [
      ...empKeys.filter(k => equiposRecalc[k] != null),
      ...["filtroArena", "prefiltro", "filtroCartucho"].filter(k => equiposRecalc[k] != null),
    ];

    // CDT nuevo = cargaInicial - Σ(cargas_originales_recalculadas) + Σ(cargas_nuevas)
    let deltaCargas = 0;
    for (const key of keysRecalc) {
      const cargaOrig  = parseFloat(cargasIniciales[key] ?? 0);
      const eq         = equiposRecalc[key];
      const cargaNueva = parseFloat(eq.sumaFinal ?? eq.cargaTotal ?? 0);
      deltaCargas += (cargaNueva - cargaOrig);
    }
    const cargaTotalNueva = Math.max(0.1, cargaInicial + deltaCargas);

    // ── CDT de la bomba en este punto ──
    const cargaBombaIt = parseFloat((cargaEnCurva(curva, flujoIter / nBombas) ?? 0).toFixed(2));

    iteraciones.push({
      iter:            iter + 1,
      flujoEquilibrio: flujoIter,
      cargaEntrada:    parseFloat((iter === 0 ? cargaInicial : iteraciones[0].cargaSalida).toFixed(2)),
      cargaSalida:     parseFloat(cargaTotalNueva.toFixed(2)),
      cargaDispBomba:  cargaBombaIt,
      equiposRecalc,
    });

    equiposFinales = equiposRecalc;

    // ── Preparar siguiente iteración ──
    // Nueva curva del sistema: pasa por (flujoIter, cargaTotalNueva)
    if (iter < 1) {
      kActual = cargaTotalNueva / (flujoIter * flujoIter);
      const sig = buscarEquilibrio(kActual);
      if (sig) {
        flujoEqActual = sig.flujoEq;
        cargaEqActual = sig.cargaEq;
      }
      // Si sig es null (subdimensionada tras recalculo) dejamos el flujo actual
    }
  }

  const ultima         = iteraciones[iteraciones.length - 1];
  const flujoFinal     = ultima.flujoEquilibrio;
  const cargaFinal     = ultima.cargaSalida;
  const cargaDispFinal = parseFloat((cargaEnCurva(curva, flujoFinal / nBombas) ?? 0).toFixed(2));

  return {
    iteraciones,
    equilibrio: {
      flujo:           flujoFinal,
      carga:           cargaFinal,
      cargaDisponible: cargaDispFinal,
      cubre:           cargaDispFinal >= cargaFinal,
      equipos:         equiposFinales,
    },
    cargasIniciales,
    bomba:   bomba,
    nBombas,
  };
}