import { panelesSolares } from "../data/panelesSolares";

/* ================================================================
   TABLAS HAZEN-WILLIAMS
   (idénticas a bombaDeCalor — tuberías PVC Sch40)
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
   CONSTANTES DE PANEL SOLAR
   ================================================================ */
const PANELES_POR_TANDEM    = 9;    // máximo paneles por tándem
const FLUJO_POR_PANEL_GPM   = 2.5;  // GPM por panel
const FLUJO_POR_TANDEM_GPM  = PANELES_POR_TANDEM * FLUJO_POR_PANEL_GPM; // 22.5 GPM tándem completo
const LONG_TUBERIA_TANDEM_M = 6.4;  // metros de tubería por tándem (no por panel)
const TUBERIA_ENTRADA_TANDEM = "tuberia 1.50"; // entrada fija 1.5" por tándem

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
   DISTRIBUCIÓN DE PANELES EN TÁNDEMS
   Devuelve array de tándems con su cantidad de paneles.
   Ej: 20 paneles → [9, 9, 2]
   ================================================================ */
function distribuirEnTandems(totalPaneles) {
  const tandems = [];
  let restantes = totalPaneles;
  while (restantes > 0) {
    const enEsteTandem = Math.min(restantes, PANELES_POR_TANDEM);
    tandems.push(enEsteTandem);
    restantes -= enEsteTandem;
  }
  return tandems;
}

/* ================================================================
   LÓGICA HIDRÁULICA COMPARTIDA PARA PANELES SOLARES

   Reglas específicas vs bombaDeCalor:
   - Cada panel lleva 6.4m de tubería (no 1m)
   - Entrada de cada tándem: tubería 1.5" fija
   - Tándems intermedios: 2 tees; último tándem: 2 codos
   - Flujo por panel: 2.5 GPM (fijo de specs)
   - alturaPS: altura de paneles sobre espejo de agua
   - alturaBDC: altura de BDC sobre espejo de agua (puede ser 0 si no hay BDC)
   - Carga estática = max(alturaPS, alturaBDC), pero se desglosa:
       cargaEstaticaBDC   = alturaBDC
       cargaEstaticaDelta = alturaPS - alturaBDC  (si alturaPS > alturaBDC)
       cargaEstaticaTotal = alturaPS
   ================================================================ */
