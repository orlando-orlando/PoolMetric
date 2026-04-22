import { useState, useMemo, useRef, useEffect } from "react";
import "../estilos.css";
import { generadoresDeCloro }    from "../data/generadoresDeCloro";
import { cloradoresAutomaticos } from "../data/cloradoresAutomaticos";
import { generadoresUV }         from "../data/generadoresUV";
import { filtrosArena }          from "../data/filtrosArena";
import { barredoras }            from "../data/barredoras";
import { desnatadores }          from "../data/desnatadores";
import { drenesFondo }           from "../data/drenesFondo";
import { drenesCanal }           from "../data/drenesCanal";
import { retornos }              from "../data/retornos";
import { calcularCargaCloradorManual }                               from "../utils/generadorDeCloro";
import { cloradorAutomatico, calcularCargaCloradorAutomaticoManual } from "../utils/cloradorAutomatico";
import { generadorUV, calcularCargaUVManual }                       from "../utils/generadorUV";
import { filtroArena, calcularCargaFiltroArenaManual }               from "../utils/filtroArena";
import { prefiltro, calcularCargaPrefiltroManual }                   from "../utils/prefiltro";
import { filtroCartucho, calcularCargaFiltroCartuchoManual,
         flujoEfectivo }                                             from "../utils/filtroCartucho";
import { filtrosCartucho }  from "../data/filtrosCartucho";
import { prefiltros }       from "../data/prefiltros";
import { generarMemoriaCalculo } from "../utils/memoriaCalculo";
import { retorno }    from "../utils/retorno";
import { desnatador } from "../utils/desnatador";
import { barredora }  from "../utils/barredora";
import { drenFondo }  from "../utils/drenFondo";
import { drenCanal }  from "../utils/drenCanal";
import { volumen }    from "../utils/volumen";
import { seleccionarMotobomba, cantidadMinima, puntoOperacion } from "../utils/seleccionMotobomba";
import { calcularEquilibrio } from "../utils/equilibrioHidraulico";
import { motobombas1v } from "../data/motobombas1v";
import { bombasCalor }          from "../data/bombasDeCalor";
import { panelesSolares }       from "../data/panelesSolares";
import { calderasGas }          from "../data/calderasDeGas";
import { calentadoresElectricos } from "../data/calentadoresElectricos";

/* =====================================================
   HELPERS
===================================================== */
/* Helpers de nombre comercial
   "bravo-5br" → nombre="Bravo", tieneNombre=true  → muestra "Bravo" + código "5BR"
   "70xl-70xl" → nombre="70XL",  tieneNombre=false → muestra solo "70XL" sin duplicar
   "retornom-sp1421d" → nombre="Retorno", etc. con mapa de nombres correctos */
const ID_NOMBRES = {
  // Empotrables
  retornom: "Retorno", retorno: "Retorno", retornop: "Retorno",
  desnat: "Desnatador", desnate: "Desnatador", desnatacomp: "Desnatador compacto", desnatcomp: "Desnatador compacto",
  drenf: "Dren de fondo", drenfondo: "Dren de fondo",
  drenc: "Dren de canal", drencanal: "Dren de canal",
  barred: "Barredora", barredora: "Barredora",
  // Filtros
  caribbean: "Caribbean", swimclear: "SwimClear",
  multicyclone: "Multicyclone", haywardfilter: "Hayward Filter",
  // Sanitización
  sentry: "Sentry", aquarite: "AquaRite", salinec: "SalineC",
  // Calentamiento
  interheat: "InterHeat", spaheat: "SpaHeat", uniplaca: "Uniplaca",
  serie: "Serie",
  // Motobombas
  bravo: "Bravo", magnumforce: "MagnumForce", orka: "Orka",
  flopro: "FloPro", storm: "Storm", lr: "LR",
  stealth: "Stealth", tigris: "Tigris", superpump: "SuperPump",
  superii: "Super II", hcp2000: "HCP2000", hcp3000: "HCP3000",
  hcp4000: "HCP4000", tristar: "TriStar", powerflo: "PowerFlo",
};

const ncInfo = (b) => {
  if (!b?.id) return { nombre: b?.modelo ?? "", tieneNombre: false };
  const parte = b.id.split("-")[0].toLowerCase();
  // Buscar en mapa de nombres conocidos
  if (ID_NOMBRES[parte]) {
    const nombre = ID_NOMBRES[parte];
    const tieneNombre = nombre.toLowerCase() !== (b.modelo ?? "").toLowerCase();
    return { nombre, tieneNombre };
  }
  // Si el modelo empieza con el mismo texto que la parte del id → no hay nombre útil
  if (b.modelo && b.modelo.toLowerCase().startsWith(parte)) {
    return { nombre: b.modelo, tieneNombre: false };
  }
  const nombre = parte.charAt(0).toUpperCase() + parte.slice(1);
  return { nombre, tieneNombre: true };
};

const nombreComercial = (b) => ncInfo(b).nombre;
// Label completo para empotrables: "Retorno 1.5in" / "Dren de fondo 18x18in"
const labelEmpotrable = (eq) => {
  if (!eq) return "";
  const nombre = nombreComercial(eq);
  const tamano = eq.specs?.tamano;   // ej: "12x12" o "7.5"
  const puerto = eq.specs?.dimensionPuerto;  // ej: 1.5, 2, 4
  // tamano tiene prioridad — contiene el tamaño físico real del equipo
  if (tamano)         return `${nombre} ${tamano}"`;
  if (puerto != null) return `${nombre} ${puerto}"`;
  return nombre;
};
const mostrarCodigo  = (b) => ncInfo(b).tieneNombre;

function areaTotal(datosSistema) {
  if (!datosSistema || !Array.isArray(datosSistema.cuerpos)) return 0;
  return parseFloat(
    datosSistema.cuerpos.reduce((acc, c) => {
      const a = parseFloat(c.area);
      return acc + (isNaN(a) ? 0 : a);
    }, 0).toFixed(1)
  );
}

function volumenTotal(datosSistema) {
  if (!datosSistema || !Array.isArray(datosSistema.cuerpos)) return 0;
  return parseFloat(
    datosSistema.cuerpos.reduce(
      (acc, c) => acc + volumen(c, c.volumenCalculado ?? null), 0
    ).toFixed(1)
  );
}

/* =====================================================
   LÓGICA RECOMENDADO — EMPOTRABLES
===================================================== */
function recomendarRetorno(flujoMaximo, datos) {
  if (!flujoMaximo || flujoMaximo <= 0 || !datos) return null;
  try {
    const res15 = retorno(flujoMaximo, "1.5", datos);
    const tipo  = res15.resultadoR?.length > 25 ? "2.0" : "1.5";
    const res   = tipo === "1.5" ? res15 : retorno(flujoMaximo, "2.0", datos);
    if (!res?.resultadoR?.length) return null;
    const num          = res.resultadoR.length;
    const flujoPorEq   = flujoMaximo / num;
    const catalogoTipo = retornos.filter(r => r.metadata.activo && r.specs.dimensionPuerto === parseFloat(tipo));
    const equipo       = catalogoTipo.find(r => r.specs.flujo >= flujoPorEq) ?? catalogoTipo[catalogoTipo.length - 1];
    if (!equipo) return null;
    return { equipo, cantidad: num, flujoPorEquipo: parseFloat(flujoPorEq.toFixed(2)), flujoTotal: parseFloat((equipo.specs.flujo * num).toFixed(2)), tipo, res };
  } catch { return null; }
}

function recomendarDesnatador(flujoMaximo, datos) {
  if (!flujoMaximo || flujoMaximo <= 0 || !datos) return null;
  try {
    const area     = parseFloat(datos?.area) || 0;
    const catalogo = desnatadores.filter(d => d.metadata.activo && d.specs.dimensionPuerto === 2.0);
    if (!catalogo.length) return null;
    // Usar el primer equipo activo para obtener capacidad de flujo unitaria
    const equipo = catalogo[0];
    const capFlujo = equipo.specs.flujo ?? 0;
    // Cantidad mínima: el mayor entre criterio de área y criterio de flujo
    const num = cantMinDesnatador(flujoMaximo, datos, capFlujo);
    const flujoPorEq = flujoMaximo / num;
    // Recalcular hidráulica con la cantidad correcta
    const res = desnatador(flujoMaximo, "2.0", datos, num);
    if (!res?.resultadoD?.length) return null;
    return { equipo, cantidad: num, flujoPorEquipo: parseFloat(flujoPorEq.toFixed(2)), flujoTotal: parseFloat((equipo.specs.flujo * num).toFixed(2)), tipo: "2.0", res };
  } catch { return null; }
}

/* Calcula la cantidad mínima de desnatadores:
   max(ceil(area/40), ceil(flujo/capacidad_desnatador))
   La capacidad por área es 40 m² por desnatador (superficie de cobertura).
   Si el flujo unitario resultante excede la capacidad del equipo → prima el flujo.
   Se pasa la capacidad de flujo del equipo seleccionado via el prop cantMinFn
   usando un closure: cantMinFn = (flujo, datos) => cantMinDesnatador(flujo, datos, capacidad)
*/
function cantMinDesnatador(flujoMaximo, datos, capacidadFlujoPorEquipo) {
  const area = parseFloat(datos?.area) || 0;
  // Criterio 1: cobertura de área (1 desnatador por cada 40 m²)
  const numPorArea  = area > 0 ? Math.ceil(area / 40) : 2;
  // Criterio 2: flujo total / capacidad por equipo
  const numPorFlujo = capacidadFlujoPorEquipo > 0
    ? Math.max(1, Math.ceil(flujoMaximo / capacidadFlujoPorEquipo))
    : 1;
  // El más restrictivo (mayor número) manda
  return Math.max(numPorArea, numPorFlujo, 1);
}

/* Calcula la cantidad mínima de drenes de fondo:
   flujoMaximo × 2 / capacidadDren (igual que drenFondo.js) */
function cantMinDrenFondo(flujoMaximo, datos, capacidadDren) {
  if (!flujoMaximo || capacidadDren <= 0) return 2;
  let num = Math.ceil((flujoMaximo * 2) / capacidadDren);
  if (num % 2 !== 0) num++;
  return Math.max(2, num);
}

/* Calcula la cantidad mínima de barredoras por geometría del área
   (misma lógica que barredora.js) para usarla en BloqueEmpotrable */
function cantMinBarredora(flujoMaximo, datos) {
  // La cantidad de barredoras NO depende del flujo — solo de la geometría del área
  const area = parseFloat(datos?.area) || 0;
  if (area <= 0) return 1;
  const manguera = parseFloat(datos?.mangueraBarredora) || 7.5;
  const largoFinal = manguera - manguera * 0.05;
  const areaSemiCirculo = (Math.PI * largoFinal * largoFinal) / 2;
  const numA = area / areaSemiCirculo;
  const numB = Math.sqrt(area) / (largoFinal * 2);
  const num = largoFinal > Math.sqrt(area) ? numB : numA;
  return Math.max(1, Math.ceil(num));
}

function recomendarBarredora(flujoMaximo, datos) {
  if (!flujoMaximo || flujoMaximo <= 0 || !datos) return null;
  try {
    const res = barredora(flujoMaximo, "2.0", datos);
    if (!res?.resultadoB?.length) return null;
    const num        = res.resultadoB.length;
    const flujoPorEq = (flujoMaximo > 120 ? 120 : flujoMaximo) / num;
    const catalogo   = barredoras.filter(b => b.metadata.activo && b.specs.dimensionPuerto === 2.0);
    const equipo     = catalogo.find(b => b.specs.flujo >= flujoPorEq) ?? catalogo[catalogo.length - 1];
    if (!equipo) return null;
    return { equipo, cantidad: num, flujoPorEquipo: parseFloat(flujoPorEq.toFixed(2)), flujoTotal: parseFloat((equipo.specs.flujo * num).toFixed(2)), tipo: "2.0", res };
  } catch { return null; }
}

const TIPOS_VALIDOS_DREN_FONDO  = ["1.5", "2.0", "7.5", "8.0", "9.0", "12.0", "18.0"];
const TIPOS_VALIDOS_DREN_CANAL  = ["1.5", "2.0", "7.5", "8.0", "9.0"];
const TAMANO_POR_TIPO_FONDO     = { "1.5": [1.5], "2.0": [2], "7.5": [7.5], "8.0": [8], "9.0": ["9x9"], "12.0": ["12x12"], "18.0": ["18x18"] };

function recomendarDrenFondo(flujoMaximo, datos) {
  if (!flujoMaximo || flujoMaximo <= 0 || !datos) return null;
  try {
    let mejor = null;
    for (const tipo of TIPOS_VALIDOS_DREN_FONDO) {
      try {
        const res = drenFondo(flujoMaximo, tipo, datos);
        if (!res?.resultadoDF?.length) continue;
        const num = res.resultadoDF.length;
        if (!mejor || num < mejor.cantidad) {
          const flujoPorEq     = flujoMaximo / num;
          const tamanosValidos = TAMANO_POR_TIPO_FONDO[tipo] ?? [];
          const catalogo       = drenesFondo.filter(d => d.metadata.activo && tamanosValidos.some(t => String(d.specs.tamano) === String(t)));
          const equipo = catalogo.find(d => d.specs.flujo >= flujoPorEq) ?? catalogo[catalogo.length - 1];
          if (equipo) mejor = { equipo, cantidad: num, flujoPorEquipo: parseFloat(flujoPorEq.toFixed(2)), flujoTotal: parseFloat((equipo.specs.flujo * num).toFixed(2)), tipo, res };
        }
      } catch { continue; }
    }
    return mejor;
  } catch { return null; }
}

function recomendarDrenCanal(flujoMaximo, datos) {
  if (!flujoMaximo || flujoMaximo <= 0 || !datos) return null;
  try {
    let mejor = null;
    for (const tipo of TIPOS_VALIDOS_DREN_CANAL) {
      try {
        const res = drenCanal(flujoMaximo, tipo, datos);
        if (!res?.resultadoDC?.length) continue;
        const num = res.resultadoDC.length;
        if (!mejor || num < mejor.cantidad) {
          const flujoPorEq = flujoMaximo / num;
          const catalogo   = drenesCanal.filter(d => d.metadata.activo && String(d.specs.tamano) === tipo);
          const equipo = catalogo.find(d => d.specs.flujo >= flujoPorEq) ?? catalogo[catalogo.length - 1];
          if (equipo) mejor = { equipo, cantidad: num, flujoPorEquipo: parseFloat(flujoPorEq.toFixed(2)), flujoTotal: parseFloat((equipo.specs.flujo * num).toFixed(2)), tipo, res };
        }
      } catch { continue; }
    }
    return mejor;
  } catch { return null; }
}

/* =====================================================
   ICONOS SVG
===================================================== */
const IconoBombaCalor = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <rect x="3" y="14" width="22" height="20" rx="2" stroke="#7dd3fc" strokeWidth="1.5" fill="rgba(30,64,175,0.15)"/>
    <line x1="7" y1="18" x2="7" y2="30" stroke="#7dd3fc" strokeWidth="1" opacity="0.7"/>
    <line x1="10" y1="18" x2="10" y2="30" stroke="#7dd3fc" strokeWidth="1" opacity="0.7"/>
    <line x1="13" y1="18" x2="13" y2="30" stroke="#7dd3fc" strokeWidth="1" opacity="0.7"/>
    <circle cx="19" cy="24" r="4" stroke="#38bdf8" strokeWidth="1.5" fill="none"/>
    <line x1="19" y1="20" x2="19" y2="28" stroke="#38bdf8" strokeWidth="1" opacity="0.8"/>
    <line x1="15" y1="24" x2="23" y2="24" stroke="#38bdf8" strokeWidth="1" opacity="0.8"/>
    <path d="M25 20 L32 20 L32 17 L38 17" stroke="#94a3b8" strokeWidth="1.5" fill="none"/>
    <path d="M25 28 L32 28 L32 31 L38 31" stroke="#94a3b8" strokeWidth="1.5" fill="none"/>
    <rect x="38" y="13" width="7" height="22" rx="1.5" stroke="#7dd3fc" strokeWidth="1.5" fill="rgba(30,64,175,0.15)"/>
  </svg>
);
const IconoPanelSolar = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <rect x="4" y="12" width="34" height="22" rx="1.5" stroke="#7dd3fc" strokeWidth="1.5" fill="rgba(15,40,80,0.6)"/>
    <rect x="4" y="14" width="34" height="2.5" rx="0.5" fill="rgba(56,189,248,0.3)" stroke="#38bdf8" strokeWidth="0.8"/>
    <rect x="4" y="29.5" width="34" height="2.5" rx="0.5" fill="rgba(56,189,248,0.3)" stroke="#38bdf8" strokeWidth="0.8"/>
    <line x1="9"  y1="16.5" x2="9"  y2="29.5" stroke="#38bdf8" strokeWidth="1.2" opacity="0.8"/>
    <line x1="14" y1="16.5" x2="14" y2="29.5" stroke="#38bdf8" strokeWidth="1.2" opacity="0.8"/>
    <line x1="19" y1="16.5" x2="19" y2="29.5" stroke="#38bdf8" strokeWidth="1.2" opacity="0.8"/>
    <line x1="24" y1="16.5" x2="24" y2="29.5" stroke="#38bdf8" strokeWidth="1.2" opacity="0.8"/>
    <line x1="29" y1="16.5" x2="29" y2="29.5" stroke="#38bdf8" strokeWidth="1.2" opacity="0.8"/>
    <line x1="34" y1="16.5" x2="34" y2="29.5" stroke="#38bdf8" strokeWidth="1.2" opacity="0.8"/>
    <path d="M38 16 L44 16 L44 32 L38 32" stroke="#94a3b8" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="42" cy="6" r="3" fill="#fbbf24" opacity="0.9"/>
  </svg>
);
const IconoCaldera = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <rect x="10" y="10" width="20" height="26" rx="3" stroke="#7dd3fc" strokeWidth="1.5" fill="rgba(30,64,175,0.15)"/>
    <rect x="13" y="13" width="14" height="9" rx="1" stroke="#38bdf8" strokeWidth="1" fill="rgba(56,189,248,0.08)"/>
    <path d="M17 28 Q18 25 19 27 Q20 24 21 27 Q22 25 23 28" stroke="#fb923c" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <path d="M30 16 L36 16" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M30 30 L36 30" stroke="#fb923c" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IconoCalentadorElectrico = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <ellipse cx="22" cy="11" rx="10" ry="3" stroke="#7dd3fc" strokeWidth="1.5" fill="rgba(30,64,175,0.2)"/>
    <rect x="12" y="11" width="20" height="24" stroke="#7dd3fc" strokeWidth="1.5" fill="rgba(30,64,175,0.15)"/>
    <ellipse cx="22" cy="35" rx="10" ry="3" stroke="#7dd3fc" strokeWidth="1.5" fill="rgba(30,64,175,0.2)"/>
    <path d="M17 20 L17 26 Q17 28 19 28 L25 28 Q27 28 27 26 L27 20" stroke="#fb923c" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 14 L19 18 L22 18 L20 22 L25 17 L22 17 L24 14 Z" fill="#fbbf24" opacity="0.9"/>
  </svg>
);
const IconoCloradorSalino = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <rect x="8" y="14" width="32" height="20" rx="3" stroke="#34d399" strokeWidth="1.5" fill="rgba(16,185,129,0.1)"/>
    <circle cx="24" cy="24" r="6" stroke="#34d399" strokeWidth="1.5" fill="none"/>
    <line x1="24" y1="18" x2="24" y2="30" stroke="#34d399" strokeWidth="1.2" opacity="0.8"/>
    <line x1="18" y1="24" x2="30" y2="24" stroke="#34d399" strokeWidth="1.2" opacity="0.8"/>
    <rect x="12" y="10" width="6" height="4" rx="1" stroke="#6ee7b7" strokeWidth="1" fill="none"/>
    <rect x="30" y="10" width="6" height="4" rx="1" stroke="#6ee7b7" strokeWidth="1" fill="none"/>
    <line x1="15" y1="14" x2="15" y2="16" stroke="#6ee7b7" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="33" y1="14" x2="33" y2="16" stroke="#6ee7b7" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);
