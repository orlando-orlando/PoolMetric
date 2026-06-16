// Helper de UI: determina el flujo efectivo de un filtro de cartucho según el uso.
// Comercial → flujoComercial; Residencial → flujoResidencial. Solo lee specs del catálogo.
// (No es lógica de cálculo de carga; esa vive protegida en el backend.)
export function flujoEfectivo(filtro, usoGeneral) {
  if (usoGeneral === "residencial") {
    return filtro.specs.flujoResidencial > 0 ? filtro.specs.flujoResidencial : null;
  }
  return filtro.specs.flujoComercial > 0 ? filtro.specs.flujoComercial : null;
}
