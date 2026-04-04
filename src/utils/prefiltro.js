import { prefiltros } from "../data/prefiltros";

/* ================================================================
   TABLAS HAZEN-WILLIAMS
   ================================================================ */
const DIAMETROS = {
  "tuberia 1.50":  1.61,
  "tuberia 2.00":  2.07,
  "tuberia 2.50":  2.47,
  "tuberia 3.00":  3.07,
  "tuberia 4.00":  4.03,
  "tuberia 6.00":  6.07,
  "tuberia 8.00":  7.98,
  "tuberia 10.00": 9.98,
  "tuberia 12.00": 11.89,
  "tuberia 14.00": 13.13,
  "tuberia 16.00": 14.94,
  "tuberia 18.00": 16.81,
};

const CODO = {
  "tuberia 1.50":  7.40,
  "tuberia 2.00":  8.50,
  "tuberia 2.50":  9.30,
  "tuberia 3.00":  11.0,
  "tuberia 4.00":  5.90,
  "tuberia 6.00":  8.90,
  "tuberia 8.00":  12.0,
  "tuberia 10.00": 14.0,
  "tuberia 12.00": 17.0,
  "tuberia 14.00": 17.0,
  "tuberia 16.00": 17.0,
  "tuberia 18.00": 17.0,
};

const TEE_LINEA = {
  "tuberia 1.50":  5.60,
  "tuberia 2.00":  7.70,
  "tuberia 2.50":  9.30,
  "tuberia 3.00":  12.0,
  "tuberia 4.00":  2.80,
  "tuberia 6.00":  3.80,
  "tuberia 8.00":  4.70,
  "tuberia 10.00": 5.20,
  "tuberia 12.00": 6.00,
  "tuberia 14.00": 6.00,
  "tuberia 16.00": 6.00,
  "tuberia 18.00": 6.00,
};

const REDUCCION = {
  "tuberia 1.50":  10.0,
  "tuberia 2.00":  12.0,
  "tuberia 2.50":  12.0,
  "tuberia 3.00":  15.0,
  "tuberia 4.00":  20.0,
  "tuberia 6.00":  25.0,
  "tuberia 8.00":  30.0,
  "tuberia 10.00": 35.0,
  "tuberia 12.00": 40.0,
  "tuberia 14.00": 45.0,
  "tuberia 16.00": 50.0,
  "tuberia 18.00": 55.0,
};

const fix2 = (v) => (parseFloat(v) || 0).toFixed(2);

function seleccionarDiametro(flujoGPM) {
  let mejorTub    = null;
  let mejorVel    = -Infinity;
  let fallbackTub = null;
  let fallbackVel = Infinity;

  for (const tub in DIAMETROS) {
    const d   = DIAMETROS[tub];
    const vel = flujoGPM * 0.408498 / (d * d);
    if (vel < fallbackVel) { fallbackVel = vel; fallbackTub = tub; }
    if (vel <= 6.5 && vel > mejorVel) { mejorVel = vel; mejorTub = tub; }
  }

  const tuberia   = mejorTub ?? fallbackTub;
  const d         = DIAMETROS[tuberia];
  const velocidad = flujoGPM * 0.408498 / (d * d);
  const cargaBase =
    10.536 * 100 * Math.pow(flujoGPM, 1.852) /
    (Math.pow(d, 4.8655) * Math.pow(150, 1.852));

  return { tuberia, velocidad, cargaBase };
}

function cargaTramo(longMetros, cargaBase) {
  return (longMetros * 3.28084 * cargaBase) / 100;
}

/* ================================================================
   HIDRÁULICA — idéntica a filtroArena
   1 m por tramo, 6.5 ft/s máx, 7 ft carga fija
   ================================================================ */
