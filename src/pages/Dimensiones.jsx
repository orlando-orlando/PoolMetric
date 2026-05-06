import { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import "../estilos.css";
import CalculadorAreaModal from "../components/CalculadorAreaModal";

/* =====================================================
   ICONOS SVG
===================================================== */
const IconoAlberca = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <rect x="5" y="10" width="38" height="28" rx="3" stroke="#38bdf8" strokeWidth="1.5" fill="rgba(56,189,248,0.08)"/>
    <line x1="5" y1="24" x2="43" y2="24" stroke="#7dd3fc" strokeWidth="0.8" strokeDasharray="3 2" opacity="0.6"/>
    <rect x="5" y="32" width="5" height="6" rx="1" stroke="#7dd3fc" strokeWidth="1" fill="rgba(125,211,252,0.12)"/>
    <line x1="7.5" y1="32" x2="7.5" y2="38" stroke="#7dd3fc" strokeWidth="0.7" opacity="0.5"/>
    <rect x="38" y="32" width="5" height="6" rx="1" stroke="#7dd3fc" strokeWidth="1" fill="rgba(125,211,252,0.12)"/>
    <line x1="40.5" y1="32" x2="40.5" y2="38" stroke="#7dd3fc" strokeWidth="0.7" opacity="0.5"/>
    <rect x="19" y="8" width="10" height="3" rx="1" stroke="#38bdf8" strokeWidth="1" fill="rgba(56,189,248,0.15)"/>
    <path d="M12 18 Q16 16 20 18 Q24 20 28 18 Q32 16 36 18" stroke="#38bdf8" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.5"/>
    <path d="M12 28 Q16 26 20 28 Q24 30 28 28 Q32 26 36 28" stroke="#38bdf8" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.35"/>
  </svg>
);
const IconoJacuzzi = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <polygon points="17,8 31,8 40,17 40,31 31,40 17,40 8,31 8,17" stroke="#38bdf8" strokeWidth="1.5" fill="rgba(56,189,248,0.08)"/>
    <circle cx="24" cy="11" r="2" fill="rgba(125,211,252,0.3)" stroke="#7dd3fc" strokeWidth="1"/>
    <circle cx="24" cy="37" r="2" fill="rgba(125,211,252,0.3)" stroke="#7dd3fc" strokeWidth="1"/>
    <circle cx="11" cy="24" r="2" fill="rgba(125,211,252,0.3)" stroke="#7dd3fc" strokeWidth="1"/>
    <circle cx="37" cy="24" r="2" fill="rgba(125,211,252,0.3)" stroke="#7dd3fc" strokeWidth="1"/>
    <circle cx="20" cy="22" r="1.5" fill="none" stroke="#7dd3fc" strokeWidth="0.8" opacity="0.6"/>
    <circle cx="28" cy="26" r="1"   fill="none" stroke="#7dd3fc" strokeWidth="0.8" opacity="0.5"/>
    <circle cx="24" cy="20" r="1"   fill="none" stroke="#7dd3fc" strokeWidth="0.8" opacity="0.4"/>
    <circle cx="18" cy="28" r="1.2" fill="none" stroke="#7dd3fc" strokeWidth="0.8" opacity="0.5"/>
    <circle cx="30" cy="20" r="0.8" fill="none" stroke="#7dd3fc" strokeWidth="0.7" opacity="0.4"/>
    <polygon points="19,13 29,13 36,20 36,28 29,35 19,35 12,28 12,20" stroke="#7dd3fc" strokeWidth="0.7" fill="none" strokeDasharray="2 2" opacity="0.4"/>
  </svg>
);
const IconoChapoteadero = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <ellipse cx="24" cy="30" rx="19" ry="12" stroke="#38bdf8" strokeWidth="1.5" fill="rgba(56,189,248,0.08)"/>
    <ellipse cx="24" cy="30" rx="13" ry="7" stroke="#7dd3fc" strokeWidth="0.8" fill="none" strokeDasharray="2 2" opacity="0.5"/>
    <path d="M13 30 Q13 38 24 38 Q35 38 35 30" stroke="#7dd3fc" strokeWidth="1" fill="rgba(125,211,252,0.06)" strokeLinecap="round"/>
    <circle cx="24" cy="13" r="4" stroke="#fbbf24" strokeWidth="1.2" fill="rgba(251,191,36,0.15)"/>
    <line x1="24" y1="7"  x2="24" y2="5"  stroke="#fbbf24" strokeWidth="1" strokeLinecap="round"/>
    <line x1="24" y1="19" x2="24" y2="21" stroke="#fbbf24" strokeWidth="1" strokeLinecap="round"/>
    <line x1="18" y1="9"  x2="16.5" y2="7.5" stroke="#fbbf24" strokeWidth="1" strokeLinecap="round"/>
    <line x1="30" y1="17" x2="31.5" y2="18.5" stroke="#fbbf24" strokeWidth="1" strokeLinecap="round"/>
    <line x1="18" y1="17" x2="16.5" y2="18.5" stroke="#fbbf24" strokeWidth="1" strokeLinecap="round"/>
    <line x1="30" y1="9"  x2="31.5" y2="7.5" stroke="#fbbf24" strokeWidth="1" strokeLinecap="round"/>
    <line x1="30" y1="13" x2="32" y2="13" stroke="#fbbf24" strokeWidth="1" strokeLinecap="round"/>
    <line x1="16" y1="13" x2="18" y2="13" stroke="#fbbf24" strokeWidth="1" strokeLinecap="round"/>
  </svg>
);
const IconoEspejoAgua = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <rect x="6" y="34" width="36" height="5" rx="1.5" stroke="#7dd3fc" strokeWidth="1" fill="rgba(125,211,252,0.06)"/>
    <rect x="6" y="30" width="36" height="4" rx="1" stroke="#38bdf8" strokeWidth="1.5" fill="rgba(56,189,248,0.15)"/>
    <line x1="8"  y1="31.5" x2="40" y2="31.5" stroke="#bae6fd" strokeWidth="0.6" opacity="0.5"/>
    <line x1="8"  y1="33"   x2="40" y2="33"   stroke="#bae6fd" strokeWidth="0.4" opacity="0.3"/>
    <path d="M6 30 L6 26 Q6 24 8 24" stroke="#38bdf8" strokeWidth="1" fill="none" strokeLinecap="round"/>
    <path d="M42 30 L42 26 Q42 24 40 24" stroke="#38bdf8" strokeWidth="1" fill="none" strokeLinecap="round"/>
    <line x1="6"  y1="26" x2="6"  y2="34" stroke="#7dd3fc" strokeWidth="0.7" strokeDasharray="1.5 1.5" opacity="0.4"/>
    <line x1="42" y1="26" x2="42" y2="34" stroke="#7dd3fc" strokeWidth="0.7" strokeDasharray="1.5 1.5" opacity="0.4"/>
    <path d="M20 30 L20 22 M20 22 Q22 18 24 22 Q22 19 26 22 M20 25 Q23 23 26 25" stroke="#7dd3fc" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.35"/>
    <path d="M30 30 L30 24 M30 24 Q31 21 33 24" stroke="#7dd3fc" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.25"/>
    <line x1="4" y1="30" x2="44" y2="30" stroke="#38bdf8" strokeWidth="0.8" opacity="0.4"/>
  </svg>
);
const IconoAlbercaJacuzzi = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <rect x="3" y="12" width="27" height="26" rx="2.5" stroke="#38bdf8" strokeWidth="1.5" fill="rgba(56,189,248,0.08)"/>
    <line x1="3" y1="25" x2="30" y2="25" stroke="#7dd3fc" strokeWidth="0.7" strokeDasharray="2 2" opacity="0.5"/>
    <path d="M8 19 Q12 17 16 19 Q20 21 24 19" stroke="#38bdf8" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.5"/>
    <rect x="3" y="32" width="4" height="6" rx="1" stroke="#7dd3fc" strokeWidth="0.9" fill="rgba(125,211,252,0.1)"/>
    <polygon points="36,10 43,10 47,14 47,22 43,26 36,26 32,22 32,14" stroke="#7dd3fc" strokeWidth="1.5" fill="rgba(125,211,252,0.08)"/>
    <circle cx="39.5" cy="12" r="1.2" fill="rgba(125,211,252,0.3)" stroke="#7dd3fc" strokeWidth="0.8"/>
    <circle cx="39.5" cy="24" r="1.2" fill="rgba(125,211,252,0.3)" stroke="#7dd3fc" strokeWidth="0.8"/>
    <circle cx="33.5" cy="18" r="1.2" fill="rgba(125,211,252,0.3)" stroke="#7dd3fc" strokeWidth="0.8"/>
    <circle cx="39.5" cy="18" r="1.5" fill="none" stroke="#7dd3fc" strokeWidth="0.7" opacity="0.5"/>
    <circle cx="37"   cy="20" r="0.9" fill="none" stroke="#7dd3fc" strokeWidth="0.6" opacity="0.4"/>
    <line x1="30" y1="18" x2="32" y2="18" stroke="#38bdf8" strokeWidth="1" strokeDasharray="1.5 1" opacity="0.6"/>
  </svg>
);
const IconoAlbercaChapo = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <rect x="3" y="10" width="26" height="28" rx="2.5" stroke="#38bdf8" strokeWidth="1.5" fill="rgba(56,189,248,0.08)"/>
    <line x1="3" y1="24" x2="29" y2="24" stroke="#7dd3fc" strokeWidth="0.7" strokeDasharray="2 2" opacity="0.5"/>
    <path d="M8 17 Q12 15 16 17 Q20 19 24 17" stroke="#38bdf8" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.5"/>
    <rect x="3" y="32" width="4" height="6" rx="1" stroke="#7dd3fc" strokeWidth="0.9" fill="rgba(125,211,252,0.1)"/>
    <ellipse cx="39" cy="31" rx="8" ry="6" stroke="#7dd3fc" strokeWidth="1.5" fill="rgba(125,211,252,0.08)"/>
    <ellipse cx="39" cy="31" rx="5" ry="3.5" stroke="#7dd3fc" strokeWidth="0.7" fill="none" strokeDasharray="1.5 1.5" opacity="0.4"/>
    <circle cx="39" cy="18" r="3" stroke="#fbbf24" strokeWidth="1" fill="rgba(251,191,36,0.12)"/>
    <line x1="39" y1="13" x2="39" y2="11.5" stroke="#fbbf24" strokeWidth="0.9" strokeLinecap="round"/>
    <line x1="43" y1="15" x2="44.2" y2="13.8" stroke="#fbbf24" strokeWidth="0.9" strokeLinecap="round"/>
    <line x1="44" y1="19" x2="45.5" y2="19" stroke="#fbbf24" strokeWidth="0.9" strokeLinecap="round"/>
    <line x1="29" y1="30" x2="31" y2="30" stroke="#38bdf8" strokeWidth="1" strokeDasharray="1.5 1" opacity="0.6"/>
  </svg>
);
const IconoAlbercaJacuzziJacuzzi = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <rect x="3" y="14" width="24" height="24" rx="2.5" stroke="#38bdf8" strokeWidth="1.5" fill="rgba(56,189,248,0.08)"/>
    <line x1="3" y1="26" x2="27" y2="26" stroke="#7dd3fc" strokeWidth="0.7" strokeDasharray="2 2" opacity="0.4"/>
    <path d="M7 20 Q12 18 17 20 Q21 22 23 20" stroke="#38bdf8" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.45"/>
    <rect x="3" y="32" width="3.5" height="6" rx="1" stroke="#7dd3fc" strokeWidth="0.8" fill="rgba(125,211,252,0.1)"/>
    <polygon points="33,8 40,8 44,12 44,19 40,23 33,23 29,19 29,12" stroke="#7dd3fc" strokeWidth="1.3" fill="rgba(125,211,252,0.08)"/>
    <circle cx="36.5" cy="10" r="1.1" fill="rgba(125,211,252,0.3)" stroke="#7dd3fc" strokeWidth="0.7"/>
    <circle cx="36.5" cy="21" r="1.1" fill="rgba(125,211,252,0.3)" stroke="#7dd3fc" strokeWidth="0.7"/>
    <circle cx="36.5" cy="15.5" r="1.3" fill="none" stroke="#7dd3fc" strokeWidth="0.7" opacity="0.45"/>
    <polygon points="33,27 40,27 44,31 44,38 40,42 33,42 29,38 29,31" stroke="#a78bfa" strokeWidth="1.3" fill="rgba(167,139,250,0.08)"/>
    <circle cx="36.5" cy="29" r="1.1" fill="rgba(167,139,250,0.3)" stroke="#a78bfa" strokeWidth="0.7"/>
    <circle cx="36.5" cy="40" r="1.1" fill="rgba(167,139,250,0.3)" stroke="#a78bfa" strokeWidth="0.7"/>
    <circle cx="36.5" cy="34.5" r="1.3" fill="none" stroke="#a78bfa" strokeWidth="0.7" opacity="0.45"/>
    <line x1="27" y1="15" x2="29" y2="15" stroke="#38bdf8" strokeWidth="0.9" strokeDasharray="1.5 1" opacity="0.5"/>
    <line x1="27" y1="34" x2="29" y2="34" stroke="#38bdf8" strokeWidth="0.9" strokeDasharray="1.5 1" opacity="0.5"/>
  </svg>
);
const IconoAlbercaChapoAsoleadero = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <rect x="3" y="14" width="22" height="22" rx="2.5" stroke="#38bdf8" strokeWidth="1.5" fill="rgba(56,189,248,0.08)"/>
    <line x1="3" y1="25" x2="25" y2="25" stroke="#7dd3fc" strokeWidth="0.7" strokeDasharray="2 2" opacity="0.4"/>
    <path d="M7 19 Q11 17 15 19 Q19 21 22 19" stroke="#38bdf8" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.45"/>
    <rect x="3" y="30" width="3" height="6" rx="1" stroke="#7dd3fc" strokeWidth="0.8" fill="rgba(125,211,252,0.1)"/>
    <ellipse cx="36" cy="13" rx="9" ry="6" stroke="#7dd3fc" strokeWidth="1.3" fill="rgba(125,211,252,0.08)"/>
    <ellipse cx="36" cy="13" rx="5.5" ry="3.5" stroke="#7dd3fc" strokeWidth="0.6" fill="none" strokeDasharray="1.5 1.5" opacity="0.35"/>
    <circle cx="43" cy="7" r="2.2" stroke="#fbbf24" strokeWidth="0.9" fill="rgba(251,191,36,0.12)"/>
    <rect x="28" y="24" width="17" height="16" rx="2" stroke="#fbbf24" strokeWidth="1.3" fill="rgba(251,191,36,0.06)"/>
    <line x1="28" y1="30" x2="45" y2="30" stroke="#fbbf24" strokeWidth="0.6" opacity="0.35"/>
    <line x1="28" y1="36" x2="45" y2="36" stroke="#fbbf24" strokeWidth="0.6" opacity="0.35"/>
    <line x1="35" y1="24" x2="35" y2="40" stroke="#fbbf24" strokeWidth="0.6" opacity="0.35"/>
    <line x1="25" y1="15" x2="27" y2="15" stroke="#38bdf8" strokeWidth="0.9" strokeDasharray="1.5 1" opacity="0.5"/>
    <line x1="25" y1="30" x2="28" y2="30" stroke="#38bdf8" strokeWidth="0.9" strokeDasharray="1.5 1" opacity="0.5"/>
  </svg>
);
const IconoAlbercaJacuzziChapo = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <rect x="3" y="14" width="22" height="22" rx="2.5" stroke="#38bdf8" strokeWidth="1.5" fill="rgba(56,189,248,0.08)"/>
    <line x1="3" y1="25" x2="25" y2="25" stroke="#7dd3fc" strokeWidth="0.7" strokeDasharray="2 2" opacity="0.4"/>
    <path d="M7 19 Q11 17 15 19 Q19 21 22 19" stroke="#38bdf8" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.45"/>
    <rect x="3" y="30" width="3" height="6" rx="1" stroke="#7dd3fc" strokeWidth="0.8" fill="rgba(125,211,252,0.1)"/>
    <polygon points="32,8 39,8 43,12 43,20 39,24 32,24 28,20 28,12" stroke="#7dd3fc" strokeWidth="1.3" fill="rgba(125,211,252,0.08)"/>
    <circle cx="35.5" cy="10.5" r="1.1" fill="rgba(125,211,252,0.3)" stroke="#7dd3fc" strokeWidth="0.7"/>
    <circle cx="35.5" cy="21.5" r="1.1" fill="rgba(125,211,252,0.3)" stroke="#7dd3fc" strokeWidth="0.7"/>
    <circle cx="35.5" cy="16" r="1.3" fill="none" stroke="#7dd3fc" strokeWidth="0.7" opacity="0.45"/>
    <ellipse cx="36" cy="34" rx="9" ry="6" stroke="#a78bfa" strokeWidth="1.3" fill="rgba(167,139,250,0.07)"/>
    <ellipse cx="36" cy="34" rx="5.5" ry="3.5" stroke="#a78bfa" strokeWidth="0.6" fill="none" strokeDasharray="1.5 1.5" opacity="0.35"/>
    <circle cx="43" cy="27" r="2" stroke="#fbbf24" strokeWidth="0.9" fill="rgba(251,191,36,0.12)"/>
    <line x1="25" y1="16" x2="28" y2="16" stroke="#38bdf8" strokeWidth="0.9" strokeDasharray="1.5 1" opacity="0.5"/>
    <line x1="25" y1="33" x2="27" y2="33" stroke="#38bdf8" strokeWidth="0.9" strokeDasharray="1.5 1" opacity="0.5"/>
  </svg>
);
const IconoAlbercaAsoleaderoAsoleadero = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <rect x="3" y="14" width="22" height="22" rx="2.5" stroke="#38bdf8" strokeWidth="1.5" fill="rgba(56,189,248,0.08)"/>
    <line x1="3" y1="25" x2="25" y2="25" stroke="#7dd3fc" strokeWidth="0.7" strokeDasharray="2 2" opacity="0.4"/>
    <path d="M7 19 Q11 17 15 19 Q19 21 22 19" stroke="#38bdf8" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.45"/>
    <rect x="3" y="30" width="3" height="6" rx="1" stroke="#7dd3fc" strokeWidth="0.8" fill="rgba(125,211,252,0.1)"/>
    <rect x="28" y="10" width="17" height="13" rx="2" stroke="#fbbf24" strokeWidth="1.3" fill="rgba(251,191,36,0.06)"/>
    <line x1="28" y1="16" x2="45" y2="16" stroke="#fbbf24" strokeWidth="0.6" opacity="0.35"/>
    <line x1="36" y1="10" x2="36" y2="23" stroke="#fbbf24" strokeWidth="0.6" opacity="0.35"/>
    <circle cx="40" cy="13" r="2.5" stroke="#fbbf24" strokeWidth="0.8" fill="rgba(251,191,36,0.1)"/>
    <line x1="40" y1="15.5" x2="40" y2="19" stroke="#fbbf24" strokeWidth="0.7" strokeLinecap="round" opacity="0.5"/>
    <rect x="28" y="27" width="17" height="13" rx="2" stroke="#fbbf24" strokeWidth="1.3" fill="rgba(251,191,36,0.06)"/>
    <line x1="28" y1="33" x2="45" y2="33" stroke="#fbbf24" strokeWidth="0.6" opacity="0.35"/>
    <line x1="36" y1="27" x2="36" y2="40" stroke="#fbbf24" strokeWidth="0.6" opacity="0.35"/>
    <circle cx="40" cy="30" r="2.5" stroke="#fbbf24" strokeWidth="0.8" fill="rgba(251,191,36,0.1)"/>
    <line x1="40" y1="32.5" x2="40" y2="36" stroke="#fbbf24" strokeWidth="0.7" strokeLinecap="round" opacity="0.5"/>
    <line x1="25" y1="17" x2="28" y2="17" stroke="#38bdf8" strokeWidth="0.9" strokeDasharray="1.5 1" opacity="0.5"/>
    <line x1="25" y1="33" x2="28" y2="33" stroke="#38bdf8" strokeWidth="0.9" strokeDasharray="1.5 1" opacity="0.5"/>
  </svg>
);

