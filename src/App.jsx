import "./estilos.css";
import { useState, useRef, useMemo, useEffect } from "react";
import {
  Home, ChevronLeft, ChevronRight, Settings, CreditCard, Palette,
  HelpCircle, LogOut, Plus, Sun, Moon, Ruler, Flame, Wrench, BarChart2, ChevronDown
} from "lucide-react";

import Dimensiones   from "./pages/Dimensiones.jsx";
import Calentamiento from "./pages/Calentamiento.jsx";
import Equipamiento  from "./pages/Equipamiento.jsx";

import { volumen }          from "./utils/volumen";
import { flujoFinal }       from "./utils/flujoFinal";
import { flujoInfinity }    from "./utils/flujoInfinity";
import { generadorDeCloro } from "./utils/generadorDeCloro";

import { formatBTU, formatM2, formatM3, formatMetro, formatGPM } from "./utils/format";

/* =====================================================
   ÁREA TOTAL
===================================================== */
function areaTotal(datosSistema) {
  if (!datosSistema || !Array.isArray(datosSistema.cuerpos)) return 0;
  const total = datosSistema.cuerpos.reduce((acc, cuerpo) => {
    const area = parseFloat(cuerpo.area);
    return acc + (isNaN(area) ? 0 : area);
  }, 0);
  return parseFloat(total.toFixed(1));
}

/* =====================================================
   MENÚ USUARIO
===================================================== */
function MenuUsuario({ abierto, onCerrar, panelColapsado, temaOscuro, setTemaOscuro }) {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!abierto) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onCerrar();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div ref={menuRef} className={`menu-usuario-popup ${panelColapsado ? "menu-usuario-colapsado" : ""}`}>
      <div className="menu-usuario-cuenta">
        <div className="menu-usuario-avatar">OS</div>
        <div className="menu-usuario-info">
          <span className="menu-usuario-nombre">Orlando Salcedo</span>
          <span className="menu-usuario-plan">Gratis</span>
        </div>
      </div>
      <div className="menu-usuario-divider" />
      <button className="menu-usuario-item"><Plus size={15} /><span>Añadir una cuenta</span></button>
      <div className="menu-usuario-divider" />
      <button className="menu-usuario-item"><CreditCard size={15} /><span>Cambiar plan</span></button>
      <button className="menu-usuario-item"><Palette size={15} /><span>Personalización</span></button>
      <button className="menu-usuario-item"><Settings size={15} /><span>Configuración</span></button>
      <button
        className="menu-usuario-item menu-usuario-item-tema"
        onClick={() => { setTemaOscuro(!temaOscuro); onCerrar(); }}
      >
        {temaOscuro ? <Sun size={15} /> : <Moon size={15} />}
        <span>{temaOscuro ? "Modo claro" : "Modo oscuro"}</span>
        <span className="menu-usuario-tema-badge">{temaOscuro ? "☀️" : "🌙"}</span>
      </button>
      <div className="menu-usuario-divider" />
      <button className="menu-usuario-item menu-usuario-item-arrow">
        <HelpCircle size={15} /><span>Ayuda</span>
        <ChevronRight size={13} className="menu-usuario-arrow" />
      </button>
      <button className="menu-usuario-item menu-usuario-item-danger">
        <LogOut size={15} /><span>Cerrar sesión</span>
      </button>
      <div className="menu-usuario-divider" />
      <div className="menu-usuario-footer">
        <span>Política de privacidad</span><span>·</span><span>Condiciones del servicio</span>
      </div>
      <div className="menu-usuario-upgrade">
        <div className="menu-usuario-avatar menu-usuario-avatar-sm">OS</div>
        <div className="menu-usuario-upgrade-info">
          <span>Orlando Salc...</span>
          <span className="menu-usuario-plan">Gratis</span>
        </div>
        <button className="menu-usuario-btn-upgrade">Mejorar plan</button>
      </div>
    </div>
  );
}