function calcularHidraulicaPS({
  totalPaneles,
  distanciaCM,    // metros cuarto de máquinas → campo de paneles
  alturaPS,       // metros paneles sobre espejo de agua
  alturaBDC = 0,  // metros BDC sobre espejo de agua (para comparar carga estática)
  modo = "auto",
}) {
  const colorLog  = modo === "manual" ? "#fb923c" : "#34d399";
  const labelModo = modo === "manual" ? "MANUAL" : "AUTO";

  const tandems              = distribuirEnTandems(totalPaneles);
  const numTandems           = tandems.length;
  const flujoTotalPS         = totalPaneles * FLUJO_POR_PANEL_GPM;

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

  /* ── Tramos por tándem ──────────────────────────────────────────
     El flujo en cada tramo es la suma de los tándems que aún no
     se han "derivado". Empezamos desde el tándem más alejado del
     cuarto de máquinas (índice 0) hacia el más cercano.

     flujoEnTramo[i] = flujo de todos los tándems desde i hasta el final
  ─────────────────────────────────────────────────────────────── */
  for (let i = 0; i < numTandems; i++) {
    const esUltimo   = i === numTandems - 1;
    const panelesEnTandem = tandems[i];

    // Flujo acumulado desde este tándem hacia adelante (dirección CM)
    const flujoDesdeAqui = tandems.slice(i).reduce((s, p) => s + p * FLUJO_POR_PANEL_GPM, 0);

    // Longitud de tubería del tándem: 6.4m fijos por tándem (independiente del número de paneles)
    const longTuberiaTramo_m = LONG_TUBERIA_TANDEM_M;

    // Seleccionar diámetro para el flujo de este tramo
    const { tuberia, velocidad, cargaBase } = seleccionarDiametro(flujoDesdeAqui);

    const cargaTramoPaneles = cargaTramo(longTuberiaTramo_m, cargaBase);

    // Último tándem → 2 codos; tándems intermedios → 2 tees
    const cantTees  = esUltimo ? 0 : 2;
    const cantCodos = esUltimo ? 2 : 0;

    const longEqTee  = TEE_LINEA[tuberia] ?? TEE_LINEA["tuberia 18.00"];
    const longEqCodo = CODO[tuberia]      ?? CODO["tuberia 18.00"];

    const cargaTees  = (cantTees  * longEqTee  * cargaBase) / 100;
    const cargaCodos = (cantCodos * longEqCodo * cargaBase) / 100;

    // Reducción si cambia el diámetro respecto al tramo anterior
    let cargaRed = 0, longEqRed = 0, cantRed = 0;
    if (tubAnterior && tubAnterior !== tuberia) {
      longEqRed = REDUCCION[tuberia] ?? REDUCCION["tuberia 18.00"];
      cargaRed  = (longEqRed * cargaBase) / 100;
      cantRed   = 1;
    }

    // Entrada del tándem: tubería 1.5" fija, flujo propio del tándem (no el acumulado del tramo)
    const flujoTandem   = panelesEnTandem * FLUJO_POR_PANEL_GPM;
    const dEntrada      = DIAMETROS[TUBERIA_ENTRADA_TANDEM];
    const cargaBaseEnt  =
      10.536 * 100 * Math.pow(flujoTandem, 1.852) /
      (Math.pow(dEntrada, 4.8655) * Math.pow(150, 1.852));
    // 5cm por tándem — conexión corta de entrada
    const longEntrada_m = 0.05;
    const cargaEntrada  = cargaTramo(longEntrada_m, cargaBaseEnt);

    const cargaFilaTotal = cargaTramoPaneles + cargaTees + cargaCodos + cargaRed + cargaEntrada;
    cargaAcumuladaTramos += cargaFilaTotal;

    console.log(`%c── [${labelModo}] PS Tándem ${i + 1} (${panelesEnTandem} paneles) ─────────────────────`, `color:${colorLog};font-weight:bold`);
    console.log(`  Paneles en tándem           : ${panelesEnTandem}`);
    console.log(`  Flujo en tramo              : ${fix2(flujoDesdeAqui)} GPM`);
    console.log(`  Tubería seleccionada        : ${tuberia}`);
    console.log(`  Carga base (Hazen-Williams) : ${fix2(cargaBase)} ft/100ft`);
    console.log(`  Longitud tubería tándem     : ${fix2(longTuberiaTramo_m)} m (fijo por tándem)`);
    console.log(`  Carga por tubería tándem    : ${fix2(cargaTramoPaneles)} ft`);
    console.log(`  Flujo tándem propio         : ${fix2(flujoTandem)} GPM (${panelesEnTandem} × 2.5)`);
    console.log(`  Entrada tándem (1.5", 5cm)  : ${fix2(longEntrada_m)} m → ${fix2(cargaEntrada)} ft`);
    console.log(`  Núm. tees                   : ${cantTees}`);
    console.log(`  Long. eq. tee               : ${fix2(cantTees  > 0 ? longEqTee  : 0)} ft`);
    console.log(`  Carga por tees              : ${fix2(cargaTees)} ft`);
    console.log(`  Núm. codos                  : ${cantCodos}`);
    console.log(`  Long. eq. codo              : ${fix2(cantCodos > 0 ? longEqCodo : 0)} ft`);
    console.log(`  Carga por codos             : ${fix2(cargaCodos)} ft`);
    console.log(`  Núm. reducciones            : ${cantRed}`);
    console.log(`  Carga por reducción         : ${fix2(cargaRed)} ft`);
    console.log(`  CARGA TOTAL TÁNDEM          : ${fix2(cargaFilaTotal)} ft`);

    tablaTramos.push({
      tandem:             i + 1,
      paneles:            panelesEnTandem,
      flujo:              fix2(flujoDesdeAqui),
      tuberia,
      velocidad:          fix2(velocidad),
      longitud_m:         fix2(longTuberiaTramo_m),
      cargaBase:          fix2(cargaBase),
      cargaTramo:         fix2(cargaTramoPaneles),
      entradaTuberia:     TUBERIA_ENTRADA_TANDEM,
      flujoTandem:        fix2(flujoTandem),
      entradaLong_m:      fix2(longEntrada_m),
      cargaEntrada:       fix2(cargaEntrada),
      cantTees,
      longEqTee:          fix2(cantTees  > 0 ? longEqTee  : 0),
      cargaTees:          fix2(cargaTees),
      cantCodos,
      longEqCodo:         fix2(cantCodos > 0 ? longEqCodo : 0),
      cargaCodos:         fix2(cargaCodos),
      cantRed,
      longEqRed:          fix2(longEqRed),
      cargaRed:           fix2(cargaRed),
      cargaTotal:         fix2(cargaFilaTotal),
    });

    // Resumen hidráulico completo (tramos entre tándems)
    addDiam(tuberia);
    resumen[tuberia].tuberia_m   += longTuberiaTramo_m;
    resumen[tuberia].tees        += cantTees;
    resumen[tuberia].codos       += cantCodos;
    resumen[tuberia].reducciones += cantRed;

    // Entrada 1.5" → solo resumen hidráulico, NO resumenTuberia
    // (igual que tramos BDC: los tramos entre equipos no van a pérdida de calor)
    addDiam(TUBERIA_ENTRADA_TANDEM);
    resumen[TUBERIA_ENTRADA_TANDEM].tuberia_m += longEntrada_m;

    tubAnterior = tuberia;
  }

  /* ── Tramo cuarto de máquinas (ida + regreso) ── */
  const { tuberia: tubCM, velocidad: velCM, cargaBase: cargaBaseCM } =
    seleccionarDiametro(flujoTotalPS);

  const distCM_ft    = distanciaCM * 3.28084;
  const longEqCodoCM = CODO[tubCM] ?? CODO["tuberia 18.00"];

  const cargaTuberiaIda   = (distCM_ft * cargaBaseCM) / 100;
  const cargaCodoIda      = (longEqCodoCM * cargaBaseCM) / 100;
  const cargaTotalIda     = cargaTuberiaIda + cargaCodoIda;

  const cargaTuberiaRegreso = (distCM_ft * cargaBaseCM) / 100;
  const cargaCodoRegreso    = (longEqCodoCM * cargaBaseCM) / 100;
  const cargaTotalRegreso   = cargaTuberiaRegreso + cargaCodoRegreso;

  const cargaTotalCM = cargaTotalIda + cargaTotalRegreso;

  console.log(`%c── [${labelModo}] TRAMO CUARTO DE MÁQUINAS — IDA ─────────────────`, `color:${colorLog};font-weight:bold`);
  console.log(`  Distancia (metros)          : ${fix2(distanciaCM)} m`);
  console.log(`  Distancia (pies)            : ${fix2(distCM_ft)} ft`);
  console.log(`  Flujo total paneles         : ${fix2(flujoTotalPS)} GPM`);
  console.log(`  Tubería seleccionada        : ${tubCM}`);
  console.log(`  Velocidad en tubería        : ${fix2(velCM)} ft/s`);
  console.log(`  Carga base (Hazen-Williams) : ${fix2(cargaBaseCM)} ft/100ft`);
  console.log(`  Carga por tubería           : ${fix2(cargaTuberiaIda)} ft`);
  console.log(`  Long. eq. codo (1 codo)     : ${fix2(longEqCodoCM)} ft`);
  console.log(`  Carga por codo              : ${fix2(cargaCodoIda)} ft`);
  console.log(`  CARGA TOTAL IDA             : ${fix2(cargaTotalIda)} ft`);

  console.log(`%c── [${labelModo}] TRAMO CUARTO DE MÁQUINAS — REGRESO ───────────`, `color:${colorLog};font-weight:bold`);
  console.log(`  Distancia (metros)          : ${fix2(distanciaCM)} m`);
  console.log(`  Distancia (pies)            : ${fix2(distCM_ft)} ft`);
  console.log(`  Flujo total paneles         : ${fix2(flujoTotalPS)} GPM`);
  console.log(`  Tubería seleccionada        : ${tubCM}`);
  console.log(`  Carga base (Hazen-Williams) : ${fix2(cargaBaseCM)} ft/100ft`);
  console.log(`  Carga por tubería           : ${fix2(cargaTuberiaRegreso)} ft`);
  console.log(`  Long. eq. codo (1 codo)     : ${fix2(longEqCodoCM)} ft`);
  console.log(`  Carga por codo              : ${fix2(cargaCodoRegreso)} ft`);
  console.log(`  CARGA TOTAL REGRESO         : ${fix2(cargaTotalRegreso)} ft`);

  const tablaDistancia = {
    distancia_m:     fix2(distanciaCM),
    flujo:           fix2(flujoTotalPS),
    tuberia:         tubCM,
    velocidad:       fix2(velCM),
    cargaBase:       fix2(cargaBaseCM),
    cargaTuberiaIda: fix2(cargaTuberiaIda),
    cargaCodoIda:    fix2(cargaCodoIda),
    cargaTotalIda:   fix2(cargaTotalIda),
    cargaTuberiaReg: fix2(cargaTuberiaRegreso),
    cargaCodoReg:    fix2(cargaCodoRegreso),
    cargaTotalReg:   fix2(cargaTotalRegreso),
    cantCodos:       2,
    longEqCodo:      fix2(longEqCodoCM),
    cargaTotal:      fix2(cargaTotalCM),
  };

  // CM → ambos resúmenes
  addDiam(tubCM);
  resumen[tubCM].tuberia_m += distanciaCM * 2;
  resumen[tubCM].codos     += 2;

  addDiamTuberia(tubCM);
  resumenTuberia[tubCM].tuberia_m += distanciaCM * 2;
  resumenTuberia[tubCM].codos     += 2;

  /* ── Altura vertical — carga estática ──────────────────────────
     Regla: se toma la MAYOR altura entre paneles y BDC.
     - cargaEstaticaBDC   = alturaBDC  (ya considerada en BDC, se descarta si < alturaPS)
     - cargaEstaticaDelta = alturaPS - alturaBDC  (metros adicionales de PS sobre BDC)
     - cargaEstaticaTotal = alturaPS  (la mayor, en pies)

     Si alturaBDC >= alturaPS → los paneles no añaden carga estática adicional.
  ─────────────────────────────────────────────────────────────── */
  const alturaEfectiva_m  = Math.max(alturaPS, alturaBDC);     // la mayor
  const deltaAltura_m     = Math.max(0, alturaPS - alturaBDC); // diferencia adicional de PS
  const alturaEfectiva_ft = alturaEfectiva_m * 3.28084;
  const deltaAltura_ft    = deltaAltura_m    * 3.28084;

  const cargaEstaticaTotal = alturaEfectiva_ft;
  // Fricción de altura: calculada sobre la diferencia (solo el tramo adicional de PS)
  const cargaFriccionAltura = (deltaAltura_ft * cargaBaseCM) / 100;
  const cargaTotalAltura    = cargaEstaticaTotal + cargaFriccionAltura;

  console.log(`%c── [${labelModo}] ALTURA VERTICAL PANELES SOLARES ─────────────`, `color:${colorLog};font-weight:bold`);
  console.log(`  Altura BDC (referencia)     : ${fix2(alturaBDC)} m = ${fix2(alturaBDC * 3.28084)} ft`);
  console.log(`  Altura paneles solares      : ${fix2(alturaPS)} m = ${fix2(alturaPS * 3.28084)} ft`);
  console.log(`  Altura efectiva (mayor)     : ${fix2(alturaEfectiva_m)} m`);
  console.log(`  Delta PS sobre BDC          : ${fix2(deltaAltura_m)} m = ${fix2(deltaAltura_ft)} ft`);
  console.log(`  Carga estática total        : ${fix2(cargaEstaticaTotal)} ft`);
  console.log(`  Carga fricción delta        : ${fix2(cargaFriccionAltura)} ft`);
  console.log(`  CARGA TOTAL ALTURA          : ${fix2(cargaTotalAltura)} ft`);

  const tablaAltura = {
    alturaPS_m:          fix2(alturaPS),
    alturaBDC_m:         fix2(alturaBDC),
    alturaEfectiva_m:    fix2(alturaEfectiva_m),
    deltaAltura_m:       fix2(deltaAltura_m),
    alturaEfectiva_ft:   fix2(alturaEfectiva_ft),
    deltaAltura_ft:      fix2(deltaAltura_ft),
    flujo:               fix2(flujoTotalPS),
    tuberia:             tubCM,
    cargaBase:           fix2(cargaBaseCM),
    cargaEstatica:       fix2(cargaEstaticaTotal),
    cargaFriccion:       fix2(cargaFriccionAltura),
    cargaTotal:          fix2(cargaTotalAltura),
  };

  // Altura → tubería del tramo CM (solo delta para pérdida de calor)
  addDiam(tubCM);
  resumen[tubCM].tuberia_m += deltaAltura_m * 2;

  addDiamTuberia(tubCM);
  resumenTuberia[tubCM].tuberia_m += deltaAltura_m * 2;

  /* ── Carga fija + total ── */
  const CARGA_FIJA_FT = 7;
  const cargaTotal    = cargaAcumuladaTramos + cargaTotalCM + cargaTotalAltura + CARGA_FIJA_FT;
  const cargaTotalPSI = cargaTotal * 0.43353;

  console.log(`%c═══ [${labelModo}] RESUMEN FINAL PANEL SOLAR ═══════════════════`, `color:${colorLog};font-weight:bold`);
  console.log(`  Total paneles               : ${totalPaneles}`);
  console.log(`  Tándems                     : ${numTandems} (${tandems.join(" + ")} paneles)`);
  console.log(`  Flujo total                 : ${fix2(flujoTotalPS)} GPM`);
  console.log(`  Suma carga tándems          : ${fix2(cargaAcumuladaTramos)} ft`);
  console.log(`  Carga CM (ida + regreso)    : ${fix2(cargaTotalCM)} ft`);
  console.log(`  Carga estática              : ${fix2(cargaEstaticaTotal)} ft`);
  console.log(`  Carga fricción delta PS     : ${fix2(cargaFriccionAltura)} ft`);
  console.log(`  Carga fija global (7 pies)  : ${CARGA_FIJA_FT} ft`);
  console.log(`  ──────────────────────────────────────────`);
  console.log(`  CARGA TOTAL                 : ${fix2(cargaTotal)} ft  /  ${fix2(cargaTotalPSI)} PSI`);
  console.log(`  resumenMaterialesTuberia    :`, Object.fromEntries(
    Object.entries(resumenTuberia).map(([k, v]) => [k, { ...v }])
  ));

  /* ── Resumen de materiales ── */
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
    tandems,
    numTandems,
    totalPaneles,
    flujoTotal:          fix2(flujoTotalPS),
    cargaFija_ft:        CARGA_FIJA_FT,
    cargaTramos:         fix2(cargaAcumuladaTramos),
    cargaDistanciaIda:   fix2(cargaTotalIda),
    cargaDistanciaReg:   fix2(cargaTotalRegreso),
    cargaEstatica:       fix2(cargaEstaticaTotal),
    cargaFriccionAltura: fix2(cargaFriccionAltura),
    cargaTotal:          fix2(cargaTotal),
    cargaTotalPSI:       fix2(cargaTotalPSI),
    resumenMateriales,
    resumenMaterialesTuberia,
  };
}

