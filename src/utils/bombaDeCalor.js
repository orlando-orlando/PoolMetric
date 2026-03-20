import { bombasCalor } from "../data/bombasDeCalor";

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

/* ================================================================
   DEDUPLICACIÓN DE LOGS
   Cada combinación única de inputs genera una clave.
   Si esa clave ya fue logueada, se omite — así la consola muestra
   el cálculo solo una vez aunque la función se llame varias veces
   con los mismos parámetros (paso1, paso2, auto, manual).
   Exportamos resetBDCLog() para poder limpiar desde tests si se necesita.
   ================================================================ */
const _loggedBDC = new Set();
export function resetBDCLog() { _loggedBDC.clear(); }

/* ================================================================
   HELPERS
   ================================================================ */
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

  const tubSeleccionado = mejorTub ?? fallbackTub;
  const d         = DIAMETROS[tubSeleccionado];
  const vel       = flujoGPM * 0.408498 / (d * d);
  const cargaBase =
    10.536 * 100 * Math.pow(flujoGPM, 1.852) /
    (Math.pow(d, 4.8655) * Math.pow(150, 1.852));

  return { tuberia: tubSeleccionado, velocidad: vel, cargaBase };
}

function cargaTramo(longMetros, cargaBase) {
  return (longMetros * 3.28084 * cargaBase) / 100;
}

/* ================================================================
   LÓGICA HIDRÁULICA

   Regla de carga estática — prioridad BDC:
     • alturaVertical (BDC) >= alturaMaxSistema  →  BDC lleva carga estática completa
     • alturaVertical (BDC) <  alturaMaxSistema  →  cargaEstatica BDC = 0

   En todos los casos:
     • cargaFriccionAltura  = fricción sobre alturaVertical propia de la BDC
     • resumenTuberia       acumula alturaVertical * 2  (pérdida de calor)
   ================================================================ */
