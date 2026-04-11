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
const MARGEN_SHUTOFF   = 0.15;  // shut-off debe ser >= CDT * (1 + margen)
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
   Criterio primario: zona de operacion segura (margen shut-off + flujo medio)
   Si ninguna bomba cumple zona segura, relajar el criterio de flujo
   pero mantener el margen de shut-off.
   Criterio de desempate: menor cantidad de bombas -> menor potencia total.
   ================================================================ */
export function seleccionarMotobomba(flujoMaximo, cargaRequerida) {
  if (!flujoMaximo || !cargaRequerida || flujoMaximo <= 0 || cargaRequerida <= 0) {
    return { error: "Flujo maximo o CDT no disponibles. Completa dimensiones, calentamiento y equipamiento." };
  }

  const catalogo = motobombas1v.filter(b => b.curva && b.curva.length > 0);

  // Intentar primero con criterio completo (shut-off + zona flujo)
  let mejor = buscarMejor(catalogo, flujoMaximo, cargaRequerida, true);

  // Si no hay ninguna en zona segura, relajar el criterio de flujo
  // pero mantener el margen de shut-off (lo mas critico)
  if (!mejor) {
    mejor = buscarMejor(catalogo, flujoMaximo, cargaRequerida, false);
  }

  if (!mejor) {
    return { error: "Ninguna motobomba del catalogo puede cubrir el requerimiento de flujo y CDT." };
  }

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

function buscarMejor(catalogo, flujoMaximo, cargaRequerida, exigirZonaFlujo) {
  let mejor = null;

  for (const bomba of catalogo) {
    const shutOff = bomba.curva[0].carga_ft;

    // Siempre exigir margen de shut-off
    if (shutOff < cargaRequerida * (1 + MARGEN_SHUTOFF)) continue;

    const n = cantidadMinima(bomba, flujoMaximo, cargaRequerida);
    if (n == null) continue;

    const op = puntoOperacion(bomba, flujoMaximo, n);
    if (!op) continue;

    const enZona = zonaSegura(bomba, op.flujoPorBomba, cargaRequerida);
    if (exigirZonaFlujo && !enZona) continue;

    const candidato = { bomba, ...op, enZonaSegura: enZona };

    if (!mejor) {
      mejor = candidato;
      continue;
    }

    // Desempate: menos bombas -> menos potencia total -> menos HP unitario
    if (n < mejor.n) {
      mejor = candidato;
    } else if (n === mejor.n) {
      if (op.potenciaTotal < mejor.potenciaTotal) {
        mejor = candidato;
      } else if (op.potenciaTotal === mejor.potenciaTotal && bomba.potencia_hp < mejor.bomba.potencia_hp) {
        mejor = candidato;
      }
    }
  }

  return mejor;
}