/* ================================================================
   SELECCIÓN AUTOMÁTICA DE PANELES SOLARES

   Calcula la cantidad exacta de paneles para cubrir la demanda.
   También calcula al 30%, 60% y 100% de la pérdida.
   ================================================================ */
function seleccionarPaneles(perdidaTotalBTU) {
  const panel = panelesSolares.find(p => p.metadata.activo);
  if (!panel) return null;

  const capUnitaria   = panel.specs.capacidadCalentamiento;
  const cantidad100   = Math.ceil(perdidaTotalBTU / capUnitaria);
  const cantidad60    = Math.ceil((perdidaTotalBTU * 0.60) / capUnitaria);
  const cantidad30    = Math.ceil((perdidaTotalBTU * 0.30) / capUnitaria);

  const cap100  = cantidad100 * capUnitaria;
  const cap60   = cantidad60  * capUnitaria;
  const cap30   = cantidad30  * capUnitaria;

  return {
    panel,
    cantidad100, capTotal100: cap100, exceso100: cap100 - perdidaTotalBTU,
    cantidad60,  capTotal60:  cap60,  exceso60:  cap60  - perdidaTotalBTU * 0.60,
    cantidad30,  capTotal30:  cap30,  exceso30:  cap30  - perdidaTotalBTU * 0.30,
  };
}

