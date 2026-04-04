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
import { cantidadMinima }                 from "./seleccionMotobomba";

/* ================================================================
   INTERPOLACIÓN — flujo dado CDT en curva de bomba
   (inversa: busca el flujo donde la curva = cargaObjetivo)
   ================================================================ */
function flujoEnCurva(curva, cargaObjetivo) {
  if (!curva || curva.length === 0) return null;

  // Si la carga objetivo es mayor que la carga en el punto 0 → fuera de rango
  if (cargaObjetivo > curva[0].carga_ft) return null;

  // Si la carga objetivo es menor que el último punto → la bomba supera ese CDT
  // en toda la curva; retornar el flujo máximo de la curva
  if (cargaObjetivo < curva[curva.length - 1].carga_ft) {
    return curva[curva.length - 1].flujo_gpm;
  }

  // Buscar entre dos puntos donde la carga cruce cargaObjetivo
  // La curva debe ser decreciente en carga (normal en bombas)
  for (let i = 0; i < curva.length - 1; i++) {
    const p1 = curva[i];
    const p2 = curva[i + 1];
    if (cargaObjetivo <= p1.carga_ft && cargaObjetivo >= p2.carga_ft) {
      const t = (p1.carga_ft - cargaObjetivo) / (p1.carga_ft - p2.carga_ft);
      return p1.flujo_gpm + t * (p2.flujo_gpm - p1.flujo_gpm);
    }
  }
  return null;
}

/* ================================================================
   INTERPOLACIÓN DIRECTA — carga dado flujo
   ================================================================ */
