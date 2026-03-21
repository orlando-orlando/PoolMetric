import { panelesSolares } from "../data/panelesSolares";

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
   CONSTANTES DE PANEL SOLAR
   ================================================================ */
const PANELES_POR_TANDEM     = 9;
const FLUJO_POR_PANEL_GPM    = 2.5;
const LONG_TUBERIA_TANDEM_M  = 6.4;
const TUBERIA_ENTRADA_TANDEM = "tuberia 1.50";

/* ================================================================
   DEDUPLICACIÓN DE LOGS
   Igual que bombaDeCalor: mismos inputs → log se emite una sola vez.
   panelSolar() llama a calcularHidraulicaPS() 3 veces (30/60/100%)
   y además se recalcula en paso1/paso2 — el Set evita todos los duplicados.
   ================================================================ */
const _loggedPS = new Set();
export function resetPSLog() { _loggedPS.clear(); }

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
   ================================================================ */
function distribuirEnTandems(totalPaneles) {
  const tandems = [];
  let restantes = totalPaneles;
  while (restantes > 0) {
    tandems.push(Math.min(restantes, PANELES_POR_TANDEM));
    restantes -= PANELES_POR_TANDEM;
  }
  return tandems;
}

/* ================================================================
   LÓGICA HIDRÁULICA PARA PANELES SOLARES

   Regla de carga estática — prioridad BDC:
     • PS solo lleva carga estática si alturaPS > alturaMaxSistema (estrictamente)
     • Si alturaPS <= alturaMaxSistema → cargaEstatica PS = 0

   Sin carga fija de 7 pies (exclusiva de BDC). PS usa 3.12 ft fijos.
   ================================================================ */
