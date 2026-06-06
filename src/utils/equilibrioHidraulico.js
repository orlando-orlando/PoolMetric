import { motobombas1v }                   from "../data/motobombas1v";
import { generadoresUV }                  from "../data/generadoresUV";
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
import { getVelocidadMaxima, setVelocidadMaxima } from "./limiteVelocidad";

const FLUJO_MAX_CLORADOR_EN_LINEA = 90; // GPM

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
// Fuera del rango publicado — extrapolar con pendiente real de los últimos puntos
  // pero limitar a que no supere el shut-off ni baje de cero.
  // Margen permitido: 15% más allá del último punto publicado.
  const ult     = curva[curva.length - 1];
  const pen     = curva[curva.length - 2];
  const shutOff = curva[0].carga_ft;
  const margen  = ult.flujo_gpm * 0.15;

  if (flujo_gpm > ult.flujo_gpm + margen) return 0;

  const dQ   = ult.flujo_gpm - pen.flujo_gpm;
  if (dQ === 0) return 0;
  const pend = (ult.carga_ft - pen.carga_ft) / dQ;
  const extrapolado = ult.carga_ft + pend * (flujo_gpm - ult.flujo_gpm);
  return Math.min(shutOff, Math.max(0, extrapolado));
}

const TAMANO_A_TIPO = { "9x9": "9.0", "12x12": "12.0", "18x18": "18.0" };
function normTipo(raw) {
  return TAMANO_A_TIPO[String(raw)] ?? String(raw);
}

