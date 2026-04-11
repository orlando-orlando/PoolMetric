import { motobombas1v } from "../data/motobombas1v";

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
   ZONA DE OPERACION SEGURA
   El flujo por bomba debe quedar en la zona entre el 15% y 85%
   del flujo maximo de la curva. Operar muy cerca del shut-off
   (flujo bajo, carga alta) genera cavitacion y desgaste.
   Operar muy a la derecha (flujo muy alto) tambien es ineficiente.

   Ademas, el shut-off de la bomba debe tener al menos un 15%
   de margen sobre el CDT requerido para que el punto de equilibrio
   no supere la curva en las iteraciones.
   ================================================================ */
const MARGEN_SHUTOFF   = 0.10;  // shut-off debe ser >= CDT * (1 + margen)
const FLUJO_MIN_FACTOR = 0.15;  // flujo por bomba >= flujoMax_curva * factor
const FLUJO_MAX_FACTOR = 0.85;  // flujo por bomba <= flujoMax_curva * factor

function zonaSegura(bomba, flujoPorBomba, cargaRequerida) {
  const curva = bomba.curva;
  if (!curva || curva.length < 2) return false;

  const flujoMaxCurva = curva[curva.length - 1].flujo_gpm;
  const shutOff       = curva[0].carga_ft;

  // Margen en shut-off: la bomba debe poder dar al menos 15% mas que el CDT requerido
  if (shutOff < cargaRequerida * (1 + MARGEN_SHUTOFF)) return false;

  // Flujo en zona media de la curva
  const flujoMin = flujoMaxCurva * FLUJO_MIN_FACTOR;
  const flujoMax = flujoMaxCurva * FLUJO_MAX_FACTOR;
  if (flujoPorBomba < flujoMin || flujoPorBomba > flujoMax) return false;

  return true;
}

export function cantidadMinima(bomba, flujoMaximo, cargaRequerida) {
  if (!bomba || !flujoMaximo || !cargaRequerida) return null;
  for (let n = 1; n <= 20; n++) {
    const flujoPorBomba = flujoMaximo / n;
    const cargaDisp     = cargaEnCurva(bomba.curva, flujoPorBomba);
    if (cargaDisp != null && cargaDisp >= cargaRequerida) return n;
  }
  return null;
}

export function puntoOperacion(bomba, flujoMaximo, n) {
  if (!bomba || !flujoMaximo || !n) return null;
  const flujoPorBomba = flujoMaximo / n;
  const cargaDisp     = cargaEnCurva(bomba.curva, flujoPorBomba);
  if (cargaDisp == null) return null;
  return {
    n,
    flujoPorBomba:   parseFloat(flujoPorBomba.toFixed(2)),
    cargaDisponible: parseFloat(cargaDisp.toFixed(2)),
    potenciaTotal:   parseFloat((n * bomba.potencia_hp).toFixed(2)),
  };
}

/* ================================================================
   SELECCION RECOMENDADA
   Criterio:
     1. Debe cubrir: cargaDisponible >= cargaRequerida con margen >= 15%
     2. Entre las que cubren: la que opera MAS CERCANA al punto de diseño
        = menor exceso de CDT relativo (cargaDisp - cargaReq) / cargaReq
        desempatando por menor cantidad de bombas, luego menor potencia total.
   ================================================================ */
export function seleccionarMotobomba(flujoMaximo, cargaRequerida) {
  if (!flujoMaximo || !cargaRequerida || flujoMaximo <= 0 || cargaRequerida <= 0) {
    return { error: "Flujo maximo o CDT no disponibles. Completa dimensiones, calentamiento y equipamiento." };
  }

  const catalogo = motobombas1v.filter(b => b.curva && b.curva.length > 0);
  const candidatos = [];

  for (const bomba of catalogo) {
    const shutOff = bomba.curva[0].carga_ft;

    // El shut-off debe superar la CDT requerida con margen del 15%
    if (shutOff < cargaRequerida * (1 + MARGEN_SHUTOFF)) continue;

    const n = cantidadMinima(bomba, flujoMaximo, cargaRequerida);
    if (n == null) continue;

    const op = puntoOperacion(bomba, flujoMaximo, n);
    if (!op) continue;

    const enZona = zonaSegura(bomba, op.flujoPorBomba, cargaRequerida);
    // Exceso relativo de CDT: 0.0 = exacto, 0.1 = 10% sobre lo requerido
    const excesoCDT = (op.cargaDisponible - cargaRequerida) / cargaRequerida;

    candidatos.push({ bomba, ...op, enZonaSegura: enZona, excesoCDT });
  }

  if (candidatos.length === 0) {
    // Sin margen de shut-off: intentar sin ese requisito
    return buscarSinMargen(catalogo, flujoMaximo, cargaRequerida);
  }

  // Ordenar: primero zona segura, luego menor exceso de CDT, luego menos bombas, luego menos potencia
  candidatos.sort((a, b) => {
    if (a.enZonaSegura !== b.enZonaSegura) return a.enZonaSegura ? -1 : 1;
    if (Math.abs(a.excesoCDT - b.excesoCDT) > 0.01) return a.excesoCDT - b.excesoCDT;
    if (a.n !== b.n) return a.n - b.n;
    return a.potenciaTotal - b.potenciaTotal;
  });

  const mejor = candidatos[0];
  return {
    bomba:           mejor.bomba,
    cantidad:        mejor.n,
    flujoPorBomba:   mejor.flujoPorBomba,
    cargaDisponible: mejor.cargaDisponible,
    potenciaTotal:   mejor.potenciaTotal,
    flujoMaximo:     parseFloat(flujoMaximo.toFixed(2)),
    cargaRequerida:  parseFloat(cargaRequerida.toFixed(2)),
    enZonaSegura:    mejor.enZonaSegura,
  };
}

function buscarSinMargen(catalogo, flujoMaximo, cargaRequerida) {
  const candidatos = [];
  for (const bomba of catalogo) {
    const n = cantidadMinima(bomba, flujoMaximo, cargaRequerida);
    if (n == null) continue;
    const op = puntoOperacion(bomba, flujoMaximo, n);
    if (!op) continue;
    const excesoCDT = (op.cargaDisponible - cargaRequerida) / cargaRequerida;
    candidatos.push({ bomba, ...op, enZonaSegura: false, excesoCDT });
  }
  if (candidatos.length === 0) {
    return { error: "Ninguna motobomba del catalogo puede cubrir el requerimiento de flujo y CDT." };
  }
  candidatos.sort((a, b) => {
    if (Math.abs(a.excesoCDT - b.excesoCDT) > 0.01) return a.excesoCDT - b.excesoCDT;
    if (a.n !== b.n) return a.n - b.n;
    return a.potenciaTotal - b.potenciaTotal;
  });
  const mejor = candidatos[0];
  return {
    bomba:           mejor.bomba,
    cantidad:        mejor.n,
    flujoPorBomba:   mejor.flujoPorBomba,
    cargaDisponible: mejor.cargaDisponible,
    potenciaTotal:   mejor.potenciaTotal,
    flujoMaximo:     parseFloat(flujoMaximo.toFixed(2)),
    cargaRequerida:  parseFloat(cargaRequerida.toFixed(2)),
    enZonaSegura:    false,
  };
}