/* =====================================================
   LOGO — expandido
===================================================== */
function LogoCompleto() {
  return (
    <div className="logo-completo-wrapper">
      <svg width="28" height="32" viewBox="0 0 90 108" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="lg-s" x1="0" y1="0" x2="90" y2="108" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2d88e0" /><stop offset="100%" stopColor="#00ccff" />
          </linearGradient>
          <linearGradient id="lg-f" x1="10" y1="0" x2="80" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00aaff" stopOpacity="0" />
            <stop offset="25%" stopColor="#00ccff" stopOpacity="0.9" />
            <stop offset="75%" stopColor="#2d88e0" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#2d88e0" stopOpacity="0" />
          </linearGradient>
          <clipPath id="lg-clip"><path d="M45 4C45 4 9 46 9 68A36 36 0 0 0 81 68C81 46 45 4 45 4Z" /></clipPath>
          <filter id="lg-glow"><feGaussianBlur stdDeviation="1.8" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <path d="M45 4C45 4 9 46 9 68A36 36 0 0 0 81 68C81 46 45 4 45 4Z" fill="none" stroke="url(#lg-s)" strokeWidth="2.4" />
        <g clipPath="url(#lg-clip)">
          <line x1="9" y1="68" x2="81" y2="68" stroke="#2d88e0" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.35" />
          <line x1="45" y1="8" x2="45" y2="102" stroke="#2d88e0" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.25" />
          <line x1="25" y1="65" x2="25" y2="71" stroke="#2d88e0" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
          <line x1="35" y1="65" x2="35" y2="71" stroke="#2d88e0" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
          <line x1="55" y1="65" x2="55" y2="71" stroke="#2d88e0" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
          <line x1="65" y1="65" x2="65" y2="71" stroke="#2d88e0" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
          <path d="M13 80 Q27 61 45 72 Q63 83 77 63" stroke="url(#lg-f)" strokeWidth="2.4" strokeLinecap="round" fill="none" filter="url(#lg-glow)" />
          <polygon points="77,63 71,61 73,68" fill="#00ccff" opacity="0.9" />
          <circle cx="45" cy="72" r="3.4" fill="#00ccff" filter="url(#lg-glow)" />
          <circle cx="45" cy="72" r="7" fill="#00ccff" fillOpacity="0.2" />
          <line x1="41.5" y1="68" x2="48.5" y2="68" stroke="#00aaff" strokeWidth="1.1" strokeLinecap="round" opacity="0.7" />
          <line x1="45" y1="64.5" x2="45" y2="71.5" stroke="#00aaff" strokeWidth="1.1" strokeLinecap="round" opacity="0.7" />
        </g>
      </svg>
      <div className="logo-completo-texto">
        <span className="logo-nombre">Pool<span className="logo-nombre-acento">Metric</span></span>
        <span className="logo-subtitulo">HYDRAULIC DESIGN</span>
      </div>
    </div>
  );
}