const IconoCloradorAutomatico = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <rect x="14" y="8" width="20" height="30" rx="3" stroke="#34d399" strokeWidth="1.5" fill="rgba(16,185,129,0.1)"/>
    <rect x="18" y="12" width="12" height="8" rx="1" stroke="#6ee7b7" strokeWidth="1" fill="rgba(16,185,129,0.15)"/>
    <circle cx="24" cy="28" r="4" stroke="#34d399" strokeWidth="1.5" fill="none"/>
    <circle cx="24" cy="28" r="1.5" fill="#34d399" opacity="0.8"/>
    <line x1="20" y1="38" x2="20" y2="42" stroke="#6ee7b7" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="28" y1="38" x2="28" y2="42" stroke="#6ee7b7" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="18" y1="42" x2="30" y2="42" stroke="#6ee7b7" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IconoLamparaUV = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <ellipse cx="24" cy="24" rx="6" ry="14" stroke="#a78bfa" strokeWidth="1.5" fill="rgba(139,92,246,0.1)"/>
    <line x1="24" y1="10" x2="24" y2="6"  stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="24" y1="38" x2="24" y2="42" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="14" y1="16" x2="10" y2="13" stroke="#a78bfa" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
    <line x1="34" y1="16" x2="38" y2="13" stroke="#a78bfa" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
    <line x1="14" y1="32" x2="10" y2="35" stroke="#a78bfa" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
    <line x1="34" y1="32" x2="38" y2="35" stroke="#a78bfa" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
    <ellipse cx="24" cy="24" rx="3" ry="8" fill="rgba(167,139,250,0.25)"/>
    <line x1="10" y1="24" x2="8"  y2="24" stroke="#a78bfa" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/>
    <line x1="38" y1="24" x2="40" y2="24" stroke="#a78bfa" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/>
  </svg>
);
const IconoRetorno = () => (
  <svg width="48" height="48" viewBox="0 0 60 48" fill="none">
    <rect x="4" y="10" width="52" height="28" rx="3" stroke="#38bdf8" strokeWidth="1.5" fill="rgba(56,189,248,0.08)"/>
    <circle cx="18" cy="24" r="5" stroke="#38bdf8" strokeWidth="1.4" fill="rgba(56,189,248,0.15)"/>
    <circle cx="18" cy="24" r="2" fill="#38bdf8" opacity="0.7"/>
    <circle cx="42" cy="24" r="5" stroke="#38bdf8" strokeWidth="1.4" fill="rgba(56,189,248,0.15)"/>
    <circle cx="42" cy="24" r="2" fill="#38bdf8" opacity="0.7"/>
    <path d="M23 24 L37 24" stroke="#38bdf8" strokeWidth="1" opacity="0.4" strokeDasharray="2 2"/>
  </svg>
);
const IconoDesnatador = () => (
  <svg width="48" height="48" viewBox="0 0 60 48" fill="none">
    <rect x="4" y="20" width="52" height="20" rx="3" stroke="#38bdf8" strokeWidth="1.5" fill="rgba(56,189,248,0.08)"/>
    <rect x="14" y="10" width="14" height="12" rx="2" stroke="#7dd3fc" strokeWidth="1.3" fill="rgba(56,189,248,0.06)"/>
    <rect x="34" y="10" width="14" height="12" rx="2" stroke="#7dd3fc" strokeWidth="1.3" fill="rgba(56,189,248,0.06)"/>
    <path d="M8 28 Q16 24 24 28 Q32 32 40 28 Q48 24 56 28" stroke="#38bdf8" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
  </svg>
);
const IconoBarredora = () => (
  <svg width="48" height="48" viewBox="0 0 60 48" fill="none">
    <rect x="4" y="10" width="52" height="28" rx="3" stroke="#38bdf8" strokeWidth="1.5" fill="rgba(56,189,248,0.08)"/>
    <circle cx="20" cy="24" r="6" stroke="#7dd3fc" strokeWidth="1.4" fill="rgba(56,189,248,0.1)"/>
    <circle cx="20" cy="24" r="2.5" fill="#7dd3fc" opacity="0.6"/>
    <circle cx="40" cy="24" r="6" stroke="#7dd3fc" strokeWidth="1.4" fill="rgba(56,189,248,0.1)"/>
    <circle cx="40" cy="24" r="2.5" fill="#7dd3fc" opacity="0.6"/>
    <path d="M14 38 L14 44" stroke="#7dd3fc" strokeWidth="1.3" strokeLinecap="round" opacity="0.6"/>
    <path d="M26 38 L26 44" stroke="#7dd3fc" strokeWidth="1.3" strokeLinecap="round" opacity="0.6"/>
    <path d="M34 38 L34 44" stroke="#7dd3fc" strokeWidth="1.3" strokeLinecap="round" opacity="0.6"/>
    <path d="M46 38 L46 44" stroke="#7dd3fc" strokeWidth="1.3" strokeLinecap="round" opacity="0.6"/>
  </svg>
);
const IconoDrenFondo = () => (
  <svg width="48" height="48" viewBox="0 0 60 48" fill="none">
    <rect x="4" y="10" width="52" height="28" rx="3" stroke="#38bdf8" strokeWidth="1.5" fill="rgba(56,189,248,0.08)"/>
    <rect x="16" y="32" width="10" height="6" rx="1.5" stroke="#7dd3fc" strokeWidth="1.3" fill="rgba(56,189,248,0.12)"/>
    <rect x="34" y="32" width="10" height="6" rx="1.5" stroke="#7dd3fc" strokeWidth="1.3" fill="rgba(56,189,248,0.12)"/>
    <line x1="21" y1="32" x2="21" y2="28" stroke="#7dd3fc" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
    <line x1="39" y1="32" x2="39" y2="28" stroke="#7dd3fc" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
    <path d="M8 24 Q20 20 30 24 Q40 28 52 24" stroke="#38bdf8" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.5"/>
  </svg>
);
const IconoDrenCanal = () => (
  <svg width="48" height="48" viewBox="0 0 60 48" fill="none">
    <rect x="4" y="18" width="52" height="22" rx="3" stroke="#38bdf8" strokeWidth="1.5" fill="rgba(56,189,248,0.08)"/>
    <rect x="4" y="14" width="52" height="6" rx="2" stroke="#7dd3fc" strokeWidth="1.3" fill="rgba(56,189,248,0.12)"/>
    <rect x="16" y="34" width="8" height="6" rx="1.5" stroke="#7dd3fc" strokeWidth="1.2" fill="rgba(56,189,248,0.1)"/>
    <rect x="36" y="34" width="8" height="6" rx="1.5" stroke="#7dd3fc" strokeWidth="1.2" fill="rgba(56,189,248,0.1)"/>
    <line x1="20" y1="34" x2="20" y2="30" stroke="#7dd3fc" strokeWidth="1.1" strokeLinecap="round" opacity="0.6"/>
    <line x1="40" y1="34" x2="40" y2="30" stroke="#7dd3fc" strokeWidth="1.1" strokeLinecap="round" opacity="0.6"/>
  </svg>
);
const IconoFiltroArena = () => (
  <svg width="48" height="48" viewBox="0 0 60 48" fill="none">
    <ellipse cx="30" cy="12" rx="16" ry="5" stroke="#38bdf8" strokeWidth="1.5" fill="rgba(56,189,248,0.1)"/>
    <rect x="14" y="12" width="32" height="22" stroke="#38bdf8" strokeWidth="1.5" fill="rgba(56,189,248,0.08)"/>
    <ellipse cx="30" cy="34" rx="16" ry="5" stroke="#38bdf8" strokeWidth="1.5" fill="rgba(56,189,248,0.1)"/>
    <ellipse cx="30" cy="28" rx="12" ry="3" fill="rgba(251,191,36,0.25)" stroke="#fbbf24" strokeWidth="0.8"/>
    <line x1="18" y1="25" x2="42" y2="25" stroke="#fbbf24" strokeWidth="0.7" opacity="0.4"/>
    <line x1="18" y1="22" x2="42" y2="22" stroke="#fbbf24" strokeWidth="0.7" opacity="0.3"/>
    <line x1="30" y1="7" x2="30" y2="3" stroke="#7dd3fc" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="30" y1="39" x2="30" y2="43" stroke="#7dd3fc" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IconoPrefiltro = () => (
  <svg width="48" height="48" viewBox="0 0 60 48" fill="none">
    <ellipse cx="30" cy="12" rx="14" ry="4" stroke="#7dd3fc" strokeWidth="1.5" fill="rgba(125,211,252,0.08)"/>
    <rect x="16" y="12" width="28" height="20" stroke="#7dd3fc" strokeWidth="1.5" fill="rgba(125,211,252,0.06)"/>
    <ellipse cx="30" cy="32" rx="14" ry="4" stroke="#7dd3fc" strokeWidth="1.5" fill="rgba(125,211,252,0.08)"/>
    <line x1="20" y1="16" x2="20" y2="28" stroke="#7dd3fc" strokeWidth="0.9" opacity="0.5"/>
    <line x1="25" y1="16" x2="25" y2="28" stroke="#7dd3fc" strokeWidth="0.9" opacity="0.5"/>
    <line x1="30" y1="16" x2="30" y2="28" stroke="#7dd3fc" strokeWidth="0.9" opacity="0.5"/>
    <line x1="35" y1="16" x2="35" y2="28" stroke="#7dd3fc" strokeWidth="0.9" opacity="0.5"/>
    <line x1="40" y1="16" x2="40" y2="28" stroke="#7dd3fc" strokeWidth="0.9" opacity="0.5"/>
    <line x1="16" y1="19" x2="44" y2="19" stroke="#7dd3fc" strokeWidth="0.9" opacity="0.5"/>
    <line x1="16" y1="24" x2="44" y2="24" stroke="#7dd3fc" strokeWidth="0.9" opacity="0.5"/>
    <line x1="30" y1="8" x2="30" y2="4" stroke="#7dd3fc" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="30" y1="36" x2="30" y2="40" stroke="#7dd3fc" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IconoFiltroCartucho = () => (
  <svg width="48" height="48" viewBox="0 0 60 48" fill="none">
    <ellipse cx="30" cy="10" rx="12" ry="4" stroke="#a78bfa" strokeWidth="1.5" fill="rgba(167,139,250,0.08)"/>
    <rect x="18" y="10" width="24" height="26" stroke="#a78bfa" strokeWidth="1.5" fill="rgba(167,139,250,0.06)"/>
    <ellipse cx="30" cy="36" rx="12" ry="4" stroke="#a78bfa" strokeWidth="1.5" fill="rgba(167,139,250,0.08)"/>
    <path d="M22 14 Q26 17 30 14 Q34 11 38 14" stroke="#a78bfa" strokeWidth="1" fill="none" opacity="0.6" strokeLinecap="round"/>
    <path d="M22 20 Q26 23 30 20 Q34 17 38 20" stroke="#a78bfa" strokeWidth="1" fill="none" opacity="0.6" strokeLinecap="round"/>
    <path d="M22 26 Q26 29 30 26 Q34 23 38 26" stroke="#a78bfa" strokeWidth="1" fill="none" opacity="0.6" strokeLinecap="round"/>
    <path d="M22 32 Q26 35 30 32 Q34 29 38 32" stroke="#a78bfa" strokeWidth="1" fill="none" opacity="0.6" strokeLinecap="round"/>
    <line x1="30" y1="6" x2="30" y2="3" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="30" y1="40" x2="30" y2="44" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IconoMotobomba = () => (
  <svg width="48" height="48" viewBox="0 0 60 48" fill="none">
    <ellipse cx="22" cy="24" rx="14" ry="14" stroke="#38bdf8" strokeWidth="1.5" fill="rgba(56,189,248,0.08)"/>
    <ellipse cx="22" cy="24" rx="7" ry="7" stroke="#7dd3fc" strokeWidth="1.2" fill="rgba(56,189,248,0.12)"/>
    <line x1="22" y1="17" x2="22" y2="13" stroke="#7dd3fc" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
    <line x1="22" y1="31" x2="22" y2="35" stroke="#7dd3fc" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
    <line x1="15" y1="24" x2="11" y2="24" stroke="#7dd3fc" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
    <line x1="29" y1="24" x2="33" y2="24" stroke="#7dd3fc" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
    <rect x="36" y="16" width="20" height="16" rx="2" stroke="#38bdf8" strokeWidth="1.5" fill="rgba(56,189,248,0.06)"/>
    <line x1="40" y1="20" x2="40" y2="28" stroke="#7dd3fc" strokeWidth="0.9" opacity="0.5"/>
    <line x1="44" y1="20" x2="44" y2="28" stroke="#7dd3fc" strokeWidth="0.9" opacity="0.5"/>
    <line x1="48" y1="20" x2="48" y2="28" stroke="#7dd3fc" strokeWidth="0.9" opacity="0.5"/>
    <line x1="52" y1="20" x2="52" y2="28" stroke="#7dd3fc" strokeWidth="0.9" opacity="0.5"/>
    <line x1="33" y1="24" x2="36" y2="24" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round"/>
    <line x1="8"  y1="24" x2="4"  y2="24" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="22" y1="10" x2="22" y2="6"  stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);
const IconoCheck = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 7L5.5 10.5L12 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* =====================================================
   TARJETA SOLO LECTURA — calentamiento
===================================================== */
function TarjetaCalentamientoReadonly({ icono, label, modo, marca, modelo, id, capUnitaria, cantidad, flujoTotal, cargaTotal, cargaTotalPSI }) {
  const eqObj = { id, marca, modelo };
  const fmtBTU = (v) => v ? Math.round(parseFloat(v)).toLocaleString("es-MX") + " BTU/h" : null;
  return (
    <div className="bdc-recomendada-card bdc-inset">
      <div className="bdc-rec-header">
        {icono}
        <div className="bdc-rec-titulo">
          <span className="bdc-rec-label">{label}</span>
          <span className="bdc-rec-modelo">{marca} · {nombreComercial(eqObj)}{capUnitaria && <span style={{color:"#7dd3fc",fontSize:"0.82em"}}> {fmtBTU(capUnitaria)}</span>}{mostrarCodigo(eqObj) && <span style={{color:"#94a3b8",fontSize:"0.8em"}}> {modelo}</span>}</span>
        </div>
        <span className={`bdc-modo-badge ${modo === "manual" ? "badge-manual" : "badge-auto"}`}>
          {modo === "manual" ? "Manual" : "Auto"}
        </span>
      </div>
      <div className="bdc-rec-stats">
        <div className="bdc-stat"><span className="bdc-stat-valor">{cantidad}</span><span className="bdc-stat-label">equipos</span></div>
        <div className="bdc-stat-sep" />
        <div className="bdc-stat"><span className="bdc-stat-valor">{parseFloat(flujoTotal).toFixed(1)}</span><span className="bdc-stat-label">GPM total</span></div>
        <div className="bdc-stat-sep" />
        <div className="bdc-stat"><span className="bdc-stat-valor">{cargaTotal}</span><span className="bdc-stat-label">ft CDT</span></div>
        <div className="bdc-stat-sep" />
        <div className="bdc-stat"><span className="bdc-stat-valor">{cargaTotalPSI}</span><span className="bdc-stat-label">PSI</span></div>
      </div>
      <div className="tarjeta-readonly-footer">
        Configurable en <span className="tarjeta-readonly-link">Calentamiento →</span>
      </div>
    </div>
  );
}

/* =====================================================
   HELPER — extrae info calentamiento
===================================================== */
function extraerInfoCalentamiento(calentamiento) {
  if (!calentamiento) return [];
  const { sistemasSeleccionados = {} } = calentamiento;
  const equipos = [];
  if (sistemasSeleccionados.bombaCalor) {
    const modo = calentamiento.modoBDC ?? "recomendado";
    const src  = modo === "manual" && calentamiento.bdcManual && !calentamiento.bdcManual.error
      ? { id: calentamiento.bdcManual.bomba?.id ?? bombasCalor.find(b=>b.marca===calentamiento.bdcManual.bomba?.marca&&b.modelo===calentamiento.bdcManual.bomba?.modelo)?.id, marca: calentamiento.bdcManual.bomba?.marca, modelo: calentamiento.bdcManual.bomba?.modelo, capUnitaria: calentamiento.bdcManual.bomba?.specs?.capacidadCalentamiento, cantidad: calentamiento.bdcManual.cantidad, flujoTotal: calentamiento.bdcManual.flujoTotal, cargaTotal: calentamiento.bdcManual.hidraulica?.cargaTotal, cargaTotalPSI: calentamiento.bdcManual.hidraulica?.cargaTotalPSI }
      : calentamiento.bdcSeleccionada && !calentamiento.bdcSeleccionada.error
      ? { id: calentamiento.bdcSeleccionada.seleccion?.id ?? bombasCalor.find(b=>b.marca===calentamiento.bdcSeleccionada.seleccion?.marca&&b.modelo===calentamiento.bdcSeleccionada.seleccion?.modelo)?.id, marca: calentamiento.bdcSeleccionada.seleccion?.marca, modelo: calentamiento.bdcSeleccionada.seleccion?.modelo, capUnitaria: calentamiento.bdcSeleccionada.seleccion?.capUnitaria, cantidad: calentamiento.bdcSeleccionada.seleccion?.cantidad, flujoTotal: calentamiento.bdcSeleccionada.seleccion?.flujoTotal, cargaTotal: calentamiento.bdcSeleccionada.cargaTotal, cargaTotalPSI: calentamiento.bdcSeleccionada.cargaTotalPSI }
      : null;
    if (src?.marca) equipos.push({ key: "bombaCalor", label: "Bomba de calor", icono: <IconoBombaCalor />, modo, id: src.id, ...src });
  }
  if (sistemasSeleccionados.panelSolar) {
    const modo = calentamiento.modoPS ?? "recomendado";
    const src  = modo === "manual" && calentamiento.psManual && !calentamiento.psManual.error
      ? { id: calentamiento.psManual.panel?.id ?? panelesSolares.find(p=>p.marca===calentamiento.psManual.panel?.marca&&p.modelo===calentamiento.psManual.panel?.modelo)?.id, marca: calentamiento.psManual.panel?.marca, modelo: calentamiento.psManual.panel?.modelo, capUnitaria: calentamiento.psManual.panel?.specs?.capacidadCalentamiento, cantidad: calentamiento.psManual.totalPaneles, flujoTotal: calentamiento.psManual.flujoTotal, cargaTotal: calentamiento.psManual.hidraulica?.cargaTotal, cargaTotalPSI: calentamiento.psManual.hidraulica?.cargaTotalPSI }
      : calentamiento.psSeleccionado && !calentamiento.psSeleccionado.error
      ? { id: calentamiento.psSeleccionado.panel?.id ?? panelesSolares.find(p=>p.marca===calentamiento.psSeleccionado.panel?.marca&&p.modelo===calentamiento.psSeleccionado.panel?.modelo)?.id, marca: calentamiento.psSeleccionado.panel?.marca, modelo: calentamiento.psSeleccionado.panel?.modelo, capUnitaria: calentamiento.psSeleccionado.panel?.specs?.capacidadCalentamiento, cantidad: calentamiento.psSeleccionado.seleccion?.cantidad, flujoTotal: calentamiento.psSeleccionado.seleccion?.flujoTotal, cargaTotal: calentamiento.psSeleccionado.hidraulica?.cargaTotal, cargaTotalPSI: calentamiento.psSeleccionado.hidraulica?.cargaTotalPSI }
      : null;
    if (src?.marca) equipos.push({ key: "panelSolar", label: "Panel solar", icono: <IconoPanelSolar />, modo, id: src.id, ...src });
  }
  if (sistemasSeleccionados.caldera) {
    const modo = calentamiento.modoCaldera ?? "recomendado";
    const src  = modo === "manual" && calentamiento.calderaManual && !calentamiento.calderaManual.error
      ? { id: calentamiento.calderaManual.caldera?.id ?? calderasGas.find(c=>c.marca===calentamiento.calderaManual.caldera?.marca&&c.modelo===calentamiento.calderaManual.caldera?.modelo)?.id, marca: calentamiento.calderaManual.caldera?.marca, modelo: calentamiento.calderaManual.caldera?.modelo, capUnitaria: calentamiento.calderaManual.caldera?.specs?.capacidadCalentamiento, cantidad: calentamiento.calderaManual.cantidad, flujoTotal: calentamiento.calderaManual.flujoTotal, cargaTotal: calentamiento.calderaManual.hidraulica?.cargaTotal, cargaTotalPSI: calentamiento.calderaManual.hidraulica?.cargaTotalPSI }
      : calentamiento.calderaSeleccionada && !calentamiento.calderaSeleccionada.error
      ? { id: calentamiento.calderaSeleccionada.seleccion?.id ?? calderasGas.find(c=>c.marca===calentamiento.calderaSeleccionada.seleccion?.marca&&c.modelo===calentamiento.calderaSeleccionada.seleccion?.modelo)?.id, marca: calentamiento.calderaSeleccionada.seleccion?.marca, modelo: calentamiento.calderaSeleccionada.seleccion?.modelo, capUnitaria: calentamiento.calderaSeleccionada.seleccion?.capOutputUnitario, cantidad: calentamiento.calderaSeleccionada.seleccion?.cantidad, flujoTotal: calentamiento.calderaSeleccionada.seleccion?.flujoTotal, cargaTotal: calentamiento.calderaSeleccionada.cargaTotal, cargaTotalPSI: calentamiento.calderaSeleccionada.cargaTotalPSI }
      : null;
    if (src?.marca) equipos.push({ key: "caldera", label: "Caldera de gas", icono: <IconoCaldera />, modo, id: src.id, ...src });
  }
  if (sistemasSeleccionados.calentadorElectrico) {
    const modo = calentamiento.modoCE ?? "recomendado";
    const src  = modo === "manual" && calentamiento.ceManual && !calentamiento.ceManual.error
      ? { id: calentamiento.ceManual.equipo?.id ?? calentadoresElectricos.find(e=>e.marca===calentamiento.ceManual.equipo?.marca&&e.modelo===calentamiento.ceManual.equipo?.modelo)?.id, marca: calentamiento.ceManual.equipo?.marca, modelo: calentamiento.ceManual.equipo?.modelo, capUnitaria: calentamiento.ceManual.equipo?.specs?.capacidadCalentamiento, cantidad: calentamiento.ceManual.cantidad, flujoTotal: calentamiento.ceManual.flujoTotal, cargaTotal: calentamiento.ceManual.hidraulica?.cargaTotal, cargaTotalPSI: calentamiento.ceManual.hidraulica?.cargaTotalPSI }
      : calentamiento.ceSeleccionado && !calentamiento.ceSeleccionado.error
      ? { id: calentamiento.ceSeleccionado.seleccion?.id ?? calentadoresElectricos.find(e=>e.marca===calentamiento.ceSeleccionado.seleccion?.marca&&e.modelo===calentamiento.ceSeleccionado.seleccion?.modelo)?.id, marca: calentamiento.ceSeleccionado.seleccion?.marca, modelo: calentamiento.ceSeleccionado.seleccion?.modelo, capUnitaria: calentamiento.ceSeleccionado.seleccion?.capUnitaria, cantidad: calentamiento.ceSeleccionado.seleccion?.cantidad, flujoTotal: calentamiento.ceSeleccionado.seleccion?.flujoTotal, cargaTotal: calentamiento.ceSeleccionado.cargaTotal, cargaTotalPSI: calentamiento.ceSeleccionado.cargaTotalPSI }
      : null;
    if (src?.marca) equipos.push({ key: "calentadorElectrico", label: "Calentador eléctrico", icono: <IconoCalentadorElectrico />, modo, id: src.id, ...src });
  }
  return equipos;
}

const TAMANO_A_TIPO_CALCULO = { "9x9": "9.0", "12x12": "12.0", "18x18": "18.0" };
function tipoParaCalculo(eq) {
  const raw = String(eq.specs.tamano ?? eq.specs.dimensionPuerto ?? "");
  return TAMANO_A_TIPO_CALCULO[raw] ?? raw;
}

/* =====================================================
   BLOQUE EMPOTRABLE GENÉRICO
===================================================== */
function BloqueEmpotrable({ icono, titulo, rec, catalogo, flujoMaximo, datos, fnCalculo, mostrarPuerto = true, mostrarTamano = false, onCargaChange = null, onEstadoChange = null, cantMinFn = null, cantMinMultiplier = 1 }) {
  const [modo, setModo]               = useState("recomendado");
  const [selId, setSelId]             = useState(null);
  const [selCant, setSelCant]         = useState(null);
  const [filtroMarca, setFiltroMarca] = useState("todas");
  const fnCalcRef = useRef(fnCalculo);
  fnCalcRef.current = fnCalculo;

  const marcas          = useMemo(() => ["todas", ...new Set(catalogo.filter(e => e.metadata.activo).map(e => e.marca))], [catalogo]);
  const catalogoFiltrado = useMemo(() => catalogo.filter(e => e.metadata.activo && (filtroMarca === "todas" || e.marca === filtroMarca)), [catalogo, filtroMarca]);

  // Calcula el mínimo dado un equipo (o el seleccionado si no se pasa)
  const calcMin = (eqId) => {
    const id = eqId ?? selId;
    if (!id || !flujoMaximo) return 2;
    const eq = catalogo.find(e => e.id === id);
    if (!eq) return 2;
    if (cantMinFn && datos) {
      const cap = eq.specs.flujo ?? eq.specs.maxFlow ?? 0;
      return cantMinFn(flujoMaximo, datos, cap);
    }
    const flujoEq = eq.specs.flujo ?? eq.specs.maxFlow ?? 0;
    if (flujoEq <= 0) return 2;
    let num = Math.ceil((flujoMaximo * cantMinMultiplier) / flujoEq);
    if (cantMinMultiplier > 1 && num % 2 !== 0) num++;
    return Math.max(1, num);  // mínimo 1, no forzar 2
  };
  const cantMinima = calcMin();

  const handleSelEquipo = (id) => {
    if (selId === id) { setSelId(null); setSelCant(null); return; }
    setSelId(id);
    setSelCant(calcMin(id));
  };

  let manualCalc = null;
  if (selId && selCant && flujoMaximo && datos) {
    const eq = catalogo.find(e => e.id === selId);
    if (eq) {
      try {
        const tipo = tipoParaCalculo(eq);
        const res  = fnCalcRef.current(flujoMaximo, tipo, datos, selCant);
        manualCalc = { equipo: eq, cantidad: selCant, flujoPorEquipo: parseFloat((flujoMaximo / selCant).toFixed(2)), flujoTotal: parseFloat((eq.specs.flujo * selCant).toFixed(2)), res };
      } catch { manualCalc = null; }
    }
  }

  const infoActiva    = modo === "recomendado" ? rec : manualCalc;
  // sumaFinal incluye tramos + CM + disparos, pero NO el +1.5 ft de accesorio del empotrable
  const cargaActivaFt = infoActiva?.res?.sumaFinal != null
    ? parseFloat(infoActiva.res.sumaFinal) + 1.5
    : null;
  const estadoActual  = infoActiva ? { modo, selId: infoActiva.equipo?.id ?? null, cantidad: infoActiva.cantidad, tipo: infoActiva.equipo ? tipoParaCalculo(infoActiva.equipo) : null, marca: infoActiva.equipo?.marca ?? null, modelo: infoActiva.equipo?.modelo ?? null } : null;

  // Si el mínimo sube (ej. cambió el flujo), ajustar selCant
  useEffect(() => {
    if (selCant !== null && selCant < cantMinima) setSelCant(cantMinima);
  }, [cantMinima]);

  useEffect(() => { if (onCargaChange) onCargaChange(cargaActivaFt); }, [cargaActivaFt]);
  useEffect(() => { if (onEstadoChange) onEstadoChange(estadoActual); }, [JSON.stringify(estadoActual)]);

  if (!flujoMaximo || flujoMaximo <= 0) return <div className="sanitizacion-pendiente">Completa las dimensiones para calcular el flujo máximo del sistema</div>;

  return (
    <div className="sanitizacion-bloque-equipo">
      <div className="bdc-modo-toggle-wrapper">
        <div className="bdc-modo-toggle">
          <button type="button" className={`bdc-modo-btn ${modo === "recomendado" ? "bdc-modo-activo" : ""}`} onClick={() => setModo("recomendado")}>{modo === "recomendado" && <IconoCheck />}<span>Recomendado</span></button>
          <button type="button" className={`bdc-modo-btn ${modo === "manual" ? "bdc-modo-activo" : ""}`} onClick={() => setModo("manual")}>{modo === "manual" && <IconoCheck />}<span>Selección manual</span></button>
        </div>
      </div>
      <div style={{ fontSize: "0.7rem", color: "#94a3b8", padding: "0.25rem 0.5rem 0.5rem" }}>
        Flujo máximo del sistema: <span style={{ color: "#38bdf8", fontWeight: 600 }}>{parseFloat(flujoMaximo).toFixed(1)} GPM</span>
      </div>
      <div className="layout-clima-bdc-fila2" style={{ marginTop: 0 }}>
        <div className="layout-clima-bdc-celda celda-bdc-rec">
          {infoActiva ? (
            <div className={`bdc-recomendada-card bdc-inset ${modo === "manual" ? "bdc-card-manual-activa" : ""}`}>
              <div className="bdc-rec-header">{icono}<div className="bdc-rec-titulo"><span className="bdc-rec-label">{modo === "recomendado" ? "Recomendado" : "Manual"}</span><span className="bdc-rec-modelo">{infoActiva.equipo.marca} · {labelEmpotrable(infoActiva.equipo)}{mostrarCodigo(infoActiva.equipo) && <span style={{color:"#94a3b8",fontSize:"0.8em"}}> {infoActiva.equipo.modelo}</span>}</span></div><span className={`bdc-modo-badge ${modo === "manual" ? "badge-manual" : "badge-auto"}`}>{modo === "manual" ? "Manual" : "Auto"}</span></div>
              <div className="bdc-rec-stats">
                <div className="bdc-stat"><span className="bdc-stat-valor">{infoActiva.cantidad}</span><span className="bdc-stat-label">equipos</span></div>
                <div className="bdc-stat-sep" />
                <div className="bdc-stat"><span className="bdc-stat-valor">{parseFloat(infoActiva.flujoPorEquipo).toFixed(1)}</span><span className="bdc-stat-label">GPM/equipo</span></div>
                <div className="bdc-stat-sep" />
                <div className="bdc-stat"><span className="bdc-stat-valor">{parseFloat(infoActiva.flujoTotal).toFixed(1)}</span><span className="bdc-stat-label">GPM total</span></div>
              </div>
              <div className="bdc-rec-demanda">
                {mostrarPuerto && <div className="bdc-demanda-fila"><span className="bdc-demanda-label">Puerto</span><span className="bdc-demanda-valor">{infoActiva.equipo.specs.dimensionPuerto}"</span></div>}
                {mostrarTamano && infoActiva.equipo.specs.tamano != null && <div className="bdc-demanda-fila"><span className="bdc-demanda-label">Tamaño</span><span className="bdc-demanda-valor">{infoActiva.equipo.specs.tamano}"</span></div>}
                <div className="bdc-demanda-fila"><span className="bdc-demanda-label">Flujo nominal</span><span className="bdc-demanda-valor bdc-ok">{infoActiva.equipo.specs.flujo} GPM</span></div>
                <div className="bdc-demanda-fila"><span className="bdc-demanda-label">Flujo sistema</span><span className="bdc-demanda-valor">{parseFloat(flujoMaximo).toFixed(1)} GPM</span></div>
              </div>
              {infoActiva.res?.sumaFinal != null && <div className="bdc-rec-hidraulica"><span className="bdc-hid-label">Pérdida de carga total</span><span className="bdc-hid-valor">{(parseFloat(infoActiva.res.sumaFinal) + 1.5).toFixed(2)} ft</span></div>}
            </div>
          ) : (
            <div className="bdc-recomendada-card bdc-pendiente bdc-inset"><div className="bdc-rec-header">{icono}<div className="bdc-rec-titulo"><span className="bdc-rec-label">{titulo}</span><span className="bdc-rec-modelo bdc-pendiente-txt">{modo === "recomendado" ? "Calculando selección..." : "Selecciona un equipo del catálogo"}</span></div></div></div>
          )}
        </div>
        <div className="layout-clima-bdc-celda celda-bdc-manual">
          {modo === "recomendado" && rec && (
            <div className="bdc-info-automatica bdc-inset">
              <div className="bdc-manual-header"><span className="bdc-manual-titulo">Detalle de selección automática</span></div>
              <div className="bdc-auto-detalle">
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Marca</span><span className="bdc-auto-val">{rec.equipo.marca}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Nombre</span><span className="bdc-auto-val">{labelEmpotrable(rec.equipo)}</span></div><div className="bdc-auto-fila"><span className="bdc-auto-label">Código</span><span className="bdc-auto-val" style={{color:"#64748b"}}>{rec.equipo.modelo}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Cantidad</span><span className="bdc-auto-val">{rec.cantidad} equipo{rec.cantidad > 1 ? "s" : ""}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Flujo por equipo requerido</span><span className="bdc-auto-val">{parseFloat(rec.flujoPorEquipo).toFixed(2)} GPM</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Flujo nominal</span><span className="bdc-auto-val">{rec.equipo.specs.flujo} GPM</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Puerto</span><span className="bdc-auto-val">{rec.equipo.specs.dimensionPuerto}"</span></div>
                {rec.equipo.specs.tamano != null && <div className="bdc-auto-fila"><span className="bdc-auto-label">Tamaño</span><span className="bdc-auto-val">{rec.equipo.specs.tamano}"</span></div>}
                {rec.tipo && <div className="bdc-auto-fila"><span className="bdc-auto-label">Tipo calculado</span><span className="bdc-auto-val">{rec.tipo}"</span></div>}
                {rec.res?.sumaFinal != null && (<><div className="bdc-auto-sep" /><div className="bdc-auto-fila bdc-auto-total"><span className="bdc-auto-label">Pérdida de carga</span><span className="bdc-auto-val bdc-hid-val-highlight">{(parseFloat(rec.res.sumaFinal) + 1.5).toFixed(2)} ft</span></div></>)}
              </div>
            </div>
          )}
          {modo === "manual" && (
            <div className="bdc-selector-manual bdc-inset">
              <div className="bdc-manual-header"><span className="bdc-manual-titulo">Catálogo — {titulo}</span></div>
              <div className="bdc-manual-filtros"><div className="campo"><label>Marca</label><select value={filtroMarca} onChange={e => setFiltroMarca(e.target.value)}>{marcas.map(m => <option key={m} value={m}>{m === "todas" ? "Todas las marcas" : m}</option>)}</select></div></div>
              <div className="bdc-manual-lista">
                {catalogoFiltrado.map(eq => {
                  const esRec   = rec && eq.id === rec.equipo.id;
                  const sel     = selId === eq.id;
                  const minEste = calcMin(eq.id);
                  return (
                    <div key={eq.id} className={`bdc-manual-fila ${sel ? "bdc-manual-fila-activa" : ""}`} onClick={() => handleSelEquipo(eq.id)}>
                      <div className="bdc-manual-fila-info">
                        <span className="bdc-manual-marca">{eq.marca}</span>
                        <span className="bdc-manual-modelo">{labelEmpotrable(eq)}</span>
                        <span className="bdc-manual-vel" style={{color:"#64748b",fontSize:"0.6rem"}}>{eq.modelo}</span>
                        <span className="bdc-manual-vel vel-1v">{eq.specs.flujo} GPM</span>
                        {eq.specs.dimensionPuerto && <span className="bdc-manual-vel" style={{ color: "#94a3b8" }}>{eq.specs.dimensionPuerto}"</span>}
                        {eq.specs.tamano != null && <span className="bdc-manual-vel" style={{ color: "#94a3b8" }}>⌀ {eq.specs.tamano}"</span>}
                        {esRec && <span className="bdc-manual-badge-rec">★ Rec.</span>}
                      </div>
                      <div className="bdc-manual-fila-cap" style={{ color: "#64748b", fontSize: "0.68rem" }}>mín. {minEste}</div>
                    </div>
                  );
                })}
                {catalogoFiltrado.length === 0 && <div className="bdc-manual-vacio">Sin modelos para estos filtros</div>}
              </div>
              {selId && selCant !== null && (
                <div className="bdc-manual-resultado">
                  <div className="bdc-manual-cant-row">
                    <span className="bdc-manual-cant-label">Cantidad <span style={{ color: "#64748b", fontWeight: 400 }}>(mín. {cantMinima})</span></span>
                    <div className="bdc-manual-cant-ctrl">
                      <button onClick={() => setSelCant(c => Math.max(cantMinima, c - 1))}>−</button>
                      <span>{selCant}</span>
                      <button onClick={() => setSelCant(c => c + 1)}>+</button>
                    </div>
                  </div>
                  {manualCalc && (<>
                    <div className="bdc-demanda-fila"><span className="bdc-demanda-label">Flujo por equipo requerido</span><span className="bdc-demanda-valor">{parseFloat(manualCalc.flujoPorEquipo).toFixed(2)} GPM</span></div>
                    <div className="bdc-demanda-fila"><span className="bdc-demanda-label">Flujo nominal del equipo</span><span className="bdc-demanda-valor bdc-ok">{manualCalc.equipo.specs.flujo} GPM</span></div>
                    <div className="bdc-demanda-fila"><span className="bdc-demanda-label">Flujo total instalado</span><span className="bdc-demanda-valor bdc-ok">{parseFloat(manualCalc.flujoTotal).toFixed(1)} GPM</span></div>
                    {manualCalc.res?.sumaFinal != null && (<><div className="bdc-auto-sep" style={{ margin: "0.5rem 0" }} /><div className="bdc-auto-fila bdc-auto-total"><span className="bdc-auto-label">Pérdida de carga</span><span className="bdc-auto-val bdc-hid-val-highlight">{(parseFloat(manualCalc.res.sumaFinal) + 1.5).toFixed(2)} ft</span></div></>)}
                  </>)}
                </div>
              )}
              {!selId && <div className="bdc-manual-hint">Selecciona un equipo del catálogo para calcular</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   SISTEMAS
===================================================== */
const SISTEMAS_SANITIZACION = [
  { key: "cloradorSalino",     label: "Generador de cloro salino", Icon: IconoCloradorSalino     },
  { key: "cloradorAutomatico", label: "Clorador automático",       Icon: IconoCloradorAutomatico },
  { key: "lamparaUV",          label: "Lámpara UV",                Icon: IconoLamparaUV          },
];
const SISTEMAS_FILTRACION = [
  { key: "filtroArena",    label: "Filtro de arena",    Icon: IconoFiltroArena    },
  { key: "prefiltro",      label: "Prefiltro",          Icon: IconoPrefiltro      },
  { key: "filtroCartucho", label: "Filtro de cartucho", Icon: IconoFiltroCartucho },
];

/* =====================================================
   BLOQUE PREFILTRO
===================================================== */
function BloquePrefiltro({ flujoMaximo, onCargaChange = null, onEstadoChange = null }) {
  const [modo, setModo]               = useState("recomendado");
  const [selId, setSelId]             = useState(null);
  const [selCant, setSelCant]         = useState(null);
  const [filtroMarca, setFiltroMarca] = useState("todas");

  const rec = useMemo(() => {
    if (!flujoMaximo || flujoMaximo <= 0) return null;
    try { const r = prefiltro(flujoMaximo, flujoMaximo); return r?.error ? null : r; }
    catch { return null; }
  }, [flujoMaximo]);

  const marcas = useMemo(() =>
    ["todas", ...new Set(prefiltros.filter(p => p.metadata.activo).map(p => p.marca))], []);

  const catalogoFiltrado = useMemo(() =>
    prefiltros.filter(p => p.metadata.activo && (filtroMarca === "todas" || p.marca === filtroMarca)),
  [filtroMarca]);

  const cantMinima = useMemo(() => {
    if (!selId || !flujoMaximo) return 1;
    const p = prefiltros.find(p => p.id === selId);
    return p ? Math.max(1, Math.ceil(flujoMaximo / p.specs.maxFlow)) : 1;
  }, [selId, flujoMaximo]);

  const handleSel = (id) => {
    if (selId === id) { setSelId(null); setSelCant(null); return; }
    setSelId(id);
    const p = prefiltros.find(p => p.id === id);
    setSelCant(p && flujoMaximo ? Math.max(1, Math.ceil(flujoMaximo / p.specs.maxFlow)) : 1);
  };

  let manualCalc = null;
  if (selId && selCant && flujoMaximo) {
    const p = prefiltros.find(pi => pi.id === selId);
    if (p) {
      try {
        const res = calcularCargaPrefiltroManual(p.specs.maxFlow, selCant);
        if (!res?.error) manualCalc = { prefiltroEq: p, cantidad: selCant, flujoPorPrefiltro: p.specs.maxFlow, flujoTotal: parseFloat((p.specs.maxFlow * selCant).toFixed(2)), ...res };
      } catch { manualCalc = null; }
    }
  }

  const infoActiva = modo === "recomendado" ? rec : manualCalc;
  const datosActivos = modo === "recomendado" && rec
    ? (() => { const eq = prefiltros.find(p => p.marca === rec.seleccion.marca && p.modelo === rec.seleccion.modelo); return { id: eq?.id, marca: rec.seleccion.marca, modelo: rec.seleccion.modelo, cantidad: rec.seleccion.cantidad, flujoPorUnidad: rec.seleccion.flujoPorPrefiltro, diameter: rec.seleccion.diameter }; })()
    : manualCalc
    ? { id: manualCalc.prefiltroEq.id, marca: manualCalc.prefiltroEq.marca, modelo: manualCalc.prefiltroEq.modelo, cantidad: manualCalc.cantidad, flujoPorUnidad: manualCalc.flujoPorPrefiltro, diameter: manualCalc.prefiltroEq.specs.diameter }
    : null;

  const cargaPrefiltroFt = infoActiva && !infoActiva?.error ? parseFloat(infoActiva.cargaTotal) || null : null;
  const selIdPFefectivo  = useMemo(() => {
    if (modo === "manual") return selId;
    if (!infoActiva || infoActiva.error) return null;
    return prefiltros.find(p => p.marca === infoActiva.seleccion?.marca && p.modelo === infoActiva.seleccion?.modelo)?.id ?? null;
  }, [modo, selId, infoActiva]);

  const estPF = infoActiva && !infoActiva?.error
    ? { modo, selId: selIdPFefectivo, cantidad: modo === "recomendado" ? infoActiva.seleccion?.cantidad : selCant,
        marca: modo === "recomendado" ? infoActiva.seleccion?.marca : infoActiva.prefiltroEq?.marca,
        modelo: modo === "recomendado" ? infoActiva.seleccion?.modelo : infoActiva.prefiltroEq?.modelo,
        flujoEf: modo === "recomendado" ? parseFloat(infoActiva.seleccion?.flujoPorPrefiltro ?? 0) : parseFloat(infoActiva.flujoPorPrefiltro ?? 0),
        resultado: infoActiva }
    : null;

  useEffect(() => { if (onCargaChange) onCargaChange(cargaPrefiltroFt); }, [cargaPrefiltroFt]);
  useEffect(() => { if (onEstadoChange) onEstadoChange(estPF); }, [JSON.stringify(estPF)]);

  if (!flujoMaximo || flujoMaximo <= 0) return <div className="sanitizacion-pendiente">Completa las dimensiones para calcular el flujo máximo del sistema</div>;

  return (
    <div className="sanitizacion-bloque-equipo">
      <div className="bdc-modo-toggle-wrapper">
        <div className="bdc-modo-toggle">
          <button type="button" className={`bdc-modo-btn ${modo === "recomendado" ? "bdc-modo-activo" : ""}`} onClick={() => setModo("recomendado")}>{modo === "recomendado" && <IconoCheck />}<span>Recomendado</span></button>
          <button type="button" className={`bdc-modo-btn ${modo === "manual" ? "bdc-modo-activo" : ""}`} onClick={() => setModo("manual")}>{modo === "manual" && <IconoCheck />}<span>Selección manual</span></button>
        </div>
      </div>
      <div style={{ fontSize: "0.7rem", color: "#94a3b8", padding: "0.25rem 0.5rem 0.5rem" }}>
        Flujo máximo: <span style={{ color: "#38bdf8", fontWeight: 600 }}>{parseFloat(flujoMaximo).toFixed(1)} GPM</span>
      </div>
      <div className="layout-clima-bdc-fila2" style={{ marginTop: 0 }}>
        <div className="layout-clima-bdc-celda celda-bdc-rec">
          {datosActivos ? (
            <div className={`bdc-recomendada-card bdc-inset ${modo === "manual" ? "bdc-card-manual-activa" : ""}`}>
              <div className="bdc-rec-header"><IconoPrefiltro /><div className="bdc-rec-titulo"><span className="bdc-rec-label">{modo === "recomendado" ? "Recomendado" : "Manual"}</span><span className="bdc-rec-modelo">{datosActivos.marca} · {nombreComercial(datosActivos)}{datosActivos.diameter != null && <span style={{color:"#7dd3fc",fontSize:"0.85em"}}> {datosActivos.diameter}"</span>}{mostrarCodigo(datosActivos) && <span style={{color:"#94a3b8",fontSize:"0.8em"}}> {datosActivos.modelo}</span>}</span></div><span className={`bdc-modo-badge ${modo === "manual" ? "badge-manual" : "badge-auto"}`}>{modo === "manual" ? "Manual" : "Auto"}</span></div>
              <div className="bdc-rec-stats">
                <div className="bdc-stat"><span className="bdc-stat-valor">{datosActivos.cantidad}</span><span className="bdc-stat-label">equipos</span></div>
                <div className="bdc-stat-sep" />
                <div className="bdc-stat"><span className="bdc-stat-valor">{parseFloat(datosActivos.flujoPorUnidad).toFixed(1)}</span><span className="bdc-stat-label">GPM/equipo</span></div>
                <div className="bdc-stat-sep" />
                <div className="bdc-stat"><span className="bdc-stat-valor">{infoActiva.cargaTotal}</span><span className="bdc-stat-label">ft CDT</span></div>
                <div className="bdc-stat-sep" />
                <div className="bdc-stat"><span className="bdc-stat-valor">{infoActiva.cargaTotalPSI}</span><span className="bdc-stat-label">PSI</span></div>
              </div>
              <div className="bdc-rec-demanda"><div className="bdc-demanda-fila"><span className="bdc-demanda-label">Diámetro</span><span className="bdc-demanda-valor">{datosActivos.diameter}"</span></div></div>
              <div className="bdc-rec-hidraulica"><span className="bdc-hid-label">Carga hidráulica</span><span className="bdc-hid-valor">{infoActiva.cargaTotal} ft · {infoActiva.cargaTotalPSI} PSI</span></div>
            </div>
          ) : (
            <div className="bdc-recomendada-card bdc-pendiente bdc-inset"><div className="bdc-rec-header"><IconoPrefiltro /><div className="bdc-rec-titulo"><span className="bdc-rec-label">Prefiltro</span><span className="bdc-rec-modelo bdc-pendiente-txt">{modo === "recomendado" ? "Calculando..." : "Selecciona un equipo"}</span></div></div></div>
          )}
        </div>
        <div className="layout-clima-bdc-celda celda-bdc-manual">
          {modo === "recomendado" && rec && !rec.error && (
            <div className="bdc-info-automatica bdc-inset">
              <div className="bdc-manual-header"><span className="bdc-manual-titulo">Detalle de selección automática</span></div>
              <div className="bdc-auto-detalle">
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Marca</span><span className="bdc-auto-val">{rec.seleccion.marca}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Modelo</span><span className="bdc-auto-val">{rec.seleccion.modelo}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Cantidad</span><span className="bdc-auto-val">{rec.seleccion.cantidad} equipo{rec.seleccion.cantidad > 1 ? "s" : ""}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Flujo por equipo</span><span className="bdc-auto-val">{rec.seleccion.flujoPorPrefiltro} GPM</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Flujo total</span><span className="bdc-auto-val">{rec.seleccion.flujoTotal} GPM</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Diámetro</span><span className="bdc-auto-val">{rec.seleccion.diameter}"</span></div>
                <div className="bdc-auto-sep" />
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Carga tramos</span><span className="bdc-auto-val">{rec.cargaTramos} ft</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Carga fija</span><span className="bdc-auto-val">{rec.cargaFija_ft} ft</span></div>
                <div className="bdc-auto-sep" />
                <div className="bdc-auto-fila bdc-auto-total"><span className="bdc-auto-label">Carga total</span><span className="bdc-auto-val bdc-hid-val-highlight">{rec.cargaTotal} ft · {rec.cargaTotalPSI} PSI</span></div>
              </div>
            </div>
          )}
          {modo === "manual" && (
            <div className="bdc-selector-manual bdc-inset">
              <div className="bdc-manual-header"><span className="bdc-manual-titulo">Catálogo — Prefiltros</span></div>
              <div className="bdc-manual-filtros"><div className="campo"><label>Marca</label><select value={filtroMarca} onChange={e => setFiltroMarca(e.target.value)}>{marcas.map(m => <option key={m} value={m}>{m === "todas" ? "Todas las marcas" : m}</option>)}</select></div></div>
              <div className="bdc-manual-lista">
                {catalogoFiltrado.map(p => {
                  const esRec = rec && !rec.error && p.marca === rec.seleccion.marca && p.modelo === rec.seleccion.modelo;
                  const sel   = selId === p.id;
                  const minE  = Math.max(1, Math.ceil(flujoMaximo / p.specs.maxFlow));
                  return (
                    <div key={p.id} className={`bdc-manual-fila ${sel ? "bdc-manual-fila-activa" : ""}`} onClick={() => handleSel(p.id)}>
                      <div className="bdc-manual-fila-info"><span className="bdc-manual-marca">{p.marca}</span><span className="bdc-manual-modelo">{nombreComercial(p)}</span>{mostrarCodigo(p) && <span className="bdc-manual-vel" style={{color:"#64748b",fontSize:"0.6rem"}}>{p.modelo}</span>}<span className="bdc-manual-vel vel-1v">{p.specs.maxFlow} GPM</span><span className="bdc-manual-vel" style={{ color: "#94a3b8" }}>{p.specs.diameter}"</span>{esRec && <span className="bdc-manual-badge-rec">★ Rec.</span>}</div>
                      <div className="bdc-manual-fila-cap" style={{ color: "#64748b", fontSize: "0.68rem" }}>mín. {minE}</div>
                    </div>
                  );
                })}
                {catalogoFiltrado.length === 0 && <div className="bdc-manual-vacio">Sin modelos para estos filtros</div>}
              </div>
              {selId && selCant !== null && (
                <div className="bdc-manual-resultado">
                  <div className="bdc-manual-cant-row"><span className="bdc-manual-cant-label">Cantidad <span style={{ color: "#64748b", fontWeight: 400 }}>(mín. {cantMinima})</span></span><div className="bdc-manual-cant-ctrl"><button onClick={() => setSelCant(c => Math.max(cantMinima, c - 1))}>−</button><span>{selCant}</span><button onClick={() => setSelCant(c => c + 1)}>+</button></div></div>
                  {manualCalc && (<>
                    <div className="bdc-demanda-fila"><span className="bdc-demanda-label">Flujo por equipo</span><span className="bdc-demanda-valor">{manualCalc.flujoPorPrefiltro} GPM</span></div>
                    <div className="bdc-demanda-fila"><span className="bdc-demanda-label">Flujo total instalado</span><span className="bdc-demanda-valor bdc-ok">{parseFloat(manualCalc.flujoTotal).toFixed(1)} GPM</span></div>
                    <div className="bdc-auto-sep" style={{ margin: "0.5rem 0" }} />
                    <div className="bdc-auto-fila bdc-auto-total"><span className="bdc-auto-label">Carga total</span><span className="bdc-auto-val bdc-hid-val-highlight">{manualCalc.cargaTotal} ft · {manualCalc.cargaTotalPSI} PSI</span></div>
                  </>)}
                </div>
              )}
              {!selId && <div className="bdc-manual-hint">Selecciona un equipo del catálogo para calcular</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   BLOQUE FILTRO CARTUCHO
===================================================== */
function BloqueFiltroCartucho({ flujoMaximo, usoGeneral, onCargaChange = null, onEstadoChange = null }) {
  const [modo, setModo]               = useState("recomendado");
  const [selId, setSelId]             = useState(null);
  const [selCant, setSelCant]         = useState(null);
  const [filtroMarca, setFiltroMarca] = useState("todas");

  const rec = useMemo(() => {
    if (!flujoMaximo || flujoMaximo <= 0) return null;
    try { const r = filtroCartucho(flujoMaximo, usoGeneral, flujoMaximo); return r?.error ? null : r; }
    catch { return null; }
  }, [flujoMaximo, usoGeneral]);

  const marcas = useMemo(() =>
    ["todas", ...new Set(filtrosCartucho.filter(f => f.metadata.activo && flujoEfectivo(f, usoGeneral) !== null).map(f => f.marca))],
  [usoGeneral]);

  const catalogoFiltrado = useMemo(() =>
    filtrosCartucho.filter(f => f.metadata.activo && flujoEfectivo(f, usoGeneral) !== null && (filtroMarca === "todas" || f.marca === filtroMarca)),
  [filtroMarca, usoGeneral]);

  const cantMinima = useMemo(() => {
    if (!selId || !flujoMaximo) return 1;
    const f  = filtrosCartucho.find(f => f.id === selId);
    const fe = f ? flujoEfectivo(f, usoGeneral) : null;
    return fe ? Math.max(1, Math.ceil(flujoMaximo / fe)) : 1;
  }, [selId, flujoMaximo, usoGeneral]);

  const handleSel = (id) => {
    if (selId === id) { setSelId(null); setSelCant(null); return; }
    setSelId(id);
    const f  = filtrosCartucho.find(f => f.id === id);
    const fe = f ? flujoEfectivo(f, usoGeneral) : null;
    setSelCant(fe && flujoMaximo ? Math.max(1, Math.ceil(flujoMaximo / fe)) : 1);
  };

  let manualCalc = null;
  if (selId && selCant && flujoMaximo) {
    const f  = filtrosCartucho.find(fi => fi.id === selId);
    const fe = f ? flujoEfectivo(f, usoGeneral) : null;
    if (f && fe) {
      try {
        const res = calcularCargaFiltroCartuchoManual(fe, selCant);
        if (!res?.error) manualCalc = { filtroEq: f, flujoEf: fe, cantidad: selCant, flujoTotal: parseFloat((fe * selCant).toFixed(2)), ...res };
      } catch { manualCalc = null; }
    }
  }

  const infoActiva    = modo === "recomendado" ? rec : manualCalc;
  const labelUso      = usoGeneral === "residencial" ? "Residencial" : "Comercial";
  const cargaCartucho = infoActiva && !infoActiva?.error ? parseFloat(infoActiva.cargaTotal) || null : null;

  const selIdCTefectivo = useMemo(() => {
    if (modo === "manual") return selId;
    if (!infoActiva || infoActiva.error) return null;
    return filtrosCartucho.find(f => f.marca === infoActiva.seleccion?.marca && f.modelo === infoActiva.seleccion?.modelo)?.id ?? null;
  }, [modo, selId, infoActiva]);

  const estCT = infoActiva && !infoActiva?.error
    ? { modo, selId: selIdCTefectivo, cantidad: modo === "recomendado" ? infoActiva.seleccion?.cantidad : selCant,
        marca: modo === "recomendado" ? infoActiva.seleccion?.marca : null,
        modelo: modo === "recomendado" ? infoActiva.seleccion?.modelo : null,
        flujoEf: modo === "recomendado" ? parseFloat(infoActiva.seleccion?.flujoEfectivo ?? 0) : parseFloat(infoActiva.flujoEf ?? 0),
        resultado: infoActiva }
    : null;

  useEffect(() => { if (onCargaChange) onCargaChange(cargaCartucho); }, [cargaCartucho]);
  useEffect(() => { if (onEstadoChange) onEstadoChange(estCT); }, [JSON.stringify(estCT)]);

  if (!flujoMaximo || flujoMaximo <= 0) return <div className="sanitizacion-pendiente">Completa las dimensiones para calcular el flujo máximo del sistema</div>;

  const datosActivos = modo === "recomendado" && rec
    ? (() => { const eq = filtrosCartucho.find(f => f.marca === rec.seleccion.marca && f.modelo === rec.seleccion.modelo); return { id: eq?.id, marca: rec.seleccion.marca, modelo: rec.seleccion.modelo, cantidad: rec.seleccion.cantidad, flujoEf: rec.seleccion.flujoEfectivo, filtrationArea: rec.seleccion.filtrationArea }; })()
    : manualCalc
    ? { id: manualCalc.filtroEq.id, marca: manualCalc.filtroEq.marca, modelo: manualCalc.filtroEq.modelo, cantidad: manualCalc.cantidad, flujoEf: manualCalc.flujoEf, filtrationArea: manualCalc.filtroEq.specs.filtrationArea }
    : null;

  return (
    <div className="sanitizacion-bloque-equipo">
      <div className="bdc-modo-toggle-wrapper">
        <div className="bdc-modo-toggle">
          <button type="button" className={`bdc-modo-btn ${modo === "recomendado" ? "bdc-modo-activo" : ""}`} onClick={() => setModo("recomendado")}>{modo === "recomendado" && <IconoCheck />}<span>Recomendado</span></button>
          <button type="button" className={`bdc-modo-btn ${modo === "manual" ? "bdc-modo-activo" : ""}`} onClick={() => setModo("manual")}>{modo === "manual" && <IconoCheck />}<span>Selección manual</span></button>
        </div>
      </div>
      <div style={{ fontSize: "0.7rem", color: "#94a3b8", padding: "0.25rem 0.5rem 0.5rem" }}>
        Flujo máximo: <span style={{ color: "#38bdf8", fontWeight: 600 }}>{parseFloat(flujoMaximo).toFixed(1)} GPM</span>
        <span style={{ marginLeft: "0.75rem" }}>· Uso: <span style={{ color: "#34d399" }}>{labelUso}</span></span>
      </div>
      <div className="layout-clima-bdc-fila2" style={{ marginTop: 0 }}>
        <div className="layout-clima-bdc-celda celda-bdc-rec">
          {datosActivos ? (
            <div className={`bdc-recomendada-card bdc-inset ${modo === "manual" ? "bdc-card-manual-activa" : ""}`}>
              <div className="bdc-rec-header"><IconoFiltroCartucho /><div className="bdc-rec-titulo"><span className="bdc-rec-label">{modo === "recomendado" ? "Recomendado" : "Manual"}</span><span className="bdc-rec-modelo">{datosActivos.marca} · {nombreComercial(datosActivos)}{datosActivos.filtrationArea != null && <span style={{color:"#7dd3fc",fontSize:"0.85em"}}> {datosActivos.filtrationArea} ft²</span>}{mostrarCodigo(datosActivos) && <span style={{color:"#94a3b8",fontSize:"0.8em"}}> {datosActivos.modelo}</span>}</span></div><span className={`bdc-modo-badge ${modo === "manual" ? "badge-manual" : "badge-auto"}`}>{modo === "manual" ? "Manual" : "Auto"}</span></div>
              <div className="bdc-rec-stats">
                <div className="bdc-stat"><span className="bdc-stat-valor">{datosActivos.cantidad}</span><span className="bdc-stat-label">filtros</span></div>
                <div className="bdc-stat-sep" />
                <div className="bdc-stat"><span className="bdc-stat-valor">{parseFloat(datosActivos.flujoEf).toFixed(1)}</span><span className="bdc-stat-label">GPM/filtro</span></div>
                <div className="bdc-stat-sep" />
                <div className="bdc-stat"><span className="bdc-stat-valor">{infoActiva.cargaTotal}</span><span className="bdc-stat-label">ft CDT</span></div>
                <div className="bdc-stat-sep" />
                <div className="bdc-stat"><span className="bdc-stat-valor">{infoActiva.cargaTotalPSI}</span><span className="bdc-stat-label">PSI</span></div>
              </div>
              <div className="bdc-rec-demanda">
                <div className="bdc-demanda-fila"><span className="bdc-demanda-label">Área filtración</span><span className="bdc-demanda-valor bdc-ok">{datosActivos.filtrationArea} ft²</span></div>
                <div className="bdc-demanda-fila"><span className="bdc-demanda-label">Uso</span><span className="bdc-demanda-valor">{labelUso}</span></div>
              </div>
              <div className="bdc-rec-hidraulica"><span className="bdc-hid-label">Carga hidráulica</span><span className="bdc-hid-valor">{infoActiva.cargaTotal} ft · {infoActiva.cargaTotalPSI} PSI</span></div>
            </div>
          ) : (
            <div className="bdc-recomendada-card bdc-pendiente bdc-inset"><div className="bdc-rec-header"><IconoFiltroCartucho /><div className="bdc-rec-titulo"><span className="bdc-rec-label">Filtro de cartucho</span><span className="bdc-rec-modelo bdc-pendiente-txt">{modo === "recomendado" ? "Calculando..." : "Selecciona un filtro"}</span></div></div></div>
          )}
        </div>
        <div className="layout-clima-bdc-celda celda-bdc-manual">
          {modo === "recomendado" && rec && !rec.error && (
            <div className="bdc-info-automatica bdc-inset">
              <div className="bdc-manual-header"><span className="bdc-manual-titulo">Detalle automático</span></div>
              <div className="bdc-auto-detalle">
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Marca</span><span className="bdc-auto-val">{rec.seleccion.marca}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Modelo</span><span className="bdc-auto-val">{rec.seleccion.modelo}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Cantidad</span><span className="bdc-auto-val">{rec.seleccion.cantidad}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Flujo por filtro</span><span className="bdc-auto-val">{rec.seleccion.flujoEfectivo} GPM</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Área filtración</span><span className="bdc-auto-val">{rec.seleccion.filtrationArea} ft²</span></div>
                <div className="bdc-auto-sep" />
                <div className="bdc-auto-fila bdc-auto-total"><span className="bdc-auto-label">Carga total</span><span className="bdc-auto-val bdc-hid-val-highlight">{rec.cargaTotal} ft · {rec.cargaTotalPSI} PSI</span></div>
              </div>
            </div>
          )}
          {modo === "manual" && (
            <div className="bdc-selector-manual bdc-inset">
              <div className="bdc-manual-header"><span className="bdc-manual-titulo">Catálogo — {labelUso}</span></div>
              <div className="bdc-manual-filtros"><div className="campo"><label>Marca</label><select value={filtroMarca} onChange={e => setFiltroMarca(e.target.value)}>{marcas.map(m => <option key={m} value={m}>{m === "todas" ? "Todas las marcas" : m}</option>)}</select></div></div>
              <div className="bdc-manual-lista">
                {catalogoFiltrado.map(f => {
                  const fe  = flujoEfectivo(f, usoGeneral);
                  const esRec = rec && !rec.error && f.marca === rec.seleccion.marca && f.modelo === rec.seleccion.modelo;
                  const sel   = selId === f.id;
                  const minE  = fe ? Math.max(1, Math.ceil(flujoMaximo / fe)) : "—";
                  return (
                    <div key={f.id} className={`bdc-manual-fila ${sel ? "bdc-manual-fila-activa" : ""}`} onClick={() => handleSel(f.id)}>
                      <div className="bdc-manual-fila-info"><span className="bdc-manual-marca">{f.marca}</span><span className="bdc-manual-modelo">{nombreComercial(f)}</span>{mostrarCodigo(f) && <span className="bdc-manual-vel" style={{color:"#64748b",fontSize:"0.6rem"}}>{f.modelo}</span>}<span className="bdc-manual-vel vel-1v">{fe} GPM</span><span className="bdc-manual-vel" style={{ color: "#94a3b8" }}>{f.specs.filtrationArea} ft²</span>{esRec && <span className="bdc-manual-badge-rec">★ Rec.</span>}</div>
                      <div className="bdc-manual-fila-cap" style={{ color: "#64748b", fontSize: "0.68rem" }}>mín. {minE}</div>
                    </div>
                  );
                })}
                {catalogoFiltrado.length === 0 && <div className="bdc-manual-vacio">Sin modelos para uso {labelUso.toLowerCase()}</div>}
              </div>
              {selId && selCant !== null && (
                <div className="bdc-manual-resultado">
                  <div className="bdc-manual-cant-row"><span className="bdc-manual-cant-label">Cantidad <span style={{ color: "#64748b", fontWeight: 400 }}>(mín. {cantMinima})</span></span><div className="bdc-manual-cant-ctrl"><button onClick={() => setSelCant(c => Math.max(cantMinima, c - 1))}>−</button><span>{selCant}</span><button onClick={() => setSelCant(c => c + 1)}>+</button></div></div>
                  {manualCalc && (<>
                    <div className="bdc-demanda-fila"><span className="bdc-demanda-label">Flujo por filtro</span><span className="bdc-demanda-valor">{manualCalc.flujoEf} GPM</span></div>
                    <div className="bdc-demanda-fila"><span className="bdc-demanda-label">Flujo total</span><span className="bdc-demanda-valor bdc-ok">{parseFloat(manualCalc.flujoTotal).toFixed(1)} GPM</span></div>
                    <div className="bdc-auto-sep" style={{ margin: "0.5rem 0" }} />
                    <div className="bdc-auto-fila bdc-auto-total"><span className="bdc-auto-label">Carga total</span><span className="bdc-auto-val bdc-hid-val-highlight">{manualCalc.cargaTotal} ft · {manualCalc.cargaTotalPSI} PSI</span></div>
                  </>)}
                </div>
              )}
              {!selId && <div className="bdc-manual-hint">Selecciona un filtro del catálogo para calcular</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   BLOQUE FILTRO DE ARENA
===================================================== */
function BloqueFiltroArena({ flujoMaximo, onCargaChange = null, onEstadoChange = null }) {
  const [modo, setModo]               = useState("recomendado");
  const [selId, setSelId]             = useState(null);
  const [selCant, setSelCant]         = useState(null);
  const [filtroMarca, setFiltroMarca] = useState("todas");

  const rec = useMemo(() => {
    if (!flujoMaximo || flujoMaximo <= 0) return null;
    try { const r = filtroArena(flujoMaximo, flujoMaximo); return r?.error ? null : r; }
    catch { return null; }
  }, [flujoMaximo]);

  const marcas = useMemo(() =>
    ["todas", ...new Set(filtrosArena.filter(f => f.metadata.activo).map(f => f.marca))], []);

  const catalogoFiltrado = useMemo(() =>
    filtrosArena.filter(f => f.metadata.activo && (filtroMarca === "todas" || f.marca === filtroMarca)),
  [filtroMarca]);

  const cantMinima = useMemo(() => {
    if (!selId || !flujoMaximo) return 1;
    const f = filtrosArena.find(f => f.id === selId);
    return f ? Math.max(1, Math.ceil(flujoMaximo / f.specs.maxFlow)) : 1;
  }, [selId, flujoMaximo]);

  const handleSelFiltro = (id) => {
    if (selId === id) { setSelId(null); setSelCant(null); return; }
    setSelId(id);
    const f = filtrosArena.find(f => f.id === id);
    setSelCant(f && flujoMaximo ? Math.max(1, Math.ceil(flujoMaximo / f.specs.maxFlow)) : 1);
  };

  let manualCalc = null;
  if (selId && selCant && flujoMaximo) {
    const f = filtrosArena.find(fi => fi.id === selId);
    if (f) {
      try {
        const res = calcularCargaFiltroArenaManual(f.specs.maxFlow, selCant);
        if (!res?.error) manualCalc = { filtro: f, cantidad: selCant, flujoPorFiltro: f.specs.maxFlow, flujoTotal: parseFloat((f.specs.maxFlow * selCant).toFixed(2)), ...res };
      } catch { manualCalc = null; }
    }
  }

  const infoActiva    = modo === "recomendado" ? rec : manualCalc;
  const cargaFiltroFt = infoActiva && !infoActiva?.error ? parseFloat(infoActiva.cargaTotal) || null : null;

  const selIdFAefectivo = useMemo(() => {
    if (modo === "manual") return selId;
    if (!infoActiva || infoActiva.error) return null;
    return filtrosArena.find(f => f.marca === infoActiva.seleccion?.marca && f.modelo === infoActiva.seleccion?.modelo)?.id ?? null;
  }, [modo, selId, infoActiva]);

  // Objeto enriquecido del filtro activo con id del catálogo
  const filtroActivoObj = selIdFAefectivo
    ? filtrosArena.find(f => f.id === selIdFAefectivo)
    : null;

  const estFA = infoActiva && !infoActiva?.error
    ? { modo, selId: selIdFAefectivo, cantidad: modo === "recomendado" ? infoActiva.seleccion?.cantidad : selCant,
        marca: modo === "recomendado" ? infoActiva.seleccion?.marca : infoActiva.filtro?.marca,
        modelo: modo === "recomendado" ? infoActiva.seleccion?.modelo : infoActiva.filtro?.modelo,
        flujoEf: modo === "recomendado" ? parseFloat(infoActiva.seleccion?.flujoPorFiltro ?? 0) : parseFloat(infoActiva.flujoPorFiltro ?? 0),
        resultado: infoActiva }
    : null;

  useEffect(() => { if (onCargaChange) onCargaChange(cargaFiltroFt); }, [cargaFiltroFt]);
  useEffect(() => { if (onEstadoChange) onEstadoChange(estFA); }, [JSON.stringify(estFA)]);

  if (!flujoMaximo || flujoMaximo <= 0) return <div className="sanitizacion-pendiente">Completa las dimensiones para calcular el flujo máximo del sistema</div>;

  return (
    <div className="sanitizacion-bloque-equipo">
      <div className="bdc-modo-toggle-wrapper">
        <div className="bdc-modo-toggle">
          <button type="button" className={`bdc-modo-btn ${modo === "recomendado" ? "bdc-modo-activo" : ""}`} onClick={() => setModo("recomendado")}>{modo === "recomendado" && <IconoCheck />}<span>Recomendado</span></button>
          <button type="button" className={`bdc-modo-btn ${modo === "manual" ? "bdc-modo-activo" : ""}`} onClick={() => setModo("manual")}>{modo === "manual" && <IconoCheck />}<span>Selección manual</span></button>
        </div>
      </div>
      <div style={{ fontSize: "0.7rem", color: "#94a3b8", padding: "0.25rem 0.5rem 0.5rem" }}>
        Flujo máximo: <span style={{ color: "#38bdf8", fontWeight: 600 }}>{parseFloat(flujoMaximo).toFixed(1)} GPM</span>
      </div>
      <div className="layout-clima-bdc-fila2" style={{ marginTop: 0 }}>
        <div className="layout-clima-bdc-celda celda-bdc-rec">
          {infoActiva && !infoActiva.error ? (
            <div className={`bdc-recomendada-card bdc-inset ${modo === "manual" ? "bdc-card-manual-activa" : ""}`}>
              <div className="bdc-rec-header"><IconoFiltroArena /><div className="bdc-rec-titulo"><span className="bdc-rec-label">{modo === "recomendado" ? "Recomendado" : "Manual"}</span><span className="bdc-rec-modelo">{modo === "recomendado" ? infoActiva.seleccion.marca : infoActiva.filtro.marca} · {nombreComercial(filtroActivoObj ?? (modo === "recomendado" ? infoActiva.seleccion : infoActiva.filtro))} <span style={{color:"#7dd3fc",fontSize:"0.85em"}}>{modo === "recomendado" ? infoActiva.seleccion.diameter : infoActiva.filtro.diameter}"</span>{mostrarCodigo(filtroActivoObj ?? (modo === "recomendado" ? infoActiva.seleccion : infoActiva.filtro)) && <span style={{color:"#94a3b8",fontSize:"0.8em"}}> {modo === "recomendado" ? infoActiva.seleccion.modelo : infoActiva.filtro.modelo}</span>}</span></div><span className={`bdc-modo-badge ${modo === "manual" ? "badge-manual" : "badge-auto"}`}>{modo === "manual" ? "Manual" : "Auto"}</span></div>
              <div className="bdc-rec-stats">
                <div className="bdc-stat"><span className="bdc-stat-valor">{modo === "recomendado" ? infoActiva.seleccion.cantidad : infoActiva.cantidad}</span><span className="bdc-stat-label">filtros</span></div>
                <div className="bdc-stat-sep" />
                <div className="bdc-stat"><span className="bdc-stat-valor">{modo === "recomendado" ? parseFloat(infoActiva.seleccion.flujoPorFiltro).toFixed(1) : parseFloat(infoActiva.flujoPorFiltro).toFixed(1)}</span><span className="bdc-stat-label">GPM/filtro</span></div>
                <div className="bdc-stat-sep" />
                <div className="bdc-stat"><span className="bdc-stat-valor">{infoActiva.cargaTotal}</span><span className="bdc-stat-label">ft CDT</span></div>
                <div className="bdc-stat-sep" />
                <div className="bdc-stat"><span className="bdc-stat-valor">{infoActiva.cargaTotalPSI}</span><span className="bdc-stat-label">PSI</span></div>
              </div>
              <div className="bdc-rec-demanda">
                {modo === "recomendado" ? (<>
                  <div className="bdc-demanda-fila"><span className="bdc-demanda-label">Diámetro</span><span className="bdc-demanda-valor">{infoActiva.seleccion.diameter}"</span></div>
                  <div className="bdc-demanda-fila"><span className="bdc-demanda-label">Arena</span><span className="bdc-demanda-valor bdc-ok">{infoActiva.seleccion.arena} kg</span></div>
                  {infoActiva.seleccion.grava > 0 && <div className="bdc-demanda-fila"><span className="bdc-demanda-label">Grava</span><span className="bdc-demanda-valor">{infoActiva.seleccion.grava} kg</span></div>}
                </>) : (<>
                  <div className="bdc-demanda-fila"><span className="bdc-demanda-label">Diámetro</span><span className="bdc-demanda-valor">{infoActiva.filtro.specs.diameter}"</span></div>
                  <div className="bdc-demanda-fila"><span className="bdc-demanda-label">Arena</span><span className="bdc-demanda-valor bdc-ok">{infoActiva.filtro.specs.arena} kg</span></div>
                  {infoActiva.filtro.specs.grava > 0 && <div className="bdc-demanda-fila"><span className="bdc-demanda-label">Grava</span><span className="bdc-demanda-valor">{infoActiva.filtro.specs.grava} kg</span></div>}
                </>)}
              </div>
              <div className="bdc-rec-hidraulica"><span className="bdc-hid-label">Carga hidráulica</span><span className="bdc-hid-valor">{infoActiva.cargaTotal} ft · {infoActiva.cargaTotalPSI} PSI</span></div>
            </div>
          ) : (
            <div className="bdc-recomendada-card bdc-pendiente bdc-inset"><div className="bdc-rec-header"><IconoFiltroArena /><div className="bdc-rec-titulo"><span className="bdc-rec-label">Filtro de arena</span><span className="bdc-rec-modelo bdc-pendiente-txt">{modo === "recomendado" ? "Calculando..." : "Selecciona un filtro"}</span></div></div></div>
          )}
        </div>
        <div className="layout-clima-bdc-celda celda-bdc-manual">
          {modo === "recomendado" && rec && !rec.error && (
            <div className="bdc-info-automatica bdc-inset">
              <div className="bdc-manual-header"><span className="bdc-manual-titulo">Detalle automático</span></div>
              <div className="bdc-auto-detalle">
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Marca</span><span className="bdc-auto-val">{rec.seleccion.marca}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Modelo</span><span className="bdc-auto-val">{rec.seleccion.modelo}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Cantidad</span><span className="bdc-auto-val">{rec.seleccion.cantidad}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Flujo por filtro</span><span className="bdc-auto-val">{rec.seleccion.flujoPorFiltro} GPM</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Diámetro</span><span className="bdc-auto-val">{rec.seleccion.diameter}"</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Arena</span><span className="bdc-auto-val">{rec.seleccion.arena} kg</span></div>
                {rec.seleccion.grava > 0 && <div className="bdc-auto-fila"><span className="bdc-auto-label">Grava</span><span className="bdc-auto-val">{rec.seleccion.grava} kg</span></div>}
                <div className="bdc-auto-sep" />
                <div className="bdc-auto-fila bdc-auto-total"><span className="bdc-auto-label">Carga total</span><span className="bdc-auto-val bdc-hid-val-highlight">{rec.cargaTotal} ft · {rec.cargaTotalPSI} PSI</span></div>
              </div>
            </div>
          )}
          {modo === "manual" && (
            <div className="bdc-selector-manual bdc-inset">
              <div className="bdc-manual-header"><span className="bdc-manual-titulo">Catálogo — Filtros de arena</span></div>
              <div className="bdc-manual-filtros"><div className="campo"><label>Marca</label><select value={filtroMarca} onChange={e => setFiltroMarca(e.target.value)}>{marcas.map(m => <option key={m} value={m}>{m === "todas" ? "Todas las marcas" : m}</option>)}</select></div></div>
              <div className="bdc-manual-lista">
                {catalogoFiltrado.map(f => {
                  const esRec = rec && !rec.error && f.marca === rec.seleccion.marca && f.modelo === rec.seleccion.modelo;
                  const sel   = selId === f.id;
                  const minE  = Math.max(1, Math.ceil(flujoMaximo / f.specs.maxFlow));
                  return (
                    <div key={f.id} className={`bdc-manual-fila ${sel ? "bdc-manual-fila-activa" : ""}`} onClick={() => handleSelFiltro(f.id)}>
                      <div className="bdc-manual-fila-info"><span className="bdc-manual-marca">{f.marca}</span><span className="bdc-manual-modelo">{nombreComercial(f)}</span>{mostrarCodigo(f) && <span className="bdc-manual-vel" style={{color:"#64748b",fontSize:"0.6rem"}}>{f.modelo}</span>}<span className="bdc-manual-vel vel-1v">{f.specs.maxFlow} GPM</span><span className="bdc-manual-vel" style={{ color: "#94a3b8" }}>{f.specs.diameter}"</span>{esRec && <span className="bdc-manual-badge-rec">★ Rec.</span>}</div>
                      <div className="bdc-manual-fila-cap" style={{ color: "#64748b", fontSize: "0.68rem" }}>mín. {minE}</div>
                    </div>
                  );
                })}
                {catalogoFiltrado.length === 0 && <div className="bdc-manual-vacio">Sin modelos</div>}
              </div>
              {selId && selCant !== null && (
                <div className="bdc-manual-resultado">
                  <div className="bdc-manual-cant-row"><span className="bdc-manual-cant-label">Cantidad <span style={{ color: "#64748b", fontWeight: 400 }}>(mín. {cantMinima})</span></span><div className="bdc-manual-cant-ctrl"><button onClick={() => setSelCant(c => Math.max(cantMinima, c - 1))}>−</button><span>{selCant}</span><button onClick={() => setSelCant(c => c + 1)}>+</button></div></div>
                  {manualCalc && (<>
                    <div className="bdc-demanda-fila"><span className="bdc-demanda-label">Flujo por filtro</span><span className="bdc-demanda-valor">{manualCalc.flujoPorFiltro} GPM</span></div>
                    <div className="bdc-demanda-fila"><span className="bdc-demanda-label">Flujo total</span><span className="bdc-demanda-valor bdc-ok">{parseFloat(manualCalc.flujoTotal).toFixed(1)} GPM</span></div>
                    <div className="bdc-auto-sep" style={{ margin: "0.5rem 0" }} />
                    <div className="bdc-auto-fila bdc-auto-total"><span className="bdc-auto-label">Carga total</span><span className="bdc-auto-val bdc-hid-val-highlight">{manualCalc.cargaTotal} ft · {manualCalc.cargaTotalPSI} PSI</span></div>
                  </>)}
                </div>
              )}
              {!selId && <div className="bdc-manual-hint">Selecciona un filtro del catálogo para calcular</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   BLOQUE GENERADOR DE CLORO SALINO
===================================================== */
function BloqueCloradorSalino({ resultadoClorador }) {
  const [modoCL, setModoCL]               = useState("recomendado");
  const [selManualCLId, setSelManualCLId] = useState(null);
  const [selManualCLCant, setSelManualCLCant] = useState(1);
  const [filtroMarca, setFiltroMarca]     = useState("todas");

  const rec = resultadoClorador && !resultadoClorador.error ? resultadoClorador : null;

  const marcasDisponibles = useMemo(() =>
    ["todas", ...new Set(generadoresDeCloro.filter(g => g.metadata.activo).map(g => g.marca))], []);

  const catalogoFiltrado = useMemo(() =>
    generadoresDeCloro.filter(g => g.metadata.activo && (filtroMarca === "todas" || g.marca === filtroMarca)),
  [filtroMarca]);

  const cloradorManual = useMemo(() => {
    if (!selManualCLId || selManualCLCant <= 0) return null;
    const equipo = generadoresDeCloro.find(g => g.id === selManualCLId);
    if (!equipo) return null;
    try {
      const hidraulica = calcularCargaCloradorManual(equipo.specs.flujo, selManualCLCant);
      if (hidraulica?.error) return null;
      return { equipo, cantidad: selManualCLCant, flujoTotal: equipo.specs.flujo * selManualCLCant, hidraulica };
    } catch { return null; }
  }, [selManualCLId, selManualCLCant]);

  const infoActiva = useMemo(() => {
    if (modoCL === "manual" && cloradorManual)
      return { id: cloradorManual.equipo.id, marca: cloradorManual.equipo.marca, modelo: cloradorManual.equipo.modelo, cantidad: cloradorManual.cantidad, flujoTotal: cloradorManual.flujoTotal, cargaTotal: cloradorManual.hidraulica?.cargaTotal, cargaTotalPSI: cloradorManual.hidraulica?.cargaTotalPSI, capInstalada: parseFloat((cloradorManual.cantidad * cloradorManual.equipo.specs.capacidadComercial).toFixed(3)), unidad: "kg/día" };
    if (rec) {
      const eqRec = generadoresDeCloro.find(g => g.marca === rec.seleccion.marca && g.modelo === rec.seleccion.modelo);
      return { id: eqRec?.id ?? rec.seleccion.id ?? rec.id, marca: rec.seleccion.marca, modelo: rec.seleccion.modelo, cantidad: rec.seleccion.cantidad, flujoTotal: rec.seleccion.flujoTotal, cargaTotal: rec.cargaTotal, cargaTotalPSI: rec.cargaTotalPSI, capInstalada: rec.kgDiaInstalado, unidad: rec.modoCloro === "comercial" ? "kg/día" : "litros" };
    }
    return null;
  }, [modoCL, cloradorManual, rec]);

  if (!rec) return <div className="sanitizacion-pendiente">Completa las dimensiones para ver la selección de generadores de cloro</div>;

  return (
    <div className="sanitizacion-bloque-equipo">
      <div className="bdc-modo-toggle-wrapper">
        <div className="bdc-modo-toggle">
          <button type="button" className={`bdc-modo-btn ${modoCL === "recomendado" ? "bdc-modo-activo" : ""}`} onClick={() => setModoCL("recomendado")}>{modoCL === "recomendado" && <IconoCheck />}<span>Recomendado</span></button>
          <button type="button" className={`bdc-modo-btn ${modoCL === "manual" ? "bdc-modo-activo" : ""}`} onClick={() => setModoCL("manual")}>{modoCL === "manual" && <IconoCheck />}<span>Selección manual</span></button>
        </div>
      </div>
      <div className="layout-clima-bdc-fila2" style={{ marginTop: 0 }}>
        <div className="layout-clima-bdc-celda celda-bdc-rec">
          {infoActiva ? (
            <div className={`bdc-recomendada-card bdc-inset ${modoCL === "manual" ? "bdc-card-manual-activa" : ""}`}>
              <div className="bdc-rec-header"><IconoCloradorSalino /><div className="bdc-rec-titulo"><span className="bdc-rec-label">{modoCL === "recomendado" ? "Recomendado" : "Manual"}</span><span className="bdc-rec-modelo">{infoActiva.marca} · {nombreComercial(infoActiva)}{mostrarCodigo(infoActiva) && <span style={{color:"#94a3b8",fontSize:"0.8em"}}> {infoActiva.modelo}</span>}</span></div><span className={`bdc-modo-badge ${modoCL === "manual" ? "badge-manual" : "badge-auto"}`}>{modoCL === "manual" ? "Manual" : "Auto"}</span></div>
              <div className="bdc-rec-stats">
                <div className="bdc-stat"><span className="bdc-stat-valor">{infoActiva.cantidad}</span><span className="bdc-stat-label">equipos</span></div>
                <div className="bdc-stat-sep" />
                <div className="bdc-stat"><span className="bdc-stat-valor">{parseFloat(infoActiva.flujoTotal).toFixed(1)}</span><span className="bdc-stat-label">GPM total</span></div>
                <div className="bdc-stat-sep" />
                <div className="bdc-stat"><span className="bdc-stat-valor">{infoActiva.cargaTotal}</span><span className="bdc-stat-label">ft CDT</span></div>
                <div className="bdc-stat-sep" />
                <div className="bdc-stat"><span className="bdc-stat-valor">{infoActiva.cargaTotalPSI}</span><span className="bdc-stat-label">PSI</span></div>
              </div>
              {infoActiva.capInstalada != null && (
                <div className="bdc-rec-demanda">
                  <div className="bdc-demanda-fila"><span className="bdc-demanda-label">Capacidad instalada</span><span className="bdc-demanda-valor bdc-ok">{infoActiva.capInstalada} {infoActiva.unidad}</span></div>
                  {rec.kgDiaNecesario != null && <div className="bdc-demanda-fila"><span className="bdc-demanda-label">Demanda necesaria</span><span className="bdc-demanda-valor">{rec.kgDiaNecesario} kg/día</span></div>}
                </div>
              )}
              <div className="bdc-rec-hidraulica"><span className="bdc-hid-label">Carga hidráulica</span><span className="bdc-hid-valor">{infoActiva.cargaTotal} ft · {infoActiva.cargaTotalPSI} PSI</span></div>
            </div>
          ) : (
            <div className="bdc-recomendada-card bdc-pendiente bdc-inset"><div className="bdc-rec-header"><IconoCloradorSalino /><div className="bdc-rec-titulo"><span className="bdc-rec-label">Gen. cloro salino</span><span className="bdc-rec-modelo bdc-pendiente-txt">Completa las dimensiones</span></div></div></div>
          )}
        </div>
        <div className="layout-clima-bdc-celda celda-bdc-manual">
          {modoCL === "recomendado" && rec && (
            <div className="bdc-info-automatica bdc-inset">
              <div className="bdc-manual-header"><span className="bdc-manual-titulo">Detalle automático</span></div>
              <div className="bdc-auto-detalle">
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Marca</span><span className="bdc-auto-val">{rec.seleccion.marca}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Modelo</span><span className="bdc-auto-val">{rec.seleccion.modelo}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Cantidad</span><span className="bdc-auto-val">{rec.seleccion.cantidad}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Flujo total</span><span className="bdc-auto-val">{rec.seleccion.flujoTotal} GPM</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Modo</span><span className="bdc-auto-val" style={{ textTransform: "capitalize" }}>{rec.modoCloro}</span></div>
                {rec.kgDiaNecesario != null && <div className="bdc-auto-fila"><span className="bdc-auto-label">Demanda</span><span className="bdc-auto-val">{rec.kgDiaNecesario} kg/día</span></div>}
                <div className="bdc-auto-sep" />
                <div className="bdc-auto-fila bdc-auto-total"><span className="bdc-auto-label">Carga total</span><span className="bdc-auto-val bdc-hid-val-highlight">{rec.cargaTotal} ft · {rec.cargaTotalPSI} PSI</span></div>
              </div>
            </div>
          )}
          {modoCL === "manual" && (
            <div className="bdc-selector-manual bdc-inset">
              <div className="bdc-manual-header"><span className="bdc-manual-titulo">Catálogo de generadores</span></div>
              <div className="bdc-manual-filtros"><div className="campo"><label>Marca</label><select value={filtroMarca} onChange={e => setFiltroMarca(e.target.value)}>{marcasDisponibles.map(m => <option key={m} value={m}>{m === "todas" ? "Todas las marcas" : m}</option>)}</select></div></div>
              <div className="bdc-manual-lista">
                {catalogoFiltrado.map(g => {
                  const esRec = rec && g.marca === rec.seleccion.marca && g.modelo === rec.seleccion.modelo;
                  const sel   = selManualCLId === g.id;
                  return (
                    <div key={g.id} className={`bdc-manual-fila ${sel ? "bdc-manual-fila-activa" : ""}`} onClick={() => { setSelManualCLId(sel ? null : g.id); setSelManualCLCant(1); }}>
                      <div className="bdc-manual-fila-info"><span className="bdc-manual-marca">{g.marca}</span><span className="bdc-manual-modelo">{nombreComercial(g)}</span>{mostrarCodigo(g) && <span className="bdc-manual-vel" style={{color:"#64748b",fontSize:"0.6rem"}}>{g.modelo}</span>}<span className="bdc-manual-vel vel-1v">{g.specs.flujo} GPM</span>{esRec && <span className="bdc-manual-badge-rec">★ Rec.</span>}</div>
                      <div className="bdc-manual-fila-cap">{g.specs.capacidadComercial} kg/día</div>
                    </div>
                  );
                })}
              </div>
              {selManualCLId && (
                <div className="bdc-manual-resultado">
                  <div className="bdc-manual-cant-row"><span className="bdc-manual-cant-label">Cantidad</span><div className="bdc-manual-cant-ctrl"><button onClick={() => setSelManualCLCant(c => Math.max(1, c - 1))}>−</button><span>{selManualCLCant}</span><button onClick={() => setSelManualCLCant(c => c + 1)}>+</button></div></div>
                  {cloradorManual && (<>
                    <div className="bdc-demanda-fila"><span className="bdc-demanda-label">Flujo total</span><span className="bdc-demanda-valor">{parseFloat(cloradorManual.flujoTotal).toFixed(1)} GPM</span></div>
                    <div className="bdc-demanda-fila"><span className="bdc-demanda-label">Cap. instalada</span><span className="bdc-demanda-valor bdc-ok">{parseFloat((cloradorManual.cantidad * cloradorManual.equipo.specs.capacidadComercial).toFixed(3))} kg/día</span></div>
                    <div className="bdc-auto-sep" style={{ margin: "0.5rem 0" }} />
                    <div className="bdc-auto-fila bdc-auto-total"><span className="bdc-auto-label">Carga total</span><span className="bdc-auto-val bdc-hid-val-highlight">{cloradorManual.hidraulica?.cargaTotal} ft · {cloradorManual.hidraulica?.cargaTotalPSI} PSI</span></div>
                  </>)}
                </div>
              )}
              {!selManualCLId && <div className="bdc-manual-hint">Selecciona un equipo del catálogo</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   BLOQUE CLORADOR AUTOMÁTICO
   — onCargaChange sube la carga al padre (App.jsx)
===================================================== */
function BloqueCloradorAutomatico({ volumenLitros, usoGeneral, areaM2, volumenM3, tempC, onCargaChange = null, onEstadoChange = null }) {
  const [modoCL, setModoCL]               = useState("recomendado");
  const [instalacion, setInstalacion]     = useState(null);
  const [selManualCLId, setSelManualCLId] = useState(null);
  const [selManualCLCant, setSelManualCLCant] = useState(1);
  const [filtroMarca, setFiltroMarca]     = useState("todas");

  const rec = useMemo(() => {
    if (!instalacion || !volumenLitros || volumenLitros <= 0) return null;
    try { const r = cloradorAutomatico(volumenLitros, usoGeneral, areaM2, volumenM3, tempC, instalacion); return r?.error ? null : r; }
    catch { return null; }
  }, [instalacion, volumenLitros, usoGeneral, areaM2, volumenM3, tempC]);

  const marcasDisponibles = useMemo(() =>
    ["todas", ...new Set(cloradoresAutomaticos.filter(c => c.metadata.activo && (!instalacion || c.instalacion === instalacion)).map(c => c.marca))],
  [instalacion]);

  const catalogoFiltrado = useMemo(() =>
    cloradoresAutomaticos.filter(c => c.metadata.activo && (!instalacion || c.instalacion === instalacion) && (filtroMarca === "todas" || c.marca === filtroMarca)),
  [instalacion, filtroMarca]);

  const cloradorManual = useMemo(() => {
    if (!selManualCLId || selManualCLCant <= 0) return null;
    const equipo = cloradoresAutomaticos.find(c => c.id === selManualCLId);
    if (!equipo) return null;
    try {
      const hidraulica = calcularCargaCloradorAutomaticoManual(equipo.specs.flujo, selManualCLCant, equipo.instalacion);
      if (hidraulica?.error) return null;
      return { equipo, cantidad: selManualCLCant, flujoTotal: equipo.specs.flujo * selManualCLCant, hidraulica };
    } catch { return null; }
  }, [selManualCLId, selManualCLCant]);

  const infoActiva = useMemo(() => {
    if (modoCL === "manual" && cloradorManual)
      return { id: cloradorManual.equipo.id, marca: cloradorManual.equipo.marca, modelo: cloradorManual.equipo.modelo, instalacion: cloradorManual.equipo.instalacion, cantidad: cloradorManual.cantidad, flujoTotal: cloradorManual.flujoTotal, cargaTotal: cloradorManual.hidraulica?.cargaTotal, cargaTotalPSI: cloradorManual.hidraulica?.cargaTotalPSI };
    if (rec) {
      const eqRecCA = cloradoresAutomaticos.find(g => g.marca === rec.seleccion.marca && g.modelo === rec.seleccion.modelo);
      return { id: eqRecCA?.id, marca: rec.seleccion.marca, modelo: rec.seleccion.modelo, instalacion: rec.seleccion.instalacion, cantidad: rec.seleccion.cantidad, flujoTotal: rec.seleccion.flujoTotal, cargaTotal: rec.cargaTotal, cargaTotalPSI: rec.cargaTotalPSI };
    }
    return null;
  }, [modoCL, cloradorManual, rec]);

  // ── Reportar carga al padre ──
  const cargaCAFt = infoActiva?.cargaTotal != null ? (parseFloat(infoActiva.cargaTotal) || null) : null;
  useEffect(() => { if (onCargaChange) onCargaChange(cargaCAFt); }, [cargaCAFt]);
  useEffect(() => {
    if (onEstadoChange) onEstadoChange(infoActiva ? { marca: infoActiva.marca, modelo: infoActiva.modelo, instalacion: infoActiva.instalacion, cantidad: infoActiva.cantidad, flujoTotal: infoActiva.flujoTotal } : null);
  }, [infoActiva?.marca, infoActiva?.modelo, infoActiva?.cantidad]);

  const labelInst = (i) => i === "enLinea" ? "En línea" : "Fuera de línea";

  if (!instalacion) {
    return (
      <div className="sanitizacion-bloque-equipo">
        <div className="sanitizacion-tipo-label" style={{ fontSize: "0.78rem", color: "#94a3b8", padding: "0.5rem 0.5rem 0.75rem" }}>Selecciona el tipo de instalación</div>
        <div className="sistemas-calentamiento-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="sistema-cal-card" onClick={() => setInstalacion("enLinea")}><div className="sistema-cal-icon"><IconoCloradorAutomatico /></div><div className="sistema-cal-label">En línea</div></div>
          <div className="sistema-cal-card" onClick={() => setInstalacion("fueraLinea")}><div className="sistema-cal-icon"><IconoCloradorAutomatico /></div><div className="sistema-cal-label">Fuera de línea</div></div>
        </div>
      </div>
    );
  }

  return (
    <div className="sanitizacion-bloque-equipo">
      <div className="bdc-modo-toggle-wrapper" style={{ marginBottom: "0.4rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Tipo:</span>
          <div className="bdc-modo-toggle">
            <button type="button" className={`bdc-modo-btn ${instalacion === "enLinea" ? "bdc-modo-activo" : ""}`} onClick={() => { setInstalacion("enLinea"); setSelManualCLId(null); }}>{instalacion === "enLinea" && <IconoCheck />}<span>En línea</span></button>
            <button type="button" className={`bdc-modo-btn ${instalacion === "fueraLinea" ? "bdc-modo-activo" : ""}`} onClick={() => { setInstalacion("fueraLinea"); setSelManualCLId(null); }}>{instalacion === "fueraLinea" && <IconoCheck />}<span>Fuera de línea</span></button>
          </div>
        </div>
      </div>
      <div className="bdc-modo-toggle-wrapper">
        <div className="bdc-modo-toggle">
          <button type="button" className={`bdc-modo-btn ${modoCL === "recomendado" ? "bdc-modo-activo" : ""}`} onClick={() => setModoCL("recomendado")}>{modoCL === "recomendado" && <IconoCheck />}<span>Recomendado</span></button>
          <button type="button" className={`bdc-modo-btn ${modoCL === "manual" ? "bdc-modo-activo" : ""}`} onClick={() => setModoCL("manual")}>{modoCL === "manual" && <IconoCheck />}<span>Selección manual</span></button>
        </div>
      </div>
      <div className="layout-clima-bdc-fila2" style={{ marginTop: 0 }}>
        <div className="layout-clima-bdc-celda celda-bdc-rec">
          {infoActiva ? (
            <div className={`bdc-recomendada-card bdc-inset ${modoCL === "manual" ? "bdc-card-manual-activa" : ""}`}>
              <div className="bdc-rec-header"><IconoCloradorAutomatico /><div className="bdc-rec-titulo"><span className="bdc-rec-label">{modoCL === "recomendado" ? "Recomendado" : "Manual"}</span><span className="bdc-rec-modelo">{infoActiva.marca} · {nombreComercial(infoActiva)}{mostrarCodigo(infoActiva) && <span style={{color:"#94a3b8",fontSize:"0.8em"}}> {infoActiva.modelo}</span>}</span></div><span className={`bdc-modo-badge ${modoCL === "manual" ? "badge-manual" : "badge-auto"}`}>{modoCL === "manual" ? "Manual" : "Auto"}</span></div>
              <div className="bdc-rec-stats"><div className="bdc-stat"><span className="bdc-stat-valor">{infoActiva.cantidad}</span><span className="bdc-stat-label">equipos</span></div><div className="bdc-stat-sep" /><div className="bdc-stat"><span className="bdc-stat-valor">{parseFloat(infoActiva.flujoTotal).toFixed(1)}</span><span className="bdc-stat-label">GPM total</span></div><div className="bdc-stat-sep" /><div className="bdc-stat"><span className="bdc-stat-valor">{infoActiva.cargaTotal}</span><span className="bdc-stat-label">ft CDT</span></div><div className="bdc-stat-sep" /><div className="bdc-stat"><span className="bdc-stat-valor">{infoActiva.cargaTotalPSI}</span><span className="bdc-stat-label">PSI</span></div></div>
              <div className="bdc-rec-demanda"><div className="bdc-demanda-fila"><span className="bdc-demanda-label">Instalación</span><span className="bdc-demanda-valor">{labelInst(infoActiva.instalacion)}</span></div></div>
              <div className="bdc-rec-hidraulica"><span className="bdc-hid-label">Carga hidráulica</span><span className="bdc-hid-valor">{infoActiva.cargaTotal} ft · {infoActiva.cargaTotalPSI} PSI</span></div>
            </div>
          ) : (
            <div className="bdc-recomendada-card bdc-pendiente bdc-inset"><div className="bdc-rec-header"><IconoCloradorAutomatico /><div className="bdc-rec-titulo"><span className="bdc-rec-label">Clorador automático</span><span className="bdc-rec-modelo bdc-pendiente-txt">{modoCL === "recomendado" ? "Completa las dimensiones" : "Selecciona un equipo"}</span></div></div></div>
          )}
        </div>
        <div className="layout-clima-bdc-celda celda-bdc-manual">
          {modoCL === "recomendado" && rec && (
            <div className="bdc-info-automatica bdc-inset">
              <div className="bdc-manual-header"><span className="bdc-manual-titulo">Detalle automático</span></div>
              <div className="bdc-auto-detalle">
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Marca</span><span className="bdc-auto-val">{rec.seleccion.marca}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Modelo</span><span className="bdc-auto-val">{rec.seleccion.modelo}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Instalación</span><span className="bdc-auto-val">{labelInst(rec.seleccion.instalacion)}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Cantidad</span><span className="bdc-auto-val">{rec.seleccion.cantidad}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Flujo total</span><span className="bdc-auto-val">{rec.seleccion.flujoTotal} GPM</span></div>
                <div className="bdc-auto-sep" />
                <div className="bdc-auto-fila bdc-auto-total"><span className="bdc-auto-label">Carga total</span><span className="bdc-auto-val bdc-hid-val-highlight">{rec.cargaTotal} ft · {rec.cargaTotalPSI} PSI</span></div>
              </div>
            </div>
          )}
          {modoCL === "manual" && (
            <div className="bdc-selector-manual bdc-inset">
              <div className="bdc-manual-header"><span className="bdc-manual-titulo">Catálogo — {labelInst(instalacion)}</span></div>
              <div className="bdc-manual-filtros"><div className="campo"><label>Marca</label><select value={filtroMarca} onChange={e => setFiltroMarca(e.target.value)}>{marcasDisponibles.map(m => <option key={m} value={m}>{m === "todas" ? "Todas las marcas" : m}</option>)}</select></div></div>
              <div className="bdc-manual-lista">
                {catalogoFiltrado.map(c => {
                  const esRec = rec && c.marca === rec.seleccion.marca && c.modelo === rec.seleccion.modelo;
                  const sel   = selManualCLId === c.id;
                  return (
                    <div key={c.id} className={`bdc-manual-fila ${sel ? "bdc-manual-fila-activa" : ""}`} onClick={() => { setSelManualCLId(sel ? null : c.id); setSelManualCLCant(1); }}>
                      <div className="bdc-manual-fila-info"><span className="bdc-manual-marca">{c.marca}</span><span className="bdc-manual-modelo">{nombreComercial(c)}</span>{mostrarCodigo(c) && <span className="bdc-manual-vel" style={{color:"#64748b",fontSize:"0.6rem"}}>{c.modelo}</span>}<span className="bdc-manual-vel vel-1v">{c.specs.flujo} GPM</span>{esRec && <span className="bdc-manual-badge-rec">★ Rec.</span>}</div>
                      <div className="bdc-manual-fila-cap">{c.specs.capacidadComercial} kg/día</div>
                    </div>
                  );
                })}
                {catalogoFiltrado.length === 0 && <div className="bdc-manual-vacio">Sin modelos</div>}
              </div>
              {selManualCLId && (
                <div className="bdc-manual-resultado">
                  <div className="bdc-manual-cant-row"><span className="bdc-manual-cant-label">Cantidad</span><div className="bdc-manual-cant-ctrl"><button onClick={() => setSelManualCLCant(c => Math.max(1, c - 1))}>−</button><span>{selManualCLCant}</span><button onClick={() => setSelManualCLCant(c => c + 1)}>+</button></div></div>
                  {cloradorManual && (<>
                    <div className="bdc-demanda-fila"><span className="bdc-demanda-label">Flujo total</span><span className="bdc-demanda-valor">{parseFloat(cloradorManual.flujoTotal).toFixed(1)} GPM</span></div>
                    <div className="bdc-auto-sep" style={{ margin: "0.5rem 0" }} />
                    <div className="bdc-auto-fila bdc-auto-total"><span className="bdc-auto-label">Carga total</span><span className="bdc-auto-val bdc-hid-val-highlight">{cloradorManual.hidraulica?.cargaTotal} ft · {cloradorManual.hidraulica?.cargaTotalPSI} PSI</span></div>
                  </>)}
                </div>
              )}
              {!selManualCLId && <div className="bdc-manual-hint">Selecciona un equipo del catálogo</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   BLOQUE LÁMPARA UV
   — onCargaChange sube la carga al padre (App.jsx)
===================================================== */
function BloqueLamparaUV({ flujoMaxSistema, onCargaChange = null, onEstadoChange = null }) {
  const [modoUV, setModoUV]               = useState("recomendado");
  const [selManualUVId, setSelManualUVId] = useState(null);
  const [selManualUVCant, setSelManualUVCant] = useState(1);

  const rec = useMemo(() => {
    if (!flujoMaxSistema || flujoMaxSistema <= 0) return null;
    try { const r = generadorUV(flujoMaxSistema, flujoMaxSistema); return r?.error ? null : r; }
    catch { return null; }
  }, [flujoMaxSistema]);

  const uvManual = useMemo(() => {
    if (!selManualUVId || selManualUVCant <= 0) return null;
    const equipo = generadoresUV.find(g => g.id === selManualUVId);
    if (!equipo) return null;
    try {
      const hidraulica = calcularCargaUVManual(equipo.specs.flujo, selManualUVCant);
      if (hidraulica?.error) return null;
      return { equipo, cantidad: selManualUVCant, flujoTotal: equipo.specs.flujo * selManualUVCant, hidraulica };
    } catch { return null; }
  }, [selManualUVId, selManualUVCant]);

  const infoActiva = useMemo(() => {
    if (modoUV === "manual" && uvManual)
      return { id: uvManual.equipo.id, marca: uvManual.equipo.marca, modelo: uvManual.equipo.modelo, cantidad: uvManual.cantidad, flujoTotal: uvManual.flujoTotal, cargaTotal: uvManual.hidraulica?.cargaTotal, cargaTotalPSI: uvManual.hidraulica?.cargaTotalPSI };
    if (rec) {
      const eqRecUV = generadoresUV.find(g => g.marca === rec.seleccion.marca && g.modelo === rec.seleccion.modelo);
      return { id: eqRecUV?.id ?? rec.seleccion.id ?? rec.id, marca: rec.seleccion.marca, modelo: rec.seleccion.modelo, cantidad: rec.seleccion.cantidad, flujoTotal: rec.seleccion.flujoTotal, cargaTotal: rec.cargaTotal, cargaTotalPSI: rec.cargaTotalPSI };
    };
    return null;
  }, [modoUV, uvManual, rec]);

  // ── Reportar carga al padre ──
  const cargaUVFt = infoActiva?.cargaTotal != null ? (parseFloat(infoActiva.cargaTotal) || null) : null;
  useEffect(() => { if (onCargaChange) onCargaChange(cargaUVFt); }, [cargaUVFt]);
  useEffect(() => {
    if (onEstadoChange) onEstadoChange(infoActiva ? { marca: infoActiva.marca, modelo: infoActiva.modelo, cantidad: infoActiva.cantidad, flujoTotal: infoActiva.flujoTotal } : null);
  }, [infoActiva?.marca, infoActiva?.modelo, infoActiva?.cantidad]);

  if (!flujoMaxSistema || flujoMaxSistema <= 0) return <div className="sanitizacion-pendiente">Completa las dimensiones para calcular el flujo máximo del sistema</div>;

  return (
    <div className="sanitizacion-bloque-equipo">
      <div className="bdc-modo-toggle-wrapper">
        <div className="bdc-modo-toggle">
          <button type="button" className={`bdc-modo-btn ${modoUV === "recomendado" ? "bdc-modo-activo" : ""}`} onClick={() => setModoUV("recomendado")}>{modoUV === "recomendado" && <IconoCheck />}<span>Recomendado</span></button>
          <button type="button" className={`bdc-modo-btn ${modoUV === "manual" ? "bdc-modo-activo" : ""}`} onClick={() => setModoUV("manual")}>{modoUV === "manual" && <IconoCheck />}<span>Selección manual</span></button>
        </div>
      </div>
      <div style={{ fontSize: "0.7rem", color: "#94a3b8", padding: "0.25rem 0.5rem 0.5rem" }}>
        Flujo máximo: <span style={{ color: "#34d399", fontWeight: 600 }}>{parseFloat(flujoMaxSistema).toFixed(1)} GPM</span>
      </div>
      <div className="layout-clima-bdc-fila2" style={{ marginTop: 0 }}>
        <div className="layout-clima-bdc-celda celda-bdc-rec">
          {infoActiva ? (
            <div className={`bdc-recomendada-card bdc-inset ${modoUV === "manual" ? "bdc-card-manual-activa" : ""}`}>
              <div className="bdc-rec-header"><IconoLamparaUV /><div className="bdc-rec-titulo"><span className="bdc-rec-label">{modoUV === "recomendado" ? "Recomendado" : "Manual"}</span><span className="bdc-rec-modelo">{infoActiva.marca} · {nombreComercial(infoActiva)}{mostrarCodigo(infoActiva) && <span style={{color:"#94a3b8",fontSize:"0.8em"}}> {infoActiva.modelo}</span>}</span></div><span className={`bdc-modo-badge ${modoUV === "manual" ? "badge-manual" : "badge-auto"}`}>{modoUV === "manual" ? "Manual" : "Auto"}</span></div>
              <div className="bdc-rec-stats"><div className="bdc-stat"><span className="bdc-stat-valor">{infoActiva.cantidad}</span><span className="bdc-stat-label">equipos</span></div><div className="bdc-stat-sep" /><div className="bdc-stat"><span className="bdc-stat-valor">{parseFloat(infoActiva.flujoTotal).toFixed(1)}</span><span className="bdc-stat-label">GPM total</span></div><div className="bdc-stat-sep" /><div className="bdc-stat"><span className="bdc-stat-valor">{infoActiva.cargaTotal}</span><span className="bdc-stat-label">ft CDT</span></div><div className="bdc-stat-sep" /><div className="bdc-stat"><span className="bdc-stat-valor">{infoActiva.cargaTotalPSI}</span><span className="bdc-stat-label">PSI</span></div></div>
              <div className="bdc-rec-hidraulica"><span className="bdc-hid-label">Carga hidráulica</span><span className="bdc-hid-valor">{infoActiva.cargaTotal} ft · {infoActiva.cargaTotalPSI} PSI</span></div>
            </div>
          ) : (
            <div className="bdc-recomendada-card bdc-pendiente bdc-inset"><div className="bdc-rec-header"><IconoLamparaUV /><div className="bdc-rec-titulo"><span className="bdc-rec-label">Lámpara UV</span><span className="bdc-rec-modelo bdc-pendiente-txt">{modoUV === "recomendado" ? "Calculando..." : "Selecciona un equipo"}</span></div></div></div>
          )}
        </div>
        <div className="layout-clima-bdc-celda celda-bdc-manual">
          {modoUV === "recomendado" && rec && (
            <div className="bdc-info-automatica bdc-inset">
              <div className="bdc-manual-header"><span className="bdc-manual-titulo">Detalle automático</span></div>
              <div className="bdc-auto-detalle">
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Marca</span><span className="bdc-auto-val">{rec.seleccion.marca}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Modelo</span><span className="bdc-auto-val">{rec.seleccion.modelo}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Cantidad</span><span className="bdc-auto-val">{rec.seleccion.cantidad}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Flujo total</span><span className="bdc-auto-val">{rec.seleccion.flujoTotal} GPM</span></div>
                <div className="bdc-auto-sep" />
                <div className="bdc-auto-fila bdc-auto-total"><span className="bdc-auto-label">Carga total</span><span className="bdc-auto-val bdc-hid-val-highlight">{rec.cargaTotal} ft · {rec.cargaTotalPSI} PSI</span></div>
              </div>
            </div>
          )}
          {modoUV === "manual" && (
            <div className="bdc-selector-manual bdc-inset">
              <div className="bdc-manual-header"><span className="bdc-manual-titulo">Catálogo — Lámparas UV</span></div>
              <div className="bdc-manual-lista">
                {generadoresUV.filter(g => g.metadata.activo).map(g => {
                  const esRec = rec && g.marca === rec.seleccion.marca && g.modelo === rec.seleccion.modelo;
                  const sel   = selManualUVId === g.id;
                  return (
                    <div key={g.id} className={`bdc-manual-fila ${sel ? "bdc-manual-fila-activa" : ""}`} onClick={() => { setSelManualUVId(sel ? null : g.id); setSelManualUVCant(1); }}>
                      <div className="bdc-manual-fila-info"><span className="bdc-manual-marca">{g.marca}</span><span className="bdc-manual-modelo">{nombreComercial(g)}</span>{mostrarCodigo(g) && <span className="bdc-manual-vel" style={{color:"#64748b",fontSize:"0.6rem"}}>{g.modelo}</span>}<span className="bdc-manual-vel vel-1v">{g.specs.flujo} GPM</span>{esRec && <span className="bdc-manual-badge-rec">★ Rec.</span>}</div>
                    </div>
                  );
                })}
              </div>
              {selManualUVId && (
                <div className="bdc-manual-resultado">
                  <div className="bdc-manual-cant-row"><span className="bdc-manual-cant-label">Cantidad</span><div className="bdc-manual-cant-ctrl"><button onClick={() => setSelManualUVCant(c => Math.max(1, c - 1))}>−</button><span>{selManualUVCant}</span><button onClick={() => setSelManualUVCant(c => c + 1)}>+</button></div></div>
                  {uvManual && (<>
                    <div className="bdc-demanda-fila"><span className="bdc-demanda-label">Flujo total</span><span className={`bdc-demanda-valor ${uvManual.flujoTotal >= flujoMaxSistema ? "bdc-ok" : "bdc-insuf"}`}>{parseFloat(uvManual.flujoTotal).toFixed(1)} GPM</span></div>
                    {uvManual.flujoTotal < flujoMaxSistema && <div className="bdc-manual-aviso">⚠ Flujo insuficiente — agrega más equipos</div>}
                    <div className="bdc-auto-sep" style={{ margin: "0.5rem 0" }} />
                    <div className="bdc-auto-fila bdc-auto-total"><span className="bdc-auto-label">Carga total</span><span className="bdc-auto-val bdc-hid-val-highlight">{uvManual.hidraulica?.cargaTotal} ft · {uvManual.hidraulica?.cargaTotalPSI} PSI</span></div>
                  </>)}
                </div>
              )}
              {!selManualUVId && <div className="bdc-manual-hint">Selecciona un equipo del catálogo</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   BLOQUE MOTOBOMBA
===================================================== */
function BloqueMotobomba({ flujoMaximo, cargaRequerida, onEstadoChange = null }) {
  const [modo, setModo]               = useState("recomendado");
  const [selId, setSelId]             = useState(null);
  const [selCant, setSelCant]         = useState(null);
  const [filtroMarca, setFiltroMarca] = useState("todas");

  const rec = useMemo(() => {
    if (!flujoMaximo || !cargaRequerida || flujoMaximo <= 0 || cargaRequerida <= 0) return null;
    try { const r = seleccionarMotobomba(flujoMaximo, cargaRequerida); return r?.error ? null : r; }
    catch { return null; }
  }, [flujoMaximo, cargaRequerida]);

  const marcas = useMemo(() => ["todas", ...new Set(motobombas1v.map(b => b.marca))], []);
  const catalogoFiltrado = useMemo(() =>
    motobombas1v.filter(b => filtroMarca === "todas" || b.marca === filtroMarca),
  [filtroMarca]);

  const cantMin = useMemo(() => {
    if (!selId || !flujoMaximo || !cargaRequerida) return 1;
    const b = motobombas1v.find(b => b.id === selId);
    return b ? (cantidadMinima(b, flujoMaximo, cargaRequerida) ?? 1) : 1;
  }, [selId, flujoMaximo, cargaRequerida]);

  const handleSel = (id) => {
    if (selId === id) { setSelId(null); setSelCant(null); return; }
    setSelId(id);
    const b = motobombas1v.find(b => b.id === id);
    setSelCant(b && flujoMaximo && cargaRequerida ? (cantidadMinima(b, flujoMaximo, cargaRequerida) ?? 1) : 1);
  };

  let manualCalc = null;
  if (selId && selCant && flujoMaximo && cargaRequerida) {
    const b = motobombas1v.find(b => b.id === selId);
    if (b) {
      const op = puntoOperacion(b, flujoMaximo, selCant);
      if (op) manualCalc = { bomba: b, ...op, flujoMaximo: parseFloat(flujoMaximo.toFixed(2)), cargaRequerida: parseFloat(cargaRequerida.toFixed(2)) };
    }
  }

  const infoActiva  = modo === "recomendado" ? rec : manualCalc;
  const estBActual  = infoActiva ? { bombaId: infoActiva.bomba.id, nBombas: infoActiva.n ?? infoActiva.cantidad, modelo: infoActiva.bomba.modelo, marca: infoActiva.bomba.marca } : null;
  useEffect(() => { if (onEstadoChange) onEstadoChange(estBActual); }, [JSON.stringify(estBActual)]);

  if (!flujoMaximo || !cargaRequerida || flujoMaximo <= 0 || cargaRequerida <= 0) {
    return <div className="sanitizacion-pendiente">Completa dimensiones, calentamiento y equipamiento para calcular el CDT total del sistema</div>;
  }

  const cargaCubre = infoActiva ? infoActiva.cargaDisponible >= cargaRequerida : false;

  return (
    <div className="sanitizacion-bloque-equipo">
      <div className="bdc-modo-toggle-wrapper">
        <div className="bdc-modo-toggle">
          <button type="button" className={`bdc-modo-btn ${modo === "recomendado" ? "bdc-modo-activo" : ""}`} onClick={() => setModo("recomendado")}>{modo === "recomendado" && <IconoCheck />}<span>Recomendado</span></button>
          <button type="button" className={`bdc-modo-btn ${modo === "manual" ? "bdc-modo-activo" : ""}`} onClick={() => setModo("manual")}>{modo === "manual" && <IconoCheck />}<span>Selección manual</span></button>
        </div>
      </div>
      <div style={{ fontSize: "0.7rem", color: "#94a3b8", padding: "0.25rem 0.5rem 0.5rem", display: "flex", gap: "1.2rem" }}>
        <span>Flujo máx: <span style={{ color: "#38bdf8", fontWeight: 600 }}>{parseFloat(flujoMaximo).toFixed(1)} GPM</span></span>
        <span>CDT requerido: <span style={{ color: "#f97316", fontWeight: 600 }}>{parseFloat(cargaRequerida).toFixed(2)} ft</span></span>
      </div>
      <div className="layout-clima-bdc-fila2" style={{ marginTop: 0 }}>
        <div className="layout-clima-bdc-celda celda-bdc-rec">
          {infoActiva ? (
            <div className={`bdc-recomendada-card bdc-inset ${modo === "manual" ? "bdc-card-manual-activa" : ""}`}>
              <div className="bdc-rec-header"><IconoMotobomba /><div className="bdc-rec-titulo"><span className="bdc-rec-label">{modo === "recomendado" ? "Recomendado" : "Manual"}</span><span className="bdc-rec-modelo">{infoActiva.bomba.marca} · {nombreComercial(infoActiva.bomba)}{mostrarCodigo(infoActiva.bomba) && <span style={{color:"#94a3b8",fontSize:"0.8em"}}> {infoActiva.bomba.modelo}</span>} <span style={{color:"#64748b",fontSize:"0.82em"}}>{infoActiva.bomba.potencia_hp} HP</span></span></div><span className={`bdc-modo-badge ${modo === "manual" ? "badge-manual" : "badge-auto"}`}>{modo === "manual" ? "Manual" : "Auto"}</span></div>
              <div className="bdc-rec-stats">
                <div className="bdc-stat"><span className="bdc-stat-valor">{infoActiva.n ?? infoActiva.cantidad}</span><span className="bdc-stat-label">bombas</span></div>
                <div className="bdc-stat-sep" />
                <div className="bdc-stat"><span className="bdc-stat-valor">{parseFloat(infoActiva.flujoPorBomba).toFixed(1)}</span><span className="bdc-stat-label">GPM/bomba</span></div>
                <div className="bdc-stat-sep" />
                <div className="bdc-stat"><span className="bdc-stat-valor">{infoActiva.potenciaTotal}</span><span className="bdc-stat-label">HP total</span></div>
              </div>
              <div className="bdc-rec-demanda">
                <div className="bdc-demanda-fila"><span className="bdc-demanda-label">Potencia unitaria</span><span className="bdc-demanda-valor">{infoActiva.bomba.potencia_hp} HP</span></div>
                <div className="bdc-demanda-fila"><span className="bdc-demanda-label">CDT disponible</span><span className={`bdc-demanda-valor ${cargaCubre ? "bdc-ok" : "bdc-insuf"}`}>{parseFloat(infoActiva.cargaDisponible).toFixed(2)} ft</span></div>
                <div className="bdc-demanda-fila"><span className="bdc-demanda-label">CDT requerido</span><span className="bdc-demanda-valor">{parseFloat(cargaRequerida).toFixed(2)} ft</span></div>
                {!cargaCubre && <div className="bdc-manual-aviso">⚠ CDT disponible insuficiente</div>}
              </div>
            </div>
          ) : (
            <div className="bdc-recomendada-card bdc-pendiente bdc-inset"><div className="bdc-rec-header"><IconoMotobomba /><div className="bdc-rec-titulo"><span className="bdc-rec-label">Motobomba</span><span className="bdc-rec-modelo bdc-pendiente-txt">{modo === "recomendado" ? "Calculando selección..." : "Selecciona una bomba"}</span></div></div></div>
          )}
        </div>
        <div className="layout-clima-bdc-celda celda-bdc-manual">
          {modo === "recomendado" && rec && (
            <div className="bdc-info-automatica bdc-inset">
              <div className="bdc-manual-header"><span className="bdc-manual-titulo">Detalle de selección automática</span></div>
              <div className="bdc-auto-detalle">
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Marca</span><span className="bdc-auto-val">{rec.bomba.marca}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Nombre</span><span className="bdc-auto-val">{nombreComercial(rec.bomba)}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Código</span><span className="bdc-auto-val" style={{color:"#64748b"}}>{rec.bomba.modelo}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Cantidad</span><span className="bdc-auto-val">{rec.n ?? rec.cantidad} bomba{(rec.n ?? rec.cantidad) > 1 ? "s" : ""} en paralelo</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Flujo por bomba</span><span className="bdc-auto-val">{parseFloat(rec.flujoPorBomba).toFixed(2)} GPM</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Potencia unitaria</span><span className="bdc-auto-val">{rec.bomba.potencia_hp} HP</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Potencia total</span><span className="bdc-auto-val">{rec.potenciaTotal} HP</span></div>
                <div className="bdc-auto-sep" />
                <div className="bdc-auto-fila"><span className="bdc-auto-label">CDT requerido</span><span className="bdc-auto-val">{parseFloat(cargaRequerida).toFixed(2)} ft</span></div>
                <div className="bdc-auto-fila bdc-auto-total"><span className="bdc-auto-label">CDT disponible</span><span className="bdc-auto-val bdc-hid-val-highlight">{parseFloat(rec.cargaDisponible).toFixed(2)} ft</span></div>
              </div>
            </div>
          )}
          {modo === "manual" && (
            <div className="bdc-selector-manual bdc-inset">
              <div className="bdc-manual-header"><span className="bdc-manual-titulo">Catálogo — Motobombas</span></div>
              <div className="bdc-manual-filtros"><div className="campo"><label>Marca</label><select value={filtroMarca} onChange={e => setFiltroMarca(e.target.value)}>{marcas.map(m => <option key={m} value={m}>{m === "todas" ? "Todas las marcas" : m}</option>)}</select></div></div>
              <div className="bdc-manual-lista">
                {catalogoFiltrado.map(b => {
                  const esRec = rec && b.id === rec.bomba.id;
                  const sel   = selId === b.id;
                  const nMin  = flujoMaximo && cargaRequerida ? (cantidadMinima(b, flujoMaximo, cargaRequerida) ?? "—") : "—";
                  return (
                    <div key={b.id} className={`bdc-manual-fila ${sel ? "bdc-manual-fila-activa" : ""}`} onClick={() => handleSel(b.id)}>
                      <div className="bdc-manual-fila-info"><span className="bdc-manual-marca">{b.marca}</span><span className="bdc-manual-modelo">{nombreComercial(b)}</span>{mostrarCodigo(b) && <span className="bdc-manual-vel" style={{color:"#64748b",fontSize:"0.6rem"}}>{b.modelo}</span>}<span className="bdc-manual-vel vel-1v">{b.potencia_hp} HP</span>{esRec && <span className="bdc-manual-badge-rec">★ Rec.</span>}</div>
                      <div className="bdc-manual-fila-cap" style={{ color: "#64748b", fontSize: "0.68rem" }}>{nMin !== "—" ? `mín. ${nMin}` : "no cubre CDT"}</div>
                    </div>
                  );
                })}
              </div>
              {selId && selCant !== null && (
                <div className="bdc-manual-resultado">
                  <div className="bdc-manual-cant-row"><span className="bdc-manual-cant-label">Cantidad <span style={{ color: "#64748b", fontWeight: 400 }}>(mín. {cantMin})</span></span><div className="bdc-manual-cant-ctrl"><button onClick={() => setSelCant(c => Math.max(cantMin, c - 1))}>−</button><span>{selCant}</span><button onClick={() => setSelCant(c => c + 1)}>+</button></div></div>
                  {manualCalc && (<>
                    <div className="bdc-demanda-fila"><span className="bdc-demanda-label">Flujo por bomba</span><span className="bdc-demanda-valor">{parseFloat(manualCalc.flujoPorBomba).toFixed(2)} GPM</span></div>
                    <div className="bdc-demanda-fila"><span className="bdc-demanda-label">CDT disponible</span><span className={`bdc-demanda-valor ${manualCalc.cargaDisponible >= cargaRequerida ? "bdc-ok" : "bdc-insuf"}`}>{parseFloat(manualCalc.cargaDisponible).toFixed(2)} ft</span></div>
                    <div className="bdc-demanda-fila"><span className="bdc-demanda-label">Potencia total</span><span className="bdc-demanda-valor bdc-ok">{manualCalc.potenciaTotal} HP</span></div>
                    {manualCalc.cargaDisponible < cargaRequerida && <div className="bdc-manual-aviso">⚠ CDT insuficiente — agrega más bombas</div>}
                  </>)}
                </div>
              )}
              {!selId && <div className="bdc-manual-hint">Selecciona una bomba del catálogo para calcular</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   BLOQUE VERIFICACIÓN DEL DISEÑO
===================================================== */
function BloqueVerificacion({ flujoMaxGlobal, cargaTotalGlobal, estados, cargas, datosEmpotrable, tieneDesbordeCanal, usoGeneral, bombaId, nBombas, estadoBomba = null, equiposCalentamiento = [], sistemasSanitizacion = {}, sistemasFiltracion = {}, datosSanitizacion = {}, datosPorSistema = null, resultadoClorador = null, onAjustarCargas = null, flujoInfinityVal = null, flujoFiltradoVal = null, volumenTotalVal = null, sistemaActivo = null }) {
  const [fase, setFase]           = useState("idle");
  const [lineasTerminal, setLineasTerminal] = useState([]);
  const [resultado, setResultado] = useState(null);
  const contenedorRef             = useRef(null);
  const terminalRef               = useRef(null);
  const autoScrollRef             = useRef(true);  // pausar auto-scroll si usuario sube

  const puedeVerificar = flujoMaxGlobal && cargaTotalGlobal && bombaId;

  // Convierte los pasos reales del algoritmo en líneas para el terminal
  const construirLineasTerminal = (res) => {
    const lineas = [];
    const f2 = (v) => parseFloat(v ?? 0).toFixed(2);
    const f1 = (v) => parseFloat(v ?? 0).toFixed(1);

    lineas.push({ tipo: "titulo", texto: "▶ Iniciando análisis hidráulico..." });
    lineas.push({ tipo: "info",   texto: `  Sistema: ${f1(flujoMaxGlobal)} GPM  |  CDT diseño: ${f2(cargaTotalGlobal)} ft` });
    lineas.push({ tipo: "info",   texto: `  Motobomba: ${res?.bomba?.marca ?? ""} ${res?.bomba?.modelo ?? ""}  ×${nBombas}` });
    lineas.push({ tipo: "sep",    texto: "" });
    lineas.push({ tipo: "titulo", texto: "▶ Analizando curva de la motobomba..." });
    const curva = res?.bomba?.curva ?? [];
    if (curva.length > 0) {
      lineas.push({ tipo: "ok", texto: `  Shut-off: ${f2(curva[0]?.carga_ft)} ft  |  Q máx: ${f1(curva[curva.length-1]?.flujo_gpm)} GPM` });
    }
    lineas.push({ tipo: "sep", texto: "" });

    // Separar pasos en iter1 y iter2
    const iters = res?.iteraciones ?? [];
    const pasosIter1 = [], pasosIter2 = [];
    let enIter2 = false;
    for (const it of iters) {
      if (it.separador) { enIter2 = true; continue; }
      if (enIter2) pasosIter2.push(it);
      else         pasosIter1.push(it);
    }

    // Helper: extraer solo los momentos clave de un grupo de pasos
    // Muestra: primer paso, un punto intermedio representativo, y equilibrio
    const momentosClave = (pasos) => {
      const noEq  = pasos.filter(p => !p.esEquilibrio);
      const eq    = pasos.find(p =>  p.esEquilibrio);
      const clave = [];

      if (noEq.length > 0) {
        // Primer paso — punto de partida
        clave.push({ ...noEq[0], tipo: "inicio" });
      }
      if (noEq.length >= 3) {
        // Punto intermedio — a ~60% del recorrido
        const midIdx = Math.floor(noEq.length * 0.6);
        clave.push({ ...noEq[midIdx], tipo: "medio" });
      } else if (noEq.length === 2) {
        clave.push({ ...noEq[1], tipo: "medio" });
      }
      if (eq) clave.push({ ...eq, tipo: "eq" });
      return clave;
    };

    const renderPasos = (pasos, simbolo) => {
      const clave = momentosClave(pasos);
      for (const p of clave) {
        const q    = parseFloat(p.flujoEquilibrio ?? 0).toFixed(1);
        const cdtS = parseFloat(p.cargaSalida ?? 0).toFixed(2);
        const cdtB = parseFloat(p.cargaDispBomba ?? 0).toFixed(2);
        const delta = Math.abs(parseFloat(cdtB) - parseFloat(cdtS)).toFixed(2);

        if (p.tipo === "eq") {
          lineas.push({ tipo: "eq",
            texto: `  ★ Convergido → Q = ${q} GPM  |  CDT = ${cdtS} ft` });
        } else if (p.tipo === "inicio") {
          const dir = parseFloat(cdtB) > parseFloat(cdtS) ? "bomba excede sistema" : "sistema excede bomba";
          lineas.push({ tipo: "paso",
            texto: `  ${simbolo} Iniciando en Q = ${q} GPM  |  Δ = ${delta} ft  (${dir})` });
        } else {
          lineas.push({ tipo: "paso",
            texto: `  ${simbolo} Ajustando...  Q = ${q} GPM  |  Δ = ${delta} ft` });
        }
      }
    };

    // Iter 1
    if (pasosIter1.length > 0) {
      lineas.push({ tipo: "titulo", texto: "▶ Iteración 1 — buscando punto de equilibrio..." });
      renderPasos(pasosIter1, "①");
    }

    // Iter 2
    lineas.push({ tipo: "sep", texto: "" });
    if (pasosIter2.length > 0) {
      lineas.push({ tipo: "titulo", texto: "▶ Iteración 2 — verificando con equipos ajustados..." });
      renderPasos(pasosIter2, "②");
    }

    lineas.push({ tipo: "sep",    texto: "" });
    const flujoFin = parseFloat(res?.equilibrio?.flujo ?? 0);
    const cdtFin   = parseFloat(res?.equilibrio?.carga ?? 0);
    const deltaPct = flujoMaxGlobal > 0 ? ((flujoFin - flujoMaxGlobal) / flujoMaxGlobal * 100) : 0;
    lineas.push({ tipo: "titulo", texto: "▶ Análisis completo." });
    lineas.push({ tipo: "ok",    texto: `  Punto de operación: ${flujoFin.toFixed(1)} GPM  @  ${cdtFin.toFixed(2)} ft` });
    lineas.push({ tipo: "ok",    texto: `  Δ vs diseño: ${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(1)}%` });
    return lineas;
  };

  const iniciarVerificacion = () => {
    if (!puedeVerificar) return;
    setFase("verificando"); setLineasTerminal([]); setResultado(null);

    // Scroll — buscar .selector-contenido o .eq-contenido que es el scrollable real
    setTimeout(() => {
      const el = contenedorRef.current;
      if (!el) return;
      // Buscar el contenedor con clase selector-contenido o eq-contenido
      const scrollableClasses = ["selector-contenido", "eq-contenido", "panel-derecho-contenido"];
      let scrollParent = null;
      let parent = el.parentElement;
      while (parent && parent !== document.body) {
        for (const cls of scrollableClasses) {
          if (parent.classList.contains(cls)) { scrollParent = parent; break; }
        }
        if (scrollParent) break;
        parent = parent.parentElement;
      }
      // Fallback: buscar por overflow
      if (!scrollParent) {
        parent = el.parentElement;
        while (parent && parent !== document.body) {
          const style = window.getComputedStyle(parent);
          if ((style.overflowY === "auto" || style.overflowY === "scroll") && parent.scrollHeight > parent.clientHeight) {
            scrollParent = parent; break;
          }
          parent = parent.parentElement;
        }
      }
      // selector-contenido es el contenedor correcto pero necesita tiempo
      // para que el terminal crezca y genere scroll
      // Buscar por clase directamente
      const selectorContenido = document.querySelector(".selector-contenido");
      if (selectorContenido && el) {
        const elRect     = el.getBoundingClientRect();
        const parentRect = selectorContenido.getBoundingClientRect();
        const offsetTop  = elRect.top - parentRect.top + selectorContenido.scrollTop - 20;
        selectorContenido.scrollTo({ top: offsetTop, behavior: "smooth" });
      }
    }, 80);

    autoScrollRef.current = true;
    // Calcular primero
    let res = null;
    try {
      const cargasBase     = Object.fromEntries(Object.entries(cargas).map(([k, v]) => [k, parseFloat(v ?? 0)]));
      const snapshotCargas = { ...cargasBase };
      const snapshotCDT    = cargaTotalGlobal;
      res = calcularEquilibrio({ bombaId, nBombas, flujoInicial: flujoMaxGlobal, cargaInicial: cargaTotalGlobal, estados, cargasIniciales: cargasBase, datosEmpotrable, tieneDesbordeCanal, usoGeneral });
      if (res && !res.error) { res._snapshotCargas = snapshotCargas; res._snapshotCDT = snapshotCDT; }
    } catch (e) { res = { error: e.message }; }

    // Construir líneas a partir del resultado real
    const lineas = res?.error
      ? [{ tipo: "error", texto: `⚠ ${res.error}` }]
      : construirLineasTerminal(res);

    // Reproducir línea a línea con delay
    const DELAY_BASE = 120;
    const delays = lineas.map((l, i) => {
      if (l.tipo === "sep")    return 40;
      if (l.tipo === "titulo") return 200;
      if (l.tipo === "eq")     return 350;
      return DELAY_BASE;
    });
    let acum = 0;
    lineas.forEach((linea, i) => {
      acum += delays[i] + (i > 0 ? delays[i-1] * 0.3 : 0);
      const t = acum;
      setTimeout(() => {
        setLineasTerminal(prev => [...prev, linea]);
        setTimeout(() => {
          // Auto-scroll del terminal — siempre hacia el fondo si autoScroll activo
          if (autoScrollRef.current && terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
          }
          // Re-intentar scroll del contenedor padre en cada línea nueva
          // para cuando el contenido crezca y genere scroll
          const sc = document.querySelector(".selector-contenido");
          const el2 = contenedorRef.current;
          if (sc && el2 && sc.scrollHeight > sc.clientHeight) {
            const elR  = el2.getBoundingClientRect();
            const scR  = sc.getBoundingClientRect();
            const top  = elR.top - scR.top + sc.scrollTop - 20;
            sc.scrollTo({ top, behavior: "smooth" });
          }
        }, 30);
      }, t);
    });

    // Mostrar resultado completo al terminar
    const totalDelay = acum + 400;
    setTimeout(() => { setResultado(res); setFase("listo"); }, totalDelay);
  };

  const resetear = () => { setFase("idle"); setLineasTerminal([]); setResultado(null); };

  if (!puedeVerificar) return null;

  // Normalizar campos — calcularEquilibrio puede devolver flujo/carga o flujoEquilibrio/cargaEquilibrio
  const eq = resultado?.equilibrio
    ? {
        ...resultado.equilibrio,
        flujoEq: resultado.equilibrio.flujoEquilibrio ?? resultado.equilibrio.flujo ?? null,
        cargaEq: resultado.equilibrio.cargaEquilibrio ?? resultado.equilibrio.carga ?? null,
      }
    : null;

  // Colores por tipo de línea del terminal
  const colorLinea = { titulo:"#60a5fa", info:"#94a3b8", ok:"#34d399", eq:"#34d399", paso:"#7dd3fc", paso_baja:"#f97316", sep:"#1e3a5f", error:"#f87171" };

  return (
    <div ref={contenedorRef} style={{ marginTop: "1.5rem", scrollMarginTop: "1rem" }}>
      <div className="selector-subtitulo" style={{ marginBottom: "0.75rem" }}>
        🔍 Verificación del diseño
        <span className="selector-subtitulo-hint">Punto de equilibrio hidráulico del sistema</span>
      </div>
      <div className="bdc-recomendada-card bdc-inset" style={{ padding: "1rem 1.2rem" }}>
        {fase === "idle" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "0.78rem", color: "var(--color-text-primary)", fontWeight: 500 }}>Verificar punto de operación real</div>
              <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "0.2rem" }}>Calcula el flujo y CDT de equilibrio usando 2 iteraciones con la motobomba seleccionada</div>
            </div>
            <button className="btn-primario" style={{ whiteSpace: "nowrap", marginLeft: "1rem" }} onClick={iniciarVerificacion}>Verificar diseño →</button>
          </div>
        )}

        {/* ── Terminal animado ── */}
        {(fase === "verificando" || fase === "listo") && (
          <div style={{ marginBottom: fase === "listo" ? "1.25rem" : 0 }}>
            {/* Header terminal */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"0.5rem" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                <span style={{ fontSize:"0.65rem", fontWeight:700, color: fase==="verificando"?"#fbbf24":"#34d399", textTransform:"uppercase", letterSpacing:"0.07em" }}>
                  {fase === "verificando" ? "● Analizando..." : "● Análisis completo"}
                </span>
              </div>
              {fase === "listo" && (
                <button className="btn-secundario" style={{ fontSize: "0.65rem", padding: "0.2rem 0.6rem" }} onClick={resetear}>↺ Reverificar</button>
              )}
            </div>
            {/* Cuerpo terminal */}
            <div ref={terminalRef}
              onScroll={(e) => {
                // Solo reaccionar si el scroll fue en el terminal mismo (no en un padre)
                if (e.target !== terminalRef.current) return;
                const el = e.currentTarget;
                const alFondo = el.scrollHeight - el.scrollTop - el.clientHeight < 20;
                autoScrollRef.current = alFondo;
              }}
              style={{
                background:"#0a0f1a", border:"1px solid #1e3a5f", borderRadius:"6px",
                padding:"0.75rem 1rem", fontFamily:"'Fira Code','Cascadia Code',monospace",
                fontSize:"0.69rem", lineHeight:"1.7",
                maxHeight:"320px", overflowY:"auto",
                scrollbarWidth:"thin", scrollbarColor:"#1e3a5f #0a0f1a",
              }}>
              {lineasTerminal.map((linea, i) => (
                linea.tipo === "sep"
                  ? <div key={i} style={{ height:"1px", background:"#0f2040", margin:"0.3rem 0" }} />
                  : <div key={i} style={{
                      color: colorLinea[linea.tipo] ?? "#94a3b8",
                      fontWeight: linea.tipo === "titulo" || linea.tipo === "eq" ? 700 : 400,
                      animation: "fadeInLine 0.2s ease-out",
                    }}>
                      {linea.texto}
                    </div>
              ))}
              {/* Cursor parpadeante */}
              {fase === "verificando" && (
                <span style={{ display:"inline-block", width:"8px", height:"13px", background:"#60a5fa", marginLeft:"2px", animation:"blink 1s step-end infinite", verticalAlign:"middle" }} />
              )}
            </div>
          </div>
        )}
        {fase === "listo" && resultado?.error && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px", padding: "0.6rem 0.8rem", fontSize: "0.73rem", color: "#f87171" }}>⚠ {resultado.error}</div>
        )}
        {fase === "listo" && eq && eq.flujoEq != null && !resultado.error && (<>

          {/* Punto de operación — resultado del proceso iterativo */}
          <div style={{ marginBottom: "0.75rem" }}>
            <div style={{ fontSize: "0.65rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>Punto de operación</div>
            <div className="bdc-rec-stats" style={{ background: "rgba(56,189,248,0.05)", borderRadius: "8px", padding: "0.6rem 0.75rem" }}>
              <div className="bdc-stat"><span className="bdc-stat-valor" style={{ color: "#38bdf8" }}>{parseFloat(eq.flujoEq).toFixed(1)}</span><span className="bdc-stat-label">GPM operación</span></div>
              <div className="bdc-stat-sep" />
              <div className="bdc-stat"><span className="bdc-stat-valor">{parseFloat(eq.cargaEq).toFixed(2)}</span><span className="bdc-stat-label">ft CDT sistema</span></div>
              <div className="bdc-stat-sep" />
              <div className="bdc-stat">
                <span className="bdc-stat-valor" style={{ color: Math.abs(eq.flujoEq - flujoMaxGlobal) < flujoMaxGlobal * 0.05 ? "#34d399" : "#f97316" }}>
                  {(((eq.flujoEq - flujoMaxGlobal) / flujoMaxGlobal) * 100).toFixed(1)}%
                </span>
                <span className="bdc-stat-label">Δ flujo</span>
              </div>
              <div className="bdc-stat-sep" />
              <div className="bdc-stat">
                <span className="bdc-stat-valor" style={{ color: Math.abs(eq.cargaEq - cargaTotalGlobal) < cargaTotalGlobal * 0.05 ? "#34d399" : "#f97316" }}>
                  {(((eq.cargaEq - cargaTotalGlobal) / cargaTotalGlobal) * 100).toFixed(1)}%
                </span>
                <span className="bdc-stat-label">Δ CDT</span>
              </div>
            </div>
          </div>

          {/* ══ RESUMEN COMPLETO DE EQUIPOS + CONFIRMACIÓN ══ */}
          <ResumenEquiposConfirmacion
            sistemaActivo={sistemaActivo}
            resultado={resultado}
            eq={eq}
            flujoMaxGlobal={flujoMaxGlobal}
            cargaTotalGlobal={cargaTotalGlobal}
            estadoBomba={estadoBomba}
            equiposCalentamiento={equiposCalentamiento}
            sistemasSanitizacion={sistemasSanitizacion}
            sistemasFiltracion={sistemasFiltracion}
            datosSanitizacion={datosSanitizacion}
            estados={estados}
            cargas={cargas}
            datosEmpotrable={datosEmpotrable}
            tieneDesbordeCanal={tieneDesbordeCanal}
            datosPorSistema={datosPorSistema}
            resultadoClorador={resultadoClorador}
            sistemasSeleccionadosSanit={sistemasSanitizacion}
            sistemasSeleccionadosFilt={sistemasFiltracion}
            onAjustarCargas={onAjustarCargas}
            flujoInfinityVal={flujoInfinityVal ?? null}
            flujoFiltradoVal={flujoFiltradoVal ?? null}
            volumenTotalVal={volumenTotalVal ?? null}
          />

        </>)}
      </div>
    </div>
  );
}

/* =====================================================
   RESUMEN COMPLETO DE EQUIPOS — confirmación final
===================================================== */
const NOMBRES_EQ = {
  retorno: "Retornos", desnatador: "Desnatadores", barredora: "Barredoras",
  drenFondo: "Drenes de fondo", drenCanal: "Drenes de canal",
  filtroArena: "Filtro de arena", prefiltro: "Prefiltro", filtroCartucho: "Filtro de cartucho",
};

function ResumenEquiposConfirmacion({
  resultado, eq, flujoMaxGlobal, cargaTotalGlobal,
  estadoBomba, equiposCalentamiento,
  sistemasSanitizacion, sistemasFiltracion, datosSanitizacion = {},
  estados, cargas, datosEmpotrable, tieneDesbordeCanal,
  datosPorSistema, resultadoClorador,
  sistemasSeleccionadosSanit, sistemasSeleccionadosFilt,
  onAjustarCargas,
  flujoInfinityVal = null,
  flujoFiltradoVal = null,
  volumenTotalVal  = null,
  sistemaActivo = null,
}) {
  const [confirmado, setConfirmado] = useState(false);

  const equiposRecalc = resultado?.equilibrio?.equipos ?? {};

  // ── Sección: grupo de filas ──
  const FilaEquipo = ({ color = "#94a3b8", nombre, subNombre, detalle, carga, badge, badgeColor }) => (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0.35rem 0.7rem", borderRadius: "5px", marginBottom: "0.2rem",
      background: badge === "ajuste" ? "rgba(249,115,22,0.07)" : "rgba(15,23,42,0.3)",
      border: `1px solid ${badge === "ajuste" ? "rgba(249,115,22,0.25)" : "rgba(255,255,255,0.04)"}`,
    }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem", flex: 1 }}>
        <span style={{ fontSize: "0.73rem", fontWeight: badge === "ajuste" ? 600 : 400, color }}>{nombre}</span>
        {subNombre && <span style={{ fontSize: "0.63rem", color: "#64748b" }}>{subNombre}</span>}
      </div>
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
        {detalle && <span style={{ fontSize: "0.68rem", color: "#64748b" }}>{detalle}</span>}
        {carga    && <span style={{ fontSize: "0.68rem", color: badge === "ajuste" ? "#f97316" : "#60a5fa", fontVariantNumeric: "tabular-nums" }}>{carga}</span>}
        {badge && (
          <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "0.1rem 0.45rem", borderRadius: "4px",
            background: badge === "ajuste" ? "rgba(249,115,22,0.15)" : badge === "ok" ? "rgba(52,211,153,0.12)" : "rgba(100,116,139,0.15)",
            color: badge === "ajuste" ? "#f97316" : badge === "ok" ? "#34d399" : "#64748b",
          }}>
            {badge === "ajuste" ? "↑ Ajustado" : badge === "ok" ? "✓ OK" : badge}
          </span>
        )}
      </div>
    </div>
  );

  const SeccionTitulo = ({ emoji, titulo }) => (
    <div style={{ fontSize: "0.63rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase",
      letterSpacing: "0.05em", margin: "0.65rem 0 0.25rem", paddingLeft: "0.2rem",
      display: "flex", alignItems: "center", gap: "0.4rem" }}>
      <span>{emoji}</span><span>{titulo}</span>
    </div>
  );

  const hayCambios = Object.values(equiposRecalc).some(e => e?.cambio);

  return (
    <div style={{ marginTop: "0.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
        <div style={{ fontSize: "0.65rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Resumen de equipos del sistema
        </div>
        {confirmado && (
          <span style={{ fontSize: "0.65rem", color: "#34d399", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}>
            ✓ Equipos confirmados
          </span>
        )}
      </div>

      {/* ── Motobomba ── */}
      <SeccionTitulo emoji="⚙️" titulo="Motobomba" />
      <FilaEquipo
        color="#7dd3fc"
        nombre={`${estadoBomba?.marca ?? "—"} · ${estadoBomba?.modelo ?? "—"}`}
        subNombre={`${estadoBomba?.nBombas ?? 1} bomba${(estadoBomba?.nBombas ?? 1) > 1 ? "s" : ""} en paralelo`}
        detalle={`Q = ${parseFloat(eq.flujoEq).toFixed(1)} GPM`}
        carga={`${parseFloat(eq.cargaEq).toFixed(2)} ft CDT`}
        badge="ok"
      />

      {/* ── Calentamiento ── */}
      {equiposCalentamiento?.length > 0 && (<>
        <SeccionTitulo emoji="🔥" titulo="Calentamiento" />
        {equiposCalentamiento.map(eq => (
          <FilaEquipo key={eq.key}
            color="#e2e8f0"
            nombre={`${eq.marca} · ${eq.modelo}`}
            subNombre={eq.label}
            detalle={`${eq.cantidad} equipo${eq.cantidad > 1 ? "s" : ""} · ${parseFloat(eq.flujoTotal ?? 0).toFixed(1)} GPM`}
            carga={eq.cargaTotal != null ? `${parseFloat(eq.cargaTotal).toFixed(2)} ft` : null}
            badge="ok"
          />
        ))}
      </>)}

      {/* ── Sanitización ── */}
      {Object.keys(sistemasSanitizacion ?? {}).some(k => sistemasSanitizacion[k]) && (<>
        <SeccionTitulo emoji="🧪" titulo="Sanitización" />

        {sistemasSanitizacion?.cloradorSalino && (() => {
          const d = datosSanitizacion?.cloradorSalino;
          return (
            <FilaEquipo color="#e2e8f0"
              nombre="Generador de cloro salino"
              subNombre={d?.marca && d?.modelo ? `${d.marca} · ${d.modelo}` : null}
              detalle={d?.cantidad != null ? `${d.cantidad} equipo${d.cantidad > 1 ? "s" : ""}${d.flujoTotal != null ? ` · ${parseFloat(d.flujoTotal).toFixed(1)} GPM` : ""}` : null}
              carga={cargas?.cloradorSalino != null ? `${parseFloat(cargas.cloradorSalino).toFixed(2)} ft` : null}
              badge="ok"
            />
          );
        })()}

        {sistemasSanitizacion?.cloradorAutomatico && (() => {
          const d = datosSanitizacion?.cloradorAutomatico;
          return (
            <FilaEquipo color="#e2e8f0"
              nombre="Clorador automático"
              subNombre={d?.marca && d?.modelo ? `${d.marca} · ${d.modelo}` : null}
              detalle={d?.cantidad != null ? `${d.cantidad} equipo${d.cantidad > 1 ? "s" : ""}${d.flujoTotal != null ? ` · ${parseFloat(d.flujoTotal).toFixed(1)} GPM` : ""}` : null}
              carga={cargas?.cloradorAutomatico != null ? `${parseFloat(cargas.cloradorAutomatico).toFixed(2)} ft` : null}
              badge="ok"
            />
          );
        })()}

        {sistemasSanitizacion?.lamparaUV && (() => {
          const d = datosSanitizacion?.lamparaUV;
          return (
            <FilaEquipo color="#e2e8f0"
              nombre="Lámpara UV"
              subNombre={d?.marca && d?.modelo ? `${d.marca} · ${d.modelo}` : null}
              detalle={d?.cantidad != null ? `${d.cantidad} equipo${d.cantidad > 1 ? "s" : ""}${d.flujoTotal != null ? ` · ${parseFloat(d.flujoTotal).toFixed(1)} GPM` : ""}` : null}
              carga={cargas?.lamparaUV != null ? `${parseFloat(cargas.lamparaUV).toFixed(2)} ft` : null}
              badge="ok"
            />
          );
        })()}
      </>)}

      {/* ── Empotrables ── */}
      {["retorno","desnatador","barredora","drenFondo","drenCanal"].some(k => estados[k] || equiposRecalc[k]) && (<>
        <SeccionTitulo emoji="💧" titulo="Empotrables" />
        {["retorno","desnatador","barredora","drenFondo","drenCanal"].map(key => {
          const est = estados[key];
          const rec = equiposRecalc[key];
          if (!est && !rec) return null;
          const nombre   = NOMBRES_EQ[key];
          const cantidad = rec ? rec.cantidad : est?.cantidad;
          const marca    = rec?.marca ?? "—";
          const modelo   = rec?.modelo ?? "—";
          const cargaVal = rec ? parseFloat(rec.sumaFinal ?? rec.cargaTotal ?? 0) : parseFloat(cargas[key] ?? 0);
          const cambio   = rec?.cambio ?? false;
          return (
            <FilaEquipo key={key}
              color={cambio ? "#f97316" : "#e2e8f0"}
              nombre={nombre}
              subNombre={`${marca} · ${modelo}`}
              detalle={cambio
                ? `${rec.cantOriginal} → ${rec.cantidad} uds`
                : `${cantidad ?? "—"} uds`}
              carga={cargaVal > 0 ? `${cargaVal.toFixed(2)} ft` : null}
              badge={cambio ? "ajuste" : "ok"}
            />
          );
        })}
      </>)}

      {/* ── Filtración ── */}
      {Object.keys(sistemasFiltracion ?? {}).some(k => sistemasFiltracion[k]) && (<>
        <SeccionTitulo emoji="🧹" titulo="Filtración" />
        {["filtroArena","prefiltro","filtroCartucho"].map(key => {
          if (!sistemasFiltracion[key]) return null;
          const est = estados[key];
          const rec = equiposRecalc[key];
          const nombre   = NOMBRES_EQ[key];
          const cantidad = rec ? rec.cantidad : est?.cantidad;
          const marca    = rec?.marca ?? "—";
          const modelo   = rec?.modelo ?? "—";
          const cargaVal = rec ? parseFloat(rec.cargaTotal ?? rec.sumaFinal ?? 0) : parseFloat(cargas[key] ?? 0);
          const cambio   = rec?.cambio ?? false;
          return (
            <FilaEquipo key={key}
              color={cambio ? "#f97316" : "#e2e8f0"}
              nombre={nombre}
              subNombre={`${marca} · ${modelo}`}
              detalle={cambio
                ? `${rec.cantOriginal} → ${rec.cantidad} uds`
                : `${cantidad ?? "—"} uds`}
              carga={cargaVal > 0 ? `${cargaVal.toFixed(2)} ft` : null}
              badge={cambio ? "ajuste" : "ok"}
            />
          );
        })}
      </>)}

      {/* ── Botones de acción ── */}
      <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem", flexDirection: "column" }}>

        {/* Confirmar ajustes (solo si hay cambios y no está confirmado aún) */}
        {hayCambios && !confirmado && (
          <div style={{ padding: "0.65rem 0.8rem", background: "rgba(249,115,22,0.07)", border: "1px solid rgba(249,115,22,0.25)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
            <div>
              <div style={{ fontSize: "0.73rem", color: "#f97316", fontWeight: 600 }}>
                {Object.values(equiposRecalc).filter(e => e?.cambio).length} equipo{Object.values(equiposRecalc).filter(e => e?.cambio).length > 1 ? "s requieren" : " requiere"} ajuste de cantidad
              </div>
              <div style={{ fontSize: "0.67rem", color: "#94a3b8", marginTop: "0.1rem" }}>
                Se actualizarán las cargas con las cantidades del punto de equilibrio
              </div>
            </div>
            <button
              className="btn-primario"
              style={{ whiteSpace: "nowrap", fontSize: "0.75rem", padding: "0.45rem 1rem", background: "linear-gradient(135deg, #9a3412, #7c2d12)", borderColor: "rgba(249,115,22,0.4)" }}
              onClick={() => {
                if (onAjustarCargas) onAjustarCargas({
                  equipos: equiposRecalc,
                  flujo:   resultado?.equilibrio?.flujo ?? null,
                  cdt:     resultado?.equilibrio?.carga ?? null,
                });
                setConfirmado(true);
              }}
            >
              Confirmar ajustes →
            </button>
          </div>
        )}

        {/* Todos OK o ya confirmado */}
        {(!hayCambios || confirmado) && (
          <div style={{ padding: "0.45rem 0.7rem", background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: "6px", fontSize: "0.7rem", color: "#34d399" }}>
            ✓ {confirmado ? "Ajustes confirmados — equipos actualizados" : "Todos los equipos cubren el flujo de equilibrio"}
          </div>
        )}

        {/* Generar memoria de cálculo — bloqueado si hay cambios pendientes de confirmar */}
        {hayCambios && !confirmado && (
          <div style={{ fontSize:"0.7rem", color:"#f97316", background:"rgba(249,115,22,0.06)", border:"1px solid rgba(249,115,22,0.2)", borderRadius:"6px", padding:"0.4rem 0.7rem" }}>
            ⚠ Confirma los ajustes de equipos antes de generar la memoria
          </div>
        )}
        <button
          className="btn-primario"
          disabled={hayCambios && !confirmado}
          style={{ width: "100%", padding: "0.6rem 1rem", fontSize: "0.8rem", fontWeight: 600, letterSpacing: "0.02em", opacity: hayCambios && !confirmado ? 0.4 : 1, cursor: hayCambios && !confirmado ? "not-allowed" : "pointer" }}
          onClick={() => {
            if (hayCambios && !confirmado) return;
            try {
              generarMemoriaCalculo({
                estados,
                datosEmpotrable,
                tieneDesbordeCanal,
                flujoMaxGlobal,
                tipoSistema: sistemaActivo ?? null,
                sistemaActivo: sistemaActivo ? (datosPorSistema?.[sistemaActivo] ?? null) : null,
                // Usar el CDT y cargas del momento del cálculo, no el estado actual (que puede haber sido modificado por "Confirmar")
                cargaTotalGlobal: resultado?._snapshotCDT ?? cargaTotalGlobal,
                tuberiaMaxGlobal: estadoBomba?.tubDescarga ?? null,
                flujoVolumen:     flujoMaxGlobal,
                flujoInfinityVal: flujoInfinityVal ?? null,
                flujoFiltradoVal: flujoFiltradoVal ?? null,
                vol:              volumenTotalVal ?? null,
                estadoBomba,
                equilibrio:       resultado ?? null,
                datosPorSistema,
                resultadoClorador,
                sistemasSeleccionadosSanit,
                sistemasSeleccionadosFilt,
                cargas: resultado?._snapshotCargas ?? cargas,
              });
              window.open("/memoria-calculo", "_blank");
            } catch (e) {
              console.error("Error generando memoria:", e);
              alert("Error al generar la memoria: " + e.message + "\n\n" + e.stack);
            }
          }}
        >
          📄 Generar memoria de cálculo
        </button>

      </div>
    </div>
  );
}

/* =====================================================
   COMPONENTE PRINCIPAL — Equipamiento
===================================================== */

/* =====================================================
   ÍCONOS DE PESTAÑAS
===================================================== */
const IconoTabSanitizacion = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
    <line x1="8" y1="4.5" x2="8" y2="8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="8" cy="10.8" r="1" fill="currentColor"/>
  </svg>
);
const IconoTabCalentamiento = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <path d="M5.5 13.5 Q5.5 10.5 7 8.5 Q8.5 6.5 7.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
    <path d="M9.5 13.5 Q9.5 11 10.8 9.5 Q12 8 11 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.55"/>
    <line x1="3" y1="13.5" x2="13" y2="13.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);
const IconoTabFiltracion = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <path d="M2.5 4 L13.5 4 L9.5 9 L9.5 13 L6.5 11.5 L6.5 9 Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" fill="none"/>
  </svg>
);
const IconoTabEmpotrables = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <circle cx="5" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
    <circle cx="11" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
    <line x1="1.5" y1="8" x2="2.5" y2="8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="13.5" y1="8" x2="14.5" y2="8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="7.5" y1="8" x2="8.5" y2="8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);
const IconoTabMotobomba = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <circle cx="6.5" cy="8" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
    <circle cx="6.5" cy="8" r="1.8" stroke="currentColor" strokeWidth="1" opacity="0.55"/>
    <rect x="11" y="5.5" width="3.5" height="5" rx="0.8" stroke="currentColor" strokeWidth="1.1"/>
    <line x1="11" y1="8" x2="9.8" y2="8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

export default function Equipamiento({
  setSeccion, sistemaActivo, datosPorSistema,
  setDatosPorSistema, configBombas, resultadoClorador,
  flujoMaxGlobal, cargaTotalGlobal,
  onSanitizacionChange,
  flujoInfinityVal = null,
  flujoFiltradoVal = null,
  volumenTotalVal  = null,
}) {
  const [tabActiva, setTabActiva] = useState("sanitizacion");

  const [sistemasSeleccionadosSanit, setSistemasSeleccionadosSanit] = useState({});
  const [sistemasSeleccionadosFilt,  setSistemasSeleccionadosFilt]  = useState({});
  const [cargas,      setCargas]      = useState({});
  const [estados,     setEstados]     = useState({});
  const [estadoBomba, setEstadoBomba] = useState(null);
  const [ajustesConfirmados, setAjustesConfirmados] = useState({});

  const setCarga = (key, valor) => setCargas(prev => prev[key] === valor ? prev : { ...prev, [key]: valor });
  const setEstado = (key, valor) => setEstados(prev => {
    if (JSON.stringify(prev[key]) === JSON.stringify(valor)) return prev;
    return { ...prev, [key]: valor };
  });

  useEffect(() => {
    if (onSanitizacionChange) onSanitizacionChange(sistemasSeleccionadosSanit);
  }, [sistemasSeleccionadosSanit]);

  useEffect(() => {
    setDatosPorSistema(ps => ({ ...ps, equipamiento: { ...(ps.equipamiento ?? {}), cargas } }));
  }, [cargas]);

  const datosDim      = datosPorSistema?.[sistemaActivo];
  const areaM2        = useMemo(() => areaTotal(datosDim),    [datosDim]);
  const volM3         = useMemo(() => volumenTotal(datosDim), [datosDim]);
  const volumenLitros = useMemo(() => volM3 * 1000,           [volM3]);
  const usoGeneral    = useMemo(() => datosDim?.usoGeneral ?? "residencial", [datosDim]);
  const tempC = useMemo(() => {
    const decision = datosPorSistema?.calentamiento?.decision;
    if (!decision || decision === "omitir") return 30;
    return datosPorSistema?.calentamiento?.tempDeseada ?? 30;
  }, [datosPorSistema?.calentamiento]);

  const equiposCalentamiento = useMemo(() =>
    extraerInfoCalentamiento(datosPorSistema?.calentamiento),
  [datosPorSistema?.calentamiento]);

  const datosEmpotrable = useMemo(() => {
    if (!datosDim || !Array.isArray(datosDim.cuerpos) || !datosDim.cuerpos[0]) return null;
    const c = datosDim.cuerpos[0];
    return {
      area:     c.area     ?? "0",
      profMin:  c.profMin  ?? "0",
      profMax:  c.profMax  ?? "0",
      distCuarto: datosDim.distCuarto ?? "0",
      largoInfinity: datosDim.largoInfinity ?? "0",
    };
  }, [datosDim]);

  const tieneDesbordeCanal = useMemo(() => {
    const d = datosDim?.desborde;
    return d === "infinity" || d === "canal" || d === "ambos";
  }, [datosDim?.desborde]);

  const recRetorno    = useMemo(() => datosEmpotrable ? recomendarRetorno(flujoMaxGlobal, datosEmpotrable)    : null, [flujoMaxGlobal, datosEmpotrable]);
  const recDesnatador = useMemo(() => datosEmpotrable ? recomendarDesnatador(flujoMaxGlobal, datosEmpotrable) : null, [flujoMaxGlobal, datosEmpotrable]);
  const recBarredora  = useMemo(() => datosEmpotrable ? recomendarBarredora(flujoMaxGlobal, datosEmpotrable)  : null, [flujoMaxGlobal, datosEmpotrable]);
  const recDrenFondo  = useMemo(() => datosEmpotrable ? recomendarDrenFondo(flujoMaxGlobal, datosEmpotrable)  : null, [flujoMaxGlobal, datosEmpotrable]);
  const recDrenCanal  = useMemo(() => datosEmpotrable ? recomendarDrenCanal(flujoMaxGlobal, datosEmpotrable)  : null, [flujoMaxGlobal, datosEmpotrable]);

  const CARGA_KEY_SANIT = { cloradorSalino: null, cloradorAutomatico: "cloradorAutomatico", lamparaUV: "lamparaUV" };
  const CARGA_KEY_FILT  = { filtroArena: "filtroArena", prefiltro: "prefiltro", filtroCartucho: "filtroCartucho" };

  const toggleSanitizacion = (key) => setSistemasSeleccionadosSanit(prev => {
    if (prev[key]) { const ck = CARGA_KEY_SANIT[key]; if (ck) setCarga(ck, null); const n = { ...prev }; delete n[key]; return n; }
    return { ...prev, [key]: true };
  });
  const toggleFiltracion = (key) => setSistemasSeleccionadosFilt(prev => {
    if (prev[key]) { const ck = CARGA_KEY_FILT[key]; if (ck) setCarga(ck, null); const n = { ...prev }; delete n[key]; return n; }
    return { ...prev, [key]: true };
  });

  const cargasTodas = useMemo(() => {
    const cal = datosPorSistema?.calentamiento ?? {};
    const ss  = cal.sistemasSeleccionados ?? {};
    const cargaCal = (modoKey, manualKey, manualPath, selKey, selPath) => {
      const modo = cal[modoKey] ?? "recomendado";
      const src  = modo === "manual"
        ? (cal[manualKey] && !cal[manualKey]?.error ? cal[manualKey] : null)
        : (cal[selKey]   && !cal[selKey]?.error    ? cal[selKey]    : null);
      if (!src) return null;
      const v = (modo === "manual" ? manualPath : selPath)(src);
      return v != null ? (parseFloat(v) || null) : null;
    };
    return {
      bombaCalor:          ss.bombaCalor          ? cargaCal("modoBDC",     "bdcManual",     m => m.hidraulica?.cargaTotal, "bdcSeleccionada",     s => s.cargaTotal)            : null,
      panelSolar:          ss.panelSolar          ? cargaCal("modoPS",      "psManual",      m => m.hidraulica?.cargaTotal, "psSeleccionado",      s => s.hidraulica?.cargaTotal) : null,
      caldera:             ss.caldera             ? cargaCal("modoCaldera", "calderaManual", m => m.hidraulica?.cargaTotal, "calderaSeleccionada", s => s.cargaTotal)            : null,
      calentadorElectrico: ss.calentadorElectrico ? cargaCal("modoCE",      "ceManual",      m => m.hidraulica?.cargaTotal, "ceSeleccionado",      s => s.cargaTotal)            : null,
      cloradorSalino:      sistemasSeleccionadosSanit.cloradorSalino && resultadoClorador && !resultadoClorador.error ? (parseFloat(resultadoClorador.cargaTotal) || null) : null,
      cloradorAutomatico:  sistemasSeleccionadosSanit.cloradorAutomatico ? (cargas.cloradorAutomatico ?? null) : null,
      lamparaUV:           sistemasSeleccionadosSanit.lamparaUV          ? (cargas.lamparaUV          ?? null) : null,
      retorno:        cargas.retorno        ?? null,
      desnatador:     cargas.desnatador     ?? null,
      barredora:      cargas.barredora      ?? null,
      drenFondo:      cargas.drenFondo      ?? null,
      drenCanal:      cargas.drenCanal      ?? null,
      filtroArena:    cargas.filtroArena    ?? null,
      prefiltro:      cargas.prefiltro      ?? null,
      filtroCartucho: cargas.filtroCartucho ?? null,
    };
  }, [cargas, datosPorSistema, resultadoClorador, sistemasSeleccionadosSanit]);

  // ── Indicadores de estado por pestaña ──
  const sanitCount = Object.values(sistemasSeleccionadosSanit).filter(Boolean).length;
  const filtCount  = Object.values(sistemasSeleccionadosFilt).filter(Boolean).length;
  const calCount   = equiposCalentamiento.length;

  const TABS = [
    { key: "sanitizacion",  label: "Sanitización",  Icon: IconoTabSanitizacion,  count: sanitCount },
    { key: "calentamiento", label: "Calentamiento", Icon: IconoTabCalentamiento, count: calCount   },
    { key: "filtracion",    label: "Filtración",    Icon: IconoTabFiltracion,    count: filtCount  },
    { key: "empotrables",   label: "Empotrables",   Icon: IconoTabEmpotrables,   count: null       },
    { key: "motobomba",     label: "Motobomba",     Icon: IconoTabMotobomba,     count: estadoBomba ? 1 : 0 },
  ];

  const tabIdx = TABS.findIndex(t => t.key === tabActiva);

  return (
    <div className="form-section hero-wrapper equipamiento">
      <div className="selector-tecnico modo-experto">

        {/* ── Header con tabs integrados ── */}
        <div className="selector-header">
          <div className="selector-titulo">Equipamiento del sistema</div>
          <div className="selector-subtitulo-tecnico">Selección y configuración de equipos hidráulicos</div>
          <div className="selector-acciones" style={{ marginBottom: "0.75rem", marginTop: "0.75rem" }}>
            <button className="btn-secundario" onClick={() => setSeccion("calentamiento")}>
              ← Volver a Calentamiento
            </button>
            {(flujoMaxGlobal ?? 0) > 0 && (
              <div style={{ display: "flex", gap: "0.5rem", marginLeft: "auto" }}>
                <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "#34d399", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)", borderRadius: "20px", padding: "0.2rem 0.6rem" }}>
                  {parseFloat(flujoMaxGlobal).toFixed(1)} GPM
                </span>
                {cargaTotalGlobal != null && (
                  <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "#60a5fa", background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.25)", borderRadius: "20px", padding: "0.2rem 0.6rem" }}>
                    {parseFloat(cargaTotalGlobal).toFixed(2)} ft CDT
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ── Pestañas ── */}
          <div className="eq-tabs-wrapper" style={{ margin: "0 -0.25rem", padding: "0 0.25rem" }}>
            <div className="eq-tabs">
              {TABS.map(({ key, label, Icon, count }) => {
                const activa = tabActiva === key;
                return (
                  <button key={key} className={`eq-tab ${activa ? "eq-tab--activa" : ""}`} onClick={() => setTabActiva(key)}>
                    <span className="eq-tab-icon"><Icon /></span>
                    <span className="eq-tab-label">{label}</span>
                    {count > 0 && <span className="eq-tab-badge eq-tab-badge--count">{count}</span>}
                  </button>
                );
              })}
            </div>
            <div className="eq-tabs-indicador-track">
              <div className="eq-tabs-indicador" style={{ left: `${tabIdx * (100 / TABS.length)}%`, width: `${100 / TABS.length}%` }} />
            </div>
          </div>
        </div>

        {/* ── Contenido de tabs ── */}
        <div className="selector-contenido entrada">

          {/* ══ SANITIZACIÓN ══ */}
          {tabActiva === "sanitizacion" && (<>
            <div className="selector-grupo">
              <div className="selector-subtitulo">
                🧪 Sanitización
                <span className="selector-subtitulo-hint">Selecciona uno o más sistemas</span>
              </div>
              <div className="sistemas-calentamiento-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
                {SISTEMAS_SANITIZACION.map(({ key, label, Icon }) => {
                  const activo = !!sistemasSeleccionadosSanit[key];
                  return (
                    <div key={key} className={`sistema-cal-card ${activo ? "activo" : ""}`} onClick={() => toggleSanitizacion(key)}>
                      <div className="sistema-cal-icon"><Icon /></div>
                      <div className="sistema-cal-label">{label}</div>
                      <div className={`sistema-cal-check ${activo ? "checked" : ""}`}>{activo ? "✓" : ""}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {sistemasSeleccionadosSanit.cloradorSalino && (
              <div className="selector-grupo sistemas-detalle-wrapper">
                <div className="sistema-detalle-card">
                  <div className="sistema-detalle-header">
                    <span className="sistema-detalle-icon-svg"><IconoCloradorSalino /></span>
                    <span className="sistema-detalle-titulo">Generador de cloro salino</span>
                  </div>
                  <BloqueCloradorSalino resultadoClorador={resultadoClorador} />
                </div>
              </div>
            )}
            {sistemasSeleccionadosSanit.cloradorAutomatico && (
              <div className="selector-grupo sistemas-detalle-wrapper">
                <div className="sistema-detalle-card">
                  <div className="sistema-detalle-header">
                    <span className="sistema-detalle-icon-svg"><IconoCloradorAutomatico /></span>
                    <span className="sistema-detalle-titulo">Clorador automático</span>
                  </div>
                  <BloqueCloradorAutomatico volumenLitros={volumenLitros} usoGeneral={usoGeneral} areaM2={areaM2} volumenM3={volM3} tempC={tempC} onCargaChange={v => setCarga("cloradorAutomatico", v)} onEstadoChange={e => setEstado("cloradorAutomatico", e)} />
                </div>
              </div>
            )}
            {sistemasSeleccionadosSanit.lamparaUV && (
              <div className="selector-grupo sistemas-detalle-wrapper">
                <div className="sistema-detalle-card">
                  <div className="sistema-detalle-header">
                    <span className="sistema-detalle-icon-svg"><IconoLamparaUV /></span>
                    <span className="sistema-detalle-titulo">Lámpara UV</span>
                  </div>
                  <BloqueLamparaUV flujoMaxSistema={flujoMaxGlobal} onCargaChange={v => setCarga("lamparaUV", v)} onEstadoChange={e => setEstado("lamparaUV", e)} />
                </div>
              </div>
            )}
            {!Object.values(sistemasSeleccionadosSanit).some(Boolean) && (
              <div className="sanitizacion-pendiente">Selecciona uno o más sistemas de sanitización para configurarlos</div>
            )}
          </>)}

          {/* ══ CALENTAMIENTO ══ */}
          {tabActiva === "calentamiento" && (<>
            {equiposCalentamiento.length > 0 ? (
              <>
                <div className="sistemas-detalle-wrapper">
                  {equiposCalentamiento.map(eq => (
                    <TarjetaCalentamientoReadonly key={eq.key} icono={eq.icono} label={eq.label} modo={eq.modo} id={eq.id} marca={eq.marca} modelo={eq.modelo} capUnitaria={eq.capUnitaria} cantidad={eq.cantidad} flujoTotal={eq.flujoTotal} cargaTotal={eq.cargaTotal} cargaTotalPSI={eq.cargaTotalPSI} />
                  ))}
                </div>
                <div style={{ textAlign: "right", marginTop: "0.6rem" }}>
                  <button className="btn-secundario" style={{ fontSize: "0.72rem", padding: "0.3rem 0.8rem" }} onClick={() => setSeccion("calentamiento")}>
                    Editar en Calentamiento →
                  </button>
                </div>
              </>
            ) : (
              <div className="sanitizacion-pendiente">
                No hay equipos de calentamiento configurados.
                <button className="btn-secundario" style={{ marginTop: "0.75rem", display: "block" }} onClick={() => setSeccion("calentamiento")}>
                  Ir a Calentamiento →
                </button>
              </div>
            )}
          </>)}

          {/* ══ FILTRACIÓN ══ */}
          {tabActiva === "filtracion" && (<>
            <div className="selector-grupo">
              <div className="selector-subtitulo">
                🧹 Filtración
                <span className="selector-subtitulo-hint">Selecciona uno o más sistemas</span>
              </div>
              <div className="sistemas-calentamiento-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
                {SISTEMAS_FILTRACION.map(({ key, label, Icon }) => {
                  const activo = !!sistemasSeleccionadosFilt[key];
                  return (
                    <div key={key} className={`sistema-cal-card ${activo ? "activo" : ""}`} onClick={() => toggleFiltracion(key)}>
                      <div className="sistema-cal-icon"><Icon /></div>
                      <div className="sistema-cal-label">{label}</div>
                      <div className={`sistema-cal-check ${activo ? "checked" : ""}`}>{activo ? "✓" : ""}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {sistemasSeleccionadosFilt.filtroArena && (
              <div className="selector-grupo sistemas-detalle-wrapper">
                <div className="sistema-detalle-card">
                  <div className="sistema-detalle-header">
                    <span className="sistema-detalle-icon-svg"><IconoFiltroArena /></span>
                    <span className="sistema-detalle-titulo">Filtro de arena</span>
                  </div>
                  <BloqueFiltroArena flujoMaximo={flujoMaxGlobal} onCargaChange={v => setCarga("filtroArena", v)} onEstadoChange={e => setEstado("filtroArena", e)} />
                </div>
              </div>
            )}
            {sistemasSeleccionadosFilt.prefiltro && (
              <div className="selector-grupo sistemas-detalle-wrapper">
                <div className="sistema-detalle-card">
                  <div className="sistema-detalle-header">
                    <span className="sistema-detalle-icon-svg"><IconoPrefiltro /></span>
                    <span className="sistema-detalle-titulo">Prefiltro</span>
                  </div>
                  <BloquePrefiltro flujoMaximo={flujoMaxGlobal} onCargaChange={v => setCarga("prefiltro", v)} onEstadoChange={e => setEstado("prefiltro", e)} />
                </div>
              </div>
            )}
            {sistemasSeleccionadosFilt.filtroCartucho && (
              <div className="selector-grupo sistemas-detalle-wrapper">
                <div className="sistema-detalle-card">
                  <div className="sistema-detalle-header">
                    <span className="sistema-detalle-icon-svg"><IconoFiltroCartucho /></span>
                    <span className="sistema-detalle-titulo">Filtro de cartucho</span>
                  </div>
                  <BloqueFiltroCartucho flujoMaximo={flujoMaxGlobal} usoGeneral={usoGeneral} onCargaChange={v => setCarga("filtroCartucho", v)} onEstadoChange={e => setEstado("filtroCartucho", e)} />
                </div>
              </div>
            )}
            {!Object.values(sistemasSeleccionadosFilt).some(Boolean) && (
              <div className="sanitizacion-pendiente">Selecciona uno o más sistemas de filtración para configurarlos</div>
            )}
          </>)}

          {/* ══ EMPOTRABLES ══ */}
          {tabActiva === "empotrables" && (<>
            <div className="selector-grupo sistemas-detalle-wrapper">
              <div className="sistema-detalle-card">
                <div className="sistema-detalle-header">
                  <span className="sistema-detalle-icon-svg"><IconoRetorno /></span>
                  <span className="sistema-detalle-titulo">Retornos</span>
                  <span style={{ marginLeft: "auto", fontSize: "0.65rem", background: "rgba(52,211,153,0.12)", color: "#34d399", border: "1px solid rgba(52,211,153,0.25)", borderRadius: "20px", padding: "0.1rem 0.5rem" }}>Suma al CDT</span>
                </div>
                <BloqueEmpotrable icono={<IconoRetorno />} titulo="Retornos" rec={recRetorno} catalogo={retornos} flujoMaximo={flujoMaxGlobal} datos={datosEmpotrable} fnCalculo={(flujo, tipo, dat, num) => retorno(flujo, tipo, dat, num)} onCargaChange={v => setCarga("retorno", v)} onEstadoChange={e => setEstado("retorno", e)} mostrarPuerto />
              </div>
            </div>

            <div className="selector-grupo sistemas-detalle-wrapper">
              <div className="selector-subtitulo" style={{ marginBottom: "0.6rem" }}>
                Succión — {tieneDesbordeCanal ? "Dren canal + Dren fondo" : "Desnatadores + Dren fondo"}
                <span className="selector-subtitulo-hint">Solo la mayor gobierna el CDT</span>
              </div>
              {tieneDesbordeCanal ? (<>
                <div className="sistema-detalle-card" style={{ marginBottom: "0.5rem" }}>
                  <div className="sistema-detalle-header">
                    <span className="sistema-detalle-icon-svg"><IconoDrenCanal /></span>
                    <span className="sistema-detalle-titulo">Dren canal</span>
                  </div>
                  <BloqueEmpotrable icono={<IconoDrenCanal />} titulo="Dren canal" rec={recDrenCanal} catalogo={drenesCanal} flujoMaximo={flujoMaxGlobal} datos={datosEmpotrable} fnCalculo={(flujo, tipo, dat, num) => drenCanal(flujo, tipo, dat, num)} mostrarPuerto={false} mostrarTamano={true} onCargaChange={v => setCarga("drenCanal", v)} onEstadoChange={e => setEstado("drenCanal", e)} />
                </div>
                <div className="sistema-detalle-card">
                  <div className="sistema-detalle-header">
                    <span className="sistema-detalle-icon-svg"><IconoDrenFondo /></span>
                    <span className="sistema-detalle-titulo">Dren fondo</span>
                  </div>
                  <BloqueEmpotrable icono={<IconoDrenFondo />} titulo="Dren fondo" rec={recDrenFondo} catalogo={drenesFondo} flujoMaximo={flujoMaxGlobal} datos={datosEmpotrable} fnCalculo={(flujo, tipo, dat, num) => drenFondo(flujo, tipo, dat, num)} mostrarPuerto={false} mostrarTamano={true} onCargaChange={v => setCarga("drenFondo", v)} onEstadoChange={e => setEstado("drenFondo", e)} cantMinMultiplier={2} />
                </div>
              </>) : (<>
                <div className="sistema-detalle-card" style={{ marginBottom: "0.5rem" }}>
                  <div className="sistema-detalle-header">
                    <span className="sistema-detalle-icon-svg"><IconoDesnatador /></span>
                    <span className="sistema-detalle-titulo">Desnatadores</span>
                  </div>
                  <BloqueEmpotrable icono={<IconoDesnatador />} titulo="Desnatadores" rec={recDesnatador} catalogo={desnatadores} flujoMaximo={flujoMaxGlobal} datos={datosEmpotrable} fnCalculo={(flujo, tipo, dat, num) => desnatador(flujo, tipo, dat, num)} onCargaChange={v => setCarga("desnatador", v)} onEstadoChange={e => setEstado("desnatador", e)} mostrarPuerto cantMinFn={cantMinDesnatador} />
                </div>
                <div className="sistema-detalle-card">
                  <div className="sistema-detalle-header">
                    <span className="sistema-detalle-icon-svg"><IconoDrenFondo /></span>
                    <span className="sistema-detalle-titulo">Dren fondo</span>
                  </div>
                  <BloqueEmpotrable icono={<IconoDrenFondo />} titulo="Dren fondo" rec={recDrenFondo} catalogo={drenesFondo} flujoMaximo={flujoMaxGlobal} datos={datosEmpotrable} fnCalculo={(flujo, tipo, dat, num) => drenFondo(flujo, tipo, dat, num)} mostrarPuerto={false} mostrarTamano={true} onCargaChange={v => setCarga("drenFondo", v)} onEstadoChange={e => setEstado("drenFondo", e)} cantMinMultiplier={2} />
                </div>
              </>)}
            </div>

            <div className="selector-grupo sistemas-detalle-wrapper">
              <div className="sistema-detalle-card">
                <div className="sistema-detalle-header">
                  <span className="sistema-detalle-icon-svg"><IconoBarredora /></span>
                  <span className="sistema-detalle-titulo">Barredoras</span>
                  <span style={{ marginLeft: "auto", fontSize: "0.65rem", background: "rgba(100,116,139,0.15)", color: "#64748b", border: "1px solid rgba(100,116,139,0.25)", borderRadius: "20px", padding: "0.1rem 0.5rem" }}>Solo informativo</span>
                </div>
                <BloqueEmpotrable icono={<IconoBarredora />} titulo="Barredoras" rec={recBarredora} catalogo={barredoras} flujoMaximo={flujoMaxGlobal} datos={datosEmpotrable} fnCalculo={(flujo, tipo, dat, num) => barredora(flujo, tipo, dat, num)} onCargaChange={v => setCarga("barredora", v)} onEstadoChange={e => setEstado("barredora", e)} mostrarPuerto cantMinFn={cantMinBarredora} />
              </div>
            </div>
          </>)}

          {/* ══ MOTOBOMBA ══ */}
          {tabActiva === "motobomba" && (<>
            <div className="selector-grupo">
              <div className="selector-subtitulo">
                ⚙️ Motobomba
                <span className="selector-subtitulo-hint">Selección basada en flujo máximo y CDT total del sistema</span>
              </div>
              <BloqueMotobomba flujoMaximo={flujoMaxGlobal} cargaRequerida={cargaTotalGlobal} onEstadoChange={setEstadoBomba} />
            </div>
            {estadoBomba && (
              <div className="selector-grupo">
                <BloqueVerificacion
                  sistemaActivo={sistemaActivo}
                  flujoMaxGlobal={flujoMaxGlobal}
                  cargaTotalGlobal={cargaTotalGlobal}
                  estados={estados}
                  cargas={cargasTodas}
                  datosEmpotrable={datosEmpotrable}
                  tieneDesbordeCanal={tieneDesbordeCanal}
                  usoGeneral={usoGeneral}
                  bombaId={estadoBomba?.bombaId ?? null}
                  nBombas={estadoBomba?.nBombas ?? 1}
                  estadoBomba={estadoBomba}
                  equiposCalentamiento={equiposCalentamiento}
                  sistemasSanitizacion={sistemasSeleccionadosSanit}
                  sistemasFiltracion={sistemasSeleccionadosFilt}
                  datosSanitizacion={{
                    cloradorSalino: resultadoClorador && !resultadoClorador.error ? {
                      marca: resultadoClorador.seleccion?.marca,
                      modelo: resultadoClorador.seleccion?.modelo,
                      cantidad: resultadoClorador.seleccion?.cantidad,
                      flujoTotal: resultadoClorador.seleccion?.flujoTotal,
                    } : null,
                    cloradorAutomatico: estados?.cloradorAutomatico ?? null,
                    lamparaUV: estados?.lamparaUV ?? null,
                  }}
                  datosPorSistema={datosPorSistema}
                  resultadoClorador={resultadoClorador}
                  onAjustarCargas={(payload) => {
                    // payload = { equipos, flujo, cdt }
                    // NO se modifican las cargas de diseño en App.
                    // Se guarda el punto de operación para mostrarlo como toggle separado.
                    setDatosPorSistema(ps => ({
                      ...ps,
                      equipamiento: {
                        ...(ps.equipamiento ?? {}),
                        puntoOperacion: {
                          equipos:   payload.equipos ?? payload,
                          flujo:     payload.flujo   ?? null,
                          cdt:       payload.cdt     ?? null,
                          timestamp: Date.now(),
                        },
                      },
                    }));
                  }}
                  flujoInfinityVal={flujoInfinityVal ?? null}
                  flujoFiltradoVal={flujoFiltradoVal ?? null}
                  volumenTotalVal={volumenTotalVal ?? null}
                />
              </div>
            )}
          </>)}

        </div>

        <div className="selector-footer fijo equipamiento">
          <span>Modo ingeniería · Equipamiento</span>
          <span className="footer-highlight">
            {{ sanitizacion: "Desinfección y control microbiológico del agua", calentamiento: "Equipos de calentamiento — solo lectura", filtracion: "Filtración y acondicionamiento del agua", empotrables: "Elementos hidráulicos en paredes y fondo", motobomba: "Selección de motobomba y verificación del sistema" }[tabActiva] ?? "Configuración integral del equipamiento"}
          </span>
        </div>

      </div>
    </div>
  );
}