function calcularHidraulicaPS({
  totalPaneles,
  distanciaCM,
  alturaPS,
  alturaMaxSistema = null,
  modo = "auto",
}) {
  /* ── Clave de deduplicación ── */
  const logKey = `ps|${modo}|${totalPaneles}|${distanciaCM}|${alturaPS}|${alturaMaxSistema}`;
  const debeLoguear = !_loggedPS.has(logKey);
  if (debeLoguear) _loggedPS.add(logKey);

  const colorLog  = modo === "manual" ? "#fb923c" : "#34d399";
  const labelModo = modo === "manual" ? "MANUAL" : "AUTO";

  const log = debeLoguear
    ? (msg, ...args) => console.log(msg, ...args)
    : () => {};

  const tandems      = distribuirEnTandems(totalPaneles);
  const numTandems   = tandems.length;
  const flujoTotalPS = totalPaneles * FLUJO_POR_PANEL_GPM;

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

  /* ── Tramos por tándem ── */
  for (let i = 0; i < numTandems; i++) {
    const esUltimo        = i === numTandems - 1;
    const panelesEnTandem = tandems[i];
    const flujoDesdeAqui  = tandems.slice(i).reduce((s, p) => s + p * FLUJO_POR_PANEL_GPM, 0);

    const { tuberia, velocidad, cargaBase } = seleccionarDiametro(flujoDesdeAqui);
    const cargaTramoPaneles = cargaTramo(LONG_TUBERIA_TANDEM_M, cargaBase);

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

    const flujoTandem  = panelesEnTandem * FLUJO_POR_PANEL_GPM;
    const dEntrada     = DIAMETROS[TUBERIA_ENTRADA_TANDEM];
    const cargaBaseEnt =
      10.536 * 100 * Math.pow(flujoTandem, 1.852) /
      (Math.pow(dEntrada, 4.8655) * Math.pow(150, 1.852));
    const longEntrada_m = 0.05;
    const cargaEntrada  = cargaTramo(longEntrada_m, cargaBaseEnt);

    const cargaFilaTotal = cargaTramoPaneles + cargaTees + cargaCodos + cargaRed + cargaEntrada;
    cargaAcumuladaTramos += cargaFilaTotal;

    log(`%c── [${labelModo}] PS Tándem ${i + 1} (${panelesEnTandem} paneles) ─────────────────────`, `color:${colorLog};font-weight:bold`);
    log(`  Paneles en tándem           : ${panelesEnTandem}`);
    log(`  Flujo en tramo              : ${fix2(flujoDesdeAqui)} GPM`);
    log(`  Tubería seleccionada        : ${tuberia}`);
    log(`  Carga base (Hazen-Williams) : ${fix2(cargaBase)} ft/100ft`);
    log(`  Longitud tubería tándem     : ${fix2(LONG_TUBERIA_TANDEM_M)} m (fijo por tándem)`);
    log(`  Carga por tubería tándem    : ${fix2(cargaTramoPaneles)} ft`);
    log(`  Flujo tándem propio         : ${fix2(flujoTandem)} GPM (${panelesEnTandem} × 2.5)`);
    log(`  Entrada tándem (1.5", 5cm)  : ${fix2(longEntrada_m)} m → ${fix2(cargaEntrada)} ft`);
    log(`  Núm. tees                   : ${cantTees}`);
    log(`  Long. eq. tee               : ${fix2(cantTees  > 0 ? longEqTee  : 0)} ft`);
    log(`  Carga por tees              : ${fix2(cargaTees)} ft`);
    log(`  Núm. codos                  : ${cantCodos}`);
    log(`  Long. eq. codo              : ${fix2(cantCodos > 0 ? longEqCodo : 0)} ft`);
    log(`  Carga por codos             : ${fix2(cargaCodos)} ft`);
    log(`  Núm. reducciones            : ${cantRed}`);
    log(`  Carga por reducción         : ${fix2(cargaRed)} ft`);
    log(`  CARGA TOTAL TÁNDEM          : ${fix2(cargaFilaTotal)} ft`);

    tablaTramos.push({
      tandem:         i + 1,
      paneles:        panelesEnTandem,
      flujo:          fix2(flujoDesdeAqui),
      tuberia,
      velocidad:      fix2(velocidad),
      longitud_m:     fix2(LONG_TUBERIA_TANDEM_M),
      cargaBase:      fix2(cargaBase),
      cargaTramo:     fix2(cargaTramoPaneles),
      entradaTuberia: TUBERIA_ENTRADA_TANDEM,
      flujoTandem:    fix2(flujoTandem),
      entradaLong_m:  fix2(longEntrada_m),
      cargaEntrada:   fix2(cargaEntrada),
      cantTees,
      longEqTee:      fix2(cantTees  > 0 ? longEqTee  : 0),
      cargaTees:      fix2(cargaTees),
      cantCodos,
      longEqCodo:     fix2(cantCodos > 0 ? longEqCodo : 0),
      cargaCodos:     fix2(cargaCodos),
      cantRed,
      longEqRed:      fix2(longEqRed),
      cargaRed:       fix2(cargaRed),
      cargaTotal:     fix2(cargaFilaTotal),
    });

    addDiam(tuberia);
    resumen[tuberia].tuberia_m   += LONG_TUBERIA_TANDEM_M;
    resumen[tuberia].tees        += cantTees;
    resumen[tuberia].codos       += cantCodos;
    resumen[tuberia].reducciones += cantRed;

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

  log(`%c── [${labelModo}] TRAMO CUARTO DE MÁQUINAS — IDA ─────────────────`, `color:${colorLog};font-weight:bold`);
  log(`  Distancia (metros)          : ${fix2(distanciaCM)} m`);
  log(`  Distancia (pies)            : ${fix2(distCM_ft)} ft`);
  log(`  Flujo total paneles         : ${fix2(flujoTotalPS)} GPM`);
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
  log(`  Flujo total paneles         : ${fix2(flujoTotalPS)} GPM`);
  log(`  Tubería seleccionada        : ${tubCM}`);
  log(`  Carga base (Hazen-Williams) : ${fix2(cargaBaseCM)} ft/100ft`);
  log(`  Carga por tubería           : ${fix2(cargaTuberiaRegreso)} ft`);
  log(`  Long. eq. codo (1 codo)     : ${fix2(longEqCodoCM)} ft`);
  log(`  Carga por codo              : ${fix2(cargaCodoRegreso)} ft`);
  log(`  CARGA TOTAL REGRESO         : ${fix2(cargaTotalRegreso)} ft`);

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

  addDiam(tubCM);
  resumen[tubCM].tuberia_m += distanciaCM * 2;
  resumen[tubCM].codos     += 2;

  addDiamTuberia(tubCM);
  resumenTuberia[tubCM].tuberia_m += distanciaCM * 2;
  resumenTuberia[tubCM].codos     += 2;

  /* ── Carga estática + fricción ── */
  const alturaMaxEfectiva    = alturaMaxSistema !== null ? alturaMaxSistema : alturaPS;
  // PS lleva carga estática si SU altura es la máxima del sistema.
  // Si BDC o caldera empatan con PS en alturaMaxSistema, ellos tienen
  // mayor prioridad y lo declaran por su parte — aquí PS solo verifica
  // si él es el equipo con la altura máxima.
  const psEsElMasAlto        = Math.abs(alturaPS - alturaMaxEfectiva) < 0.001;
  const psLlevaCargaEstatica = psEsElMasAlto;
  const alturaPS_ft          = alturaPS * 3.28084;
  const cargaEstaticaTotal   = psLlevaCargaEstatica ? (alturaMaxEfectiva * 3.28084) : 0;
  const cargaFriccionAltura  = (alturaPS_ft * cargaBaseCM) / 100;
  const cargaTotalAltura     = cargaEstaticaTotal + cargaFriccionAltura;

  log(`%c── [${labelModo}] ALTURA VERTICAL PANELES SOLARES ─────────────`, `color:${colorLog};font-weight:bold`);
  log(`  Altura propia PS (m)        : ${fix2(alturaPS)} m = ${fix2(alturaPS_ft)} ft`);
  log(`  Altura máx. sistema (m)     : ${fix2(alturaMaxEfectiva)} m`);
  log(`  PS lleva carga estática      : ${psLlevaCargaEstatica ? "SÍ (PS es el más alto del sistema)" : "NO (BDC o caldera tiene igual o mayor altura)"}`);
  log(`  Carga estática PS           : ${fix2(cargaEstaticaTotal)} ft`);
  log(`  Carga fricción (tubería PS) : ${fix2(cargaFriccionAltura)} ft`);
  log(`  CARGA TOTAL ALTURA          : ${fix2(cargaTotalAltura)} ft`);

  const tablaAltura = {
    alturaPS_m:          fix2(alturaPS),
    alturaMaxSist_m:     fix2(alturaMaxEfectiva),
    psLlevaCargaEstatica,
    alturaPS_ft:         fix2(alturaPS_ft),
    alturaMax_ft:        fix2(alturaMaxEfectiva * 3.28084),
    flujo:               fix2(flujoTotalPS),
    tuberia:             tubCM,
    cargaBase:           fix2(cargaBaseCM),
    cargaEstatica:       fix2(cargaEstaticaTotal),
    cargaFriccion:       fix2(cargaFriccionAltura),
    cargaTotal:          fix2(cargaTotalAltura),
  };

  addDiam(tubCM);
  resumen[tubCM].tuberia_m += alturaPS * 2;

  addDiamTuberia(tubCM);
  resumenTuberia[tubCM].tuberia_m += alturaPS * 2;

  /* ── Total: carga fija PS = 3.12 ft (por equipo) ── */
  const CARGA_FIJA_FT = 3.12;
  const cargaTotal    = cargaAcumuladaTramos + cargaTotalCM + cargaTotalAltura + CARGA_FIJA_FT;
  const cargaTotalPSI = cargaTotal * 0.43353;

  log(`%c═══ [${labelModo}] RESUMEN FINAL PANEL SOLAR ═══════════════════`, `color:${colorLog};font-weight:bold`);
  log(`  Total paneles               : ${totalPaneles}`);
  log(`  Tándems                     : ${numTandems} (${tandems.join(" + ")} paneles)`);
  log(`  Flujo total                 : ${fix2(flujoTotalPS)} GPM`);
  log(`  Suma carga tándems          : ${fix2(cargaAcumuladaTramos)} ft`);
  log(`  Carga CM (ida + regreso)    : ${fix2(cargaTotalCM)} ft`);
  log(`  Carga estática PS           : ${fix2(cargaEstaticaTotal)} ft  (${psLlevaCargaEstatica ? "PS es el más alto" : "Otro equipo tiene mayor o igual altura — PS = 0"})`);
  log(`  Carga fricción tubería PS   : ${fix2(cargaFriccionAltura)} ft`);
  log(`  Carga fija por equipo PS    : ${CARGA_FIJA_FT} ft`);
  log(`  ──────────────────────────────────────────`);
  log(`  CARGA TOTAL                 : ${fix2(cargaTotal)} ft  /  ${fix2(cargaTotalPSI)} PSI`);
  log(`  resumenMaterialesTuberia    :`, Object.fromEntries(
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
   ================================================================ */
function seleccionarPaneles(perdidaTotalBTU) {
  const panel = panelesSolares.find(p => p.metadata.activo);
  if (!panel) return null;

  const capUnitaria = panel.specs.capacidadCalentamiento;
  const cantidad100 = Math.ceil(perdidaTotalBTU / capUnitaria);
  const cantidad60  = Math.ceil((perdidaTotalBTU * 0.60) / capUnitaria);
  const cantidad30  = Math.ceil((perdidaTotalBTU * 0.30) / capUnitaria);

  const cap100 = cantidad100 * capUnitaria;
  const cap60  = cantidad60  * capUnitaria;
  const cap30  = cantidad30  * capUnitaria;

  return {
    panel,
    cantidad100, capTotal100: cap100, exceso100: cap100 - perdidaTotalBTU,
    cantidad60,  capTotal60:  cap60,  exceso60:  cap60  - perdidaTotalBTU * 0.60,
    cantidad30,  capTotal30:  cap30,  exceso30:  cap30  - perdidaTotalBTU * 0.30,
  };
}

/* ================================================================
   FUNCIÓN PRINCIPAL: panelSolar()
   ================================================================ */
export function panelSolar(perdidaTotalBTU, distanciaCM, alturaPS, alturaMaxSistema = null) {

  const sel = seleccionarPaneles(perdidaTotalBTU);
  if (!sel) return { error: "No hay paneles solares activos en el catálogo." };

  const hidraulica100 = calcularHidraulicaPS({ totalPaneles: sel.cantidad100, distanciaCM, alturaPS, alturaMaxSistema, modo: "auto" });
  const hidraulica60  = calcularHidraulicaPS({ totalPaneles: sel.cantidad60,  distanciaCM, alturaPS, alturaMaxSistema, modo: "auto" });
  const hidraulica30  = calcularHidraulicaPS({ totalPaneles: sel.cantidad30,  distanciaCM, alturaPS, alturaMaxSistema, modo: "auto" });

  return {
    panel: sel.panel,
    seleccion: {
      porcentaje:  100,
      cantidad:    sel.cantidad100,
      capUnitaria: sel.panel.specs.capacidadCalentamiento,
      capTotal:    sel.capTotal100,
      exceso:      fix2(sel.exceso100),
      flujoTotal:  fix2(sel.cantidad100 * FLUJO_POR_PANEL_GPM),
      tandems:     distribuirEnTandems(sel.cantidad100),
    },
    hidraulica: hidraulica100,
    opciones: {
      p30: {
        porcentaje: 30, cantidad: sel.cantidad30, capTotal: sel.capTotal30,
        exceso: fix2(sel.exceso30), flujoTotal: fix2(sel.cantidad30 * FLUJO_POR_PANEL_GPM),
        tandems: distribuirEnTandems(sel.cantidad30), hidraulica: hidraulica30,
      },
      p60: {
        porcentaje: 60, cantidad: sel.cantidad60, capTotal: sel.capTotal60,
        exceso: fix2(sel.exceso60), flujoTotal: fix2(sel.cantidad60 * FLUJO_POR_PANEL_GPM),
        tandems: distribuirEnTandems(sel.cantidad60), hidraulica: hidraulica60,
      },
      p100: {
        porcentaje: 100, cantidad: sel.cantidad100, capTotal: sel.capTotal100,
        exceso: fix2(sel.exceso100), flujoTotal: fix2(sel.cantidad100 * FLUJO_POR_PANEL_GPM),
        tandems: distribuirEnTandems(sel.cantidad100), hidraulica: hidraulica100,
      },
    },
  };
}

/* ================================================================
   FUNCIÓN MANUAL: calcularPanelSolarManual()
   ================================================================ */
export function calcularPanelSolarManual(totalPaneles, distanciaCM, alturaPS, alturaMaxSistema = null, perdidaTotalBTU = 0) {
  if (!totalPaneles || totalPaneles <= 0) return { error: "Cantidad de paneles inválida." };

  const panel = panelesSolares.find(p => p.metadata.activo);
  if (!panel) return { error: "No hay paneles solares activos en el catálogo." };

  const capTotal   = totalPaneles * panel.specs.capacidadCalentamiento;
  const exceso     = perdidaTotalBTU > 0 ? capTotal - perdidaTotalBTU : null;
  const cubre      = perdidaTotalBTU > 0 ? capTotal >= perdidaTotalBTU : null;
  const porcentaje = perdidaTotalBTU > 0 ? Math.round((capTotal / perdidaTotalBTU) * 100) : null;

  const hidraulica = calcularHidraulicaPS({ totalPaneles, distanciaCM, alturaPS, alturaMaxSistema, modo: "manual" });
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