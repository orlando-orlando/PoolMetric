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
import { volumenPorCircuito } from "./utils/volumenPorCircuito";
import { flujoPorVolumen }   from "./utils/flujoVolumen";
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

function areaTotal(datosSistema) {
  if (!datosSistema || !Array.isArray(datosSistema.cuerpos)) return 0;
  const total = datosSistema.cuerpos.reduce((acc, cuerpo) => {
    const area = parseFloat(cuerpo.area);
    return acc + (isNaN(area) ? 0 : area);
  }, 0);
  return parseFloat(total.toFixed(1));
}

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
      <button className="menu-usuario-item menu-usuario-item-tema" onClick={() => { setTemaOscuro(!temaOscuro); onCerrar(); }}>
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

const fmtFt  = (v) => v != null && !isNaN(v) ? `${parseFloat(v).toFixed(2)} ft`     : "—";
const fmtGPM = (v) => v != null && !isNaN(v) && parseFloat(v) > 0 ? `${parseFloat(v).toFixed(1)} gpm` : "—";
const fmtKg  = (v) => v != null && !isNaN(v) ? `${parseFloat(v).toFixed(3)} kg/día` : "—";
const fmtTub = (v) => v ? v.replace("tuberia ", "") + '"' : "—";
const fmtVel = (v) => v != null && !isNaN(v) ? `${parseFloat(v).toFixed(2)} ft/s`   : "—";
const fmtPct = (v) => v != null && !isNaN(v) ? `${v >= 0 ? "+" : ""}${parseFloat(v).toFixed(1)}%` : "—";

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

/* ── AnimatedToggle: anima con grid-template-rows — más suave que max-height ── */
function AnimatedToggleCuerpo({ abierto, variante, children }) {
  const [mounted, setMounted] = useState(abierto);

  useEffect(() => {
    if (abierto) {
      setMounted(true);
    } else {
      const t = setTimeout(() => setMounted(false), 280);
      return () => clearTimeout(t);
    }
  }, [abierto]);

  if (!mounted) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: abierto ? "1fr" : "0fr",
        transition: "grid-template-rows 280ms cubic-bezier(0.25,0.46,0.45,0.94)",
      }}
    >
      <div style={{ overflow: "hidden" }} className={`resultado-toggle-cuerpo resultado-toggle-cuerpo--${variante}`}>
        {children}
      </div>
    </div>
  );
}

/* ── FadeIn: anima la aparición del bloque completo del toggle ── */
function FadeInBloque({ children, visible }) {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setShow(true)));
    } else {
      setShow(false);
      const timer = setTimeout(() => setMounted(false), 250);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!mounted) return null;

  return (
    <div style={{
      opacity: show ? 1 : 0,
      transform: show ? "translateY(0)" : "translateY(-6px)",
      transition: "opacity 250ms ease, transform 250ms ease",
    }}>
      {children}
    </div>
  );
}

/* ── ResultadoToggle con animación en el cuerpo ── */
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
        <ChevronDown size={12} className={`resultado-toggle-chevron ${abierto ? "abierto" : ""}`} />
      </button>
      <AnimatedToggleCuerpo abierto={abierto} variante={variante}>
        {children}
      </AnimatedToggleCuerpo>
    </div>
  );
}

/* ── FlashValue: destella brevemente cuando el valor cambia ── */
function FlashValue({ value, children }) {
  const [flashing, setFlashing] = useState(false);
  const prevRef = useRef(value);
  useEffect(() => {
    if (prevRef.current !== value && prevRef.current !== undefined) {
      setFlashing(true);
      const t = setTimeout(() => setFlashing(false), 800);
      prevRef.current = value;
      return () => clearTimeout(t);
    }
    prevRef.current = value;
  }, [value]);
  return (
    <span style={{
      borderRadius: "3px",
      transition: "background 0.15s ease",
      background: flashing ? "rgba(96,165,250,0.18)" : "transparent",
      padding: flashing ? "0 3px" : "0",
      display: "inline-block",
    }}>
      {children}
    </span>
  );
}

/* ── PlaceholderResultados: estado vacío del panel ── */
function PlaceholderResultados() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: "0.6rem",
      padding: "1.5rem 1rem", textAlign: "center",
      opacity: 0.5,
    }}>
      <svg width="32" height="36" viewBox="0 0 90 108" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.4 }}>
        <path d="M45 4C45 4 9 46 9 68A36 36 0 0 0 81 68C81 46 45 4 45 4Z" fill="none" stroke="#2d88e0" strokeWidth="3" strokeDasharray="6 4" />
      </svg>
      <div style={{ fontSize: "0.72rem", color: "#475569", lineHeight: 1.5 }}>
        Ingresa las dimensiones<br/>para ver los resultados
      </div>
    </div>
  );
}