function recalcularEmpotrable(key, estadoOrig, flujoNuevo, datosEmpotrable, fnCalculo, catalogo) {
  if (!estadoOrig?.selId || !flujoNuevo || !datosEmpotrable) return null;
  let estado = { ...estadoOrig };
  let eq = catalogo.find(e => e.id === estado.selId);
  if (!eq) return null;

  // Tolerancia del 1% — si el flujo nuevo no supera la capacidad instalada + 1%, no recalcular
  const flujoEfEmp = eq.specs.flujo ?? eq.specs.maxFlow ?? 0;
  const capacidadInstaladaEmp = flujoEfEmp * (estadoOrig.cantidad ?? 1);
  const toleranciaEmp = capacidadInstaladaEmp * 0.01;
  if (flujoNuevo <= capacidadInstaladaEmp + toleranciaEmp) {
    // Recalcular la carga aunque no cambie la cantidad
    try {
      const tipo = estado.tipo ?? normTipo(eq.specs.tamano ?? eq.specs.dimensionPuerto ?? "");
      const res = fnCalculo(flujoNuevo, tipo, datosEmpotrable, estadoOrig.cantidad ?? 1);
      const sumaConAccesorio = res?.sumaFinal != null ? parseFloat(res.sumaFinal) + 1.5 : null;
      if (sumaConAccesorio != null) {
        return {
          cantidad: estadoOrig.cantidad ?? 1, cantOriginal: estadoOrig.cantidad ?? 1,
          cambio: false,
          sumaFinal: sumaConAccesorio,
          modelo: eq.modelo, marca: eq.marca,
          spec: eq.specs?.tamano ?? eq.specs?.dimensionPuerto ?? null,
          resultadoHidraulico: res,
        };
      }
    } catch { /* si falla, retornar null */ }
    return null;
  }

  let cantMinNueva;
  if (key === "barredora") {
    cantMinNueva = estado.cantidad ?? 1;
  } else if (key === "desnatador") {
    const area        = parseFloat(datosEmpotrable?.area) || 0;
    const flujoPorEq  = eq.specs.flujo ?? eq.specs.maxFlow ?? 0;
    const numPorArea  = area > 0 ? Math.ceil(area / 40) : 1;
    const numPorFlujo = flujoPorEq > 0 ? Math.max(1, Math.ceil(flujoNuevo / flujoPorEq)) : 1;
    cantMinNueva = Math.max(numPorArea, numPorFlujo, 1);
  } else if (key === "drenFondo") {
    const flujoPorEq = eq.specs.flujo ?? eq.specs.maxFlow ?? 0;
    let num = flujoPorEq > 0 ? Math.ceil((flujoNuevo * 2) / flujoPorEq) : estado.cantidad;
    if (num % 2 !== 0) num++;
    cantMinNueva = Math.max(2, num);

// Si la cantidad supera 8, iterar subiendo de capacidad hasta que quede <= 8
    if (cantMinNueva > 8) {
      let flujoEqActual = flujoPorEq;
      let eqActual = eq;
      let cantActual = cantMinNueva;
      let iteraciones = 0;
      const MAX_ITER = 10;

// Construir lista ordenada de drenes de mayor capacidad que el actual
      const drenesMayores = catalogo
        .filter(c => c.metadata?.activo !== false &&
          (c.specs.flujo ?? c.specs.maxFlow ?? 0) > flujoPorEq &&
          c.id !== eq.id)
        .sort((a, b) => (a.specs.flujo ?? a.specs.maxFlow ?? 0) - (b.specs.flujo ?? b.specs.maxFlow ?? 0));

      for (const candidato of drenesMayores) {
        const flujoCand = candidato.specs.flujo ?? candidato.specs.maxFlow ?? 0;
        let numCand = flujoCand > 0 ? Math.ceil((flujoNuevo * 2) / flujoCand) : cantMinNueva;
        if (numCand % 2 !== 0) numCand++;
        numCand = Math.max(2, numCand);
        // Tomar este candidato si mejora la cantidad
        if (numCand < cantMinNueva) {
          eqActual = candidato;
          cantActual = numCand;
          // Seguir iterando por si hay otro que mejore aún más
        }
        // Si ya llegamos a <= 8, parar
        if (cantActual <= 8) break;
      }

      if (cantActual < cantMinNueva) {
        estado = { ...estado, selId: eqActual.id, tipo: normTipo(eqActual.specs.tamano ?? eqActual.specs.dimensionPuerto ?? "") };
        eq = eqActual;
        cantMinNueva = cantActual;
      }

      if (cantActual < cantMinNueva) {
        estado = { ...estado, selId: eqActual.id, tipo: normTipo(eqActual.specs.tamano ?? eqActual.specs.dimensionPuerto ?? "") };
        eq = eqActual;
        cantMinNueva = cantActual;
      }
    }
  } else if (key === "drenCanal") {
    const flujoPorEq = eq.specs.flujo ?? eq.specs.maxFlow ?? 0;
    let num = flujoPorEq > 0 ? Math.ceil(flujoNuevo / flujoPorEq) : estado.cantidad;
    cantMinNueva = Math.max(1, num);
  } else {
      const flujoPorEq = eq.specs.flujo ?? eq.specs.maxFlow ?? 0;
      cantMinNueva = flujoPorEq > 0 ? Math.max(1, Math.ceil(flujoNuevo / flujoPorEq)) : estado.cantidad;

      // Retornos: si supera 25 unidades, subir al siguiente puerto (1.5" → 2")
      if (key === "retorno" && cantMinNueva > CANT_MAX_RETORNOS) {
        const siguientes = catalogo
          .filter(c => c.metadata?.activo !== false &&
            (c.specs.flujo ?? c.specs.maxFlow ?? 0) > flujoPorEq &&
            (c.specs.dimensionPuerto ?? 0) > (eq.specs.dimensionPuerto ?? 0))
          .sort((a, b) => (a.specs.dimensionPuerto ?? 0) - (b.specs.dimensionPuerto ?? 0));
        if (siguientes.length > 0) {
          const sig = siguientes[0];
          const flujoSig = sig.specs.flujo ?? sig.specs.maxFlow ?? 0;
          const numSig = flujoSig > 0 ? Math.max(1, Math.ceil(flujoNuevo / flujoSig)) : cantMinNueva;
          if (numSig < cantMinNueva) {
            estado = { ...estado, selId: sig.id };
            eq = sig;
            cantMinNueva = numSig;
          }
        }
      }
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
      spec: eq.specs?.tamano ?? eq.specs?.dimensionPuerto ?? null,
      resultadoHidraulico: res,
    };
  } catch { return null; }
}