const ICONOS_SISTEMA = {
  alberca:                     <IconoAlberca />,
  jacuzzi:                     <IconoJacuzzi />,
  chapoteadero:                <IconoChapoteadero />,
  espejoAgua:                  <IconoEspejoAgua />,
  albercaJacuzzi1:             <IconoAlbercaJacuzzi />,
  albercaChapo1:               <IconoAlbercaChapo />,
  albercaJacuzziJacuzzi:       <IconoAlbercaJacuzziJacuzzi />,
  albercaChapoAsoleadero:      <IconoAlbercaChapoAsoleadero />,
  albercaJacuzziChapo:         <IconoAlbercaJacuzziChapo />,
  albercaAsoleaderoAsoleadero: <IconoAlbercaAsoleaderoAsoleadero />,
};

/* =====================================================
   LÍMITES POR TIPO DE CUERPO
===================================================== */
const LIMITES = {
  alberca:      { area: [2, 3000], profMin: [0.1, 3.5], profMax: [0.1, 3.5] },
  jacuzzi:      { area: [2, 50  ], profMin: [0.1, 3.5], profMax: [0.1, 3.5] },
  chapoteadero: { area: [2, 500 ], profMin: [0.1, 3.5], profMax: [0.1, 3.5] },
  asoleadero:   { area: [2, 500 ], profMin: [0.1, 3.5], profMax: [0.1, 3.5] },
  espejoAgua:   { area: [2, 200 ], profMin: [0.1, 3.5], profMax: [0.1, 3.5] },
};
const LIMITES_DIST    = [1,   150];
const LIMITES_INFINITY = [0.5, 100];
const LIMITES_CORTINA  = [2,   10 ];
const LIMITES_CANAL    = [0.5, 300];