export default function App() {
  const [seccion, setSeccion]                       = useState("dimensiones");
  const [panelColapsado, setPanelColapsado]         = useState(false);
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);
  const [temaOscuro, setTemaOscuro]                 = useState(true);
  const [datosPorSistema, setDatosPorSistema]       = useState({});
  const [sistemaActivo, setSistemaActivo]           = useState(null);
  const dimensionesRef                              = useRef(null);

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

  useEffect(() => { document.body.className = temaOscuro ? "tema-oscuro" : "tema-claro"; }, [temaOscuro]);
  useEffect(() => {
    const titulos = { dimensiones: "PoolMetric · Dimensiones", calentamiento: "PoolMetric · Calentamiento", equipamiento: "PoolMetric · Equipamiento" };
    document.title = titulos[seccion] ?? "PoolMetric";
  }, [seccion]);

  const datosDim      = datosPorSistema?.[sistemaActivo];
  const areaCalculada = areaTotal(datosDim);

  const volumenTotal = useMemo(() => {
    if (!datosDim || !Array.isArray(datosDim.cuerpos)) return 0;
    return parseFloat(datosDim.cuerpos.reduce((acc, c) => acc + volumen(c, c.volumenCalculado ?? null), 0).toFixed(1));
  }, [datosDim]);

  const datosFlujo = useMemo(() => {
    if (!datosDim?.cuerpos) return null;
    return { tasaGeneral: datosDim.tasaGeneral, tasaJacuzzi: datosDim.tasaJacuzzi, cuerpos: datosDim.cuerpos.map(c => ({ tipo: c.tipoCuerpo, volumen: volumen(c) })) };
  }, [datosDim]);

  const flujoFiltrado        = useMemo(() => datosFlujo ? flujoFinal(datosFlujo) : 0, [datosFlujo]);

  // Desglose de flujos: alberca (circuito general) + jacuzzi (hidromasaje independiente)
  const flujosPorCircuito = useMemo(() => {
    if (!datosDim?.cuerpos) return null;
    // volumenPorCircuito espera { volumen, tipo }
    const cuerposNorm = datosDim.cuerpos.map(c => ({
      volumen: volumen(c),
      tipo: c.tipoCuerpo ?? c.tipo ?? "alberca",
    }));
    const { general, jacuzzis } = volumenPorCircuito(cuerposNorm);
    if (jacuzzis.length === 0) return null; // sin jacuzzi, no hay desglose
    const resultado = [];
    if (general > 0 && Number.isFinite(Number(datosDim.tasaGeneral))) {
      const f = flujoPorVolumen(general, Number(datosDim.tasaGeneral));
      if (f > 0) resultado.push({ label: "Alberca", flujo: f });
    }
    if (Number.isFinite(Number(datosDim.tasaJacuzzi))) {
      jacuzzis.forEach((vol, i) => {
        const f = flujoPorVolumen(vol, Number(datosDim.tasaJacuzzi));
        if (f > 0) resultado.push({ label: jacuzzis.length > 1 ? `Jacuzzi ${i + 1}` : "Jacuzzi", flujo: f });
      });
    }
    return resultado.length > 1 ? resultado : null;
  }, [datosDim]);
  const flujoInfinitySistema = useMemo(() => {
    if (!datosDim || !(datosDim.desborde === "infinity" || datosDim.desborde === "ambos")) return 0;
    return flujoInfinity(datosDim);
  }, [datosDim]);

  const profundidadPromedio = useMemo(() => {
    if (areaCalculada > 0 && volumenTotal > 0) return parseFloat((volumenTotal / areaCalculada).toFixed(2));
    return 0;
  }, [areaCalculada, volumenTotal]);

  const hayDatos = areaCalculada > 0;
  const sistemaListoCalor = areaCalculada > 0 && volumenTotal > 0 && profundidadPromedio > 0;

  const { tuberiaFiltrado, velocidadFiltrado } = useMemo(() => {
    if (!flujoFiltrado || flujoFiltrado <= 0) return { tuberiaFiltrado: null, velocidadFiltrado: null };
    const { velocidadFlujo } = velocidadCargaFlujo(flujoFiltrado);
    const tubRaw = tuberiaSeleccionada(velocidadFlujo, "descarga");
    const match = tubRaw.match(/^(tuberia [\d.]+)\s+\(([\d.]+)\s+ft\/s\)/);
    if (!match) return { tuberiaFiltrado: null, velocidadFiltrado: null };
    return { tuberiaFiltrado: match[1], velocidadFiltrado: parseFloat(match[2]) };
  }, [flujoFiltrado]);

  const { tuberiaInfinity, velocidadInfinity } = useMemo(() => {
    if (!flujoInfinitySistema || flujoInfinitySistema <= 0) return { tuberiaInfinity: null, velocidadInfinity: null };
    const { velocidadFlujo } = velocidadCargaFlujo(flujoInfinitySistema);
    const tubRaw = tuberiaSeleccionada(velocidadFlujo, "descarga");
    const match = tubRaw.match(/^(tuberia [\d.]+)\s+\(([\d.]+)\s+ft\/s\)/);
    if (!match) return { tuberiaInfinity: null, velocidadInfinity: null };
    return { tuberiaInfinity: match[1], velocidadInfinity: parseFloat(match[2]) };
  }, [flujoInfinitySistema]);

  const configBombas = {
    filtrado:      true,
    calentamiento: datosPorSistema?.calentamiento?.usarBombaCalentamiento === "si",
    infinity:      datosDim?.usarBombaInfinity === "si" && (datosDim?.desborde === "infinity" || datosDim?.desborde === "ambos"),
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
  const perdidaClima       = perdidaEvaporacion + perdidaConveccion + perdidaRadiacion + perdidaTransmision + perdidaInfinity + perdidaCanal;

  const calentamiento = datosPorSistema?.calentamiento;

  const { flujo: flujoBDC, carga: cargaBDCft, tuberia: tuberiaBDC, velocidad: velocidadBDC } =
    useMemo(() => extraerFlujoCarga(calentamiento, { sistemaKey: "bombaCalor", modoKey: "modoBDC", selKey: "bdcSeleccionada", manualKey: "bdcManual", flujoFn: (s) => s.seleccion?.flujoTotal, cargaFn: (s) => s.cargaTotal, manualFlujoFn: (m) => m.flujoTotal, manualCargaFn: (m) => m.hidraulica?.cargaTotal }), [calentamiento]);

  const { flujo: flujoPS, carga: cargaPSft, tuberia: tuberiaPS, velocidad: velocidadPS } =
    useMemo(() => extraerFlujoCarga(calentamiento, { sistemaKey: "panelSolar", modoKey: "modoPS", selKey: "psSeleccionado", manualKey: "psManual", flujoFn: (s) => s.seleccion?.flujoTotal, cargaFn: (s) => s.hidraulica?.cargaTotal, tuberiaFn: (s) => s.hidraulica?.tablaTramos?.[0]?.tuberia ?? null, velocidadFn: (s) => s.hidraulica?.tablaTramos?.[0]?.velocidad ?? null, manualFlujoFn: (m) => m.flujoTotal, manualCargaFn: (m) => m.hidraulica?.cargaTotal, manualTuberiaFn: (m) => m.hidraulica?.tablaTramos?.[0]?.tuberia ?? null, manualVelocidadFn: (m) => m.hidraulica?.tablaTramos?.[0]?.velocidad ?? null }), [calentamiento]);

  const { flujo: flujoCaldera, carga: cargaCalderaCft, tuberia: tuberiaCaldera, velocidad: velocidadCaldera } =
    useMemo(() => extraerFlujoCarga(calentamiento, { sistemaKey: "caldera", modoKey: "modoCaldera", selKey: "calderaSeleccionada", manualKey: "calderaManual", flujoFn: (s) => s.seleccion?.flujoTotal, cargaFn: (s) => s.cargaTotal, manualFlujoFn: (m) => m.flujoTotal, manualCargaFn: (m) => m.hidraulica?.cargaTotal }), [calentamiento]);

  const { flujo: flujoCE, carga: cargaCEft, tuberia: tuberiaCE, velocidad: velocidadCE } =
    useMemo(() => extraerFlujoCarga(calentamiento, { sistemaKey: "calentadorElectrico", modoKey: "modoCE", selKey: "ceSeleccionado", manualKey: "ceManual", flujoFn: (s) => s.seleccion?.flujoTotal, cargaFn: (s) => s.cargaTotal, manualFlujoFn: (m) => m.flujoTotal, manualCargaFn: (m) => m.hidraulica?.cargaTotal }), [calentamiento]);

  const bdcListoParaMostrar     = sistemaListoCalor && flujoBDC     != null;
  const psListoParaMostrar      = sistemaListoCalor && flujoPS      != null;
  const calderaListoParaMostrar = sistemaListoCalor && flujoCaldera != null;
  const ceListoParaMostrar      = sistemaListoCalor && flujoCE      != null;
  const hayAlgunCalentamiento   = bdcListoParaMostrar || psListoParaMostrar || calderaListoParaMostrar || ceListoParaMostrar;

  const usoGeneralSistema = useMemo(() => datosDim?.usoGeneral ?? "residencial", [datosDim]);
  const tempAgua = useMemo(() => {
    const decision = datosPorSistema?.calentamiento?.decision;
    if (!decision || decision === "omitir") return 30;
    return datosPorSistema?.calentamiento?.tempDeseada ?? 30;
  }, [datosPorSistema?.calentamiento]);

  const resultadoClorador = useMemo(() => {
    if (!volumenTotal || volumenTotal <= 0) return null;
    if (!areaCalculada || areaCalculada <= 0) return null;
    try { return generadorDeCloro(volumenTotal * 1000, usoGeneralSistema, areaCalculada, volumenTotal, tempAgua); }
    catch { return null; }
  }, [volumenTotal, areaCalculada, usoGeneralSistema, tempAgua]);

  const kgDiaCloroNecesario = useMemo(() => (!resultadoClorador || resultadoClorador.error) ? null : (resultadoClorador.kgDiaNecesario ?? null), [resultadoClorador]);
  const kgDiaCloroInstalado = useMemo(() => (!resultadoClorador || resultadoClorador.error) ? null : (resultadoClorador.kgDiaInstalado ?? null), [resultadoClorador]);
  const flujoClorador  = useMemo(() => (!resultadoClorador || resultadoClorador.error) ? null : (parseFloat(resultadoClorador.seleccion?.flujoTotal) || null), [resultadoClorador]);
  const cargaClorador  = useMemo(() => (!resultadoClorador || resultadoClorador.error) ? null : (parseFloat(resultadoClorador.cargaTotal) || null), [resultadoClorador]);
  const tuberiaClorador   = useMemo(() => (!resultadoClorador || resultadoClorador.error) ? null : (resultadoClorador.tablaTramos?.[0]?.tuberia ?? null), [resultadoClorador]);
  const velocidadClorador = useMemo(() => (!resultadoClorador || resultadoClorador.error) ? null : (resultadoClorador.tablaTramos?.[0]?.velocidad ?? null), [resultadoClorador]);

  const cloradorSeleccionado           = !!sanitizacionSeleccionada?.cloradorSalino;
  const cloradorListo                  = volumenTotal > 0 && areaCalculada > 0 && flujoClorador != null;
  const cargasEquipamiento             = datosPorSistema?.equipamiento?.cargas ?? {};

  const cargaRetorno    = cargasEquipamiento.retorno    != null ? parseFloat(cargasEquipamiento.retorno)    : null;
  const cargaDesnatador = cargasEquipamiento.desnatador != null ? parseFloat(cargasEquipamiento.desnatador) : null;
  const cargaDrenCanal  = cargasEquipamiento.drenCanal  != null ? parseFloat(cargasEquipamiento.drenCanal)  : null;
  const cargaBarredora  = cargasEquipamiento.barredora  != null ? parseFloat(cargasEquipamiento.barredora)  : null;
  const cargaDrenFondo  = cargasEquipamiento.drenFondo  != null ? parseFloat(cargasEquipamiento.drenFondo)  : null;
  const cargaLamparaUV          = cargasEquipamiento.lamparaUV          != null ? parseFloat(cargasEquipamiento.lamparaUV)          : null;
  const cargaCloradorAutomatico = cargasEquipamiento.cloradorAutomatico != null ? parseFloat(cargasEquipamiento.cloradorAutomatico) : null;
  const uvSeleccionado              = !!sanitizacionSeleccionada?.lamparaUV;
  const cloradorAutomaticoSeleccionado = !!sanitizacionSeleccionada?.cloradorAutomatico;
  const cargaFiltroArena    = cargasEquipamiento.filtroArena    != null ? parseFloat(cargasEquipamiento.filtroArena)    : null;
  const cargaPrefiltro      = cargasEquipamiento.prefiltro      != null ? parseFloat(cargasEquipamiento.prefiltro)      : null;
  const cargaFiltroCartucho = cargasEquipamiento.filtroCartucho != null ? parseFloat(cargasEquipamiento.filtroCartucho) : null;

  const estados = datosPorSistema?.equipamiento?.estados ?? {};
  const puntoOperacion = datosPorSistema?.equipamiento?.puntoOperacion ?? null;

  const tieneDesbordeCanal = useMemo(() => {
    const d = datosDim?.desborde;
    return d === "infinity" || d === "canal" || d === "ambos";
  }, [datosDim]);

  const succionActiva = useMemo(() => {
    if (tieneDesbordeCanal) {
      const candidatos = [
        cargaDrenCanal != null ? { label: "Dren canal", valor: cargaDrenCanal, key: "drenCanal" } : null,
        cargaDrenFondo != null ? { label: "Dren fondo", valor: cargaDrenFondo, key: "drenFondo" } : null,
      ].filter(Boolean);
      if (!candidatos.length) return null;
      return candidatos.reduce((max, c) => c.valor > max.valor ? c : max);
    } else {
      const candidatos = [
        cargaDesnatador != null ? { label: "Desnatadores", valor: cargaDesnatador, key: "desnatador" } : null,
        cargaDrenFondo  != null ? { label: "Dren fondo",   valor: cargaDrenFondo,  key: "drenFondo"  } : null,
      ].filter(Boolean);
      if (!candidatos.length) return null;
      return candidatos.reduce((max, c) => c.valor > max.valor ? c : max);
    }
  }, [tieneDesbordeCanal, cargaDesnatador, cargaDrenCanal, cargaDrenFondo]);

  const cargaSumaEmpotrables = useMemo(() => {
    const vals = [cargaRetorno, succionActiva?.valor ?? null].filter(v => v != null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) : null;
  }, [cargaRetorno, succionActiva]);

  const cargaSumaFiltracion = useMemo(() => {
    const vals = [cargaFiltroArena, cargaPrefiltro, cargaFiltroCartucho].filter(v => v != null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) : null;
  }, [cargaFiltroArena, cargaPrefiltro, cargaFiltroCartucho]);

  const cargaSumaCalentamiento = useMemo(() => {
    const vals = [cargaBDCft, cargaPSft, cargaCalderaCft, cargaCEft].filter(v => v != null);
    return vals.length ? vals.reduce((a, b) => a + parseFloat(b), 0) : null;
  }, [cargaBDCft, cargaPSft, cargaCalderaCft, cargaCEft]);

  const cargaSumaSanitizacion = useMemo(() => {
    const vals = [];
    if (cloradorSeleccionado           && cargaClorador           != null) vals.push(cargaClorador);
    if (uvSeleccionado                 && cargaLamparaUV          != null) vals.push(cargaLamparaUV);
    if (cloradorAutomaticoSeleccionado && cargaCloradorAutomatico != null) vals.push(cargaCloradorAutomatico);
    return vals.length ? vals.reduce((a, b) => a + b, 0) : null;
  }, [cloradorSeleccionado, cargaClorador, uvSeleccionado, cargaLamparaUV, cloradorAutomaticoSeleccionado, cargaCloradorAutomatico]);

  const flujosCandidatos = useMemo(() => {
    const lista = [];
    if (flujoFiltrado > 0)        lista.push({ label: "Filtrado",              valor: flujoFiltrado });
    if (flujoInfinitySistema > 0) lista.push({ label: "Infinity",              valor: flujoInfinitySistema });
    if (flujoBDC      != null)    lista.push({ label: "Bomba de calor",        valor: flujoBDC });
    if (flujoPS       != null)    lista.push({ label: "Panel solar",           valor: flujoPS });
    if (flujoCaldera  != null)    lista.push({ label: "Caldera",               valor: flujoCaldera });
    if (flujoCE       != null)    lista.push({ label: "Calent. eléctrico",     valor: flujoCE });
    if (cloradorSeleccionado && flujoClorador != null) lista.push({ label: "Gen. cloro salino", valor: flujoClorador });
    if (cloradorAutomaticoSeleccionado && cargaCloradorAutomatico != null) {
      const estCA = estados?.cloradorAutomatico;
      // Solo fuera de línea cuenta para flujo máximo (5 GPM × cantidad)
      // En línea el agua ya circula en el sistema, no agrega flujo
      if (estCA?.instalacion === "fueraLinea" && estCA?.flujoTotal != null) {
        const flujoCA = parseFloat(estCA.flujoTotal);
        if (flujoCA > 0) lista.push({ label: "Clorador automático", valor: flujoCA });
      }
    }
    return lista.filter(f => f.valor > 0);
  }, [flujoFiltrado, flujoInfinitySistema, flujoBDC, flujoPS, flujoCaldera, flujoCE, cloradorSeleccionado, flujoClorador, uvSeleccionado, cloradorAutomaticoSeleccionado, cargaCloradorAutomatico, cargaLamparaUV, estados]);

  const flujoMaxGlobal = useMemo(() => {
    if (!flujosCandidatos.length) return null;
    return Math.max(...flujosCandidatos.map(f => f.valor));
  }, [flujosCandidatos]);

  const { tuberiaMaxGlobal, velocidadMaxGlobal } = useMemo(() => {
    if (!flujoMaxGlobal || flujoMaxGlobal <= 0) return { tuberiaMaxGlobal: null, velocidadMaxGlobal: null };
    const { velocidadFlujo } = velocidadCargaFlujo(flujoMaxGlobal);
    const tubRaw = tuberiaSeleccionada(velocidadFlujo, "descarga");
    const match  = tubRaw.match(/^(tuberia [\d.]+)\s+\(([\d.]+)\s+ft\/s\)/);
    if (!match) return { tuberiaMaxGlobal: null, velocidadMaxGlobal: null };
    return { tuberiaMaxGlobal: match[1], velocidadMaxGlobal: parseFloat(match[2]) };
  }, [flujoMaxGlobal]);

  const { tuberiaRetorno, velocidadRetorno } = useMemo(() => {
    const flujo = flujoMaxGlobal ?? flujoFiltrado;
    if (!flujo || flujo <= 0) return { tuberiaRetorno: null, velocidadRetorno: null };
    const { velocidadFlujo } = velocidadCargaFlujo(flujo);
    const tubRaw = tuberiaSeleccionada(velocidadFlujo, "descarga");
    const match  = tubRaw.match(/^(tuberia [\d.]+)\s+\(([\d.]+)\s+ft\/s\)/);
    if (!match) return { tuberiaRetorno: null, velocidadRetorno: null };
    return { tuberiaRetorno: match[1], velocidadRetorno: parseFloat(match[2]) };
  }, [flujoMaxGlobal, flujoFiltrado]);

  const { tuberiaSuccion, velocidadSuccion } = useMemo(() => {
    const flujo = flujoMaxGlobal ?? flujoFiltrado;
    if (!flujo || flujo <= 0) return { tuberiaSuccion: null, velocidadSuccion: null };
    const { velocidadFlujo } = velocidadCargaFlujo(flujo);
    const tubRaw = tuberiaSeleccionada(velocidadFlujo, "succion");
    const match  = tubRaw.match(/^(tuberia [\d.]+)\s+\(([\d.]+)\s+ft\/s\)/);
    if (!match) return { tuberiaSuccion: null, velocidadSuccion: null };
    return { tuberiaSuccion: match[1], velocidadSuccion: parseFloat(match[2]) };
  }, [flujoMaxGlobal, flujoFiltrado]);

  const componentesCDT = useMemo(() => {
    const lista = [];
    if (cargaBDCft    != null) lista.push({ label: "Bomba de calor",    valor: parseFloat(cargaBDCft),    grupo: "calentamiento" });
    if (cargaPSft     != null) lista.push({ label: "Panel solar",       valor: parseFloat(cargaPSft),     grupo: "calentamiento" });
    if (cargaCalderaCft != null) lista.push({ label: "Caldera",         valor: parseFloat(cargaCalderaCft), grupo: "calentamiento" });
    if (cargaCEft     != null) lista.push({ label: "Calent. eléctrico", valor: parseFloat(cargaCEft),     grupo: "calentamiento" });
    if (cloradorSeleccionado           && cargaClorador           != null) lista.push({ label: "Gen. cloro salino",  valor: parseFloat(cargaClorador),           grupo: "sanitizacion" });
    if (uvSeleccionado                 && cargaLamparaUV          != null) lista.push({ label: "Lámpara UV",          valor: parseFloat(cargaLamparaUV),          grupo: "sanitizacion" });
    if (cloradorAutomaticoSeleccionado && cargaCloradorAutomatico != null) lista.push({ label: "Clorador automático", valor: parseFloat(cargaCloradorAutomatico), grupo: "sanitizacion" });
    if (cargaRetorno != null) lista.push({ label: "Retornos", valor: cargaRetorno, grupo: "empotrables", desc: "descarga" });
    if (succionActiva != null) {
      const todosSuccion = tieneDesbordeCanal
        ? [cargaDrenCanal != null ? { label: "Dren canal", valor: cargaDrenCanal, key: "drenCanal" } : null, cargaDrenFondo != null ? { label: "Dren fondo", valor: cargaDrenFondo, key: "drenFondo" } : null].filter(Boolean)
        : [cargaDesnatador != null ? { label: "Desnatadores", valor: cargaDesnatador, key: "desnatador" } : null, cargaDrenFondo != null ? { label: "Dren fondo", valor: cargaDrenFondo, key: "drenFondo" } : null].filter(Boolean);
      for (const c of todosSuccion) {
        lista.push({ label: c.label, valor: c.valor, grupo: "empotrables", desc: "succión", gobierna: c.key === succionActiva.key, noSuma: c.key !== succionActiva.key });
      }
    }
    if (cargaBarredora != null) lista.push({ label: "Barredoras", valor: cargaBarredora, grupo: "empotrables", desc: "informativo", noSuma: true });
    if (cargaFiltroArena    != null) lista.push({ label: "Filtro de arena",  valor: cargaFiltroArena,    grupo: "filtracion" });
    if (cargaPrefiltro      != null) lista.push({ label: "Prefiltro",        valor: cargaPrefiltro,      grupo: "filtracion" });
    if (cargaFiltroCartucho != null) lista.push({ label: "Filtro cartucho",  valor: cargaFiltroCartucho, grupo: "filtracion" });
    return lista;
  }, [cargaBDCft, cargaPSft, cargaCalderaCft, cargaCEft, cloradorSeleccionado, cargaClorador, uvSeleccionado, cargaLamparaUV, cloradorAutomaticoSeleccionado, cargaCloradorAutomatico, cargaRetorno, succionActiva, tieneDesbordeCanal, cargaDesnatador, cargaDrenCanal, cargaDrenFondo, cargaBarredora, cargaFiltroArena, cargaPrefiltro, cargaFiltroCartucho]);

  const cargaTotalGlobal = useMemo(() => {
    const sumables = componentesCDT.filter(c => !c.noSuma);
    if (!sumables.length) return null;
    return sumables.reduce((a, c) => a + c.valor, 0);
  }, [componentesCDT]);

  const nombresEquipos = {
    retorno:"Retornos", desnatador:"Desnatadores", barredora:"Barredoras",
    drenFondo:"Dren fondo", drenCanal:"Dren canal",
    filtroArena:"Filtro arena", prefiltro:"Prefiltro",
    filtroCartucho:"Filtro cartucho", lamparaUV:"Lámpara UV",
    cloradorSalino:"Cloro salino", cloradorAutomatico:"Clorador auto",
  };

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
          <button className="icon-btn" title={panelColapsado ? "Expandir panel" : "Contraer panel"} onClick={() => setPanelColapsado(!panelColapsado)}>
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

            {/* ── Datos dimensionales o placeholder ── */}
            {!hayDatos ? (
              <PlaceholderResultados />
            ) : (
              <table className="tabla-resultados tabla-resultados--dim">
                <tbody>
                  <tr>
                    <th>Área total:</th>
                    <td><FlashValue value={areaCalculada}>{formatM2(areaCalculada)}</FlashValue></td>
                  </tr>
                  <tr>
                    <th>Volumen total:</th>
                    <td><FlashValue value={volumenTotal}>{formatM3(volumenTotal)}</FlashValue></td>
                  </tr>
                  <tr>
                    <th>Profundidad promedio:</th>
                    <td><FlashValue value={profundidadPromedio}>{formatMetro(profundidadPromedio)}</FlashValue></td>
                  </tr>
                </tbody>
              </table>
            )}

            {/* ── Toggles con FadeIn ── */}
            <FadeInBloque visible={hayDatos && flujoFiltrado > 0}>
              <ResultadoToggle variante="filtrado" emoji="💧" label="Filtrado" abierto={toggleFiltrado} onToggle={() => setToggleFiltrado(v => !v)}>
                <div className="resultado-subheader resultado-subheader--filtrado">Circuito de filtrado</div>
                <table className="tabla-resultados"><tbody>
                  <tr><th className="th-indent">Flujo filtrado:</th><td className="td-flujo"><FlashValue value={flujoFiltrado}>{formatGPM(flujoFiltrado)}</FlashValue></td></tr>
                  <tr><th className="th-indent">Tubería distribución:</th><td>{fmtTub(tuberiaFiltrado)}</td></tr>
                  <tr><th className="th-indent">Velocidad:</th><td className="td-vel">{fmtVel(velocidadFiltrado)}</td></tr>
                </tbody></table>
                {flujosPorCircuito && (<>
                  <div className="resultado-subheader resultado-subheader--filtrado" style={{color:"#64748b",fontSize:"0.68rem"}}>Desglose por circuito</div>
                  <table className="tabla-resultados"><tbody>
                    {flujosPorCircuito.map((c, i) => (
                      <tr key={i}>
                        <th className="th-indent" style={{color: c.flujo === flujoFiltrado ? "#e2e8f0" : "#64748b"}}>
                          {c.label}:{c.flujo === flujoFiltrado && <span className="desglose-badge desglose-badge--gobierna" style={{marginLeft:"0.3rem"}}>↑ gobierna</span>}
                        </th>
                        <td style={{color: c.flujo === flujoFiltrado ? "#38bdf8" : "#64748b"}}>{formatGPM(c.flujo)}</td>
                      </tr>
                    ))}
                  </tbody></table>
                </>)}
                {flujoInfinitySistema > 0 && (<>
                  <div className="resultado-subheader resultado-subheader--filtrado">Circuito infinity</div>
                  <table className="tabla-resultados"><tbody>
                    <tr><th className="th-indent">Flujo infinity:</th><td className="td-flujo"><FlashValue value={flujoInfinitySistema}>{formatGPM(flujoInfinitySistema)}</FlashValue></td></tr>
                    <tr><th className="th-indent">Tubería distribución:</th><td>{fmtTub(tuberiaInfinity)}</td></tr>
                    <tr><th className="th-indent">Velocidad:</th><td className="td-vel">{fmtVel(velocidadInfinity)}</td></tr>
                    <tr><th className="th-indent">Motobomba dedicada:</th><td>{textoBombaInfinity}</td></tr>
                  </tbody></table>
                </>)}
              </ResultadoToggle>
            </FadeInBloque>

            <FadeInBloque visible={hayAlgunCalentamiento}>
              <ResultadoToggle variante="calentamiento" emoji="🔥" label="Calentamiento" abierto={toggleCalentamiento} onToggle={() => setToggleCalentamiento(v => !v)}>
                <div className="resultado-subheader resultado-subheader--perdidas">Pérdidas energéticas</div>
                <table className="tabla-resultados"><tbody>
                  <tr><th className="th-indent">Evaporación:</th><td>{sistemaListoCalor ? formatBTU(perdidaEvaporacion) : "—"}</td></tr>
                  <tr><th className="th-indent">Convección:</th><td>{sistemaListoCalor ? formatBTU(perdidaConveccion)  : "—"}</td></tr>
                  <tr><th className="th-indent">Radiación:</th><td>{sistemaListoCalor ? formatBTU(perdidaRadiacion)   : "—"}</td></tr>
                  <tr><th className="th-indent">Transmisión:</th><td>{sistemaListoCalor ? formatBTU(perdidaTransmision) : "—"}</td></tr>
                  {sistemaListoCalor && perdidaInfinity > 0 && <tr><th className="th-indent">Infinity:</th><td>{formatBTU(perdidaInfinity)}</td></tr>}
                  {sistemaListoCalor && perdidaCanal > 0 && <tr><th className="th-indent">Canal perimetral:</th><td>{formatBTU(perdidaCanal)}</td></tr>}
                  <tr><th className="th-indent th-subtotal" style={{color:"#94a3b8",fontStyle:"italic"}}>Subtotal clima:</th><td style={{color:"#94a3b8",fontStyle:"italic"}}>{sistemaListoCalor ? formatBTU(perdidaClima) : "—"}</td></tr>
                  <tr><th className="th-indent">+ Tubería distribución:</th><td>{sistemaListoCalor ? formatBTU(perdidaTuberia) : "—"}</td></tr>
                  <tr><th className="th-indent th-total th-seccion">Total pérdidas:</th><td className="td-perdida">{sistemaListoCalor ? formatBTU(perdidaTotalBTU) : "—"}</td></tr>
                </tbody></table>
                {bdcListoParaMostrar && (<><div className="resultado-subheader resultado-subheader--equipo">Bomba de calor</div><table className="tabla-resultados"><tbody><tr><th className="th-indent">Flujo total:</th><td className="td-flujo">{fmtGPM(flujoBDC)}</td></tr><tr><th className="th-indent">Tubería distribución:</th><td>{fmtTub(tuberiaBDC)}</td></tr><tr><th className="th-indent">Velocidad:</th><td className="td-vel">{fmtVel(velocidadBDC)}</td></tr><tr><th className="th-indent">CDT:</th><td className="td-cdt">{fmtFt(cargaBDCft)}</td></tr></tbody></table></>)}
                {psListoParaMostrar && (<><div className="resultado-subheader resultado-subheader--equipo">Panel solar</div><table className="tabla-resultados"><tbody><tr><th className="th-indent">Flujo total:</th><td className="td-flujo">{fmtGPM(flujoPS)}</td></tr><tr><th className="th-indent">Tubería distribución:</th><td>{fmtTub(tuberiaPS)}</td></tr><tr><th className="th-indent">Velocidad:</th><td className="td-vel">{fmtVel(velocidadPS)}</td></tr><tr><th className="th-indent">CDT:</th><td className="td-cdt">{fmtFt(cargaPSft)}</td></tr></tbody></table></>)}
                {calderaListoParaMostrar && (<><div className="resultado-subheader resultado-subheader--equipo">Caldera de gas</div><table className="tabla-resultados"><tbody><tr><th className="th-indent">Flujo total:</th><td className="td-flujo">{fmtGPM(flujoCaldera)}</td></tr><tr><th className="th-indent">Tubería distribución:</th><td>{fmtTub(tuberiaCaldera)}</td></tr><tr><th className="th-indent">Velocidad:</th><td className="td-vel">{fmtVel(velocidadCaldera)}</td></tr><tr><th className="th-indent">CDT:</th><td className="td-cdt">{fmtFt(cargaCalderaCft)}</td></tr></tbody></table></>)}
                {ceListoParaMostrar && (<><div className="resultado-subheader resultado-subheader--equipo">Calentador eléctrico</div><table className="tabla-resultados"><tbody><tr><th className="th-indent">Flujo total:</th><td className="td-flujo">{fmtGPM(flujoCE)}</td></tr><tr><th className="th-indent">Tubería distribución:</th><td>{fmtTub(tuberiaCE)}</td></tr><tr><th className="th-indent">Velocidad:</th><td className="td-vel">{fmtVel(velocidadCE)}</td></tr><tr><th className="th-indent">CDT:</th><td className="td-cdt">{fmtFt(cargaCEft)}</td></tr></tbody></table></>)}
                {cargaSumaCalentamiento != null && (<table className="tabla-resultados" style={{ marginTop: "0.25rem" }}><tbody><tr><th className="th-indent th-total th-seccion">Subtotal CDT:</th><td className="td-cdt" style={{ fontWeight: 700 }}>{fmtFt(cargaSumaCalentamiento)}</td></tr></tbody></table>)}
              </ResultadoToggle>
            </FadeInBloque>

            <FadeInBloque visible={cloradorSeleccionado || uvSeleccionado || cloradorAutomaticoSeleccionado}>
              <ResultadoToggle variante="sanitizacion" emoji="🧪" label="Sanitización" abierto={toggleSanitizacion} onToggle={() => setToggleSanitizacion(v => !v)}>
                {cloradorSeleccionado && cloradorListo && (<><div className="resultado-subheader resultado-subheader--cloro">Gen. cloro salino</div><table className="tabla-resultados"><tbody><tr><th className="th-indent">Flujo total:</th><td className="td-flujo">{fmtGPM(flujoClorador)}</td></tr><tr><th className="th-indent">Tubería distribución:</th><td>{fmtTub(tuberiaClorador)}</td></tr><tr><th className="th-indent">Velocidad:</th><td className="td-vel">{fmtVel(velocidadClorador)}</td></tr><tr><th className="th-indent">CDT:</th><td className="td-cdt">{fmtFt(cargaClorador)}</td></tr></tbody></table></>)}
                {cloradorSeleccionado && cloradorListo && kgDiaCloroNecesario != null && (<table className="tabla-resultados"><tbody><tr><th className="th-indent">Cloro necesario:</th><td className="td-cloro-nec">{fmtKg(kgDiaCloroNecesario)}</td></tr></tbody></table>)}
                {uvSeleccionado && cargaLamparaUV != null && (<><div className="resultado-subheader resultado-subheader--cloro">Lámpara UV</div><table className="tabla-resultados"><tbody><tr><th className="th-indent">Flujo sistema:</th><td className="td-flujo">{fmtGPM(flujoMaxGlobal)}</td></tr><tr><th className="th-indent">Tubería distribución:</th><td>{fmtTub(tuberiaMaxGlobal)}</td></tr><tr><th className="th-indent">Velocidad:</th><td className="td-vel">{fmtVel(velocidadMaxGlobal)}</td></tr><tr><th className="th-indent">CDT:</th><td className="td-cdt">{fmtFt(cargaLamparaUV)}</td></tr></tbody></table></>)}
                {cloradorAutomaticoSeleccionado && cargaCloradorAutomatico != null && (<><div className="resultado-subheader resultado-subheader--cloro">Clorador automático</div><table className="tabla-resultados"><tbody><tr><th className="th-indent">Flujo sistema:</th><td className="td-flujo">{fmtGPM(flujoMaxGlobal)}</td></tr><tr><th className="th-indent">Tubería distribución:</th><td>{fmtTub(tuberiaMaxGlobal)}</td></tr><tr><th className="th-indent">Velocidad:</th><td className="td-vel">{fmtVel(velocidadMaxGlobal)}</td></tr><tr><th className="th-indent">CDT:</th><td className="td-cdt">{fmtFt(cargaCloradorAutomatico)}</td></tr></tbody></table></>)}
                {cargaSumaSanitizacion != null && (cloradorSeleccionado ? 1 : 0) + (uvSeleccionado ? 1 : 0) + (cloradorAutomaticoSeleccionado ? 1 : 0) > 1 && (<table className="tabla-resultados" style={{ marginTop: "0.25rem" }}><tbody><tr><th className="th-indent th-total th-seccion">Subtotal CDT:</th><td className="td-cdt" style={{ fontWeight: 700 }}>{fmtFt(cargaSumaSanitizacion)}</td></tr></tbody></table>)}
              </ResultadoToggle>
            </FadeInBloque>

            <FadeInBloque visible={cargaRetorno != null || succionActiva != null || cargaBarredora != null}>
              <ResultadoToggle variante="filtrado" emoji="🔩" label="Empotrables" abierto={toggleEmpotrables} onToggle={() => setToggleEmpotrables(v => !v)}>
                {cargaRetorno != null && (<><div className="resultado-subheader resultado-subheader--equipo">Retornos</div><table className="tabla-resultados"><tbody><tr><th className="th-indent">Flujo sistema:</th><td className="td-flujo">{fmtGPM(flujoMaxGlobal)}</td></tr><tr><th className="th-indent">Tubería distribución:</th><td>{fmtTub(tuberiaRetorno)}</td></tr><tr><th className="th-indent">Velocidad:</th><td className="td-vel">{fmtVel(velocidadRetorno)}</td></tr><tr><th className="th-indent">CDT:</th><td className="td-cdt">{fmtFt(cargaRetorno)}</td></tr></tbody></table></>)}
                {tieneDesbordeCanal ? (<>
                  {cargaDrenCanal != null && (<><div className="resultado-subheader resultado-subheader--equipo">Dren canal{succionActiva?.key === "drenCanal" ? " ↑ gobierna" : " — no suma"}</div><table className="tabla-resultados"><tbody><tr><th className="th-indent">Flujo sistema:</th><td className="td-flujo">{fmtGPM(flujoMaxGlobal)}</td></tr><tr><th className="th-indent">Tubería distribución:</th><td style={succionActiva?.key !== "drenCanal" ? { color: "#64748b" } : {}}>{fmtTub(tuberiaSuccion)}</td></tr><tr><th className="th-indent">Velocidad:</th><td className="td-vel" style={succionActiva?.key !== "drenCanal" ? { color: "#64748b" } : {}}>{fmtVel(velocidadSuccion)}</td></tr><tr><th className="th-indent">CDT:</th><td style={succionActiva?.key !== "drenCanal" ? { color: "#64748b" } : { color: "#60a5fa" }}>{fmtFt(cargaDrenCanal)}</td></tr></tbody></table></>)}
                  {cargaDrenFondo != null && (<><div className="resultado-subheader resultado-subheader--equipo">Dren fondo{succionActiva?.key === "drenFondo" ? " ↑ gobierna" : " — no suma"}</div><table className="tabla-resultados"><tbody><tr><th className="th-indent">Flujo sistema:</th><td className="td-flujo">{fmtGPM(flujoMaxGlobal)}</td></tr><tr><th className="th-indent">Tubería distribución:</th><td style={succionActiva?.key !== "drenFondo" ? { color: "#64748b" } : {}}>{fmtTub(tuberiaSuccion)}</td></tr><tr><th className="th-indent">Velocidad:</th><td className="td-vel" style={succionActiva?.key !== "drenFondo" ? { color: "#64748b" } : {}}>{fmtVel(velocidadSuccion)}</td></tr><tr><th className="th-indent">CDT:</th><td style={succionActiva?.key !== "drenFondo" ? { color: "#64748b" } : { color: "#60a5fa" }}>{fmtFt(cargaDrenFondo)}</td></tr></tbody></table></>)}
                </>) : (<>
                  {cargaDesnatador != null && (<><div className="resultado-subheader resultado-subheader--equipo">Desnatadores{succionActiva?.key === "desnatador" ? " ↑ gobierna" : " — no suma"}</div><table className="tabla-resultados"><tbody><tr><th className="th-indent">Flujo sistema:</th><td className="td-flujo">{fmtGPM(flujoMaxGlobal)}</td></tr><tr><th className="th-indent">Tubería distribución:</th><td style={succionActiva?.key !== "desnatador" ? { color: "#64748b" } : {}}>{fmtTub(tuberiaSuccion)}</td></tr><tr><th className="th-indent">Velocidad:</th><td className="td-vel" style={succionActiva?.key !== "desnatador" ? { color: "#64748b" } : {}}>{fmtVel(velocidadSuccion)}</td></tr><tr><th className="th-indent">CDT:</th><td style={succionActiva?.key !== "desnatador" ? { color: "#64748b" } : { color: "#60a5fa" }}>{fmtFt(cargaDesnatador)}</td></tr></tbody></table></>)}
                  {cargaDrenFondo != null && (<><div className="resultado-subheader resultado-subheader--equipo">Dren fondo{succionActiva?.key === "drenFondo" ? " ↑ gobierna" : " — no suma"}</div><table className="tabla-resultados"><tbody><tr><th className="th-indent">Flujo sistema:</th><td className="td-flujo">{fmtGPM(flujoMaxGlobal)}</td></tr><tr><th className="th-indent">Tubería distribución:</th><td style={succionActiva?.key !== "drenFondo" ? { color: "#64748b" } : {}}>{fmtTub(tuberiaSuccion)}</td></tr><tr><th className="th-indent">Velocidad:</th><td className="td-vel" style={succionActiva?.key !== "drenFondo" ? { color: "#64748b" } : {}}>{fmtVel(velocidadSuccion)}</td></tr><tr><th className="th-indent">CDT:</th><td style={succionActiva?.key !== "drenFondo" ? { color: "#64748b" } : { color: "#60a5fa" }}>{fmtFt(cargaDrenFondo)}</td></tr></tbody></table></>)}
                </>)}
                {cargaBarredora != null && (<><div className="resultado-subheader" style={{ color: "#64748b" }}>Barredoras — informativo</div><table className="tabla-resultados"><tbody><tr><th className="th-indent" style={{ color: "#64748b" }}>Flujo sistema:</th><td style={{ color: "#64748b" }}>{fmtGPM(flujoMaxGlobal)}</td></tr><tr><th className="th-indent" style={{ color: "#64748b" }}>Tubería distribución:</th><td style={{ color: "#64748b" }}>{fmtTub(tuberiaRetorno)}</td></tr><tr><th className="th-indent" style={{ color: "#64748b" }}>Velocidad:</th><td style={{ color: "#64748b" }}>{fmtVel(velocidadRetorno)}</td></tr><tr><th className="th-indent" style={{ color: "#64748b" }}>CDT (ref):</th><td style={{ color: "#64748b" }}>{fmtFt(cargaBarredora)}</td></tr></tbody></table></>)}
                {cargaSumaEmpotrables != null && (<table className="tabla-resultados" style={{ marginTop: "0.25rem" }}><tbody><tr><th className="th-indent th-total th-seccion">Subtotal CDT:</th><td className="td-cdt" style={{ fontWeight: 700 }}>{fmtFt(cargaSumaEmpotrables)}</td></tr></tbody></table>)}
              </ResultadoToggle>
            </FadeInBloque>

            <FadeInBloque visible={cargaSumaFiltracion != null}>
              <ResultadoToggle variante="filtrado" emoji="🧹" label="Filtración" abierto={toggleFiltracion} onToggle={() => setToggleFiltracion(v => !v)}>
                {cargaFiltroArena != null && (<><div className="resultado-subheader resultado-subheader--equipo">Filtro de arena</div><table className="tabla-resultados"><tbody><tr><th className="th-indent">Flujo sistema:</th><td className="td-flujo">{fmtGPM(flujoMaxGlobal)}</td></tr><tr><th className="th-indent">Tubería distribución:</th><td>{fmtTub(tuberiaMaxGlobal)}</td></tr><tr><th className="th-indent">Velocidad:</th><td className="td-vel">{fmtVel(velocidadMaxGlobal)}</td></tr><tr><th className="th-indent">CDT:</th><td className="td-cdt">{fmtFt(cargaFiltroArena)}</td></tr></tbody></table></>)}
                {cargaPrefiltro != null && (<><div className="resultado-subheader resultado-subheader--equipo">Prefiltro</div><table className="tabla-resultados"><tbody><tr><th className="th-indent">Flujo sistema:</th><td className="td-flujo">{fmtGPM(flujoMaxGlobal)}</td></tr><tr><th className="th-indent">Tubería distribución:</th><td>{fmtTub(tuberiaMaxGlobal)}</td></tr><tr><th className="th-indent">Velocidad:</th><td className="td-vel">{fmtVel(velocidadMaxGlobal)}</td></tr><tr><th className="th-indent">CDT:</th><td className="td-cdt">{fmtFt(cargaPrefiltro)}</td></tr></tbody></table></>)}
                {cargaFiltroCartucho != null && (<><div className="resultado-subheader resultado-subheader--equipo">Filtro cartucho</div><table className="tabla-resultados"><tbody><tr><th className="th-indent">Flujo sistema:</th><td className="td-flujo">{fmtGPM(flujoMaxGlobal)}</td></tr><tr><th className="th-indent">Tubería distribución:</th><td>{fmtTub(tuberiaMaxGlobal)}</td></tr><tr><th className="th-indent">Velocidad:</th><td className="td-vel">{fmtVel(velocidadMaxGlobal)}</td></tr><tr><th className="th-indent">CDT:</th><td className="td-cdt">{fmtFt(cargaFiltroCartucho)}</td></tr></tbody></table></>)}
                <table className="tabla-resultados" style={{ marginTop: "0.25rem" }}><tbody><tr><th className="th-indent th-total th-seccion">Subtotal CDT:</th><td className="td-cdt" style={{ fontWeight: 700 }}>{fmtFt(cargaSumaFiltracion)}</td></tr></tbody></table>
              </ResultadoToggle>
            </FadeInBloque>

            <FadeInBloque visible={flujoMaxGlobal != null}>
            {flujoMaxGlobal != null && (
            <div className="resultado-totales-bloque">
              <button className={`resultado-total-btn resultado-total-btn--flujo ${toggleFlujoMax ? "abierto" : ""}`} onClick={() => setToggleFlujoMax(v => !v)}>
                <span className="resultado-total-btn-label">
                  <span className="resultado-total-btn-titulo">Flujo máx. global</span>
                  <span className="resultado-total-btn-valor resultado-total-btn-valor--flujo">
                    <FlashValue value={flujoMaxGlobal}>{fmtGPM(flujoMaxGlobal)}</FlashValue>
                  </span>
                </span>
                <ChevronDown size={11} className={`resultado-toggle-chevron ${toggleFlujoMax ? "abierto" : ""}`} />
              </button>
              <AnimatedToggleCuerpo abierto={toggleFlujoMax} variante="totales-flujo">
                <div className="resultado-totales-desglose resultado-totales-desglose--flujo">
                  {flujosCandidatos.map((f, i) => {
                    const esMax = f.valor === flujoMaxGlobal;
                    return (
                      <div key={i} className={`resultado-totales-desglose-fila ${esMax ? "fila-gobierna" : "fila-secundaria"}`}>
                        <span className="desglose-label">{f.label}{esMax && <span className="desglose-badge desglose-badge--gobierna">↑ máx</span>}</span>
                        <span className="desglose-valor">{fmtGPM(f.valor)}</span>
                      </div>
                    );
                  })}
                </div>
              </AnimatedToggleCuerpo>

              {cargaTotalGlobal != null && (<>
              <button className={`resultado-total-btn resultado-total-btn--cdt ${toggleCDTTotal ? "abierto" : ""}`} onClick={() => setToggleCDTTotal(v => !v)}>
                <span className="resultado-total-btn-label">
                  <span className="resultado-total-btn-titulo">CDT total sistema</span>
                  <span className="resultado-total-btn-valor resultado-total-btn-valor--cdt">
                    <FlashValue value={cargaTotalGlobal}>{fmtFt(cargaTotalGlobal)}</FlashValue>
                  </span>
                </span>
                <ChevronDown size={11} className={`resultado-toggle-chevron ${toggleCDTTotal ? "abierto" : ""}`} />
              </button>
              <AnimatedToggleCuerpo abierto={toggleCDTTotal} variante="totales-cdt">
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
              </AnimatedToggleCuerpo>
              </>)}

              {puntoOperacion?.flujo != null && (() => {
                const deltaFlujo = flujoMaxGlobal ? (puntoOperacion.flujo - flujoMaxGlobal) / flujoMaxGlobal * 100 : null;
                const deltaCDT   = cargaTotalGlobal ? (puntoOperacion.cdt - cargaTotalGlobal) / cargaTotalGlobal * 100 : null;
                const colorDelta = deltaFlujo != null && Math.abs(deltaFlujo) < 5 ? "#34d399" : "#f97316";
                return (
                  <div style={{
                    marginTop: "0.35rem",
                    padding: "0.55rem 0.75rem",
                    background: "rgba(52,211,153,0.08)",
                    border: `1px solid rgba(52,211,153,${temaOscuro ? "0.25" : "0.4"})`,
                    borderRadius: "8px",
                    display: "flex", flexDirection: "column", gap: "0.35rem",
                  }}>
                    <div style={{ fontSize: "0.62rem", color: temaOscuro ? "#34d399" : "#059669", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.1rem" }}>
                      ⚡ Punto de operación
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.72rem", color: temaOscuro ? "#d1fae5" : "#1e293b", fontWeight: 600 }}>Flujo</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: temaOscuro ? "#34d399" : "#059669" }}>{fmtGPM(puntoOperacion.flujo)}</span>
                        {deltaFlujo != null && <span style={{ fontSize: "0.67rem", fontWeight: 600, color: colorDelta === "#34d399" ? (temaOscuro ? "#34d399" : "#059669") : (temaOscuro ? "#f97316" : "#ea580c") }}>{fmtPct(deltaFlujo)}</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.72rem", color: temaOscuro ? "#d1fae5" : "#1e293b", fontWeight: 600 }}>CDT</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: temaOscuro ? "#e2e8f0" : "#1e293b" }}>{fmtFt(puntoOperacion.cdt)}</span>
                        {deltaCDT != null && <span style={{ fontSize: "0.67rem", fontWeight: 600, color: temaOscuro ? "#94a3b8" : "#475569" }}>{fmtPct(deltaCDT)}</span>}
                      </div>
                    </div>
                  </div>
                );
              })()}

            </div>
            )}
            </FadeInBloque>

          </div>
        </div>

        <div className="panel-bottom">
          <div className="panel-bottom-logo-row">
            {panelColapsado ? <LogoIcono /> : <LogoCompleto />}
            <div className="panel-bottom-sep" />
            <div className="panel-bottom-menu-wrapper">
              <button className={`panel-bottom-icon-btn ${menuUsuarioAbierto ? "panel-bottom-icon-btn-activo" : ""}`} title="Configuración" onClick={() => setMenuUsuarioAbierto(!menuUsuarioAbierto)}>
                <Settings size={15} />
              </button>
              <MenuUsuario abierto={menuUsuarioAbierto} onCerrar={() => setMenuUsuarioAbierto(false)} panelColapsado={panelColapsado} temaOscuro={temaOscuro} setTemaOscuro={setTemaOscuro} />
            </div>
          </div>
        </div>

      </div>

      {/* ══════════ PANEL DERECHO ══════════ */}
      <div className="panel-derecho">
        <div className="panel-derecho-contenido">
          {seccion === "dimensiones" && (
            <Dimensiones ref={dimensionesRef} setSeccion={setSeccion} sistemaActivo={sistemaActivo} setSistemaActivo={setSistemaActivo} datosPorSistema={datosPorSistema} setDatosPorSistema={setDatosPorSistema} />
          )}
          {seccion === "calentamiento" && (
            <Calentamiento setSeccion={setSeccion} tipoSistema={sistemaActivo} datosPorSistema={datosPorSistema} setDatosPorSistema={setDatosPorSistema} areaTotal={areaCalculada} volumenTotal={volumenTotal} profundidadPromedio={profundidadPromedio} />
          )}
          {seccion === "equipamiento" && (
            <Equipamiento setSeccion={setSeccion} sistemaActivo={sistemaActivo} datosPorSistema={datosPorSistema} setDatosPorSistema={setDatosPorSistema} configBombas={configBombas} resultadoClorador={resultadoClorador} flujoMaxGlobal={flujoMaxGlobal} cargaTotalGlobal={cargaTotalGlobal} onSanitizacionChange={handleSanitizacionChange} flujoInfinityVal={flujoInfinitySistema > 0 ? flujoInfinitySistema : null} flujoFiltradoVal={flujoFiltrado > 0 ? flujoFiltrado : null} volumenTotalVal={volumenTotal > 0 ? volumenTotal : null} />
          )}
        </div>
      </div>

    </div>
  );
}