function calcularHidraulica({ flujoPorBomba, cantidad, distanciaCM, alturaVertical, alturaMaxSistema = null, modo = "auto" }) {

  /* ── Clave de deduplicación: mismos inputs → mismo log, no se repite ── */
  const logKey = `bdc|${modo}|${flujoPorBomba}|${cantidad}|${distanciaCM}|${alturaVertical}|${alturaMaxSistema}`;
  const debeLoguear = !_loggedBDC.has(logKey);
  if (debeLoguear) _loggedBDC.add(logKey);

  const colorLog  = modo === "manual" ? "#fb923c" : "#34d399";
  const labelModo = modo === "manual" ? "MANUAL" : "AUTO";

  const log = debeLoguear
    ? (msg, ...args) => console.log(msg, ...args)
    : () => {};

  const tablaTramos          = [];
  let   cargaAcumuladaTramos = 0;

  const resumen        = {};
  const resumenTuberia = {};

  const addDiam = (d) => {
    if (!resumen[d])        resumen[d]        = { tuberia_m: 0, tees: 0, codos: 0, reducciones: 0 };
  };
  const addDiamTuberia = (d) => {
    if (!resumenTuberia[d]) resumenTuberia[d] = { tuberia_m: 0, tees: 0, codos: 0, reducciones: 0 };
  };

  let tubAnterior = null;

  /* ── Tramos entre equipos ── */
  if (cantidad === 1) {
    const { tuberia, velocidad, cargaBase } = seleccionarDiametro(flujoPorBomba);
    const longEqCodo     = CODO[tuberia] ?? CODO["tuberia 18.00"];
    const cargaTramoBDC  = cargaTramo(1, cargaBase);
    const cargaCodos     = (2 * longEqCodo * cargaBase) / 100;
    const cargaFilaTotal = cargaTramoBDC + cargaCodos;

    cargaAcumuladaTramos += cargaFilaTotal;

    log(`%c── [${labelModo}] BDC Tramo 1 (equipo único) ──────────────────────`, `color:${colorLog};font-weight:bold`);
    log(`  Flujo en tramo             : ${fix2(flujoPorBomba)} GPM`);
    log(`  Tubería seleccionada        : ${tuberia}`);
    log(`  Carga base (Hazen-Williams) : ${fix2(cargaBase)} ft/100ft`);
    log(`  Longitud de tubería         : 1.00 m`);
    log(`  Carga por tubería           : ${fix2(cargaTramoBDC)} ft`);
    log(`  Núm. codos                  : 2`);
    log(`  Long. eq. codo              : ${fix2(longEqCodo)} ft`);
    log(`  Carga por codos             : ${fix2(cargaCodos)} ft`);
    log(`  CARGA TOTAL TRAMO           : ${fix2(cargaFilaTotal)} ft`);

    tablaTramos.push({
      tramo: 1, flujo: fix2(flujoPorBomba), tuberia,
      velocidad: fix2(velocidad), longitud_m: "1.00",
      cargaBase: fix2(cargaBase), cargaTramo: fix2(cargaTramoBDC),
      cantTees: 0, longEqTee: "0.00", cargaTees: "0.00",
      cantCodos: 2, longEqCodo: fix2(longEqCodo), cargaCodos: fix2(cargaCodos),
      cantRed: 0, longEqRed: "0.00", cargaRed: "0.00",
      cargaTotal: fix2(cargaFilaTotal),
    });

    addDiam(tuberia);
    resumen[tuberia].tuberia_m += 1;
    resumen[tuberia].codos     += 2;
    tubAnterior = tuberia;

  } else {
    for (let i = 0; i < cantidad; i++) {
      const flujoActual = (cantidad - i) * flujoPorBomba;
      const esUltimo    = i === cantidad - 1;
      const { tuberia, velocidad, cargaBase } = seleccionarDiametro(flujoActual);

      const cargaTramoBDC = cargaTramo(1, cargaBase);
      const cantTees      = esUltimo ? 0 : 2;
      const cantCodos     = esUltimo ? 2 : 0;

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

      const cargaFilaTotal = cargaTramoBDC + cargaTees + cargaCodos + cargaRed;
      cargaAcumuladaTramos += cargaFilaTotal;

      log(`%c── [${labelModo}] BDC Tramo ${i + 1} ──────────────────────────────────`, `color:${colorLog};font-weight:bold`);
      log(`  Flujo en tramo             : ${fix2(flujoActual)} GPM`);
      log(`  Tubería seleccionada        : ${tuberia}`);
      log(`  Carga base (Hazen-Williams) : ${fix2(cargaBase)} ft/100ft`);
      log(`  Longitud de tubería         : 1.00 m`);
      log(`  Carga por tubería           : ${fix2(cargaTramoBDC)} ft`);
      log(`  Núm. tees                   : ${cantTees}`);
      log(`  Long. eq. tee               : ${fix2(cantTees  > 0 ? longEqTee  : 0)} ft`);
      log(`  Carga por tees              : ${fix2(cargaTees)} ft`);
      log(`  Núm. codos                  : ${cantCodos}`);
      log(`  Long. eq. codo              : ${fix2(cantCodos > 0 ? longEqCodo : 0)} ft`);
      log(`  Carga por codos             : ${fix2(cargaCodos)} ft`);
      log(`  Núm. reducciones            : ${cantRed}`);
      log(`  Carga por reducción         : ${fix2(cargaRed)} ft`);
      log(`  CARGA TOTAL TRAMO           : ${fix2(cargaFilaTotal)} ft`);

      tablaTramos.push({
        tramo: i + 1, flujo: fix2(flujoActual), tuberia,
        velocidad: fix2(velocidad), longitud_m: "1.00",
        cargaBase: fix2(cargaBase), cargaTramo: fix2(cargaTramoBDC),
        cantTees,  longEqTee:  fix2(cantTees  > 0 ? longEqTee  : 0), cargaTees:  fix2(cargaTees),
        cantCodos, longEqCodo: fix2(cantCodos > 0 ? longEqCodo : 0), cargaCodos: fix2(cargaCodos),
        cantRed,   longEqRed:  fix2(longEqRed), cargaRed: fix2(cargaRed),
        cargaTotal: fix2(cargaFilaTotal),
      });

      addDiam(tuberia);
      resumen[tuberia].tuberia_m   += 1;
      resumen[tuberia].tees        += cantTees;
      resumen[tuberia].codos       += cantCodos;
      resumen[tuberia].reducciones += cantRed;

      tubAnterior = tuberia;
    }
  }

  /* ── Tramo cuarto de máquinas (ida + regreso) ── */
  const flujoTotalBDC = cantidad * flujoPorBomba;
  const { tuberia: tubCM, velocidad: velCM, cargaBase: cargaBaseCM } =
    seleccionarDiametro(flujoTotalBDC);

  const distCM_ft    = distanciaCM * 3.28084;
  const longEqCodoCM = CODO[tubCM] ?? CODO["tuberia 18.00"];

  const cargaTuberiaIda   = (distCM_ft * cargaBaseCM) / 100;
  const cargaCodoIda      = (longEqCodoCM * cargaBaseCM) / 100;
  const cargaTotalIda     = cargaTuberiaIda + cargaCodoIda;

  const cargaTuberiaRegreso = (distCM_ft * cargaBaseCM) / 100;
  const cargaCodoRegreso    = (longEqCodoCM * cargaBaseCM) / 100;
  const cargaTotalRegreso   = cargaTuberiaRegreso + cargaCodoRegreso;

  const cargaTotalCM = cargaTotalIda + cargaTotalRegreso;

  log(`%c── [${labelModo}] TRAMO CUARTO DE MÁQUINAS — IDA ─────────────────`, `color:${colorLog};font-weight:bold`);
  log(`  Distancia (metros)          : ${fix2(distanciaCM)} m`);
  log(`  Distancia (pies)            : ${fix2(distCM_ft)} ft`);
  log(`  Flujo                       : ${fix2(flujoTotalBDC)} GPM`);
  log(`  Tubería seleccionada        : ${tubCM}`);
  log(`  Velocidad en tubería        : ${fix2(velCM)} ft/s`);
  log(`  Carga base (Hazen-Williams) : ${fix2(cargaBaseCM)} ft/100ft`);
  log(`  Carga por tubería           : ${fix2(cargaTuberiaIda)} ft`);
  log(`  Long. eq. codo (1 codo)     : ${fix2(longEqCodoCM)} ft`);
  log(`  Carga por codo              : ${fix2(cargaCodoIda)} ft`);
  log(`  CARGA TOTAL IDA             : ${fix2(cargaTotalIda)} ft`);

  log(`%c── [${labelModo}] TRAMO CUARTO DE MÁQUINAS — REGRESO ───────────`, `color:${colorLog};font-weight:bold`);
  log(`  Distancia (metros)          : ${fix2(distanciaCM)} m`);
  log(`  Distancia (pies)            : ${fix2(distCM_ft)} ft`);
  log(`  Flujo                       : ${fix2(flujoTotalBDC)} GPM`);
  log(`  Tubería seleccionada        : ${tubCM}`);
  log(`  Velocidad en tubería        : ${fix2(velCM)} ft/s`);
  log(`  Carga base (Hazen-Williams) : ${fix2(cargaBaseCM)} ft/100ft`);
  log(`  Carga por tubería           : ${fix2(cargaTuberiaRegreso)} ft`);
  log(`  Long. eq. codo (1 codo)     : ${fix2(longEqCodoCM)} ft`);
  log(`  Carga por codo              : ${fix2(cargaCodoRegreso)} ft`);
  log(`  CARGA TOTAL REGRESO         : ${fix2(cargaTotalRegreso)} ft`);

  const tablaDistancia = {
    distancia_m: fix2(distanciaCM), flujo: fix2(flujoTotalBDC),
    tuberia: tubCM, velocidad: fix2(velCM), cargaBase: fix2(cargaBaseCM),
    cargaTuberiaIda: fix2(cargaTuberiaIda), cargaCodoIda: fix2(cargaCodoIda),
    cargaTotalIda:   fix2(cargaTotalIda),
    cargaTuberiaReg: fix2(cargaTuberiaRegreso), cargaCodoReg: fix2(cargaCodoRegreso),
    cargaTotalReg:   fix2(cargaTotalRegreso),
    cantCodos: 2, longEqCodo: fix2(longEqCodoCM),
    cargaTotal: fix2(cargaTotalCM),
  };

  addDiam(tubCM);
  resumen[tubCM].tuberia_m += distanciaCM * 2;
  resumen[tubCM].codos     += 2;

  addDiamTuberia(tubCM);
  resumenTuberia[tubCM].tuberia_m += distanciaCM * 2;
  resumenTuberia[tubCM].codos     += 2;

  /* ── Carga estática + fricción ── */
  const alturaMaxEfectiva     = alturaMaxSistema !== null ? alturaMaxSistema : alturaVertical;
  const bdcLlevaCargaEstatica = alturaVertical >= alturaMaxEfectiva - 0.001;
  const alturaVertical_ft     = alturaVertical * 3.28084;
  const cargaEstaticaAltura   = bdcLlevaCargaEstatica ? (alturaMaxEfectiva * 3.28084) : 0;
  const cargaFriccionAltura   = (alturaVertical_ft * cargaBaseCM) / 100;
  const cargaTotalAltura      = cargaEstaticaAltura + cargaFriccionAltura;

  log(`%c── [${labelModo}] ALTURA VERTICAL BDC ─────────────────────────`, `color:${colorLog};font-weight:bold`);
  log(`  Altura propia BDC (m)       : ${fix2(alturaVertical)} m`);
  log(`  Altura máx. sistema (m)     : ${fix2(alturaMaxEfectiva)} m`);
  log(`  BDC lleva carga estática     : ${bdcLlevaCargaEstatica ? "SÍ (BDC >= altMax, incluye empate)" : "NO (PS es estrictamente más alto)"}`);
  log(`  Carga estática              : ${fix2(cargaEstaticaAltura)} ft`);
  log(`  Carga fricción (tubería BDC): ${fix2(cargaFriccionAltura)} ft`);
  log(`  CARGA TOTAL ALTURA          : ${fix2(cargaTotalAltura)} ft`);

  const tablaAltura = {
    alturaBDC_m:          fix2(alturaVertical),
    alturaMaxSist_m:      fix2(alturaMaxEfectiva),
    bdcLlevaCargaEstatica,
    alturaMax_ft:         fix2(alturaMaxEfectiva * 3.28084),
    flujo:                fix2(flujoTotalBDC),
    tuberia:              tubCM,
    cargaBase:            fix2(cargaBaseCM),
    cargaEstatica:        fix2(cargaEstaticaAltura),
    cargaFriccion:        fix2(cargaFriccionAltura),
    cargaTotal:           fix2(cargaTotalAltura),
  };

  addDiam(tubCM);
  resumen[tubCM].tuberia_m += alturaVertical * 2;

  addDiamTuberia(tubCM);
  resumenTuberia[tubCM].tuberia_m += alturaVertical * 2;

  /* ── Carga fija + total ── */
  const CARGA_FIJA_FT = 7;
  const cargaTotal    = cargaAcumuladaTramos + cargaTotalCM + cargaTotalAltura + CARGA_FIJA_FT;
  const cargaTotalPSI = cargaTotal * 0.43353;

  log(`%c═══ [${labelModo}] RESUMEN FINAL BDC ══════════════════════════`, `color:${colorLog};font-weight:bold`);
  log(`  Suma carga tramos BDC      : ${fix2(cargaAcumuladaTramos)} ft`);
  log(`  Carga cuarto máq. (ida)    : ${fix2(cargaTotalIda)} ft`);
  log(`  Carga cuarto máq. (regreso): ${fix2(cargaTotalRegreso)} ft`);
  log(`  Carga estática             : ${fix2(cargaEstaticaAltura)} ft`);
  log(`  Carga fricción tubería BDC : ${fix2(cargaFriccionAltura)} ft`);
  log(`  Carga fija global (7 pies) : ${CARGA_FIJA_FT} ft`);
  log(`  ──────────────────────────────────────────`);
  log(`  CARGA TOTAL                : ${fix2(cargaTotal)} ft  /  ${fix2(cargaTotalPSI)} PSI`);
  log(`  resumenMaterialesTuberia   :`, Object.fromEntries(
    Object.entries(resumenTuberia).map(([k, v]) => [k, { ...v }])
  ));

  const resumenMateriales = Object.entries(resumen).map(([diam, vals]) => ({
    tuberia: diam, tuberia_m: fix2(vals.tuberia_m),
    tees: vals.tees, codos: vals.codos, reducciones: vals.reducciones,
  }));

  const resumenMaterialesTuberia = Object.entries(resumenTuberia).map(([diam, vals]) => ({
    tuberia: diam, tuberia_m: fix2(vals.tuberia_m),
    tees: vals.tees, codos: vals.codos, reducciones: vals.reducciones,
  }));

  return {
    tablaTramos,
    tablaDistancia,
    tablaAltura,
    cargaFija_ft:        CARGA_FIJA_FT,
    cargaTramos:         fix2(cargaAcumuladaTramos),
    cargaDistanciaIda:   fix2(cargaTotalIda),
    cargaDistanciaReg:   fix2(cargaTotalRegreso),
    cargaEstatica:       fix2(cargaEstaticaAltura),
    cargaFriccionAltura: fix2(cargaFriccionAltura),
    cargaTotal:          fix2(cargaTotal),
    cargaTotalPSI:       fix2(cargaTotalPSI),
    resumenMateriales,
    resumenMaterialesTuberia,
  };
}