/* ================================================================
   FUNCIÓN PRINCIPAL: panelSolar()
   Selecciona cantidad automáticamente (100% de la demanda) y
   calcula la hidráulica con el flujo real de esa selección.

   Parámetros:
     perdidaTotalBTU — demanda térmica total del sistema (BTU/h)
     distanciaCM     — metros cuarto de máquinas → campo de paneles
     alturaPS        — metros paneles sobre espejo de agua
     alturaBDC       — metros BDC sobre espejo (para carga estática comparada)
   ================================================================ */
export function panelSolar(perdidaTotalBTU, distanciaCM, alturaPS, alturaBDC = 0) {

  const sel = seleccionarPaneles(perdidaTotalBTU);
  if (!sel) {
    return { error: "No hay paneles solares activos en el catálogo." };
  }

  const hidraulica100 = calcularHidraulicaPS({
    totalPaneles: sel.cantidad100,
    distanciaCM,
    alturaPS,
    alturaBDC,
    modo: "auto",
  });

  // Hidráulica a 60% y 30% (útil para mostrar opciones en UI)
  const hidraulica60 = calcularHidraulicaPS({
    totalPaneles: sel.cantidad60,
    distanciaCM,
    alturaPS,
    alturaBDC,
    modo: "auto",
  });

  const hidraulica30 = calcularHidraulicaPS({
    totalPaneles: sel.cantidad30,
    distanciaCM,
    alturaPS,
    alturaBDC,
    modo: "auto",
  });

  return {
    panel:    sel.panel,
    // Opción 100%
    seleccion: {
      porcentaje:    100,
      cantidad:      sel.cantidad100,
      capUnitaria:   sel.panel.specs.capacidadCalentamiento,
      capTotal:      sel.capTotal100,
      exceso:        fix2(sel.exceso100),
      flujoTotal:    fix2(sel.cantidad100 * FLUJO_POR_PANEL_GPM),
      tandems:       distribuirEnTandems(sel.cantidad100),
    },
    hidraulica: hidraulica100,
    // Opciones alternativas (30% / 60%)
    opciones: {
      p30: {
        porcentaje:  30,
        cantidad:    sel.cantidad30,
        capTotal:    sel.capTotal30,
        exceso:      fix2(sel.exceso30),
        flujoTotal:  fix2(sel.cantidad30 * FLUJO_POR_PANEL_GPM),
        tandems:     distribuirEnTandems(sel.cantidad30),
        hidraulica:  hidraulica30,
      },
      p60: {
        porcentaje:  60,
        cantidad:    sel.cantidad60,
        capTotal:    sel.capTotal60,
        exceso:      fix2(sel.exceso60),
        flujoTotal:  fix2(sel.cantidad60 * FLUJO_POR_PANEL_GPM),
        tandems:     distribuirEnTandems(sel.cantidad60),
        hidraulica:  hidraulica60,
      },
      p100: {
        porcentaje:  100,
        cantidad:    sel.cantidad100,
        capTotal:    sel.capTotal100,
        exceso:      fix2(sel.exceso100),
        flujoTotal:  fix2(sel.cantidad100 * FLUJO_POR_PANEL_GPM),
        tandems:     distribuirEnTandems(sel.cantidad100),
        hidraulica:  hidraulica100,
      },
    },
  };
}