const FLUJO_UMBRAL_MULTIPLICAR = 62;
const CANT_MAX_FILTROS = 3;
const CANT_MAX_PREFILTROS = 3;
const CANT_MAX_RETORNOS = 25;

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

  // Tolerancia del 1% — si el flujo nuevo no supera la capacidad instalada + 1%, no recalcular
  const capacidadInstaladaFilt = flujoEf * cantOriginal;
  const toleranciaFilt = capacidadInstaladaFilt * 0.01;
  if (flujoNuevo <= capacidadInstaladaFilt + toleranciaFilt) {
    // Aunque no cambia la cantidad, recalcular la carga con el flujo nuevo
    try {
      const res = fnManual(flujoEf, cantOriginal, flujoNuevo);
      if (res && !res.error) {
        return {
          cantidad: cantOriginal, cantOriginal,
          cambio: false,
          cargaTotal: res?.cargaTotal ?? null,
          cargaTotalPSI: res?.cargaTotalPSI ?? null,
          modelo, marca,
          resultadoHidraulico: res,
        };
      }
    } catch { /* si falla, retornar null como antes */ }
    return null;
  }

  // Modo manual — respetar cantidad elegida por el usuario
  // Solo buscar equipo de mayor capacidad, no subir cantidad
  const esModoManual = estado?.modo === "manual";
  const cantMaxPermitida = esModoManual ? cantOriginal : CANT_MAX_FILTROS;

  const catalActivos = catalogo
      .filter(c => c.metadata?.activo !== false && c.marca === marca)
      .map(c => ({ c, cap: c.specs?.maxFlow ?? c.specs?.flujoComercial ?? 0 }))
      .sort((a, b) => a.cap - b.cap);

    // Busca el equipo de menor capacidad suficiente respetando jerarquía:
    // 1. Mismo modelo (siguiente tamaño) 2. Misma marca 3. Cualquier marca
    const buscarMayorCapacidad = (flujoReq) => {
      const mismoModelo = catalActivos.filter(({ c, cap }) =>
        cap >= flujoReq && c.modelo === modelo && c.marca === marca);
      if (mismoModelo.length > 0) return mismoModelo[0];

      const mismaMarca = catalActivos.filter(({ c, cap }) =>
        cap >= flujoReq && c.marca === marca);
      if (mismaMarca.length > 0) return mismaMarca[0];

      const candidatos = catalActivos.filter(({ cap }) => cap >= flujoReq);
      return candidatos.length > 0 ? candidatos[0] : null;
    };

  let cantFinal    = cantOriginal;
  let flujoEfFinal = flujoEf;
  let modeloFinal  = modelo;
  let marcaFinal   = marca;

  const flujoTotalActual = flujoEf * cantOriginal;
  const UMBRAL_FILTRO_UNICO = 70; // GPM
  const cantMaxPorCapacidad = flujoEf < UMBRAL_FILTRO_UNICO ? 1 : CANT_MAX_FILTROS;
  const cantMax = esModoManual ? cantOriginal : (key === "prefiltro" ? CANT_MAX_PREFILTROS : cantMaxPorCapacidad);