/* ================================================================
   SELECCIÓN ÓPTIMA DE BOMBAS DE CALOR
   ================================================================ */
function seleccionarBombas(perdidaTotalBTU) {
  const catalogo = bombasCalor.filter((b) => b.metadata.activo);
  let mejorOpcion = null;

  for (const bomba of catalogo) {
    const capUnitaria = bomba.specs.capacidadCalentamiento;
    if (capUnitaria <= 0) continue;

    const cantidad = Math.ceil(perdidaTotalBTU / capUnitaria);
    const capTotal = cantidad * capUnitaria;
    const exceso   = capTotal - perdidaTotalBTU;

    if (!mejorOpcion) {
      mejorOpcion = { bomba, cantidad, capTotal, exceso };
      continue;
    }

    if (cantidad < mejorOpcion.cantidad) {
      mejorOpcion = { bomba, cantidad, capTotal, exceso };
    } else if (cantidad === mejorOpcion.cantidad) {
      if (exceso < mejorOpcion.exceso) {
        mejorOpcion = { bomba, cantidad, capTotal, exceso };
      } else if (exceso === mejorOpcion.exceso && bomba.specs.flujo < mejorOpcion.bomba.specs.flujo) {
        mejorOpcion = { bomba, cantidad, capTotal, exceso };
      }
    }
  }

  return mejorOpcion;
}

