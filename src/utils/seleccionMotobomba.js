import { motobombas1v } from "../data/motobombas1v";

/* ================================================================
   INTERPOLACIÓN LINEAL EN CURVA
   Dado un flujo de operación, devuelve la carga disponible
   interpolando entre los dos puntos más cercanos de la curva.
   Si el flujo excede el último punto de la curva → retorna null
   (la bomba no puede operar en ese punto).
   ================================================================ */
function cargaEnCurva(curva, flujo_gpm) {
  if (!curva || curva.length === 0) return null;

  // Fuera del rango por la derecha
  if (flujo_gpm > curva[curva.length - 1].flujo_gpm) return null;

  // Fuera del rango por la izquierda (flujo muy bajo → usar primer punto)
  if (flujo_gpm <= curva[0].flujo_gpm) return curva[0].carga_ft;

  // Interpolación lineal
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
   CANTIDAD MÍNIMA DE BOMBAS
   Encuentra el menor n tal que la carga disponible a
   (flujoMaximo / n) GPM ≥ cargaRequerida.
   Retorna null si ninguna cantidad lo logra (máx 20 bombas).
   ================================================================ */
export function cantidadMinima(bomba, flujoMaximo, cargaRequerida) {
  if (!bomba || !flujoMaximo || !cargaRequerida) return null;

  for (let n = 1; n <= 20; n++) {
    const flujoPorBomba = flujoMaximo / n;
    const cargaDisp     = cargaEnCurva(bomba.curva, flujoPorBomba);
    if (cargaDisp != null && cargaDisp >= cargaRequerida) return n;
  }

  return null; // no puede cubrir el requerimiento
}

/* ================================================================
   PUNTO DE OPERACIÓN
   Dado n bombas, devuelve flujo por bomba, carga disponible y
   potencia total.
   ================================================================ */
export function puntoOperacion(bomba, flujoMaximo, n) {
  if (!bomba || !flujoMaximo || !n) return null;
  const flujoPorBomba = flujoMaximo / n;
  const cargaDisp     = cargaEnCurva(bomba.curva, flujoPorBomba);
  if (cargaDisp == null) return null;
  return {
    n,
    flujoPorBomba: parseFloat(flujoPorBomba.toFixed(2)),
    cargaDisponible: parseFloat(cargaDisp.toFixed(2)),
    potenciaTotal: parseFloat((n * bomba.potencia_hp).toFixed(2)),
  };
}

/* ================================================================
   SELECCIÓN RECOMENDADA
   Criterio:
     1. Menor cantidad de bombas
     2. En empate → menor potencia total (n × HP)
     3. En empate → menor potencia unitaria
   ================================================================ */
export function seleccionarMotobomba(flujoMaximo, cargaRequerida) {
  if (!flujoMaximo || !cargaRequerida || flujoMaximo <= 0 || cargaRequerida <= 0) {
    return { error: "Flujo máximo o CDT no disponibles. Completa dimensiones, calentamiento y equipamiento." };
  }

  const catalogo = motobombas1v.filter(b => b.curva && b.curva.length > 0);
  let mejor = null;

  for (const bomba of catalogo) {
    const n = cantidadMinima(bomba, flujoMaximo, cargaRequerida);
    if (n == null) continue; // esta bomba no puede cubrir el requerimiento

    const op = puntoOperacion(bomba, flujoMaximo, n);
    if (!op) continue;

    if (!mejor) {
      mejor = { bomba, ...op };
      continue;
    }

    if (n < mejor.n) {
      mejor = { bomba, ...op };
    } else if (n === mejor.n) {
      if (op.potenciaTotal < mejor.potenciaTotal) {
        mejor = { bomba, ...op };
      } else if (op.potenciaTotal === mejor.potenciaTotal && bomba.potencia_hp < mejor.bomba.potencia_hp) {
        mejor = { bomba, ...op };
      }
    }
  }

  if (!mejor) {
    return { error: "Ninguna motobomba del catálogo puede cubrir el requerimiento de flujo y CDT." };
  }

  return {
    bomba:           mejor.bomba,
    cantidad:        mejor.n,
    flujoPorBomba:   mejor.flujoPorBomba,
    cargaDisponible: mejor.cargaDisponible,
    potenciaTotal:   mejor.potenciaTotal,
    flujoMaximo:     parseFloat(flujoMaximo.toFixed(2)),
    cargaRequerida:  parseFloat(cargaRequerida.toFixed(2)),
  };
}