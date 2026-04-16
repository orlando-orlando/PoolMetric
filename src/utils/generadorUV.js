import { generadoresUV } from "../data/generadoresUV";

const DIAMETROS = {
  "tuberia 1.50":  1.61, "tuberia 2.00":  2.07, "tuberia 2.50":  2.47,
  "tuberia 3.00":  3.07, "tuberia 4.00":  4.03, "tuberia 6.00":  6.07,
  "tuberia 8.00":  7.98, "tuberia 10.00": 9.98, "tuberia 12.00": 11.89,
  "tuberia 14.00": 13.13,"tuberia 16.00": 14.94,"tuberia 18.00": 16.81,
};
const CODO = {
  "tuberia 1.50":  7.40, "tuberia 2.00":  8.50, "tuberia 2.50":  9.30,
  "tuberia 3.00":  11.0, "tuberia 4.00":  5.90, "tuberia 6.00":  8.90,
  "tuberia 8.00":  12.0, "tuberia 10.00": 14.0, "tuberia 12.00": 17.0,
  "tuberia 14.00": 17.0, "tuberia 16.00": 17.0, "tuberia 18.00": 17.0,
};
const TEE_LINEA = {
  "tuberia 1.50":  5.60, "tuberia 2.00":  7.70, "tuberia 2.50":  9.30,
  "tuberia 3.00":  12.0, "tuberia 4.00":  2.80, "tuberia 6.00":  3.80,
  "tuberia 8.00":  4.70, "tuberia 10.00": 5.20, "tuberia 12.00": 6.00,
  "tuberia 14.00": 6.00, "tuberia 16.00": 6.00, "tuberia 18.00": 6.00,
};
const REDUCCION = {
  "tuberia 1.50":  10.0, "tuberia 2.00":  12.0, "tuberia 2.50":  12.0,
  "tuberia 3.00":  15.0, "tuberia 4.00":  20.0, "tuberia 6.00":  25.0,
  "tuberia 8.00":  30.0, "tuberia 10.00": 35.0, "tuberia 12.00": 40.0,
  "tuberia 14.00": 45.0, "tuberia 16.00": 50.0, "tuberia 18.00": 55.0,
};

const _loggedUV = new Set();
export function resetUVLog() { _loggedUV.clear(); }

const fix2 = (v) => (parseFloat(v) || 0).toFixed(2);

function seleccionarDiametro(flujoGPM) {
  let mejorTub = null, mejorVel = -Infinity, fallbackTub = null, fallbackVel = Infinity;
  for (const tub in DIAMETROS) {
    const d   = DIAMETROS[tub];
    const vel = flujoGPM * 0.408498 / (d * d);
    if (vel < fallbackVel) { fallbackVel = vel; fallbackTub = tub; }
    if (vel <= 6.5 && vel > mejorVel) { mejorVel = vel; mejorTub = tub; }
  }
  const tuberia   = mejorTub ?? fallbackTub;
  const d         = DIAMETROS[tuberia];
  const velocidad = flujoGPM * 0.408498 / (d * d);
  const cargaBase = 10.536 * 100 * Math.pow(flujoGPM, 1.852) /
    (Math.pow(d, 4.8655) * Math.pow(150, 1.852));
  return { tuberia, velocidad, cargaBase };
}

function cargaTramo(longMetros, cargaBase) {
  return (longMetros * 3.28084 * cargaBase) / 100;
}

/* ================================================================
   HIDRÁULICA UV
   flujoPorEquipo — capacidad del equipo (para selección)
   flujoRealSistema — flujo real del sistema (para hidráulica de tuberías)
   Si no se pasa flujoRealSistema, usa flujoPorEquipo (backward compat)
   ================================================================ */