if (flujoTotalActual >= flujoNuevo) {
    cantFinal = cantOriginal;
  } else {
    // Escalar: intentar 1,2,...cantMax del modelo actual,
    // luego subir al siguiente modelo y repetir
    const modelosDisponibles = catalActivos.filter(({ cap }) => cap >= flujoEf);
    let resuelto = false;

for (const { c: modeloCand, cap: capCand } of modelosDisponibles) {
      const cantMaxCand = esModoManual ? cantOriginal : (capCand < UMBRAL_FILTRO_UNICO ? 1 : CANT_MAX_FILTROS);
      for (let cant = 1; cant <= cantMaxCand; cant++) {
        if (capCand * cant >= flujoNuevo) {
          flujoEfFinal = capCand;
          modeloFinal  = modeloCand.modelo;
          marcaFinal   = modeloCand.marca;
          cantFinal    = cant;
          resuelto     = true;
          break;
        }
      }
      if (resuelto) break;
    }

    if (!resuelto) {
      const mayorDisponible = catalActivos[catalActivos.length - 1];
      if (mayorDisponible && mayorDisponible.cap > 0) {
        flujoEfFinal = mayorDisponible.cap;
        modeloFinal  = mayorDisponible.c.modelo;
        marcaFinal   = mayorDisponible.c.marca;
        cantFinal    = Math.ceil(flujoNuevo / mayorDisponible.cap);
      } else {
        cantFinal = cantMax;
      }
    }
  }

  try {
    const res = fnManual(flujoEfFinal, cantFinal, flujoNuevo);
    const eqEnCatalog = catalActivos.find(e => e.c.modelo === modeloFinal && e.c.marca === marcaFinal);
    const diameter = eqEnCatalog?.c?.specs?.diameter ?? eqEnCatalog?.c?.diameter ?? null;
    const filtrationArea = eqEnCatalog?.c?.specs?.filtrationArea ?? null;
    return {
      cantidad: cantFinal, cantOriginal,
      cambio: cantFinal !== cantOriginal || flujoEfFinal !== flujoEf,
      cargaTotal: res?.cargaTotal ?? null,
      cargaTotalPSI: res?.cargaTotalPSI ?? null,
      modelo: modeloFinal, marca: marcaFinal,
      diameter, filtrationArea,
      resultadoHidraulico: res,
    };
  } catch { return null; }
}

/* ─────────────────────────────────────────────────────────────
   recalcularUV — FIX
   - Si el equipo actual cubre el flujoNuevo → sin cambio
   - Si no cubre → buscar el más pequeño del catálogo que sí cubra
     con 1 sola unidad
   - Si ninguno individual cubre → usar el más grande y
     calcular cuántas unidades se necesitan
───────────────────────────────────────────────────────────── */
function recalcularUV(estado, flujoNuevo) {
  if (!estado?.selId || !flujoNuevo) return null;

  const eqActual = generadoresUV.find(g => g.id === estado.selId);
  if (!eqActual) return null;

  const cantOriginal    = estado.cantidad ?? 1;
  const capacidadActual = eqActual.specs.flujo;

  // Tolerancia del 1% — si el flujo nuevo no supera la capacidad instalada + 1%, no recalcular
  const capacidadInstaladaUV = capacidadActual * cantOriginal;
  const toleranciaUV = capacidadInstaladaUV * 0.01;
  if (flujoNuevo <= capacidadInstaladaUV + toleranciaUV) {
    try {
      const res = calcularCargaUVManual(eqActual.specs.flujo, cantOriginal, flujoNuevo);
      if (res && !res.error) {
        return {
          cantidad: cantOriginal, cantOriginal,
          cambio: false,
          marca: eqActual.marca, modelo: eqActual.modelo, selId: eqActual.id,
          flujoEquipo: eqActual.specs?.flujo ?? null,
          cargaTotal: res.cargaTotal,
          sumaFinal: res.cargaTotal,
          resultadoHidraulico: res,
        };
      }
    } catch { /* si falla, retornar null */ }
    return null;
  }

  // Catálogo activo ordenado de menor a mayor capacidad
  const catalActivos = generadoresUV
    .filter(g => g.metadata?.activo !== false)
    .sort((a, b) => a.specs.flujo - b.specs.flujo);

  let eqFinal    = eqActual;
  let cantFinal  = cantOriginal;
  let hubo_cambio = false;

    if (capacidadActual >= flujoNuevo) {
      // El equipo actual cubre, pero verificar si hay uno más pequeño que también cubra
      const equipoMinimo = catalActivos.find(g => g.specs.flujo >= flujoNuevo);
      if (equipoMinimo && equipoMinimo.id !== eqActual.id && equipoMinimo.specs.flujo < capacidadActual) {
        // Hay un equipo más pequeño que también cubre — usar ese
        eqFinal    = equipoMinimo;
        cantFinal  = 1;
        hubo_cambio = true;
      } else {
        eqFinal   = eqActual;
        cantFinal = cantOriginal;
      }
    } else {
    // Buscar el más pequeño que cubra el flujo con 1 unidad
    const equipoMayor = catalActivos.find(g => g.specs.flujo >= flujoNuevo);
    if (equipoMayor) {
      eqFinal   = equipoMayor;
      cantFinal = 1;
    } else {
      // Ninguno individual cubre — usar el más grande y calcular cantidad
      const elMasGrande = catalActivos[catalActivos.length - 1];
      eqFinal   = elMasGrande;
      cantFinal = Math.ceil(flujoNuevo / elMasGrande.specs.flujo);
    }
    hubo_cambio = eqFinal.id !== eqActual.id || cantFinal !== cantOriginal;
  }

  try {
    const res = calcularCargaUVManual(eqFinal.specs.flujo, cantFinal, flujoNuevo);
    if (!res || res.error) return null;
    return {
      cantidad:    cantFinal,
      cantOriginal,
      cambio:      hubo_cambio,
      marca:       eqFinal.marca,
      modelo:      eqFinal.modelo,
      selId:       eqFinal.id,
      flujoEquipo: eqFinal.specs?.flujo ?? null,
      cargaTotal:  res.cargaTotal,
      sumaFinal:   res.cargaTotal,
      resultadoHidraulico: res,
    };
  } catch { return null; }
}

