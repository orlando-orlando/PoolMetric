// Control central del límite de velocidad de tubería.
// Velocidad recomendada (norma): succión 4.5 ft/s, descarga 6.5 ft/s.
// Velocidad máxima (norma):       succión 6.0 ft/s, descarga 8.0 ft/s.
// Cuando una motobomba se sobredimensiona, se activa el modo máximo para
// reducir el diámetro de tubería, subir la CDT y bajar el flujo de equilibrio.

let _velMax = false;

export function setVelocidadMaxima(v) {
  _velMax = !!v;
}

export function getVelocidadMaxima() {
  return _velMax;
}

export function limSuccion() {
  return _velMax ? 6.0 : 4.5;
}

export function limDescarga() {
  return _velMax ? 8.0 : 6.5;
}