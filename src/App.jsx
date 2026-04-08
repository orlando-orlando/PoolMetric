// Al inicio de App.jsx
if (window.location.pathname === "/memoria-calculo") {
  import("./pages/MemoriaCalculo.jsx").then(m => {
    ReactDOM.createRoot(document.getElementById("root")).render(<m.default />);
  });
  // early return para no renderizar el resto
}

import "./estilos.css";
import { useState, useRef, useMemo, useEffect, useCallback } from "react";
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
import { velocidadCargaFlujo } from "./utils/velocidadCargaFlujo";

function tuberiaSeleccionada(velocidades, tipo) {
  const limite = tipo === "succion" ? 4.5 : 6.5;
  let mejorTuberia   = null;
  let mejorVelocidad = -Infinity;
  for (let tuberia in velocidades) {
    const velocidad = velocidades[tuberia];
    if (velocidad <= limite && velocidad > mejorVelocidad) {
      mejorVelocidad = velocidad;
      mejorTuberia   = tuberia;
    }
  }
  return mejorTuberia
    ? `${mejorTuberia} (${mejorVelocidad.toFixed(2)} ft/s)`
    : "Ninguna cumple";
}

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
  tuberiaFn = null, velocidadFn = null,
  manualTuberiaFn = null, manualVelocidadFn = null,
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
      tuberia:   manualTuberiaFn ? manualTuberiaFn(manual) : (manual?.hidraulica?.tablaTramos?.[0]?.tuberia ?? null),
      velocidad: manualVelocidadFn ? manualVelocidadFn(manual) : (manual?.hidraulica?.tablaTramos?.[0]?.velocidad ?? null),
    };
  }
  if (sel && !sel.error) {
    return {
      flujo:     parseFloat(flujoFn(sel)) || null,
      carga:     parseFloat(cargaFn(sel)) || null,
      tuberia:   tuberiaFn ? tuberiaFn(sel) : (sel?.tablaTramos?.[0]?.tuberia ?? null),
      velocidad: velocidadFn ? velocidadFn(sel) : (sel?.tablaTramos?.[0]?.velocidad ?? null),
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

  // ── Estado de sanitización seleccionada (sube desde Equipamiento) ──
  const [sanitizacionSeleccionada, setSanitizacionSeleccionada] = useState({});

  const handleSanitizacionChange = useCallback((sistemas) => {
    setSanitizacionSeleccionada(sistemas);
  }, []);

  const [toggleFiltrado,      setToggleFiltrado]      = useState(false);
  const [toggleCalentamiento, setToggleCalentamiento] = useState(false);
  const [toggleSanitizacion,  setToggleSanitizacion]  = useState(false);
  const [toggleEmpotrables,   setToggleEmpotrables]   = useState(false);
  const [toggleFiltracion,    setToggleFiltracion]    = useState(false);
  const [toggleFlujoMax,      setToggleFlujoMax]      = useState(false);
  const [toggleCDTTotal,      setToggleCDTTotal]      = useState(false);

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

  // ── Tubería y velocidad del circuito de filtrado ──
  // Se calculan SOLO con flujoFiltrado, independiente de calentamiento y equipamiento
  const { tuberiaFiltrado, velocidadFiltrado } = useMemo(() => {
    if (!flujoFiltrado || flujoFiltrado <= 0) return { tuberiaFiltrado: null, velocidadFiltrado: null };
    const { velocidadFlujo } = velocidadCargaFlujo(flujoFiltrado);
    const tubRaw = tuberiaSeleccionada(velocidadFlujo, "descarga");
    // tubRaw viene como "tuberia 2.00 (3.45 ft/s)" — extraemos tubería y velocidad
    const match = tubRaw.match(/^(tuberia [\d.]+)\s+\(([\d.]+)\s+ft\/s\)/);
    if (!match) return { tuberiaFiltrado: null, velocidadFiltrado: null };
    return {
      tuberiaFiltrado:   match[1],                    // "tuberia 2.00"
      velocidadFiltrado: parseFloat(match[2]),         // 3.45
    };
  }, [flujoFiltrado]);

  // ── Tubería y velocidad del circuito infinity ──
  // Se calculan SOLO con flujoInfinitySistema, independiente de todo lo demás
  const { tuberiaInfinity, velocidadInfinity } = useMemo(() => {
    if (!flujoInfinitySistema || flujoInfinitySistema <= 0) return { tuberiaInfinity: null, velocidadInfinity: null };
    const { velocidadFlujo } = velocidadCargaFlujo(flujoInfinitySistema);
    const tubRaw = tuberiaSeleccionada(velocidadFlujo, "descarga");
    const match = tubRaw.match(/^(tuberia [\d.]+)\s+\(([\d.]+)\s+ft\/s\)/);
    if (!match) return { tuberiaInfinity: null, velocidadInfinity: null };
    return {
      tuberiaInfinity:   match[1],
      velocidadInfinity: parseFloat(match[2]),
    };
  }, [flujoInfinitySistema]);

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

  const perdidaTotalBTU    = datosPorSistema?.calentamiento?.perdidaTotalBTU          ?? 0;
  const perdidaEvaporacion = datosPorSistema?.calentamiento?.perdidasBTU?.evaporacion ?? 0;
  const perdidaConveccion  = datosPorSistema?.calentamiento?.perdidasBTU?.conveccion  ?? 0;
  const perdidaRadiacion   = datosPorSistema?.calentamiento?.perdidasBTU?.radiacion   ?? 0;
  const perdidaTransmision = datosPorSistema?.calentamiento?.perdidasBTU?.transmision ?? 0;
  const perdidaInfinity    = datosPorSistema?.calentamiento?.perdidasBTU?.infinity    ?? 0;
  const perdidaCanal       = datosPorSistema?.calentamiento?.perdidasBTU?.canal       ?? 0;
  const perdidaTuberia     = datosPorSistema?.calentamiento?.perdidasBTU?.tuberia     ?? 0;

  const calentamiento = datosPorSistema?.calentamiento;

  const { flujo: flujoBDC, carga: cargaBDCft, tuberia: tuberiaBDC, velocidad: velocidadBDC } =
    useMemo(() => extraerFlujoCarga(calentamiento, {
      sistemaKey: "bombaCalor", modoKey: "modoBDC",
      selKey: "bdcSeleccionada", manualKey: "bdcManual",
      flujoFn:       (s) => s.seleccion?.flujoTotal,
      cargaFn:       (s) => s.cargaTotal,
      manualFlujoFn: (m) => m.flujoTotal,
      manualCargaFn: (m) => m.hidraulica?.cargaTotal,
    }), [calentamiento]);

  const { flujo: flujoPS, carga: cargaPSft, tuberia: tuberiaPS, velocidad: velocidadPS } =
    useMemo(() => extraerFlujoCarga(calentamiento, {
      sistemaKey: "panelSolar", modoKey: "modoPS",
      selKey: "psSeleccionado", manualKey: "psManual",
      flujoFn:          (s) => s.seleccion?.flujoTotal,
      cargaFn:          (s) => s.hidraulica?.cargaTotal,
      tuberiaFn:        (s) => s.hidraulica?.tablaTramos?.[0]?.tuberia   ?? null,
      velocidadFn:      (s) => s.hidraulica?.tablaTramos?.[0]?.velocidad ?? null,
      manualFlujoFn:    (m) => m.flujoTotal,
      manualCargaFn:    (m) => m.hidraulica?.cargaTotal,
      manualTuberiaFn:  (m) => m.hidraulica?.tablaTramos?.[0]?.tuberia   ?? null,
      manualVelocidadFn:(m) => m.hidraulica?.tablaTramos?.[0]?.velocidad ?? null,
    }), [calentamiento]);

  const { flujo: flujoCaldera, carga: cargaCalderaCft, tuberia: tuberiaCaldera, velocidad: velocidadCaldera } =
    useMemo(() => extraerFlujoCarga(calentamiento, {
      sistemaKey: "caldera", modoKey: "modoCaldera",
      selKey: "calderaSeleccionada", manualKey: "calderaManual",
      flujoFn:       (s) => s.seleccion?.flujoTotal,
      cargaFn:       (s) => s.cargaTotal,
      manualFlujoFn: (m) => m.flujoTotal,
      manualCargaFn: (m) => m.hidraulica?.cargaTotal,
    }), [calentamiento]);

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
    (!resultadoClorador || resultadoClorador.error) ? null : (resultadoClorador.kgDiaNecesario ?? null),
  [resultadoClorador]);

  const kgDiaCloroInstalado = useMemo(() =>
    (!resultadoClorador || resultadoClorador.error) ? null : (resultadoClorador.kgDiaInstalado ?? null),
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

  // ── Clorador solo se suma si fue seleccionado en Equipamiento ──
  const cloradorSeleccionado = !!sanitizacionSeleccionada?.cloradorSalino;
  const cloradorListo        = volumenTotal > 0 && areaCalculada > 0 && flujoClorador != null;

  /* ── Cargas de Equipamiento (empotrables + filtración + sanitización adicional) ── */
  const cargasEquipamiento = datosPorSistema?.equipamiento?.cargas ?? {};

  const cargaRetorno    = cargasEquipamiento.retorno    != null ? parseFloat(cargasEquipamiento.retorno)    : null;
  const cargaDesnatador = cargasEquipamiento.desnatador != null ? parseFloat(cargasEquipamiento.desnatador) : null;
  const cargaDrenCanal  = cargasEquipamiento.drenCanal  != null ? parseFloat(cargasEquipamiento.drenCanal)  : null;
  const cargaBarredora  = cargasEquipamiento.barredora  != null ? parseFloat(cargasEquipamiento.barredora)  : null;
  const cargaDrenFondo  = cargasEquipamiento.drenFondo  != null ? parseFloat(cargasEquipamiento.drenFondo)  : null;

  // Sanitización adicional (UV y clorador automático) — solo si fueron seleccionados
  const cargaLamparaUV          = cargasEquipamiento.lamparaUV          != null ? parseFloat(cargasEquipamiento.lamparaUV)          : null;
  const cargaCloradorAutomatico = cargasEquipamiento.cloradorAutomatico != null ? parseFloat(cargasEquipamiento.cloradorAutomatico) : null;

  const uvSeleccionado              = !!sanitizacionSeleccionada?.lamparaUV;
  const cloradorAutomaticoSeleccionado = !!sanitizacionSeleccionada?.cloradorAutomatico;

  // Filtración
  const cargaFiltroArena    = cargasEquipamiento.filtroArena    != null ? parseFloat(cargasEquipamiento.filtroArena)    : null;
  const cargaPrefiltro      = cargasEquipamiento.prefiltro      != null ? parseFloat(cargasEquipamiento.prefiltro)      : null;
  const cargaFiltroCartucho = cargasEquipamiento.filtroCartucho != null ? parseFloat(cargasEquipamiento.filtroCartucho) : null;

  // ── Tubería y velocidad de empotrables — desde los resultados del primer tramo ──
  const estados = datosPorSistema?.equipamiento?.estados ?? {};

  // Helper: extrae tubería y velocidad del primer tramo de un resultado de empotrable
  // Los resultados de retorno, desnatador, etc. guardan en res.resultadoR[0], res.resultadoD[0], etc.
  // pero solo tenemos la carga en cargasEquipamiento. La tubería/velocidad viene del estado
  // que guardó Equipamiento, que tiene { modo, selId, cantidad, tipo }.
  // Como no tenemos el resultado completo aquí, calculamos con velocidadCargaFlujo y flujoMaxGlobal.
  // Para empotrables usamos el flujo del sistema (flujoFiltrado) que es lo que usan esas funciones.
  const { tuberiaRetorno, velocidadRetorno } = useMemo(() => {
    if (!flujoFiltrado || flujoFiltrado <= 0) return { tuberiaRetorno: null, velocidadRetorno: null };
    const { velocidadFlujo } = velocidadCargaFlujo(flujoFiltrado);
    const tubRaw = tuberiaSeleccionada(velocidadFlujo, "descarga");
    const match  = tubRaw.match(/^(tuberia [\d.]+)\s+\(([\d.]+)\s+ft\/s\)/);
    if (!match) return { tuberiaRetorno: null, velocidadRetorno: null };
    return { tuberiaRetorno: match[1], velocidadRetorno: parseFloat(match[2]) };
  }, [flujoFiltrado]);

  const { tuberiaSuccion, velocidadSuccion } = useMemo(() => {
    if (!flujoFiltrado || flujoFiltrado <= 0) return { tuberiaSuccion: null, velocidadSuccion: null };
    const { velocidadFlujo } = velocidadCargaFlujo(flujoFiltrado);
    const tubRaw = tuberiaSeleccionada(velocidadFlujo, "succion");
    const match  = tubRaw.match(/^(tuberia [\d.]+)\s+\(([\d.]+)\s+ft\/s\)/);
    if (!match) return { tuberiaSuccion: null, velocidadSuccion: null };
    return { tuberiaSuccion: match[1], velocidadSuccion: parseFloat(match[2]) };
  }, [flujoFiltrado]);

  // ── Tipo de desborde para saber qué succión aplica ──
  const tieneDesbordeCanal = useMemo(() => {
    const d = datosDim?.desborde;
    return d === "infinity" || d === "canal" || d === "ambos";
  }, [datosDim]);

  // ── Succión activa: la mayor entre las opciones disponibles según desborde ──
  // (barredora nunca se suma)
  const succionActiva = useMemo(() => {
    if (tieneDesbordeCanal) {
      // candidatos: dren canal vs dren fondo
      const candidatos = [
        cargaDrenCanal != null ? { label: "Dren canal", valor: cargaDrenCanal, key: "drenCanal" }   : null,
        cargaDrenFondo != null ? { label: "Dren fondo", valor: cargaDrenFondo, key: "drenFondo" }   : null,
      ].filter(Boolean);
      if (!candidatos.length) return null;
      return candidatos.reduce((max, c) => c.valor > max.valor ? c : max);
    } else {
      // candidatos: desnatador vs dren fondo
      const candidatos = [
        cargaDesnatador != null ? { label: "Desnatadores", valor: cargaDesnatador, key: "desnatador" } : null,
        cargaDrenFondo  != null ? { label: "Dren fondo",   valor: cargaDrenFondo,  key: "drenFondo"  } : null,
      ].filter(Boolean);
      if (!candidatos.length) return null;
      return candidatos.reduce((max, c) => c.valor > max.valor ? c : max);
    }
  }, [tieneDesbordeCanal, cargaDesnatador, cargaDrenCanal, cargaDrenFondo]);

  // ── CDT empotrables = retorno + succión activa (mayor) ──
  const cargaSumaEmpotrables = useMemo(() => {
    const vals = [
      cargaRetorno,
      succionActiva?.valor ?? null,
    ].filter(v => v != null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) : null;
  }, [cargaRetorno, succionActiva]);

  const cargaSumaFiltracion = useMemo(() => {
    const vals = [cargaFiltroArena, cargaPrefiltro, cargaFiltroCartucho].filter(v => v != null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) : null;
  }, [cargaFiltroArena, cargaPrefiltro, cargaFiltroCartucho]);

  // ── Calentamiento: suma de cargas de todos los sistemas activos ──
  const cargaSumaCalentamiento = useMemo(() => {
    const vals = [cargaBDCft, cargaPSft, cargaCalderaCft, cargaCEft].filter(v => v != null);
    return vals.length ? vals.reduce((a, b) => a + parseFloat(b), 0) : null;
  }, [cargaBDCft, cargaPSft, cargaCalderaCft, cargaCEft]);

  // ── Sanitización: solo suma si el usuario seleccionó el equipo ──
  const cargaSumaSanitizacion = useMemo(() => {
    const vals = [];
    if (cloradorSeleccionado          && cargaClorador          != null) vals.push(cargaClorador);
    if (uvSeleccionado                && cargaLamparaUV          != null) vals.push(cargaLamparaUV);
    if (cloradorAutomaticoSeleccionado && cargaCloradorAutomatico != null) vals.push(cargaCloradorAutomatico);
    return vals.length ? vals.reduce((a, b) => a + b, 0) : null;
  }, [cloradorSeleccionado, cargaClorador, uvSeleccionado, cargaLamparaUV,
      cloradorAutomaticoSeleccionado, cargaCloradorAutomatico]);

  // ── Flujo máximo global — lista de todos los flujos activos ──
  const flujosCandidatos = useMemo(() => {
    const lista = [];
    if (flujoFiltrado > 0)        lista.push({ label: "Filtrado",              valor: flujoFiltrado });
    if (flujoInfinitySistema > 0) lista.push({ label: "Infinity",              valor: flujoInfinitySistema });
    if (flujoBDC      != null)    lista.push({ label: "Bomba de calor",        valor: flujoBDC });
    if (flujoPS       != null)    lista.push({ label: "Panel solar",           valor: flujoPS });
    if (flujoCaldera  != null)    lista.push({ label: "Caldera",               valor: flujoCaldera });
    if (flujoCE       != null)    lista.push({ label: "Calent. eléctrico",     valor: flujoCE });
    if (cloradorSeleccionado           && flujoClorador           != null) lista.push({ label: "Gen. cloro salino",  valor: flujoClorador });
    if (uvSeleccionado                 && cargaLamparaUV          != null) lista.push({ label: "Lámpara UV",          valor: 0 }); // UV no tiene flujo propio relevante
    if (cloradorAutomaticoSeleccionado && cargaCloradorAutomatico != null) lista.push({ label: "Clorador automático", valor: 0 });
    return lista.filter(f => f.valor > 0);
  }, [flujoFiltrado, flujoInfinitySistema, flujoBDC, flujoPS, flujoCaldera, flujoCE,
      cloradorSeleccionado, flujoClorador, uvSeleccionado, cloradorAutomaticoSeleccionado,
      cargaLamparaUV, cargaCloradorAutomatico]);

  const flujoMaxGlobal = useMemo(() => {
    if (!flujosCandidatos.length) return null;
    return Math.max(...flujosCandidatos.map(f => f.valor));
  }, [flujosCandidatos]);

  // ── Tubería y velocidad calculadas con flujoMaxGlobal — para filtración y sanitización UV/CA ──
  const { tuberiaMaxGlobal, velocidadMaxGlobal } = useMemo(() => {
    if (!flujoMaxGlobal || flujoMaxGlobal <= 0) return { tuberiaMaxGlobal: null, velocidadMaxGlobal: null };
    const { velocidadFlujo } = velocidadCargaFlujo(flujoMaxGlobal);
    const tubRaw = tuberiaSeleccionada(velocidadFlujo, "descarga");
    const match  = tubRaw.match(/^(tuberia [\d.]+)\s+\(([\d.]+)\s+ft\/s\)/);
    if (!match) return { tuberiaMaxGlobal: null, velocidadMaxGlobal: null };
    return { tuberiaMaxGlobal: match[1], velocidadMaxGlobal: parseFloat(match[2]) };
  }, [flujoMaxGlobal]);

  // ── CDT total: todos los componentes activos ──
  const componentesCDT = useMemo(() => {
    const lista = [];

    // Calentamiento — cada sistema por separado
    if (cargaBDCft    != null) lista.push({ label: "Bomba de calor",    valor: parseFloat(cargaBDCft),    grupo: "calentamiento" });
    if (cargaPSft     != null) lista.push({ label: "Panel solar",       valor: parseFloat(cargaPSft),     grupo: "calentamiento" });
    if (cargaCalderaCft != null) lista.push({ label: "Caldera",         valor: parseFloat(cargaCalderaCft), grupo: "calentamiento" });
    if (cargaCEft     != null) lista.push({ label: "Calent. eléctrico", valor: parseFloat(cargaCEft),     grupo: "calentamiento" });

    // Sanitización — solo si seleccionado
    if (cloradorSeleccionado           && cargaClorador           != null)
      lista.push({ label: "Gen. cloro salino",  valor: parseFloat(cargaClorador),           grupo: "sanitizacion" });
    if (uvSeleccionado                 && cargaLamparaUV          != null)
      lista.push({ label: "Lámpara UV",          valor: parseFloat(cargaLamparaUV),          grupo: "sanitizacion" });
    if (cloradorAutomaticoSeleccionado && cargaCloradorAutomatico != null)
      lista.push({ label: "Clorador automático", valor: parseFloat(cargaCloradorAutomatico), grupo: "sanitizacion" });

    // Empotrables — retorno siempre
    if (cargaRetorno != null)
      lista.push({ label: "Retornos", valor: cargaRetorno, grupo: "empotrables", desc: "descarga" });

    // Succión activa — solo la mayor
    if (succionActiva != null) {
      // Mostrar todos los candidatos pero marcar cuál gobierna
      const todosSuccion = tieneDesbordeCanal
        ? [
            cargaDrenCanal != null ? { label: "Dren canal", valor: cargaDrenCanal, key: "drenCanal" }   : null,
            cargaDrenFondo != null ? { label: "Dren fondo", valor: cargaDrenFondo, key: "drenFondo" }   : null,
          ].filter(Boolean)
        : [
            cargaDesnatador != null ? { label: "Desnatadores", valor: cargaDesnatador, key: "desnatador" } : null,
            cargaDrenFondo  != null ? { label: "Dren fondo",   valor: cargaDrenFondo,  key: "drenFondo"  } : null,
          ].filter(Boolean);

      for (const c of todosSuccion) {
        lista.push({
          label:    c.label,
          valor:    c.valor,
          grupo:    "empotrables",
          desc:     "succión",
          gobierna: c.key === succionActiva.key,
          noSuma:   c.key !== succionActiva.key,
        });
      }
    }

    // Barredora — siempre informativa, nunca suma
    if (cargaBarredora != null)
      lista.push({ label: "Barredoras", valor: cargaBarredora, grupo: "empotrables", desc: "informativo", noSuma: true });

    // Filtración
    if (cargaFiltroArena    != null) lista.push({ label: "Filtro de arena",    valor: cargaFiltroArena,    grupo: "filtracion" });
    if (cargaPrefiltro      != null) lista.push({ label: "Prefiltro",          valor: cargaPrefiltro,      grupo: "filtracion" });
    if (cargaFiltroCartucho != null) lista.push({ label: "Filtro cartucho",    valor: cargaFiltroCartucho, grupo: "filtracion" });

    return lista;
  }, [
    cargaBDCft, cargaPSft, cargaCalderaCft, cargaCEft,
    cloradorSeleccionado, cargaClorador,
    uvSeleccionado, cargaLamparaUV,
    cloradorAutomaticoSeleccionado, cargaCloradorAutomatico,
    cargaRetorno, succionActiva, tieneDesbordeCanal,
    cargaDesnatador, cargaDrenCanal, cargaDrenFondo, cargaBarredora,
    cargaFiltroArena, cargaPrefiltro, cargaFiltroCartucho,
  ]);

  // CDT total = suma de los que sí cuentan (noSuma === false/undefined)
  const cargaTotalGlobal = useMemo(() => {
    const sumables = componentesCDT.filter(c => !c.noSuma);
    if (!sumables.length) return null;
    return sumables.reduce((a, c) => a + c.valor, 0);
  }, [componentesCDT]);

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

            {/* ══ TOGGLE FILTRADO — solo si hay flujo calculado ══ */}
            {flujoFiltrado > 0 && (
            <ResultadoToggle
              variante="filtrado"
              emoji="💧"
              label="Filtrado"
              abierto={toggleFiltrado}
              onToggle={() => setToggleFiltrado(v => !v)}
            >
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
                    <th className="th-indent">Tubería distribución:</th>
                    <td>{fmtTub(tuberiaFiltrado)}</td>
                  </tr>
                  <tr>
                    <th className="th-indent">Velocidad:</th>
                    <td className="td-vel">{fmtVel(velocidadFiltrado)}</td>
                  </tr>
                </tbody>
              </table>

              {flujoInfinitySistema > 0 && (<>
                <div className="resultado-subheader resultado-subheader--filtrado">
                  Circuito infinity
                </div>
                <table className="tabla-resultados">
                  <tbody>
                    <tr><th className="th-indent">Flujo infinity:</th><td className="td-flujo">{formatGPM(flujoInfinitySistema)}</td></tr>
                    <tr><th className="th-indent">Tubería distribución:</th><td>{fmtTub(tuberiaInfinity)}</td></tr>
                    <tr><th className="th-indent">Velocidad:</th><td className="td-vel">{fmtVel(velocidadInfinity)}</td></tr>
                    <tr><th className="th-indent">Motobomba dedicada:</th><td>{textoBombaInfinity}</td></tr>
                  </tbody>
                </table>
              </>)}
            </ResultadoToggle>
            )}

            {/* ══ TOGGLE CALENTAMIENTO — solo si hay algún equipo configurado ══ */}
            {hayAlgunCalentamiento && (
            <ResultadoToggle
              variante="calentamiento"
              emoji="🔥"
              label="Calentamiento"
              abierto={toggleCalentamiento}
              onToggle={() => setToggleCalentamiento(v => !v)}
            >
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

              {bdcListoParaMostrar && (<>
                <div className="resultado-subheader resultado-subheader--equipo">Bomba de calor</div>
                <table className="tabla-resultados">
                  <tbody>
                    <tr><th className="th-indent">Flujo total:</th><td className="td-flujo">{fmtGPM(flujoBDC)}</td></tr>
                    <tr><th className="th-indent">Tubería distribución:</th><td>{fmtTub(tuberiaBDC)}</td></tr>
                    <tr><th className="th-indent">Velocidad:</th><td className="td-vel">{fmtVel(velocidadBDC)}</td></tr>
                    <tr><th className="th-indent">CDT:</th><td className="td-cdt">{fmtFt(cargaBDCft)}</td></tr>
                  </tbody>
                </table>
              </>)}

              {psListoParaMostrar && (<>
                <div className="resultado-subheader resultado-subheader--equipo">Panel solar</div>
                <table className="tabla-resultados">
                  <tbody>
                    <tr><th className="th-indent">Flujo total:</th><td className="td-flujo">{fmtGPM(flujoPS)}</td></tr>
                    <tr><th className="th-indent">Tubería distribución:</th><td>{fmtTub(tuberiaPS)}</td></tr>
                    <tr><th className="th-indent">Velocidad:</th><td className="td-vel">{fmtVel(velocidadPS)}</td></tr>
                    <tr><th className="th-indent">CDT:</th><td className="td-cdt">{fmtFt(cargaPSft)}</td></tr>
                  </tbody>
                </table>
              </>)}

              {calderaListoParaMostrar && (<>
                <div className="resultado-subheader resultado-subheader--equipo">Caldera de gas</div>
                <table className="tabla-resultados">
                  <tbody>
                    <tr><th className="th-indent">Flujo total:</th><td className="td-flujo">{fmtGPM(flujoCaldera)}</td></tr>
                    <tr><th className="th-indent">Tubería distribución:</th><td>{fmtTub(tuberiaCaldera)}</td></tr>
                    <tr><th className="th-indent">Velocidad:</th><td className="td-vel">{fmtVel(velocidadCaldera)}</td></tr>
                    <tr><th className="th-indent">CDT:</th><td className="td-cdt">{fmtFt(cargaCalderaCft)}</td></tr>
                  </tbody>
                </table>
              </>)}

              {ceListoParaMostrar && (<>
                <div className="resultado-subheader resultado-subheader--equipo">Calentador eléctrico</div>
                <table className="tabla-resultados">
                  <tbody>
                    <tr><th className="th-indent">Flujo total:</th><td className="td-flujo">{fmtGPM(flujoCE)}</td></tr>
                    <tr><th className="th-indent">Tubería distribución:</th><td>{fmtTub(tuberiaCE)}</td></tr>
                    <tr><th className="th-indent">Velocidad:</th><td className="td-vel">{fmtVel(velocidadCE)}</td></tr>
                    <tr><th className="th-indent">CDT:</th><td className="td-cdt">{fmtFt(cargaCEft)}</td></tr>
                  </tbody>
                </table>
              </>)}

              {/* Subtotal calentamiento */}
              {cargaSumaCalentamiento != null && (
                <table className="tabla-resultados" style={{ marginTop: "0.25rem" }}>
                  <tbody>
                    <tr>
                      <th className="th-indent th-total th-seccion">Subtotal CDT:</th>
                      <td className="td-cdt" style={{ fontWeight: 700 }}>{fmtFt(cargaSumaCalentamiento)}</td>
                    </tr>
                  </tbody>
                </table>
              )}

            </ResultadoToggle>
            )}

            {/* ══ TOGGLE SANITIZACIÓN — solo si hay algún equipo seleccionado ══ */}
            {(cloradorSeleccionado || uvSeleccionado || cloradorAutomaticoSeleccionado) && (
            <ResultadoToggle
              variante="sanitizacion"
              emoji="🧪"
              label="Sanitización"
              abierto={toggleSanitizacion}
              onToggle={() => setToggleSanitizacion(v => !v)}
            >
              {/* Generador de cloro salino */}
              {cloradorSeleccionado && cloradorListo && (<>
                <div className="resultado-subheader resultado-subheader--cloro">Gen. cloro salino</div>
                <table className="tabla-resultados">
                  <tbody>
                    <tr><th className="th-indent">Flujo total:</th><td className="td-flujo">{fmtGPM(flujoClorador)}</td></tr>
                    <tr><th className="th-indent">Tubería distribución:</th><td>{fmtTub(tuberiaClorador)}</td></tr>
                    <tr><th className="th-indent">Velocidad:</th><td className="td-vel">{fmtVel(velocidadClorador)}</td></tr>
                    <tr><th className="th-indent">CDT:</th><td className="td-cdt">{fmtFt(cargaClorador)}</td></tr>
                  </tbody>
                </table>
              </>)}

              {/* Cloro necesario — fuera del bloque del equipo, dentro de sanitización */}
              {cloradorSeleccionado && cloradorListo && kgDiaCloroNecesario != null && (
                <table className="tabla-resultados">
                  <tbody>
                    <tr><th className="th-indent">Cloro necesario:</th><td className="td-cloro-nec">{fmtKg(kgDiaCloroNecesario)}</td></tr>
                  </tbody>
                </table>
              )}

              {/* Lámpara UV */}
              {uvSeleccionado && cargaLamparaUV != null && (<>
                <div className="resultado-subheader resultado-subheader--cloro">Lámpara UV</div>
                <table className="tabla-resultados">
                  <tbody>
                    <tr><th className="th-indent">Flujo sistema:</th><td className="td-flujo">{fmtGPM(flujoMaxGlobal)}</td></tr>
                    <tr><th className="th-indent">Tubería distribución:</th><td>{fmtTub(tuberiaMaxGlobal)}</td></tr>
                    <tr><th className="th-indent">Velocidad:</th><td className="td-vel">{fmtVel(velocidadMaxGlobal)}</td></tr>
                    <tr><th className="th-indent">CDT:</th><td className="td-cdt">{fmtFt(cargaLamparaUV)}</td></tr>
                  </tbody>
                </table>
              </>)}

              {/* Clorador automático */}
              {cloradorAutomaticoSeleccionado && cargaCloradorAutomatico != null && (<>
                <div className="resultado-subheader resultado-subheader--cloro">Clorador automático</div>
                <table className="tabla-resultados">
                  <tbody>
                    <tr><th className="th-indent">Flujo sistema:</th><td className="td-flujo">{fmtGPM(flujoMaxGlobal)}</td></tr>
                    <tr><th className="th-indent">Tubería distribución:</th><td>{fmtTub(tuberiaMaxGlobal)}</td></tr>
                    <tr><th className="th-indent">Velocidad:</th><td className="td-vel">{fmtVel(velocidadMaxGlobal)}</td></tr>
                    <tr><th className="th-indent">CDT:</th><td className="td-cdt">{fmtFt(cargaCloradorAutomatico)}</td></tr>
                  </tbody>
                </table>
              </>)}

              {/* Subtotal si hay más de uno */}
              {cargaSumaSanitizacion != null && (cloradorSeleccionado ? 1 : 0) + (uvSeleccionado ? 1 : 0) + (cloradorAutomaticoSeleccionado ? 1 : 0) > 1 && (
                <table className="tabla-resultados" style={{ marginTop: "0.25rem" }}>
                  <tbody>
                    <tr>
                      <th className="th-indent th-total th-seccion">Subtotal CDT:</th>
                      <td className="td-cdt" style={{ fontWeight: 700 }}>{fmtFt(cargaSumaSanitizacion)}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </ResultadoToggle>
            )}

            {/* ══ TOGGLE EMPOTRABLES ══ */}
            {(cargaRetorno != null || succionActiva != null || cargaBarredora != null) && (
              <ResultadoToggle
                variante="filtrado"
                emoji="🔩"
                label="Empotrables"
                abierto={toggleEmpotrables}
                onToggle={() => setToggleEmpotrables(v => !v)}
              >
                {/* ── Retornos (descarga) ── */}
                {cargaRetorno != null && (<>
                  <div className="resultado-subheader resultado-subheader--equipo">Retornos</div>
                  <table className="tabla-resultados">
                    <tbody>
                      <tr><th className="th-indent">Flujo sistema:</th><td className="td-flujo">{fmtGPM(flujoMaxGlobal)}</td></tr>
                      <tr><th className="th-indent">Tubería distribución:</th><td>{fmtTub(tuberiaRetorno)}</td></tr>
                      <tr><th className="th-indent">Velocidad:</th><td className="td-vel">{fmtVel(velocidadRetorno)}</td></tr>
                      <tr><th className="th-indent">CDT:</th><td className="td-cdt">{fmtFt(cargaRetorno)}</td></tr>
                    </tbody>
                  </table>
                </>)}

                {/* ── Succión activa ── */}
                {tieneDesbordeCanal ? (<>
                  {cargaDrenCanal != null && (<>
                    <div className="resultado-subheader resultado-subheader--equipo">
                      Dren canal{succionActiva?.key === "drenCanal" ? " ↑ gobierna" : " — no suma"}
                    </div>
                    <table className="tabla-resultados">
                      <tbody>
                        <tr><th className="th-indent">Flujo sistema:</th><td className="td-flujo">{fmtGPM(flujoMaxGlobal)}</td></tr>
                        <tr><th className="th-indent">Tubería distribución:</th><td style={succionActiva?.key !== "drenCanal" ? { color: "#64748b" } : {}}>{fmtTub(tuberiaSuccion)}</td></tr>
                        <tr><th className="th-indent">Velocidad:</th><td className="td-vel" style={succionActiva?.key !== "drenCanal" ? { color: "#64748b" } : {}}>{fmtVel(velocidadSuccion)}</td></tr>
                        <tr><th className="th-indent">CDT:</th><td style={succionActiva?.key !== "drenCanal" ? { color: "#64748b" } : { color: "#60a5fa" }}>{fmtFt(cargaDrenCanal)}</td></tr>
                      </tbody>
                    </table>
                  </>)}
                  {cargaDrenFondo != null && (<>
                    <div className="resultado-subheader resultado-subheader--equipo">
                      Dren fondo{succionActiva?.key === "drenFondo" ? " ↑ gobierna" : " — no suma"}
                    </div>
                    <table className="tabla-resultados">
                      <tbody>
                        <tr><th className="th-indent">Flujo sistema:</th><td className="td-flujo">{fmtGPM(flujoMaxGlobal)}</td></tr>
                        <tr><th className="th-indent">Tubería distribución:</th><td style={succionActiva?.key !== "drenFondo" ? { color: "#64748b" } : {}}>{fmtTub(tuberiaSuccion)}</td></tr>
                        <tr><th className="th-indent">Velocidad:</th><td className="td-vel" style={succionActiva?.key !== "drenFondo" ? { color: "#64748b" } : {}}>{fmtVel(velocidadSuccion)}</td></tr>
                        <tr><th className="th-indent">CDT:</th><td style={succionActiva?.key !== "drenFondo" ? { color: "#64748b" } : { color: "#60a5fa" }}>{fmtFt(cargaDrenFondo)}</td></tr>
                      </tbody>
                    </table>
                  </>)}
                </>) : (<>
                  {cargaDesnatador != null && (<>
                    <div className="resultado-subheader resultado-subheader--equipo">
                      Desnatadores{succionActiva?.key === "desnatador" ? " ↑ gobierna" : " — no suma"}
                    </div>
                    <table className="tabla-resultados">
                      <tbody>
                        <tr><th className="th-indent">Flujo sistema:</th><td className="td-flujo">{fmtGPM(flujoMaxGlobal)}</td></tr>
                        <tr><th className="th-indent">Tubería distribución:</th><td style={succionActiva?.key !== "desnatador" ? { color: "#64748b" } : {}}>{fmtTub(tuberiaSuccion)}</td></tr>
                        <tr><th className="th-indent">Velocidad:</th><td className="td-vel" style={succionActiva?.key !== "desnatador" ? { color: "#64748b" } : {}}>{fmtVel(velocidadSuccion)}</td></tr>
                        <tr><th className="th-indent">CDT:</th><td style={succionActiva?.key !== "desnatador" ? { color: "#64748b" } : { color: "#60a5fa" }}>{fmtFt(cargaDesnatador)}</td></tr>
                      </tbody>
                    </table>
                  </>)}
                  {cargaDrenFondo != null && (<>
                    <div className="resultado-subheader resultado-subheader--equipo">
                      Dren fondo{succionActiva?.key === "drenFondo" ? " ↑ gobierna" : " — no suma"}
                    </div>
                    <table className="tabla-resultados">
                      <tbody>
                        <tr><th className="th-indent">Flujo sistema:</th><td className="td-flujo">{fmtGPM(flujoMaxGlobal)}</td></tr>
                        <tr><th className="th-indent">Tubería distribución:</th><td style={succionActiva?.key !== "drenFondo" ? { color: "#64748b" } : {}}>{fmtTub(tuberiaSuccion)}</td></tr>
                        <tr><th className="th-indent">Velocidad:</th><td className="td-vel" style={succionActiva?.key !== "drenFondo" ? { color: "#64748b" } : {}}>{fmtVel(velocidadSuccion)}</td></tr>
                        <tr><th className="th-indent">CDT:</th><td style={succionActiva?.key !== "drenFondo" ? { color: "#64748b" } : { color: "#60a5fa" }}>{fmtFt(cargaDrenFondo)}</td></tr>
                      </tbody>
                    </table>
                  </>)}
                </>)}

                {/* ── Barredoras — informativo ── */}
                {cargaBarredora != null && (<>
                  <div className="resultado-subheader" style={{ color: "#64748b" }}>Barredoras — informativo</div>
                  <table className="tabla-resultados">
                    <tbody>
                      <tr><th className="th-indent" style={{ color: "#64748b" }}>Flujo sistema:</th><td style={{ color: "#64748b" }}>{fmtGPM(flujoMaxGlobal)}</td></tr>
                      <tr><th className="th-indent" style={{ color: "#64748b" }}>Tubería distribución:</th><td style={{ color: "#64748b" }}>{fmtTub(tuberiaRetorno)}</td></tr>
                      <tr><th className="th-indent" style={{ color: "#64748b" }}>Velocidad:</th><td style={{ color: "#64748b" }}>{fmtVel(velocidadRetorno)}</td></tr>
                      <tr><th className="th-indent" style={{ color: "#64748b" }}>CDT (ref):</th><td style={{ color: "#64748b" }}>{fmtFt(cargaBarredora)}</td></tr>
                    </tbody>
                  </table>
                </>)}

                {/* ── Subtotal ── */}
                {cargaSumaEmpotrables != null && (
                  <table className="tabla-resultados" style={{ marginTop: "0.25rem" }}>
                    <tbody>
                      <tr>
                        <th className="th-indent th-total th-seccion">Subtotal CDT:</th>
                        <td className="td-cdt" style={{ fontWeight: 700 }}>{fmtFt(cargaSumaEmpotrables)}</td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </ResultadoToggle>
            )}

            {/* ══ TOGGLE FILTRACIÓN ══ */}
            {cargaSumaFiltracion != null && (
              <ResultadoToggle
                variante="filtrado"
                emoji="🧹"
                label="Filtración"
                abierto={toggleFiltracion}
                onToggle={() => setToggleFiltracion(v => !v)}
              >
                {/* Filtro de arena */}
                {cargaFiltroArena != null && (<>
                  <div className="resultado-subheader resultado-subheader--equipo">Filtro de arena</div>
                  <table className="tabla-resultados">
                    <tbody>
                      <tr><th className="th-indent">Flujo sistema:</th><td className="td-flujo">{fmtGPM(flujoMaxGlobal)}</td></tr>
                      <tr><th className="th-indent">Tubería distribución:</th><td>{fmtTub(tuberiaMaxGlobal)}</td></tr>
                      <tr><th className="th-indent">Velocidad:</th><td className="td-vel">{fmtVel(velocidadMaxGlobal)}</td></tr>
                      <tr><th className="th-indent">CDT:</th><td className="td-cdt">{fmtFt(cargaFiltroArena)}</td></tr>
                    </tbody>
                  </table>
                </>)}

                {/* Prefiltro */}
                {cargaPrefiltro != null && (<>
                  <div className="resultado-subheader resultado-subheader--equipo">Prefiltro</div>
                  <table className="tabla-resultados">
                    <tbody>
                      <tr><th className="th-indent">Flujo sistema:</th><td className="td-flujo">{fmtGPM(flujoMaxGlobal)}</td></tr>
                      <tr><th className="th-indent">Tubería distribución:</th><td>{fmtTub(tuberiaMaxGlobal)}</td></tr>
                      <tr><th className="th-indent">Velocidad:</th><td className="td-vel">{fmtVel(velocidadMaxGlobal)}</td></tr>
                      <tr><th className="th-indent">CDT:</th><td className="td-cdt">{fmtFt(cargaPrefiltro)}</td></tr>
                    </tbody>
                  </table>
                </>)}

                {/* Filtro cartucho */}
                {cargaFiltroCartucho != null && (<>
                  <div className="resultado-subheader resultado-subheader--equipo">Filtro cartucho</div>
                  <table className="tabla-resultados">
                    <tbody>
                      <tr><th className="th-indent">Flujo sistema:</th><td className="td-flujo">{fmtGPM(flujoMaxGlobal)}</td></tr>
                      <tr><th className="th-indent">Tubería distribución:</th><td>{fmtTub(tuberiaMaxGlobal)}</td></tr>
                      <tr><th className="th-indent">Velocidad:</th><td className="td-vel">{fmtVel(velocidadMaxGlobal)}</td></tr>
                      <tr><th className="th-indent">CDT:</th><td className="td-cdt">{fmtFt(cargaFiltroCartucho)}</td></tr>
                    </tbody>
                  </table>
                </>)}

                {/* Subtotal */}
                <table className="tabla-resultados" style={{ marginTop: "0.25rem" }}>
                  <tbody>
                    <tr>
                      <th className="th-indent th-total th-seccion">Subtotal CDT:</th>
                      <td className="td-cdt" style={{ fontWeight: 700 }}>{fmtFt(cargaSumaFiltracion)}</td>
                    </tr>
                  </tbody>
                </table>
              </ResultadoToggle>
            )}

            {/* ══ FLUJO MÁXIMO GLOBAL — solo si hay datos ══ */}
            {flujoMaxGlobal != null && (
            <div className="resultado-totales-bloque">

              {/* Flujo máx */}
              <button
                className={`resultado-total-btn resultado-total-btn--flujo ${toggleFlujoMax ? "abierto" : ""}`}
                onClick={() => setToggleFlujoMax(v => !v)}
              >
                <span className="resultado-total-btn-label">
                  <span className="resultado-total-btn-titulo">Flujo máx. global</span>
                  <span className="resultado-total-btn-valor resultado-total-btn-valor--flujo">
                    {fmtGPM(flujoMaxGlobal)}
                  </span>
                </span>
                <ChevronDown size={11} className={`resultado-toggle-chevron ${toggleFlujoMax ? "abierto" : ""}`} />
              </button>

              {toggleFlujoMax && (
                <div className="resultado-totales-desglose resultado-totales-desglose--flujo">
                  {flujosCandidatos.map((f, i) => {
                    const esMax = f.valor === flujoMaxGlobal;
                    return (
                      <div key={i} className={`resultado-totales-desglose-fila ${esMax ? "fila-gobierna" : "fila-secundaria"}`}>
                        <span className="desglose-label">
                          {f.label}
                          {esMax && <span className="desglose-badge desglose-badge--gobierna">↑ máx</span>}
                        </span>
                        <span className="desglose-valor">{fmtGPM(f.valor)}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* CDT total */}
              {cargaTotalGlobal != null && (
              <>
              <button
                className={`resultado-total-btn resultado-total-btn--cdt ${toggleCDTTotal ? "abierto" : ""}`}
                onClick={() => setToggleCDTTotal(v => !v)}
              >
                <span className="resultado-total-btn-label">
                  <span className="resultado-total-btn-titulo">CDT total sistema</span>
                  <span className="resultado-total-btn-valor resultado-total-btn-valor--cdt">
                    {fmtFt(cargaTotalGlobal)}
                  </span>
                </span>
                <ChevronDown size={11} className={`resultado-toggle-chevron ${toggleCDTTotal ? "abierto" : ""}`} />
              </button>

              {toggleCDTTotal && (
                <div className="resultado-totales-desglose resultado-totales-desglose--cdt">
                  {componentesCDT.map((c, i) => (
                    <div key={i} className={`resultado-totales-desglose-fila ${c.noSuma ? "fila-no-suma" : c.gobierna ? "fila-gobierna" : "fila-suma"}`}>
                      <span className="desglose-label">
                        {c.label}
                        {c.gobierna   && <span className="desglose-badge desglose-badge--gobierna">↑ gobierna</span>}
                        {c.noSuma && c.desc !== "informativo" && <span className="desglose-badge desglose-badge--nosuma">no suma</span>}
                        {c.desc === "informativo" && <span className="desglose-badge desglose-badge--info">info</span>}
                        {!c.noSuma && !c.gobierna && <span className="desglose-badge desglose-badge--suma">✓</span>}
                      </span>
                      <span className="desglose-valor">{fmtFt(c.valor)}</span>
                    </div>
                  ))}
                  <div className="resultado-totales-desglose-total">
                    <span>Total CDT</span>
                    <span>{fmtFt(cargaTotalGlobal)}</span>
                  </div>
                </div>
              )}
              </>
              )}

            </div>
            )}

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
              cargaTotalGlobal={cargaTotalGlobal}
              onSanitizacionChange={handleSanitizacionChange}
            />
          )}
        </div>
      </div>

    </div>
  );
}