export function calcularEquilibrio({
  bombaId, nBombas, flujoInicial, cargaInicial,
  estados, cargasIniciales, datosEmpotrable,
  tieneDesbordeCanal, usoGeneral,
  excluirCloradorAutomatico = false, // true cuando instalación en línea y flujo > 90 GPM
}) {
  const bomba = motobombas1v.find(b => b.id === bombaId);
  if (!bomba) return { error: "Motobomba no encontrada." };
  const curva = bomba.curva;
  if (!curva || curva.length < 2) return { error: "La motobomba no tiene curva de rendimiento definida." };
  if (!flujoInicial || flujoInicial <= 0 || !cargaInicial || cargaInicial <= 0)
    return { error: "Flujo o carga de diseno no validos." };

  const cargaMaxBomba = curva[0].carga_ft;
  if (cargaInicial > cargaMaxBomba)
    return { error: `La motobomba no alcanza la CDT de diseno (${cargaInicial.toFixed(2)} ft > ${cargaMaxBomba} ft shut-off).` };

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

  // Cargas de referencia al flujo de diseño
  // SIEMPRE a velocidad recomendada (igual que cargaInicial), para que la resta
  // de la base sea coherente. El toggle de velocidad máxima solo afecta cargaRecalc.
  function calcularCargasRef(flujoRef) {
    const velMaxPrevio = getVelocidadMaxima();
    setVelocidadMaxima(false);
    try {
    const ref = { ...cargasIniciales };
    // Excluir clorador en línea de la referencia base
    if (excluirCloradorAutomatico) ref.cloradorAutomatico = 0;

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
  // Usar carga manual del clorador salino si existe
      if (estados?.cloradorSalino?.cargaTotal != null) {
        ref["cloradorSalino"] = parseFloat(estados.cloradorSalino.cargaTotal);
      }
      return ref;
    } finally {
      setVelocidadMaxima(velMaxPrevio);
    }
  }

function calcularCDTSistema(flujoNuevo, cargasRef) {
  const equiposRecalc = {};

  // Excluir clorador en línea si ya fue marcado desde el diseño
  // O si el flujo de esta iteración supera 90 GPM (la bomba arrastra el sistema más allá del límite)
  const excluirCADinamico = excluirCloradorAutomatico ||
    (estados?.cloradorAutomatico?.instalacion === "enLinea" &&
     flujoNuevo > FLUJO_MAX_CLORADOR_EN_LINEA);

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
    const rec = recalcularUV(estados.lamparaUV, flujoNuevo);
    if (rec) equiposRecalc.lamparaUV = rec;
  }

  const keysRecalc = [
    ...empKeys.filter(k => equiposRecalc[k] != null),
    ...["filtroArena", "prefiltro", "filtroCartucho", "lamparaUV"].filter(k => equiposRecalc[k] != null),
  ];

  const succKeys = tieneDesbordeCanal
    ? ["drenCanal", "drenFondo"]
    : ["desnatador", "drenFondo"];

  // Gobierna en el RECÁLCULO (iteración): usa las cargas recalculadas
  const succVals = succKeys
    .filter(k => equiposRecalc[k] != null)
    .map(k => ({ k, carga: parseFloat(equiposRecalc[k].sumaFinal ?? equiposRecalc[k].cargaTotal ?? 0) }));
  const succGobierna = succVals.length > 0
    ? succVals.reduce((a, b) => b.carga > a.carga ? b : a).k
    : null;
  // Gobierna en la BASE (diseño): usa las cargas de referencia originales
  const succValsRef = succKeys
    .filter(k => cargasRef[k] != null)
    .map(k => ({ k, carga: parseFloat(cargasRef[k] ?? 0) }));
  const succGobiernaRef = succValsRef.length > 0
    ? succValsRef.reduce((a, b) => b.carga > a.carga ? b : a).k
    : null;

  let cargaBaseAjustada = cargaInicial;
  for (const key of keysRecalc) {
    if (key === "cloradorAutomatico" && excluirCADinamico) continue;
    if (key === "barredora") continue;
    if (succKeys.includes(key) && key !== succGobiernaRef) continue;
    cargaBaseAjustada -= parseFloat(cargasRef[key] ?? 0);
  }
  if (!keysRecalc.includes("cloradorAutomatico") && !excluirCADinamico) {
    cargaBaseAjustada -= parseFloat(cargasRef["cloradorAutomatico"] ?? 0);
  }
  const cargaCSRef    = parseFloat(cargasRef["cloradorSalino"] ?? 0);
  const cargaCSActual = parseFloat(estados?.cloradorSalino?.cargaTotal ?? cargasRef["cloradorSalino"] ?? 0);
  cargaBaseAjustada -= cargaCSRef;
  cargaBaseAjustada += cargaCSActual;

  let cargaRecalc = 0;
  for (const key of keysRecalc) {
    if (key === "cloradorAutomatico" && excluirCADinamico) continue;
    if (key === "barredora") continue;
    if (succKeys.includes(key) && key !== succGobierna) continue;
    const eq = equiposRecalc[key];
    cargaRecalc += parseFloat(eq.sumaFinal ?? eq.cargaTotal ?? 0);
  }

  if (!excluirCADinamico && !keysRecalc.includes("cloradorAutomatico")) {
    cargaRecalc += parseFloat(cargasRef["cloradorAutomatico"] ?? 0);
  }

  const cdt = Math.max(0.1, cargaBaseAjustada + cargaRecalc);

  if (excluirCADinamico) {
    equiposRecalc.cloradorAutomatico = {
      ...(equiposRecalc.cloradorAutomatico ?? {}),
      excluido: true,
      noSuma: true,
    };
  }
  return { equiposRecalc, cdt };
}