function calcularHidraulicaPrefiltro({ flujoPorPrefiltro, cantidad }) {
  const LONG_TRAMO_M  = 1.0;
  const CARGA_FIJA_FT = 7;

  const tablaTramos          = [];
  let   cargaAcumuladaTramos = 0;
  const resumen              = {};
  const addDiam = (d) => {
    if (!resumen[d]) resumen[d] = { tuberia_m: 0, tees: 0, codos: 0, reducciones: 0 };
  };

  let tubAnterior = null;

  if (cantidad === 1) {
    const { tuberia, velocidad, cargaBase } = seleccionarDiametro(flujoPorPrefiltro);
    const longEqCodo     = CODO[tuberia] ?? CODO["tuberia 18.00"];
    const cargaTramoCL   = cargaTramo(LONG_TRAMO_M, cargaBase);
    const cargaCodos     = (2 * longEqCodo * cargaBase) / 100;
    const cargaFilaTotal = cargaTramoCL + cargaCodos;

    cargaAcumuladaTramos += cargaFilaTotal;
    tablaTramos.push({
      tramo: 1, flujo: fix2(flujoPorPrefiltro), tuberia,
      velocidad: fix2(velocidad), longitud_m: fix2(LONG_TRAMO_M),
      cargaBase: fix2(cargaBase), cargaTramo: fix2(cargaTramoCL),
      cantTees: 0, longEqTee: "0.00", cargaTees: "0.00",
      cantCodos: 2, longEqCodo: fix2(longEqCodo), cargaCodos: fix2(cargaCodos),
      cantRed: 0, longEqRed: "0.00", cargaRed: "0.00",
      cargaTotal: fix2(cargaFilaTotal),
    });
    addDiam(tuberia);
    resumen[tuberia].tuberia_m += LONG_TRAMO_M;
    resumen[tuberia].codos     += 2;
    tubAnterior = tuberia;

  } else {
    for (let i = 0; i < cantidad; i++) {
      const flujoActual = (cantidad - i) * flujoPorPrefiltro;
      const esUltimo    = i === cantidad - 1;
      const { tuberia, velocidad, cargaBase } = seleccionarDiametro(flujoActual);

      const cargaTramoCL = cargaTramo(LONG_TRAMO_M, cargaBase);
      const cantTees     = esUltimo ? 0 : 2;
      const cantCodos    = esUltimo ? 2 : 0;

      const longEqTee  = TEE_LINEA[tuberia] ?? TEE_LINEA["tuberia 18.00"];
      const longEqCodo = CODO[tuberia]      ?? CODO["tuberia 18.00"];

      const cargaTees  = (cantTees  * longEqTee  * cargaBase) / 100;
      const cargaCodos = (cantCodos * longEqCodo * cargaBase) / 100;

      let cargaRed = 0, longEqRed = 0, cantRed = 0;
      if (tubAnterior && tubAnterior !== tuberia) {
        longEqRed = REDUCCION[tuberia] ?? REDUCCION["tuberia 18.00"];
        cargaRed  = (longEqRed * cargaBase) / 100;
        cantRed   = 1;
      }

      const cargaFilaTotal = cargaTramoCL + cargaTees + cargaCodos + cargaRed;
      cargaAcumuladaTramos += cargaFilaTotal;

      tablaTramos.push({
        tramo: i + 1, flujo: fix2(flujoActual), tuberia,
        velocidad: fix2(velocidad), longitud_m: fix2(LONG_TRAMO_M),
        cargaBase: fix2(cargaBase), cargaTramo: fix2(cargaTramoCL),
        cantTees,  longEqTee:  fix2(cantTees  > 0 ? longEqTee  : 0), cargaTees:  fix2(cargaTees),
        cantCodos, longEqCodo: fix2(cantCodos > 0 ? longEqCodo : 0), cargaCodos: fix2(cargaCodos),
        cantRed,   longEqRed:  fix2(longEqRed), cargaRed: fix2(cargaRed),
        cargaTotal: fix2(cargaFilaTotal),
      });

      addDiam(tuberia);
      resumen[tuberia].tuberia_m   += LONG_TRAMO_M;
      resumen[tuberia].tees        += cantTees;
      resumen[tuberia].codos       += cantCodos;
      resumen[tuberia].reducciones += cantRed;
      tubAnterior = tuberia;
    }
  }

  const cargaTotal    = cargaAcumuladaTramos + CARGA_FIJA_FT;
  const cargaTotalPSI = cargaTotal * 0.43353;

  const resumenMateriales = Object.entries(resumen).map(([diam, vals]) => ({
    tuberia:     diam,
    tuberia_m:   fix2(vals.tuberia_m),
    tees:        vals.tees,
    codos:       vals.codos,
    reducciones: vals.reducciones,
  }));

  return {
    tablaTramos,
    cargaFija_ft:  CARGA_FIJA_FT,
    cargaTramos:   fix2(cargaAcumuladaTramos),
    cargaTotal:    fix2(cargaTotal),
    cargaTotalPSI: fix2(cargaTotalPSI),
    resumenMateriales,
  };
}

function seleccionarPrefiltro(flujoMaximo) {
  const catalogo = prefiltros.filter(p => p.metadata.activo);
  let mejor = null;

  for (const p of catalogo) {
    if (p.specs.maxFlow <= 0) continue;
    const cantidad   = Math.ceil(flujoMaximo / p.specs.maxFlow);
    const flujoTotal = cantidad * p.specs.maxFlow;
    const exceso     = flujoTotal - flujoMaximo;

    if (!mejor) { mejor = { prefiltro: p, cantidad, flujoTotal, exceso }; continue; }

    if (cantidad < mejor.cantidad) {
      mejor = { prefiltro: p, cantidad, flujoTotal, exceso };
    } else if (cantidad === mejor.cantidad) {
      if (exceso < mejor.exceso) {
        mejor = { prefiltro: p, cantidad, flujoTotal, exceso };
      } else if (exceso === mejor.exceso && p.specs.maxFlow < mejor.prefiltro.specs.maxFlow) {
        mejor = { prefiltro: p, cantidad, flujoTotal, exceso };
      }
    }
  }
  return mejor;
}

/* ================================================================
   FUNCIÓN PRINCIPAL
   ================================================================ */
export function prefiltro(flujoMaximo) {
  if (!flujoMaximo || flujoMaximo <= 0) {
    return { error: "Flujo máximo inválido o no disponible." };
  }

  const seleccion = seleccionarPrefiltro(flujoMaximo);
  if (!seleccion) return { error: "Catálogo de prefiltros vacío o sin equipos activos." };

  const { prefiltro: p, cantidad } = seleccion;
  const flujoPorPrefiltro = p.specs.maxFlow;

  const hidraulica = calcularHidraulicaPrefiltro({ flujoPorPrefiltro, cantidad });

  return {
    seleccion: {
      marca:            p.marca,
      modelo:           p.modelo,
      cantidad,
      flujoPorPrefiltro: fix2(flujoPorPrefiltro),
      flujoTotal:        fix2(cantidad * flujoPorPrefiltro),
      exceso:            fix2(seleccion.exceso),
      diameter:          p.specs.diameter,
    },
    ...hidraulica,
  };
}

/* ================================================================
   FUNCIÓN MANUAL
   ================================================================ */
export function calcularCargaPrefiltroManual(flujoPorPrefiltro, cantidad) {
  if (!flujoPorPrefiltro || flujoPorPrefiltro <= 0 || !cantidad || cantidad <= 0) {
    return { error: "Flujo o cantidad inválidos para cálculo manual." };
  }
  return calcularHidraulicaPrefiltro({ flujoPorPrefiltro, cantidad });
}