/* ================================================================
   FUNCIÓN MANUAL: calcularPanelSolarManual()
   El usuario elige directamente cuántos paneles quiere instalar.
   Recalcula toda la hidráulica con esa cantidad exacta.

   Parámetros:
     totalPaneles    — cantidad elegida por el usuario
     distanciaCM     — metros cuarto de máquinas → campo de paneles
     alturaPS        — metros paneles sobre espejo de agua
     alturaBDC       — metros BDC sobre espejo (para carga estática comparada)
     perdidaTotalBTU — demanda térmica (para calcular % cubierto)
   ================================================================ */
export function calcularPanelSolarManual(totalPaneles, distanciaCM, alturaPS, alturaBDC = 0, perdidaTotalBTU = 0) {
  if (!totalPaneles || totalPaneles <= 0) {
    return { error: "Cantidad de paneles inválida." };
  }

  const panel = panelesSolares.find(p => p.metadata.activo);
  if (!panel) {
    return { error: "No hay paneles solares activos en el catálogo." };
  }

  const capTotal    = totalPaneles * panel.specs.capacidadCalentamiento;
  const exceso      = perdidaTotalBTU > 0 ? capTotal - perdidaTotalBTU : null;
  const cubre       = perdidaTotalBTU > 0 ? capTotal >= perdidaTotalBTU : null;
  const porcentaje  = perdidaTotalBTU > 0
    ? Math.round((capTotal / perdidaTotalBTU) * 100)
    : null;

  const hidraulica = calcularHidraulicaPS({
    totalPaneles,
    distanciaCM,
    alturaPS,
    alturaBDC,
    modo: "manual",
  });

  if (hidraulica?.error) return hidraulica;

  return {
    panel,
    totalPaneles,
    capUnitaria:  panel.specs.capacidadCalentamiento,
    capTotal,
    exceso:       exceso !== null ? fix2(exceso) : null,
    cubre,
    porcentaje,
    flujoTotal:   fix2(totalPaneles * FLUJO_POR_PANEL_GPM),
    tandems:      distribuirEnTandems(totalPaneles),
    hidraulica,
  };
}