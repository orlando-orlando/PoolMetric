import { calentadoresElectricos } from "../data/calentadoresElectricos";

/* ================================================================
   TABLAS HAZEN-WILLIAMS
   (idénticas a bombaDeCalor / caldera — tuberías PVC Sch40)
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

   Igual que caldera:
     • alturaVertical   — altura propia del calentador sobre el espejo de agua
     • alturaMaxSistema — máxima entre TODOS los equipos del sistema

   Regla carga estática (misma prioridad: BDC > caldera > CE > PS):
     • CE lleva carga estática solo si SU altura es la máxima Y ningún
       equipo con mayor prioridad (BDC, caldera) tiene esa misma altura.
     • El componente resuelve esto pasando alturaMaxSistema + 1000 cuando
       el CE no es el ganador.
     • Fricción y resumenTuberia siempre usan alturaVertical propia.

   Carga fija: 7 ft (igual que BDC y caldera).
   ================================================================ */
function calcularHidraulicaCE({
  flujoPorEquipo,
  cantidad,
  distanciaCM,
  alturaVertical,
  alturaMaxSistema = null,
  modo = "auto",
}) {
  const colorLog  = modo === "manual" ? "#f43f5e" : "#67e8f9";
  const labelModo = modo === "manual" ? "CE-MANUAL" : "CE-AUTO";

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
    const { tuberia, velocidad, cargaBase } = seleccionarDiametro(flujoPorEquipo);
    const longEqCodo     = CODO[tuberia] ?? CODO["tuberia 18.00"];
    const cargaTramoC    = cargaTramo(1, cargaBase);
    const cargaCodos     = (2 * longEqCodo * cargaBase) / 100;
    const cargaFilaTotal = cargaTramoC + cargaCodos;

    cargaAcumuladaTramos += cargaFilaTotal;

    console.log(`%c── [${labelModo}] CE Tramo 1 (equipo único) ─────────────────────`, `color:${colorLog};font-weight:bold`);
    console.log(`  Flujo en tramo             : ${fix2(flujoPorEquipo)} GPM`);
    console.log(`  Tubería seleccionada        : ${tuberia}`);
    console.log(`  Carga base (Hazen-Williams) : ${fix2(cargaBase)} ft/100ft`);
    console.log(`  Longitud de tubería         : 1.00 m`);
    console.log(`  Carga por tubería           : ${fix2(cargaTramoC)} ft`);
    console.log(`  Núm. codos                  : 2`);
    console.log(`  Long. eq. codo              : ${fix2(longEqCodo)} ft`);
    console.log(`  Carga por codos             : ${fix2(cargaCodos)} ft`);
    console.log(`  CARGA TOTAL TRAMO           : ${fix2(cargaFilaTotal)} ft`);

    tablaTramos.push({
      tramo: 1, flujo: fix2(flujoPorEquipo), tuberia,
      velocidad: fix2(velocidad), longitud_m: "1.00",
      cargaBase: fix2(cargaBase), cargaTramo: fix2(cargaTramoC),
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
      const flujoActual = (cantidad - i) * flujoPorEquipo;
      const esUltimo    = i === cantidad - 1;
      const { tuberia, velocidad, cargaBase } = seleccionarDiametro(flujoActual);

      const cargaTramoC = cargaTramo(1, cargaBase);
      const cantTees    = esUltimo ? 0 : 2;
      const cantCodos   = esUltimo ? 2 : 0;

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

      const cargaFilaTotal = cargaTramoC + cargaTees + cargaCodos + cargaRed;
      cargaAcumuladaTramos += cargaFilaTotal;

      console.log(`%c── [${labelModo}] CE Tramo ${i + 1} ─────────────────────────────────`, `color:${colorLog};font-weight:bold`);
      console.log(`  Flujo en tramo             : ${fix2(flujoActual)} GPM`);
      console.log(`  Tubería seleccionada        : ${tuberia}`);
      console.log(`  Carga base (Hazen-Williams) : ${fix2(cargaBase)} ft/100ft`);
      console.log(`  Longitud de tubería         : 1.00 m`);
      console.log(`  Carga por tubería           : ${fix2(cargaTramoC)} ft`);
      console.log(`  Núm. tees                   : ${cantTees}`);
      console.log(`  Long. eq. tee               : ${fix2(cantTees  > 0 ? longEqTee  : 0)} ft`);
      console.log(`  Carga por tees              : ${fix2(cargaTees)} ft`);
      console.log(`  Núm. codos                  : ${cantCodos}`);
      console.log(`  Long. eq. codo              : ${fix2(cantCodos > 0 ? longEqCodo : 0)} ft`);
      console.log(`  Carga por codos             : ${fix2(cargaCodos)} ft`);
      console.log(`  Núm. reducciones            : ${cantRed}`);
      console.log(`  Carga por reducción         : ${fix2(cargaRed)} ft`);
      console.log(`  CARGA TOTAL TRAMO           : ${fix2(cargaFilaTotal)} ft`);

      tablaTramos.push({
        tramo: i + 1, flujo: fix2(flujoActual), tuberia,
        velocidad: fix2(velocidad), longitud_m: "1.00",
        cargaBase: fix2(cargaBase), cargaTramo: fix2(cargaTramoC),
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
  const flujoTotalCE = cantidad * flujoPorEquipo;
  const { tuberia: tubCM, velocidad: velCM, cargaBase: cargaBaseCM } =
    seleccionarDiametro(flujoTotalCE);

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
  console.log(`  Flujo                       : ${fix2(flujoTotalCE)} GPM`);
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
  console.log(`  Flujo                       : ${fix2(flujoTotalCE)} GPM`);
  console.log(`  Tubería seleccionada        : ${tubCM}`);
  console.log(`  Velocidad en tubería        : ${fix2(velCM)} ft/s`);
  console.log(`  Carga base (Hazen-Williams) : ${fix2(cargaBaseCM)} ft/100ft`);
  console.log(`  Carga por tubería           : ${fix2(cargaTuberiaRegreso)} ft`);
  console.log(`  Long. eq. codo (1 codo)     : ${fix2(longEqCodoCM)} ft`);
  console.log(`  Carga por codo              : ${fix2(cargaCodoRegreso)} ft`);
  console.log(`  CARGA TOTAL REGRESO         : ${fix2(cargaTotalRegreso)} ft`);

  const tablaDistancia = {
    distancia_m: fix2(distanciaCM), flujo: fix2(flujoTotalCE),
    tuberia: tubCM, velocidad: fix2(velCM), cargaBase: fix2(cargaBaseCM),
    cargaTuberiaIda: fix2(cargaTuberiaIda), cargaCodoIda: fix2(cargaCodoIda),
    cargaTotalIda:   fix2(cargaTotalIda),
    cargaTuberiaReg: fix2(cargaTuberiaRegreso), cargaCodoReg: fix2(cargaCodoRegreso),
    cargaTotalReg:   fix2(cargaTotalRegreso),
    cantCodos: 2, longEqCodo: fix2(longEqCodoCM),
    cargaTotal: fix2(cargaTotalCM),
  };

  // CM → ambos resúmenes
  addDiam(tubCM);
  resumen[tubCM].tuberia_m += distanciaCM * 2;
  resumen[tubCM].codos     += 2;

  addDiamTuberia(tubCM);
  resumenTuberia[tubCM].tuberia_m += distanciaCM * 2;
  resumenTuberia[tubCM].codos     += 2;

  /* ── Carga estática + fricción ─────────────────────────────────
     CE lleva carga estática solo si SU altura es la máxima del sistema.
     El componente pasa alturaMaxSistema + 1000 cuando CE no es el ganador,
     haciendo que la condición abs < 0.001 sea false.
     Fricción y resumenTuberia siempre usan alturaVertical propia.
  ─────────────────────────────────────────────────────────────── */
  const alturaMaxEfectiva    = alturaMaxSistema !== null ? alturaMaxSistema : alturaVertical;
  const ceEsElMasAlto        = Math.abs(alturaVertical - alturaMaxEfectiva) < 0.001;
  const ceLlevaCargaEstatica = ceEsElMasAlto;
  const alturaVertical_ft    = alturaVertical * 3.28084;
  const cargaEstaticaAltura  = ceLlevaCargaEstatica ? (alturaMaxEfectiva * 3.28084) : 0;
  const cargaFriccionAltura  = (alturaVertical_ft * cargaBaseCM) / 100;
  const cargaTotalAltura     = cargaEstaticaAltura + cargaFriccionAltura;

  console.log(`%c── [${labelModo}] ALTURA VERTICAL CALENTADOR ELÉCTRICO ─────────`, `color:${colorLog};font-weight:bold`);
  console.log(`  Altura propia CE (m)        : ${fix2(alturaVertical)} m`);
  console.log(`  Altura máx. sistema (m)     : ${fix2(alturaMaxEfectiva)} m`);
  console.log(`  CE lleva carga estática      : ${ceLlevaCargaEstatica ? "SÍ (CE es el más alto del sistema)" : "NO (BDC, caldera o PS tiene igual o mayor altura)"}`);
  console.log(`  Carga estática              : ${fix2(cargaEstaticaAltura)} ft`);
  console.log(`  Carga fricción (tubería CE) : ${fix2(cargaFriccionAltura)} ft`);
  console.log(`  CARGA TOTAL ALTURA          : ${fix2(cargaTotalAltura)} ft`);

  const tablaAltura = {
    alturaCE_m:         fix2(alturaVertical),
    alturaMaxSist_m:    fix2(alturaMaxEfectiva),
    ceLlevaCargaEstatica,
    alturaMax_ft:       fix2(alturaMaxEfectiva * 3.28084),
    flujo:              fix2(flujoTotalCE),
    tuberia:            tubCM,
    cargaBase:          fix2(cargaBaseCM),
    cargaEstatica:      fix2(cargaEstaticaAltura),
    cargaFriccion:      fix2(cargaFriccionAltura),
    cargaTotal:         fix2(cargaTotalAltura),
  };

  // Altura propia → resumen hidráulico y pérdida de calor (siempre)
  addDiam(tubCM);
  resumen[tubCM].tuberia_m += alturaVertical * 2;

  addDiamTuberia(tubCM);
  resumenTuberia[tubCM].tuberia_m += alturaVertical * 2;

  /* ── Carga fija + total ── */
  const CARGA_FIJA_FT = 7;
  const cargaTotal    = cargaAcumuladaTramos + cargaTotalCM + cargaTotalAltura + CARGA_FIJA_FT;
  const cargaTotalPSI = cargaTotal * 0.43353;

  console.log(`%c═══ [${labelModo}] RESUMEN FINAL CALENTADOR ELÉCTRICO ══════════`, `color:${colorLog};font-weight:bold`);
  console.log(`  Suma carga tramos CE        : ${fix2(cargaAcumuladaTramos)} ft`);
  console.log(`  Carga cuarto máq. (ida)     : ${fix2(cargaTotalIda)} ft`);
  console.log(`  Carga cuarto máq. (regreso) : ${fix2(cargaTotalRegreso)} ft`);
  console.log(`  Carga estática              : ${fix2(cargaEstaticaAltura)} ft`);
  console.log(`  Carga fricción tubería CE   : ${fix2(cargaFriccionAltura)} ft`);
  console.log(`  Carga fija global (7 pies)  : ${CARGA_FIJA_FT} ft`);
  console.log(`  ──────────────────────────────────────────`);
  console.log(`  CARGA TOTAL                 : ${fix2(cargaTotal)} ft  /  ${fix2(cargaTotalPSI)} PSI`);
  console.log(`  resumenMaterialesTuberia    :`, Object.fromEntries(
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
   SELECCIÓN ÓPTIMA DE CALENTADORES ELÉCTRICOS

   Demanda = BTU por elevación de temperatura + pérdidas totales
   (reutiliza calcularBTUporElevacion de caldera.js)

   Sin eficiencia: capacidadCalentamiento es el output directo.
   ================================================================ */
function seleccionarCE(demandaTotalBTU) {
  const catalogo = calentadoresElectricos.filter(c => c.metadata.activo);
  let mejorOpcion = null;

  for (const equipo of catalogo) {
    const cap = equipo.specs.capacidadCalentamiento;
    if (cap <= 0) continue;

    const cantidad = Math.ceil(demandaTotalBTU / cap);
    const capTotal = cantidad * cap;
    const exceso   = capTotal - demandaTotalBTU;

    if (!mejorOpcion) {
      mejorOpcion = { equipo, cantidad, capTotal, exceso };
      continue;
    }

    if (cantidad < mejorOpcion.cantidad) {
      mejorOpcion = { equipo, cantidad, capTotal, exceso };
    } else if (cantidad === mejorOpcion.cantidad) {
      if (exceso < mejorOpcion.exceso) {
        mejorOpcion = { equipo, cantidad, capTotal, exceso };
      } else if (exceso === mejorOpcion.exceso && equipo.specs.flujo < mejorOpcion.equipo.specs.flujo) {
        mejorOpcion = { equipo, cantidad, capTotal, exceso };
      }
    }
  }

  return mejorOpcion;
}

/* ================================================================
   FUNCIÓN PRINCIPAL: calentadorElectrico()

   Parámetros:
     volumenM3            — volumen total del sistema en m³
     gradosCelsiusAElevar — tasa de elevación en °C/h elegida por el usuario
     perdidaTotalBTU      — pérdida térmica total ya con tubería (paso 2)
     distanciaCM          — metros cuarto de máquinas → equipo
     alturaVertical       — metros equipo sobre espejo de agua
     alturaMaxSistema     — altura máxima entre todos los equipos
                            (el componente pasa alturaMaxParaCE para desempate)
   ================================================================ */
export function calentadorElectrico(
  volumenM3,
  gradosCelsiusAElevar,
  perdidaTotalBTU,
  distanciaCM,
  alturaVertical,
  alturaMaxSistema = null
) {
  if (!volumenM3 || volumenM3 <= 0)                       return { error: "Volumen del sistema inválido." };
  if (!gradosCelsiusAElevar || gradosCelsiusAElevar <= 0) return { error: "Tasa de elevación de temperatura inválida." };

  // (BTU/°C del volumen + pérdidas) × °C/h = demanda total
  const btuPorGrado     = (volumenM3 * 1000 / 0.4535) * 1.8;
  const demandaTotalBTU = (btuPorGrado * gradosCelsiusAElevar) + perdidaTotalBTU;

  const seleccion = seleccionarCE(demandaTotalBTU);
  if (!seleccion) return { error: "Catálogo de calentadores eléctricos vacío o sin equipos activos." };

  const { equipo, cantidad } = seleccion;
  const flujoPorEquipo = equipo.specs.flujo;

  const hidraulica = calcularHidraulicaCE({
    flujoPorEquipo,
    cantidad,
    distanciaCM,
    alturaVertical,
    alturaMaxSistema,
    modo: "auto",
  });

  console.log(`%c═══ [CE-AUTO] DEMANDA TOTAL ════════════════════════════════════`, `color:#67e8f9;font-weight:bold`);
  console.log(`  Volumen sistema (m³)        : ${fix2(volumenM3)}`);
  console.log(`  Tasa elevación (°C/h)       : ${gradosCelsiusAElevar}`);
  console.log(`  BTU/°C del volumen          : ${fix2(btuPorGrado)}`);
  console.log(`  Pérdidas térmicas sistema   : ${fix2(perdidaTotalBTU)}`);
  console.log(`  BTU/°C × tasa elevación     : ${fix2(btuPorGrado)} × ${gradosCelsiusAElevar} = ${fix2(btuPorGrado * gradosCelsiusAElevar)} BTU/h`);
  console.log(`  + pérdidas térmicas         : + ${fix2(perdidaTotalBTU)} BTU/h`);
  console.log(`  DEMANDA TOTAL CE            : ${fix2(demandaTotalBTU)} BTU/h`);
  console.log(`  Equipo seleccionado         : ${equipo.marca} ${equipo.modelo} (${equipo.specs.capacidadCalentamiento.toLocaleString()} BTU/h)`);
  console.log(`  Cantidad                    : ${cantidad}`);

  return {
    btuPorGrado:     fix2(btuPorGrado),
    perdidaTotalBTU: fix2(perdidaTotalBTU),
    demandaTotalBTU: fix2(demandaTotalBTU),
    seleccion: {
      marca:           equipo.marca,
      modelo:          equipo.modelo,
      cantidad,
      capUnitaria:     equipo.specs.capacidadCalentamiento,
      flujoPorEquipo:  fix2(flujoPorEquipo),
      flujoTotal:      fix2(cantidad * flujoPorEquipo),
      capTotal:        seleccion.capTotal,
      exceso:          fix2(seleccion.exceso),
    },
    ...hidraulica,
  };
}

/* ================================================================
   FUNCIÓN MANUAL: calcularCEManual()

   Parámetros:
     equipoId             — id del equipo del catálogo
     cantidad             — número de equipos elegidos manualmente
     volumenM3            — volumen del sistema en m³
     gradosCelsiusAElevar — tasa de elevación elegida (°C/h)
     perdidaTotalBTU      — pérdida total ya con tubería
     distanciaCM          — metros CM → equipo
     alturaVertical       — metros equipo sobre espejo de agua
     alturaMaxSistema     — altura máxima (el componente pasa alturaMaxParaCE)
   ================================================================ */
export function calcularCEManual(
  equipoId,
  cantidad,
  volumenM3,
  gradosCelsiusAElevar,
  perdidaTotalBTU,
  distanciaCM,
  alturaVertical,
  alturaMaxSistema = null
) {
  if (!equipoId)                    return { error: "Equipo no especificado." };
  if (!cantidad || cantidad <= 0)   return { error: "Cantidad de equipos inválida." };

  const equipo = calentadoresElectricos.find(c => c.id === equipoId);
  if (!equipo) return { error: "Equipo no encontrado en el catálogo." };

  const btuPorGrado     = (volumenM3 * 1000 / 0.4535) * 1.8;
  const demandaTotalBTU = (btuPorGrado * gradosCelsiusAElevar) + perdidaTotalBTU;

  const capTotal   = equipo.specs.capacidadCalentamiento * cantidad;
  const exceso     = capTotal - demandaTotalBTU;
  const cubre      = capTotal >= demandaTotalBTU;
  const flujoTotal = equipo.specs.flujo * cantidad;

  const hidraulica = calcularHidraulicaCE({
    flujoPorEquipo: equipo.specs.flujo,
    cantidad,
    distanciaCM,
    alturaVertical,
    alturaMaxSistema,
    modo: "manual",
  });

  if (hidraulica?.error) return hidraulica;

  return {
    equipo,
    cantidad,
    btuPorGrado:     fix2(btuPorGrado),
    perdidaTotalBTU: fix2(perdidaTotalBTU),
    demandaTotalBTU: fix2(demandaTotalBTU),
    capUnitaria:     equipo.specs.capacidadCalentamiento,
    capTotal,
    exceso:          fix2(exceso),
    cubre,
    flujoTotal:      fix2(flujoTotal),
    hidraulica,
  };
}