const cargasRef0 = calcularCargasRef(flujoInicial);

  const PASO = 0.5;
  const qMaxBusqueda = curva[curva.length - 1].flujo_gpm * nBombas * 1.1;
  const qMinBusqueda = Math.max(PASO, flujoInicial * 0.5);

  let flujoEq   = null;
  let cdtEq     = null;   // SIEMPRE la carga del SISTEMA en el punto de equilibrio
  let equiposEq = {};
  const pasos   = [];

  // Carga de bomba y de sistema en el flujo de diseño
  const cdtBombaInicio = cargaEnCurva(curva, flujoInicial / nBombas);
  const { cdt: cdtSistInicio } = calcularCDTSistema(flujoInicial, cargasRef0);

  // ¿El sistema ya excede a la bomba en el flujo de diseño?
  // (típico a velocidad máxima): el equilibrio está a MENOR flujo (hacia atrás),
  // porque al bajar el caudal la bomba sube su carga y el sistema baja la suya.
  const sistemaExcedeEnArranque =
    cdtSistInicio != null && cdtBombaInicio != null && cdtSistInicio > cdtBombaInicio;

  // Helper: registra el punto de equilibrio de forma coherente.
  // cdtEq = carga del SISTEMA (lo que se pide). La carga de la bomba va aparte.
  function fijarEquilibrio(qEq, cdtSistEq) {
    flujoEq = parseFloat(qEq.toFixed(2));
    cdtEq   = parseFloat(cdtSistEq.toFixed(2));
    const { equiposRecalc: eqFinal } = calcularCDTSistema(flujoEq, cargasRef0);
    equiposEq = eqFinal;
    const cdtBombaEq = cargaEnCurva(curva, flujoEq / nBombas) ?? 0;
    pasos.push({
      flujo: flujoEq,
      cdtBomba: parseFloat(cdtBombaEq.toFixed(2)),
      cdtSistema: cdtEq,
      equipos: eqFinal,
      esEquilibrio: true,
    });
  }

  let cdtBombaAnterior = null;
  let cdtSistAnterior  = null;
  let flujoAnterior    = null;

  if (sistemaExcedeEnArranque) {
    // ── Búsqueda hacia ATRÁS (menor flujo): la bomba sube, el sistema baja.
    // Cruce cuando la bomba pasa de estar por DEBAJO a estar por ENCIMA del sistema.
    for (let q = flujoInicial; q >= qMinBusqueda; q -= PASO) {
      const qRound     = parseFloat(q.toFixed(2));
      const cdtBomba_q = cargaEnCurva(curva, qRound / nBombas);
      if (cdtBomba_q == null) break;
      const { equiposRecalc, cdt: cdtSist_q } = calcularCDTSistema(qRound, cargasRef0);
      pasos.push({ flujo: qRound, cdtBomba: cdtBomba_q, cdtSistema: cdtSist_q, equipos: equiposRecalc, esEquilibrio: false });

      if (cdtBombaAnterior !== null && cdtSistAnterior !== null) {
        if (cdtBombaAnterior <= cdtSistAnterior && cdtBomba_q >= cdtSist_q) {
          const diffAnterior = cdtSistAnterior - cdtBombaAnterior;
          const diffActual   = cdtSist_q - cdtBomba_q;
          const denom = diffAnterior - diffActual;
          const t = denom !== 0 ? diffAnterior / denom : 0;
          const qInterp   = flujoAnterior + t * (qRound - flujoAnterior);
          const cdtSistInterp = cdtSistAnterior + t * (cdtSist_q - cdtSistAnterior);
          fijarEquilibrio(qInterp, cdtSistInterp);
          break;
        }
      }
      cdtBombaAnterior = cdtBomba_q;
      cdtSistAnterior  = cdtSist_q;
      flujoAnterior    = qRound;
    }
    // Sin cruce hacia atrás → equilibrio en el flujo de diseño (carga del sistema)
    if (flujoEq === null) fijarEquilibrio(flujoInicial, cdtSistInicio);
  } else {
    // ── Búsqueda hacia ADELANTE (mayor flujo): la bomba baja, el sistema sube.
    // Cruce cuando la bomba pasa de estar por ENCIMA a estar por DEBAJO del sistema.
    for (let q = flujoInicial; q <= qMaxBusqueda; q += PASO) {
      const qRound     = parseFloat(q.toFixed(2));
      const cdtBomba_q = cargaEnCurva(curva, qRound / nBombas);
      if (cdtBomba_q == null) break;
      const { equiposRecalc, cdt: cdtSist_q } = calcularCDTSistema(qRound, cargasRef0);
      pasos.push({ flujo: qRound, cdtBomba: cdtBomba_q, cdtSistema: cdtSist_q, equipos: equiposRecalc, esEquilibrio: false });

      if (cdtBombaAnterior !== null && cdtSistAnterior !== null) {
        if (cdtBombaAnterior >= cdtSistAnterior && cdtBomba_q <= cdtSist_q) {
          const diffAnterior = cdtBombaAnterior - cdtSistAnterior;
          const diffActual   = cdtBomba_q - cdtSist_q;
          const denom = diffAnterior - diffActual;
          const t = denom !== 0 ? diffAnterior / denom : 0;
          const qInterp   = flujoAnterior + t * (qRound - flujoAnterior);
          const cdtSistInterp = cdtSistAnterior + t * (cdtSist_q - cdtSistAnterior);
          fijarEquilibrio(qInterp, cdtSistInterp);
          break;
        }
      }
      cdtBombaAnterior = cdtBomba_q;
      cdtSistAnterior  = cdtSist_q;
      flujoAnterior    = qRound;
    }
    // Sin cruce hacia adelante → último punto iterado (carga del sistema)
    if (flujoEq === null) {
      const ultimo = pasos[pasos.length - 1];
      const qUlt   = ultimo?.flujo ?? flujoInicial;
      const cdtUlt = ultimo?.cdtSistema ?? cargaInicial;
      fijarEquilibrio(qUlt, cdtUlt);
    }
  }

  // ── Fase 2 — verificación con equipos reajustados.
  // Solo aplica en la búsqueda hacia adelante (caso normal). En la búsqueda
  // hacia atrás el equilibrio ya es directo y no necesita segunda iteración.
  let flujoEq2   = flujoEq;
  let cdtEq2     = cdtEq;
  let equiposEq2 = equiposEq;
  const pasosIter2 = [];
  let cdtBombaAnt2 = null, cdtSistAnt2 = null, flujoAnt2 = null;
  let encontradoIter2 = false;
  const MAX_PASOS_ITER2 = 20;
  let contPasosIter2 = 0;

  if (!sistemaExcedeEnArranque) {
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
          const denom = diffAnt - diffAct;
          const t = denom !== 0 ? diffAnt / denom : 0;
          flujoEq2 = parseFloat((flujoAnt2 + t * (qRound - flujoAnt2)).toFixed(2));
          cdtEq2   = parseFloat((cdtSistAnt2 + t * (cdtSist_q - cdtSistAnt2)).toFixed(2));
          const { equiposRecalc: eqFinal2 } = calcularCDTSistema(flujoEq2, cargasRef0);
          equiposEq2 = eqFinal2;
          pasosIter2.push({ flujo: flujoEq2, cdtBomba: parseFloat((cargaEnCurva(curva, flujoEq2 / nBombas) ?? 0).toFixed(2)), cdtSistema: cdtEq2, equipos: eqFinal2, esEquilibrio: true });
          encontradoIter2 = true;
          break;
        }
      }

      if (contPasosIter2 === 1 && cdtBomba_q < cdtSist_q) {
        pasosIter2.push({ flujo: flujoEq, cdtBomba: parseFloat((cargaEnCurva(curva, flujoEq / nBombas) ?? 0).toFixed(2)), cdtSistema: cdtEq, equipos: equiposEq, esEquilibrio: true });
        encontradoIter2 = true;
        break;
      }

      if (contPasosIter2 >= MAX_PASOS_ITER2) break;
      cdtBombaAnt2 = cdtBomba_q;
      cdtSistAnt2  = cdtSist_q;
      flujoAnt2    = qRound;
    }

    if (!encontradoIter2) {
      pasosIter2.push({ flujo: flujoEq, cdtBomba: parseFloat((cargaEnCurva(curva, flujoEq / nBombas) ?? 0).toFixed(2)), cdtSistema: cdtEq, equipos: equiposEq, esEquilibrio: true });
    }

    pasos.push({ separador: true, label: "── Iteración 2 ──" });
    pasos.push(...pasosIter2);
  }

  const cargaDispFinal = parseFloat((cargaEnCurva(curva, flujoEq2 / nBombas) ?? 0).toFixed(2));

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

  // Propagar excluido al resultado final si aplica
  if (excluirCloradorAutomatico) {
    equiposEq2.cloradorAutomatico = {
      ...(equiposEq2.cloradorAutomatico ?? {}),
      excluido: true,
      noSuma: true,
    };
  }

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