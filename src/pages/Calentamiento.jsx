import { useState, useMemo, useEffect } from "react";
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
import { bombaDeCalor }    from "../utils/bombaDeCalor";
import { bombasCalor }     from "../data/bombasDeCalor";

ChartJS.register(ArcElement, Tooltip, Legend);

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
const SISTEMA_DEFAULTS = () => ({ distancia: "", alturaVertical: "", tasaElevacion: null });

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

  /* ── Modo selección BDC: "recomendado" | "manual" ── */
  const [modoBDC, setModoBDC] = useState(datosPrevios.modoBDC ?? "recomendado");

  /* ── Selector manual BDC ── */
  const [filtroBDCMarca,     setFiltroBDCMarca]    = useState("todas");
  const [filtroBDCVelocidad, setFiltroBDCVelocidad] = useState("todas");
  const [selManualBDCId,     setSelManualBDCId]     = useState(datosPrevios.selManualBDCId ?? null);
  const [selManualCantidad,  setSelManualCantidad]  = useState(datosPrevios.selManualCantidad ?? 1);

  /* ── BDC seleccionada (recomendada o manual) para usar en cálculo ── */
  const [bdcConfirmada, setBdcConfirmada] = useState(datosPrevios.bdcConfirmada ?? null);

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
      if (k === "caldera") return base && s.tasaElevacion !== null;
      return base;
    });
  }, [sistemasSeleccionados]);

  const calentamientoCompleto = () => {
    if (!ciudad) return false;
    if (tempDeseada === null || tempDeseada <= 0) return false;
    if (!Object.values(mesesCalentar).some(v => v)) return false;
    if (cubierta === null) return false;
    if (techada === null) return false;
    if (!usarBombaCalentamiento) return false;
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
    if (!usarBombaCalentamiento) errores.usarBombaCalentamiento = true;
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

  const mesMasFrio = useMemo(() => {
    const sel = clima.filter(m => mesesCalentar[m.mes]);
    if (!sel.length) return null;
    return sel.reduce((frio, actual) => actual.tProm < frio.tProm ? actual : frio);
  }, [clima, mesesCalentar]);

  const datosTermicos = useMemo(() => ({
    area: areaTotal, volumen: volumenTotal, profundidad: profundidadPromedio,
    tempDeseada, techada, cubierta
  }), [areaTotal, volumenTotal, profundidadPromedio, tempDeseada, techada, cubierta]);

  const profMaxSistema = useMemo(() => {
    if (!sistemaActivo?.cuerpos?.length) return 0;
    return Math.max(...sistemaActivo.cuerpos.map(c => Math.max(parseFloat(c.profMin) || 0, parseFloat(c.profMax) || 0)));
  }, [sistemaActivo]);

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
      const resultado = retorno(flujoMax, tipoRetorno, datosParaRetorno);
      return {
        ...resultado,
        resumenTramosR:   JSON.parse(JSON.stringify(resultado.resumenTramosR ?? {})),
        resumenDisparosR: JSON.parse(JSON.stringify(resultado.resumenDisparosR ?? {})),
      };
    } catch (e) { console.error("Error en retorno():", e); return null; }
  }, [sistemaActivo, areaTotal, profMaxSistema, tipoRetorno, tempDeseada, mesMasFrio]);

  /* ── PASO 1 ── */
  const perdidaTuberiaBase = useMemo(() => {
    if (!resultadoRetorno || !mesMasFrio || !tempDeseada) return 0;
    const { resumenTramosR, resumenDisparosR } = resultadoRetorno;
    const resultado = qTuberia(resumenTramosR, resumenDisparosR, {}, { tempDeseada }, mesMasFrio);
    return resultado.total_BTU_h ?? 0;
  }, [resultadoRetorno, mesMasFrio, tempDeseada]);

  const perdidaTotalPaso1 = useMemo(() =>
    perdidaEvaporacion + perdidaConveccion + perdidaRadiacion +
    perdidaTransmision + perdidaInfinity   + perdidaCanal    + perdidaTuberiaBase,
  [perdidaEvaporacion, perdidaConveccion, perdidaRadiacion, perdidaTransmision, perdidaInfinity, perdidaCanal, perdidaTuberiaBase]);

  const bdcPaso1 = useMemo(() => {
    if (!sistemasSeleccionados.bombaCalor) return null;
    if (perdidaTotalPaso1 <= 0) return null;
    const distancia      = parseFloat(sistemasSeleccionados.bombaCalor.distancia)      || 0;
    const alturaVertical = parseFloat(sistemasSeleccionados.bombaCalor.alturaVertical) || 0;
    try { return bombaDeCalor(perdidaTotalPaso1, distancia, alturaVertical); }
    catch (e) { console.error("Error en bombaDeCalor() paso 1:", e); return null; }
  }, [sistemasSeleccionados, perdidaTotalPaso1]);

  const resumenBDCR = useMemo(() => {
    if (!bdcPaso1?.resumenMaterialesTuberia) return {};
    return Object.fromEntries(
      bdcPaso1.resumenMaterialesTuberia.map(({ tuberia, tuberia_m, tees, codos, reducciones }) => [
        tuberia,
        { tuberia_m: parseFloat(tuberia_m) || 0, tees: Number(tees) || 0, codos: Number(codos) || 0, reducciones: Number(reducciones) || 0 }
      ])
    );
  }, [bdcPaso1]);

  /* ── PASO 2 ── */
  const perdidaTuberia = useMemo(() => {
    if (!resultadoRetorno || !mesMasFrio || !tempDeseada) return 0;
    const { resumenTramosR, resumenDisparosR } = resultadoRetorno;
    const resultado = qTuberia(resumenTramosR, resumenDisparosR, resumenBDCR, { tempDeseada }, mesMasFrio);
    return resultado.total_BTU_h ?? 0;
  }, [resultadoRetorno, resumenBDCR, mesMasFrio, tempDeseada]);

  const perdidasBTU = useMemo(() => ({
    evaporacion: perdidaEvaporacion, conveccion: perdidaConveccion,
    radiacion:   perdidaRadiacion,   transmision: perdidaTransmision,
    infinity:    perdidaInfinity,    canal: perdidaCanal,
    tuberia:     perdidaTuberia,
  }), [perdidaEvaporacion, perdidaConveccion, perdidaRadiacion, perdidaTransmision, perdidaInfinity, perdidaCanal, perdidaTuberia]);

  const perdidaTotalBTU = useMemo(() => Object.values(perdidasBTU).reduce((a, b) => a + b, 0), [perdidasBTU]);

  /* ── BDC recomendada (siempre se calcula) ── */
  const bdcSeleccionada = useMemo(() => {
    if (!sistemasSeleccionados.bombaCalor) return null;
    if (perdidaTotalBTU <= 0) return null;
    const distancia      = parseFloat(sistemasSeleccionados.bombaCalor.distancia)      || 0;
    const alturaVertical = parseFloat(sistemasSeleccionados.bombaCalor.alturaVertical) || 0;
    try { return bombaDeCalor(perdidaTotalBTU, distancia, alturaVertical); }
    catch (e) { console.error("Error en bombaDeCalor() paso 2:", e); return null; }
  }, [sistemasSeleccionados, perdidaTotalBTU]);

  /* ── Catálogo ── */
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

  /* ── BDC Manual: hidráulica calculada con bombaDeCalor() ── */
  const bdcManual = useMemo(() => {
    if (!selManualBDCId || perdidaTotalBTU <= 0) return null;
    const bombaElegida = bombasCalor.find(b => b.id === selManualBDCId);
    if (!bombaElegida) return null;
    const distancia      = parseFloat(sistemasSeleccionados.bombaCalor?.distancia)      || 0;
    const alturaVertical = parseFloat(sistemasSeleccionados.bombaCalor?.alturaVertical) || 0;
    const capTotal = bombaElegida.specs.capacidadCalentamiento * selManualCantidad;
    const exceso   = capTotal - perdidaTotalBTU;
    const cubre    = capTotal >= perdidaTotalBTU;

    /* Calcular hidráulica usando el flujo real de las bombas manuales seleccionadas */
    const flujoManualTotal = bombaElegida.specs.flujo * selManualCantidad;
    try {
      /* Llamamos bombaDeCalor con la pérdida real pero la función internamente
         usa el catálogo para seleccionar flujo, así que también calculamos
         la carga hidráulica directamente para el flujo manual */
      const hidraulica = bombaDeCalor(perdidaTotalBTU, distancia, alturaVertical);
      return {
        bomba: bombaElegida,
        cantidad: selManualCantidad,
        capTotal,
        exceso,
        cubre,
        flujoTotal: flujoManualTotal,
        hidraulica,
      };
    } catch { return null; }
  }, [selManualBDCId, selManualCantidad, perdidaTotalBTU, sistemasSeleccionados]);

  /* ── BDC efectiva: la que se usa en cálculos posteriores ── */
  const bdcEfectiva = useMemo(() => {
    if (!sistemasSeleccionados.bombaCalor) return null;
    if (modoBDC === "manual" && bdcManual) return bdcManual.hidraulica;
    return bdcSeleccionada;
  }, [modoBDC, bdcManual, bdcSeleccionada, sistemasSeleccionados]);

  useEffect(() => {
    if (selManualBDCId && !catalogoFiltrado.find(b => b.id === selManualBDCId)) {
      setSelManualBDCId(null); setSelManualCantidad(1);
    }
  }, [catalogoFiltrado, selManualBDCId]);

  useEffect(() => {
    setDatosPorSistema(prev => ({
      ...prev,
      calentamiento: {
        decision, usarBombaCalentamiento, ciudad, tempDeseada, cubierta, techada,
        mesesCalentar, perdidasBTU, perdidaTotalBTU, sistemasSeleccionados,
        modoBDC,
        selManualBDCId,
        selManualCantidad,
        resumenTramosR:   resultadoRetorno?.resumenTramosR   ?? {},
        resumenDisparosR: resultadoRetorno?.resumenDisparosR ?? {},
        bdcSeleccionada,
        bdcManual: bdcManual ?? null,
        bdcEfectiva,
      }
    }));
  }, [decision, usarBombaCalentamiento, ciudad, tempDeseada, cubierta, techada,
      mesesCalentar, perdidasBTU, perdidaTotalBTU, sistemasSeleccionados,
      modoBDC, selManualBDCId, selManualCantidad,
      resultadoRetorno, bdcSeleccionada, bdcManual, bdcEfectiva, setDatosPorSistema]);

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
    default: "Configuración térmica del sistema"
  };

  const pieData = useMemo(() => ({
    labels: ["Evaporación", "Convección", "Radiación", "Transmisión", "Infinity", "Canal Perimetral", "Tubería"],
    datasets: [{
      data: [perdidasBTU.evaporacion, perdidasBTU.conveccion, perdidasBTU.radiacion, perdidasBTU.transmision, perdidasBTU.infinity, perdidasBTU.canal, perdidasBTU.tuberia],
      backgroundColor: ["rgba(30,64,175,0.85)","rgba(56,189,248,0.85)","rgba(251,113,133,0.85)","rgba(163,163,163,0.85)","rgba(34,197,94,0.85)","rgba(96,165,250,0.85)","rgba(251,191,36,0.85)"],
      borderColor: "rgba(15,23,42,0.8)", borderWidth: 2,
    }]
  }), [perdidasBTU]);

  const pieOptions = {
    responsive: true, maintainAspectRatio: false,
    layout: { padding: { top: 18, bottom: 18, left: 18, right: 18 } },
    plugins: {
      legend: { position: "right", labels: { color: "#e5e7eb", font: { size: 13, weight: "500" }, padding: 14, boxWidth: 14 } },
      tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed.toFixed(0)} BTU/h` } }
    }
  };

  const fmtBTU = (v) => Math.round(v).toLocaleString("es-MX");
  const formularioBloqueado = decision === null;
  const mostrarSelectorBDC = sistemasSeleccionados.bombaCalor && perdidaTotalBTU > 0;

  /* ── Determinar qué BDC mostrar en la tarjeta activa ── */
  const bdcActivaParaMostrar = useMemo(() => {
    if (modoBDC === "manual" && bdcManual) return bdcManual.hidraulica;
    return bdcSeleccionada;
  }, [modoBDC, bdcManual, bdcSeleccionada]);

  const infoActivaParaMostrar = useMemo(() => {
    if (modoBDC === "manual" && bdcManual) {
      return {
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
                    (key === "caldera" && datos.tasaElevacion === null)
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
                          <input type="number" min="0"
                            className={`input-azul ${camposIncompletos && datos.distancia === "" ? "input-error" : ""}`}
                            value={datos.distancia}
                            onChange={e => updateSistemaField(key, "distancia", e.target.value)}
                            placeholder="ej. 5"
                          />
                        </div>
                        <div className="campo">
                          <label>Altura vertical sobre espejo de agua (m)</label>
                          <input type="number" min="0"
                            className={`input-azul ${camposIncompletos && datos.alturaVertical === "" ? "input-error" : ""}`}
                            value={datos.alturaVertical}
                            onChange={e => updateSistemaField(key, "alturaVertical", e.target.value)}
                            placeholder="ej. 2"
                          />
                        </div>
                        {key === "caldera" && (
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
                <input type="number"
                  className={`input-azul ${mostrarErrores && errores.tempDeseada ? "input-error" : ""}`}
                  value={tempDeseadaInput}
                  onChange={e => { const val = e.target.value; setTempDeseadaInput(val); setTempDeseada(val === "" ? null : Number(val)); }}
                />
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

            {/* ── FILA 1: gráfica | tabla ── */}
            <div className="layout-clima-bdc-fila1">
              <div className="layout-clima-bdc-celda celda-grafica"
                onMouseEnter={() => !formularioBloqueado && setHoveredField("grafica")}
                onMouseLeave={() => setHoveredField(null)}>
                <div className="grafica-mini">
                  <Pie data={pieData} options={pieOptions} />
                </div>
              </div>

              <div className="layout-clima-bdc-celda celda-tabla"
                onMouseEnter={() => !formularioBloqueado && setHoveredField("meses")}
                onMouseLeave={() => setHoveredField(null)}>
                <div className="tabla-clima-card">
                  <table className="tabla-clima-pro">
                    <thead>
                      <tr>
                        <th>Mes</th><th>Temp Min (°C)</th><th>Temp Prom (°C)</th>
                        <th>Temp Max (°C)</th><th>Humedad (%)</th><th>Viento</th>
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
                      {clima.map(m => (
                        <tr key={m.mes}>
                          <td>{m.mes}</td><td>{m.tMin}</td><td>{m.tProm}</td>
                          <td>{m.tMax}</td><td>{m.humedad}</td><td>{m.viento}</td>
                          <td>
                            <input type="checkbox"
                              checked={mesesCalentar[m.mes] || false}
                              onChange={() => setMesesCalentar(prev => ({ ...prev, [m.mes]: !prev[m.mes] }))}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className={`tabla-resumen-frio ${mesMasFrio ? "visible" : "oculto"}`}>
                    <div className="resumen-titulo">Mes más frío seleccionado</div>
                    <table className="tabla-clima-pro resumen">
                      <thead>
                        <tr><th>Mes</th><th>Temp Min (°C)</th><th>Temp Prom (°C)</th><th>Viento Máx</th><th>Humedad (%)</th></tr>
                      </thead>
                      <tbody>
                        {mesMasFrio
                          ? <tr><td>{mesMasFrio.mes}</td><td>{mesMasFrio.tMin}</td><td>{mesMasFrio.tProm}</td><td>{mesMasFrio.viento}</td><td>{mesMasFrio.humedad}</td></tr>
                          : <tr><td colSpan={5} className="resumen-placeholder">Selecciona meses para ver el resumen</td></tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>{/* fin fila1 */}

            {/* ── FILA 2: Panel BDC con toggle Recomendado/Manual ── */}
            {sistemasSeleccionados.bombaCalor && (
              <div
                className="layout-clima-bdc-fila2"
                onMouseEnter={() => !formularioBloqueado && setHoveredField("modoBDC")}
                onMouseLeave={() => setHoveredField(null)}
              >
                {/* ── Toggle de modo ── */}
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

                {/* ── Tarjeta resumen activa (recomendado o manual confirmado) ── */}
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
                            {infoActivaParaMostrar.marca} · {infoActivaParaMostrar.modelo}
                          </span>
                        </div>
                        {/* Badge de modo activo */}
                        <span className={`bdc-modo-badge ${modoBDC === "manual" ? "badge-manual" : "badge-auto"}`}>
                          {modoBDC === "manual" ? "Manual" : "Auto"}
                        </span>
                      </div>
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
                        {infoActivaParaMostrar.flujoTotal != null && (
                          <div className="bdc-demanda-fila">
                            <span className="bdc-demanda-label">Flujo total</span>
                            <span className="bdc-demanda-valor">
                              {parseFloat(infoActivaParaMostrar.flujoTotal).toFixed(1)} GPM
                            </span>
                          </div>
                        )}
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

                {/* ── Panel derecho: contenido según modo ── */}
                <div className="layout-clima-bdc-celda celda-bdc-manual">

                  {/* MODO RECOMENDADO: solo info de la BDC automática */}
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

                  {/* MODO MANUAL: selector de catálogo */}
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
                                    <span className="bdc-manual-modelo">{b.modelo}</span>
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
                                  {/* Detalle hidráulico de la selección manual */}
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
            )}{/* fin fila2 */}

          </div>{/* fin selector-grupo análisis climático */}

          {/* ── MOTOBOMBA ── */}
          <div className="selector-grupo">
            <div className="selector-subtitulo">Motobomba para sistema de calentamiento</div>
            <div className={`selector-radios ${mostrarErrores && errores.usarBombaCalentamiento ? "grupo-radio-error" : ""}`}
              onMouseEnter={() => !formularioBloqueado && setHoveredField("usarBombaCalentamiento")}
              onMouseLeave={() => setHoveredField(null)}
            >
              <label><input type="radio" checked={usarBombaCalentamiento === "si"} onChange={() => setUsarBombaCalentamiento("si")} /> Sí, motobomba independiente</label>
              <label><input type="radio" checked={usarBombaCalentamiento === "no"} onChange={() => setUsarBombaCalentamiento("no")} /> No, comparte motobomba de filtrado</label>
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