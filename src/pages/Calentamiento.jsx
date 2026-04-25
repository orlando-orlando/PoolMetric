import { useState, useMemo, useEffect, useRef, memo } from "react";
import "../estilos.css";
import { getClimaMensual } from "../data/clima";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { qEvaporacion }    from "../utils/qEvaporacion";
import { qConveccion }     from "../utils/qConveccion";
import { qRadiacion }      from "../utils/qRadiacion";
import { qTransmision }    from "../utils/qTransmision";
import { qInfinity }       from "../utils/qInfinity";
import { qCanal }          from "../utils/qCanal";
import { qTuberia }        from "../utils/qTuberia";
import { retorno }         from "../utils/retorno";
import { volumen }         from "../utils/volumen";
import { flujoFinal }      from "../utils/flujoFinal";
import { flujoMaximo }     from "../utils/flujoMaximo";
import { flujoInfinity }   from "../utils/flujoInfinity";
import { volumenPorGrupo } from "../utils/volumenPorGrupo";
import { bombaDeCalor, calcularCargaManual } from "../utils/bombaDeCalor";
import { bombasCalor }     from "../data/bombasDeCalor";
import { panelSolar, calcularPanelSolarManual } from "../utils/panelSolar";
import { panelesSolares }  from "../data/panelesSolares";
import { caldera as calcularCaldera, calcularCalderaManual, calcularBTUporGrado } from "../utils/caldera";
import { calderasGas }           from "../data/calderasDeGas";
import { calentadorElectrico as calcularCE, calcularCEManual } from "../utils/calentadorElectrico";
import { calentadoresElectricos } from "../data/calentadoresElectricos";

ChartJS.register(ArcElement, Tooltip, Legend);

/* ── InputLimitado (rangos de entrada) ── */
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

/* ── GraficaPie memoizada — no se re-renderiza si pieData y pieOptions no cambian ── */
const GraficaPie = memo(({ data, options }) => (
  <Pie data={data} options={options} />
));

/* ─── SVG Icons ─── */
const IconoBombaCalor = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
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
    <line x1="40" y1="17" x2="43" y2="17" stroke="#38bdf8" strokeWidth="1" opacity="0.7"/>
    <line x1="40" y1="20" x2="43" y2="20" stroke="#38bdf8" strokeWidth="1" opacity="0.7"/>
    <line x1="40" y1="23" x2="43" y2="23" stroke="#38bdf8" strokeWidth="1" opacity="0.7"/>
    <line x1="40" y1="26" x2="43" y2="26" stroke="#38bdf8" strokeWidth="1" opacity="0.7"/>
    <line x1="40" y1="29" x2="43" y2="29" stroke="#38bdf8" strokeWidth="1" opacity="0.7"/>
    <path d="M16 10 Q18 7 20 10 Q22 13 24 10" stroke="#fb923c" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <path d="M20 10 L19 7 M20 10 L22 8" stroke="#fb923c" strokeWidth="1" strokeLinecap="round"/>
  </svg>
);

const IconoCaldera = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="10" width="20" height="26" rx="3" stroke="#7dd3fc" strokeWidth="1.5" fill="rgba(30,64,175,0.15)"/>
    <rect x="13" y="13" width="14" height="9" rx="1" stroke="#38bdf8" strokeWidth="1" fill="rgba(56,189,248,0.08)"/>
    <rect x="15" y="14.5" width="5" height="3" rx="0.5" fill="#38bdf8" opacity="0.6"/>
    <circle cx="23" cy="16" r="1.2" stroke="#38bdf8" strokeWidth="1" fill="none"/>
    <path d="M17 28 Q18 25 19 27 Q20 24 21 27 Q22 25 23 28" stroke="#fb923c" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <path d="M30 16 L36 16" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/>
    <text x="36.5" y="15.5" fill="#64748b" fontSize="5" fontFamily="monospace">F</text>
    <path d="M30 30 L36 30" stroke="#fb923c" strokeWidth="1.5" strokeLinecap="round"/>
    <text x="36.5" y="29.5" fill="#fb923c" fontSize="5" fontFamily="monospace">C</text>
    <rect x="16" y="6" width="8" height="4" rx="1" stroke="#94a3b8" strokeWidth="1" fill="rgba(15,23,42,0.4)"/>
    <path d="M18 6 L18 4 M20 6 L20 3.5 M22 6 L22 4" stroke="#94a3b8" strokeWidth="1" opacity="0.6" strokeLinecap="round"/>
    <rect x="8" y="36" width="24" height="3" rx="1" fill="rgba(148,163,184,0.2)" stroke="#475569" strokeWidth="1"/>
  </svg>
);

const IconoPanelSolar = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="12" width="34" height="22" rx="1.5" stroke="#7dd3fc" strokeWidth="1.5" fill="rgba(15,40,80,0.6)"/>
    <rect x="4" y="14" width="34" height="2.5" rx="0.5" fill="rgba(56,189,248,0.3)" stroke="#38bdf8" strokeWidth="0.8"/>
    <rect x="4" y="29.5" width="34" height="2.5" rx="0.5" fill="rgba(56,189,248,0.3)" stroke="#38bdf8" strokeWidth="0.8"/>
    <line x1="9"  y1="16.5" x2="9"  y2="29.5" stroke="#38bdf8" strokeWidth="1.2" opacity="0.8"/>
    <line x1="14" y1="16.5" x2="14" y2="29.5" stroke="#38bdf8" strokeWidth="1.2" opacity="0.8"/>
    <line x1="19" y1="16.5" x2="19" y2="29.5" stroke="#38bdf8" strokeWidth="1.2" opacity="0.8"/>
    <line x1="24" y1="16.5" x2="24" y2="29.5" stroke="#38bdf8" strokeWidth="1.2" opacity="0.8"/>
    <line x1="29" y1="16.5" x2="29" y2="29.5" stroke="#38bdf8" strokeWidth="1.2" opacity="0.8"/>
    <line x1="34" y1="16.5" x2="34" y2="29.5" stroke="#38bdf8" strokeWidth="1.2" opacity="0.8"/>
    <rect x="4" y="12" width="34" height="22" rx="1.5" fill="rgba(56,189,248,0.04)" stroke="rgba(56,189,248,0.3)" strokeWidth="0.5"/>
    <path d="M38 16 L44 16 L44 32 L38 32" stroke="#94a3b8" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="42" cy="6" r="3" fill="#fbbf24" opacity="0.9"/>
    <line x1="42" y1="1.5" x2="42" y2="3" stroke="#fbbf24" strokeWidth="1" strokeLinecap="round"/>
    <line x1="45.5" y1="2.5" x2="44.5" y2="3.5" stroke="#fbbf24" strokeWidth="1" strokeLinecap="round"/>
    <line x1="46.5" y1="6" x2="45" y2="6" stroke="#fbbf24" strokeWidth="1" strokeLinecap="round"/>
    <line x1="10" y1="34" x2="10" y2="40" stroke="#475569" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="30" y1="34" x2="30" y2="40" stroke="#475569" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="8"  y1="40" x2="32" y2="40" stroke="#475569" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IconoCalentadorElectrico = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="22" cy="11" rx="10" ry="3" stroke="#7dd3fc" strokeWidth="1.5" fill="rgba(30,64,175,0.2)"/>
    <rect x="12" y="11" width="20" height="24" stroke="#7dd3fc" strokeWidth="1.5" fill="rgba(30,64,175,0.15)"/>
    <ellipse cx="22" cy="35" rx="10" ry="3" stroke="#7dd3fc" strokeWidth="1.5" fill="rgba(30,64,175,0.2)"/>
    <path d="M17 20 L17 26 Q17 28 19 28 L25 28 Q27 28 27 26 L27 20" stroke="#fb923c" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="17" y1="20" x2="27" y2="20" stroke="#fb923c" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M21 14 L19 18 L22 18 L20 22 L25 17 L22 17 L24 14 Z" fill="#fbbf24" opacity="0.9"/>
    <path d="M32 32 L38 32 L38 38" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <text x="36" y="44" fill="#64748b" fontSize="5" fontFamily="monospace">F</text>
    <path d="M32 14 L38 14 L38 8" stroke="#fb923c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <text x="36" y="7" fill="#fb923c" fontSize="5" fontFamily="monospace">C</text>
    <circle cx="22" cy="31" r="2.5" stroke="#38bdf8" strokeWidth="1" fill="none"/>
    <circle cx="22" cy="31" r="1" fill="#38bdf8" opacity="0.6"/>
    <rect x="12" y="11" width="20" height="24" stroke="#475569" strokeWidth="2.5" fill="none" strokeDasharray="2 3" opacity="0.4"/>
  </svg>
);