/* =====================================================
   LOGO — colapsado
===================================================== */
function LogoIcono() {
  return (
    <svg width="26" height="30" viewBox="0 0 90 108" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pl-s" x1="0" y1="0" x2="90" y2="108" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2d88e0" /><stop offset="100%" stopColor="#00ccff" />
        </linearGradient>
        <clipPath id="pl-clip"><path d="M45 4C45 4 9 46 9 68A36 36 0 0 0 81 68C81 46 45 4 45 4Z" /></clipPath>
        <filter id="pl-glow"><feGaussianBlur stdDeviation="2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <path d="M45 4C45 4 9 46 9 68A36 36 0 0 0 81 68C81 46 45 4 45 4Z" fill="none" stroke="url(#pl-s)" strokeWidth="5" />
      <g clipPath="url(#pl-clip)">
        <line x1="14" y1="64" x2="76" y2="64" stroke="#2d88e0" strokeWidth="7" strokeLinecap="round" />
        <polygon points="36,64 28,57 28,71" fill="#00ccff" />
        <polygon points="60,64 52,57 52,71" fill="#00ccff" />
        <line x1="45" y1="64" x2="45" y2="46" stroke="#00aaff" strokeWidth="2.5" strokeDasharray="3 2.5" strokeLinecap="round" opacity="0.7" />
        <circle cx="45" cy="40" r="8" fill="#0a1628" stroke="#2d88e0" strokeWidth="2.5" />
        <line x1="40" y1="37.5" x2="50" y2="37.5" stroke="#00ccff" strokeWidth="2" strokeLinecap="round" />
        <line x1="45" y1="37.5" x2="45" y2="44" stroke="#00ccff" strokeWidth="2" strokeLinecap="round" />
        <circle cx="45" cy="64" r="6" fill="#00ccff" filter="url(#pl-glow)" />
        <circle cx="45" cy="64" r="10" fill="#00ccff" fillOpacity="0.18" />
      </g>
    </svg>
  );
}

/* =====================================================
   HELPERS FORMAT
===================================================== */
const fmtFt  = (v) => v != null && !isNaN(v) ? `${parseFloat(v).toFixed(2)} ft`     : "—";
const fmtGPM = (v) => v != null && !isNaN(v) && parseFloat(v) > 0
  ? `${parseFloat(v).toFixed(1)} gpm` : "—";
const fmtKg  = (v) => v != null && !isNaN(v) ? `${parseFloat(v).toFixed(3)} kg/día` : "—";
const fmtTub = (v) => v ? v.replace("tuberia ", "") + '"'                            : "—";
const fmtVel = (v) => v != null && !isNaN(v) ? `${parseFloat(v).toFixed(2)} ft/s`   : "—";

/* =====================================================
   HELPER — extrae flujo, carga, tubería y velocidad
===================================================== */
function extraerFlujoCarga(calentamiento, {
  sistemaKey, modoKey, selKey, manualKey,
  flujoFn, cargaFn, manualFlujoFn, manualCargaFn,
}) {
  if (!calentamiento?.sistemasSeleccionados?.[sistemaKey])
    return { flujo: null, carga: null, tuberia: null, velocidad: null };

  const modo   = calentamiento[modoKey] ?? "recomendado";
  const sel    = calentamiento[selKey];
  const manual = calentamiento[manualKey];

  if (modo === "manual" && manual && !manual.error) {
    return {
      flujo:     parseFloat(manualFlujoFn(manual)) || null,
      carga:     parseFloat(manualCargaFn(manual)) || null,
      tuberia:   manual?.hidraulica?.tablaTramos?.[0]?.tuberia   ?? null,
      velocidad: manual?.hidraulica?.tablaTramos?.[0]?.velocidad ?? null,
    };
  }
  if (sel && !sel.error) {
    return {
      flujo:     parseFloat(flujoFn(sel)) || null,
      carga:     parseFloat(cargaFn(sel)) || null,
      tuberia:   sel?.tablaTramos?.[0]?.tuberia   ?? null,
      velocidad: sel?.tablaTramos?.[0]?.velocidad ?? null,
    };
  }
  return { flujo: null, carga: null, tuberia: null, velocidad: null };
}

/* =====================================================
   COMPONENTE — ResultadoToggle reutilizable
===================================================== */
function ResultadoToggle({ variante, emoji, label, abierto, onToggle, children }) {
  return (
    <div className={`resultado-toggle-bloque resultado-toggle-bloque--${variante}`}>
      <button
        onClick={onToggle}
        className={`resultado-toggle-btn resultado-toggle-btn--${variante} ${abierto ? "abierto" : ""}`}
      >
        <span className="resultado-toggle-btn-label">
          <span>{emoji}</span> {label}
        </span>
        <ChevronDown
          size={12}
          className={`resultado-toggle-chevron ${abierto ? "abierto" : ""}`}
        />
      </button>
      {abierto && (
        <div className={`resultado-toggle-cuerpo resultado-toggle-cuerpo--${variante}`}>
          {children}
        </div>
      )}
    </div>
  );
}

/* =====================================================
   APP
===================================================== */
export default function App() {
  const [seccion, setSeccion]                       = useState("dimensiones");
  const [panelColapsado, setPanelColapsado]         = useState(false);
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);
  const [temaOscuro, setTemaOscuro]                 = useState(true);
  const [datosPorSistema, setDatosPorSistema]       = useState({});
  const [sistemaActivo, setSistemaActivo]           = useState(null);
  const dimensionesRef                              = useRef(null);

  const [toggleFiltrado,      setToggleFiltrado]      = useState(false);
  const [toggleCalentamiento, setToggleCalentamiento] = useState(false);
  const [toggleSanitizacion,  setToggleSanitizacion]  = useState(false);

  const handleHome = () => {
    setSeccion("dimensiones");
    setSistemaActivo(null);
    dimensionesRef.current?.resetDimensiones();
  };

  useEffect(() => {
    document.body.className = temaOscuro ? "tema-oscuro" : "tema-claro";
  }, [temaOscuro]);

  useEffect(() => {
    const titulos = {
      dimensiones:   "PoolMetric · Dimensiones",
      calentamiento: "PoolMetric · Calentamiento",
      equipamiento:  "PoolMetric · Equipamiento",
    };
    document.title = titulos[seccion] ?? "PoolMetric";
  }, [seccion]);

  const datosDim      = datosPorSistema?.[sistemaActivo];
  const areaCalculada = areaTotal(datosDim);

  const volumenTotal = useMemo(() => {
    if (!datosDim || !Array.isArray(datosDim.cuerpos)) return 0;
    return parseFloat(
      datosDim.cuerpos.reduce((acc, c) => acc + volumen(c, c.volumenCalculado ?? null), 0).toFixed(1)
    );
  }, [datosDim]);

  const datosFlujo = useMemo(() => {
    if (!datosDim?.cuerpos) return null;
    return {
      tasaGeneral: datosDim.tasaGeneral,
      tasaJacuzzi: datosDim.tasaJacuzzi,
      cuerpos: datosDim.cuerpos.map(c => ({ tipo: c.tipoCuerpo, volumen: volumen(c) })),
    };
  }, [datosDim]);

  const flujoFiltrado        = useMemo(() => datosFlujo ? flujoFinal(datosFlujo) : 0, [datosFlujo]);
  const flujoInfinitySistema = useMemo(() => {
    if (!datosDim || !(datosDim.desborde === "infinity" || datosDim.desborde === "ambos")) return 0;
    return flujoInfinity(datosDim);
  }, [datosDim]);

  const profundidadPromedio = useMemo(() => {
    if (areaCalculada > 0 && volumenTotal > 0)
      return parseFloat((volumenTotal / areaCalculada).toFixed(2));
    return 0;
  }, [areaCalculada, volumenTotal]);

  const sistemaListoCalor = areaCalculada > 0 && volumenTotal > 0 && profundidadPromedio > 0;

  /* ── Tubería + velocidad inicial filtrado ── */
  const tuberiaInicialFiltrado  = useMemo(() => {
    const r = datosPorSistema?.calentamiento?.resultadoRetorno;
    return r?.resultadoR?.[0]?.tuberia   ?? null;
  }, [datosPorSistema?.calentamiento]);

  const velocidadInicialFiltrado = useMemo(() => {
    const r = datosPorSistema?.calentamiento?.resultadoRetorno;
    return r?.resultadoR?.[0]?.velocidad ?? null;
  }, [datosPorSistema?.calentamiento]);

  const configBombas = {
    filtrado:      true,
    calentamiento: datosPorSistema?.calentamiento?.usarBombaCalentamiento === "si",
    infinity:      datosDim?.usarBombaInfinity === "si" &&
                   (datosDim?.desborde === "infinity" || datosDim?.desborde === "ambos"),
  };

  const textoBombaInfinity = useMemo(() => {
    if (!datosDim || !(datosDim.desborde === "infinity" || datosDim.desborde === "ambos")) return "—";
    if (datosDim.usarBombaInfinity === "si") return "Sí";
    if (datosDim.usarBombaInfinity === "no") return "No";
    return "—";
  }, [datosDim]);

  /* ── Pérdidas ── */
  const perdidaTotalBTU    = datosPorSistema?.calentamiento?.perdidaTotalBTU          ?? 0;
  const perdidaEvaporacion = datosPorSistema?.calentamiento?.perdidasBTU?.evaporacion ?? 0;
  const perdidaConveccion  = datosPorSistema?.calentamiento?.perdidasBTU?.conveccion  ?? 0;
  const perdidaRadiacion   = datosPorSistema?.calentamiento?.perdidasBTU?.radiacion   ?? 0;
  const perdidaTransmision = datosPorSistema?.calentamiento?.perdidasBTU?.transmision ?? 0;
  const perdidaInfinity    = datosPorSistema?.calentamiento?.perdidasBTU?.infinity    ?? 0;
  const perdidaCanal       = datosPorSistema?.calentamiento?.perdidasBTU?.canal       ?? 0;
  const perdidaTuberia     = datosPorSistema?.calentamiento?.perdidasBTU?.tuberia     ?? 0;

  const calentamiento = datosPorSistema?.calentamiento;

  /* ── Bomba de calor ── */
  const { flujo: flujoBDC, carga: cargaBDCft, tuberia: tuberiaBDC, velocidad: velocidadBDC } =
    useMemo(() => extraerFlujoCarga(calentamiento, {
      sistemaKey: "bombaCalor", modoKey: "modoBDC",
      selKey: "bdcSeleccionada", manualKey: "bdcManual",
      flujoFn:       (s) => s.seleccion?.flujoTotal,
      cargaFn:       (s) => s.cargaTotal,
      manualFlujoFn: (m) => m.flujoTotal,
      manualCargaFn: (m) => m.hidraulica?.cargaTotal,
    }), [calentamiento]);

  /* ── Panel solar ── */
  const { flujo: flujoPS, carga: cargaPSft, tuberia: tuberiaPS, velocidad: velocidadPS } =
    useMemo(() => extraerFlujoCarga(calentamiento, {
      sistemaKey: "panelSolar", modoKey: "modoPS",
      selKey: "psSeleccionado", manualKey: "psManual",
      flujoFn:       (s) => s.seleccion?.flujoTotal,
      cargaFn:       (s) => s.hidraulica?.cargaTotal,
      manualFlujoFn: (m) => m.flujoTotal,
      manualCargaFn: (m) => m.hidraulica?.cargaTotal,
    }), [calentamiento]);

  /* ── Caldera ── */
  const { flujo: flujoCaldera, carga: cargaCalderaCft, tuberia: tuberiaCaldera, velocidad: velocidadCaldera } =
    useMemo(() => extraerFlujoCarga(calentamiento, {
      sistemaKey: "caldera", modoKey: "modoCaldera",
      selKey: "calderaSeleccionada", manualKey: "calderaManual",
      flujoFn:       (s) => s.seleccion?.flujoTotal,
      cargaFn:       (s) => s.cargaTotal,
      manualFlujoFn: (m) => m.flujoTotal,
      manualCargaFn: (m) => m.hidraulica?.cargaTotal,
    }), [calentamiento]);

  /* ── Calentador eléctrico ── */
  const { flujo: flujoCE, carga: cargaCEft, tuberia: tuberiaCE, velocidad: velocidadCE } =
    useMemo(() => extraerFlujoCarga(calentamiento, {
      sistemaKey: "calentadorElectrico", modoKey: "modoCE",
      selKey: "ceSeleccionado", manualKey: "ceManual",
      flujoFn:       (s) => s.seleccion?.flujoTotal,
      cargaFn:       (s) => s.cargaTotal,
      manualFlujoFn: (m) => m.flujoTotal,
      manualCargaFn: (m) => m.hidraulica?.cargaTotal,
    }), [calentamiento]);

  const bdcListoParaMostrar     = sistemaListoCalor && flujoBDC     != null;
  const psListoParaMostrar      = sistemaListoCalor && flujoPS      != null;
  const calderaListoParaMostrar = sistemaListoCalor && flujoCaldera != null;
  const ceListoParaMostrar      = sistemaListoCalor && flujoCE      != null;
  const hayAlgunCalentamiento   = bdcListoParaMostrar || psListoParaMostrar ||
                                  calderaListoParaMostrar || ceListoParaMostrar;

  const flujoMaxCalentamiento = useMemo(() => {
    const f = [flujoBDC, flujoPS, flujoCaldera, flujoCE].filter(v => v != null);
    return f.length ? Math.max(...f) : null;
  }, [flujoBDC, flujoPS, flujoCaldera, flujoCE]);

  const cargaSumaCalentamiento = useMemo(() => {
    const c = [cargaBDCft, cargaPSft, cargaCalderaCft, cargaCEft].filter(v => v != null);
    return c.length ? c.reduce((a, b) => a + parseFloat(b), 0) : null;
  }, [cargaBDCft, cargaPSft, cargaCalderaCft, cargaCEft]);

  /* ── Generador de cloro ── */
  const usoGeneralSistema = useMemo(() => datosDim?.usoGeneral ?? "residencial", [datosDim]);

  const tempAgua = useMemo(() => {
    const decision = datosPorSistema?.calentamiento?.decision;
    if (!decision || decision === "omitir") return 30;
    return datosPorSistema?.calentamiento?.tempDeseada ?? 30;
  }, [datosPorSistema?.calentamiento]);

  const resultadoClorador = useMemo(() => {
    if (!volumenTotal || volumenTotal <= 0) return null;
    if (!areaCalculada || areaCalculada <= 0) return null;
    try {
      return generadorDeCloro(
        volumenTotal * 1000, usoGeneralSistema,
        areaCalculada, volumenTotal, tempAgua
      );
    } catch { return null; }
  }, [volumenTotal, areaCalculada, usoGeneralSistema, tempAgua]);

  const kgDiaCloroNecesario = useMemo(() =>
    (!resultadoClorador || resultadoClorador.error) ? null
    : (resultadoClorador.kgDiaNecesario ?? null),
  [resultadoClorador]);

  const kgDiaCloroInstalado = useMemo(() =>
    (!resultadoClorador || resultadoClorador.error) ? null
    : (resultadoClorador.kgDiaInstalado ?? null),
  [resultadoClorador]);

  const flujoClorador = useMemo(() =>
    (!resultadoClorador || resultadoClorador.error) ? null
    : (parseFloat(resultadoClorador.seleccion?.flujoTotal) || null),
  [resultadoClorador]);

  const cargaClorador = useMemo(() =>
    (!resultadoClorador || resultadoClorador.error) ? null
    : (parseFloat(resultadoClorador.cargaTotal) || null),
  [resultadoClorador]);

  const tuberiaClorador = useMemo(() =>
    (!resultadoClorador || resultadoClorador.error) ? null
    : (resultadoClorador.tablaTramos?.[0]?.tuberia ?? null),
  [resultadoClorador]);

  const velocidadClorador = useMemo(() =>
    (!resultadoClorador || resultadoClorador.error) ? null
    : (resultadoClorador.tablaTramos?.[0]?.velocidad ?? null),
  [resultadoClorador]);

  const cloradorListo         = volumenTotal > 0 && areaCalculada > 0 && flujoClorador != null;
  const cargaSumaSanitizacion = cargaClorador ? parseFloat(cargaClorador) : null;

  const flujoMaxGlobal = useMemo(() => {
    const f = [
      flujoFiltrado > 0 ? flujoFiltrado : null,
      flujoMaxCalentamiento,
      flujoClorador,
    ].filter(v => v != null);
    return f.length ? Math.max(...f) : null;
  }, [flujoFiltrado, flujoMaxCalentamiento, flujoClorador]);

  const cargaTotalGlobal = useMemo(() => {
    const c = [cargaSumaCalentamiento, cargaSumaSanitizacion].filter(v => v != null);
    return c.length ? c.reduce((a, b) => a + parseFloat(b), 0) : null;
  }, [cargaSumaCalentamiento, cargaSumaSanitizacion]);

  /* =====================================================
     RENDER
  ===================================================== */
  return (
    <div className={`app-contenedor ${temaOscuro ? "tema-oscuro" : "tema-claro"}`}>

      {/* ══════════ PANEL IZQUIERDO ══════════ */}
      <div className={`panel-izquierdo ${panelColapsado ? "colapsado" : ""}`}>

        <div className={`panel-header ${panelColapsado ? "solo-colapsar" : ""}`}>
          {!panelColapsado && (
            <button className="icon-btn" title="Inicio" onClick={handleHome}>
              <Home size={18} />
            </button>
          )}
          <button
            className="icon-btn"
            title={panelColapsado ? "Expandir panel" : "Contraer panel"}
            onClick={() => setPanelColapsado(!panelColapsado)}
          >
            {panelColapsado ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <div className="nav-vertical">
          <button className={`nav-item ${seccion === "dimensiones" ? "activo" : ""}`} onClick={handleHome}>
            <span className="nav-icon"><Ruler size={16} strokeWidth={1.5} /></span>
            {!panelColapsado && <span className="nav-text">Dimensiones</span>}
          </button>
          <button className={`nav-item ${seccion === "calentamiento" ? "activo" : ""}`} onClick={() => setSeccion("calentamiento")}>
            <span className="nav-icon"><Flame size={16} strokeWidth={1.5} /></span>
            {!panelColapsado && <span className="nav-text">Calentamiento</span>}
          </button>
          <button className={`nav-item ${seccion === "equipamiento" ? "activo" : ""}`} onClick={() => setSeccion("equipamiento")}>
            <span className="nav-icon"><Wrench size={16} strokeWidth={1.5} /></span>
            {!panelColapsado && <span className="nav-text">Equipamiento</span>}
          </button>
        </div>

        {/* ══════════ RESULTADOS ══════════ */}
        <div className="toggle-seccion unida">
          <div className="toggle-boton activo">
            <h3 className="resultados-titulo">
              <BarChart2 size={14} strokeWidth={1.5} className="resultados-titulo-icon" />
              Resultados generales
            </h3>
          </div>

          <div className="seccion-resultados">

            {/* Dimensiones siempre visibles */}
            <table className="tabla-resultados tabla-resultados--dim">
              <tbody>
                <tr><th>Área total:</th><td>{formatM2(areaCalculada)}</td></tr>
                <tr><th>Volumen total:</th><td>{formatM3(volumenTotal)}</td></tr>
                <tr><th>Profundidad promedio:</th><td>{formatMetro(profundidadPromedio)}</td></tr>
              </tbody>
            </table>

            {/* ══ TOGGLE FILTRADO ══ */}
            <ResultadoToggle
              variante="filtrado"
              emoji="💧"
              label="Filtrado"
              abierto={toggleFiltrado}
              onToggle={() => setToggleFiltrado(v => !v)}
            >
              {/* Filtrado principal */}
              <div className="resultado-subheader resultado-subheader--filtrado">
                Circuito de filtrado
              </div>
              <table className="tabla-resultados">
                <tbody>
                  <tr>
                    <th className="th-indent">Flujo filtrado:</th>
                    <td className="td-flujo">{formatGPM(flujoFiltrado)}</td>
                  </tr>
                  <tr>
                    <th className="th-indent">Tubería inicial:</th>
                    <td>{fmtTub(tuberiaInicialFiltrado)}</td>
                  </tr>
                  <tr>
                    <th className="th-indent">Velocidad:</th>
                    <td className="td-vel">{fmtVel(velocidadInicialFiltrado)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Infinity */}
              {flujoInfinitySistema > 0 && (<>
                <div className="resultado-subheader resultado-subheader--filtrado">
                  Circuito infinity
                </div>
                <table className="tabla-resultados">
                  <tbody>
                    <tr>
                      <th className="th-indent">Flujo infinity:</th>
                      <td className="td-flujo">{formatGPM(flujoInfinitySistema)}</td>
                    </tr>
                    <tr>
                      <th className="th-indent">Tubería inicial:</th>
                      <td>{fmtTub(tuberiaInicialFiltrado)}</td>
                    </tr>
                    <tr>
                      <th className="th-indent">Velocidad:</th>
                      <td className="td-vel">{fmtVel(velocidadInicialFiltrado)}</td>
                    </tr>
                    <tr>
                      <th className="th-indent">Motobomba dedicada:</th>
                      <td>{textoBombaInfinity}</td>
                    </tr>
                  </tbody>
                </table>
              </>)}
            </ResultadoToggle>

            {/* ══ TOGGLE CALENTAMIENTO ══ */}
            <ResultadoToggle
              variante="calentamiento"
              emoji="🔥"
              label="Calentamiento"
              abierto={toggleCalentamiento}
              onToggle={() => setToggleCalentamiento(v => !v)}
            >
              {/* Pérdidas */}
              <div className="resultado-subheader resultado-subheader--perdidas">
                Pérdidas energéticas
              </div>
              <table className="tabla-resultados">
                <tbody>
                  <tr><th className="th-indent">Evaporación:</th><td>{sistemaListoCalor ? formatBTU(perdidaEvaporacion) : "—"}</td></tr>
                  <tr><th className="th-indent">Convección:</th><td>{sistemaListoCalor ? formatBTU(perdidaConveccion)  : "—"}</td></tr>
                  <tr><th className="th-indent">Radiación:</th><td>{sistemaListoCalor ? formatBTU(perdidaRadiacion)   : "—"}</td></tr>
                  <tr><th className="th-indent">Transmisión:</th><td>{sistemaListoCalor ? formatBTU(perdidaTransmision) : "—"}</td></tr>
                  <tr><th className="th-indent">Tubería:</th><td>{sistemaListoCalor ? formatBTU(perdidaTuberia)     : "—"}</td></tr>
                  <tr><th className="th-indent">Infinity:</th><td>{sistemaListoCalor ? formatBTU(perdidaInfinity)    : "—"}</td></tr>
                  <tr><th className="th-indent">Canal perimetral:</th><td>{sistemaListoCalor ? formatBTU(perdidaCanal) : "—"}</td></tr>
                  <tr>
                    <th className="th-indent th-total th-seccion">Total pérdidas:</th>
                    <td className="td-perdida">{sistemaListoCalor ? formatBTU(perdidaTotalBTU) : "—"}</td>
                  </tr>
                </tbody>
              </table>

              {/* BDC */}
              {bdcListoParaMostrar && (<>
                <div className="resultado-subheader resultado-subheader--equipo">Bomba de calor</div>
                <table className="tabla-resultados">
                  <tbody>
                    <tr><th className="th-indent">Flujo total:</th><td className="td-flujo">{fmtGPM(flujoBDC)}</td></tr>
                    <tr><th className="th-indent">Tubería inicial:</th><td>{fmtTub(tuberiaBDC)}</td></tr>
                    <tr><th className="th-indent">Velocidad:</th><td className="td-vel">{fmtVel(velocidadBDC)}</td></tr>
                    <tr><th className="th-indent">CDT:</th><td className="td-cdt">{fmtFt(cargaBDCft)}</td></tr>
                  </tbody>
                </table>
              </>)}

              {/* Panel solar */}
              {psListoParaMostrar && (<>
                <div className="resultado-subheader resultado-subheader--equipo">Panel solar</div>
                <table className="tabla-resultados">
                  <tbody>
                    <tr><th className="th-indent">Flujo total:</th><td className="td-flujo">{fmtGPM(flujoPS)}</td></tr>
                    <tr><th className="th-indent">Tubería inicial:</th><td>{fmtTub(tuberiaPS)}</td></tr>
                    <tr><th className="th-indent">Velocidad:</th><td className="td-vel">{fmtVel(velocidadPS)}</td></tr>
                    <tr><th className="th-indent">CDT:</th><td className="td-cdt">{fmtFt(cargaPSft)}</td></tr>
                  </tbody>
                </table>
              </>)}

              {/* Caldera */}
              {calderaListoParaMostrar && (<>
                <div className="resultado-subheader resultado-subheader--equipo">Caldera de gas</div>
                <table className="tabla-resultados">
                  <tbody>
                    <tr><th className="th-indent">Flujo total:</th><td className="td-flujo">{fmtGPM(flujoCaldera)}</td></tr>
                    <tr><th className="th-indent">Tubería inicial:</th><td>{fmtTub(tuberiaCaldera)}</td></tr>
                    <tr><th className="th-indent">Velocidad:</th><td className="td-vel">{fmtVel(velocidadCaldera)}</td></tr>
                    <tr><th className="th-indent">CDT:</th><td className="td-cdt">{fmtFt(cargaCalderaCft)}</td></tr>
                  </tbody>
                </table>
              </>)}

              {/* Calentador eléctrico */}
              {ceListoParaMostrar && (<>
                <div className="resultado-subheader resultado-subheader--equipo">Calentador eléctrico</div>
                <table className="tabla-resultados">
                  <tbody>
                    <tr><th className="th-indent">Flujo total:</th><td className="td-flujo">{fmtGPM(flujoCE)}</td></tr>
                    <tr><th className="th-indent">Tubería inicial:</th><td>{fmtTub(tuberiaCE)}</td></tr>
                    <tr><th className="th-indent">Velocidad:</th><td className="td-vel">{fmtVel(velocidadCE)}</td></tr>
                    <tr><th className="th-indent">CDT:</th><td className="td-cdt">{fmtFt(cargaCEft)}</td></tr>
                  </tbody>
                </table>
              </>)}

              {!hayAlgunCalentamiento && (
                <div className="resultado-toggle-vacio">
                  Configura el calentamiento para ver los datos
                </div>
              )}
            </ResultadoToggle>

            {/* ══ TOGGLE SANITIZACIÓN ══ */}
            <ResultadoToggle
              variante="sanitizacion"
              emoji="🧪"
              label="Sanitización"
              abierto={toggleSanitizacion}
              onToggle={() => setToggleSanitizacion(v => !v)}
            >
              {cloradorListo ? (<>
                <div className="resultado-subheader resultado-subheader--cloro">
                  Generador de cloro
                </div>
                <table className="tabla-resultados">
                  <tbody>
                    <tr><th className="th-indent">Flujo:</th><td className="td-flujo">{fmtGPM(flujoClorador)}</td></tr>
                    <tr><th className="th-indent">Tubería inicial:</th><td>{fmtTub(tuberiaClorador)}</td></tr>
                    <tr><th className="th-indent">Velocidad:</th><td className="td-vel">{fmtVel(velocidadClorador)}</td></tr>
                    <tr><th className="th-indent">CDT:</th><td className="td-cdt">{fmtFt(cargaClorador)}</td></tr>
                    {kgDiaCloroNecesario != null && (
                      <tr>
                        <th className="th-indent">Cloro necesario:</th>
                        <td className="td-cloro-nec">{fmtKg(kgDiaCloroNecesario)}</td>
                      </tr>
                    )}
                    {kgDiaCloroInstalado != null && (
                      <tr>
                        <th className="th-indent">Cloro instalado:</th>
                        <td className="td-cloro-ins">{fmtKg(kgDiaCloroInstalado)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </>) : (
                <div className="resultado-toggle-vacio">
                  Completa las dimensiones para ver los datos de sanitización
                </div>
              )}
            </ResultadoToggle>

            {/* ══ TOTALES siempre visibles ══ */}
            <table className="tabla-resultados tabla-resultados-totales">
              <tbody>
                <tr>
                  <th className="th-flujo-max">Flujo máx. global:</th>
                  <td className={flujoMaxGlobal != null ? "td-flujo-max" : "td-vacio"}>
                    {flujoMaxGlobal != null ? fmtGPM(flujoMaxGlobal) : "—"}
                  </td>
                </tr>
                <tr>
                  <th className="th-cdt-total">CDT total sistema:</th>
                  <td className={cargaTotalGlobal != null ? "td-cdt-total" : "td-vacio"}>
                    {cargaTotalGlobal != null ? fmtFt(cargaTotalGlobal) : "—"}
                  </td>
                </tr>
              </tbody>
            </table>

          </div>
        </div>

        {/* PANEL BOTTOM */}
        <div className="panel-bottom">
          <div className="panel-bottom-logo-row">
            {panelColapsado ? <LogoIcono /> : <LogoCompleto />}
            <div className="panel-bottom-sep" />
            <div className="panel-bottom-menu-wrapper">
              <button
                className={`panel-bottom-icon-btn ${menuUsuarioAbierto ? "panel-bottom-icon-btn-activo" : ""}`}
                title="Configuración"
                onClick={() => setMenuUsuarioAbierto(!menuUsuarioAbierto)}
              >
                <Settings size={15} />
              </button>
              <MenuUsuario
                abierto={menuUsuarioAbierto}
                onCerrar={() => setMenuUsuarioAbierto(false)}
                panelColapsado={panelColapsado}
                temaOscuro={temaOscuro}
                setTemaOscuro={setTemaOscuro}
              />
            </div>
          </div>
        </div>

      </div>

      {/* ══════════ PANEL DERECHO ══════════ */}
      <div className="panel-derecho">
        <div className="panel-derecho-contenido">
          {seccion === "dimensiones" && (
            <Dimensiones
              ref={dimensionesRef}
              setSeccion={setSeccion}
              sistemaActivo={sistemaActivo}
              setSistemaActivo={setSistemaActivo}
              datosPorSistema={datosPorSistema}
              setDatosPorSistema={setDatosPorSistema}
            />
          )}
          {seccion === "calentamiento" && (
            <Calentamiento
              setSeccion={setSeccion}
              tipoSistema={sistemaActivo}
              datosPorSistema={datosPorSistema}
              setDatosPorSistema={setDatosPorSistema}
              areaTotal={areaCalculada}
              volumenTotal={volumenTotal}
              profundidadPromedio={profundidadPromedio}
            />
          )}
          {seccion === "equipamiento" && (
            <Equipamiento
              setSeccion={setSeccion}
              sistemaActivo={sistemaActivo}
              datosPorSistema={datosPorSistema}
              setDatosPorSistema={setDatosPorSistema}
              configBombas={configBombas}
              resultadoClorador={resultadoClorador}
              flujoMaxGlobal={flujoMaxGlobal}  
            />
          )}
        </div>
      </div>

    </div>
  );
}