function calcularHidraulicaUV({ flujoPorEquipo, cantidad, flujoRealSistema, modo = "auto" }) {
  const CARGA_FIJA_FT = 3;

  // Flujo real por unidad para la hidráulica
  const flujoRealPorUnidad = flujoRealSistema
    ? flujoRealSistema / cantidad
    : flujoPorEquipo;

  const tablaTramos          = [];
  let   cargaAcumuladaTramos = 0;
  const resumen              = {};
  const addDiam = (d) => {
    if (!resumen[d]) resumen[d] = { tuberia_m: 0, tees: 0, codos: 0, reducciones: 0 };
  };
  let tubAnterior = null;

  if (cantidad === 1) {
    const flujoCalculo = flujoRealSistema ?? flujoPorEquipo;
    const { tuberia, velocidad, cargaBase } = seleccionarDiametro(flujoCalculo);
    const longEqCodo     = CODO[tuberia] ?? CODO["tuberia 18.00"];
    const cargaTramoCL   = cargaTramo(0.5, cargaBase);
    const cargaCodos     = (2 * longEqCodo * cargaBase) / 100;
    const cargaFilaTotal = cargaTramoCL + cargaCodos;
    cargaAcumuladaTramos += cargaFilaTotal;
    tablaTramos.push({
      tramo: 1, flujo: fix2(flujoCalculo), tuberia,
      velocidad: fix2(velocidad), longitud_m: "0.50",
      cargaBase: fix2(cargaBase), cargaTramo: fix2(cargaTramoCL),
      cantTees: 0, longEqTee: "0.00", cargaTees: "0.00",
      cantCodos: 2, longEqCodo: fix2(longEqCodo), cargaCodos: fix2(cargaCodos),
      cantRed: 0, longEqRed: "0.00", cargaRed: "0.00",
      cargaTotal: fix2(cargaFilaTotal),
    });
    addDiam(tuberia);
    resumen[tuberia].tuberia_m += 0.5;
    resumen[tuberia].codos     += 2;
    tubAnterior = tuberia;
  } else {
    for (let i = 0; i < cantidad; i++) {
      const flujoActual = (cantidad - i) * flujoRealPorUnidad;
      const esUltimo    = i === cantidad - 1;
      const { tuberia, velocidad, cargaBase } = seleccionarDiametro(flujoActual);
      const cargaTramoCL = cargaTramo(0.5, cargaBase);
      const cantTees  = esUltimo ? 0 : 2;
      const cantCodos = esUltimo ? 2 : 0;
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
        velocidad: fix2(velocidad), longitud_m: "0.50",
        cargaBase: fix2(cargaBase), cargaTramo: fix2(cargaTramoCL),
        cantTees,  longEqTee:  fix2(cantTees  > 0 ? longEqTee  : 0), cargaTees:  fix2(cargaTees),
        cantCodos, longEqCodo: fix2(cantCodos > 0 ? longEqCodo : 0), cargaCodos: fix2(cargaCodos),
        cantRed,   longEqRed:  fix2(longEqRed), cargaRed: fix2(cargaRed),
        cargaTotal: fix2(cargaFilaTotal),
      });
      addDiam(tuberia);
      resumen[tuberia].tuberia_m   += 0.5;
      resumen[tuberia].tees        += cantTees;
      resumen[tuberia].codos       += cantCodos;
      resumen[tuberia].reducciones += cantRed;
      tubAnterior = tuberia;
    }
  }

  const cargaTotal    = cargaAcumuladaTramos + CARGA_FIJA_FT;
  const cargaTotalPSI = cargaTotal * 0.43353;
  const resumenMateriales = Object.entries(resumen).map(([diam, vals]) => ({
    tuberia: diam, tuberia_m: fix2(vals.tuberia_m),
    tees: vals.tees, codos: vals.codos, reducciones: vals.reducciones,
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

function seleccionarGeneradorUV(flujoMaxSistema) {
  const catalogo = generadoresUV.filter(g => g.metadata.activo);
  let mejorOpcion = null;
  for (const equipo of catalogo) {
    const flujoUnitario = equipo.specs.flujo;
    if (flujoUnitario <= 0) continue;
    const cantidad   = Math.ceil(flujoMaxSistema / flujoUnitario);
    const flujoTotal = cantidad * flujoUnitario;
    const exceso     = flujoTotal - flujoMaxSistema;
    if (!mejorOpcion) { mejorOpcion = { equipo, cantidad, flujoTotal, exceso }; continue; }
    if (cantidad < mejorOpcion.cantidad) {
      mejorOpcion = { equipo, cantidad, flujoTotal, exceso };
    } else if (cantidad === mejorOpcion.cantidad) {
      if (exceso < mejorOpcion.exceso) {
        mejorOpcion = { equipo, cantidad, flujoTotal, exceso };
      } else if (exceso === mejorOpcion.exceso && flujoUnitario < mejorOpcion.equipo.specs.flujo) {
        mejorOpcion = { equipo, cantidad, flujoTotal, exceso };
      }
    }
  }
  return mejorOpcion;
}

/* ================================================================
   FUNCIÓN PRINCIPAL
   flujoMaxSistema — para selección del equipo
   flujoRealSistema — para hidráulica (si null, usa flujoMaxSistema)
   ================================================================ */
export function generadorUV(flujoMaxSistema, flujoRealSistema = null) {
  if (!flujoMaxSistema || flujoMaxSistema <= 0) {
    return { error: "Flujo máximo del sistema inválido o no disponible." };
  }
  const seleccion = seleccionarGeneradorUV(flujoMaxSistema);
  if (!seleccion) {
    return { error: "Catálogo de generadores UV vacío o sin equipos activos." };
  }
  const { equipo, cantidad } = seleccion;
  const flujoPorEquipo = equipo.specs.flujo;
  const flujoReal      = flujoRealSistema ?? flujoMaxSistema;

  const hidraulica = calcularHidraulicaUV({
    flujoPorEquipo, cantidad, flujoRealSistema: flujoReal, modo: "auto",
  });

  return {
    seleccion: {
      marca:           equipo.marca,
      modelo:          equipo.modelo,
      cantidad,
      flujoPorEquipo:  fix2(flujoPorEquipo),
      flujoTotal:      fix2(cantidad * flujoPorEquipo),
      flujoReal:       fix2(flujoReal),
      flujoMaxSistema: fix2(flujoMaxSistema),
      exceso:          fix2(seleccion.exceso),
    },
    ...hidraulica,
  };
}

/* ================================================================
   FUNCIÓN MANUAL
   flujoPorEquipo — capacidad unitaria del equipo
   cantidad       — número de equipos
   flujoRealSistema — flujo real del sistema (opcional)
   ================================================================ */
export function calcularCargaUVManual(flujoPorEquipo, cantidad, flujoRealSistema = null) {
  if (!flujoPorEquipo || flujoPorEquipo <= 0 || !cantidad || cantidad <= 0) {
    return { error: "Flujo o cantidad inválidos para cálculo manual." };
  }
  return calcularHidraulicaUV({
    flujoPorEquipo,
    cantidad,
    flujoRealSistema: flujoRealSistema ?? (flujoPorEquipo * cantidad),
    modo: "manual",
  });
}