/* Clamp + mensaje de aviso */
function clampVal(val, min, max) {
  const n = parseFloat(val);
  if (isNaN(n)) return { valor: val, aviso: null };
  if (n < min) return { valor: String(min), aviso: `Mínimo ${min}` };
  if (n > max) return { valor: String(max), aviso: `Máximo ${max}` };
  return { valor: val, aviso: null };
}

/* Input numérico con límites — muestra hint en rojo si se excede */
function InputLimitado({ value, onChange, min, max, placeholder, className, onMouseEnter, onMouseLeave, step = 0.01 }) {
  const [aviso, setAviso] = useState(null);

  const handleKeyDown = (e) => {
    const allowed = ["Backspace","Delete","Tab","ArrowLeft","ArrowRight","ArrowUp","ArrowDown","."];
    // Bloquear letras, símbolos, negativos
    if (!allowed.includes(e.key) && !/^\d$/.test(e.key)) { e.preventDefault(); return; }
    if (e.key === "-") { e.preventDefault(); return; }
    // Bloquear segundo punto
    if (e.key === "." && String(value).includes(".")) { e.preventDefault(); return; }
    // Bloquear dígito si ya se excede el máximo
    if (/^\d$/.test(e.key)) {
      const cur = String(value ?? "");
      const next = cur + e.key;
      const partes = next.split(".");
      // Si no hay decimales aún, verificar que el entero no supere el máximo
      if (partes.length === 1) {
        const n = parseFloat(next);
        if (!isNaN(n) && n > max) { e.preventDefault(); return; }
      }
    }
  };

  const handleChange = (e) => {
    let raw = e.target.value;
    // Quitar caracteres no válidos
    raw = raw.replace(/[^0-9.]/g, "");
    // Solo un punto
    const partes = raw.split(".");
    if (partes.length > 2) raw = partes[0] + "." + partes.slice(1).join("");
    // Máximo 2 decimales
    const p2 = raw.split(".");
    if (p2[1] !== undefined) raw = p2[0] + "." + p2[1].slice(0, 2);
    onChange(raw);
    setAviso(null);
  };

  const handleBlur = (e) => {
    const { valor, aviso: a } = clampVal(e.target.value, min, max);
    if (valor !== e.target.value) onChange(valor);
    setAviso(a);
    if (a) setTimeout(() => setAviso(null), 2500);
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder ?? ""}
        className={className}
        style={{ width: "100%", boxSizing: "border-box" }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
      {aviso && (
        <div style={{
          position: "absolute", top: "calc(100% + 2px)", left: 0,
          fontSize: "0.65rem", color: "#f97316", fontWeight: 600,
          background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.3)",
          borderRadius: "4px", padding: "2px 6px", whiteSpace: "nowrap", zIndex: 10,
        }}>
          {aviso}
        </div>
      )}
    </div>
  );
}

  const Dimensiones = forwardRef(({ setSeccion, sistemaActivo, setSistemaActivo, datosPorSistema, setDatosPorSistema, flujoMaxGlobal }, ref) => {
  const [tipoSeleccionado, setTipoSeleccionado]   = useState(null);
  const [hoveredField, setHoveredField]           = useState(null);
  const [animandoSalida, setAnimandoSalida]       = useState(false);
  const [datos, setDatos]                         = useState(null);
  const [mostrarAviso, setMostrarAviso]           = useState(false);
  const [mostrarErrores, setMostrarErrores]       = useState(false);
  const [calculadorArea, setCalculadorArea]       = useState(null);
  const [imagenZoom, setImagenZoom]               = useState(null);

  useEffect(() => {
    const cerrarConEsc = (e) => { if (e.key === "Escape") setImagenZoom(null); };
    window.addEventListener("keydown", cerrarConEsc);
    return () => window.removeEventListener("keydown", cerrarConEsc);
  }, []);

  const sistemas = {
    alberca:                     { img: "./img/alberca.jpg",                         cuerpos: 1, desborde: true, nombre: "Alberca" },
    jacuzzi:                     { img: "./img/jacuzzi.jpg",                         cuerpos: 1, desborde: true, nombre: "Jacuzzi" },
    chapoteadero:                { img: "./img/chapoteadero.jpg",                    cuerpos: 1, desborde: true, nombre: "Chapoteadero" },
    espejoAgua:                  { img: "./img/espejo.jpg",                          cuerpos: 1, desborde: true, nombre: "Espejo de agua" },
    albercaJacuzzi1:             { img: "./img/alberca+jacuzzi1C.jpg",               cuerpos: 2, desborde: true, nombre: "Alberca + Jacuzzi" },
    albercaChapo1:               { img: "./img/alberca+chapoteadero1C.jpg",          cuerpos: 2, desborde: true, nombre: "Alberca + Chapoteadero" },
    albercaJacuzziJacuzzi:       { img: "./img/alberca+2jacuzzis.jpg",               cuerpos: 3, desborde: true, nombre: "Alberca + Jacuzzi + Jacuzzi" },
    albercaChapoAsoleadero:      { img: "./img/alberca+chapoteadero+asoleadero.jpg", cuerpos: 3, desborde: true, nombre: "Alberca + Chapoteadero + Asoleadero" },
    albercaJacuzziChapo:         { img: "./img/alberca+jacuzzi+chapoteadero.jpg",    cuerpos: 3, desborde: true, nombre: "Alberca + Jacuzzi + Chapoteadero" },
    albercaAsoleaderoAsoleadero: { img: "./img/alberca+2asoleaderos.jpg",            cuerpos: 3, desborde: true, nombre: "Alberca + Asoleadero + Asoleadero" },
  };

  const tipoCuerposPorSistema = {
    alberca:                     ["alberca"],
    jacuzzi:                     ["jacuzzi"],
    chapoteadero:                ["chapoteadero"],
    espejoAgua:                  ["espejoAgua"],
    albercaJacuzzi1:             ["alberca", "jacuzzi"],
    albercaChapo1:               ["alberca", "chapoteadero"],
    albercaJacuzziJacuzzi:       ["alberca", "jacuzzi", "jacuzzi"],
    albercaChapoAsoleadero:      ["alberca", "chapoteadero", "asoleadero"],
    albercaJacuzziChapo:         ["alberca", "jacuzzi", "chapoteadero"],
    albercaAsoleaderoAsoleadero: ["alberca", "asoleadero", "asoleadero"],
  };

  const nombreTipoCuerpo = {
    alberca: "Alberca", jacuzzi: "Jacuzzi",
    chapoteadero: "Chapoteadero", asoleadero: "Asoleadero", espejoAgua: "Espejo de agua",
  };

  const GRUPOS_SISTEMAS = [
    { label: "1 cuerpo de agua",             keys: ["alberca", "jacuzzi", "chapoteadero", "espejoAgua"] },
    { label: "2 cuerpos de agua combinados", keys: ["albercaJacuzzi1", "albercaChapo1"] },
    { label: "3 cuerpos de agua combinados", keys: ["albercaJacuzziJacuzzi", "albercaChapoAsoleadero", "albercaJacuzziChapo", "albercaAsoleaderoAsoleadero"] },
  ];

  const TASAS_GENERAL = ["4", "6", "8"];
  const TASAS_JACUZZI = ["0.5", "1"];

  const tasaSugeridaPorUso = {
    residencial: "8", publica: "6", competencia: "6", parque: "4",
  };

  const crearDatosSistema = (numCuerpos, tipoCuerpos = []) => {
    const tieneJacuzzi = tipoCuerpos.includes("jacuzzi");
    const tieneGeneral = tipoCuerpos.some((t) => t !== "jacuzzi");
    return {
      cuerpos: Array.from({ length: numCuerpos }, (_, i) => ({
        area: "", profMin: "", profMax: "", tipoCuerpo: tipoCuerpos[i] ?? "alberca",
      })),
      usoGeneral:        tieneGeneral ? ""     : null,
      tasaGeneral:       tieneGeneral ? ""     : null,
      tasaJacuzzi:       tieneJacuzzi ? "0.5" : null,
      distCuarto: "", desborde: "",
      largoInfinity: "", profCortina: "", largoCanal: "",
      usarBombaInfinity: null,
    };
  };

  const hayJacuzzi = (d) => d?.tasaJacuzzi !== null && d?.tasaJacuzzi !== undefined;
  const hayGeneral = (d) => d?.usoGeneral  !== null && d?.usoGeneral  !== undefined;

  const actualizarDatos = useCallback((patch) => {
    setDatos((prev) => ({ ...prev, ...patch }));
  }, []);

  useEffect(() => {
    if (!datos || !sistemaActivo) return;
    setDatosPorSistema((prev) => ({ ...prev, [sistemaActivo]: datos }));
  }, [datos, sistemaActivo, setDatosPorSistema]);

  useEffect(() => {
    if (!datos || !hayGeneral(datos)) return;
    const sugerida = tasaSugeridaPorUso[datos.usoGeneral];
    if (sugerida !== undefined) {
      setDatos((prev) => {
        if (!prev) return prev;
        if (prev.tasaGeneral !== "" && prev.tasaGeneral !== sugerida) return prev;
        return { ...prev, tasaGeneral: sugerida };
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datos?.usoGeneral]);

  const descripcionesCampos = {
    area:              "Área superficial del cuerpo de agua",
    profMin:           "Profundidad mínima operativa",
    profMax:           "Profundidad máxima operativa",
    usoGeneral:        "Tipo de uso hidráulico para los cuerpos no-jacuzzi del sistema",
    tasaGeneral:       "Tiempo (h) para renovar el volumen total de los cuerpos no-jacuzzi — 4, 6 u 8 h",
    tasaJacuzzi:       "Tiempo (h) para renovar el volumen del jacuzzi — 0.5 h o 1 h",
    distCuarto:        "Distancia entre el cuerpo de agua y el cuarto de máquinas",
    largoInfinity:     "Longitud total del borde infinity",
    profCortina:       "Altura de la cortina hidráulica, recomendado 5 mm (permitido 2–10 mm)",
    largoCanal:        "Longitud del canal de desborde",
    usarBombaInfinity: "Define si el borde infinity contará con una motobomba dedicada",
  };

  const descripcionesDesborde = {
    "desborde-infinity": "Sistema de rebose continuo por borde infinito, requiere control preciso de nivel y retorno dedicado",
    "desborde-canal":    "Sistema de desborde perimetral mediante canal recolector con retorno balanceado",
    "desborde-ambos":    "Combinación de borde infinity y canal de desborde en un mismo sistema hidráulico",
    "desborde-ninguno":  "Sistema sin desborde, el nivel se controla únicamente por skimmers o tomas directas",
  };

  const descripcionesSistemas = {
    alberca:                     "Sistema hidráulico principal para nado y recreación, diseñado para operación continua y filtración estándar",
    jacuzzi:                     "Sistema de hidromasaje con alta recirculación, mayor temperatura y requerimientos específicos de bombeo",
    chapoteadero:                "Sistema de baja profundidad destinado a usuarios infantiles, con tasas de rotación más estrictas",
    espejoAgua:                  "Sistema ornamental de baja turbulencia enfocado en efecto visual y control de nivel",
    albercaJacuzzi1:             "Sistema combinado de alberca y jacuzzi en un solo cuerpo hidráulico con control compartido",
    albercaChapo1:               "Sistema combinado de alberca y chapoteadero en un solo cuerpo hidráulico",
    albercaJacuzziJacuzzi:       "Sistema combinado con alberca principal y dos zonas de hidromasaje en un solo cuerpo hidráulico",
    albercaChapoAsoleadero:      "Sistema combinado para recreación familiar con área infantil y zona de descanso en un solo cuerpo hidráulico",
    albercaJacuzziChapo:         "Sistema mixto con alberca, hidromasaje y área infantil integrada en un solo cuerpo hidráulico",
    albercaAsoleaderoAsoleadero: "Sistema con alberca principal y dos zonas someras tipo asoleadero en un solo cuerpo hidráulico",
  };

  useImperativeHandle(ref, () => ({
    resetDimensiones() {
      setTipoSeleccionado(null); setSistemaActivo(null); setDatos(null);
    }
  }));

  useEffect(() => {
    if (!sistemaActivo || !sistemas[sistemaActivo]) return;
    setTipoSeleccionado(sistemaActivo);
    const existente = datosPorSistema[sistemaActivo];
    if (existente) {
      setDatos(existente);
    } else {
      const tipoCuerpos = tipoCuerposPorSistema[sistemaActivo] ?? [];
      setDatos(crearDatosSistema(sistemas[sistemaActivo].cuerpos, tipoCuerpos));
    }
  }, [sistemaActivo]);

  const cambiarSeccionConAnimacion = (nuevaSeccion) => {
    setAnimandoSalida(true);
    setTimeout(() => { setAnimandoSalida(false); setSeccion(nuevaSeccion); }, 220);
  };

  const obtenerErrores = () => {
    if (!datos) return {};
    const err = {};
    datos.cuerpos.forEach((c, i) => {
      if (!c.area)    err[`area-${i}`]    = "Área requerida";
      if (!c.profMin) err[`profMin-${i}`] = "Profundidad mínima requerida";
      if (!c.profMax) err[`profMax-${i}`] = "Profundidad máxima requerida";
    });
    if (hayGeneral(datos)) {
      if (!datos.usoGeneral)  err.usoGeneral  = "Selecciona el uso hidráulico";
      if (!datos.tasaGeneral) err.tasaGeneral = "Selecciona la tasa de rotación";
    }
    if (hayJacuzzi(datos) && !datos.tasaJacuzzi) err.tasaJacuzzi = "Selecciona la tasa de rotación del jacuzzi";
    if (datos.distCuarto === "") err.distCuarto = "Ingresa la distancia";
    if (!datos.desborde) err.desborde = "Selecciona un tipo de desborde";
    if (datos.desborde === "infinity" || datos.desborde === "ambos") {
      if (!datos.largoInfinity)     err.largoInfinity     = "Largo infinity requerido";
      if (!datos.profCortina)       err.profCortina       = "Profundidad de cortina requerida";
      // usarBombaInfinity bloqueado — módulo próximamente, no validar
    }
    if (datos.desborde === "canal" || datos.desborde === "ambos") {
      if (!datos.largoCanal) err.largoCanal = "Largo de canal requerido";
    }
    return err;
  };

  const config  = tipoSeleccionado ? sistemas[tipoSeleccionado] : null;
  const errores = obtenerErrores();

  /* Helper para obtener límites del cuerpo i */
  const limitesParaCuerpo = (i) => {
    const tipo = datos?.cuerpos?.[i]?.tipoCuerpo ?? "alberca";
    return LIMITES[tipo] ?? LIMITES.alberca;
  };

  const renderCamposSistema = () => {
    if (!config || !datos) return null;

    const etiquetaGrupoGeneral = () => {
      const tipos = datos.cuerpos
        .filter((c) => c.tipoCuerpo !== "jacuzzi")
        .map((c) => nombreTipoCuerpo[c.tipoCuerpo] ?? c.tipoCuerpo);
      return [...new Set(tipos)].join(" + ");
    };

    return (
      <div className="selector-bloque-inputs">

        {datos.cuerpos.map((cuerpo, i) => {
          const lim = limitesParaCuerpo(i);
          const etiquetaCuerpo = config.cuerpos > 1
            ? nombreTipoCuerpo[cuerpo.tipoCuerpo] ?? `Cuerpo ${i + 1}`
            : "Dimensiones físicas";
          return (
            <div key={i} className="selector-grupo">
              <div className="selector-subtitulo">{etiquetaCuerpo}</div>
              <div className="selector-grid">
                <div className="campo">
                  <label>Área (m²)</label>
                  <InputLimitado
                    value={cuerpo.area}
                    onChange={(v) => { const c = [...datos.cuerpos]; c[i] = { ...c[i], area: v }; actualizarDatos({ cuerpos: c }); }}
                    min={lim.area[0]} max={lim.area[1]}
                    className={mostrarErrores && errores[`area-${i}`] ? "input-error" : ""}
                    onMouseEnter={() => setHoveredField(`area-${i}`)} onMouseLeave={() => setHoveredField(null)}
                  />
                  <span className="input-hint">rango: {lim.area[0]} – {lim.area[1]} m²</span>
                  <button type="button" className="btn-calculador-area" onClick={() => setCalculadorArea({ cuerpoIndex: i })}>
                    Presiona aquí si necesitas ayuda para calcular el área
                  </button>
                  {cuerpo.areaCalculada && <span className="badge-ok">✔ Área calculada a través de la plataforma</span>}
                </div>
                <div className="campo">
                  <label>Prof. mínima (m)</label>
                  <InputLimitado
                    value={cuerpo.profMin}
                    onChange={(v) => { const c = [...datos.cuerpos]; c[i] = { ...c[i], profMin: v }; actualizarDatos({ cuerpos: c }); }}
                    min={lim.profMin[0]} max={lim.profMin[1]} step={0.01}
                    className={mostrarErrores && errores[`profMin-${i}`] ? "input-error" : ""}
                    onMouseEnter={() => setHoveredField(`profMin-${i}`)} onMouseLeave={() => setHoveredField(null)}
                  />
                  <span className="input-hint">rango: {lim.profMin[0]} – {lim.profMin[1]} m</span>
                </div>
                <div className="campo">
                  <label>Prof. máxima (m)</label>
                  <InputLimitado
                    value={cuerpo.profMax}
                    onChange={(v) => { const c = [...datos.cuerpos]; c[i] = { ...c[i], profMax: v }; actualizarDatos({ cuerpos: c }); }}
                    min={lim.profMax[0]} max={lim.profMax[1]} step={0.01}
                    className={mostrarErrores && errores[`profMax-${i}`] ? "input-error" : ""}
                    onMouseEnter={() => setHoveredField(`profMax-${i}`)} onMouseLeave={() => setHoveredField(null)}
                  />
                  <span className="input-hint">rango: {lim.profMax[0]} – {lim.profMax[1]} m</span>
                </div>
              </div>
            </div>
          );
        })}

        {hayGeneral(datos) && (
          <div className="selector-grupo">
            <div className="selector-subtitulo">
              Uso hidráulico
              {hayJacuzzi(datos) && <span className="subtitulo-detalle"> — {etiquetaGrupoGeneral()}</span>}
            </div>
            <div className="selector-grid">
              <div className="campo">
                <label>Uso</label>
                <select value={datos.usoGeneral}
                  onChange={(e) => actualizarDatos({ usoGeneral: e.target.value, tasaGeneral: tasaSugeridaPorUso[e.target.value] ?? "" })}
                  className={mostrarErrores && errores.usoGeneral ? "input-error" : ""}
                  onMouseEnter={() => setHoveredField("usoGeneral")} onMouseLeave={() => setHoveredField(null)}>
                  <option value="">Selecciona</option>
                  <option value="residencial">Residencial</option>
                  <option value="publica">Pública</option>
                  <option value="competencia">Competencia</option>
                  <option value="parque">Parque acuático</option>
                </select>
              </div>
              <div className="campo">
                <label>Tasa de rotación (h)</label>
                <select value={datos.tasaGeneral ?? ""}
                  onChange={(e) => actualizarDatos({ tasaGeneral: e.target.value })}
                  className={mostrarErrores && errores.tasaGeneral ? "input-error" : ""}
                  onMouseEnter={() => setHoveredField("tasaGeneral")} onMouseLeave={() => setHoveredField(null)}>
                  <option value="">Selecciona</option>
                  {TASAS_GENERAL.map((v) => <option key={v} value={v}>{v} h</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {hayJacuzzi(datos) && (
          <div className="selector-grupo">
            <div className="selector-subtitulo">Uso hidráulico <span className="subtitulo-detalle">— Jacuzzi</span></div>
            <div className="selector-grid">
              <div className="campo">
                <label>Uso</label>
                <select value="hidromasaje" disabled><option value="hidromasaje">Hidromasaje</option></select>
                <span className="badge-ok">✔ Uso fijado como hidromasaje</span>
              </div>
              <div className="campo">
                <label>Tasa de rotación (h)</label>
                <select value={datos.tasaJacuzzi ?? "0.5"}
                  onChange={(e) => actualizarDatos({ tasaJacuzzi: e.target.value })}
                  className={mostrarErrores && errores.tasaJacuzzi ? "input-error" : ""}
                  onMouseEnter={() => setHoveredField("tasaJacuzzi")} onMouseLeave={() => setHoveredField(null)}>
                  {TASAS_JACUZZI.map((v) => <option key={v} value={v}>{v} h</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="selector-grupo">
          <div className="selector-subtitulo">Instalación</div>
          <div className="selector-grid">
            <div className="campo">
              <label>Distancia a cuarto (m)</label>
              <InputLimitado
                value={datos.distCuarto}
                onChange={(v) => actualizarDatos({ distCuarto: v })}
                min={LIMITES_DIST[0]} max={LIMITES_DIST[1]}
                className={mostrarErrores && errores.distCuarto ? "input-error" : ""}
                onMouseEnter={() => setHoveredField("distCuarto")} onMouseLeave={() => setHoveredField(null)}
              />
              <span className="input-hint">rango: {LIMITES_DIST[0]} – {LIMITES_DIST[1]} m</span>
            </div>
          </div>
        </div>

        {config.desborde && (
          <div className="selector-grupo">
            <div className="selector-subtitulo">Tipo de desborde</div>
            <div className={`selector-radios ${mostrarErrores && errores.desborde ? "input-error" : ""}`}>
              {["infinity", "canal", "ambos", "ninguno"].map((v) => (
                <label key={v} onMouseEnter={() => setHoveredField(`desborde-${v}`)} onMouseLeave={() => setHoveredField(null)}>
                  <input type="radio" checked={datos.desborde === v} onChange={() => actualizarDatos({ desborde: v })} />
                  {v}
                </label>
              ))}
            </div>

            {(datos.desborde === "infinity" || datos.desborde === "ambos") && (<>
              <div className="selector-grid">
                <div className="campo">
                  <label>Largo infinity (m)</label>
                  <InputLimitado
                    value={datos.largoInfinity}
                    onChange={(v) => actualizarDatos({ largoInfinity: v })}
                    min={LIMITES_INFINITY[0]} max={LIMITES_INFINITY[1]}
                    className={mostrarErrores && errores.largoInfinity ? "input-error" : ""}
                    onMouseEnter={() => setHoveredField("largoInfinity")} onMouseLeave={() => setHoveredField(null)}
                  />
                  <span className="input-hint">rango: {LIMITES_INFINITY[0]} – {LIMITES_INFINITY[1]} m</span>
                </div>
                <div className="campo">
                  <label>Prof. cortina (mm)</label>
                  <InputLimitado
                    value={datos.profCortina}
                    onChange={(v) => actualizarDatos({ profCortina: v })}
                    min={LIMITES_CORTINA[0]} max={LIMITES_CORTINA[1]}
                    placeholder="5 (recomendado)"
                    className={mostrarErrores && errores.profCortina ? "input-error" : ""}
                    onMouseEnter={() => setHoveredField("profCortina")} onMouseLeave={() => setHoveredField(null)}
                  />
                  <span className="input-hint">rango: {LIMITES_CORTINA[0]} – {LIMITES_CORTINA[1]} mm · rec. 5</span>
                </div>
              </div>
              <div className="selector-grupo" style={{ border:"1px solid rgba(167,139,250,0.25)", background:"rgba(167,139,250,0.04)" }}>
                <div className="selector-subtitulo" style={{ borderLeftColor:"#a78bfa", color:"#c4b5fd" }}>
                  Motobomba para sistema infinity
                  <span style={{ marginLeft:"0.5rem", fontSize:"0.62rem", fontWeight:600, color:"#a78bfa", background:"rgba(167,139,250,0.12)", border:"1px solid rgba(167,139,250,0.3)", borderRadius:"10px", padding:"1px 7px", verticalAlign:"middle", letterSpacing:"0.03em" }}>Próximamente</span>
                </div>
                <div className="bloque-proximamente">
                  <div className="selector-radios">
                    <label>
                      <input type="radio" disabled />
                      Sí, bomba independiente
                    </label>
                    <label>
                      <input type="radio" disabled />
                      No, comparte bomba
                    </label>
                  </div>
                </div>
                <div style={{ fontSize:"0.68rem", color:"#64748b", marginTop:"0.3rem" }}>
                  Este módulo estará disponible en una próxima actualización.
                </div>
              </div>
            </>)}

            {(datos.desborde === "canal" || datos.desborde === "ambos") && (
              <div className="campo">
                <label>Largo canal (m)</label>
                <InputLimitado
                  value={datos.largoCanal}
                  onChange={(v) => actualizarDatos({ largoCanal: v })}
                  min={LIMITES_CANAL[0]} max={LIMITES_CANAL[1]}
                  className={mostrarErrores && errores.largoCanal ? "input-error" : ""}
                  onMouseEnter={() => setHoveredField("largoCanal")} onMouseLeave={() => setHoveredField(null)}
                />
                <span className="input-hint">rango: {LIMITES_CANAL[0]} – {LIMITES_CANAL[1]} m</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const SISTEMAS_PROXIMAMENTE = ["jacuzzi", "albercaJacuzzi1", "albercaJacuzziJacuzzi", "albercaJacuzziChapo"];

  const renderCardSistema = (key) => {
    const s           = sistemas[key];
    const activo      = tipoSeleccionado === key;
    const icono       = ICONOS_SISTEMA[key];
    const proximamente = SISTEMAS_PROXIMAMENTE.includes(key);

    return (
      <div key={key}
        className={`sistema-cal-card ${activo ? "activo" : ""} ${proximamente ? "sistema-cal-card--proximamente" : ""}`}
        onClick={() => {
          if (proximamente) return;
          setSistemaActivo(key);
          setDatosPorSistema((prev) => {
            if (prev[key]) return prev;
            const tipoCuerpos = tipoCuerposPorSistema[key] ?? [];
            return { ...prev, [key]: crearDatosSistema(s.cuerpos, tipoCuerpos) };
          });
        }}
        onMouseEnter={() => setHoveredField(proximamente ? null : key)}
        onMouseLeave={() => setHoveredField(null)}
        style={proximamente ? { cursor: "default" } : {}}
      >
        <div className="sistema-cal-icon" style={proximamente ? { opacity: 0.45, filter: "grayscale(0.4)" } : {}}>
          {icono}
        </div>
        <div className="sistema-cal-label" style={proximamente ? { opacity: 0.5 } : {}}>{s.nombre}</div>
        <div className="sistema-cal-meta-dim">
          {proximamente ? (
            <span style={{ fontSize:"0.6rem", fontWeight:600, color:"#a78bfa", background:"rgba(167,139,250,0.15)", border:"1px solid rgba(167,139,250,0.35)", borderRadius:"10px", padding:"1px 6px", letterSpacing:"0.03em" }}>
              Próximamente
            </span>
          ) : (
            <span className={`badge-cuerpo ${s.cuerpos > 1 ? "doble" : "simple"}`}>{s.cuerpos}C</span>
          )}
        </div>
        <div className={`sistema-cal-check ${activo ? "checked" : ""}`}>{activo ? "✓" : ""}</div>
      </div>
    );
  };

  const FLUJO_MAX_PERMITIDO = 4490;
  const flujoExcedido = flujoMaxGlobal != null && flujoMaxGlobal > FLUJO_MAX_PERMITIDO;

  return (
    <div className="form-section hero-wrapper">
      <div className="selector-tecnico modo-experto">

        <div className="selector-header">
          {!tipoSeleccionado ? (
            <>
              <div className="selector-titulo">Configuración del sistema</div>
              <div className="selector-subtitulo">Selecciona el tipo de cuerpo hidráulico</div>
            </>
          ) : (
            <>
              <div className="selector-titulo-sistema">{sistemas[tipoSeleccionado].nombre}</div>
              <div className="selector-subtitulo-tecnico">Parámetros técnicos del sistema</div>
            </>
          )}
        </div>

        {tipoSeleccionado && (
          <div className="selector-acciones">
            <button className="btn-secundario" onClick={() => {
              setAnimandoSalida(true);
              setTimeout(() => {
                setTipoSeleccionado(null); setSistemaActivo(null);
                setDatos(null); setAnimandoSalida(false);
              }, 220);
            }}>
              ← Volver a Dimensiones
            </button>

            <div className="aviso-wrapper">
              <button
                className={`btn-primario ${mostrarAviso || flujoExcedido ? "error" : ""}`}
                disabled={flujoExcedido}
                style={{ opacity: flujoExcedido ? 0.5 : 1, cursor: flujoExcedido ? "not-allowed" : "pointer" }}
                onClick={() => {
                  if (flujoExcedido) return;
                  if (Object.keys(errores).length > 0) {
                    setMostrarErrores(true); setMostrarAviso(true);
                    setTimeout(() => setMostrarAviso(false), 2500);
                    return;
                  }
                  cambiarSeccionConAnimacion("calentamiento");
                }}
              >
                Ir a Calentamiento →
              </button>
              {flujoExcedido && (
                <div className="aviso-validacion">
                  Flujo máximo excede 4,500 GPM — reduce las dimensiones del sistema
                </div>
              )}
              {mostrarAviso && !flujoExcedido && (
                <div className="aviso-validacion">Llena toda la información solicitada</div>
              )}
            </div>
          </div>
        )}

        {tipoSeleccionado && (
          <div className={`selector-contenido ${animandoSalida ? "salida" : "entrada"}`}>
            {renderCamposSistema()}
          </div>
        )}

        <div className={`lista-sistemas ${!tipoSeleccionado ? "con-grupos" : ""}`}>
          {tipoSeleccionado ? (
            <div className="sistemas-calentamiento-grid" style={{ gridTemplateColumns: "1fr" }}>
              {renderCardSistema(tipoSeleccionado)}
            </div>
          ) : (
            GRUPOS_SISTEMAS.map(({ label, keys }) => (
              <div key={label} className="lista-sistemas-grupo">
                <div className="lista-sistemas-grupo-label">
                  <span className="lista-sistemas-grupo-pill">{label}</span>
                </div>
                <div className="sistemas-calentamiento-grid" style={{
                  gridTemplateColumns: keys.length <= 2 ? `repeat(${keys.length}, 1fr)` : "repeat(4, 1fr)",
                }}>
                  {keys.map((key) => renderCardSistema(key))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="selector-footer fijo">
          <span>{Object.keys(sistemas).length} configuraciones disponibles</span>
          <span className="footer-highlight">
            {(() => {
              if (!hoveredField) return "Modo ingeniería";
              const matchCuerpo = hoveredField.match(/^(area|profMin|profMax)-(\d+)$/);
              if (matchCuerpo) {
                const campo = matchCuerpo[1];
                const idx   = Number(matchCuerpo[2]) + 1;
                return `${descripcionesCampos[campo]} (Cuerpo ${idx})`;
              }
              if (descripcionesDesborde[hoveredField])  return descripcionesDesborde[hoveredField];
              if (descripcionesSistemas[hoveredField])  return descripcionesSistemas[hoveredField];
              return descripcionesCampos[hoveredField] ?? hoveredField;
            })()}
          </span>
        </div>

      </div>

      {calculadorArea && (
        <CalculadorAreaModal open onClose={() => setCalculadorArea(null)}
          onConfirm={(area) => {
            const cuerpos = [...datos.cuerpos];
            cuerpos[calculadorArea.cuerpoIndex] = { ...cuerpos[calculadorArea.cuerpoIndex], area, areaCalculada: true };
            actualizarDatos({ cuerpos });
          }} />
      )}

      {imagenZoom && (
        <div className="visor-imagen" onClick={() => setImagenZoom(null)}>
          <div className="visor-contenido" onClick={(e) => e.stopPropagation()}>
            <img src={imagenZoom.src} alt={imagenZoom.titulo} />
            <div className="visor-titulo">{imagenZoom.titulo}</div>
            <button className="visor-cerrar" onClick={() => setImagenZoom(null)}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
});

export default Dimensiones;