/* ================================================================
   FUNCIÓN PRINCIPAL: bombaDeCalor()
   ================================================================ */
export function bombaDeCalor(perdidaTotalBTU, distanciaCM, alturaVertical, alturaMaxSistema = null) {

  const seleccion = seleccionarBombas(perdidaTotalBTU);
  if (!seleccion) {
    return { error: "Catálogo de bombas de calor vacío o sin equipos activos." };
  }

  const { bomba, cantidad } = seleccion;
  const flujoPorBomba = bomba.specs.flujo;

  const hidraulica = calcularHidraulica({
    flujoPorBomba,
    cantidad,
    distanciaCM,
    alturaVertical,
    alturaMaxSistema,
    modo: "auto",
  });

  return {
    seleccion: {
      marca:         bomba.marca,
      modelo:        bomba.modelo,
      cantidad,
      flujoPorBomba: fix2(flujoPorBomba),
      flujoTotal:    fix2(cantidad * flujoPorBomba),
      capUnitaria:   bomba.specs.capacidadCalentamiento,
      capTotal:      seleccion.capTotal,
      exceso:        fix2(seleccion.exceso),
      velocidad:     bomba.specs.velocidad,
    },
    ...hidraulica,
  };
}

/* ================================================================
   FUNCIÓN MANUAL: calcularCargaManual()
   ================================================================ */
export function calcularCargaManual(flujoPorBomba, cantidad, distanciaCM, alturaVertical, alturaMaxSistema = null) {
  if (!flujoPorBomba || flujoPorBomba <= 0 || !cantidad || cantidad <= 0) {
    return { error: "Flujo o cantidad inválidos para cálculo manual." };
  }

  return calcularHidraulica({
    flujoPorBomba,
    cantidad,
    distanciaCM,
    alturaVertical,
    alturaMaxSistema,
    modo: "manual",
  });
}