const IconoBDCMini = () => (
  <svg width="28" height="28" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
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

/* ─── Icon checkmark ─── */
const IconoCheck = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 7L5.5 10.5L12 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SISTEMAS_CALENTAMIENTO = [
  { key: "bombaCalor",          label: "Bomba de calor",        Icon: IconoBombaCalor },
  { key: "caldera",             label: "Caldera",               Icon: IconoCaldera },
  { key: "panelSolar",          label: "Panel solar",           Icon: IconoPanelSolar },
  { key: "calentadorElectrico", label: "Calentador eléctrico",  Icon: IconoCalentadorElectrico },
];

const TASAS_ELEVACION = [0.25, 0.50, 0.75, 1.0, 1.5, 2.0, 3.0, 4.0];
const SISTEMA_DEFAULTS = () => ({ distancia: "", alturaVertical: "", tasaElevacion: null, alturaVerticalPS: "" });

function enriquecerCuerpos(cuerpos = []) {
  return cuerpos.map((c) => ({ ...c, volumen: volumen(c), tipo: c.tipoCuerpo ?? "alberca" }));
}

function calcularFlujoMaximo(sistemaActivo) {
  if (!sistemaActivo?.cuerpos?.length) return 0;
  const cuerposEnriquecidos = enriquecerCuerpos(sistemaActivo.cuerpos);
  const datosEnriquecidos = { ...sistemaActivo, cuerpos: cuerposEnriquecidos };
  const flujoVol = flujoFinal(datosEnriquecidos);
  const flujoInf = flujoInfinity(sistemaActivo);
  return flujoMaximo(flujoVol, flujoInf);
}

const PIE_OPTIONS = {
  responsive: true, maintainAspectRatio: false,
  layout: { padding: { top: 18, bottom: 18, left: 18, right: 18 } },
  plugins: {
    legend: { position: "right", labels: { color: "#e5e7eb", font: { size: 13, weight: "500" }, padding: 14, boxWidth: 14 } },
    tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed.toFixed(0)} BTU/h` } }
  }
};


/* ─── Helpers nombre comercial para calentamiento ─── */
const CAL_NOMBRES = {
  interheat: "InterHeat", spaheat: "SpaHeat", uniplaca: "Uniplaca",
  serie: "Serie", jxi: "JXI", lxi: "LXI",
};
const ncCal = (obj) => {
  if (!obj?.id) return obj?.modelo ?? "";
  const parte = obj.id.split("-")[0].toLowerCase();
  if (CAL_NOMBRES[parte]) return CAL_NOMBRES[parte];
  if (obj.modelo && obj.modelo.toLowerCase().startsWith(parte)) return obj.modelo;
  return parte.charAt(0).toUpperCase() + parte.slice(1);
};
const mostrarCodigoCal = (obj) => {
  if (!obj?.id) return false;
  const parte = obj.id.split("-")[0].toLowerCase();
  if (CAL_NOMBRES[parte]) return true;
  if (obj.modelo && obj.modelo.toLowerCase().startsWith(parte)) return false;
  return true;
};
const fmtBTU = (v) => v ? Math.round(parseFloat(v)).toLocaleString("es-MX") + " BTU/h" : null;

export default function Calentamiento({
  setSeccion, tipoSistema, datosPorSistema, setDatosPorSistema,
  areaTotal, volumenTotal, profundidadPromedio, tipoRetornoExterno,
}) {
  const sistemaActivo = datosPorSistema?.[tipoSistema];

  const SISTEMAS_LABELS = {
    alberca: "Alberca", jacuzzi: "Jacuzzi", chapoteadero: "Chapoteadero",
    espejoAgua: "Espejo de agua",
    albercaJacuzzi1: "Alberca + Jacuzzi (2 cuerpos)",
    albercaChapo1: "Alberca + Chapoteadero (2 cuerpos)",
    albercaJacuzziJacuzzi: "Alberca + Jacuzzi + Jacuzzi (3 cuerpos)",
    albercaChapoAsoleadero: "Alberca + Chapoteadero + Asoleadero (3 cuerpos)",
    albercaJacuzziChapo: "Alberca + Jacuzzi + Chapoteadero (3 cuerpos)",
    albercaAsoleaderoAsoleadero: "Alberca + Asoleadero + Asoleadero (3 cuerpos)"
  };
  const nombreSistema = SISTEMAS_LABELS[tipoSistema] || "Dimensiones";

  const datosPrevios = datosPorSistema?.calentamiento || {};
  const [usarBombaCalentamiento, setUsarBombaCalentamiento] = useState(datosPrevios.usarBombaCalentamiento ?? null);
  const [ciudad, setCiudad]                 = useState(datosPrevios.ciudad || "");
  const [tempDeseada, setTempDeseada]       = useState(datosPrevios.tempDeseada ?? null);
  const [tempDeseadaInput, setTempDeseadaInput] = useState(datosPrevios.tempDeseada != null ? String(datosPrevios.tempDeseada) : "");
  const [cubierta, setCubierta]             = useState(datosPrevios.cubierta ?? null);
  const [techada, setTechada]               = useState(datosPrevios.techada ?? null);
  const [mesesCalentar, setMesesCalentar]   = useState(datosPrevios.mesesCalentar || {});
  const [hoveredField, setHoveredField]     = useState(null);
  const [animandoSalida, setAnimandoSalida] = useState(false);
  const [mostrarErrores, setMostrarErrores] = useState(false);
  const [mostrarAviso, setMostrarAviso]     = useState(false);
  const [decision, setDecision]             = useState(datosPrevios.decision ?? null);
  const [sistemasSeleccionados, setSistemasSeleccionados] = useState(datosPrevios.sistemasSeleccionados || {});

  const [modoBDC, setModoBDC] = useState(datosPrevios.modoBDC ?? "recomendado");
  const [filtroBDCMarca,     setFiltroBDCMarca]    = useState("todas");
  const [filtroBDCVelocidad, setFiltroBDCVelocidad] = useState("todas");
  const [selManualBDCId,     setSelManualBDCId]     = useState(datosPrevios.selManualBDCId ?? null);
  const [selManualCantidad,  setSelManualCantidad]  = useState(datosPrevios.selManualCantidad ?? 1);
  const [bdcConfirmada, setBdcConfirmada] = useState(datosPrevios.bdcConfirmada ?? null);

  const [modoPS,           setModoPS]           = useState(datosPrevios.modoPS           ?? "recomendado");
  const [selManualPSPct,   setSelManualPSPct]   = useState(datosPrevios.selManualPSPct   ?? 100);
  const [selManualPSCant,  setSelManualPSCant]  = useState(datosPrevios.selManualPSCant  ?? null);

  /* ── Caldera ── */
  const [modoCaldera,          setModoCaldera]          = useState(datosPrevios.modoCaldera          ?? "recomendado");
  const [filtroCalderaMarca,   setFiltroCalderaMarca]   = useState("todas");
  const [filtroCalderaTipoGas, setFiltroCalderaTipoGas] = useState("todos");
  const [selManualCalderaId,   setSelManualCalderaId]   = useState(datosPrevios.selManualCalderaId   ?? null);
  const [selManualCalderaCant, setSelManualCalderaCant] = useState(datosPrevios.selManualCalderaCant ?? 1);

  /* ── Calentador Eléctrico ── */
  const [modoCE,          setModoCE]          = useState(datosPrevios.modoCE          ?? "recomendado");
  const [filtroCEMarca,   setFiltroCEMarca]   = useState("todas");
  const [selManualCEId,   setSelManualCEId]   = useState(datosPrevios.selManualCEId   ?? null);
  const [selManualCECant, setSelManualCECant] = useState(datosPrevios.selManualCECant ?? 1);

  const toggleSistema = (key) => {
    setSistemasSeleccionados(prev => {
      if (prev[key]) { const next = { ...prev }; delete next[key]; return next; }
      return { ...prev, [key]: SISTEMA_DEFAULTS() };
    });
  };

  const updateSistemaField = (key, field, value) => {
    setSistemasSeleccionados(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  const cambiarSeccionConAnimacion = (nuevaSeccion) => {
    setAnimandoSalida(true);
    setTimeout(() => { setAnimandoSalida(false); setSeccion(nuevaSeccion); }, 220);
  };

  const sistemaCalentamientoCompleto = useMemo(() => {
    const keys = Object.keys(sistemasSeleccionados);
    if (keys.length === 0) return false;
    return keys.every(k => {
      const s = sistemasSeleccionados[k];
      const base = s.distancia !== "" && s.alturaVertical !== "";
      if (k === "caldera" || k === "calentadorElectrico") return base && s.tasaElevacion !== null;
      return base;
    });
  }, [sistemasSeleccionados]);

  const calentamientoCompleto = () => {
    if (!ciudad) return false;
    if (tempDeseada === null || tempDeseada <= 0) return false;
    if (!Object.values(mesesCalentar).some(v => v)) return false;
    if (cubierta === null) return false;
    if (techada === null) return false;
    // usarBombaCalentamiento bloqueado — módulo próximamente
    if (!sistemaCalentamientoCompleto) return false;
    return true;
  };

  const obtenerErroresCalentamiento = () => {
    const errores = {};
    if (!ciudad) errores.ciudad = true;
    if (tempDeseada === null || tempDeseada <= 0) errores.tempDeseada = true;
    if (!Object.values(mesesCalentar).some(v => v)) errores.meses = true;
    if (cubierta === null) errores.cubierta = true;
    if (techada === null) errores.techada = true;
    // usarBombaCalentamiento bloqueado — módulo próximamente
    if (!sistemaCalentamientoCompleto) errores.sistemasCalentamiento = true;
    return errores;
  };

  const errores = obtenerErroresCalentamiento();

  const ciudadesMexico = [
    { key: "guadalajara", label: "Guadalajara" }, { key: "mexicali", label: "Mexicali" },
    { key: "losCabos", label: "Los Cabos" }, { key: "hermosillo", label: "Hermosillo" },
    { key: "chihuahua", label: "Chihuahua" }, { key: "torreon", label: "Torreón" },
    { key: "monterrey", label: "Monterrey" }, { key: "tampico", label: "Tampico" },
    { key: "veracruz", label: "Veracruz" }, { key: "sanLuisPotosi", label: "San Luis Potosí" },
    { key: "durango", label: "Durango" }, { key: "culiacan", label: "Culiacán" },
    { key: "tepic", label: "Tepic" }, { key: "colima", label: "Colima" },
    { key: "aguascalientes", label: "Aguascalientes" }, { key: "zacatecas", label: "Zacatecas" },
    { key: "morelia", label: "Morelia" }, { key: "leon", label: "León" },
    { key: "queretaro", label: "Querétaro" }, { key: "pachuca", label: "Pachuca" },
    { key: "ciudadDeMexico", label: "Ciudad de México" }, { key: "acapulco", label: "Acapulco" },
    { key: "cuernavaca", label: "Cuernavaca" }, { key: "puebla", label: "Puebla" },
    { key: "tlaxcala", label: "Tlaxcala" }, { key: "oaxaca", label: "Oaxaca" },
    { key: "villahermosa", label: "Villahermosa" }, { key: "tuxtlaGutierrez", label: "Tuxtla Gutierrez" },
    { key: "campeche", label: "Campeche" }, { key: "merida", label: "Mérida" },
    { key: "cancun", label: "Cancún" }, { key: "manzanillo", label: "Manzanillo" },
    { key: "puertoVallarta", label: "Puerto Vallarta" },
  ];

  const clima = useMemo(() => { if (!ciudad) return []; return getClimaMensual(ciudad); }, [ciudad]);

  const datosTermicos = useMemo(() => ({
    area: areaTotal, volumen: volumenTotal, profundidad: profundidadPromedio,
    tempDeseada, techada, cubierta
  }), [areaTotal, volumenTotal, profundidadPromedio, tempDeseada, techada, cubierta]);

  const profMaxSistema = useMemo(() => {
    if (!sistemaActivo?.cuerpos?.length) return 0;
    return Math.max(...sistemaActivo.cuerpos.map(c => Math.max(parseFloat(c.profMin) || 0, parseFloat(c.profMax) || 0)));
  }, [sistemaActivo]);


  const mesMasFrio = useMemo(() => {
      const sel = clima.filter(m => mesesCalentar[m.mes]);
      if (!sel.length) return null;
      if (!tempDeseada || areaTotal <= 0) {
        return sel.reduce((f, a) => a.tProm < f.tProm ? a : f);
      }
      const dt = { area: areaTotal, volumen: volumenTotal, profundidad: profundidadPromedio, tempDeseada, techada, cubierta };
      const conPerdida = sel.map(m => {
        try {
          const ev  = qEvaporacion(dt, m)  || 0;
          const con = qConveccion(dt, m)   || 0;
          const rad = qRadiacion(dt, m)    || 0;
          const tra = qTransmision({ area: areaTotal, profMax: profMaxSistema, tempDeseada }, m) || 0;
          const inf = (() => {
            if (!sistemaActivo) return 0;
            if (sistemaActivo.desborde !== "infinity" && sistemaActivo.desborde !== "ambos") return 0;
            const largo = parseFloat(sistemaActivo.largoInfinity) || 0;
            if (largo <= 0 || profMaxSistema <= 0) return 0;
            return qInfinity({ profMin: 0, profMax: profMaxSistema, largoInfinity: largo, tempDeseada }, m) || 0;
          })();
          const can = (() => {
            if (!sistemaActivo) return 0;
            if (sistemaActivo.desborde !== "canal" && sistemaActivo.desborde !== "ambos") return 0;
            const largo = parseFloat(sistemaActivo.largoCanal) || 0;
            if (largo <= 0) return 0;
            return qCanal({ largoCanal: largo, tempDeseada }, m) || 0;
          })();
          return { ...m, perdidaTotal: ev + con + rad + tra + inf + can };
        } catch { return { ...m, perdidaTotal: 0 }; }
      });
      return conPerdida.reduce((max, a) => a.perdidaTotal > max.perdidaTotal ? a : max);
    }, [clima, mesesCalentar, tempDeseada, areaTotal, volumenTotal, profundidadPromedio,
        techada, cubierta, profMaxSistema, sistemaActivo]);

  // Tabla completa de todos los meses con pérdida calculada — para memoria de cálculo
  const tablaClimaConPerdida = useMemo(() => {
    if (!clima.length || !tempDeseada || areaTotal <= 0) return clima.map(m => ({ ...m, perdidaClima: 0 }));
    const dt = { area: areaTotal, volumen: volumenTotal, profundidad: profundidadPromedio, tempDeseada, techada, cubierta };
    return clima.map(m => {
      try {
        const ev  = qEvaporacion(dt, m)  || 0;
        const con = qConveccion(dt, m)   || 0;
        const rad = qRadiacion(dt, m)    || 0;
        const tra = qTransmision({ area: areaTotal, profMax: profMaxSistema, tempDeseada }, m) || 0;
        const inf = (sistemaActivo?.desborde === "infinity" || sistemaActivo?.desborde === "ambos")
          ? (qInfinity({ profMin: 0, profMax: profMaxSistema, largoInfinity: parseFloat(sistemaActivo.largoInfinity)||0, tempDeseada }, m) || 0) : 0;
        const can = (sistemaActivo?.desborde === "canal" || sistemaActivo?.desborde === "ambos")
          ? (qCanal({ largoCanal: parseFloat(sistemaActivo.largoCanal)||0, tempDeseada }, m) || 0) : 0;
        return { ...m, perdidaClima: Math.round(ev + con + rad + tra + inf + can) };
      } catch { return { ...m, perdidaClima: 0 }; }
    });
  }, [clima, tempDeseada, areaTotal, volumenTotal, profundidadPromedio, techada, cubierta, profMaxSistema, sistemaActivo]);

  const perdidaEvaporacion = useMemo(() => (!mesMasFrio || !tempDeseada || areaTotal <= 0) ? 0 : qEvaporacion(datosTermicos, mesMasFrio),  [datosTermicos, mesMasFrio, tempDeseada, areaTotal]);
  const perdidaConveccion  = useMemo(() => (!mesMasFrio || !tempDeseada || areaTotal <= 0) ? 0 : qConveccion(datosTermicos, mesMasFrio),   [datosTermicos, mesMasFrio, tempDeseada, areaTotal]);
  const perdidaRadiacion   = useMemo(() => (!mesMasFrio || !tempDeseada || areaTotal <= 0) ? 0 : qRadiacion(datosTermicos, mesMasFrio),    [datosTermicos, mesMasFrio, tempDeseada, areaTotal]);
  const perdidaTransmision = useMemo(() => (!mesMasFrio || !tempDeseada || areaTotal <= 0) ? 0 : qTransmision({ area: areaTotal, profMax: profMaxSistema, tempDeseada }, mesMasFrio), [mesMasFrio, tempDeseada, areaTotal, profMaxSistema]);

  const perdidaInfinity = useMemo(() => {
    if (!mesMasFrio || !tempDeseada || !sistemaActivo) return 0;
    if (sistemaActivo.desborde !== "infinity" && sistemaActivo.desborde !== "ambos") return 0;
    const largoInfinity = parseFloat(sistemaActivo.largoInfinity) || 0;
    if (largoInfinity <= 0 || profMaxSistema <= 0) return 0;
    return qInfinity({ profMin: 0, profMax: profMaxSistema, largoInfinity, tempDeseada }, mesMasFrio);
  }, [mesMasFrio, tempDeseada, sistemaActivo, profMaxSistema]);

  const perdidaCanal = useMemo(() => {
    if (!mesMasFrio || !tempDeseada || !sistemaActivo) return 0;
    if (sistemaActivo.desborde !== "canal" && sistemaActivo.desborde !== "ambos") return 0;
    const largoCanal = parseFloat(sistemaActivo.largoCanal) || 0;
    if (largoCanal <= 0) return 0;
    return qCanal({ largoCanal, tempDeseada }, mesMasFrio);
  }, [mesMasFrio, tempDeseada, sistemaActivo]);

  const tipoRetorno = tipoRetornoExterno ?? "1.5";

  const resultadoRetorno = useMemo(() => {
    if (!sistemaActivo?.cuerpos?.length) return null;
    if (!tempDeseada || !mesMasFrio) return null;
    const flujoMax = calcularFlujoMaximo(sistemaActivo);
    if (flujoMax <= 0) return null;
    const datosParaRetorno = {
      area: areaTotal,
      profMin: Math.min(...sistemaActivo.cuerpos.map(c => parseFloat(c.profMin) || 0)),
      profMax: profMaxSistema,
      distCuarto: parseFloat(sistemaActivo.distCuarto) || 0,
    };
    try {
      return retorno(flujoMax, tipoRetorno, datosParaRetorno);
    } catch (e) { console.error("Error en retorno():", e); return null; }
  }, [sistemaActivo, areaTotal, profMaxSistema, tipoRetorno, tempDeseada, mesMasFrio]);

  const perdidaTuberiaBase = useMemo(() => {
    if (!resultadoRetorno || !mesMasFrio || !tempDeseada) return 0;
    const resumenTramosR   = resultadoRetorno.resumenTramosR   ?? {};
    const resumenDisparosR = resultadoRetorno.resumenDisparosR ?? {};
    const resultado = qTuberia(resumenTramosR, resumenDisparosR, {}, { tempDeseada }, mesMasFrio);
    return resultado.total_BTU_h ?? 0;
  }, [resultadoRetorno, mesMasFrio, tempDeseada]);

  const perdidaTotalPaso1 = useMemo(() =>
    perdidaEvaporacion + perdidaConveccion + perdidaRadiacion +
    perdidaTransmision + perdidaInfinity   + perdidaCanal    + perdidaTuberiaBase,
  [perdidaEvaporacion, perdidaConveccion, perdidaRadiacion, perdidaTransmision, perdidaInfinity, perdidaCanal, perdidaTuberiaBase]);

  const alturaBDCEfectiva = useMemo(() => {
    if (!sistemasSeleccionados.bombaCalor) return 0;
    return parseFloat(sistemasSeleccionados.bombaCalor.alturaVertical) || 0;
  }, [sistemasSeleccionados]);

  const alturaPSEfectiva = useMemo(() => {
    if (!sistemasSeleccionados.panelSolar) return 0;
    return parseFloat(sistemasSeleccionados.panelSolar.alturaVertical) || 0;
  }, [sistemasSeleccionados]);

  const alturaCalderaEfectiva = useMemo(() => {
    if (!sistemasSeleccionados.caldera) return 0;
    return parseFloat(sistemasSeleccionados.caldera.alturaVertical) || 0;
  }, [sistemasSeleccionados]);

  const alturaCEEfectiva = useMemo(() => {
    if (!sistemasSeleccionados.calentadorElectrico) return 0;
    return parseFloat(sistemasSeleccionados.calentadorElectrico.alturaVertical) || 0;
  }, [sistemasSeleccionados]);

  const alturaMaxSistema = useMemo(() => {
    return Math.max(alturaBDCEfectiva, alturaPSEfectiva, alturaCalderaEfectiva, alturaCEEfectiva);
  }, [alturaBDCEfectiva, alturaPSEfectiva, alturaCalderaEfectiva, alturaCEEfectiva]);

  /* ── Prioridad de carga estática: BDC > caldera > PS en caso de empate.
     A cada función se le pasa su alturaMaxSistema "efectivo":
       - Si el equipo ES el ganador → alturaMaxSistema real (su condición abs<0.001 será true)
       - Si el equipo NO es el ganador → alturaMaxSistema + 1000 (su condición será false)
     De este modo solo un equipo lleva la carga estática, incluso en empate. ── */
  const alturaMaxParaBDC = useMemo(() => {
    const bdcEsMax = Math.abs(alturaBDCEfectiva - alturaMaxSistema) < 0.001;
    return bdcEsMax ? alturaMaxSistema : alturaMaxSistema + 1000;
  }, [alturaBDCEfectiva, alturaMaxSistema]);

  const alturaMaxParaCaldera = useMemo(() => {
    const bdcEsMax     = Math.abs(alturaBDCEfectiva    - alturaMaxSistema) < 0.001;
    const calderaEsMax = Math.abs(alturaCalderaEfectiva - alturaMaxSistema) < 0.001;
    // Caldera gana solo si es la más alta Y BDC no empata
    return (calderaEsMax && !bdcEsMax) ? alturaMaxSistema : alturaMaxSistema + 1000;
  }, [alturaBDCEfectiva, alturaCalderaEfectiva, alturaMaxSistema]);

  const alturaMaxParaPS = useMemo(() => {
    const bdcEsMax     = Math.abs(alturaBDCEfectiva    - alturaMaxSistema) < 0.001;
    const calderaEsMax = Math.abs(alturaCalderaEfectiva - alturaMaxSistema) < 0.001;
    const ceEsMax      = Math.abs(alturaCEEfectiva      - alturaMaxSistema) < 0.001;
    const psEsMax      = Math.abs(alturaPSEfectiva      - alturaMaxSistema) < 0.001;
    // PS gana solo si es la más alta Y BDC, caldera y CE no empatan
    return (psEsMax && !bdcEsMax && !calderaEsMax && !ceEsMax) ? alturaMaxSistema : alturaMaxSistema + 1000;
  }, [alturaBDCEfectiva, alturaCalderaEfectiva, alturaCEEfectiva, alturaPSEfectiva, alturaMaxSistema]);

  const alturaMaxParaCE = useMemo(() => {
    const bdcEsMax     = Math.abs(alturaBDCEfectiva    - alturaMaxSistema) < 0.001;
    const calderaEsMax = Math.abs(alturaCalderaEfectiva - alturaMaxSistema) < 0.001;
    const ceEsMax      = Math.abs(alturaCEEfectiva      - alturaMaxSistema) < 0.001;
    // CE gana solo si es la más alta Y BDC y caldera no empatan
    return (ceEsMax && !bdcEsMax && !calderaEsMax) ? alturaMaxSistema : alturaMaxSistema + 1000;
  }, [alturaBDCEfectiva, alturaCalderaEfectiva, alturaCEEfectiva, alturaMaxSistema]);

  const bdcPaso1 = useMemo(() => {
    if (!sistemasSeleccionados.bombaCalor) return null;
    if (perdidaTotalPaso1 <= 0) return null;
    const distancia      = parseFloat(sistemasSeleccionados.bombaCalor.distancia)      || 0;
    const alturaVertical = parseFloat(sistemasSeleccionados.bombaCalor.alturaVertical) || 0;
    try { return bombaDeCalor(perdidaTotalPaso1, distancia, alturaVertical, alturaMaxParaBDC); }
    catch (e) { console.error("Error en bombaDeCalor() paso 1:", e); return null; }
  }, [sistemasSeleccionados, perdidaTotalPaso1, alturaMaxSistema]);

  const resumenBDCR = useMemo(() => {
    if (!bdcPaso1?.resumenMaterialesTuberia) return {};
    return Object.fromEntries(
      bdcPaso1.resumenMaterialesTuberia.map(({ tuberia, tuberia_m, tees, codos, reducciones }) => [
        tuberia,
        { tuberia_m: parseFloat(tuberia_m) || 0, tees: Number(tees) || 0, codos: Number(codos) || 0, reducciones: Number(reducciones) || 0 }
      ])
    );
  }, [bdcPaso1]);

  const resumenBDCRFinal = useMemo(() => {
    if (modoBDC === "manual" && selManualBDCId) {
      const bombaElegida = bombasCalor.find(b => b.id === selManualBDCId);
      if (bombaElegida) {
        const distancia      = parseFloat(sistemasSeleccionados.bombaCalor?.distancia)      || 0;
        const alturaVertical = parseFloat(sistemasSeleccionados.bombaCalor?.alturaVertical) || 0;
        try {
          const hid = calcularCargaManual(bombaElegida.specs.flujo, selManualCantidad, distancia, alturaVertical, alturaMaxParaBDC);
          if (!hid?.error && hid.resumenMaterialesTuberia) {
            return Object.fromEntries(
              hid.resumenMaterialesTuberia.map(({ tuberia, tuberia_m, tees, codos, reducciones }) => [
                tuberia,
                { tuberia_m: parseFloat(tuberia_m) || 0, tees: Number(tees) || 0, codos: Number(codos) || 0, reducciones: Number(reducciones) || 0 }
              ])
            );
          }
        } catch { /* fall through to auto */ }
      }
    }
    return resumenBDCR;
  }, [modoBDC, selManualBDCId, selManualCantidad, sistemasSeleccionados, resumenBDCR]);

  const marcasDisponibles = useMemo(() =>
    ["todas", ...new Set(bombasCalor.filter(b => b.metadata.activo).map(b => b.marca))],
  []);

  const catalogoFiltrado = useMemo(() =>
    bombasCalor.filter(b => {
      if (!b.metadata.activo) return false;
      if (filtroBDCMarca !== "todas" && b.marca !== filtroBDCMarca) return false;
      if (filtroBDCVelocidad !== "todas" && b.specs.velocidad !== filtroBDCVelocidad) return false;
      return true;
    }),
  [filtroBDCMarca, filtroBDCVelocidad]);

  const psPaso1 = useMemo(() => {
    if (!sistemasSeleccionados.panelSolar) return null;
    if (perdidaTotalPaso1 <= 0) return null;
    const distancia = parseFloat(sistemasSeleccionados.panelSolar.distancia)     || 0;
    const alturaPS  = parseFloat(sistemasSeleccionados.panelSolar.alturaVertical) || 0;
    try { return panelSolar(perdidaTotalPaso1, distancia, alturaPS, alturaMaxParaPS); }
    catch (e) { console.error("Error en psPaso1():", e); return null; }
  }, [sistemasSeleccionados, perdidaTotalPaso1, alturaMaxSistema]);

  /* ── Caldera PASO 1: selección preliminar para obtener tubería ── */
  const calderaPaso1 = useMemo(() => {
    if (!sistemasSeleccionados.caldera) return null;
    if (perdidaTotalPaso1 <= 0) return null;
    if (!volumenTotal || volumenTotal <= 0) return null;
    const tasaElevacion  = sistemasSeleccionados.caldera.tasaElevacion;
    if (!tasaElevacion) return null;
    const distancia      = parseFloat(sistemasSeleccionados.caldera.distancia)      || 0;
    const alturaVertical = parseFloat(sistemasSeleccionados.caldera.alturaVertical) || 0;
    try {
      return calcularCaldera(volumenTotal, tasaElevacion, perdidaTotalPaso1, distancia, alturaVertical, alturaMaxParaCaldera);
    } catch (e) { console.error("Error en calderaPaso1():", e); return null; }
  }, [sistemasSeleccionados, perdidaTotalPaso1, alturaMaxSistema, volumenTotal]);

  /* ── Calentador Eléctrico PASO 1 ── */
  const cePaso1 = useMemo(() => {
    if (!sistemasSeleccionados.calentadorElectrico) return null;
    if (perdidaTotalPaso1 <= 0) return null;
    if (!volumenTotal || volumenTotal <= 0) return null;
    const tasaElevacion  = sistemasSeleccionados.calentadorElectrico.tasaElevacion;
    if (!tasaElevacion) return null;
    const distancia      = parseFloat(sistemasSeleccionados.calentadorElectrico.distancia)      || 0;
    const alturaVertical = parseFloat(sistemasSeleccionados.calentadorElectrico.alturaVertical) || 0;
    try {
      return calcularCE(volumenTotal, tasaElevacion, perdidaTotalPaso1, distancia, alturaVertical, alturaMaxParaCE);
    } catch (e) { console.error("Error en cePaso1():", e); return null; }
  }, [sistemasSeleccionados, perdidaTotalPaso1, alturaMaxParaCE, volumenTotal]);

  const resumenPSRFinal = useMemo(() => {
    if (!psPaso1?.hidraulica?.resumenMaterialesTuberia) return {};
    return Object.fromEntries(
      psPaso1.hidraulica.resumenMaterialesTuberia.map(({ tuberia, tuberia_m, tees, codos, reducciones }) => [
        tuberia,
        { tuberia_m: parseFloat(tuberia_m) || 0, tees: Number(tees) || 0, codos: Number(codos) || 0, reducciones: Number(reducciones) || 0 }
      ])
    );
  }, [psPaso1]);

  /* ── Resumen tubería caldera paso 1 ── */
  const resumenCalderaRFinal = useMemo(() => {
    if (!calderaPaso1?.resumenMaterialesTuberia) return {};
    return Object.fromEntries(
      calderaPaso1.resumenMaterialesTuberia.map(({ tuberia, tuberia_m, tees, codos, reducciones }) => [
        tuberia,
        { tuberia_m: parseFloat(tuberia_m) || 0, tees: Number(tees) || 0, codos: Number(codos) || 0, reducciones: Number(reducciones) || 0 }
      ])
    );
  }, [calderaPaso1]);

  /* ── Resumen tubería CE paso 1 ── */
  const resumenCERFinal = useMemo(() => {
    if (!cePaso1?.resumenMaterialesTuberia) return {};
    return Object.fromEntries(
      cePaso1.resumenMaterialesTuberia.map(({ tuberia, tuberia_m, tees, codos, reducciones }) => [
        tuberia,
        { tuberia_m: parseFloat(tuberia_m) || 0, tees: Number(tees) || 0, codos: Number(codos) || 0, reducciones: Number(reducciones) || 0 }
      ])
    );
  }, [cePaso1]);

  const resumenCalentadoresR = useMemo(() => {
    const combinado = { ...resumenBDCRFinal };
    const fuentes = [resumenPSRFinal, resumenCalderaRFinal, resumenCERFinal];
    for (const fuente of fuentes) {
      for (const [diam, vals] of Object.entries(fuente)) {
        if (!combinado[diam]) {
          combinado[diam] = { ...vals };
        } else {
          combinado[diam] = {
            tuberia_m:   (combinado[diam].tuberia_m   || 0) + (vals.tuberia_m   || 0),
            tees:        (combinado[diam].tees        || 0) + (vals.tees        || 0),
            codos:       (combinado[diam].codos       || 0) + (vals.codos       || 0),
            reducciones: (combinado[diam].reducciones || 0) + (vals.reducciones || 0),
          };
        }
      }
    }
    return combinado;
  }, [resumenBDCRFinal, resumenPSRFinal, resumenCalderaRFinal, resumenCERFinal]);

  const perdidaTuberia = useMemo(() => {
    if (!resultadoRetorno || !mesMasFrio || !tempDeseada) return 0;
    const resumenTramosR   = resultadoRetorno.resumenTramosR   ?? {};
    const resumenDisparosR = resultadoRetorno.resumenDisparosR ?? {};
    const resultado = qTuberia(resumenTramosR, resumenDisparosR, resumenCalentadoresR, { tempDeseada }, mesMasFrio);
    return resultado.total_BTU_h ?? 0;
  }, [resultadoRetorno, resumenCalentadoresR, mesMasFrio, tempDeseada]);

  const perdidasBTU = useMemo(() => ({
    evaporacion: perdidaEvaporacion, conveccion: perdidaConveccion,
    radiacion:   perdidaRadiacion,   transmision: perdidaTransmision,
    infinity:    perdidaInfinity,    canal: perdidaCanal,
    tuberia:     perdidaTuberia,
  }), [perdidaEvaporacion, perdidaConveccion, perdidaRadiacion, perdidaTransmision, perdidaInfinity, perdidaCanal, perdidaTuberia]);

  const perdidaTotalBTU = useMemo(() => Object.values(perdidasBTU).reduce((a, b) => a + b, 0), [perdidasBTU]);

  const psSeleccionado = useMemo(() => {
    if (!sistemasSeleccionados.panelSolar) return null;
    if (perdidaTotalBTU <= 0) return null;
    const distancia = parseFloat(sistemasSeleccionados.panelSolar.distancia)     || 0;
    const alturaPS  = parseFloat(sistemasSeleccionados.panelSolar.alturaVertical) || 0;
    try { return panelSolar(perdidaTotalBTU, distancia, alturaPS, alturaMaxParaPS); }
    catch (e) { console.error("Error en psSeleccionado():", e); return null; }
  }, [sistemasSeleccionados, perdidaTotalBTU, alturaMaxSistema]);

  const psManual = useMemo(() => {
    if (!sistemasSeleccionados.panelSolar) return null;
    if (perdidaTotalBTU <= 0) return null;
    const distancia = parseFloat(sistemasSeleccionados.panelSolar.distancia)     || 0;
    const alturaPS  = parseFloat(sistemasSeleccionados.panelSolar.alturaVertical) || 0;
    if (modoPS === "recomendado") return null;
    if (selManualPSCant && selManualPSCant > 0) {
      try {
        const res = calcularPanelSolarManual(selManualPSCant, distancia, alturaPS, alturaMaxParaPS, perdidaTotalBTU);
        return res?.error ? null : res;
      } catch { return null; }
    }
    if (psSeleccionado && [30, 60, 100].includes(selManualPSPct)) {
      const key = `p${selManualPSPct}`;
      const opcion = psSeleccionado.opciones?.[key];
      if (!opcion) return null;
      const capTotal = opcion.capTotal;
      const exceso   = capTotal - perdidaTotalBTU;
      const cubre    = capTotal >= perdidaTotalBTU;
      return {
        panel:        psSeleccionado.panel,
        totalPaneles: opcion.cantidad,
        capUnitaria:  psSeleccionado.panel.specs.capacidadCalentamiento,
        capTotal,
        exceso:       exceso.toFixed(2),
        cubre,
        porcentaje:   selManualPSPct,
        flujoTotal:   opcion.flujoTotal,
        tandems:      opcion.tandems,
        hidraulica:   opcion.hidraulica,
      };
    }
    return null;
  }, [modoPS, selManualPSPct, selManualPSCant, psSeleccionado, sistemasSeleccionados, perdidaTotalBTU, alturaBDCEfectiva]);

  const psEfectivo = useMemo(() => {
    if (!sistemasSeleccionados.panelSolar) return null;
    if (modoPS === "manual" && psManual) return psManual.hidraulica;
    return psSeleccionado?.hidraulica ?? null;
  }, [modoPS, psManual, psSeleccionado, sistemasSeleccionados]);

  /* ── Caldera recomendada: paso 2 con demanda real ── */
  const calderaSeleccionada = useMemo(() => {
    if (!sistemasSeleccionados.caldera) return null;
    if (perdidaTotalBTU <= 0) return null;
    if (!volumenTotal || volumenTotal <= 0) return null;
    const tasaElevacion  = sistemasSeleccionados.caldera.tasaElevacion;
    if (!tasaElevacion) return null;
    const distancia      = parseFloat(sistemasSeleccionados.caldera.distancia)      || 0;
    const alturaVertical = parseFloat(sistemasSeleccionados.caldera.alturaVertical) || 0;
    try { return calcularCaldera(volumenTotal, tasaElevacion, perdidaTotalBTU, distancia, alturaVertical, alturaMaxParaCaldera); }
    catch (e) { console.error("Error en calderaSeleccionada():", e); return null; }
  }, [sistemasSeleccionados, perdidaTotalBTU, alturaMaxSistema, volumenTotal]);

  /* ── Catálogo caldera filtrado ── */
  const marcasCalderaDisponibles = useMemo(() =>
    ["todas", ...new Set(calderasGas.filter(c => c.metadata.activo).map(c => c.marca))],
  []);

  const catalogoCalderaFiltrado = useMemo(() =>
    calderasGas.filter(c => {
      if (!c.metadata.activo) return false;
      if (filtroCalderaMarca   !== "todas" && c.marca     !== filtroCalderaMarca)   return false;
      if (filtroCalderaTipoGas !== "todos" && c.tipoGas   !== filtroCalderaTipoGas) return false;
      return true;
    }),
  [filtroCalderaMarca, filtroCalderaTipoGas]);

  /* ── Caldera manual ── */
  const calderaManual = useMemo(() => {
    if (!selManualCalderaId || perdidaTotalBTU <= 0) return null;
    if (!volumenTotal || volumenTotal <= 0) return null;
    const tasaElevacion  = sistemasSeleccionados.caldera?.tasaElevacion;
    if (!tasaElevacion) return null;
    const distancia      = parseFloat(sistemasSeleccionados.caldera?.distancia)      || 0;
    const alturaVertical = parseFloat(sistemasSeleccionados.caldera?.alturaVertical) || 0;
    try {
      return calcularCalderaManual(
        selManualCalderaId, selManualCalderaCant,
        volumenTotal, tasaElevacion, perdidaTotalBTU,
        distancia, alturaVertical, alturaMaxParaCaldera
      );
    } catch { return null; }
  }, [selManualCalderaId, selManualCalderaCant, perdidaTotalBTU, sistemasSeleccionados, volumenTotal, alturaMaxSistema]);

  /* ── Caldera efectiva ── */
  const calderaEfectiva = useMemo(() => {
    if (!sistemasSeleccionados.caldera) return null;
    if (modoCaldera === "manual" && calderaManual) return calderaManual.hidraulica;
    return calderaSeleccionada;
  }, [modoCaldera, calderaManual, calderaSeleccionada, sistemasSeleccionados]);

  const bdcSeleccionada = useMemo(() => {
    if (!sistemasSeleccionados.bombaCalor) return null;
    if (perdidaTotalBTU <= 0) return null;
    const distancia      = parseFloat(sistemasSeleccionados.bombaCalor.distancia)      || 0;
    const alturaVertical = parseFloat(sistemasSeleccionados.bombaCalor.alturaVertical) || 0;
    try { return bombaDeCalor(perdidaTotalBTU, distancia, alturaVertical, alturaMaxParaBDC); }
    catch (e) { console.error("Error en bombaDeCalor() paso 2:", e); return null; }
  }, [sistemasSeleccionados, perdidaTotalBTU, alturaMaxSistema]);

  const bdcManual = useMemo(() => {
    if (!selManualBDCId || perdidaTotalBTU <= 0) return null;
    const bombaElegida = bombasCalor.find(b => b.id === selManualBDCId);
    if (!bombaElegida) return null;
    const distancia      = parseFloat(sistemasSeleccionados.bombaCalor?.distancia)      || 0;
    const alturaVertical = parseFloat(sistemasSeleccionados.bombaCalor?.alturaVertical) || 0;
    const capTotal      = bombaElegida.specs.capacidadCalentamiento * selManualCantidad;
    const exceso        = capTotal - perdidaTotalBTU;
    const cubre         = capTotal >= perdidaTotalBTU;
    const flujoPorBomba = bombaElegida.specs.flujo;
    const flujoTotal    = flujoPorBomba * selManualCantidad;
    try {
      const hidraulica = calcularCargaManual(flujoPorBomba, selManualCantidad, distancia, alturaVertical, alturaMaxParaBDC);
      if (hidraulica?.error) return null;
      return { bomba: bombaElegida, cantidad: selManualCantidad, capTotal, exceso, cubre, flujoTotal, hidraulica };
    } catch { return null; }
  }, [selManualBDCId, selManualCantidad, perdidaTotalBTU, sistemasSeleccionados]);

  const bdcEfectiva = useMemo(() => {
    if (!sistemasSeleccionados.bombaCalor) return null;
    if (modoBDC === "manual" && bdcManual) return bdcManual.hidraulica;
    return bdcSeleccionada;
  }, [modoBDC, bdcManual, bdcSeleccionada, sistemasSeleccionados]);

  /* ── CE paso 2 con demanda real ── */
  const ceSeleccionado = useMemo(() => {
    if (!sistemasSeleccionados.calentadorElectrico) return null;
    if (perdidaTotalBTU <= 0) return null;
    if (!volumenTotal || volumenTotal <= 0) return null;
    const tasaElevacion  = sistemasSeleccionados.calentadorElectrico.tasaElevacion;
    if (!tasaElevacion) return null;
    const distancia      = parseFloat(sistemasSeleccionados.calentadorElectrico.distancia)      || 0;
    const alturaVertical = parseFloat(sistemasSeleccionados.calentadorElectrico.alturaVertical) || 0;
    try { return calcularCE(volumenTotal, tasaElevacion, perdidaTotalBTU, distancia, alturaVertical, alturaMaxParaCE); }
    catch (e) { console.error("Error en ceSeleccionado():", e); return null; }
  }, [sistemasSeleccionados, perdidaTotalBTU, alturaMaxParaCE, volumenTotal]);

  const marcasCEDisponibles = useMemo(() =>
    ["todas", ...new Set(calentadoresElectricos.filter(c => c.metadata.activo).map(c => c.marca))],
  []);

  const catalogoCEFiltrado = useMemo(() =>
    calentadoresElectricos.filter(c => {
      if (!c.metadata.activo) return false;
      if (filtroCEMarca !== "todas" && c.marca !== filtroCEMarca) return false;
      return true;
    }),
  [filtroCEMarca]);

  const ceManual = useMemo(() => {
    if (!selManualCEId || perdidaTotalBTU <= 0) return null;
    if (!volumenTotal || volumenTotal <= 0) return null;
    const tasaElevacion  = sistemasSeleccionados.calentadorElectrico?.tasaElevacion;
    if (!tasaElevacion) return null;
    const distancia      = parseFloat(sistemasSeleccionados.calentadorElectrico?.distancia)      || 0;
    const alturaVertical = parseFloat(sistemasSeleccionados.calentadorElectrico?.alturaVertical) || 0;
    try {
      return calcularCEManual(
        selManualCEId, selManualCECant,
        volumenTotal, tasaElevacion, perdidaTotalBTU,
        distancia, alturaVertical, alturaMaxParaCE
      );
    } catch { return null; }
  }, [selManualCEId, selManualCECant, perdidaTotalBTU, sistemasSeleccionados, volumenTotal, alturaMaxParaCE]);

  const ceEfectivo = useMemo(() => {
    if (!sistemasSeleccionados.calentadorElectrico) return null;
    if (modoCE === "manual" && ceManual) return ceManual.hidraulica;
    return ceSeleccionado;
  }, [modoCE, ceManual, ceSeleccionado, sistemasSeleccionados]);

  useEffect(() => {
    if (selManualBDCId && !catalogoFiltrado.find(b => b.id === selManualBDCId)) {
      setSelManualBDCId(null); setSelManualCantidad(1);
    }
  }, [catalogoFiltrado, selManualBDCId]);

  useEffect(() => {
    if (selManualCalderaId && !catalogoCalderaFiltrado.find(c => c.id === selManualCalderaId)) {
      setSelManualCalderaId(null); setSelManualCalderaCant(1);
    }
  }, [catalogoCalderaFiltrado, selManualCalderaId]);

  useEffect(() => {
    if (selManualCEId && !catalogoCEFiltrado.find(c => c.id === selManualCEId)) {
      setSelManualCEId(null); setSelManualCECant(1);
    }
  }, [catalogoCEFiltrado, selManualCEId]);

  /* ── Save a datosPorSistema ──────────────────────────────────────────────
     Usamos un ref para siempre tener los valores frescos, pero el useEffect
     solo se dispara cuando cambia algo de cálculo real (no UI como hoveredField).
     Esto evita que interacciones de UI (hover, foco) disparen todo el árbol. ── */
  const saveRef = useRef({});
  saveRef.current = {
    decision, usarBombaCalentamiento, ciudad, tempDeseada, cubierta, techada,
    mesesCalentar, perdidasBTU, perdidaTotalBTU, sistemasSeleccionados,
    modoBDC, selManualBDCId, selManualCantidad,
    modoPS, selManualPSPct, selManualPSCant,
    modoCaldera, selManualCalderaId, selManualCalderaCant,
    modoCE, selManualCEId, selManualCECant,
    resultadoRetorno, bdcSeleccionada, bdcManual, bdcEfectiva,
    psSeleccionado, psManual, psEfectivo,
    calderaSeleccionada, calderaManual, calderaEfectiva,
    ceSeleccionado, ceManual, ceEfectivo,
  };

  useEffect(() => {
    const s = saveRef.current;
    setDatosPorSistema(prev => ({
      ...prev,
      calentamiento: {
        decision:              s.decision,
        usarBombaCalentamiento: s.usarBombaCalentamiento,
        ciudad:                s.ciudad,
        tempDeseada:           s.tempDeseada,
        cubierta:              s.cubierta,
        techada:               s.techada,
        mesesCalentar:         s.mesesCalentar,
        perdidasBTU:           s.perdidasBTU,
        perdidaTotalBTU:       s.perdidaTotalBTU,
        sistemasSeleccionados: s.sistemasSeleccionados,
        // Tabla clima con pérdidas calculadas — para memoria de cálculo
        tablaClima:            tablaClimaConPerdida,
        mesMasFrio:            mesMasFrio,
        // Datos del sistema para perfilTermico en memoria de cálculo
        areaTotal:             areaTotal,
        volumenTotal:          volumenTotal,
        profundidadPromedio:   profundidadPromedio,
        profMaxSistema:        profMaxSistema,
        sistemaActivo:         tipoSistema ?? null,
        desborde:              sistemaActivo?.desborde ?? null,
        largoInfinity:         sistemaActivo?.largoInfinity ?? null,
        largoCanal:            sistemaActivo?.largoCanal ?? null,
        modoBDC:               s.modoBDC,
        selManualBDCId:        s.selManualBDCId,
        selManualCantidad:     s.selManualCantidad,
        resumenTramosR:        s.resultadoRetorno?.resumenTramosR   ?? {},
        resumenDisparosR:      s.resultadoRetorno?.resumenDisparosR ?? {},
        resultadoRetorno: s.resultadoRetorno ?? null, 
        bdcSeleccionada:       s.bdcSeleccionada,
        bdcManual:             s.bdcManual   ?? null,
        bdcEfectiva:           s.bdcEfectiva,
        modoPS:                s.modoPS,
        selManualPSPct:        s.selManualPSPct,
        selManualPSCant:       s.selManualPSCant,
        psSeleccionado:        s.psSeleccionado ?? null,
        psManual:              s.psManual       ?? null,
        psEfectivo:            s.psEfectivo     ?? null,
        modoCaldera:           s.modoCaldera,
        selManualCalderaId:    s.selManualCalderaId,
        selManualCalderaCant:  s.selManualCalderaCant,
        calderaSeleccionada:   s.calderaSeleccionada ?? null,
        calderaManual:         s.calderaManual       ?? null,
        calderaEfectiva:       s.calderaEfectiva     ?? null,
        modoCE:                s.modoCE,
        selManualCEId:         s.selManualCEId,
        selManualCECant:       s.selManualCECant,
        ceSeleccionado:        s.ceSeleccionado ?? null,
        ceManual:              s.ceManual       ?? null,
        ceEfectivo:            s.ceEfectivo     ?? null,
      }
    }));
  }, [
    /* Solo valores de cálculo — NO estados UI como hoveredField */
    decision, usarBombaCalentamiento, ciudad, tempDeseada, cubierta, techada,
    perdidaTotalBTU, sistemasSeleccionados,
    areaTotal, volumenTotal, profundidadPromedio, profMaxSistema,
    tipoSistema, sistemaActivo, mesMasFrio, tablaClimaConPerdida,
    modoBDC, selManualBDCId, selManualCantidad,
    modoPS, selManualPSPct, selManualPSCant,
    modoCaldera, selManualCalderaId, selManualCalderaCant,
    modoCE, selManualCEId, selManualCECant,
    bdcSeleccionada, bdcManual, bdcEfectiva,
    psSeleccionado, psManual, psEfectivo,
    calderaSeleccionada, calderaManual, calderaEfectiva,
    ceSeleccionado, ceManual, ceEfectivo,
    setDatosPorSistema,
  ]);

  useEffect(() => {
    if (clima.length && Object.keys(mesesCalentar).length === 0) {
      const todos = {};
      clima.forEach(m => { todos[m.mes] = true; });
      setMesesCalentar(todos);
    }
  }, [clima]);

  const descripcionesCampos = {
    ciudad: "Ubicación geográfica del proyecto para obtener datos climáticos",
    tempDeseada: "Temperatura objetivo del agua durante la operación",
    cubierta: "La cubierta térmica reduce significativamente pérdidas por evaporación",
    techada: "Un cuerpo de agua techado reduce convección y radiación",
    meses: "Meses del año en los que el sistema deberá aportar energía térmica",
    grafica: "Distribución porcentual de las pérdidas energéticas del sistema",
    usarBombaCalentamiento: "Define si el sistema de calentamiento contará con una motobomba independiente",
    sistemasCalentamiento: "Tipo(s) de fuente de calor. Selecciona uno o varios; cada uno requiere distancia y altura respecto al espejo de agua",
    modoBDC: "Elige si usas la bomba de calor recomendada automáticamente o seleccionas manualmente del catálogo",
    modoPS:  "Elige si usas la cantidad de paneles recomendada o defines manualmente cuántos instalar",
    modoCaldera: "Elige si usas la caldera recomendada automáticamente o seleccionas manualmente del catálogo",
    modoCE:      "Elige si usas el calentador eléctrico recomendado automáticamente o seleccionas manualmente del catálogo",
    default: "Configuración térmica del sistema"
  };

  const pieData = useMemo(() => {
    const entradas = [
      { label: "Evaporación",     valor: perdidasBTU.evaporacion,  color: "rgba(30,64,175,0.85)"   },
      { label: "Convección",      valor: perdidasBTU.conveccion,   color: "rgba(56,189,248,0.85)"  },
      { label: "Radiación",       valor: perdidasBTU.radiacion,    color: "rgba(251,113,133,0.85)" },
      { label: "Transmisión",     valor: perdidasBTU.transmision,  color: "rgba(163,163,163,0.85)" },
      { label: "Infinity",        valor: perdidasBTU.infinity,     color: "rgba(34,197,94,0.85)"   },
      { label: "Canal Perimetral",valor: perdidasBTU.canal,        color: "rgba(96,165,250,0.85)"  },
      { label: "Tubería",         valor: perdidasBTU.tuberia,      color: "rgba(251,191,36,0.85)"  },
    ].filter(e => e.valor > 0);
    return {
      labels: entradas.map(e => e.label),
      datasets: [{
        data: entradas.map(e => e.valor),
        backgroundColor: entradas.map(e => e.color),
        borderColor: "rgba(15,23,42,0.8)", borderWidth: 2,
      }]
    };
  }, [perdidasBTU]);

  /* pieOptions es constante — definida fuera del componente (ver debajo de ChartJS.register) */

  const fmtBTU = (v) => Math.round(v).toLocaleString("es-MX");
  const formularioBloqueado = decision === null;
  const mostrarSelectorBDC = sistemasSeleccionados.bombaCalor && perdidaTotalBTU > 0;
  const mostrarSelectorPS      = sistemasSeleccionados.panelSolar  && perdidaTotalBTU > 0;
  const mostrarSelectorCaldera  = sistemasSeleccionados.caldera && perdidaTotalBTU > 0 && volumenTotal > 0 && !!sistemasSeleccionados.caldera.tasaElevacion;
  const mostrarSelectorCE       = sistemasSeleccionados.calentadorElectrico && perdidaTotalBTU > 0 && volumenTotal > 0 && !!sistemasSeleccionados.calentadorElectrico.tasaElevacion;

  const bdcActivaParaMostrar = useMemo(() => {
    if (modoBDC === "manual" && bdcManual) return bdcManual.hidraulica;
    return bdcSeleccionada;
  }, [modoBDC, bdcManual, bdcSeleccionada]);

  const infoActivaParaMostrar = useMemo(() => {
    if (modoBDC === "manual" && bdcManual) {
      return {
        id:        bdcManual.bomba.id,
        marca:     bdcManual.bomba.marca,
        modelo:    bdcManual.bomba.modelo,
        cantidad:  bdcManual.cantidad,
        capUnitaria: bdcManual.bomba.specs.capacidadCalentamiento,
        capTotal:  bdcManual.capTotal,
        exceso:    bdcManual.exceso,
        flujoTotal: bdcManual.flujoTotal,
        cubre:     bdcManual.cubre,
        cargaTotal:    bdcActivaParaMostrar?.cargaTotal,
        cargaTotalPSI: bdcActivaParaMostrar?.cargaTotalPSI,
      };
    }
    if (bdcSeleccionada && !bdcSeleccionada.error) {
      return {
        id:        bdcSeleccionada.seleccion.id ?? bombasCalor.find(b=>b.marca===bdcSeleccionada.seleccion.marca&&b.modelo===bdcSeleccionada.seleccion.modelo)?.id,
        marca:     bdcSeleccionada.seleccion.marca,
        modelo:    bdcSeleccionada.seleccion.modelo,
        cantidad:  bdcSeleccionada.seleccion.cantidad,
        capUnitaria: bdcSeleccionada.seleccion.capUnitaria,
        capTotal:  bdcSeleccionada.seleccion.capTotal,
        exceso:    parseFloat(bdcSeleccionada.seleccion.exceso),
        flujoTotal: parseFloat(bdcSeleccionada.seleccion.flujoTotal),
        cubre:     true,
        cargaTotal:    bdcSeleccionada.cargaTotal,
        cargaTotalPSI: bdcSeleccionada.cargaTotalPSI,
      };
    }
    return null;
  }, [modoBDC, bdcManual, bdcSeleccionada, bdcActivaParaMostrar]);

  return (
    <div className="form-section hero-wrapper calentamiento">
      <div className="selector-tecnico modo-experto">

        <div className="selector-header">
          <div className="selector-titulo">Calentamiento del sistema</div>
          <div className="selector-subtitulo-tecnico">Análisis térmico y condiciones climáticas</div>
        </div>

        <div className="selector-acciones">
          <button className="btn-secundario" onClick={() => cambiarSeccionConAnimacion("dimensiones")}>
            ← Volver a {nombreSistema}
          </button>
          <div className="aviso-wrapper">
            <button
              className={`btn-primario ${mostrarAviso ? "error" : ""}`}
              onClick={() => {
                if (decision === null) { setMostrarAviso(true); setTimeout(() => setMostrarAviso(false), 2500); return; }
                if (decision === "omitir") { cambiarSeccionConAnimacion("equipamiento"); return; }
                if (!calentamientoCompleto()) { setMostrarErrores(true); setMostrarAviso(true); setTimeout(() => setMostrarAviso(false), 2500); return; }
                cambiarSeccionConAnimacion("equipamiento");
              }}
            >
              Ir a Equipamiento →
            </button>
            {mostrarAviso && (
              <div className="aviso-validacion">
                {decision === null ? "Elige si deseas configurar o omitir el calentamiento" : "Llena toda la información solicitada"}
              </div>
            )}
          </div>
        </div>

        {decision === null && (
          <div className="callout-omitir-calentamiento">
            <div className="callout-texto">
              <strong>¿Deseas configurar el calentamiento?</strong>
              <span>Elige una opción para continuar. Puedes omitir esta sección si no requieres calentamiento.</span>
            </div>
            <div className="callout-acciones">
              <button className="btn-secundario" onClick={() => cambiarSeccionConAnimacion("equipamiento")}>Omitir calentamiento →</button>
              <button className="btn-primario" onClick={() => setDecision("configurar")}>Configurar calentamiento</button>
            </div>
          </div>
        )}

        {decision === "omitir" && (
          <div className="callout-omitir-calentamiento">
            <div className="callout-texto">
              <strong>Calentamiento omitido</strong>
              <span>Puedes continuar a equipamiento o activar la configuración.</span>
            </div>
            <div className="callout-acciones">
              <button className="btn-link" onClick={() => setDecision("configurar")}>Configurar calentamiento</button>
            </div>
          </div>
        )}

        <div className={`selector-contenido ${animandoSalida ? "salida" : "entrada"} ${formularioBloqueado ? "calentamiento-bloqueado" : ""}`}>

          {/* ── SISTEMAS DE CALENTAMIENTO ── */}
          <div
            className={`selector-grupo ${mostrarErrores && errores.sistemasCalentamiento ? "grupo-error" : ""}`}
            onMouseEnter={() => !formularioBloqueado && setHoveredField("sistemasCalentamiento")}
            onMouseLeave={() => setHoveredField(null)}
          >
            <div className="selector-subtitulo">
              Sistema(s) de calentamiento
              <span className="selector-subtitulo-hint">Selecciona uno o más</span>
            </div>
            <div className="sistemas-calentamiento-grid">
              {SISTEMAS_CALENTAMIENTO.map(({ key, label, Icon }) => {
                const activo = !!sistemasSeleccionados[key];
                return (
                  <div key={key}
                    className={`sistema-cal-card ${activo ? "activo" : ""} ${mostrarErrores && errores.sistemasCalentamiento && !activo && Object.keys(sistemasSeleccionados).length === 0 ? "card-error" : ""}`}
                    onClick={() => !formularioBloqueado && toggleSistema(key)}
                  >
                    <div className="sistema-cal-icon"><Icon /></div>
                    <div className="sistema-cal-label">{label}</div>
                    <div className={`sistema-cal-check ${activo ? "checked" : ""}`}>{activo ? "✓" : ""}</div>
                  </div>
                );
              })}
            </div>
            {Object.keys(sistemasSeleccionados).length > 0 && (
              <div className="sistemas-detalle-wrapper">
                {SISTEMAS_CALENTAMIENTO.filter(s => sistemasSeleccionados[s.key]).map(({ key, label, Icon }) => {
                  const datos = sistemasSeleccionados[key];
                  const camposIncompletos = mostrarErrores && (
                    datos.distancia === "" || datos.alturaVertical === "" ||
                    ((key === "caldera" || key === "calentadorElectrico") && datos.tasaElevacion === null)
                  );
                  return (
                    <div key={key} className={`sistema-detalle-card ${camposIncompletos ? "detalle-error" : ""}`}>
                      <div className="sistema-detalle-header">
                        <span className="sistema-detalle-icon-svg"><Icon /></span>
                        <span className="sistema-detalle-titulo">{label}</span>
                      </div>
                      <div className="sistema-detalle-campos">
                        <div className="campo">
                          <label>Distancia del equipo al cuarto de maquinas (m)</label>
                          <InputLimitado
                            min={1} max={150}
                            value={datos.distancia}
                            onChange={v => updateSistemaField(key, "distancia", v)}
                            className={`input-azul ${camposIncompletos && datos.distancia === "" ? "input-error" : ""}`}
                          />
                          <span className="input-hint">rango: 1 – 150 m</span>
                        </div>
                        <div className="campo">
                          <label>Altura vertical sobre espejo de agua (m)</label>
                          <InputLimitado
                            min={0.1} max={30}
                            value={datos.alturaVertical}
                            onChange={v => updateSistemaField(key, "alturaVertical", v)}
                            className={`input-azul ${camposIncompletos && datos.alturaVertical === "" ? "input-error" : ""}`}
                          />
                          <span className="input-hint">rango: 0.1 – 30 m</span>
                        </div>
                        {(key === "caldera" || key === "calentadorElectrico") && (
                          <div className="campo campo-tasa-elevacion">
                            <label>Tasa de elevación (°C/h)</label>
                            <div className={`tasa-elevacion-grid ${camposIncompletos && datos.tasaElevacion === null ? "tasa-error" : ""}`}>
                              {TASAS_ELEVACION.map(tasa => (
                                <button key={tasa} type="button"
                                  className={`tasa-btn ${datos.tasaElevacion === tasa ? "tasa-activa" : ""}`}
                                  onClick={() => updateSistemaField(key, "tasaElevacion", tasa)}>
                                  {tasa}°C/h
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── DATOS GENERALES ── */}
          <div className="selector-grupo">
            <div className="selector-subtitulo">Datos generales del proyecto</div>
            <div className="selector-grid">
              <div className="campo" onMouseEnter={() => !formularioBloqueado && setHoveredField("ciudad")} onMouseLeave={() => setHoveredField(null)}>
                <label>Ubicación del proyecto</label>
                <select className={`input-azul ${mostrarErrores && errores.ciudad ? "input-error" : ""}`} value={ciudad} onChange={e => setCiudad(e.target.value)}>
                  <option value="">Selecciona ciudad</option>
                  {ciudadesMexico.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div className="campo" onMouseEnter={() => !formularioBloqueado && setHoveredField("tempDeseada")} onMouseLeave={() => setHoveredField(null)}>
                <label>Temperatura deseada (°C)</label>
                <InputLimitado
                  min={26} max={40}
                  value={tempDeseadaInput}
                  onChange={v => { setTempDeseadaInput(v); setTempDeseada(v === "" ? null : Number(v)); }}
                  className={`input-azul ${mostrarErrores && errores.tempDeseada ? "input-error" : ""}`}
                />
                <span className="input-hint">rango: 26 – 40 °C</span>
              </div>
            </div>
            <div className="selector-radios">
              <div className={`grupo-radio ${mostrarErrores && errores.cubierta ? "grupo-radio-error" : ""}`} onMouseEnter={() => !formularioBloqueado && setHoveredField("cubierta")} onMouseLeave={() => setHoveredField(null)}>
                <span>¿Cuenta con cubierta térmica?</span>
                <label><input type="radio" checked={cubierta === true}  onChange={() => setCubierta(true)}  /> Sí</label>
                <label><input type="radio" checked={cubierta === false} onChange={() => setCubierta(false)} /> No</label>
              </div>
              <div className={`grupo-radio ${mostrarErrores && errores.techada ? "grupo-radio-error" : ""}`} onMouseEnter={() => !formularioBloqueado && setHoveredField("techada")} onMouseLeave={() => setHoveredField(null)}>
                <span>¿El cuerpo de agua está techado?</span>
                <label><input type="radio" checked={techada === true}  onChange={() => setTechada(true)}  /> Sí</label>
                <label><input type="radio" checked={techada === false} onChange={() => setTechada(false)} /> No</label>
              </div>
            </div>
          </div>

          {/* ── ANÁLISIS CLIMÁTICO ── */}
          <div className="selector-grupo">
            <div className="selector-subtitulo">
              <span>Análisis climático y pérdidas energéticas</span>
            </div>

            <div className="layout-clima-bdc-fila1" style={{ alignItems: "stretch" }}>
              <div className="layout-clima-bdc-celda celda-grafica"
                style={{ display:"flex", alignItems:"center", justifyContent:"center" }}
                onMouseEnter={() => !formularioBloqueado && setHoveredField("grafica")}
                onMouseLeave={() => setHoveredField(null)}>
                <div className="grafica-mini" style={{ width:"100%", height:"100%", minHeight:"420px" }}>
                  <GraficaPie data={pieData} options={PIE_OPTIONS} />
                </div>
              </div>

              <div className="layout-clima-bdc-celda celda-tabla"
                onMouseEnter={() => !formularioBloqueado && setHoveredField("meses")}
                onMouseLeave={() => setHoveredField(null)}>
                <div className="tabla-clima-card" style={{ height:"auto", maxHeight:"none" }}>
                  <table className="tabla-clima-pro">
                    <thead>
                      <tr>
                        <th>Mes</th><th>Temp Min (°C)</th><th>Temp Prom (°C)</th>
                        <th>Temp Max (°C)</th><th>Humedad (%)</th><th>Viento</th>
                        <th style={{textAlign:"center"}}>Pérdida clima (BTU/h)</th>
                        <th className="th-calentar">
                          <label className="checkbox-columna">
                            <input type="checkbox"
                              checked={clima.length && clima.every(m => mesesCalentar[m.mes])}
                              onChange={e => { const n = {}; clima.forEach(m => { n[m.mes] = e.target.checked; }); setMesesCalentar(n); }}
                            />
                            <span>Seleccionar todo</span>
                          </label>
                          <div className="titulo-columna">Calentar</div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {clima.map(m => {
                        const dt = { area: areaTotal, volumen: volumenTotal, profundidad: profundidadPromedio, tempDeseada, techada, cubierta };
                        const esMasFrio = mesMasFrio?.mes === m.mes;
                        let btuMes = 0;
                        if (tempDeseada && areaTotal > 0) {
                          try {
                            btuMes += qEvaporacion(dt, m)  || 0;
                            btuMes += qConveccion(dt, m)   || 0;
                            btuMes += qRadiacion(dt, m)    || 0;
                            btuMes += qTransmision({ area: areaTotal, profMax: profMaxSistema, tempDeseada }, m) || 0;
                            if (sistemaActivo?.desborde === "infinity" || sistemaActivo?.desborde === "ambos") {
                              const largo = parseFloat(sistemaActivo.largoInfinity) || 0;
                              if (largo > 0 && profMaxSistema > 0)
                                btuMes += qInfinity({ profMin: 0, profMax: profMaxSistema, largoInfinity: largo, tempDeseada }, m) || 0;
                            }
                            if (sistemaActivo?.desborde === "canal" || sistemaActivo?.desborde === "ambos") {
                              const largo = parseFloat(sistemaActivo.largoCanal) || 0;
                              if (largo > 0) btuMes += qCanal({ largoCanal: largo, tempDeseada }, m) || 0;
                            }
                          } catch {}
                        }
                        return (
                        <tr key={m.mes} style={{ background: esMasFrio ? "rgba(249,115,22,0.08)" : undefined, borderLeft: esMasFrio ? "2px solid #f97316" : "2px solid transparent" }}>
                          <td>{m.mes}{esMasFrio ? " ★" : ""}</td><td>{m.tMin}</td><td>{m.tProm}</td>
                          <td>{m.tMax}</td><td>{m.humedad}</td><td>{m.viento}</td>
                          <td style={{ color: esMasFrio ? "#f97316" : btuMes > 0 ? "#94a3b8" : "#475569", fontWeight: esMasFrio ? 700 : 400, textAlign: "center", fontSize: "0.72rem" }}>
                            {btuMes > 0 ? Math.round(btuMes).toLocaleString("es-MX") : "—"}
                          </td>
                          <td>
                            <input type="checkbox"
                              checked={mesesCalentar[m.mes] || false}
                              onChange={() => setMesesCalentar(prev => ({ ...prev, [m.mes]: !prev[m.mes] }))}
                            />
                          </td>
                        </tr>
                    ); })}
                    </tbody>
                  </table>
                  <div className={`tabla-resumen-frio ${mesMasFrio ? "visible" : "oculto"}`}>
                    <div className="resumen-titulo">Mes más frío seleccionado</div>
                    <table className="tabla-clima-pro resumen">
                      <thead>
                        <tr><th>Mes</th><th>Temp Min (°C)</th><th>Temp Prom (°C)</th><th>Viento Máx</th><th>Humedad (%)</th><th>Pérdida clima (BTU/h)</th></tr>                      
                        </thead>
                      <tbody>
                        {mesMasFrio
                          ? <tr>
                            <td>{mesMasFrio.mes}</td>
                            <td>{mesMasFrio.tMin}</td>
                            <td>{mesMasFrio.tProm}</td>
                            <td>{mesMasFrio.viento}</td>
                            <td>{mesMasFrio.humedad}</td>
                            <td style={{ color:"#f97316", fontWeight:700, textAlign:"center" }}>
                              {mesMasFrio.perdidaTotal ? Math.round(mesMasFrio.perdidaTotal).toLocaleString("es-MX") : "—"}
                            </td>
                          </tr>
                          : <tr><td colSpan={5} className="resumen-placeholder">Selecciona meses para ver el resumen</td></tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* ── FILA 2: BDC ── */}
            {sistemasSeleccionados.bombaCalor && (
              <div
                className="layout-clima-bdc-fila2"
                onMouseEnter={() => !formularioBloqueado && setHoveredField("modoBDC")}
                onMouseLeave={() => setHoveredField(null)}
              >
                <div className="bdc-modo-toggle-wrapper">
                  <div className="bdc-modo-toggle">
                    <button
                      type="button"
                      className={`bdc-modo-btn ${modoBDC === "recomendado" ? "bdc-modo-activo" : ""}`}
                      onClick={() => setModoBDC("recomendado")}
                    >
                      {modoBDC === "recomendado" && <IconoCheck />}
                      <span>Recomendado</span>
                    </button>
                    <button
                      type="button"
                      className={`bdc-modo-btn ${modoBDC === "manual" ? "bdc-modo-activo" : ""}`}
                      onClick={() => setModoBDC("manual")}
                    >
                      {modoBDC === "manual" && <IconoCheck />}
                      <span>Selección manual</span>
                    </button>
                  </div>
                  {modoBDC === "manual" && bdcManual && !bdcManual.cubre && (
                    <div className="bdc-modo-aviso-deficit">
                      ⚠ La selección manual no cubre la demanda. Los cálculos usarán esta configuración.
                    </div>
                  )}
                </div>

                <div className="layout-clima-bdc-celda celda-bdc-rec">
                  {infoActivaParaMostrar ? (
                    <div className={`bdc-recomendada-card bdc-inset ${modoBDC === "manual" ? "bdc-card-manual-activa" : ""}`}>
                      <div className="bdc-rec-header">
                        <IconoBDCMini />
                        <div className="bdc-rec-titulo">
                          <span className="bdc-rec-label">
                            {modoBDC === "recomendado" ? "Recomendado" : "Selección manual"}
                          </span>
                          <span className="bdc-rec-modelo">
                            {infoActivaParaMostrar.marca} · {ncCal(infoActivaParaMostrar)}{infoActivaParaMostrar.capUnitaria && <span style={{color:"#7dd3fc",fontSize:"0.82em"}}> {fmtBTU(infoActivaParaMostrar.capUnitaria)}</span>}{mostrarCodigoCal(infoActivaParaMostrar) && <span style={{color:"#94a3b8",fontSize:"0.8em"}}> {infoActivaParaMostrar.modelo}</span>}
                          </span>
                        </div>
                        <span className={`bdc-modo-badge ${modoBDC === "manual" ? "badge-manual" : "badge-auto"}`}>
                          {modoBDC === "manual" ? "Manual" : "Auto"}
                        </span>
                      </div>

                      {/* ── PATCH 1: BDC stats — cantidad · BTU/h c/u · BTU/h total · GPM total ── */}
                      <div className="bdc-rec-stats">
                        <div className="bdc-stat">
                          <span className="bdc-stat-valor">{infoActivaParaMostrar.cantidad}</span>
                          <span className="bdc-stat-label">equipos</span>
                        </div>
                        <div className="bdc-stat-sep" />
                        <div className="bdc-stat">
                          <span className="bdc-stat-valor">{fmtBTU(infoActivaParaMostrar.capUnitaria)}</span>
                          <span className="bdc-stat-label">BTU/h c/u</span>
                        </div>
                        <div className="bdc-stat-sep" />
                        <div className="bdc-stat">
                          <span className="bdc-stat-valor">{fmtBTU(infoActivaParaMostrar.capTotal)}</span>
                          <span className="bdc-stat-label">BTU/h total</span>
                        </div>
                        <div className="bdc-stat-sep" />
                        <div className="bdc-stat">
                          <span className="bdc-stat-valor">{infoActivaParaMostrar.flujoTotal != null ? parseFloat(infoActivaParaMostrar.flujoTotal).toFixed(1) : "—"}</span>
                          <span className="bdc-stat-label">GPM total</span>
                        </div>
                      </div>

                      <div className="bdc-rec-demanda">
                        <div className="bdc-demanda-fila">
                          <span className="bdc-demanda-label">Demanda</span>
                          <span className="bdc-demanda-valor">{fmtBTU(perdidaTotalBTU)} BTU/h</span>
                        </div>
                        <div className="bdc-demanda-fila">
                          <span className="bdc-demanda-label">Capacidad instalada</span>
                          <span className={`bdc-demanda-valor ${infoActivaParaMostrar.cubre ? "bdc-ok" : "bdc-insuf"}`}>
                            {fmtBTU(infoActivaParaMostrar.capTotal)} BTU/h
                          </span>
                        </div>
                        <div className="bdc-demanda-fila">
                          <span className="bdc-demanda-label">
                            {infoActivaParaMostrar.cubre ? "Exceso" : "Déficit"}
                          </span>
                          <span className={`bdc-demanda-valor ${infoActivaParaMostrar.cubre ? "bdc-exceso" : "bdc-insuf"}`}>
                            {infoActivaParaMostrar.cubre ? "+" : "-"}{fmtBTU(Math.abs(infoActivaParaMostrar.exceso))} BTU/h
                          </span>
                        </div>
                        {/* flujoTotal ya está en stats, se elimina de demanda para evitar duplicado */}
                      </div>
                      {infoActivaParaMostrar.cargaTotal != null && (
                        <div className="bdc-rec-hidraulica">
                          <span className="bdc-hid-label">Carga hidráulica</span>
                          <span className="bdc-hid-valor">
                            {infoActivaParaMostrar.cargaTotal} ft · {infoActivaParaMostrar.cargaTotalPSI} PSI
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bdc-recomendada-card bdc-pendiente bdc-inset">
                      <div className="bdc-rec-header">
                        <IconoBDCMini />
                        <div className="bdc-rec-titulo">
                          <span className="bdc-rec-label">Bomba de calor</span>
                          <span className="bdc-rec-modelo bdc-pendiente-txt">
                            Completa los datos térmicos para ver la {modoBDC === "recomendado" ? "recomendación" : "selección"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="layout-clima-bdc-celda celda-bdc-manual">
                  {modoBDC === "recomendado" && mostrarSelectorBDC && bdcSeleccionada && !bdcSeleccionada.error && (
                    <div className="bdc-info-automatica bdc-inset">
                      <div className="bdc-manual-header">
                        <span className="bdc-manual-titulo">Detalle de selección automática</span>
                      </div>
                      <div className="bdc-auto-detalle">
                        <div className="bdc-auto-fila">
                          <span className="bdc-auto-label">Marca</span>
                          <span className="bdc-auto-val">{bdcSeleccionada.seleccion.marca}</span>
                        </div>
                        <div className="bdc-auto-fila">
                          <span className="bdc-auto-label">Modelo</span>
                          <span className="bdc-auto-val">{bdcSeleccionada.seleccion.modelo}</span>
                        </div>
                        <div className="bdc-auto-fila">
                          <span className="bdc-auto-label">Velocidad</span>
                          <span className={`bdc-auto-val bdc-manual-vel ${bdcSeleccionada.seleccion.velocidad === "vv" ? "vel-vv" : "vel-1v"}`}>
                            {bdcSeleccionada.seleccion.velocidad === "vv" ? "Variable" : "1 velocidad"}
                          </span>
                        </div>
                        <div className="bdc-auto-fila">
                          <span className="bdc-auto-label">Cantidad</span>
                          <span className="bdc-auto-val">{bdcSeleccionada.seleccion.cantidad} equipo{bdcSeleccionada.seleccion.cantidad > 1 ? "s" : ""}</span>
                        </div>
                        <div className="bdc-auto-fila">
                          <span className="bdc-auto-label">Flujo por equipo</span>
                          <span className="bdc-auto-val">{bdcSeleccionada.seleccion.flujoPorBomba} GPM</span>
                        </div>
                        <div className="bdc-auto-fila">
                          <span className="bdc-auto-label">Flujo total</span>
                          <span className="bdc-auto-val">{bdcSeleccionada.seleccion.flujoTotal} GPM</span>
                        </div>
                        <div className="bdc-auto-sep" />
                        <div className="bdc-auto-fila">
                          <span className="bdc-auto-label">Carga tramos BDC</span>
                          <span className="bdc-auto-val">{bdcSeleccionada.cargaTramos} ft</span>
                        </div>
                        <div className="bdc-auto-fila">
                          <span className="bdc-auto-label">Carga CM ida+reg.</span>
                          <span className="bdc-auto-val">
                            {(parseFloat(bdcSeleccionada.cargaDistanciaIda) + parseFloat(bdcSeleccionada.cargaDistanciaReg)).toFixed(2)} ft
                          </span>
                        </div>
                        <div className="bdc-auto-fila">
                          <span className="bdc-auto-label">Carga estática</span>
                          <span className="bdc-auto-val">{bdcSeleccionada.cargaEstatica} ft</span>
                        </div>
                        <div className="bdc-auto-fila">
                          <span className="bdc-auto-label">Carga fricción alt.</span>
                          <span className="bdc-auto-val">{bdcSeleccionada.cargaFriccionAltura} ft</span>
                        </div>
                        <div className="bdc-auto-fila">
                          <span className="bdc-auto-label">Carga fija global</span>
                          <span className="bdc-auto-val">{bdcSeleccionada.cargaFija_ft} ft</span>
                        </div>
                        <div className="bdc-auto-sep" />
                        <div className="bdc-auto-fila bdc-auto-total">
                          <span className="bdc-auto-label">Carga total</span>
                          <span className="bdc-auto-val bdc-hid-val-highlight">{bdcSeleccionada.cargaTotal} ft · {bdcSeleccionada.cargaTotalPSI} PSI</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {modoBDC === "recomendado" && (!mostrarSelectorBDC || !bdcSeleccionada || bdcSeleccionada?.error) && (
                    <div style={{ padding: "1rem", fontSize: "0.75rem", color: "#475569" }}>
                      Completa los datos térmicos para ver el detalle automático
                    </div>
                  )}

                  {modoBDC === "manual" && (
                    <>
                      {mostrarSelectorBDC ? (
                        <div className="bdc-selector-manual bdc-inset">
                          <div className="bdc-manual-header">
                            <span className="bdc-manual-titulo">Catálogo de equipos</span>
                          </div>
                          <div className="bdc-manual-filtros">
                            <div className="campo">
                              <label>Marca</label>
                              <select value={filtroBDCMarca} onChange={e => setFiltroBDCMarca(e.target.value)}>
                                {marcasDisponibles.map(m => (
                                  <option key={m} value={m}>{m === "todas" ? "Todas las marcas" : m}</option>
                                ))}
                              </select>
                            </div>
                            <div className="campo">
                              <label>Velocidad</label>
                              <select value={filtroBDCVelocidad} onChange={e => setFiltroBDCVelocidad(e.target.value)}>
                                <option value="todas">1V y VV</option>
                                <option value="1v">1 velocidad</option>
                                <option value="vv">Velocidad variable</option>
                              </select>
                            </div>
                          </div>
                          <div className="bdc-manual-lista">
                            {catalogoFiltrado.map(b => {
                              const esRecomendado = bdcSeleccionada && b.marca === bdcSeleccionada.seleccion.marca && b.modelo === bdcSeleccionada.seleccion.modelo;
                              const seleccionado  = selManualBDCId === b.id;
                              return (
                                <div key={b.id}
                                  className={`bdc-manual-fila ${seleccionado ? "bdc-manual-fila-activa" : ""}`}
                                  onClick={() => { setSelManualBDCId(seleccionado ? null : b.id); setSelManualCantidad(1); }}
                                >
                                  <div className="bdc-manual-fila-info">
                                    <span className="bdc-manual-marca">{b.marca}</span>
                                    <span className="bdc-manual-modelo">{ncCal(b)}</span>
                                    <span className="bdc-manual-vel" style={{color:"#64748b",fontSize:"0.6rem"}}>{b.modelo}</span>
                                    <span className={`bdc-manual-vel ${b.specs.velocidad === "vv" ? "vel-vv" : "vel-1v"}`}>
                                      {b.specs.velocidad === "vv" ? "VV" : "1V"}
                                    </span>
                                    {esRecomendado && <span className="bdc-manual-badge-rec">★ Rec.</span>}
                                  </div>
                                  <div className="bdc-manual-fila-cap">{fmtBTU(b.specs.capacidadCalentamiento)} BTU/h</div>
                                </div>
                              );
                            })}
                            {catalogoFiltrado.length === 0 && (
                              <div className="bdc-manual-vacio">Sin modelos para estos filtros</div>
                            )}
                          </div>
                          {selManualBDCId && (
                            <div className="bdc-manual-resultado">
                              <div className="bdc-manual-cant-row">
                                <span className="bdc-manual-cant-label">Cantidad de equipos</span>
                                <div className="bdc-manual-cant-ctrl">
                                  <button onClick={() => setSelManualCantidad(c => Math.max(1, c - 1))}>−</button>
                                  <span>{selManualCantidad}</span>
                                  <button onClick={() => setSelManualCantidad(c => c + 1)}>+</button>
                                </div>
                              </div>
                              {bdcManual && (
                                <>
                                  <div className="bdc-demanda-fila">
                                    <span className="bdc-demanda-label">Capacidad instalada</span>
                                    <span className={`bdc-demanda-valor ${bdcManual.cubre ? "bdc-ok" : "bdc-insuf"}`}>
                                      {fmtBTU(bdcManual.capTotal)} BTU/h
                                    </span>
                                  </div>
                                  <div className="bdc-demanda-fila">
                                    <span className="bdc-demanda-label">{bdcManual.cubre ? "Exceso" : "Déficit"}</span>
                                    <span className={`bdc-demanda-valor ${bdcManual.cubre ? "bdc-exceso" : "bdc-insuf"}`}>
                                      {bdcManual.cubre ? "+" : "-"}{fmtBTU(Math.abs(bdcManual.exceso))} BTU/h
                                    </span>
                                  </div>
                                  <div className="bdc-demanda-fila">
                                    <span className="bdc-demanda-label">Flujo total</span>
                                    <span className="bdc-demanda-valor">
                                      {bdcManual.flujoTotal.toFixed(1)} GPM
                                    </span>
                                  </div>
                                  {bdcManual.hidraulica && !bdcManual.hidraulica.error && (
                                    <div className="bdc-manual-hidraulica-detalle">
                                      <div className="bdc-auto-sep" style={{ margin: "0.5rem 0" }} />
                                      <div className="bdc-hid-detalle-titulo">Carga hidráulica calculada</div>
                                      <div className="bdc-auto-fila">
                                        <span className="bdc-auto-label">Carga tramos BDC</span>
                                        <span className="bdc-auto-val">{bdcManual.hidraulica.cargaTramos} ft</span>
                                      </div>
                                      <div className="bdc-auto-fila">
                                        <span className="bdc-auto-label">Carga CM ida+reg.</span>
                                        <span className="bdc-auto-val">
                                          {(parseFloat(bdcManual.hidraulica.cargaDistanciaIda) + parseFloat(bdcManual.hidraulica.cargaDistanciaReg)).toFixed(2)} ft
                                        </span>
                                      </div>
                                      <div className="bdc-auto-fila">
                                        <span className="bdc-auto-label">Carga estática</span>
                                        <span className="bdc-auto-val">{bdcManual.hidraulica.cargaEstatica} ft</span>
                                      </div>
                                      <div className="bdc-auto-fila">
                                        <span className="bdc-auto-label">Carga fricción alt.</span>
                                        <span className="bdc-auto-val">{bdcManual.hidraulica.cargaFriccionAltura} ft</span>
                                      </div>
                                      <div className="bdc-auto-fila">
                                        <span className="bdc-auto-label">Carga fija global</span>
                                        <span className="bdc-auto-val">{bdcManual.hidraulica.cargaFija_ft} ft</span>
                                      </div>
                                      <div className="bdc-auto-sep" style={{ margin: "0.5rem 0" }} />
                                      <div className="bdc-auto-fila bdc-auto-total">
                                        <span className="bdc-auto-label">Carga total</span>
                                        <span className="bdc-auto-val bdc-hid-val-highlight">
                                          {bdcManual.hidraulica.cargaTotal} ft · {bdcManual.hidraulica.cargaTotalPSI} PSI
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  {!bdcManual.cubre && (
                                    <div className="bdc-manual-aviso">⚠ Capacidad insuficiente — los cálculos usarán esta configuración</div>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                          {!selManualBDCId && (
                            <div className="bdc-manual-hint">
                              Selecciona un equipo del catálogo para calcular carga y flujo
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ padding: "1rem", fontSize: "0.75rem", color: "#475569" }}>
                          Completa los datos térmicos para habilitar la selección manual
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

          </div>{/* fin selector-grupo análisis climático */}

          {/* ── PANEL SOLAR ── */}
          {sistemasSeleccionados.panelSolar && (
            <div
              className="selector-grupo"
              onMouseEnter={() => !formularioBloqueado && setHoveredField("modoPS")}
              onMouseLeave={() => setHoveredField(null)}
            >
              <div className="selector-subtitulo">
                Panel solar
                <span className="selector-subtitulo-hint">Cobertura y cálculo hidráulico</span>
              </div>

              <div className="bdc-modo-toggle-wrapper" style={{ marginBottom: "0.75rem" }}>
                <div className="bdc-modo-toggle">
                  <button
                    type="button"
                    className={`bdc-modo-btn ${modoPS === "recomendado" ? "bdc-modo-activo" : ""}`}
                    onClick={() => { setModoPS("recomendado"); setSelManualPSCant(null); }}
                  >
                    {modoPS === "recomendado" && <IconoCheck />}
                    <span>Recomendado (100%)</span>
                  </button>
                  <button
                    type="button"
                    className={`bdc-modo-btn ${modoPS === "manual" ? "bdc-modo-activo" : ""}`}
                    onClick={() => setModoPS("manual")}
                  >
                    {modoPS === "manual" && <IconoCheck />}
                    <span>Selección manual</span>
                  </button>
                </div>
                {modoPS === "manual" && psManual && !psManual.cubre && (
                  <div className="bdc-modo-aviso-deficit">
                    ⚠ La selección no cubre la demanda térmica.
                  </div>
                )}
              </div>

              {!mostrarSelectorPS && (
                <div style={{ padding: "0.5rem", fontSize: "0.75rem", color: "#475569" }}>
                  Completa los datos térmicos para ver la selección de paneles
                </div>
              )}

              {mostrarSelectorPS && (
                <div className="layout-clima-bdc-fila2" style={{ marginTop: 0 }}>

                  {/* ── Tarjeta resumen PS ── */}
                  <div className="layout-clima-bdc-celda celda-bdc-rec">
                    {(() => {
                      const info = modoPS === "manual" && psManual ? psManual
                                 : psSeleccionado ? { ...psSeleccionado.seleccion, hidraulica: psSeleccionado.hidraulica, panel: psSeleccionado.panel, totalPaneles: psSeleccionado.seleccion.cantidad, capUnitaria: psSeleccionado.panel?.specs.capacidadCalentamiento, capTotal: psSeleccionado.seleccion.capTotal, exceso: psSeleccionado.seleccion.exceso, cubre: true, porcentaje: 100, flujoTotal: psSeleccionado.seleccion.flujoTotal, tandems: psSeleccionado.seleccion.tandems }
                                 : null;
                      if (!info) return (
                        <div className="bdc-recomendada-card bdc-pendiente bdc-inset">
                          <div className="bdc-rec-header">
                            <IconoPanelSolar />
                            <div className="bdc-rec-titulo">
                              <span className="bdc-rec-label">Panel solar</span>
                              <span className="bdc-rec-modelo bdc-pendiente-txt">Completa los datos térmicos</span>
                            </div>
                          </div>
                        </div>
                      );
                      const hid = info.hidraulica;
                      return (
                        <div className={`bdc-recomendada-card bdc-inset ${modoPS === "manual" ? "bdc-card-manual-activa" : ""}`}>
                          <div className="bdc-rec-header">
                            <IconoPanelSolar />
                            <div className="bdc-rec-titulo">
                              <span className="bdc-rec-label">{modoPS === "manual" ? "Manual" : "Recomendado"}</span>
                              <span className="bdc-rec-modelo">{info.panel?.marca} · {ncCal(info.panel)}{info.panel?.specs?.capacidadCalentamiento && <span style={{color:"#7dd3fc",fontSize:"0.82em"}}> {fmtBTU(info.panel?.specs?.capacidadCalentamiento)}</span>}{mostrarCodigoCal(info.panel) && <span style={{color:"#94a3b8",fontSize:"0.8em"}}> {info.panel?.modelo}</span>}</span>
                            </div>
                            <span className={`bdc-modo-badge ${modoPS === "manual" ? "badge-manual" : "badge-auto"}`}>
                              {info.porcentaje != null ? `${info.porcentaje}%` : (modoPS === "manual" ? "Manual" : "Auto")}
                            </span>
                          </div>

                          {/* ── PATCH 2: PS stats — paneles · tándems · BTU/h total · GPM total ── */}
                          <div className="bdc-rec-stats">
                            <div className="bdc-stat">
                              <span className="bdc-stat-valor">{info.totalPaneles ?? info.cantidad}</span>
                              <span className="bdc-stat-label">paneles</span>
                            </div>
                            <div className="bdc-stat-sep" />
                            <div className="bdc-stat">
                              <span className="bdc-stat-valor">{(info.tandems ?? []).length}</span>
                              <span className="bdc-stat-label">tándems</span>
                            </div>
                            <div className="bdc-stat-sep" />
                            <div className="bdc-stat">
                              <span className="bdc-stat-valor">{fmtBTU(info.capTotal)}</span>
                              <span className="bdc-stat-label">BTU/h total</span>
                            </div>
                            <div className="bdc-stat-sep" />
                            <div className="bdc-stat">
                              <span className="bdc-stat-valor">{parseFloat(info.flujoTotal).toFixed(1)}</span>
                              <span className="bdc-stat-label">GPM total</span>
                            </div>
                          </div>

                          <div className="bdc-rec-demanda">
                            <div className="bdc-demanda-fila">
                              <span className="bdc-demanda-label">Demanda</span>
                              <span className="bdc-demanda-valor">{fmtBTU(perdidaTotalBTU)} BTU/h</span>
                            </div>
                            <div className="bdc-demanda-fila">
                              <span className="bdc-demanda-label">Capacidad instalada</span>
                              <span className={`bdc-demanda-valor ${info.cubre ? "bdc-ok" : "bdc-insuf"}`}>
                                {fmtBTU(info.capTotal)} BTU/h
                              </span>
                            </div>
                            <div className="bdc-demanda-fila">
                              <span className="bdc-demanda-label">{info.cubre ? "Exceso" : "Déficit"}</span>
                              <span className={`bdc-demanda-valor ${info.cubre ? "bdc-exceso" : "bdc-insuf"}`}>
                                {info.cubre ? "+" : "-"}{fmtBTU(Math.abs(parseFloat(info.exceso)))} BTU/h
                              </span>
                            </div>
                            {/* PATCH 3: bloque tablaAltura (carga estática desglosada) eliminado */}
                          </div>
                          {hid && (
                            <div className="bdc-rec-hidraulica">
                              <span className="bdc-hid-label">Carga hidráulica</span>
                              <span className="bdc-hid-valor">{hid.cargaTotal} ft · {hid.cargaTotalPSI} PSI</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* ── Panel derecho PS ── */}
                  <div className="layout-clima-bdc-celda celda-bdc-manual">

                    {modoPS === "recomendado" && psSeleccionado && (
                      <div className="bdc-info-automatica bdc-inset">
                        <div className="bdc-manual-header">
                          <span className="bdc-manual-titulo">Detalle de selección automática</span>
                        </div>
                        <div className="bdc-auto-detalle">
                          <div className="bdc-auto-fila">
                            <span className="bdc-auto-label">Modelo</span>
                            <span className="bdc-auto-val">{psSeleccionado.panel?.modelo}</span>
                          </div>
                          <div className="bdc-auto-fila">
                            <span className="bdc-auto-label">Paneles totales</span>
                            <span className="bdc-auto-val">{psSeleccionado.seleccion.cantidad}</span>
                          </div>
                          <div className="bdc-auto-fila">
                            <span className="bdc-auto-label">Distribución tándems</span>
                            <span className="bdc-auto-val">{psSeleccionado.seleccion.tandems.join(" + ")} paneles</span>
                          </div>
                          <div className="bdc-auto-fila">
                            <span className="bdc-auto-label">Flujo total</span>
                            <span className="bdc-auto-val">{psSeleccionado.seleccion.flujoTotal} GPM</span>
                          </div>
                          <div className="bdc-auto-sep" />
                          <div className="bdc-auto-fila">
                            <span className="bdc-auto-label">Carga tándems</span>
                            <span className="bdc-auto-val">{psSeleccionado.hidraulica.cargaTramos} ft</span>
                          </div>
                          <div className="bdc-auto-fila">
                            <span className="bdc-auto-label">Carga CM ida+reg.</span>
                            <span className="bdc-auto-val">
                              {(parseFloat(psSeleccionado.hidraulica.cargaDistanciaIda) + parseFloat(psSeleccionado.hidraulica.cargaDistanciaReg)).toFixed(2)} ft
                            </span>
                          </div>
                          <div className="bdc-auto-fila">
                            <span className="bdc-auto-label">Carga estática</span>
                            <span className="bdc-auto-val">{psSeleccionado.hidraulica.cargaEstatica} ft</span>
                          </div>
                          <div className="bdc-auto-fila">
                            <span className="bdc-auto-label">Carga fricción alt.</span>
                            <span className="bdc-auto-val">{psSeleccionado.hidraulica.cargaFriccionAltura} ft</span>
                          </div>
                          <div className="bdc-auto-fila">
                            <span className="bdc-auto-label">Carga fija por equipo</span>
                            <span className="bdc-auto-val">{psSeleccionado.hidraulica.cargaFija_ft} ft</span>
                          </div>
                          <div className="bdc-auto-sep" />
                          <div className="bdc-auto-fila bdc-auto-total">
                            <span className="bdc-auto-label">Carga total</span>
                            <span className="bdc-auto-val bdc-hid-val-highlight">{psSeleccionado.hidraulica.cargaTotal} ft · {psSeleccionado.hidraulica.cargaTotalPSI} PSI</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {modoPS === "recomendado" && !psSeleccionado && (
                      <div style={{ padding: "1rem", fontSize: "0.75rem", color: "#475569" }}>
                        Completa los datos térmicos para ver el detalle
                      </div>
                    )}

                    {modoPS === "manual" && mostrarSelectorPS && (
                      <div className="bdc-selector-manual bdc-inset">
                        <div className="bdc-manual-header">
                          <span className="bdc-manual-titulo">Opciones de cobertura</span>
                        </div>
                        <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.6rem" }}>
                          {[30, 60, 100].map(pct => {
                            const key     = `p${pct}`;
                            const opcion  = psSeleccionado?.opciones?.[key];
                            const activo  = selManualPSCant == null && selManualPSPct === pct;
                            return (
                              <button
                                key={pct}
                                type="button"
                                className={`tasa-btn ${activo ? "tasa-activa" : ""}`}
                                style={{ flex: 1 }}
                                onClick={() => { setSelManualPSPct(pct); setSelManualPSCant(null); }}
                              >
                                {pct}%{opcion ? ` · ${opcion.cantidad}p` : ""}
                              </button>
                            );
                          })}
                        </div>
                        <div className="bdc-manual-cant-row" style={{ marginBottom: "0.5rem" }}>
                          <span className="bdc-manual-cant-label">Cantidad libre</span>
                          <div className="bdc-manual-cant-ctrl">
                            <button onClick={() => {
                              const base = selManualPSCant ?? (psSeleccionado?.seleccion.cantidad ?? 1);
                              setSelManualPSCant(Math.max(1, base - 1));
                            }}>−</button>
                            <span>{selManualPSCant ?? "—"}</span>
                            <button onClick={() => {
                              const base = selManualPSCant ?? (psSeleccionado?.seleccion.cantidad ?? 0);
                              setSelManualPSCant(base + 1);
                            }}>+</button>
                          </div>
                        </div>
                        {selManualPSCant != null && (
                          <div style={{ fontSize: "0.68rem", color: "#64748b", marginBottom: "0.5rem", textAlign: "right" }}>
                            Cantidad libre activa: {selManualPSCant} paneles
                          </div>
                        )}
                        {psManual && (
                          <div className="bdc-manual-resultado">
                            <div className="bdc-demanda-fila">
                              <span className="bdc-demanda-label">Capacidad instalada</span>
                              <span className={`bdc-demanda-valor ${psManual.cubre ? "bdc-ok" : "bdc-insuf"}`}>
                                {fmtBTU(psManual.capTotal)} BTU/h
                              </span>
                            </div>
                            <div className="bdc-demanda-fila">
                              <span className="bdc-demanda-label">{psManual.cubre ? "Exceso" : "Déficit"}</span>
                              <span className={`bdc-demanda-valor ${psManual.cubre ? "bdc-exceso" : "bdc-insuf"}`}>
                                {psManual.cubre ? "+" : "-"}{fmtBTU(Math.abs(parseFloat(psManual.exceso)))} BTU/h
                              </span>
                            </div>
                            <div className="bdc-demanda-fila">
                              <span className="bdc-demanda-label">Tándems</span>
                              <span className="bdc-demanda-valor">{(psManual.tandems ?? []).join(" + ")} paneles</span>
                            </div>
                            <div className="bdc-demanda-fila">
                              <span className="bdc-demanda-label">Flujo total</span>
                              <span className="bdc-demanda-valor">{parseFloat(psManual.flujoTotal).toFixed(1)} GPM</span>
                            </div>
                            {psManual.hidraulica && (
                              <div className="bdc-manual-hidraulica-detalle">
                                <div className="bdc-auto-sep" style={{ margin: "0.5rem 0" }} />
                                <div className="bdc-hid-detalle-titulo">Carga hidráulica calculada</div>
                                <div className="bdc-auto-fila">
                                  <span className="bdc-auto-label">Carga tándems</span>
                                  <span className="bdc-auto-val">{psManual.hidraulica.cargaTramos} ft</span>
                                </div>
                                <div className="bdc-auto-fila">
                                  <span className="bdc-auto-label">Carga CM ida+reg.</span>
                                  <span className="bdc-auto-val">
                                    {(parseFloat(psManual.hidraulica.cargaDistanciaIda) + parseFloat(psManual.hidraulica.cargaDistanciaReg)).toFixed(2)} ft
                                  </span>
                                </div>
                                <div className="bdc-auto-fila">
                                  <span className="bdc-auto-label">Carga estática</span>
                                  <span className="bdc-auto-val">{psManual.hidraulica.cargaEstatica} ft</span>
                                </div>
                                <div className="bdc-auto-fila">
                                  <span className="bdc-auto-label">Carga fricción alt.</span>
                                  <span className="bdc-auto-val">{psManual.hidraulica.cargaFriccionAltura} ft</span>
                                </div>
                                <div className="bdc-auto-fila">
                                  <span className="bdc-auto-label">Carga fija por equipo</span>
                                  <span className="bdc-auto-val">{psManual.hidraulica.cargaFija_ft} ft</span>
                                </div>
                                <div className="bdc-auto-sep" style={{ margin: "0.5rem 0" }} />
                                <div className="bdc-auto-fila bdc-auto-total">
                                  <span className="bdc-auto-label">Carga total</span>
                                  <span className="bdc-auto-val bdc-hid-val-highlight">
                                    {psManual.hidraulica.cargaTotal} ft · {psManual.hidraulica.cargaTotalPSI} PSI
                                  </span>
                                </div>
                              </div>
                            )}
                            {!psManual.cubre && (
                              <div className="bdc-manual-aviso">⚠ Capacidad insuficiente — los cálculos usarán esta configuración</div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {modoPS === "manual" && !mostrarSelectorPS && (
                      <div style={{ padding: "1rem", fontSize: "0.75rem", color: "#475569" }}>
                        Completa los datos térmicos para habilitar la selección manual
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── CALDERA ── */}
          {sistemasSeleccionados.caldera && (
            <div
              className="selector-grupo"
              onMouseEnter={() => !formularioBloqueado && setHoveredField("modoCaldera")}
              onMouseLeave={() => setHoveredField(null)}
            >
              <div className="selector-subtitulo">
                Caldera de gas
                <span className="selector-subtitulo-hint">Selección y cálculo hidráulico</span>
              </div>

              {/* Aviso si falta la tasa de elevación */}
              {!sistemasSeleccionados.caldera.tasaElevacion && (
                <div style={{ padding: "0.5rem", fontSize: "0.75rem", color: "#f97316" }}>
                  Selecciona una tasa de elevación (°C/h) en la configuración de la caldera para ver la selección
                </div>
              )}

              {sistemasSeleccionados.caldera.tasaElevacion && (
                <>
                  {/* Toggle Recomendado / Manual */}
                  <div className="bdc-modo-toggle-wrapper" style={{ marginBottom: "0.75rem" }}>
                    <div className="bdc-modo-toggle">
                      <button type="button"
                        className={`bdc-modo-btn ${modoCaldera === "recomendado" ? "bdc-modo-activo" : ""}`}
                        onClick={() => setModoCaldera("recomendado")}
                      >
                        {modoCaldera === "recomendado" && <IconoCheck />}
                        <span>Recomendado</span>
                      </button>
                      <button type="button"
                        className={`bdc-modo-btn ${modoCaldera === "manual" ? "bdc-modo-activo" : ""}`}
                        onClick={() => setModoCaldera("manual")}
                      >
                        {modoCaldera === "manual" && <IconoCheck />}
                        <span>Selección manual</span>
                      </button>
                    </div>
                    {modoCaldera === "manual" && calderaManual && !calderaManual.cubre && (
                      <div className="bdc-modo-aviso-deficit">
                        ⚠ La selección manual no cubre la demanda. Los cálculos usarán esta configuración.
                      </div>
                    )}
                  </div>

                  {!mostrarSelectorCaldera && (
                    <div style={{ padding: "0.5rem", fontSize: "0.75rem", color: "#475569" }}>
                      Completa los datos térmicos para ver la selección de caldera
                    </div>
                  )}

                  {mostrarSelectorCaldera && (
                    <div className="layout-clima-bdc-fila2" style={{ marginTop: 0 }}>

                      {/* ── Tarjeta resumen caldera ── */}
                      <div className="layout-clima-bdc-celda celda-bdc-rec">
                        {(() => {
                          const esManualActivo = modoCaldera === "manual" && calderaManual;
                          const src = esManualActivo ? calderaManual : calderaSeleccionada;
                          if (!src || src.error) return (
                            <div className="bdc-recomendada-card bdc-pendiente bdc-inset">
                              <div className="bdc-rec-header">
                                <IconoCaldera />
                                <div className="bdc-rec-titulo">
                                  <span className="bdc-rec-label">Caldera</span>
                                  <span className="bdc-rec-modelo bdc-pendiente-txt">
                                    {src?.error ?? "Completa los datos térmicos"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );

                          const sel = esManualActivo ? {
                            id:               src.caldera.id,
                            marca:            src.caldera.marca,
                            modelo:           src.caldera.modelo,
                            tipoGas:          src.caldera.tipoGas,
                            cantidad:         src.cantidad,
                            capOutputUnitario: src.caldera.specs.capacidadCalentamiento,
                            flujoTotal:       src.flujoTotal,
                            capTotal:         src.capTotal,
                            exceso:           src.exceso,
                            cubre:            src.cubre,
                          } : {
                            id:               src.seleccion.id ?? calderasGas.find(c=>c.marca===src.seleccion.marca&&c.modelo===src.seleccion.modelo)?.id,
                            marca:            src.seleccion.marca,
                            modelo:           src.seleccion.modelo,
                            tipoGas:          src.seleccion.tipoGas,
                            cantidad:         src.seleccion.cantidad,
                            capOutputUnitario: src.seleccion.capOutputUnitario,
                            flujoTotal:       src.seleccion.flujoTotal,
                            capTotal:         src.seleccion.capTotal,
                            exceso:           src.seleccion.exceso,
                            cubre:            true,
                          };

                          const demanda = parseFloat(esManualActivo ? src.demandaTotalBTU : src.demandaTotalBTU);
                          const btuElev = parseFloat(src.btuPorGrado);

                          return (
                            <div className={`bdc-recomendada-card bdc-inset ${modoCaldera === "manual" ? "bdc-card-manual-activa" : ""}`}>
                              <div className="bdc-rec-header">
                                <IconoCaldera />
                                <div className="bdc-rec-titulo">
                                  <span className="bdc-rec-label">{modoCaldera === "manual" ? "Selección manual" : "Recomendado"}</span>
                                  <span className="bdc-rec-modelo">{sel.marca} · {ncCal(sel)}{sel.capOutputUnitario && <span style={{color:"#7dd3fc",fontSize:"0.82em"}}> {fmtBTU(sel.capOutputUnitario)}</span>}{mostrarCodigoCal(sel) && <span style={{color:"#94a3b8",fontSize:"0.8em"}}> {sel.modelo}</span>}</span>
                                </div>
                                <span className={`bdc-modo-badge ${modoCaldera === "manual" ? "badge-manual" : "badge-auto"}`}>
                                  {modoCaldera === "manual" ? "Manual" : "Auto"}
                                </span>
                              </div>
                              <div className="bdc-rec-stats">
                                <div className="bdc-stat">
                                  <span className="bdc-stat-valor">{sel.cantidad}</span>
                                  <span className="bdc-stat-label">equipos</span>
                                </div>
                                <div className="bdc-stat-sep" />
                                <div className="bdc-stat">
                                  <span className="bdc-stat-valor">{fmtBTU(sel.capOutputUnitario)}</span>
                                  <span className="bdc-stat-label">BTU/h c/u</span>
                                </div>
                                <div className="bdc-stat-sep" />
                                <div className="bdc-stat">
                                  <span className="bdc-stat-valor">{fmtBTU(sel.capTotal)}</span>
                                  <span className="bdc-stat-label">BTU/h total</span>
                                </div>
                                <div className="bdc-stat-sep" />
                                <div className="bdc-stat">
                                  <span className="bdc-stat-valor">{parseFloat(sel.flujoTotal).toFixed(1)}</span>
                                  <span className="bdc-stat-label">GPM total</span>
                                </div>
                              </div>
                              <div className="bdc-rec-demanda">
                                <div className="bdc-demanda-fila">
                                  <span className="bdc-demanda-label">BTU elevación temp.</span>
                                  <span className="bdc-demanda-valor">{fmtBTU(btuElev)} BTU/h</span>
                                </div>
                                <div className="bdc-demanda-fila">
                                  <span className="bdc-demanda-label">Pérdidas sistema</span>
                                  <span className="bdc-demanda-valor">{fmtBTU(perdidaTotalBTU)} BTU/h</span>
                                </div>
                                <div className="bdc-demanda-fila">
                                  <span className="bdc-demanda-label">Demanda total</span>
                                  <span className="bdc-demanda-valor">{fmtBTU(demanda)} BTU/h</span>
                                </div>
                                <div className="bdc-demanda-fila">
                                  <span className="bdc-demanda-label">Capacidad instalada</span>
                                  <span className={`bdc-demanda-valor ${sel.cubre ? "bdc-ok" : "bdc-insuf"}`}>
                                    {fmtBTU(sel.capTotal)} BTU/h
                                  </span>
                                </div>
                                <div className="bdc-demanda-fila">
                                  <span className="bdc-demanda-label">{sel.cubre ? "Exceso" : "Déficit"}</span>
                                  <span className={`bdc-demanda-valor ${sel.cubre ? "bdc-exceso" : "bdc-insuf"}`}>
                                    {sel.cubre ? "+" : "-"}{fmtBTU(Math.abs(parseFloat(sel.exceso)))} BTU/h
                                  </span>
                                </div>
                              </div>
                              {src.cargaTotal != null && (
                                <div className="bdc-rec-hidraulica">
                                  <span className="bdc-hid-label">Carga hidráulica</span>
                                  <span className="bdc-hid-valor">{src.cargaTotal} ft · {src.cargaTotalPSI} PSI</span>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {/* ── Panel derecho caldera ── */}
                      <div className="layout-clima-bdc-celda celda-bdc-manual">

                        {/* MODO RECOMENDADO */}
                        {modoCaldera === "recomendado" && calderaSeleccionada && !calderaSeleccionada.error && (
                          <div className="bdc-info-automatica bdc-inset">
                            <div className="bdc-manual-header">
                              <span className="bdc-manual-titulo">Detalle de selección automática</span>
                            </div>
                            <div className="bdc-auto-detalle">
                              <div className="bdc-auto-fila">
                                <span className="bdc-auto-label">Marca</span>
                                <span className="bdc-auto-val">{calderaSeleccionada.seleccion.marca}</span>
                              </div>
                              <div className="bdc-auto-fila">
                                <span className="bdc-auto-label">Modelo</span>
                                <span className="bdc-auto-val">{calderaSeleccionada.seleccion.modelo}</span>
                              </div>
                              <div className="bdc-auto-fila">
                                <span className="bdc-auto-label">Tipo de gas</span>
                                <span className="bdc-auto-val">{calderaSeleccionada.seleccion.tipoGas}</span>
                              </div>
                              <div className="bdc-auto-fila">
                                <span className="bdc-auto-label">Cantidad</span>
                                <span className="bdc-auto-val">{calderaSeleccionada.seleccion.cantidad} equipo{calderaSeleccionada.seleccion.cantidad > 1 ? "s" : ""}</span>
                              </div>
                              <div className="bdc-auto-fila">
                                <span className="bdc-auto-label">Consumo unitario</span>
                                <span className="bdc-auto-val">{fmtBTU(calderaSeleccionada.seleccion.consumoUnitario)} BTU/h</span>
                              </div>
                              <div className="bdc-auto-fila">
                                <span className="bdc-auto-label">Eficiencia</span>
                                <span className="bdc-auto-val">{calderaSeleccionada.seleccion.eficiencia}%</span>
                              </div>
                              <div className="bdc-auto-fila">
                                <span className="bdc-auto-label">Output unitario</span>
                                <span className="bdc-auto-val">{fmtBTU(calderaSeleccionada.seleccion.capOutputUnitario)} BTU/h</span>
                              </div>
                              <div className="bdc-auto-fila">
                                <span className="bdc-auto-label">Flujo por equipo</span>
                                <span className="bdc-auto-val">{calderaSeleccionada.seleccion.flujoPorCaldera} GPM</span>
                              </div>
                              <div className="bdc-auto-fila">
                                <span className="bdc-auto-label">Flujo total</span>
                                <span className="bdc-auto-val">{calderaSeleccionada.seleccion.flujoTotal} GPM</span>
                              </div>
                              <div className="bdc-auto-sep" />
                              <div className="bdc-auto-fila">
                                <span className="bdc-auto-label">Carga tramos caldera</span>
                                <span className="bdc-auto-val">{calderaSeleccionada.cargaTramos} ft</span>
                              </div>
                              <div className="bdc-auto-fila">
                                <span className="bdc-auto-label">Carga CM ida+reg.</span>
                                <span className="bdc-auto-val">
                                  {(parseFloat(calderaSeleccionada.cargaDistanciaIda) + parseFloat(calderaSeleccionada.cargaDistanciaReg)).toFixed(2)} ft
                                </span>
                              </div>
                              <div className="bdc-auto-fila">
                                <span className="bdc-auto-label">Carga estática</span>
                                <span className="bdc-auto-val">{calderaSeleccionada.cargaEstatica} ft</span>
                              </div>
                              <div className="bdc-auto-fila">
                                <span className="bdc-auto-label">Carga fricción alt.</span>
                                <span className="bdc-auto-val">{calderaSeleccionada.cargaFriccionAltura} ft</span>
                              </div>
                              <div className="bdc-auto-fila">
                                <span className="bdc-auto-label">Carga fija global</span>
                                <span className="bdc-auto-val">{calderaSeleccionada.cargaFija_ft} ft</span>
                              </div>
                              <div className="bdc-auto-sep" />
                              <div className="bdc-auto-fila bdc-auto-total">
                                <span className="bdc-auto-label">Carga total</span>
                                <span className="bdc-auto-val bdc-hid-val-highlight">{calderaSeleccionada.cargaTotal} ft · {calderaSeleccionada.cargaTotalPSI} PSI</span>
                              </div>
                            </div>
                          </div>
                        )}
                        {modoCaldera === "recomendado" && (!mostrarSelectorCaldera || !calderaSeleccionada || calderaSeleccionada?.error) && (
                          <div style={{ padding: "1rem", fontSize: "0.75rem", color: "#475569" }}>
                            Completa los datos térmicos para ver el detalle automático
                          </div>
                        )}

                        {/* MODO MANUAL */}
                        {modoCaldera === "manual" && (
                          <>
                            {mostrarSelectorCaldera ? (
                              <div className="bdc-selector-manual bdc-inset">
                                <div className="bdc-manual-header">
                                  <span className="bdc-manual-titulo">Catálogo de calderas</span>
                                </div>
                                <div className="bdc-manual-filtros">
                                  <div className="campo">
                                    <label>Marca</label>
                                    <select value={filtroCalderaMarca} onChange={e => setFiltroCalderaMarca(e.target.value)}>
                                      {marcasCalderaDisponibles.map(m => (
                                        <option key={m} value={m}>{m === "todas" ? "Todas las marcas" : m}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="campo">
                                    <label>Tipo de gas</label>
                                    <select value={filtroCalderaTipoGas} onChange={e => setFiltroCalderaTipoGas(e.target.value)}>
                                      <option value="todos">Natural y propano</option>
                                      <option value="natural">Gas natural</option>
                                      <option value="propano">Propano</option>
                                      <option value="natural / propano">Natural / propano</option>
                                    </select>
                                  </div>
                                </div>
                                <div className="bdc-manual-lista">
                                  {catalogoCalderaFiltrado.map(c => {
                                    const esRecomendado = calderaSeleccionada && c.marca === calderaSeleccionada.seleccion?.marca && c.modelo === calderaSeleccionada.seleccion?.modelo;
                                    const seleccionado  = selManualCalderaId === c.id;
                                    return (
                                      <div key={c.id}
                                        className={`bdc-manual-fila ${seleccionado ? "bdc-manual-fila-activa" : ""}`}
                                        onClick={() => { setSelManualCalderaId(seleccionado ? null : c.id); setSelManualCalderaCant(1); }}
                                      >
                                        <div className="bdc-manual-fila-info">
                                          <span className="bdc-manual-marca">{c.marca}</span>
                                          <span className="bdc-manual-modelo">{ncCal(c)}</span>
                                          <span className="bdc-manual-vel" style={{color:"#64748b",fontSize:"0.6rem"}}>{c.modelo}</span>
                                          <span className="bdc-manual-vel vel-1v">{c.tipoGas}</span>
                                          {esRecomendado && <span className="bdc-manual-badge-rec">★ Rec.</span>}
                                        </div>
                                        <div className="bdc-manual-fila-cap">{fmtBTU(c.specs.capacidadCalentamiento)} BTU/h</div>
                                      </div>
                                    );
                                  })}
                                  {catalogoCalderaFiltrado.length === 0 && (
                                    <div className="bdc-manual-vacio">Sin modelos para estos filtros</div>
                                  )}
                                </div>
                                {selManualCalderaId && (
                                  <div className="bdc-manual-resultado">
                                    <div className="bdc-manual-cant-row">
                                      <span className="bdc-manual-cant-label">Cantidad de equipos</span>
                                      <div className="bdc-manual-cant-ctrl">
                                        <button onClick={() => setSelManualCalderaCant(c => Math.max(1, c - 1))}>−</button>
                                        <span>{selManualCalderaCant}</span>
                                        <button onClick={() => setSelManualCalderaCant(c => c + 1)}>+</button>
                                      </div>
                                    </div>
                                    {calderaManual && (
                                      <>
                                        <div className="bdc-demanda-fila">
                                          <span className="bdc-demanda-label">Capacidad instalada</span>
                                          <span className={`bdc-demanda-valor ${calderaManual.cubre ? "bdc-ok" : "bdc-insuf"}`}>
                                            {fmtBTU(calderaManual.capTotal)} BTU/h
                                          </span>
                                        </div>
                                        <div className="bdc-demanda-fila">
                                          <span className="bdc-demanda-label">{calderaManual.cubre ? "Exceso" : "Déficit"}</span>
                                          <span className={`bdc-demanda-valor ${calderaManual.cubre ? "bdc-exceso" : "bdc-insuf"}`}>
                                            {calderaManual.cubre ? "+" : "-"}{fmtBTU(Math.abs(parseFloat(calderaManual.exceso)))} BTU/h
                                          </span>
                                        </div>
                                        <div className="bdc-demanda-fila">
                                          <span className="bdc-demanda-label">Flujo total</span>
                                          <span className="bdc-demanda-valor">{parseFloat(calderaManual.flujoTotal).toFixed(1)} GPM</span>
                                        </div>
                                        {calderaManual.hidraulica && !calderaManual.hidraulica.error && (
                                          <div className="bdc-manual-hidraulica-detalle">
                                            <div className="bdc-auto-sep" style={{ margin: "0.5rem 0" }} />
                                            <div className="bdc-hid-detalle-titulo">Carga hidráulica calculada</div>
                                            <div className="bdc-auto-fila">
                                              <span className="bdc-auto-label">Carga tramos caldera</span>
                                              <span className="bdc-auto-val">{calderaManual.hidraulica.cargaTramos} ft</span>
                                            </div>
                                            <div className="bdc-auto-fila">
                                              <span className="bdc-auto-label">Carga CM ida+reg.</span>
                                              <span className="bdc-auto-val">
                                                {(parseFloat(calderaManual.hidraulica.cargaDistanciaIda) + parseFloat(calderaManual.hidraulica.cargaDistanciaReg)).toFixed(2)} ft
                                              </span>
                                            </div>
                                            <div className="bdc-auto-fila">
                                              <span className="bdc-auto-label">Carga estática</span>
                                              <span className="bdc-auto-val">{calderaManual.hidraulica.cargaEstatica} ft</span>
                                            </div>
                                            <div className="bdc-auto-fila">
                                              <span className="bdc-auto-label">Carga fricción alt.</span>
                                              <span className="bdc-auto-val">{calderaManual.hidraulica.cargaFriccionAltura} ft</span>
                                            </div>
                                            <div className="bdc-auto-fila">
                                              <span className="bdc-auto-label">Carga fija global</span>
                                              <span className="bdc-auto-val">{calderaManual.hidraulica.cargaFija_ft} ft</span>
                                            </div>
                                            <div className="bdc-auto-sep" style={{ margin: "0.5rem 0" }} />
                                            <div className="bdc-auto-fila bdc-auto-total">
                                              <span className="bdc-auto-label">Carga total</span>
                                              <span className="bdc-auto-val bdc-hid-val-highlight">
                                                {calderaManual.hidraulica.cargaTotal} ft · {calderaManual.hidraulica.cargaTotalPSI} PSI
                                              </span>
                                            </div>
                                          </div>
                                        )}
                                        {!calderaManual.cubre && (
                                          <div className="bdc-manual-aviso">⚠ Capacidad insuficiente — los cálculos usarán esta configuración</div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                )}
                                {!selManualCalderaId && (
                                  <div className="bdc-manual-hint">
                                    Selecciona una caldera del catálogo para calcular carga y flujo
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div style={{ padding: "1rem", fontSize: "0.75rem", color: "#475569" }}>
                                Completa los datos térmicos para habilitar la selección manual
                              </div>
                            )}
                          </>
                        )}

                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── CALENTADOR ELÉCTRICO ── */}
          {sistemasSeleccionados.calentadorElectrico && (
            <div
              className="selector-grupo"
              onMouseEnter={() => !formularioBloqueado && setHoveredField("modoCE")}
              onMouseLeave={() => setHoveredField(null)}
            >
              <div className="selector-subtitulo">
                Calentador eléctrico
                <span className="selector-subtitulo-hint">Selección y cálculo hidráulico</span>
              </div>

              {!sistemasSeleccionados.calentadorElectrico.tasaElevacion && (
                <div style={{ padding: "0.5rem", fontSize: "0.75rem", color: "#f97316" }}>
                  Selecciona una tasa de elevación (°C/h) en la configuración del calentador para ver la selección
                </div>
              )}

              {sistemasSeleccionados.calentadorElectrico.tasaElevacion && (
                <>
                  <div className="bdc-modo-toggle-wrapper" style={{ marginBottom: "0.75rem" }}>
                    <div className="bdc-modo-toggle">
                      <button type="button"
                        className={`bdc-modo-btn ${modoCE === "recomendado" ? "bdc-modo-activo" : ""}`}
                        onClick={() => setModoCE("recomendado")}
                      >
                        {modoCE === "recomendado" && <IconoCheck />}
                        <span>Recomendado</span>
                      </button>
                      <button type="button"
                        className={`bdc-modo-btn ${modoCE === "manual" ? "bdc-modo-activo" : ""}`}
                        onClick={() => setModoCE("manual")}
                      >
                        {modoCE === "manual" && <IconoCheck />}
                        <span>Selección manual</span>
                      </button>
                    </div>
                    {modoCE === "manual" && ceManual && !ceManual.cubre && (
                      <div className="bdc-modo-aviso-deficit">
                        ⚠ La selección manual no cubre la demanda. Los cálculos usarán esta configuración.
                      </div>
                    )}
                  </div>

                  {!mostrarSelectorCE && (
                    <div style={{ padding: "0.5rem", fontSize: "0.75rem", color: "#475569" }}>
                      Completa los datos térmicos para ver la selección
                    </div>
                  )}

                  {mostrarSelectorCE && (
                    <div className="layout-clima-bdc-fila2" style={{ marginTop: 0 }}>

                      {/* ── Tarjeta resumen CE ── */}
                      <div className="layout-clima-bdc-celda celda-bdc-rec">
                        {(() => {
                          const esManualActivo = modoCE === "manual" && ceManual;
                          const src = esManualActivo ? ceManual : ceSeleccionado;
                          if (!src || src.error) return (
                            <div className="bdc-recomendada-card bdc-pendiente bdc-inset">
                              <div className="bdc-rec-header">
                                <IconoCalentadorElectrico />
                                <div className="bdc-rec-titulo">
                                  <span className="bdc-rec-label">Calentador eléctrico</span>
                                  <span className="bdc-rec-modelo bdc-pendiente-txt">
                                    {src?.error ?? "Completa los datos térmicos"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );

                          const sel = esManualActivo ? {
                            id:          src.equipo.id,
                            marca:       src.equipo.marca,
                            modelo:      src.equipo.modelo,
                            cantidad:    src.cantidad,
                            capUnitaria: src.equipo.specs.capacidadCalentamiento,
                            flujoTotal:  src.flujoTotal,
                            capTotal:    src.capTotal,
                            exceso:      src.exceso,
                            cubre:       src.cubre,
                          } : {
                            id:          src.seleccion.id ?? calentadoresElectricos.find(e=>e.marca===src.seleccion.marca&&e.modelo===src.seleccion.modelo)?.id,
                            marca:       src.seleccion.marca,
                            modelo:      src.seleccion.modelo,
                            cantidad:    src.seleccion.cantidad,
                            capUnitaria: src.seleccion.capUnitaria,
                            flujoTotal:  src.seleccion.flujoTotal,
                            capTotal:    src.seleccion.capTotal,
                            exceso:      src.seleccion.exceso,
                            cubre:       true,
                          };

                          const demanda = parseFloat(src.demandaTotalBTU);
                          const btuElev = parseFloat(src.btuPorGrado);

                          return (
                            <div className={`bdc-recomendada-card bdc-inset ${modoCE === "manual" ? "bdc-card-manual-activa" : ""}`}>
                              <div className="bdc-rec-header">
                                <IconoCalentadorElectrico />
                                <div className="bdc-rec-titulo">
                                  <span className="bdc-rec-label">{modoCE === "manual" ? "Selección manual" : "Recomendado"}</span>
                                  <span className="bdc-rec-modelo">{sel.marca} · {ncCal(sel)}{sel.capUnitaria && <span style={{color:"#7dd3fc",fontSize:"0.82em"}}> {fmtBTU(sel.capUnitaria)}</span>}{mostrarCodigoCal(sel) && <span style={{color:"#94a3b8",fontSize:"0.8em"}}> {sel.modelo}</span>}</span>
                                </div>
                                <span className={`bdc-modo-badge ${modoCE === "manual" ? "badge-manual" : "badge-auto"}`}>
                                  {modoCE === "manual" ? "Manual" : "Auto"}
                                </span>
                              </div>
                              <div className="bdc-rec-stats">
                                <div className="bdc-stat">
                                  <span className="bdc-stat-valor">{sel.cantidad}</span>
                                  <span className="bdc-stat-label">equipos</span>
                                </div>
                                <div className="bdc-stat-sep" />
                                <div className="bdc-stat">
                                  <span className="bdc-stat-valor">{fmtBTU(sel.capUnitaria)}</span>
                                  <span className="bdc-stat-label">BTU/h c/u</span>
                                </div>
                                <div className="bdc-stat-sep" />
                                <div className="bdc-stat">
                                  <span className="bdc-stat-valor">{fmtBTU(sel.capTotal)}</span>
                                  <span className="bdc-stat-label">BTU/h total</span>
                                </div>
                                <div className="bdc-stat-sep" />
                                <div className="bdc-stat">
                                  <span className="bdc-stat-valor">{parseFloat(sel.flujoTotal).toFixed(1)}</span>
                                  <span className="bdc-stat-label">GPM total</span>
                                </div>
                              </div>
                              <div className="bdc-rec-demanda">
                                <div className="bdc-demanda-fila">
                                  <span className="bdc-demanda-label">BTU elevación temp.</span>
                                  <span className="bdc-demanda-valor">{fmtBTU(btuElev)} BTU/h</span>
                                </div>
                                <div className="bdc-demanda-fila">
                                  <span className="bdc-demanda-label">Pérdidas sistema</span>
                                  <span className="bdc-demanda-valor">{fmtBTU(perdidaTotalBTU)} BTU/h</span>
                                </div>
                                <div className="bdc-demanda-fila">
                                  <span className="bdc-demanda-label">Demanda total</span>
                                  <span className="bdc-demanda-valor">{fmtBTU(demanda)} BTU/h</span>
                                </div>
                                <div className="bdc-demanda-fila">
                                  <span className="bdc-demanda-label">Capacidad instalada</span>
                                  <span className={`bdc-demanda-valor ${sel.cubre ? "bdc-ok" : "bdc-insuf"}`}>
                                    {fmtBTU(sel.capTotal)} BTU/h
                                  </span>
                                </div>
                                <div className="bdc-demanda-fila">
                                  <span className="bdc-demanda-label">{sel.cubre ? "Exceso" : "Déficit"}</span>
                                  <span className={`bdc-demanda-valor ${sel.cubre ? "bdc-exceso" : "bdc-insuf"}`}>
                                    {sel.cubre ? "+" : "-"}{fmtBTU(Math.abs(parseFloat(sel.exceso)))} BTU/h
                                  </span>
                                </div>
                              </div>
                              {src.cargaTotal != null && (
                                <div className="bdc-rec-hidraulica">
                                  <span className="bdc-hid-label">Carga hidráulica</span>
                                  <span className="bdc-hid-valor">{src.cargaTotal} ft · {src.cargaTotalPSI} PSI</span>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {/* ── Panel derecho CE ── */}
                      <div className="layout-clima-bdc-celda celda-bdc-manual">

                        {/* MODO RECOMENDADO */}
                        {modoCE === "recomendado" && ceSeleccionado && !ceSeleccionado.error && (
                          <div className="bdc-info-automatica bdc-inset">
                            <div className="bdc-manual-header">
                              <span className="bdc-manual-titulo">Detalle de selección automática</span>
                            </div>
                            <div className="bdc-auto-detalle">
                              <div className="bdc-auto-fila">
                                <span className="bdc-auto-label">Marca</span>
                                <span className="bdc-auto-val">{ceSeleccionado.seleccion.marca}</span>
                              </div>
                              <div className="bdc-auto-fila">
                                <span className="bdc-auto-label">Modelo</span>
                                <span className="bdc-auto-val">{ceSeleccionado.seleccion.modelo}</span>
                              </div>
                              <div className="bdc-auto-fila">
                                <span className="bdc-auto-label">Cantidad</span>
                                <span className="bdc-auto-val">{ceSeleccionado.seleccion.cantidad} equipo{ceSeleccionado.seleccion.cantidad > 1 ? "s" : ""}</span>
                              </div>
                              <div className="bdc-auto-fila">
                                <span className="bdc-auto-label">Flujo por equipo</span>
                                <span className="bdc-auto-val">{ceSeleccionado.seleccion.flujoPorEquipo} GPM</span>
                              </div>
                              <div className="bdc-auto-fila">
                                <span className="bdc-auto-label">Flujo total</span>
                                <span className="bdc-auto-val">{ceSeleccionado.seleccion.flujoTotal} GPM</span>
                              </div>
                              <div className="bdc-auto-sep" />
                              <div className="bdc-auto-fila">
                                <span className="bdc-auto-label">Carga tramos CE</span>
                                <span className="bdc-auto-val">{ceSeleccionado.cargaTramos} ft</span>
                              </div>
                              <div className="bdc-auto-fila">
                                <span className="bdc-auto-label">Carga CM ida+reg.</span>
                                <span className="bdc-auto-val">
                                  {(parseFloat(ceSeleccionado.cargaDistanciaIda) + parseFloat(ceSeleccionado.cargaDistanciaReg)).toFixed(2)} ft
                                </span>
                              </div>
                              <div className="bdc-auto-fila">
                                <span className="bdc-auto-label">Carga estática</span>
                                <span className="bdc-auto-val">{ceSeleccionado.cargaEstatica} ft</span>
                              </div>
                              <div className="bdc-auto-fila">
                                <span className="bdc-auto-label">Carga fricción alt.</span>
                                <span className="bdc-auto-val">{ceSeleccionado.cargaFriccionAltura} ft</span>
                              </div>
                              <div className="bdc-auto-fila">
                                <span className="bdc-auto-label">Carga fija global</span>
                                <span className="bdc-auto-val">{ceSeleccionado.cargaFija_ft} ft</span>
                              </div>
                              <div className="bdc-auto-sep" />
                              <div className="bdc-auto-fila bdc-auto-total">
                                <span className="bdc-auto-label">Carga total</span>
                                <span className="bdc-auto-val bdc-hid-val-highlight">{ceSeleccionado.cargaTotal} ft · {ceSeleccionado.cargaTotalPSI} PSI</span>
                              </div>
                            </div>
                          </div>
                        )}
                        {modoCE === "recomendado" && (!mostrarSelectorCE || !ceSeleccionado || ceSeleccionado?.error) && (
                          <div style={{ padding: "1rem", fontSize: "0.75rem", color: "#475569" }}>
                            Completa los datos térmicos para ver el detalle automático
                          </div>
                        )}

                        {/* MODO MANUAL */}
                        {modoCE === "manual" && (
                          <>
                            {mostrarSelectorCE ? (
                              <div className="bdc-selector-manual bdc-inset">
                                <div className="bdc-manual-header">
                                  <span className="bdc-manual-titulo">Catálogo de calentadores eléctricos</span>
                                </div>
                                <div className="bdc-manual-filtros">
                                  <div className="campo">
                                    <label>Marca</label>
                                    <select value={filtroCEMarca} onChange={e => setFiltroCEMarca(e.target.value)}>
                                      {marcasCEDisponibles.map(m => (
                                        <option key={m} value={m}>{m === "todas" ? "Todas las marcas" : m}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                                <div className="bdc-manual-lista">
                                  {catalogoCEFiltrado.map(eq => {
                                    const esRecomendado = ceSeleccionado && eq.marca === ceSeleccionado.seleccion?.marca && eq.modelo === ceSeleccionado.seleccion?.modelo;
                                    const seleccionado  = selManualCEId === eq.id;
                                    return (
                                      <div key={eq.id}
                                        className={`bdc-manual-fila ${seleccionado ? "bdc-manual-fila-activa" : ""}`}
                                        onClick={() => { setSelManualCEId(seleccionado ? null : eq.id); setSelManualCECant(1); }}
                                      >
                                        <div className="bdc-manual-fila-info">
                                          <span className="bdc-manual-marca">{eq.marca}</span>
                                          <span className="bdc-manual-modelo">{ncCal(eq)}</span>
                                          <span className="bdc-manual-vel" style={{color:"#64748b",fontSize:"0.6rem"}}>{eq.modelo}</span>
                                          {esRecomendado && <span className="bdc-manual-badge-rec">★ Rec.</span>}
                                        </div>
                                        <div className="bdc-manual-fila-cap">{fmtBTU(eq.specs.capacidadCalentamiento)} BTU/h</div>
                                      </div>
                                    );
                                  })}
                                  {catalogoCEFiltrado.length === 0 && (
                                    <div className="bdc-manual-vacio">Sin modelos para estos filtros</div>
                                  )}
                                </div>
                                {selManualCEId && (
                                  <div className="bdc-manual-resultado">
                                    <div className="bdc-manual-cant-row">
                                      <span className="bdc-manual-cant-label">Cantidad de equipos</span>
                                      <div className="bdc-manual-cant-ctrl">
                                        <button onClick={() => setSelManualCECant(c => Math.max(1, c - 1))}>−</button>
                                        <span>{selManualCECant}</span>
                                        <button onClick={() => setSelManualCECant(c => c + 1)}>+</button>
                                      </div>
                                    </div>
                                    {ceManual && (
                                      <>
                                        <div className="bdc-demanda-fila">
                                          <span className="bdc-demanda-label">Capacidad instalada</span>
                                          <span className={`bdc-demanda-valor ${ceManual.cubre ? "bdc-ok" : "bdc-insuf"}`}>
                                            {fmtBTU(ceManual.capTotal)} BTU/h
                                          </span>
                                        </div>
                                        <div className="bdc-demanda-fila">
                                          <span className="bdc-demanda-label">{ceManual.cubre ? "Exceso" : "Déficit"}</span>
                                          <span className={`bdc-demanda-valor ${ceManual.cubre ? "bdc-exceso" : "bdc-insuf"}`}>
                                            {ceManual.cubre ? "+" : "-"}{fmtBTU(Math.abs(parseFloat(ceManual.exceso)))} BTU/h
                                          </span>
                                        </div>
                                        <div className="bdc-demanda-fila">
                                          <span className="bdc-demanda-label">Flujo total</span>
                                          <span className="bdc-demanda-valor">{parseFloat(ceManual.flujoTotal).toFixed(1)} GPM</span>
                                        </div>
                                        {ceManual.hidraulica && !ceManual.hidraulica.error && (
                                          <div className="bdc-manual-hidraulica-detalle">
                                            <div className="bdc-auto-sep" style={{ margin: "0.5rem 0" }} />
                                            <div className="bdc-hid-detalle-titulo">Carga hidráulica calculada</div>
                                            <div className="bdc-auto-fila">
                                              <span className="bdc-auto-label">Carga tramos CE</span>
                                              <span className="bdc-auto-val">{ceManual.hidraulica.cargaTramos} ft</span>
                                            </div>
                                            <div className="bdc-auto-fila">
                                              <span className="bdc-auto-label">Carga CM ida+reg.</span>
                                              <span className="bdc-auto-val">
                                                {(parseFloat(ceManual.hidraulica.cargaDistanciaIda) + parseFloat(ceManual.hidraulica.cargaDistanciaReg)).toFixed(2)} ft
                                              </span>
                                            </div>
                                            <div className="bdc-auto-fila">
                                              <span className="bdc-auto-label">Carga estática</span>
                                              <span className="bdc-auto-val">{ceManual.hidraulica.cargaEstatica} ft</span>
                                            </div>
                                            <div className="bdc-auto-fila">
                                              <span className="bdc-auto-label">Carga fricción alt.</span>
                                              <span className="bdc-auto-val">{ceManual.hidraulica.cargaFriccionAltura} ft</span>
                                            </div>
                                            <div className="bdc-auto-fila">
                                              <span className="bdc-auto-label">Carga fija global</span>
                                              <span className="bdc-auto-val">{ceManual.hidraulica.cargaFija_ft} ft</span>
                                            </div>
                                            <div className="bdc-auto-sep" style={{ margin: "0.5rem 0" }} />
                                            <div className="bdc-auto-fila bdc-auto-total">
                                              <span className="bdc-auto-label">Carga total</span>
                                              <span className="bdc-auto-val bdc-hid-val-highlight">
                                                {ceManual.hidraulica.cargaTotal} ft · {ceManual.hidraulica.cargaTotalPSI} PSI
                                              </span>
                                            </div>
                                          </div>
                                        )}
                                        {!ceManual.cubre && (
                                          <div className="bdc-manual-aviso">⚠ Capacidad insuficiente — los cálculos usarán esta configuración</div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                )}
                                {!selManualCEId && (
                                  <div className="bdc-manual-hint">
                                    Selecciona un equipo del catálogo para calcular carga y flujo
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div style={{ padding: "1rem", fontSize: "0.75rem", color: "#475569" }}>
                                Completa los datos térmicos para habilitar la selección manual
                              </div>
                            )}
                          </>
                        )}

                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── MOTOBOMBA ── */}
          <div className="selector-grupo" style={{ border:"1px solid rgba(167,139,250,0.25)", background:"rgba(167,139,250,0.04)" }}>
            <div className="selector-subtitulo" style={{ borderLeftColor:"#a78bfa", color:"#c4b5fd" }}>
              Motobomba para sistema de calentamiento
              <span style={{ marginLeft:"0.5rem", fontSize:"0.62rem", fontWeight:600, color:"#a78bfa", background:"rgba(167,139,250,0.12)", border:"1px solid rgba(167,139,250,0.3)", borderRadius:"10px", padding:"1px 7px", verticalAlign:"middle", letterSpacing:"0.03em" }}>Próximamente</span>
            </div>
            <div className="bloque-proximamente">
              <div className="selector-radios">
                <label><input type="radio" disabled /> Sí, motobomba independiente</label>
                <label><input type="radio" disabled /> No, comparte motobomba de filtrado</label>
              </div>
            </div>
            <div style={{ fontSize:"0.68rem", color:"#64748b", marginTop:"0.3rem" }}>
              Este módulo estará disponible en una próxima actualización.
            </div>
          </div>

        </div>

        <div className="selector-footer fijo calentamiento">
          <span>Modo ingeniería · Calentamiento</span>
          <span className="footer-highlight">
            {hoveredField ? descripcionesCampos[hoveredField] : descripcionesCampos.default}
          </span>
        </div>

      </div>
    </div>
  );
}