function cargaEnCurva(curva, flujo_gpm) {
  if (!curva || curva.length === 0) return null;
  if (flujo_gpm > curva[curva.length - 1].flujo_gpm) return null;
  if (flujo_gpm <= curva[0].flujo_gpm) return curva[0].carga_ft;

  for (let i = 0; i < curva.length - 1; i++) {
    const p1 = curva[i];
    const p2 = curva[i + 1];
    if (flujo_gpm >= p1.flujo_gpm && flujo_gpm <= p2.flujo_gpm) {
      const t = (flujo_gpm - p1.flujo_gpm) / (p2.flujo_gpm - p1.flujo_gpm);
      return p1.carga_ft + t * (p2.carga_ft - p1.carga_ft);
    }
  }
  return null;
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
   estado = { selId, cantidad, tipo }
   ================================================================ */
function recalcularEmpotrable(key, estado, flujoNuevo, datosEmpotrable, fnCalculo, catalogo) {
  if (!estado || !flujoNuevo || !datosEmpotrable) return null;

  const eq = catalogo.find(e => e.id === estado.selId);
  if (!eq) return null;

  // Cantidad mínima para cubrir el nuevo flujo con el mismo modelo
  const flujoPorEq   = eq.specs.flujo ?? eq.specs.maxFlow ?? 0;
  const cantMinNueva = flujoPorEq > 0 ? Math.max(2, Math.ceil(flujoNuevo / flujoPorEq)) : estado.cantidad;
  const cantFinal    = Math.max(cantMinNueva, estado.cantidad ?? 1);

  const tipo = estado.tipo ?? normTipo(eq.specs.tamano ?? eq.specs.dimensionPuerto ?? "");

  try {
    const res = fnCalculo(flujoNuevo, tipo, datosEmpotrable, cantFinal);
    return {
      cantidad:    cantFinal,
      cantOriginal: estado.cantidad,
      cambio:      cantFinal !== estado.cantidad,
      sumaFinal:   res?.sumaFinal ?? null,
      modelo:      eq.modelo,
      marca:       eq.marca,
    };
  } catch { return null; }
}

/* ================================================================
   RECALCULAR CARGA DE UN FILTRO dado flujo y estado actual
   ================================================================ */
function recalcularFiltro(key, estado, flujoNuevo, fnManual, catalogo, usoGeneral) {
  if (!estado || !flujoNuevo) return null;

  // selId unificado — en modo recomendado ya viene resuelto desde Equipamiento.jsx
  const idBuscar = estado.selId;
  if (!idBuscar) return null;

  let flujoEf, modelo, marca;
  const cantOriginal = estado.cantidad ?? 1;

  if (key === "filtroArena") {
    const f = catalogo.find(f => f.id === idBuscar);
    if (!f) return null;
    flujoEf = f.specs.maxFlow;
    modelo  = f.modelo;
    marca   = f.marca;
  } else if (key === "prefiltro") {
    const p = catalogo.find(p => p.id === idBuscar);
    if (!p) return null;
    flujoEf = p.specs.maxFlow;
    modelo  = p.modelo;
    marca   = p.marca;
  } else if (key === "filtroCartucho") {
    const f = catalogo.find(f => f.id === idBuscar);
    if (!f) return null;
    flujoEf = flujoEfectivo(f, usoGeneral) ?? estado.flujoEf;
    modelo  = f.modelo;
    marca   = f.marca;
  }

  if (!flujoEf || flujoEf <= 0) return null;

  // Cantidad mínima para cubrir el flujo nuevo con el mismo modelo
  const cantMin   = Math.max(1, Math.ceil(flujoNuevo / flujoEf));
  // Solo sube — nunca baja por debajo de lo que el usuario eligió
  const cantFinal = Math.max(cantMin, cantOriginal);

  try {
    const res = fnManual(flujoEf, cantFinal);
    return {
      cantidad:      cantFinal,
      cantOriginal,
      cambio:        cantFinal !== cantOriginal,
      cargaTotal:    res?.cargaTotal    ?? null,
      cargaTotalPSI: res?.cargaTotalPSI ?? null,
      modelo,
      marca,
    };
  } catch { return null; }
}

/* ================================================================
   FUNCIÓN PRINCIPAL: calcularEquilibrio()

   Parámetros:
     bombId         — id de la motobomba seleccionada
     nBombas        — cantidad de bombas en paralelo
     flujoInicial   — flujoMaxGlobal original (GPM)
     cargaInicial   — cargaTotalGlobal original (ft)
     estados        — objeto con estado de cada bloque
     cargasIniciales — objeto con carga actual de cada bloque
     datosEmpotrable — datos físicos del primer cuerpo
     tieneDesbordeCanal — bool
     usoGeneral     — string

   Retorna:
     { iteraciones: [...], equilibrio: { flujo, carga, equipos } }
   ================================================================ */
export function calcularEquilibrio({
  bombaId, nBombas, flujoInicial, cargaInicial,
  estados, cargasIniciales, datosEmpotrable,
  tieneDesbordeCanal, usoGeneral,
}) {
  const bomba = motobombas1v.find(b => b.id === bombaId);
  if (!bomba) return { error: "Motobomba no encontrada." };

  const curva = bomba.curva;

  // Mapa de funciones y catálogos para empotrables
  const empotrablesConfig = {
    retorno:    { fn: (f, t, d, n) => retorno(f, t, d, n),    cat: retornos    },
    desnatador: { fn: (f, t, d, n) => desnatador(f, t, d, n), cat: desnatadores },
    barredora:  { fn: (f, t, d, n) => barredora(f, t, d, n),  cat: barredoras  },
    drenFondo:  { fn: (f, t, d, n) => drenFondo(f, t, d, n),  cat: drenesFondo },
    drenCanal:  { fn: (f, t, d, n) => drenCanal(f, t, d, n),  cat: drenesCanal },
  };

  const filtrosConfig = {
    filtroArena:    { fn: calcularCargaFiltroArenaManual,   cat: filtrosArena    },
    prefiltro:      { fn: calcularCargaPrefiltroManual,     cat: prefiltros      },
    filtroCartucho: { fn: calcularCargaFiltroCartuchoManual, cat: filtrosCartucho },
  };

  const iteraciones = [];
  let flujoActual = flujoInicial;
  let cargaActual = cargaInicial;

  // ── 2 iteraciones de equilibrio ──
  for (let iter = 0; iter < 2; iter++) {

    // 1. Con el CDT actual, encontrar el flujo de equilibrio en la curva
    const flujoPorBomba    = flujoActual / nBombas;
    const cargaDispInicial = cargaEnCurva(curva, flujoPorBomba);

    // Flujo de equilibrio: flujo donde la bomba entrega exactamente cargaActual/n CDT
    // (recordar: en paralelo el CDT no se divide, el flujo sí)
    const flujoPorBombaEq = flujoEnCurva(curva, cargaActual);
    if (flujoPorBombaEq == null) {
      iteraciones.push({ iter: iter + 1, error: "Punto de equilibrio fuera de curva" });
      break;
    }

    const flujoEquilibrio = parseFloat((flujoPorBombaEq * nBombas).toFixed(2));
    const cargaEquilibrio = cargaActual; // el CDT en el punto de equilibrio es el requerido

    // 2. Recalcular empotrables y filtros con el nuevo flujo
    const equiposRecalc = {};

    // Empotrables activos
    const empKeys = tieneDesbordeCanal
      ? ["retorno", "barredora", "drenFondo", "drenCanal"]
      : ["retorno", "desnatador", "barredora", "drenFondo"];

    for (const key of empKeys) {
      const est = estados[key];
      if (!est || !est.selId) continue;
      const cfg = empotrablesConfig[key];
      const rec = recalcularEmpotrable(key, est, flujoEquilibrio, datosEmpotrable, cfg.fn, cfg.cat);
      if (rec) equiposRecalc[key] = rec;
    }

    // Filtros activos
    for (const key of ["filtroArena", "prefiltro", "filtroCartucho"]) {
      const est = estados[key];
      if (!est) continue;
      const cfg = filtrosConfig[key];
      const rec = recalcularFiltro(key, est, flujoEquilibrio, cfg.fn, cfg.cat, usoGeneral);
      if (rec) equiposRecalc[key] = rec;
    }

    // 3. CDT nuevo = CDT original - Σ(cargas originales recalculadas) + Σ(cargas nuevas)
    // Esto preserva automáticamente la carga de TODOS los elementos que no se recalculan
    // (calentamiento, sanitización, UV, clorador automático, motobomba calor, etc.)
    const recalcKeys = [
      ...empKeys.filter(k => equiposRecalc[k] != null),
      ...["filtroArena", "prefiltro", "filtroCartucho"].filter(k => equiposRecalc[k] != null),
    ];

    let deltaRecalc = 0;
    for (const key of recalcKeys) {
      const cargaOriginal = parseFloat(cargasIniciales[key] ?? 0);
      const eq = equiposRecalc[key];
      const cargaNueva = parseFloat(eq.sumaFinal ?? eq.cargaTotal ?? 0);
      deltaRecalc += (cargaNueva - cargaOriginal);
    }

    const nuevaCarga = parseFloat((cargaInicial + deltaRecalc).toFixed(2));

    iteraciones.push({
      iter:           iter + 1,
      flujoEquilibrio,
      cargaEntrada:   parseFloat(cargaActual.toFixed(2)),
      cargaSalida:    nuevaCarga,
      cargaDispBomba: parseFloat((cargaEnCurva(curva, flujoEquilibrio / nBombas) ?? 0).toFixed(2)),
      equiposRecalc,
    });

    // Actualizar para siguiente iteración
    flujoActual = flujoEquilibrio;
    cargaActual = nuevaCarga;
  }

  // Punto de equilibrio final
  const ultima = iteraciones[iteraciones.length - 1];
  const cargaDispFinal = ultima
    ? cargaEnCurva(curva, ultima.flujoEquilibrio / nBombas)
    : null;

  return {
    iteraciones,
    equilibrio: {
      flujo:           ultima?.flujoEquilibrio ?? flujoInicial,
      carga:           ultima?.cargaSalida     ?? cargaInicial,
      cargaDisponible: cargaDispFinal != null ? parseFloat(cargaDispFinal.toFixed(2)) : null,
      cubre:           cargaDispFinal != null ? cargaDispFinal >= (ultima?.cargaSalida ?? cargaInicial) : false,
      equipos:         ultima?.equiposRecalc  ?? {},
    },
    cargasIniciales,  // para mostrar todos los elementos en la UI
    bomba:   bomba,
    nBombas,
  };
}