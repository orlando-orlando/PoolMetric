import { useState, useMemo, useRef } from "react";
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
import { prefiltro, calcularCargaPrefiltroManual }                     from "../utils/prefiltro";
import { filtroCartucho, calcularCargaFiltroCartuchoManual,
         flujoEfectivo }                                               from "../utils/filtroCartucho";
import { filtrosCartucho }  from "../data/filtrosCartucho";
import { prefiltros }       from "../data/prefiltros";
import { retorno }    from "../utils/retorno";
import { desnatador } from "../utils/desnatador";
import { barredora }  from "../utils/barredora";
import { drenFondo }  from "../utils/drenFondo";
import { drenCanal }  from "../utils/drenCanal";
import { volumen }    from "../utils/volumen";

/* =====================================================
   HELPERS
===================================================== */
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

/**
 * Retorno: siempre 1.5in salvo que numRetornos > 25 → 2.0in
 * Selecciona el equipo cuyo flujo es >= flujoPorRetorno y minimiza exceso
 */
function recomendarRetorno(flujoMaximo, datos) {
  if (!flujoMaximo || flujoMaximo <= 0 || !datos) return null;
  try {
    // Probar primero con 1.5in para conocer cantidad
    const res15 = retorno(flujoMaximo, "1.5", datos);
    const tipo  = res15.resultadoR?.length > 25 ? "2.0" : "1.5";
    const res   = tipo === "1.5" ? res15 : retorno(flujoMaximo, "2.0", datos);
    if (!res?.resultadoR?.length) return null;

    const num            = res.resultadoR.length;
    const flujoPorEq     = flujoMaximo / num;
    const catalogoTipo   = retornos.filter(r => r.metadata.activo && r.specs.dimensionPuerto === parseFloat(tipo));
    const equipo         = catalogoTipo.find(r => r.specs.flujo >= flujoPorEq) ?? catalogoTipo[catalogoTipo.length - 1];
    if (!equipo) return null;

    return { equipo, cantidad: num, flujoPorEquipo: parseFloat(flujoPorEq.toFixed(2)), flujoTotal: parseFloat((equipo.specs.flujo * num).toFixed(2)), tipo, res };
  } catch { return null; }
}

/**
 * Desnatador: recomendado siempre 2.0in
 */
function recomendarDesnatador(flujoMaximo, datos) {
  if (!flujoMaximo || flujoMaximo <= 0 || !datos) return null;
  try {
    const res = desnatador(flujoMaximo, "2.0", datos);
    if (!res?.resultadoD?.length) return null;

    const num        = res.resultadoD.length;
    const flujoPorEq = flujoMaximo / num;
    const catalogo   = desnatadores.filter(d => d.metadata.activo && d.specs.dimensionPuerto === 2.0);
    const equipo     = catalogo.find(d => d.specs.flujo >= flujoPorEq) ?? catalogo[catalogo.length - 1];
    if (!equipo) return null;

    return { equipo, cantidad: num, flujoPorEquipo: parseFloat(flujoPorEq.toFixed(2)), flujoTotal: parseFloat((equipo.specs.flujo * num).toFixed(2)), tipo: "2.0", res };
  } catch { return null; }
}

/**
 * Barredora: siempre 2.0in
 */
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

// Tipos válidos que acepta la función drenFondo (coinciden con capacidadDren dentro de la función)
const TIPOS_VALIDOS_DREN_FONDO  = ["1.5", "2.0", "7.5", "8.0", "9.0", "12.0", "18.0"];
const TIPOS_VALIDOS_DREN_CANAL  = ["1.5", "2.0", "7.5", "8.0", "9.0"];

// Mapa de tipo válido → tamano del catálogo (para encontrar el equipo correspondiente)
const TAMANO_POR_TIPO_FONDO = {
  "1.5":  [1.5],
  "2.0":  [2],
  "7.5":  [7.5],
  "8.0":  [8],
  "9.0":  ["9x9"],
  "12.0": ["12x12"],
  "18.0": ["18x18"],
};

/**
 * Dren de fondo: menor cantidad de drenes (mínimo 2)
 * Solo itera los tipos que la función drenFondo reconoce (evita loop infinito con capacidad 0)
 */
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
          const flujoPorEq    = flujoMaximo / num;
          const tamanosValidos = TAMANO_POR_TIPO_FONDO[tipo] ?? [];
          const catalogo      = drenesFondo.filter(d =>
            d.metadata.activo && tamanosValidos.some(t => String(d.specs.tamano) === String(t))
          );
          const equipo = catalogo.find(d => d.specs.flujo >= flujoPorEq) ?? catalogo[catalogo.length - 1];
          if (equipo) mejor = { equipo, cantidad: num, flujoPorEquipo: parseFloat(flujoPorEq.toFixed(2)), flujoTotal: parseFloat((equipo.specs.flujo * num).toFixed(2)), tipo, res };
        }
      } catch { continue; }
    }
    return mejor;
  } catch { return null; }
}

/**
 * Dren canal: menor cantidad de drenes canal
 * Solo itera los tipos que la función drenCanal reconoce
 */
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
          const catalogo   = drenesCanal.filter(d =>
            d.metadata.activo && String(d.specs.tamano) === tipo
          );
          const equipo = catalogo.find(d => d.specs.flujo >= flujoPorEq) ?? catalogo[catalogo.length - 1];
          if (equipo) mejor = { equipo, cantidad: num, flujoPorEquipo: parseFloat(flujoPorEq.toFixed(2)), flujoTotal: parseFloat((equipo.specs.flujo * num).toFixed(2)), tipo, res };
        }
      } catch { continue; }
    }
    return mejor;
  } catch { return null; }
}

/* =====================================================
   ICONOS SVG — calentamiento
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

/* =====================================================
   ICONOS SVG — sanitización
===================================================== */
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

/* =====================================================
   ICONOS SVG — empotrables
===================================================== */
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

const IconoCheck = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 7L5.5 10.5L12 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);


/* =====================================================
   ICONOS SVG — filtración
===================================================== */
const IconoFiltroArena = () => (
  <svg width="48" height="48" viewBox="0 0 60 48" fill="none">
    {/* cuerpo cilíndrico del filtro */}
    <ellipse cx="30" cy="12" rx="16" ry="5" stroke="#38bdf8" strokeWidth="1.5" fill="rgba(56,189,248,0.1)"/>
    <rect x="14" y="12" width="32" height="22" stroke="#38bdf8" strokeWidth="1.5" fill="rgba(56,189,248,0.08)"/>
    <ellipse cx="30" cy="34" rx="16" ry="5" stroke="#38bdf8" strokeWidth="1.5" fill="rgba(56,189,248,0.1)"/>
    {/* arena interior */}
    <ellipse cx="30" cy="28" rx="12" ry="3" fill="rgba(251,191,36,0.25)" stroke="#fbbf24" strokeWidth="0.8"/>
    <line x1="18" y1="25" x2="42" y2="25" stroke="#fbbf24" strokeWidth="0.7" opacity="0.4"/>
    <line x1="18" y1="22" x2="42" y2="22" stroke="#fbbf24" strokeWidth="0.7" opacity="0.3"/>
    {/* tubo entrada/salida */}
    <line x1="30" y1="7" x2="30" y2="3" stroke="#7dd3fc" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="30" y1="39" x2="30" y2="43" stroke="#7dd3fc" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IconoPrefiltro = () => (
  <svg width="48" height="48" viewBox="0 0 60 48" fill="none">
    <ellipse cx="30" cy="12" rx="14" ry="4" stroke="#7dd3fc" strokeWidth="1.5" fill="rgba(125,211,252,0.08)"/>
    <rect x="16" y="12" width="28" height="20" stroke="#7dd3fc" strokeWidth="1.5" fill="rgba(125,211,252,0.06)"/>
    <ellipse cx="30" cy="32" rx="14" ry="4" stroke="#7dd3fc" strokeWidth="1.5" fill="rgba(125,211,252,0.08)"/>
    {/* malla */}
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
    {/* pliegues cartucho */}
    <path d="M22 14 Q26 17 30 14 Q34 11 38 14" stroke="#a78bfa" strokeWidth="1" fill="none" opacity="0.6" strokeLinecap="round"/>
    <path d="M22 20 Q26 23 30 20 Q34 17 38 20" stroke="#a78bfa" strokeWidth="1" fill="none" opacity="0.6" strokeLinecap="round"/>
    <path d="M22 26 Q26 29 30 26 Q34 23 38 26" stroke="#a78bfa" strokeWidth="1" fill="none" opacity="0.6" strokeLinecap="round"/>
    <path d="M22 32 Q26 35 30 32 Q34 29 38 32" stroke="#a78bfa" strokeWidth="1" fill="none" opacity="0.6" strokeLinecap="round"/>
    <line x1="30" y1="6" x2="30" y2="3" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="30" y1="40" x2="30" y2="44" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

/* =====================================================
   TARJETA SOLO LECTURA — calentamiento
===================================================== */
function TarjetaCalentamientoReadonly({ icono, label, modo, marca, modelo, cantidad, flujoTotal, cargaTotal, cargaTotalPSI }) {
  return (
    <div className="bdc-recomendada-card bdc-inset">
      <div className="bdc-rec-header">
        {icono}
        <div className="bdc-rec-titulo">
          <span className="bdc-rec-label">{label}</span>
          <span className="bdc-rec-modelo">{marca} · {modelo}</span>
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
      ? { marca: calentamiento.bdcManual.bomba?.marca, modelo: calentamiento.bdcManual.bomba?.modelo, cantidad: calentamiento.bdcManual.cantidad, flujoTotal: calentamiento.bdcManual.flujoTotal, cargaTotal: calentamiento.bdcManual.hidraulica?.cargaTotal, cargaTotalPSI: calentamiento.bdcManual.hidraulica?.cargaTotalPSI }
      : calentamiento.bdcSeleccionada && !calentamiento.bdcSeleccionada.error
      ? { marca: calentamiento.bdcSeleccionada.seleccion?.marca, modelo: calentamiento.bdcSeleccionada.seleccion?.modelo, cantidad: calentamiento.bdcSeleccionada.seleccion?.cantidad, flujoTotal: calentamiento.bdcSeleccionada.seleccion?.flujoTotal, cargaTotal: calentamiento.bdcSeleccionada.cargaTotal, cargaTotalPSI: calentamiento.bdcSeleccionada.cargaTotalPSI }
      : null;
    if (src?.marca) equipos.push({ key: "bombaCalor", label: "Bomba de calor", icono: <IconoBombaCalor />, modo, ...src });
  }

  if (sistemasSeleccionados.panelSolar) {
    const modo = calentamiento.modoPS ?? "recomendado";
    const src  = modo === "manual" && calentamiento.psManual && !calentamiento.psManual.error
      ? { marca: calentamiento.psManual.panel?.marca, modelo: calentamiento.psManual.panel?.modelo, cantidad: calentamiento.psManual.totalPaneles, flujoTotal: calentamiento.psManual.flujoTotal, cargaTotal: calentamiento.psManual.hidraulica?.cargaTotal, cargaTotalPSI: calentamiento.psManual.hidraulica?.cargaTotalPSI }
      : calentamiento.psSeleccionado && !calentamiento.psSeleccionado.error
      ? { marca: calentamiento.psSeleccionado.panel?.marca, modelo: calentamiento.psSeleccionado.panel?.modelo, cantidad: calentamiento.psSeleccionado.seleccion?.cantidad, flujoTotal: calentamiento.psSeleccionado.seleccion?.flujoTotal, cargaTotal: calentamiento.psSeleccionado.hidraulica?.cargaTotal, cargaTotalPSI: calentamiento.psSeleccionado.hidraulica?.cargaTotalPSI }
      : null;
    if (src?.marca) equipos.push({ key: "panelSolar", label: "Panel solar", icono: <IconoPanelSolar />, modo, ...src });
  }

  if (sistemasSeleccionados.caldera) {
    const modo = calentamiento.modoCaldera ?? "recomendado";
    const src  = modo === "manual" && calentamiento.calderaManual && !calentamiento.calderaManual.error
      ? { marca: calentamiento.calderaManual.caldera?.marca, modelo: calentamiento.calderaManual.caldera?.modelo, cantidad: calentamiento.calderaManual.cantidad, flujoTotal: calentamiento.calderaManual.flujoTotal, cargaTotal: calentamiento.calderaManual.hidraulica?.cargaTotal, cargaTotalPSI: calentamiento.calderaManual.hidraulica?.cargaTotalPSI }
      : calentamiento.calderaSeleccionada && !calentamiento.calderaSeleccionada.error
      ? { marca: calentamiento.calderaSeleccionada.seleccion?.marca, modelo: calentamiento.calderaSeleccionada.seleccion?.modelo, cantidad: calentamiento.calderaSeleccionada.seleccion?.cantidad, flujoTotal: calentamiento.calderaSeleccionada.seleccion?.flujoTotal, cargaTotal: calentamiento.calderaSeleccionada.cargaTotal, cargaTotalPSI: calentamiento.calderaSeleccionada.cargaTotalPSI }
      : null;
    if (src?.marca) equipos.push({ key: "caldera", label: "Caldera de gas", icono: <IconoCaldera />, modo, ...src });
  }

  if (sistemasSeleccionados.calentadorElectrico) {
    const modo = calentamiento.modoCE ?? "recomendado";
    const src  = modo === "manual" && calentamiento.ceManual && !calentamiento.ceManual.error
      ? { marca: calentamiento.ceManual.equipo?.marca, modelo: calentamiento.ceManual.equipo?.modelo, cantidad: calentamiento.ceManual.cantidad, flujoTotal: calentamiento.ceManual.flujoTotal, cargaTotal: calentamiento.ceManual.hidraulica?.cargaTotal, cargaTotalPSI: calentamiento.ceManual.hidraulica?.cargaTotalPSI }
      : calentamiento.ceSeleccionado && !calentamiento.ceSeleccionado.error
      ? { marca: calentamiento.ceSeleccionado.seleccion?.marca, modelo: calentamiento.ceSeleccionado.seleccion?.modelo, cantidad: calentamiento.ceSeleccionado.seleccion?.cantidad, flujoTotal: calentamiento.ceSeleccionado.seleccion?.flujoTotal, cargaTotal: calentamiento.ceSeleccionado.cargaTotal, cargaTotalPSI: calentamiento.ceSeleccionado.cargaTotalPSI }
      : null;
    if (src?.marca) equipos.push({ key: "calentadorElectrico", label: "Calentador eléctrico", icono: <IconoCalentadorElectrico />, modo, ...src });
  }

  return equipos;
}

/* =====================================================
   HELPER — tipo normalizado para la función de cálculo
   Los tamanos "9x9", "12x12", "18x18" deben mapearse
   al tipo numérico que acepta drenFondo ("9.0","12.0","18.0")
===================================================== */
const TAMANO_A_TIPO_CALCULO = {
  "9x9":   "9.0",
  "12x12": "12.0",
  "18x18": "18.0",
};

function tipoParaCalculo(eq) {
  const raw = String(eq.specs.tamano ?? eq.specs.dimensionPuerto ?? "");
  return TAMANO_A_TIPO_CALCULO[raw] ?? raw;
}

/* =====================================================
   BLOQUE EMPOTRABLE GENÉRICO
   - Empotrables siempre visibles (sin toggle de existencia)
   - Cantidad mínima = ceil(flujoMaximo / flujoNominalEquipo)
   - Modo manual calcula con el equipo y tipo seleccionado
===================================================== */
function BloqueEmpotrable({
  icono, titulo, rec, catalogo,
  flujoMaximo, datos,
  fnCalculo,
  mostrarPuerto = true,
  mostrarTamano = false,
  onCargaChange = null,
}) {
  const [modo,        setModo]        = useState("recomendado");
  const [selId,       setSelId]       = useState(null);
  const [selCant,     setSelCant]     = useState(null);
  const [filtroMarca, setFiltroMarca] = useState("todas");

  // Ref estable para fnCalculo — se actualiza cada render pero no invalida useMemo
  const fnCalcRef = useRef(fnCalculo);
  fnCalcRef.current = fnCalculo;

  const marcas = useMemo(() =>
    ["todas", ...new Set(catalogo.filter(e => e.metadata.activo).map(e => e.marca))],
  [catalogo]);

  const catalogoFiltrado = useMemo(() =>
    catalogo.filter(e => {
      if (!e.metadata.activo) return false;
      if (filtroMarca !== "todas" && e.marca !== filtroMarca) return false;
      return true;
    }),
  [catalogo, filtroMarca]);

  const cantMinima = useMemo(() => {
    if (!selId || !flujoMaximo) return 2;
    const eq = catalogo.find(e => e.id === selId);
    if (!eq) return 2;
    return Math.max(2, Math.ceil(flujoMaximo / eq.specs.flujo));
  }, [selId, flujoMaximo, catalogo]);

  const handleSelEquipo = (id) => {
    if (selId === id) { setSelId(null); setSelCant(null); return; }
    setSelId(id);
    const eq = catalogo.find(e => e.id === id);
    if (eq && flujoMaximo) {
      setSelCant(Math.max(2, Math.ceil(flujoMaximo / eq.specs.flujo)));
    } else {
      setSelCant(2);
    }
  };

  // Calculo directo en render sin useMemo — garantiza recalculo en cada cambio de selCant
  let manualCalc = null;
  if (selId && selCant && flujoMaximo && datos) {
    const eq = catalogo.find(e => e.id === selId);
    if (eq) {
      try {
        const tipo       = tipoParaCalculo(eq);
        const res        = fnCalcRef.current(flujoMaximo, tipo, datos, selCant);
        const flujoPorEq = flujoMaximo / selCant;
        manualCalc = {
          equipo: eq,
          cantidad: selCant,
          flujoPorEquipo: parseFloat(flujoPorEq.toFixed(2)),
          flujoTotal: parseFloat((eq.specs.flujo * selCant).toFixed(2)),
          res,
        };
      } catch { manualCalc = null; }
    }
  }

  const infoActiva = modo === "recomendado" ? rec : manualCalc;

  // Reportar carga activa al padre cada vez que cambia
  const cargaActivaFt = infoActiva?.res?.sumaFinal ?? null;
  const onCargaRef = useRef(onCargaChange);
  onCargaRef.current = onCargaChange;
  const prevCargaRef = useRef(null);
  if (prevCargaRef.current !== cargaActivaFt) {
    prevCargaRef.current = cargaActivaFt;
    if (onCargaRef.current) onCargaRef.current(cargaActivaFt);
  }

  if (!flujoMaximo || flujoMaximo <= 0) {
    return (
      <div className="sanitizacion-pendiente">
        Completa las dimensiones para calcular el flujo máximo del sistema
      </div>
    );
  }

  return (
    <div className="sanitizacion-bloque-equipo">
      {/* Toggle modo */}
      <div className="bdc-modo-toggle-wrapper">
        <div className="bdc-modo-toggle">
          <button type="button" className={`bdc-modo-btn ${modo === "recomendado" ? "bdc-modo-activo" : ""}`} onClick={() => setModo("recomendado")}>
            {modo === "recomendado" && <IconoCheck />}<span>Recomendado</span>
          </button>
          <button type="button" className={`bdc-modo-btn ${modo === "manual" ? "bdc-modo-activo" : ""}`} onClick={() => setModo("manual")}>
            {modo === "manual" && <IconoCheck />}<span>Selección manual</span>
          </button>
        </div>
      </div>

      {/* Flujo referencia */}
      <div style={{ fontSize: "0.7rem", color: "#94a3b8", padding: "0.25rem 0.5rem 0.5rem" }}>
        Flujo máximo del sistema: <span style={{ color: "#38bdf8", fontWeight: 600 }}>{parseFloat(flujoMaximo).toFixed(1)} GPM</span>
      </div>

      <div className="layout-clima-bdc-fila2" style={{ marginTop: 0 }}>
        {/* Columna izquierda — tarjeta activa */}
        <div className="layout-clima-bdc-celda celda-bdc-rec">
          {infoActiva ? (
            <div className={`bdc-recomendada-card bdc-inset ${modo === "manual" ? "bdc-card-manual-activa" : ""}`}>
              <div className="bdc-rec-header">
                {icono}
                <div className="bdc-rec-titulo">
                  <span className="bdc-rec-label">{modo === "recomendado" ? "Recomendado" : "Manual"}</span>
                  <span className="bdc-rec-modelo">{infoActiva.equipo.marca} · {infoActiva.equipo.modelo}</span>
                </div>
                <span className={`bdc-modo-badge ${modo === "manual" ? "badge-manual" : "badge-auto"}`}>
                  {modo === "manual" ? "Manual" : "Auto"}
                </span>
              </div>
              <div className="bdc-rec-stats">
                <div className="bdc-stat"><span className="bdc-stat-valor">{infoActiva.cantidad}</span><span className="bdc-stat-label">equipos</span></div>
                <div className="bdc-stat-sep" />
                <div className="bdc-stat"><span className="bdc-stat-valor">{parseFloat(infoActiva.flujoPorEquipo).toFixed(1)}</span><span className="bdc-stat-label">GPM/equipo</span></div>
                <div className="bdc-stat-sep" />
                <div className="bdc-stat"><span className="bdc-stat-valor">{parseFloat(infoActiva.flujoTotal).toFixed(1)}</span><span className="bdc-stat-label">GPM total</span></div>
              </div>
              <div className="bdc-rec-demanda">
                {mostrarPuerto && (
                  <div className="bdc-demanda-fila">
                    <span className="bdc-demanda-label">Puerto</span>
                    <span className="bdc-demanda-valor">{infoActiva.equipo.specs.dimensionPuerto}"</span>
                  </div>
                )}
                {mostrarTamano && infoActiva.equipo.specs.tamano != null && (
                  <div className="bdc-demanda-fila">
                    <span className="bdc-demanda-label">Tamaño</span>
                    <span className="bdc-demanda-valor">{infoActiva.equipo.specs.tamano}"</span>
                  </div>
                )}
                <div className="bdc-demanda-fila">
                  <span className="bdc-demanda-label">Flujo nominal</span>
                  <span className="bdc-demanda-valor bdc-ok">{infoActiva.equipo.specs.flujo} GPM</span>
                </div>
                <div className="bdc-demanda-fila">
                  <span className="bdc-demanda-label">Flujo sistema</span>
                  <span className="bdc-demanda-valor">{parseFloat(flujoMaximo).toFixed(1)} GPM</span>
                </div>
              </div>
              {infoActiva.res?.sumaFinal != null && (
                <div className="bdc-rec-hidraulica">
                  <span className="bdc-hid-label">Pérdida de carga total</span>
                  <span className="bdc-hid-valor">{parseFloat(infoActiva.res.sumaFinal).toFixed(2)} ft</span>
                </div>
              )}
            </div>
          ) : (
            <div className="bdc-recomendada-card bdc-pendiente bdc-inset">
              <div className="bdc-rec-header">
                {icono}
                <div className="bdc-rec-titulo">
                  <span className="bdc-rec-label">{titulo}</span>
                  <span className="bdc-rec-modelo bdc-pendiente-txt">
                    {modo === "recomendado" ? "Calculando selección..." : "Selecciona un equipo del catálogo"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Columna derecha — detalle o catálogo */}
        <div className="layout-clima-bdc-celda celda-bdc-manual">
          {/* Modo recomendado: detalle */}
          {modo === "recomendado" && rec && (
            <div className="bdc-info-automatica bdc-inset">
              <div className="bdc-manual-header"><span className="bdc-manual-titulo">Detalle de selección automática</span></div>
              <div className="bdc-auto-detalle">
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Marca</span><span className="bdc-auto-val">{rec.equipo.marca}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Modelo</span><span className="bdc-auto-val">{rec.equipo.modelo}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Cantidad</span><span className="bdc-auto-val">{rec.cantidad} equipo{rec.cantidad > 1 ? "s" : ""}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Flujo por equipo requerido</span><span className="bdc-auto-val">{parseFloat(rec.flujoPorEquipo).toFixed(2)} GPM</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Flujo nominal</span><span className="bdc-auto-val">{rec.equipo.specs.flujo} GPM</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Puerto</span><span className="bdc-auto-val">{rec.equipo.specs.dimensionPuerto}"</span></div>
                {rec.equipo.specs.tamano != null && (
                  <div className="bdc-auto-fila"><span className="bdc-auto-label">Tamaño</span><span className="bdc-auto-val">{rec.equipo.specs.tamano}"</span></div>
                )}
                {rec.tipo && (
                  <div className="bdc-auto-fila"><span className="bdc-auto-label">Tipo calculado</span><span className="bdc-auto-val">{rec.tipo}"</span></div>
                )}
                {rec.res?.sumaFinal != null && (
                  <>
                    <div className="bdc-auto-sep" />
                    <div className="bdc-auto-fila bdc-auto-total">
                      <span className="bdc-auto-label">Pérdida de carga</span>
                      <span className="bdc-auto-val bdc-hid-val-highlight">{parseFloat(rec.res.sumaFinal).toFixed(2)} ft</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Modo manual: catálogo */}
          {modo === "manual" && (
            <div className="bdc-selector-manual bdc-inset">
              <div className="bdc-manual-header"><span className="bdc-manual-titulo">Catálogo — {titulo}</span></div>
              <div className="bdc-manual-filtros">
                <div className="campo">
                  <label>Marca</label>
                  <select value={filtroMarca} onChange={e => setFiltroMarca(e.target.value)}>
                    {marcas.map(m => <option key={m} value={m}>{m === "todas" ? "Todas las marcas" : m}</option>)}
                  </select>
                </div>
              </div>
              <div className="bdc-manual-lista">
                {catalogoFiltrado.map(eq => {
                  const esRec   = rec && eq.id === rec.equipo.id;
                  const sel     = selId === eq.id;
                  const minEste = Math.max(2, Math.ceil(flujoMaximo / eq.specs.flujo));
                  return (
                    <div key={eq.id}
                      className={`bdc-manual-fila ${sel ? "bdc-manual-fila-activa" : ""}`}
                      onClick={() => handleSelEquipo(eq.id)}>
                      <div className="bdc-manual-fila-info">
                        <span className="bdc-manual-marca">{eq.marca}</span>
                        <span className="bdc-manual-modelo">{eq.modelo}</span>
                        <span className="bdc-manual-vel vel-1v">{eq.specs.flujo} GPM</span>
                        {eq.specs.dimensionPuerto && (
                          <span className="bdc-manual-vel" style={{ color: "#94a3b8" }}>{eq.specs.dimensionPuerto}"</span>
                        )}
                        {eq.specs.tamano != null && (
                          <span className="bdc-manual-vel" style={{ color: "#94a3b8" }}>⌀ {eq.specs.tamano}"</span>
                        )}
                        {esRec && <span className="bdc-manual-badge-rec">★ Rec.</span>}
                      </div>
                      <div className="bdc-manual-fila-cap" style={{ color: "#64748b", fontSize: "0.68rem" }}>
                        mín. {minEste}
                      </div>
                    </div>
                  );
                })}
                {catalogoFiltrado.length === 0 && <div className="bdc-manual-vacio">Sin modelos para estos filtros</div>}
              </div>

              {selId && selCant !== null && (
                <div className="bdc-manual-resultado">
                  <div className="bdc-manual-cant-row">
                    <span className="bdc-manual-cant-label">
                      Cantidad <span style={{ color: "#64748b", fontWeight: 400 }}>(mín. {cantMinima})</span>
                    </span>
                    <div className="bdc-manual-cant-ctrl">
                      <button onClick={() => setSelCant(c => Math.max(cantMinima, c - 1))}>−</button>
                      <span>{selCant}</span>
                      <button onClick={() => setSelCant(c => c + 1)}>+</button>
                    </div>
                  </div>
                  {manualCalc && (
                    <>
                      <div className="bdc-demanda-fila">
                        <span className="bdc-demanda-label">Flujo por equipo requerido</span>
                        <span className="bdc-demanda-valor">{parseFloat(manualCalc.flujoPorEquipo).toFixed(2)} GPM</span>
                      </div>
                      <div className="bdc-demanda-fila">
                        <span className="bdc-demanda-label">Flujo nominal del equipo</span>
                        <span className="bdc-demanda-valor bdc-ok">{manualCalc.equipo.specs.flujo} GPM</span>
                      </div>
                      <div className="bdc-demanda-fila">
                        <span className="bdc-demanda-label">Flujo total instalado</span>
                        <span className="bdc-demanda-valor bdc-ok">{parseFloat(manualCalc.flujoTotal).toFixed(1)} GPM</span>
                      </div>
                      {manualCalc.res?.sumaFinal != null && (
                        <>
                          <div className="bdc-auto-sep" style={{ margin: "0.5rem 0" }} />
                          <div className="bdc-auto-fila bdc-auto-total">
                            <span className="bdc-auto-label">Pérdida de carga</span>
                            <span className="bdc-auto-val bdc-hid-val-highlight">{parseFloat(manualCalc.res.sumaFinal).toFixed(2)} ft</span>
                          </div>
                        </>
                      )}
                    </>
                  )}
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
   SISTEMAS DE SANITIZACIÓN
===================================================== */
const SISTEMAS_SANITIZACION = [
  { key: "cloradorSalino",     label: "Generador de cloro salino", Icon: IconoCloradorSalino     },
  { key: "cloradorAutomatico", label: "Clorador automático",       Icon: IconoCloradorAutomatico },
  { key: "lamparaUV",          label: "Lámpara UV",                Icon: IconoLamparaUV          },
];


/* =====================================================
   SISTEMAS DE FILTRACIÓN
===================================================== */
const SISTEMAS_FILTRACION = [
  { key: "filtroArena",     label: "Filtro de arena",      Icon: IconoFiltroArena     },
  { key: "prefiltro",       label: "Prefiltro",            Icon: IconoPrefiltro       },
  { key: "filtroCartucho",  label: "Filtro de cartucho",   Icon: IconoFiltroCartucho  },
];


/* =====================================================
   BLOQUE PREFILTRO
===================================================== */
function BloquePrefiltro({ flujoMaximo, onCargaChange = null }) {
  const [modo,        setModo]        = useState("recomendado");
  const [selId,       setSelId]       = useState(null);
  const [selCant,     setSelCant]     = useState(null);
  const [filtroMarca, setFiltroMarca] = useState("todas");

  const rec = useMemo(() => {
    if (!flujoMaximo || flujoMaximo <= 0) return null;
    try { const r = prefiltro(flujoMaximo); return r?.error ? null : r; }
    catch { return null; }
  }, [flujoMaximo]);

  const marcas = useMemo(() =>
    ["todas", ...new Set(prefiltros.filter(p => p.metadata.activo).map(p => p.marca))], []);

  const catalogoFiltrado = useMemo(() =>
    prefiltros.filter(p => {
      if (!p.metadata.activo) return false;
      if (filtroMarca !== "todas" && p.marca !== filtroMarca) return false;
      return true;
    }), [filtroMarca]);

  const cantMinima = useMemo(() => {
    if (!selId || !flujoMaximo) return 1;
    const p = prefiltros.find(p => p.id === selId);
    if (!p) return 1;
    return Math.max(1, Math.ceil(flujoMaximo / p.specs.maxFlow));
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

  if (!flujoMaximo || flujoMaximo <= 0) return <div className="sanitizacion-pendiente">Completa las dimensiones para calcular el flujo máximo del sistema</div>;

  const datosActivos = modo === "recomendado" && rec
    ? { marca: rec.seleccion.marca, modelo: rec.seleccion.modelo, cantidad: rec.seleccion.cantidad, flujoPorUnidad: rec.seleccion.flujoPorPrefiltro, flujoTotal: rec.seleccion.flujoTotal, diameter: rec.seleccion.diameter }
    : manualCalc
    ? { marca: manualCalc.prefiltroEq.marca, modelo: manualCalc.prefiltroEq.modelo, cantidad: manualCalc.cantidad, flujoPorUnidad: manualCalc.flujoPorPrefiltro, flujoTotal: manualCalc.flujoTotal, diameter: manualCalc.prefiltroEq.specs.diameter }
    : null;

  const cargaPrefiltroFt = infoActiva && !infoActiva?.error ? parseFloat(infoActiva.cargaTotal) || null : null;
  const onCargaPFRef = useRef(onCargaChange); onCargaPFRef.current = onCargaChange;
  const prevCargaPFRef = useRef(null);
  if (prevCargaPFRef.current !== cargaPrefiltroFt) { prevCargaPFRef.current = cargaPrefiltroFt; if (onCargaPFRef.current) onCargaPFRef.current(cargaPrefiltroFt); }

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
              <div className="bdc-rec-header">
                <IconoPrefiltro />
                <div className="bdc-rec-titulo">
                  <span className="bdc-rec-label">{modo === "recomendado" ? "Recomendado" : "Manual"}</span>
                  <span className="bdc-rec-modelo">{datosActivos.marca} · {datosActivos.modelo}</span>
                </div>
                <span className={`bdc-modo-badge ${modo === "manual" ? "badge-manual" : "badge-auto"}`}>{modo === "manual" ? "Manual" : "Auto"}</span>
              </div>
              <div className="bdc-rec-stats">
                <div className="bdc-stat"><span className="bdc-stat-valor">{datosActivos.cantidad}</span><span className="bdc-stat-label">equipos</span></div>
                <div className="bdc-stat-sep" />
                <div className="bdc-stat"><span className="bdc-stat-valor">{parseFloat(datosActivos.flujoPorUnidad).toFixed(1)}</span><span className="bdc-stat-label">GPM/equipo</span></div>
                <div className="bdc-stat-sep" />
                <div className="bdc-stat"><span className="bdc-stat-valor">{infoActiva.cargaTotal}</span><span className="bdc-stat-label">ft CDT</span></div>
                <div className="bdc-stat-sep" />
                <div className="bdc-stat"><span className="bdc-stat-valor">{infoActiva.cargaTotalPSI}</span><span className="bdc-stat-label">PSI</span></div>
              </div>
              <div className="bdc-rec-demanda">
                <div className="bdc-demanda-fila"><span className="bdc-demanda-label">Diámetro</span><span className="bdc-demanda-valor">{datosActivos.diameter}"</span></div>
              </div>
              <div className="bdc-rec-hidraulica">
                <span className="bdc-hid-label">Carga hidráulica</span>
                <span className="bdc-hid-valor">{infoActiva.cargaTotal} ft · {infoActiva.cargaTotalPSI} PSI</span>
              </div>
            </div>
          ) : (
            <div className="bdc-recomendada-card bdc-pendiente bdc-inset">
              <div className="bdc-rec-header"><IconoPrefiltro /><div className="bdc-rec-titulo"><span className="bdc-rec-label">Prefiltro</span><span className="bdc-rec-modelo bdc-pendiente-txt">{modo === "recomendado" ? "Calculando..." : "Selecciona un equipo"}</span></div></div>
            </div>
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
                      <div className="bdc-manual-fila-info">
                        <span className="bdc-manual-marca">{p.marca}</span>
                        <span className="bdc-manual-modelo">{p.modelo}</span>
                        <span className="bdc-manual-vel vel-1v">{p.specs.maxFlow} GPM</span>
                        <span className="bdc-manual-vel" style={{ color: "#94a3b8" }}>{p.specs.diameter}"</span>
                        {esRec && <span className="bdc-manual-badge-rec">★ Rec.</span>}
                      </div>
                      <div className="bdc-manual-fila-cap" style={{ color: "#64748b", fontSize: "0.68rem" }}>mín. {minE}</div>
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
                    <div className="bdc-demanda-fila"><span className="bdc-demanda-label">Flujo por equipo</span><span className="bdc-demanda-valor">{manualCalc.flujoPorPrefiltro} GPM</span></div>
                    <div className="bdc-demanda-fila"><span className="bdc-demanda-label">Flujo total instalado</span><span className="bdc-demanda-valor bdc-ok">{parseFloat(manualCalc.flujoTotal).toFixed(1)} GPM</span></div>
                    <div className="bdc-auto-sep" style={{ margin: "0.5rem 0" }} />
                    <div className="bdc-auto-fila"><span className="bdc-auto-label">Carga tramos</span><span className="bdc-auto-val">{manualCalc.cargaTramos} ft</span></div>
                    <div className="bdc-auto-fila"><span className="bdc-auto-label">Carga fija</span><span className="bdc-auto-val">{manualCalc.cargaFija_ft} ft</span></div>
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
function BloqueFiltroCartucho({ flujoMaximo, usoGeneral, onCargaChange = null }) {
  const [modo,        setModo]        = useState("recomendado");
  const [selId,       setSelId]       = useState(null);
  const [selCant,     setSelCant]     = useState(null);
  const [filtroMarca, setFiltroMarca] = useState("todas");

  const rec = useMemo(() => {
    if (!flujoMaximo || flujoMaximo <= 0) return null;
    try { const r = filtroCartucho(flujoMaximo, usoGeneral); return r?.error ? null : r; }
    catch { return null; }
  }, [flujoMaximo, usoGeneral]);

  const marcas = useMemo(() =>
    ["todas", ...new Set(
      filtrosCartucho
        .filter(f => f.metadata.activo && flujoEfectivo(f, usoGeneral) !== null)
        .map(f => f.marca)
    )], [usoGeneral]);

  const catalogoFiltrado = useMemo(() =>
    filtrosCartucho.filter(f => {
      if (!f.metadata.activo) return false;
      if (flujoEfectivo(f, usoGeneral) === null) return false;
      if (filtroMarca !== "todas" && f.marca !== filtroMarca) return false;
      return true;
    }), [filtroMarca, usoGeneral]);

  const cantMinima = useMemo(() => {
    if (!selId || !flujoMaximo) return 1;
    const f = filtrosCartucho.find(f => f.id === selId);
    if (!f) return 1;
    const fe = flujoEfectivo(f, usoGeneral);
    if (!fe) return 1;
    return Math.max(1, Math.ceil(flujoMaximo / fe));
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

  const infoActiva = modo === "recomendado" ? rec : manualCalc;

  if (!flujoMaximo || flujoMaximo <= 0) return <div className="sanitizacion-pendiente">Completa las dimensiones para calcular el flujo máximo del sistema</div>;

  const datosActivos = modo === "recomendado" && rec
    ? { marca: rec.seleccion.marca, modelo: rec.seleccion.modelo, cantidad: rec.seleccion.cantidad, flujoEf: rec.seleccion.flujoEfectivo, flujoTotal: rec.seleccion.flujoTotal, filtrationArea: rec.seleccion.filtrationArea }
    : manualCalc
    ? { marca: manualCalc.filtroEq.marca, modelo: manualCalc.filtroEq.modelo, cantidad: manualCalc.cantidad, flujoEf: manualCalc.flujoEf, flujoTotal: manualCalc.flujoTotal, filtrationArea: manualCalc.filtroEq.specs.filtrationArea }
    : null;

  const labelUso = usoGeneral === "residencial" ? "Residencial" : "Comercial";

  const cargaCartuchoFt = infoActiva && !infoActiva?.error ? parseFloat(infoActiva.cargaTotal) || null : null;
  const onCargaCTRef = useRef(onCargaChange); onCargaCTRef.current = onCargaChange;
  const prevCargaCTRef = useRef(null);
  if (prevCargaCTRef.current !== cargaCartuchoFt) { prevCargaCTRef.current = cargaCartuchoFt; if (onCargaCTRef.current) onCargaCTRef.current(cargaCartuchoFt); }

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
              <div className="bdc-rec-header">
                <IconoFiltroCartucho />
                <div className="bdc-rec-titulo">
                  <span className="bdc-rec-label">{modo === "recomendado" ? "Recomendado" : "Manual"}</span>
                  <span className="bdc-rec-modelo">{datosActivos.marca} · {datosActivos.modelo}</span>
                </div>
                <span className={`bdc-modo-badge ${modo === "manual" ? "badge-manual" : "badge-auto"}`}>{modo === "manual" ? "Manual" : "Auto"}</span>
              </div>
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
              <div className="bdc-rec-hidraulica">
                <span className="bdc-hid-label">Carga hidráulica</span>
                <span className="bdc-hid-valor">{infoActiva.cargaTotal} ft · {infoActiva.cargaTotalPSI} PSI</span>
              </div>
            </div>
          ) : (
            <div className="bdc-recomendada-card bdc-pendiente bdc-inset">
              <div className="bdc-rec-header"><IconoFiltroCartucho /><div className="bdc-rec-titulo"><span className="bdc-rec-label">Filtro de cartucho</span><span className="bdc-rec-modelo bdc-pendiente-txt">{modo === "recomendado" ? "Calculando..." : "Selecciona un filtro"}</span></div></div>
            </div>
          )}
        </div>
        <div className="layout-clima-bdc-celda celda-bdc-manual">
          {modo === "recomendado" && rec && !rec.error && (
            <div className="bdc-info-automatica bdc-inset">
              <div className="bdc-manual-header"><span className="bdc-manual-titulo">Detalle de selección automática</span></div>
              <div className="bdc-auto-detalle">
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Marca</span><span className="bdc-auto-val">{rec.seleccion.marca}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Modelo</span><span className="bdc-auto-val">{rec.seleccion.modelo}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Cantidad</span><span className="bdc-auto-val">{rec.seleccion.cantidad} filtro{rec.seleccion.cantidad > 1 ? "s" : ""}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Flujo por filtro</span><span className="bdc-auto-val">{rec.seleccion.flujoEfectivo} GPM</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Flujo total</span><span className="bdc-auto-val">{rec.seleccion.flujoTotal} GPM</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Exceso flujo</span><span className="bdc-auto-val">{rec.seleccion.exceso} GPM</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Área filtración</span><span className="bdc-auto-val">{rec.seleccion.filtrationArea} ft²</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Uso</span><span className="bdc-auto-val">{labelUso}</span></div>
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
              <div className="bdc-manual-header"><span className="bdc-manual-titulo">Catálogo — Filtros de cartucho · {labelUso}</span></div>
              <div className="bdc-manual-filtros"><div className="campo"><label>Marca</label><select value={filtroMarca} onChange={e => setFiltroMarca(e.target.value)}>{marcas.map(m => <option key={m} value={m}>{m === "todas" ? "Todas las marcas" : m}</option>)}</select></div></div>
              <div className="bdc-manual-lista">
                {catalogoFiltrado.map(f => {
                  const fe    = flujoEfectivo(f, usoGeneral);
                  const esRec = rec && !rec.error && f.marca === rec.seleccion.marca && f.modelo === rec.seleccion.modelo;
                  const sel   = selId === f.id;
                  const minE  = fe ? Math.max(1, Math.ceil(flujoMaximo / fe)) : "—";
                  return (
                    <div key={f.id} className={`bdc-manual-fila ${sel ? "bdc-manual-fila-activa" : ""}`} onClick={() => handleSel(f.id)}>
                      <div className="bdc-manual-fila-info">
                        <span className="bdc-manual-marca">{f.marca}</span>
                        <span className="bdc-manual-modelo">{f.modelo}</span>
                        <span className="bdc-manual-vel vel-1v">{fe} GPM</span>
                        <span className="bdc-manual-vel" style={{ color: "#94a3b8" }}>{f.specs.filtrationArea} ft²</span>
                        {esRec && <span className="bdc-manual-badge-rec">★ Rec.</span>}
                      </div>
                      <div className="bdc-manual-fila-cap" style={{ color: "#64748b", fontSize: "0.68rem" }}>mín. {minE}</div>
                    </div>
                  );
                })}
                {catalogoFiltrado.length === 0 && <div className="bdc-manual-vacio">Sin modelos para uso {labelUso.toLowerCase()}</div>}
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
                    <div className="bdc-demanda-fila"><span className="bdc-demanda-label">Flujo por filtro</span><span className="bdc-demanda-valor">{manualCalc.flujoEf} GPM</span></div>
                    <div className="bdc-demanda-fila"><span className="bdc-demanda-label">Flujo total instalado</span><span className="bdc-demanda-valor bdc-ok">{parseFloat(manualCalc.flujoTotal).toFixed(1)} GPM</span></div>
                    <div className="bdc-auto-sep" style={{ margin: "0.5rem 0" }} />
                    <div className="bdc-auto-fila"><span className="bdc-auto-label">Carga tramos</span><span className="bdc-auto-val">{manualCalc.cargaTramos} ft</span></div>
                    <div className="bdc-auto-fila"><span className="bdc-auto-label">Carga fija</span><span className="bdc-auto-val">{manualCalc.cargaFija_ft} ft</span></div>
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
function BloqueFiltroArena({ flujoMaximo, onCargaChange = null }) {
  const [modo,        setModo]        = useState("recomendado");
  const [selId,       setSelId]       = useState(null);
  const [selCant,     setSelCant]     = useState(null);
  const [filtroMarca, setFiltroMarca] = useState("todas");

  const rec = useMemo(() => {
    if (!flujoMaximo || flujoMaximo <= 0) return null;
    try { const r = filtroArena(flujoMaximo); return r?.error ? null : r; }
    catch { return null; }
  }, [flujoMaximo]);

  const marcas = useMemo(() =>
    ["todas", ...new Set(filtrosArena.filter(f => f.metadata.activo).map(f => f.marca))],
  []);

  const catalogoFiltrado = useMemo(() =>
    filtrosArena.filter(f => {
      if (!f.metadata.activo) return false;
      if (filtroMarca !== "todas" && f.marca !== filtroMarca) return false;
      return true;
    }),
  [filtroMarca]);

  const cantMinima = useMemo(() => {
    if (!selId || !flujoMaximo) return 1;
    const f = filtrosArena.find(f => f.id === selId);
    if (!f) return 1;
    return Math.max(1, Math.ceil(flujoMaximo / f.specs.maxFlow));
  }, [selId, flujoMaximo]);

  const handleSelFiltro = (id) => {
    if (selId === id) { setSelId(null); setSelCant(null); return; }
    setSelId(id);
    const f = filtrosArena.find(f => f.id === id);
    if (f && flujoMaximo) setSelCant(Math.max(1, Math.ceil(flujoMaximo / f.specs.maxFlow)));
    else setSelCant(1);
  };

  // Cálculo directo en render — igual que BloqueEmpotrable
  let manualCalc = null;
  if (selId && selCant && flujoMaximo) {
    const f = filtrosArena.find(fi => fi.id === selId);
    if (f) {
      try {
        const res = calcularCargaFiltroArenaManual(f.specs.maxFlow, selCant);
        if (!res?.error) {
          manualCalc = {
            filtro: f,
            cantidad: selCant,
            flujoPorFiltro: f.specs.maxFlow,
            flujoTotal: parseFloat((f.specs.maxFlow * selCant).toFixed(2)),
            ...res,
          };
        }
      } catch { manualCalc = null; }
    }
  }

  const infoActiva = modo === "recomendado" ? rec : manualCalc;

  // Reportar carga activa al padre
  const cargaFiltroFt = infoActiva && !infoActiva?.error ? parseFloat(infoActiva.cargaTotal) || null : null;
  const onCargaFARef = useRef(onCargaChange);
  onCargaFARef.current = onCargaChange;
  const prevCargaFARef = useRef(null);
  if (prevCargaFARef.current !== cargaFiltroFt) {
    prevCargaFARef.current = cargaFiltroFt;
    if (onCargaFARef.current) onCargaFARef.current(cargaFiltroFt);
  }

  if (!flujoMaximo || flujoMaximo <= 0) {
    return <div className="sanitizacion-pendiente">Completa las dimensiones para calcular el flujo máximo del sistema</div>;
  }

  return (
    <div className="sanitizacion-bloque-equipo">
      <div className="bdc-modo-toggle-wrapper">
        <div className="bdc-modo-toggle">
          <button type="button" className={`bdc-modo-btn ${modo === "recomendado" ? "bdc-modo-activo" : ""}`} onClick={() => setModo("recomendado")}>
            {modo === "recomendado" && <IconoCheck />}<span>Recomendado</span>
          </button>
          <button type="button" className={`bdc-modo-btn ${modo === "manual" ? "bdc-modo-activo" : ""}`} onClick={() => setModo("manual")}>
            {modo === "manual" && <IconoCheck />}<span>Selección manual</span>
          </button>
        </div>
      </div>

      <div style={{ fontSize: "0.7rem", color: "#94a3b8", padding: "0.25rem 0.5rem 0.5rem" }}>
        Flujo máximo del sistema: <span style={{ color: "#38bdf8", fontWeight: 600 }}>{parseFloat(flujoMaximo).toFixed(1)} GPM</span>
      </div>

      <div className="layout-clima-bdc-fila2" style={{ marginTop: 0 }}>
        {/* Tarjeta activa */}
        <div className="layout-clima-bdc-celda celda-bdc-rec">
          {infoActiva && !infoActiva.error ? (
            <div className={`bdc-recomendada-card bdc-inset ${modo === "manual" ? "bdc-card-manual-activa" : ""}`}>
              <div className="bdc-rec-header">
                <IconoFiltroArena />
                <div className="bdc-rec-titulo">
                  <span className="bdc-rec-label">{modo === "recomendado" ? "Recomendado" : "Manual"}</span>
                  <span className="bdc-rec-modelo">
                    {modo === "recomendado"
                      ? `${infoActiva.seleccion.marca} · ${infoActiva.seleccion.modelo}`
                      : `${infoActiva.filtro.marca} · ${infoActiva.filtro.modelo}`}
                  </span>
                </div>
                <span className={`bdc-modo-badge ${modo === "manual" ? "badge-manual" : "badge-auto"}`}>
                  {modo === "manual" ? "Manual" : "Auto"}
                </span>
              </div>
              <div className="bdc-rec-stats">
                <div className="bdc-stat">
                  <span className="bdc-stat-valor">
                    {modo === "recomendado" ? infoActiva.seleccion.cantidad : infoActiva.cantidad}
                  </span>
                  <span className="bdc-stat-label">filtros</span>
                </div>
                <div className="bdc-stat-sep" />
                <div className="bdc-stat">
                  <span className="bdc-stat-valor">
                    {modo === "recomendado"
                      ? parseFloat(infoActiva.seleccion.flujoPorFiltro).toFixed(1)
                      : parseFloat(infoActiva.flujoPorFiltro).toFixed(1)}
                  </span>
                  <span className="bdc-stat-label">GPM/filtro</span>
                </div>
                <div className="bdc-stat-sep" />
                <div className="bdc-stat">
                  <span className="bdc-stat-valor">{infoActiva.cargaTotal}</span>
                  <span className="bdc-stat-label">ft CDT</span>
                </div>
                <div className="bdc-stat-sep" />
                <div className="bdc-stat">
                  <span className="bdc-stat-valor">{infoActiva.cargaTotalPSI}</span>
                  <span className="bdc-stat-label">PSI</span>
                </div>
              </div>
              <div className="bdc-rec-demanda">
                {modo === "recomendado" && (<>
                  <div className="bdc-demanda-fila">
                    <span className="bdc-demanda-label">Diámetro</span>
                    <span className="bdc-demanda-valor">{infoActiva.seleccion.diameter}"</span>
                  </div>
                  <div className="bdc-demanda-fila">
                    <span className="bdc-demanda-label">Área de filtración</span>
                    <span className="bdc-demanda-valor">{infoActiva.seleccion.filtrationArea} ft²</span>
                  </div>
                  <div className="bdc-demanda-fila">
                    <span className="bdc-demanda-label">Arena</span>
                    <span className="bdc-demanda-valor bdc-ok">{infoActiva.seleccion.arena} kg</span>
                  </div>
                  {infoActiva.seleccion.grava > 0 && (
                    <div className="bdc-demanda-fila">
                      <span className="bdc-demanda-label">Grava</span>
                      <span className="bdc-demanda-valor">{infoActiva.seleccion.grava} kg</span>
                    </div>
                  )}
                </>)}
                {modo === "manual" && (<>
                  <div className="bdc-demanda-fila">
                    <span className="bdc-demanda-label">Diámetro</span>
                    <span className="bdc-demanda-valor">{infoActiva.filtro.specs.diameter}"</span>
                  </div>
                  <div className="bdc-demanda-fila">
                    <span className="bdc-demanda-label">Área de filtración</span>
                    <span className="bdc-demanda-valor">{infoActiva.filtro.specs.filtrationArea} ft²</span>
                  </div>
                  <div className="bdc-demanda-fila">
                    <span className="bdc-demanda-label">Arena</span>
                    <span className="bdc-demanda-valor bdc-ok">{infoActiva.filtro.specs.arena} kg</span>
                  </div>
                  {infoActiva.filtro.specs.grava > 0 && (
                    <div className="bdc-demanda-fila">
                      <span className="bdc-demanda-label">Grava</span>
                      <span className="bdc-demanda-valor">{infoActiva.filtro.specs.grava} kg</span>
                    </div>
                  )}
                </>)}
              </div>
              <div className="bdc-rec-hidraulica">
                <span className="bdc-hid-label">Carga hidráulica</span>
                <span className="bdc-hid-valor">{infoActiva.cargaTotal} ft · {infoActiva.cargaTotalPSI} PSI</span>
              </div>
            </div>
          ) : (
            <div className="bdc-recomendada-card bdc-pendiente bdc-inset">
              <div className="bdc-rec-header">
                <IconoFiltroArena />
                <div className="bdc-rec-titulo">
                  <span className="bdc-rec-label">Filtro de arena</span>
                  <span className="bdc-rec-modelo bdc-pendiente-txt">
                    {modo === "recomendado" ? "Calculando selección..." : "Selecciona un filtro del catálogo"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Columna derecha */}
        <div className="layout-clima-bdc-celda celda-bdc-manual">
          {modo === "recomendado" && rec && !rec.error && (
            <div className="bdc-info-automatica bdc-inset">
              <div className="bdc-manual-header"><span className="bdc-manual-titulo">Detalle de selección automática</span></div>
              <div className="bdc-auto-detalle">
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Marca</span><span className="bdc-auto-val">{rec.seleccion.marca}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Modelo</span><span className="bdc-auto-val">{rec.seleccion.modelo}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Cantidad</span><span className="bdc-auto-val">{rec.seleccion.cantidad} filtro{rec.seleccion.cantidad > 1 ? "s" : ""}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Flujo por filtro</span><span className="bdc-auto-val">{rec.seleccion.flujoPorFiltro} GPM</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Flujo total</span><span className="bdc-auto-val">{rec.seleccion.flujoTotal} GPM</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Exceso flujo</span><span className="bdc-auto-val">{rec.seleccion.exceso} GPM</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Diámetro</span><span className="bdc-auto-val">{rec.seleccion.diameter}"</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Área filtración</span><span className="bdc-auto-val">{rec.seleccion.filtrationArea} ft²</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Arena</span><span className="bdc-auto-val">{rec.seleccion.arena} kg</span></div>
                {rec.seleccion.grava > 0 && <div className="bdc-auto-fila"><span className="bdc-auto-label">Grava</span><span className="bdc-auto-val">{rec.seleccion.grava} kg</span></div>}
                <div className="bdc-auto-sep" />
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Carga tramos</span><span className="bdc-auto-val">{rec.cargaTramos} ft</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Carga fija</span><span className="bdc-auto-val">{rec.cargaFija_ft} ft</span></div>
                <div className="bdc-auto-sep" />
                <div className="bdc-auto-fila bdc-auto-total">
                  <span className="bdc-auto-label">Carga total</span>
                  <span className="bdc-auto-val bdc-hid-val-highlight">{rec.cargaTotal} ft · {rec.cargaTotalPSI} PSI</span>
                </div>
              </div>
            </div>
          )}

          {modo === "manual" && (
            <div className="bdc-selector-manual bdc-inset">
              <div className="bdc-manual-header"><span className="bdc-manual-titulo">Catálogo — Filtros de arena</span></div>
              <div className="bdc-manual-filtros">
                <div className="campo">
                  <label>Marca</label>
                  <select value={filtroMarca} onChange={e => setFiltroMarca(e.target.value)}>
                    {marcas.map(m => <option key={m} value={m}>{m === "todas" ? "Todas las marcas" : m}</option>)}
                  </select>
                </div>
              </div>
              <div className="bdc-manual-lista">
                {catalogoFiltrado.map(f => {
                  const esRec  = rec && !rec.error && f.marca === rec.seleccion.marca && f.modelo === rec.seleccion.modelo;
                  const sel    = selId === f.id;
                  const minEst = Math.max(1, Math.ceil(flujoMaximo / f.specs.maxFlow));
                  return (
                    <div key={f.id}
                      className={`bdc-manual-fila ${sel ? "bdc-manual-fila-activa" : ""}`}
                      onClick={() => handleSelFiltro(f.id)}>
                      <div className="bdc-manual-fila-info">
                        <span className="bdc-manual-marca">{f.marca}</span>
                        <span className="bdc-manual-modelo">{f.modelo}</span>
                        <span className="bdc-manual-vel vel-1v">{f.specs.maxFlow} GPM</span>
                        <span className="bdc-manual-vel" style={{ color: "#94a3b8" }}>{f.specs.diameter}"</span>
                        {esRec && <span className="bdc-manual-badge-rec">★ Rec.</span>}
                      </div>
                      <div className="bdc-manual-fila-cap" style={{ color: "#64748b", fontSize: "0.68rem" }}>
                        mín. {minEst}
                      </div>
                    </div>
                  );
                })}
                {catalogoFiltrado.length === 0 && <div className="bdc-manual-vacio">Sin modelos para estos filtros</div>}
              </div>

              {selId && selCant !== null && (
                <div className="bdc-manual-resultado">
                  <div className="bdc-manual-cant-row">
                    <span className="bdc-manual-cant-label">
                      Cantidad <span style={{ color: "#64748b", fontWeight: 400 }}>(mín. {cantMinima})</span>
                    </span>
                    <div className="bdc-manual-cant-ctrl">
                      <button onClick={() => setSelCant(c => Math.max(cantMinima, c - 1))}>−</button>
                      <span>{selCant}</span>
                      <button onClick={() => setSelCant(c => c + 1)}>+</button>
                    </div>
                  </div>
                  {manualCalc && (
                    <>
                      <div className="bdc-demanda-fila">
                        <span className="bdc-demanda-label">Flujo por filtro</span>
                        <span className="bdc-demanda-valor">{manualCalc.flujoPorFiltro} GPM</span>
                      </div>
                      <div className="bdc-demanda-fila">
                        <span className="bdc-demanda-label">Flujo total instalado</span>
                        <span className="bdc-demanda-valor bdc-ok">{parseFloat(manualCalc.flujoTotal).toFixed(1)} GPM</span>
                      </div>
                      <div className="bdc-auto-sep" style={{ margin: "0.5rem 0" }} />
                      <div className="bdc-auto-fila"><span className="bdc-auto-label">Carga tramos</span><span className="bdc-auto-val">{manualCalc.cargaTramos} ft</span></div>
                      <div className="bdc-auto-fila"><span className="bdc-auto-label">Carga fija</span><span className="bdc-auto-val">{manualCalc.cargaFija_ft} ft</span></div>
                      <div className="bdc-auto-sep" style={{ margin: "0.5rem 0" }} />
                      <div className="bdc-auto-fila bdc-auto-total">
                        <span className="bdc-auto-label">Carga total</span>
                        <span className="bdc-auto-val bdc-hid-val-highlight">{manualCalc.cargaTotal} ft · {manualCalc.cargaTotalPSI} PSI</span>
                      </div>
                    </>
                  )}
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
  const [modoCL,          setModoCL]          = useState("recomendado");
  const [selManualCLId,   setSelManualCLId]   = useState(null);
  const [selManualCLCant, setSelManualCLCant] = useState(1);
  const [filtroMarca,     setFiltroMarca]     = useState("todas");

  const rec = resultadoClorador && !resultadoClorador.error ? resultadoClorador : null;

  const marcasDisponibles = useMemo(() =>
    ["todas", ...new Set(generadoresDeCloro.filter(g => g.metadata.activo).map(g => g.marca))],
  []);

  const catalogoFiltrado = useMemo(() =>
    generadoresDeCloro.filter(g => {
      if (!g.metadata.activo) return false;
      if (filtroMarca !== "todas" && g.marca !== filtroMarca) return false;
      return true;
    }),
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
    if (modoCL === "manual" && cloradorManual) {
      return { marca: cloradorManual.equipo.marca, modelo: cloradorManual.equipo.modelo, cantidad: cloradorManual.cantidad, flujoTotal: cloradorManual.flujoTotal, cargaTotal: cloradorManual.hidraulica?.cargaTotal, cargaTotalPSI: cloradorManual.hidraulica?.cargaTotalPSI, capInstalada: parseFloat((cloradorManual.cantidad * cloradorManual.equipo.specs.capacidadComercial).toFixed(3)), unidad: "kg/día" };
    }
    if (rec) {
      return { marca: rec.seleccion.marca, modelo: rec.seleccion.modelo, cantidad: rec.seleccion.cantidad, flujoTotal: rec.seleccion.flujoTotal, cargaTotal: rec.cargaTotal, cargaTotalPSI: rec.cargaTotalPSI, capInstalada: rec.kgDiaInstalado, unidad: rec.modoCloro === "comercial" ? "kg/día" : "litros" };
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
              <div className="bdc-rec-header"><IconoCloradorSalino /><div className="bdc-rec-titulo"><span className="bdc-rec-label">{modoCL === "recomendado" ? "Recomendado" : "Manual"}</span><span className="bdc-rec-modelo">{infoActiva.marca} · {infoActiva.modelo}</span></div><span className={`bdc-modo-badge ${modoCL === "manual" ? "badge-manual" : "badge-auto"}`}>{modoCL === "manual" ? "Manual" : "Auto"}</span></div>
              <div className="bdc-rec-stats">
                <div className="bdc-stat"><span className="bdc-stat-valor">{infoActiva.cantidad}</span><span className="bdc-stat-label">equipos</span></div>
                <div className="bdc-stat-sep" />
                <div className="bdc-stat"><span className="bdc-stat-valor">{parseFloat(infoActiva.flujoTotal).toFixed(1)}</span><span className="bdc-stat-label">GPM total</span></div>
                <div className="bdc-stat-sep" />
                <div className="bdc-stat"><span className="bdc-stat-valor">{infoActiva.cargaTotal}</span><span className="bdc-stat-label">ft CDT</span></div>
                <div className="bdc-stat-sep" />
                <div className="bdc-stat"><span className="bdc-stat-valor">{infoActiva.cargaTotalPSI}</span><span className="bdc-stat-label">PSI</span></div>
              </div>
              {infoActiva.capInstalada != null && (<div className="bdc-rec-demanda"><div className="bdc-demanda-fila"><span className="bdc-demanda-label">Capacidad instalada</span><span className="bdc-demanda-valor bdc-ok">{infoActiva.capInstalada} {infoActiva.unidad}</span></div>{rec.kgDiaNecesario != null && (<div className="bdc-demanda-fila"><span className="bdc-demanda-label">Demanda necesaria</span><span className="bdc-demanda-valor">{rec.kgDiaNecesario} kg/día</span></div>)}</div>)}
              {infoActiva.cargaTotal != null && (<div className="bdc-rec-hidraulica"><span className="bdc-hid-label">Carga hidráulica</span><span className="bdc-hid-valor">{infoActiva.cargaTotal} ft · {infoActiva.cargaTotalPSI} PSI</span></div>)}
            </div>
          ) : (
            <div className="bdc-recomendada-card bdc-pendiente bdc-inset"><div className="bdc-rec-header"><IconoCloradorSalino /><div className="bdc-rec-titulo"><span className="bdc-rec-label">Generador de cloro salino</span><span className="bdc-rec-modelo bdc-pendiente-txt">{modoCL === "recomendado" ? "Completa las dimensiones" : "Selecciona un equipo"}</span></div></div></div>
          )}
        </div>
        <div className="layout-clima-bdc-celda celda-bdc-manual">
          {modoCL === "recomendado" && rec && (
            <div className="bdc-info-automatica bdc-inset">
              <div className="bdc-manual-header"><span className="bdc-manual-titulo">Detalle de selección automática</span></div>
              <div className="bdc-auto-detalle">
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Marca</span><span className="bdc-auto-val">{rec.seleccion.marca}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Modelo</span><span className="bdc-auto-val">{rec.seleccion.modelo}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Cantidad</span><span className="bdc-auto-val">{rec.seleccion.cantidad} equipo{rec.seleccion.cantidad > 1 ? "s" : ""}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Flujo por equipo</span><span className="bdc-auto-val">{rec.seleccion.flujoPorEquipo} GPM</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Flujo total</span><span className="bdc-auto-val">{rec.seleccion.flujoTotal} GPM</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Modo cálculo</span><span className="bdc-auto-val" style={{ textTransform: "capitalize" }}>{rec.modoCloro}</span></div>
                {rec.kgDiaNecesario != null && (<><div className="bdc-auto-fila"><span className="bdc-auto-label">Demanda necesaria</span><span className="bdc-auto-val">{rec.kgDiaNecesario} kg/día</span></div><div className="bdc-auto-fila"><span className="bdc-auto-label">Capacidad instalada</span><span className="bdc-auto-val">{rec.kgDiaInstalado} kg/día</span></div></>)}
                <div className="bdc-auto-sep" />
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Carga tramos</span><span className="bdc-auto-val">{rec.cargaTramos} ft</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Carga fija</span><span className="bdc-auto-val">{rec.cargaFija_ft} ft</span></div>
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
                {catalogoFiltrado.map(g => { const esRec = rec && g.marca === rec.seleccion.marca && g.modelo === rec.seleccion.modelo; const sel = selManualCLId === g.id; return (<div key={g.id} className={`bdc-manual-fila ${sel ? "bdc-manual-fila-activa" : ""}`} onClick={() => { setSelManualCLId(sel ? null : g.id); setSelManualCLCant(1); }}><div className="bdc-manual-fila-info"><span className="bdc-manual-marca">{g.marca}</span><span className="bdc-manual-modelo">{g.modelo}</span><span className="bdc-manual-vel vel-1v">{g.specs.flujo} GPM</span>{esRec && <span className="bdc-manual-badge-rec">★ Rec.</span>}</div><div className="bdc-manual-fila-cap">{g.specs.capacidadComercial} kg/día</div></div>); })}
                {catalogoFiltrado.length === 0 && <div className="bdc-manual-vacio">Sin modelos para estos filtros</div>}
              </div>
              {selManualCLId && (<div className="bdc-manual-resultado"><div className="bdc-manual-cant-row"><span className="bdc-manual-cant-label">Cantidad de equipos</span><div className="bdc-manual-cant-ctrl"><button onClick={() => setSelManualCLCant(c => Math.max(1, c - 1))}>−</button><span>{selManualCLCant}</span><button onClick={() => setSelManualCLCant(c => c + 1)}>+</button></div></div>{cloradorManual && (<><div className="bdc-demanda-fila"><span className="bdc-demanda-label">Flujo total</span><span className="bdc-demanda-valor">{parseFloat(cloradorManual.flujoTotal).toFixed(1)} GPM</span></div><div className="bdc-demanda-fila"><span className="bdc-demanda-label">Capacidad instalada</span><span className="bdc-demanda-valor bdc-ok">{parseFloat((cloradorManual.cantidad * cloradorManual.equipo.specs.capacidadComercial).toFixed(3))} kg/día</span></div>{cloradorManual.hidraulica && (<div className="bdc-manual-hidraulica-detalle"><div className="bdc-auto-sep" style={{ margin: "0.5rem 0" }} /><div className="bdc-hid-detalle-titulo">Carga hidráulica</div><div className="bdc-auto-fila"><span className="bdc-auto-label">Carga tramos</span><span className="bdc-auto-val">{cloradorManual.hidraulica.cargaTramos} ft</span></div><div className="bdc-auto-fila"><span className="bdc-auto-label">Carga fija</span><span className="bdc-auto-val">{cloradorManual.hidraulica.cargaFija_ft} ft</span></div><div className="bdc-auto-sep" style={{ margin: "0.5rem 0" }} /><div className="bdc-auto-fila bdc-auto-total"><span className="bdc-auto-label">Carga total</span><span className="bdc-auto-val bdc-hid-val-highlight">{cloradorManual.hidraulica.cargaTotal} ft · {cloradorManual.hidraulica.cargaTotalPSI} PSI</span></div></div>)}</>)}</div>)}
              {!selManualCLId && <div className="bdc-manual-hint">Selecciona un equipo del catálogo para calcular carga y flujo</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   BLOQUE CLORADOR AUTOMÁTICO
===================================================== */
function BloqueCloradorAutomatico({ volumenLitros, usoGeneral, areaM2, volumenM3, tempC }) {
  const [modoCL,          setModoCL]          = useState("recomendado");
  const [instalacion,     setInstalacion]     = useState(null);
  const [selManualCLId,   setSelManualCLId]   = useState(null);
  const [selManualCLCant, setSelManualCLCant] = useState(1);
  const [filtroMarca,     setFiltroMarca]     = useState("todas");

  const rec = useMemo(() => {
    if (!instalacion || !volumenLitros || volumenLitros <= 0) return null;
    try { const r = cloradorAutomatico(volumenLitros, usoGeneral, areaM2, volumenM3, tempC, instalacion); return r?.error ? null : r; }
    catch { return null; }
  }, [instalacion, volumenLitros, usoGeneral, areaM2, volumenM3, tempC]);

  const marcasDisponibles = useMemo(() =>
    ["todas", ...new Set(cloradoresAutomaticos.filter(c => c.metadata.activo && (!instalacion || c.instalacion === instalacion)).map(c => c.marca))],
  [instalacion]);

  const catalogoFiltrado = useMemo(() =>
    cloradoresAutomaticos.filter(c => {
      if (!c.metadata.activo) return false;
      if (instalacion && c.instalacion !== instalacion) return false;
      if (filtroMarca !== "todas" && c.marca !== filtroMarca) return false;
      return true;
    }),
  [instalacion, filtroMarca]);

  const cloradorManual = useMemo(() => {
    if (!selManualCLId || selManualCLCant <= 0) return null;
    const equipo = cloradoresAutomaticos.find(c => c.id === selManualCLId);
    if (!equipo) return null;
    try { const hidraulica = calcularCargaCloradorAutomaticoManual(equipo.specs.flujo, selManualCLCant, equipo.instalacion); if (hidraulica?.error) return null; return { equipo, cantidad: selManualCLCant, flujoTotal: equipo.specs.flujo * selManualCLCant, hidraulica }; }
    catch { return null; }
  }, [selManualCLId, selManualCLCant]);

  const infoActiva = useMemo(() => {
    if (modoCL === "manual" && cloradorManual) return { marca: cloradorManual.equipo.marca, modelo: cloradorManual.equipo.modelo, instalacion: cloradorManual.equipo.instalacion, cantidad: cloradorManual.cantidad, flujoTotal: cloradorManual.flujoTotal, cargaTotal: cloradorManual.hidraulica?.cargaTotal, cargaTotalPSI: cloradorManual.hidraulica?.cargaTotalPSI, capInstalada: parseFloat((cloradorManual.cantidad * cloradorManual.equipo.specs.capacidadComercial).toFixed(3)), unidad: "kg/día" };
    if (rec) return { marca: rec.seleccion.marca, modelo: rec.seleccion.modelo, instalacion: rec.seleccion.instalacion, cantidad: rec.seleccion.cantidad, flujoTotal: rec.seleccion.flujoTotal, cargaTotal: rec.cargaTotal, cargaTotalPSI: rec.cargaTotalPSI, capInstalada: rec.kgDiaInstalado, unidad: rec.modoCloro === "comercial" ? "kg/día" : "litros" };
    return null;
  }, [modoCL, cloradorManual, rec]);

  const labelInstalacion = (inst) => inst === "enLinea" ? "En línea" : inst === "fueraLinea" ? "Fuera de línea" : inst;

  if (!instalacion) {
    return (
      <div className="sanitizacion-bloque-equipo">
        <div className="sanitizacion-tipo-instalacion">
          <div className="sanitizacion-tipo-label">Selecciona el tipo de instalación</div>
          <div className="sistemas-calentamiento-grid" style={{ gridTemplateColumns: "1fr 1fr", marginTop: "0.5rem" }}>
            <div className="sistema-cal-card" onClick={() => setInstalacion("enLinea")}><div className="sistema-cal-icon"><IconoCloradorAutomatico /></div><div className="sistema-cal-label">En línea</div></div>
            <div className="sistema-cal-card" onClick={() => setInstalacion("fueraLinea")}><div className="sistema-cal-icon"><IconoCloradorAutomatico /></div><div className="sistema-cal-label">Fuera de línea</div></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sanitizacion-bloque-equipo">
      <div className="bdc-modo-toggle-wrapper" style={{ marginBottom: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", width: "100%" }}>
          <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Tipo:</span>
          <div className="bdc-modo-toggle">
            <button type="button" className={`bdc-modo-btn ${instalacion === "enLinea" ? "bdc-modo-activo" : ""}`} onClick={() => { setInstalacion("enLinea"); setSelManualCLId(null); setSelManualCLCant(1); }}>{instalacion === "enLinea" && <IconoCheck />}<span>En línea</span></button>
            <button type="button" className={`bdc-modo-btn ${instalacion === "fueraLinea" ? "bdc-modo-activo" : ""}`} onClick={() => { setInstalacion("fueraLinea"); setSelManualCLId(null); setSelManualCLCant(1); }}>{instalacion === "fueraLinea" && <IconoCheck />}<span>Fuera de línea</span></button>
          </div>
        </div>
      </div>
      <div className="bdc-modo-toggle-wrapper">
        <div className="bdc-modo-toggle">
          <button type="button" className={`bdc-modo-btn ${modoCL === "recomendado" ? "bdc-modo-activo" : ""}`} onClick={() => setModoCL("recomendado")}>{modoCL === "recomendado" && <IconoCheck />}<span>Recomendado</span></button>
          <button type="button" className={`bdc-modo-btn ${modoCL === "manual" ? "bdc-modo-activo" : ""}`} onClick={() => setModoCL("manual")}>{modoCL === "manual" && <IconoCheck />}<span>Selección manual</span></button>
        </div>
      </div>
      {/* El resto del bloque clorador automático se mantiene idéntico al original */}
      <div className="layout-clima-bdc-fila2" style={{ marginTop: 0 }}>
        <div className="layout-clima-bdc-celda celda-bdc-rec">
          {infoActiva ? (
            <div className={`bdc-recomendada-card bdc-inset ${modoCL === "manual" ? "bdc-card-manual-activa" : ""}`}>
              <div className="bdc-rec-header"><IconoCloradorAutomatico /><div className="bdc-rec-titulo"><span className="bdc-rec-label">{modoCL === "recomendado" ? "Recomendado" : "Manual"}</span><span className="bdc-rec-modelo">{infoActiva.marca} · {infoActiva.modelo}</span></div><span className={`bdc-modo-badge ${modoCL === "manual" ? "badge-manual" : "badge-auto"}`}>{modoCL === "manual" ? "Manual" : "Auto"}</span></div>
              <div className="bdc-rec-stats"><div className="bdc-stat"><span className="bdc-stat-valor">{infoActiva.cantidad}</span><span className="bdc-stat-label">equipos</span></div><div className="bdc-stat-sep" /><div className="bdc-stat"><span className="bdc-stat-valor">{parseFloat(infoActiva.flujoTotal).toFixed(1)}</span><span className="bdc-stat-label">GPM total</span></div><div className="bdc-stat-sep" /><div className="bdc-stat"><span className="bdc-stat-valor">{infoActiva.cargaTotal}</span><span className="bdc-stat-label">ft CDT</span></div><div className="bdc-stat-sep" /><div className="bdc-stat"><span className="bdc-stat-valor">{infoActiva.cargaTotalPSI}</span><span className="bdc-stat-label">PSI</span></div></div>
              {infoActiva.capInstalada != null && (<div className="bdc-rec-demanda"><div className="bdc-demanda-fila"><span className="bdc-demanda-label">Capacidad instalada</span><span className="bdc-demanda-valor bdc-ok">{infoActiva.capInstalada} {infoActiva.unidad}</span></div>{rec?.kgDiaNecesario != null && (<div className="bdc-demanda-fila"><span className="bdc-demanda-label">Demanda necesaria</span><span className="bdc-demanda-valor">{rec.kgDiaNecesario} kg/día</span></div>)}<div className="bdc-demanda-fila"><span className="bdc-demanda-label">Instalación</span><span className="bdc-demanda-valor">{labelInstalacion(infoActiva.instalacion)}</span></div></div>)}
              {infoActiva.cargaTotal != null && (<div className="bdc-rec-hidraulica"><span className="bdc-hid-label">Carga hidráulica</span><span className="bdc-hid-valor">{infoActiva.cargaTotal} ft · {infoActiva.cargaTotalPSI} PSI</span></div>)}
            </div>
          ) : (
            <div className="bdc-recomendada-card bdc-pendiente bdc-inset"><div className="bdc-rec-header"><IconoCloradorAutomatico /><div className="bdc-rec-titulo"><span className="bdc-rec-label">Clorador automático</span><span className="bdc-rec-modelo bdc-pendiente-txt">{modoCL === "recomendado" ? "Completa las dimensiones" : "Selecciona un equipo"}</span></div></div></div>
          )}
        </div>
        <div className="layout-clima-bdc-celda celda-bdc-manual">
          {modoCL === "recomendado" && rec && (
            <div className="bdc-info-automatica bdc-inset">
              <div className="bdc-manual-header"><span className="bdc-manual-titulo">Detalle de selección automática</span></div>
              <div className="bdc-auto-detalle">
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Marca</span><span className="bdc-auto-val">{rec.seleccion.marca}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Modelo</span><span className="bdc-auto-val">{rec.seleccion.modelo}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Instalación</span><span className="bdc-auto-val">{labelInstalacion(rec.seleccion.instalacion)}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Cantidad</span><span className="bdc-auto-val">{rec.seleccion.cantidad} equipo{rec.seleccion.cantidad > 1 ? "s" : ""}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Flujo por equipo</span><span className="bdc-auto-val">{rec.seleccion.flujoPorEquipo} GPM</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Flujo total</span><span className="bdc-auto-val">{rec.seleccion.flujoTotal} GPM</span></div>
                <div className="bdc-auto-sep" />
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Carga tramos</span><span className="bdc-auto-val">{rec.cargaTramos} ft</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Carga fija</span><span className="bdc-auto-val">{rec.cargaFija_ft} ft</span></div>
                <div className="bdc-auto-sep" />
                <div className="bdc-auto-fila bdc-auto-total"><span className="bdc-auto-label">Carga total</span><span className="bdc-auto-val bdc-hid-val-highlight">{rec.cargaTotal} ft · {rec.cargaTotalPSI} PSI</span></div>
              </div>
            </div>
          )}
          {modoCL === "manual" && (
            <div className="bdc-selector-manual bdc-inset">
              <div className="bdc-manual-header"><span className="bdc-manual-titulo">Catálogo — {labelInstalacion(instalacion)}</span></div>
              <div className="bdc-manual-filtros"><div className="campo"><label>Marca</label><select value={filtroMarca} onChange={e => setFiltroMarca(e.target.value)}>{marcasDisponibles.map(m => <option key={m} value={m}>{m === "todas" ? "Todas las marcas" : m}</option>)}</select></div></div>
              <div className="bdc-manual-lista">
                {catalogoFiltrado.map(c => { const esRec = rec && c.marca === rec.seleccion.marca && c.modelo === rec.seleccion.modelo; const sel = selManualCLId === c.id; return (<div key={c.id} className={`bdc-manual-fila ${sel ? "bdc-manual-fila-activa" : ""}`} onClick={() => { setSelManualCLId(sel ? null : c.id); setSelManualCLCant(1); }}><div className="bdc-manual-fila-info"><span className="bdc-manual-marca">{c.marca}</span><span className="bdc-manual-modelo">{c.modelo}</span><span className="bdc-manual-vel vel-1v">{c.specs.flujo} GPM</span>{esRec && <span className="bdc-manual-badge-rec">★ Rec.</span>}</div><div className="bdc-manual-fila-cap">{c.specs.capacidadComercial} kg/día</div></div>); })}
                {catalogoFiltrado.length === 0 && <div className="bdc-manual-vacio">Sin modelos para estos filtros</div>}
              </div>
              {selManualCLId && (<div className="bdc-manual-resultado"><div className="bdc-manual-cant-row"><span className="bdc-manual-cant-label">Cantidad de equipos</span><div className="bdc-manual-cant-ctrl"><button onClick={() => setSelManualCLCant(c => Math.max(1, c - 1))}>−</button><span>{selManualCLCant}</span><button onClick={() => setSelManualCLCant(c => c + 1)}>+</button></div></div>{cloradorManual && (<><div className="bdc-demanda-fila"><span className="bdc-demanda-label">Flujo total</span><span className="bdc-demanda-valor">{parseFloat(cloradorManual.flujoTotal).toFixed(1)} GPM</span></div><div className="bdc-demanda-fila"><span className="bdc-demanda-label">Capacidad instalada</span><span className="bdc-demanda-valor bdc-ok">{parseFloat((cloradorManual.cantidad * cloradorManual.equipo.specs.capacidadComercial).toFixed(3))} kg/día</span></div>{cloradorManual.hidraulica && (<div className="bdc-manual-hidraulica-detalle"><div className="bdc-auto-sep" style={{ margin: "0.5rem 0" }} /><div className="bdc-hid-detalle-titulo">Carga hidráulica</div><div className="bdc-auto-fila"><span className="bdc-auto-label">Carga tramos</span><span className="bdc-auto-val">{cloradorManual.hidraulica.cargaTramos} ft</span></div><div className="bdc-auto-fila"><span className="bdc-auto-label">Carga fija</span><span className="bdc-auto-val">{cloradorManual.hidraulica.cargaFija_ft} ft</span></div><div className="bdc-auto-sep" style={{ margin: "0.5rem 0" }} /><div className="bdc-auto-fila bdc-auto-total"><span className="bdc-auto-label">Carga total</span><span className="bdc-auto-val bdc-hid-val-highlight">{cloradorManual.hidraulica.cargaTotal} ft · {cloradorManual.hidraulica.cargaTotalPSI} PSI</span></div></div>)}</>)}</div>)}
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
===================================================== */
function BloqueLamparaUV({ flujoMaxSistema }) {
  const [modoUV,          setModoUV]          = useState("recomendado");
  const [selManualUVId,   setSelManualUVId]   = useState(null);
  const [selManualUVCant, setSelManualUVCant] = useState(1);

  const rec = useMemo(() => {
    if (!flujoMaxSistema || flujoMaxSistema <= 0) return null;
    try { const r = generadorUV(flujoMaxSistema); return r?.error ? null : r; }
    catch { return null; }
  }, [flujoMaxSistema]);

  const uvManual = useMemo(() => {
    if (!selManualUVId || selManualUVCant <= 0) return null;
    const equipo = generadoresUV.find(g => g.id === selManualUVId);
    if (!equipo) return null;
    try { const hidraulica = calcularCargaUVManual(equipo.specs.flujo, selManualUVCant); if (hidraulica?.error) return null; return { equipo, cantidad: selManualUVCant, flujoTotal: equipo.specs.flujo * selManualUVCant, hidraulica }; }
    catch { return null; }
  }, [selManualUVId, selManualUVCant]);

  const infoActiva = useMemo(() => {
    if (modoUV === "manual" && uvManual) return { marca: uvManual.equipo.marca, modelo: uvManual.equipo.modelo, cantidad: uvManual.cantidad, flujoTotal: uvManual.flujoTotal, cargaTotal: uvManual.hidraulica?.cargaTotal, cargaTotalPSI: uvManual.hidraulica?.cargaTotalPSI };
    if (rec) return { marca: rec.seleccion.marca, modelo: rec.seleccion.modelo, cantidad: rec.seleccion.cantidad, flujoTotal: rec.seleccion.flujoTotal, cargaTotal: rec.cargaTotal, cargaTotalPSI: rec.cargaTotalPSI };
    return null;
  }, [modoUV, uvManual, rec]);

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
        Flujo máximo del sistema: <span style={{ color: "#34d399", fontWeight: 600 }}>{parseFloat(flujoMaxSistema).toFixed(1)} GPM</span>
      </div>
      <div className="layout-clima-bdc-fila2" style={{ marginTop: 0 }}>
        <div className="layout-clima-bdc-celda celda-bdc-rec">
          {infoActiva ? (
            <div className={`bdc-recomendada-card bdc-inset ${modoUV === "manual" ? "bdc-card-manual-activa" : ""}`}>
              <div className="bdc-rec-header"><IconoLamparaUV /><div className="bdc-rec-titulo"><span className="bdc-rec-label">{modoUV === "recomendado" ? "Recomendado" : "Manual"}</span><span className="bdc-rec-modelo">{infoActiva.marca} · {infoActiva.modelo}</span></div><span className={`bdc-modo-badge ${modoUV === "manual" ? "badge-manual" : "badge-auto"}`}>{modoUV === "manual" ? "Manual" : "Auto"}</span></div>
              <div className="bdc-rec-stats"><div className="bdc-stat"><span className="bdc-stat-valor">{infoActiva.cantidad}</span><span className="bdc-stat-label">equipos</span></div><div className="bdc-stat-sep" /><div className="bdc-stat"><span className="bdc-stat-valor">{parseFloat(infoActiva.flujoTotal).toFixed(1)}</span><span className="bdc-stat-label">GPM total</span></div><div className="bdc-stat-sep" /><div className="bdc-stat"><span className="bdc-stat-valor">{infoActiva.cargaTotal}</span><span className="bdc-stat-label">ft CDT</span></div><div className="bdc-stat-sep" /><div className="bdc-stat"><span className="bdc-stat-valor">{infoActiva.cargaTotalPSI}</span><span className="bdc-stat-label">PSI</span></div></div>
              {rec && (<div className="bdc-rec-demanda"><div className="bdc-demanda-fila"><span className="bdc-demanda-label">Flujo sistema</span><span className="bdc-demanda-valor">{parseFloat(flujoMaxSistema).toFixed(1)} GPM</span></div><div className="bdc-demanda-fila"><span className="bdc-demanda-label">Flujo instalado</span><span className="bdc-demanda-valor bdc-ok">{infoActiva.flujoTotal} GPM</span></div></div>)}
              {infoActiva.cargaTotal != null && (<div className="bdc-rec-hidraulica"><span className="bdc-hid-label">Carga hidráulica</span><span className="bdc-hid-valor">{infoActiva.cargaTotal} ft · {infoActiva.cargaTotalPSI} PSI</span></div>)}
            </div>
          ) : (
            <div className="bdc-recomendada-card bdc-pendiente bdc-inset"><div className="bdc-rec-header"><IconoLamparaUV /><div className="bdc-rec-titulo"><span className="bdc-rec-label">Lámpara UV</span><span className="bdc-rec-modelo bdc-pendiente-txt">{modoUV === "recomendado" ? "Calculando..." : "Selecciona un equipo"}</span></div></div></div>
          )}
        </div>
        <div className="layout-clima-bdc-celda celda-bdc-manual">
          {modoUV === "recomendado" && rec && (
            <div className="bdc-info-automatica bdc-inset">
              <div className="bdc-manual-header"><span className="bdc-manual-titulo">Detalle de selección automática</span></div>
              <div className="bdc-auto-detalle">
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Marca</span><span className="bdc-auto-val">{rec.seleccion.marca}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Modelo</span><span className="bdc-auto-val">{rec.seleccion.modelo}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Cantidad</span><span className="bdc-auto-val">{rec.seleccion.cantidad} equipo{rec.seleccion.cantidad > 1 ? "s" : ""}</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Flujo por equipo</span><span className="bdc-auto-val">{rec.seleccion.flujoPorEquipo} GPM</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Flujo total</span><span className="bdc-auto-val">{rec.seleccion.flujoTotal} GPM</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Exceso flujo</span><span className="bdc-auto-val">{rec.seleccion.exceso} GPM</span></div>
                <div className="bdc-auto-sep" />
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Carga tramos</span><span className="bdc-auto-val">{rec.cargaTramos} ft</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Carga fija</span><span className="bdc-auto-val">{rec.cargaFija_ft} ft</span></div>
                <div className="bdc-auto-sep" />
                <div className="bdc-auto-fila bdc-auto-total"><span className="bdc-auto-label">Carga total</span><span className="bdc-auto-val bdc-hid-val-highlight">{rec.cargaTotal} ft · {rec.cargaTotalPSI} PSI</span></div>
              </div>
            </div>
          )}
          {modoUV === "manual" && (
            <div className="bdc-selector-manual bdc-inset">
              <div className="bdc-manual-header"><span className="bdc-manual-titulo">Catálogo de lámparas UV</span></div>
              <div className="bdc-manual-lista">
                {generadoresUV.filter(g => g.metadata.activo).map(g => { const esRec = rec && g.marca === rec.seleccion.marca && g.modelo === rec.seleccion.modelo; const sel = selManualUVId === g.id; return (<div key={g.id} className={`bdc-manual-fila ${sel ? "bdc-manual-fila-activa" : ""}`} onClick={() => { setSelManualUVId(sel ? null : g.id); setSelManualUVCant(1); }}><div className="bdc-manual-fila-info"><span className="bdc-manual-marca">{g.marca}</span><span className="bdc-manual-modelo">{g.modelo}</span>{esRec && <span className="bdc-manual-badge-rec">★ Rec.</span>}</div><div className="bdc-manual-fila-cap">{g.specs.flujo} GPM</div></div>); })}
              </div>
              {selManualUVId && (<div className="bdc-manual-resultado"><div className="bdc-manual-cant-row"><span className="bdc-manual-cant-label">Cantidad de equipos</span><div className="bdc-manual-cant-ctrl"><button onClick={() => setSelManualUVCant(c => Math.max(1, c - 1))}>−</button><span>{selManualUVCant}</span><button onClick={() => setSelManualUVCant(c => c + 1)}>+</button></div></div>{uvManual && (<><div className="bdc-demanda-fila"><span className="bdc-demanda-label">Flujo total instalado</span><span className={`bdc-demanda-valor ${uvManual.flujoTotal >= flujoMaxSistema ? "bdc-ok" : "bdc-insuf"}`}>{parseFloat(uvManual.flujoTotal).toFixed(1)} GPM</span></div><div className="bdc-demanda-fila"><span className="bdc-demanda-label">Flujo sistema</span><span className="bdc-demanda-valor">{parseFloat(flujoMaxSistema).toFixed(1)} GPM</span></div>{uvManual.flujoTotal < flujoMaxSistema && (<div className="bdc-manual-aviso">⚠ Flujo insuficiente — agrega más equipos</div>)}{uvManual.hidraulica && (<div className="bdc-manual-hidraulica-detalle"><div className="bdc-auto-sep" style={{ margin: "0.5rem 0" }} /><div className="bdc-hid-detalle-titulo">Carga hidráulica</div><div className="bdc-auto-fila"><span className="bdc-auto-label">Carga tramos</span><span className="bdc-auto-val">{uvManual.hidraulica.cargaTramos} ft</span></div><div className="bdc-auto-fila"><span className="bdc-auto-label">Carga fija</span><span className="bdc-auto-val">{uvManual.hidraulica.cargaFija_ft} ft</span></div><div className="bdc-auto-sep" style={{ margin: "0.5rem 0" }} /><div className="bdc-auto-fila bdc-auto-total"><span className="bdc-auto-label">Carga total</span><span className="bdc-auto-val bdc-hid-val-highlight">{uvManual.hidraulica.cargaTotal} ft · {uvManual.hidraulica.cargaTotalPSI} PSI</span></div></div>)}</>)}</div>)}
              {!selManualUVId && <div className="bdc-manual-hint">Selecciona un equipo del catálogo</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   EQUIPAMIENTO — componente principal
===================================================== */
export default function Equipamiento({
  setSeccion, sistemaActivo, datosPorSistema,
  setDatosPorSistema, configBombas, resultadoClorador,
  flujoMaxGlobal,
}) {
  const [hoveredField,                setHoveredField]                = useState(null);
  const [sistemasSeleccionadosSanit, setSistemasSeleccionadosSanit] = useState({});
  const [sistemasSeleccionadosFilt,  setSistemasSeleccionadosFilt]  = useState({});

  // Cargas individuales de cada bloque — se actualizan via callbacks
  const [cargas, setCargas] = useState({});

  const setCarga = (key, valor) => {
    setCargas(prev => {
      if (prev[key] === valor) return prev;
      const next = { ...prev, [key]: valor };
      // Persistir en datosPorSistema.equipamiento para que App.jsx lo lea
      setDatosPorSistema(ps => ({ ...ps, equipamiento: { ...(ps.equipamiento ?? {}), cargas: next } }));
      return next;
    });
  };

  const toggleSanitizacion = (key) => setSistemasSeleccionadosSanit(prev => { if (prev[key]) { const n = { ...prev }; delete n[key]; return n; } return { ...prev, [key]: true }; });
  const toggleFiltracion    = (key) => setSistemasSeleccionadosFilt(prev  => { if (prev[key]) { const n = { ...prev }; delete n[key]; return n; } return { ...prev, [key]: true }; });

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

  const hayCalentamiento = equiposCalentamiento.length > 0;

  // ── Datos para funciones de empotrables ──
  // Usamos el primer cuerpo del sistema activo como referencia para datos físicos
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

  // ── Tipo de desborde → determina desnatadores vs dren canal ──
  // infinity, canal o ambos → dren canal en lugar de desnatadores
  const tieneDesbordeCanal = useMemo(() => {
    const d = datosDim?.desborde;
    return d === "infinity" || d === "canal" || d === "ambos";
  }, [datosDim?.desborde]);

  // ── Cálculos recomendados — empotrables ──
  const recRetorno    = useMemo(() => datosEmpotrable ? recomendarRetorno(flujoMaxGlobal, datosEmpotrable)    : null, [flujoMaxGlobal, datosEmpotrable]);
  const recDesnatador = useMemo(() => datosEmpotrable ? recomendarDesnatador(flujoMaxGlobal, datosEmpotrable) : null, [flujoMaxGlobal, datosEmpotrable]);
  const recBarredora  = useMemo(() => datosEmpotrable ? recomendarBarredora(flujoMaxGlobal, datosEmpotrable)  : null, [flujoMaxGlobal, datosEmpotrable]);
  const recDrenFondo  = useMemo(() => datosEmpotrable ? recomendarDrenFondo(flujoMaxGlobal, datosEmpotrable)  : null, [flujoMaxGlobal, datosEmpotrable]);
  const recDrenCanal  = useMemo(() => datosEmpotrable ? recomendarDrenCanal(flujoMaxGlobal, datosEmpotrable)  : null, [flujoMaxGlobal, datosEmpotrable]);

  const descripcionesCampos = {
    calentamiento: "Sistema encargado del aporte energético térmico",
    sanitizacion:  "Sistema de desinfección y control microbiológico del agua",
    empotrables:   "Elementos hidráulicos instalados en las paredes y fondo del cuerpo de agua",
    filtracion:    "Sistema de filtración y acondicionamiento del agua",
    default:       "Configuración integral del equipamiento del sistema",
  };

  return (
    <div className="form-section hero-wrapper equipamiento">
      <div className="selector-tecnico modo-experto">

        <div className="selector-header">
          <div className="selector-titulo">Equipamiento del sistema</div>
          <div className="selector-subtitulo-tecnico">Selección técnica de equipos y sistemas</div>
        </div>

        <div className="selector-acciones">
          <button className="btn-secundario" onClick={() => setSeccion("calentamiento")}>
            ← Volver a Calentamiento
          </button>
        </div>

        <div className="selector-contenido entrada">

          {/* ══ CALENTAMIENTO solo lectura ══ */}
          {hayCalentamiento && (
            <div className="selector-grupo" style={{ marginBottom: "1rem" }}>
              <div className="selector-subtitulo">🔥 Calentamiento</div>
              <div className="selector-subtitulo-hint" style={{ marginBottom: "0.75rem" }}>
                Configurado en Calentamiento · solo lectura
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {equiposCalentamiento.map(eq => (
                  <TarjetaCalentamientoReadonly
                    key={eq.key}
                    icono={eq.icono} label={eq.label} modo={eq.modo}
                    marca={eq.marca} modelo={eq.modelo} cantidad={eq.cantidad}
                    flujoTotal={eq.flujoTotal} cargaTotal={eq.cargaTotal} cargaTotalPSI={eq.cargaTotalPSI}
                  />
                ))}
              </div>
              <div style={{ textAlign: "right", marginTop: "0.6rem" }}>
                <button className="btn-secundario" style={{ fontSize: "0.72rem", padding: "0.3rem 0.8rem" }}
                  onClick={() => setSeccion("calentamiento")}>
                  Editar en Calentamiento →
                </button>
              </div>
            </div>
          )}

          {/* ══ EMPOTRABLES — siempre visibles ══ */}
          <div
            className="selector-grupo"
            style={{ marginBottom: "1rem" }}
            onMouseEnter={() => setHoveredField("empotrables")}
            onMouseLeave={() => setHoveredField(null)}
          >
            <div className="selector-subtitulo">
              💧 Empotrables
              <span className="selector-subtitulo-hint">Elementos hidráulicos del sistema</span>
            </div>

            <div className="sistemas-detalle-wrapper">

              {/* Retornos — siempre */}
              <div className="sistema-detalle-card">
                <div className="sistema-detalle-header">
                  <span className="sistema-detalle-icon-svg"><IconoRetorno /></span>
                  <span className="sistema-detalle-titulo">Retornos</span>
                </div>
                <BloqueEmpotrable
                  icono={<IconoRetorno />}
                  titulo="Retornos"
                  rec={recRetorno}
                  catalogo={retornos}
                  flujoMaximo={flujoMaxGlobal}
                  datos={datosEmpotrable}
                  fnCalculo={(flujo, tipo, dat, num) => retorno(flujo, tipo, dat, num)}
                  onCargaChange={(v) => setCarga("retorno", v)}
                  mostrarPuerto
                />
              </div>

              {/* Desnatadores — solo si NO hay infinity, canal o ambos */}
              {!tieneDesbordeCanal && (
                <div className="sistema-detalle-card">
                  <div className="sistema-detalle-header">
                    <span className="sistema-detalle-icon-svg"><IconoDesnatador /></span>
                    <span className="sistema-detalle-titulo">Desnatadores</span>
                  </div>
                  <BloqueEmpotrable
                    icono={<IconoDesnatador />}
                    titulo="Desnatadores"
                    rec={recDesnatador}
                    catalogo={desnatadores}
                    flujoMaximo={flujoMaxGlobal}
                    datos={datosEmpotrable}
                    fnCalculo={(flujo, tipo, dat, num) => desnatador(flujo, tipo, dat, num)}
                    onCargaChange={(v) => setCarga("desnatador", v)}
                    mostrarPuerto
                  />
                </div>
              )}

              {/* Barredoras — siempre */}
              <div className="sistema-detalle-card">
                <div className="sistema-detalle-header">
                  <span className="sistema-detalle-icon-svg"><IconoBarredora /></span>
                  <span className="sistema-detalle-titulo">Barredoras</span>
                </div>
                <BloqueEmpotrable
                  icono={<IconoBarredora />}
                  titulo="Barredoras"
                  rec={recBarredora}
                  catalogo={barredoras}
                  flujoMaximo={flujoMaxGlobal}
                  datos={datosEmpotrable}
                  fnCalculo={(flujo, tipo, dat, num) => barredora(flujo, tipo, dat, num)}
                  onCargaChange={(v) => setCarga("barredora", v)}
                  mostrarPuerto
                />
              </div>

              {/* Drenes de fondo — siempre */}
              <div className="sistema-detalle-card">
                <div className="sistema-detalle-header">
                  <span className="sistema-detalle-icon-svg"><IconoDrenFondo /></span>
                  <span className="sistema-detalle-titulo">Drenes de fondo</span>
                </div>
                <BloqueEmpotrable
                  icono={<IconoDrenFondo />}
                  titulo="Drenes de fondo"
                  rec={recDrenFondo}
                  catalogo={drenesFondo}
                  flujoMaximo={flujoMaxGlobal}
                  datos={datosEmpotrable}
                  fnCalculo={(flujo, tipo, dat, num) => drenFondo(flujo, tipo, dat, num)}
                  onCargaChange={(v) => setCarga("drenFondo", v)}
                  mostrarPuerto
                  mostrarTamano
                />
              </div>

              {/* Drenes de canal — solo si hay infinity, canal o ambos */}
              {tieneDesbordeCanal && (
                <div className="sistema-detalle-card">
                  <div className="sistema-detalle-header">
                    <span className="sistema-detalle-icon-svg"><IconoDrenCanal /></span>
                    <span className="sistema-detalle-titulo">Drenes de canal</span>
                  </div>
                  <BloqueEmpotrable
                    icono={<IconoDrenCanal />}
                    titulo="Drenes de canal"
                    rec={recDrenCanal}
                    catalogo={drenesCanal}
                    flujoMaximo={flujoMaxGlobal}
                    datos={datosEmpotrable}
                    fnCalculo={(flujo, tipo, dat, num) => drenCanal(flujo, tipo, dat, num)}
                    onCargaChange={(v) => setCarga("drenCanal", v)}
                    mostrarPuerto
                    mostrarTamano
                  />
                </div>
              )}

            </div>
          </div>

          {/* ══ SANITIZACIÓN editable ══ */}
          <div
            className="selector-grupo"
            onMouseEnter={() => setHoveredField("sanitizacion")}
            onMouseLeave={() => setHoveredField(null)}
          >
            <div className="selector-subtitulo">
              🧪 Sanitización
              <span className="selector-subtitulo-hint">Selecciona uno o más sistemas</span>
            </div>

            <div className="sistemas-calentamiento-grid">
              {SISTEMAS_SANITIZACION.map(({ key, label, Icon }) => {
                const activo = !!sistemasSeleccionadosSanit[key];
                return (
                  <div key={key} className={`sistema-cal-card ${activo ? "activo" : ""}`}
                    onClick={() => toggleSanitizacion(key)}>
                    <div className="sistema-cal-icon"><Icon /></div>
                    <div className="sistema-cal-label">{label}</div>
                    <div className={`sistema-cal-check ${activo ? "checked" : ""}`}>{activo ? "✓" : ""}</div>
                  </div>
                );
              })}
            </div>

            {Object.keys(sistemasSeleccionadosSanit).length > 0 && (
              <div className="sistemas-detalle-wrapper">

                {sistemasSeleccionadosSanit.cloradorSalino && (
                  <div className="sistema-detalle-card">
                    <div className="sistema-detalle-header">
                      <span className="sistema-detalle-icon-svg"><IconoCloradorSalino /></span>
                      <span className="sistema-detalle-titulo">Generador de cloro salino</span>
                    </div>
                    <BloqueCloradorSalino resultadoClorador={resultadoClorador} />
                  </div>
                )}

                {sistemasSeleccionadosSanit.cloradorAutomatico && (
                  <div className="sistema-detalle-card">
                    <div className="sistema-detalle-header">
                      <span className="sistema-detalle-icon-svg"><IconoCloradorAutomatico /></span>
                      <span className="sistema-detalle-titulo">Clorador automático</span>
                    </div>
                    <BloqueCloradorAutomatico
                      volumenLitros={volumenLitros}
                      usoGeneral={usoGeneral}
                      areaM2={areaM2}
                      volumenM3={volM3}
                      tempC={tempC}
                    />
                  </div>
                )}

                {sistemasSeleccionadosSanit.lamparaUV && (
                  <div className="sistema-detalle-card">
                    <div className="sistema-detalle-header">
                      <span className="sistema-detalle-icon-svg"><IconoLamparaUV /></span>
                      <span className="sistema-detalle-titulo">Lámpara UV</span>
                    </div>
                    <BloqueLamparaUV flujoMaxSistema={flujoMaxGlobal} />
                  </div>
                )}

              </div>
            )}
          </div>


          {/* ══ FILTRACIÓN ══ */}
          <div
            className="selector-grupo"
            onMouseEnter={() => setHoveredField("filtracion")}
            onMouseLeave={() => setHoveredField(null)}
          >
            <div className="selector-subtitulo">
              🧹 Filtración
              <span className="selector-subtitulo-hint">Selecciona uno o más sistemas de filtración</span>
            </div>

            <div className="sistemas-calentamiento-grid">
              {SISTEMAS_FILTRACION.map(({ key, label, Icon }) => {
                const activo = !!sistemasSeleccionadosFilt[key];
                return (
                  <div key={key} className={`sistema-cal-card ${activo ? "activo" : ""}`}
                    onClick={() => toggleFiltracion(key)}>
                    <div className="sistema-cal-icon"><Icon /></div>
                    <div className="sistema-cal-label">{label}</div>
                    <div className={`sistema-cal-check ${activo ? "checked" : ""}`}>{activo ? "✓" : ""}</div>
                  </div>
                );
              })}
            </div>

            {Object.keys(sistemasSeleccionadosFilt).length > 0 && (
              <div className="sistemas-detalle-wrapper">

                {sistemasSeleccionadosFilt.filtroArena && (
                  <div className="sistema-detalle-card">
                    <div className="sistema-detalle-header">
                      <span className="sistema-detalle-icon-svg"><IconoFiltroArena /></span>
                      <span className="sistema-detalle-titulo">Filtro de arena</span>
                    </div>
                    <BloqueFiltroArena flujoMaximo={flujoMaxGlobal} onCargaChange={(v) => setCarga("filtroArena", v)} />
                  </div>
                )}

                {sistemasSeleccionadosFilt.prefiltro && (
                  <div className="sistema-detalle-card">
                    <div className="sistema-detalle-header">
                      <span className="sistema-detalle-icon-svg"><IconoPrefiltro /></span>
                      <span className="sistema-detalle-titulo">Prefiltro</span>
                    </div>
                    <BloquePrefiltro flujoMaximo={flujoMaxGlobal} onCargaChange={(v) => setCarga("prefiltro", v)} />
                  </div>
                )}

                {sistemasSeleccionadosFilt.filtroCartucho && (
                  <div className="sistema-detalle-card">
                    <div className="sistema-detalle-header">
                      <span className="sistema-detalle-icon-svg"><IconoFiltroCartucho /></span>
                      <span className="sistema-detalle-titulo">Filtro de cartucho</span>
                    </div>
                    <BloqueFiltroCartucho flujoMaximo={flujoMaxGlobal} usoGeneral={usoGeneral} onCargaChange={(v) => setCarga("filtroCartucho", v)} />
                  </div>
                )}

              </div>
            )}
          </div>

        </div>

        <div className="selector-footer fijo equipamiento">
          <span>Modo ingeniería · Equipamiento</span>
          <span className="footer-highlight">
            {hoveredField ? (descripcionesCampos[hoveredField] ?? descripcionesCampos.default) : descripcionesCampos.default}
          </span>
        </div>

      </div>
    </div>
  );
}