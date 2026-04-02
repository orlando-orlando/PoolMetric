import { useState, useMemo } from "react";
import "../estilos.css";
import { generadoresDeCloro }    from "../data/generadoresDeCloro";
import { cloradoresAutomaticos } from "../data/cloradoresAutomaticos";
import { generadoresUV }         from "../data/generadoresUV";
import { calcularCargaCloradorManual }                           from "../utils/generadorDeCloro";
import { cloradorAutomatico, calcularCargaCloradorAutomaticoManual } from "../utils/cloradorAutomatico";
import { generadorUV, calcularCargaUVManual }                   from "../utils/generadorUV";
import { volumen } from "../utils/volumen";

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

const IconoCheck = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 7L5.5 10.5L12 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
   SISTEMAS DE SANITIZACIÓN
===================================================== */
const SISTEMAS_SANITIZACION = [
  { key: "cloradorSalino",     label: "Generador de cloro salino", Icon: IconoCloradorSalino     },
  { key: "cloradorAutomatico", label: "Clorador automático",       Icon: IconoCloradorAutomatico },
  { key: "lamparaUV",          label: "Lámpara UV",                Icon: IconoLamparaUV          },
];

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
      return {
        marca: cloradorManual.equipo.marca, modelo: cloradorManual.equipo.modelo,
        cantidad: cloradorManual.cantidad, flujoTotal: cloradorManual.flujoTotal,
        cargaTotal: cloradorManual.hidraulica?.cargaTotal,
        cargaTotalPSI: cloradorManual.hidraulica?.cargaTotalPSI,
        capInstalada: parseFloat((cloradorManual.cantidad * cloradorManual.equipo.specs.capacidadComercial).toFixed(3)),
        unidad: "kg/día",
      };
    }
    if (rec) {
      return {
        marca: rec.seleccion.marca, modelo: rec.seleccion.modelo,
        cantidad: rec.seleccion.cantidad, flujoTotal: rec.seleccion.flujoTotal,
        cargaTotal: rec.cargaTotal, cargaTotalPSI: rec.cargaTotalPSI,
        capInstalada: rec.kgDiaInstalado,
        unidad: rec.modoCloro === "comercial" ? "kg/día" : "litros",
      };
    }
    return null;
  }, [modoCL, cloradorManual, rec]);

  if (!rec) return (
    <div className="sanitizacion-pendiente">
      Completa las dimensiones para ver la selección de generadores de cloro
    </div>
  );

  return (
    <div className="sanitizacion-bloque-equipo">
      <div className="bdc-modo-toggle-wrapper">
        <div className="bdc-modo-toggle">
          <button type="button" className={`bdc-modo-btn ${modoCL === "recomendado" ? "bdc-modo-activo" : ""}`} onClick={() => setModoCL("recomendado")}>
            {modoCL === "recomendado" && <IconoCheck />}<span>Recomendado</span>
          </button>
          <button type="button" className={`bdc-modo-btn ${modoCL === "manual" ? "bdc-modo-activo" : ""}`} onClick={() => setModoCL("manual")}>
            {modoCL === "manual" && <IconoCheck />}<span>Selección manual</span>
          </button>
        </div>
      </div>

      <div className="layout-clima-bdc-fila2" style={{ marginTop: 0 }}>
        <div className="layout-clima-bdc-celda celda-bdc-rec">
          {infoActiva ? (
            <div className={`bdc-recomendada-card bdc-inset ${modoCL === "manual" ? "bdc-card-manual-activa" : ""}`}>
              <div className="bdc-rec-header">
                <IconoCloradorSalino />
                <div className="bdc-rec-titulo">
                  <span className="bdc-rec-label">{modoCL === "recomendado" ? "Recomendado" : "Manual"}</span>
                  <span className="bdc-rec-modelo">{infoActiva.marca} · {infoActiva.modelo}</span>
                </div>
                <span className={`bdc-modo-badge ${modoCL === "manual" ? "badge-manual" : "badge-auto"}`}>
                  {modoCL === "manual" ? "Manual" : "Auto"}
                </span>
              </div>
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
                  <div className="bdc-demanda-fila">
                    <span className="bdc-demanda-label">Capacidad instalada</span>
                    <span className="bdc-demanda-valor bdc-ok">{infoActiva.capInstalada} {infoActiva.unidad}</span>
                  </div>
                  {rec.kgDiaNecesario != null && (
                    <div className="bdc-demanda-fila">
                      <span className="bdc-demanda-label">Demanda necesaria</span>
                      <span className="bdc-demanda-valor">{rec.kgDiaNecesario} kg/día</span>
                    </div>
                  )}
                </div>
              )}
              {infoActiva.cargaTotal != null && (
                <div className="bdc-rec-hidraulica">
                  <span className="bdc-hid-label">Carga hidráulica</span>
                  <span className="bdc-hid-valor">{infoActiva.cargaTotal} ft · {infoActiva.cargaTotalPSI} PSI</span>
                </div>
              )}
            </div>
          ) : (
            <div className="bdc-recomendada-card bdc-pendiente bdc-inset">
              <div className="bdc-rec-header">
                <IconoCloradorSalino />
                <div className="bdc-rec-titulo">
                  <span className="bdc-rec-label">Generador de cloro salino</span>
                  <span className="bdc-rec-modelo bdc-pendiente-txt">
                    {modoCL === "recomendado" ? "Completa las dimensiones" : "Selecciona un equipo"}
                  </span>
                </div>
              </div>
            </div>
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
                {rec.kgDiaNecesario != null && (<>
                  <div className="bdc-auto-fila"><span className="bdc-auto-label">Demanda necesaria</span><span className="bdc-auto-val">{rec.kgDiaNecesario} kg/día</span></div>
                  <div className="bdc-auto-fila"><span className="bdc-auto-label">Capacidad instalada</span><span className="bdc-auto-val">{rec.kgDiaInstalado} kg/día</span></div>
                  <div className="bdc-auto-fila"><span className="bdc-auto-label">Factor Ft</span><span className="bdc-auto-val">{rec.ft}</span></div>
                  <div className="bdc-auto-fila"><span className="bdc-auto-label">Temp. referencia</span><span className="bdc-auto-val">{rec.temp} °C</span></div>
                </>)}
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
          {modoCL === "manual" && (
            <div className="bdc-selector-manual bdc-inset">
              <div className="bdc-manual-header"><span className="bdc-manual-titulo">Catálogo de generadores</span></div>
              <div className="bdc-manual-filtros">
                <div className="campo">
                  <label>Marca</label>
                  <select value={filtroMarca} onChange={e => setFiltroMarca(e.target.value)}>
                    {marcasDisponibles.map(m => <option key={m} value={m}>{m === "todas" ? "Todas las marcas" : m}</option>)}
                  </select>
                </div>
              </div>
              <div className="bdc-manual-lista">
                {catalogoFiltrado.map(g => {
                  const esRec = rec && g.marca === rec.seleccion.marca && g.modelo === rec.seleccion.modelo;
                  const sel   = selManualCLId === g.id;
                  return (
                    <div key={g.id} className={`bdc-manual-fila ${sel ? "bdc-manual-fila-activa" : ""}`}
                      onClick={() => { setSelManualCLId(sel ? null : g.id); setSelManualCLCant(1); }}>
                      <div className="bdc-manual-fila-info">
                        <span className="bdc-manual-marca">{g.marca}</span>
                        <span className="bdc-manual-modelo">{g.modelo}</span>
                        <span className="bdc-manual-vel vel-1v">{g.specs.flujo} GPM</span>
                        {esRec && <span className="bdc-manual-badge-rec">★ Rec.</span>}
                      </div>
                      <div className="bdc-manual-fila-cap">{g.specs.capacidadComercial} kg/día</div>
                    </div>
                  );
                })}
                {catalogoFiltrado.length === 0 && <div className="bdc-manual-vacio">Sin modelos para estos filtros</div>}
              </div>
              {selManualCLId && (
                <div className="bdc-manual-resultado">
                  <div className="bdc-manual-cant-row">
                    <span className="bdc-manual-cant-label">Cantidad de equipos</span>
                    <div className="bdc-manual-cant-ctrl">
                      <button onClick={() => setSelManualCLCant(c => Math.max(1, c - 1))}>−</button>
                      <span>{selManualCLCant}</span>
                      <button onClick={() => setSelManualCLCant(c => c + 1)}>+</button>
                    </div>
                  </div>
                  {cloradorManual && (<>
                    <div className="bdc-demanda-fila"><span className="bdc-demanda-label">Flujo total</span><span className="bdc-demanda-valor">{parseFloat(cloradorManual.flujoTotal).toFixed(1)} GPM</span></div>
                    <div className="bdc-demanda-fila"><span className="bdc-demanda-label">Capacidad instalada</span><span className="bdc-demanda-valor bdc-ok">{parseFloat((cloradorManual.cantidad * cloradorManual.equipo.specs.capacidadComercial).toFixed(3))} kg/día</span></div>
                    {cloradorManual.hidraulica && (
                      <div className="bdc-manual-hidraulica-detalle">
                        <div className="bdc-auto-sep" style={{ margin: "0.5rem 0" }} />
                        <div className="bdc-hid-detalle-titulo">Carga hidráulica</div>
                        <div className="bdc-auto-fila"><span className="bdc-auto-label">Carga tramos</span><span className="bdc-auto-val">{cloradorManual.hidraulica.cargaTramos} ft</span></div>
                        <div className="bdc-auto-fila"><span className="bdc-auto-label">Carga fija</span><span className="bdc-auto-val">{cloradorManual.hidraulica.cargaFija_ft} ft</span></div>
                        <div className="bdc-auto-sep" style={{ margin: "0.5rem 0" }} />
                        <div className="bdc-auto-fila bdc-auto-total">
                          <span className="bdc-auto-label">Carga total</span>
                          <span className="bdc-auto-val bdc-hid-val-highlight">{cloradorManual.hidraulica.cargaTotal} ft · {cloradorManual.hidraulica.cargaTotalPSI} PSI</span>
                        </div>
                      </div>
                    )}
                  </>)}
                </div>
              )}
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
  const [filtroInst,      setFiltroInst]      = useState("todos");

  const rec = useMemo(() => {
    if (!instalacion || !volumenLitros || volumenLitros <= 0) return null;
    try {
      const r = cloradorAutomatico(volumenLitros, usoGeneral, areaM2, volumenM3, tempC, instalacion);
      return r?.error ? null : r;
    } catch { return null; }
  }, [instalacion, volumenLitros, usoGeneral, areaM2, volumenM3, tempC]);

  const marcasDisponibles = useMemo(() =>
    ["todas", ...new Set(
      cloradoresAutomaticos
        .filter(c => c.metadata.activo && (!instalacion || c.instalacion === instalacion))
        .map(c => c.marca)
    )],
  [instalacion]);

  const catalogoFiltrado = useMemo(() =>
    cloradoresAutomaticos.filter(c => {
      if (!c.metadata.activo) return false;
      if (instalacion && c.instalacion !== instalacion) return false;
      if (filtroMarca !== "todas" && c.marca !== filtroMarca) return false;
      if (filtroInst  !== "todos" && c.instalacion !== filtroInst) return false;
      return true;
    }),
  [instalacion, filtroMarca, filtroInst]);

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
    if (modoCL === "manual" && cloradorManual) {
      return {
        marca: cloradorManual.equipo.marca, modelo: cloradorManual.equipo.modelo,
        instalacion: cloradorManual.equipo.instalacion,
        cantidad: cloradorManual.cantidad, flujoTotal: cloradorManual.flujoTotal,
        cargaTotal: cloradorManual.hidraulica?.cargaTotal,
        cargaTotalPSI: cloradorManual.hidraulica?.cargaTotalPSI,
        capInstalada: parseFloat((cloradorManual.cantidad * cloradorManual.equipo.specs.capacidadComercial).toFixed(3)),
        unidad: "kg/día",
      };
    }
    if (rec) {
      return {
        marca: rec.seleccion.marca, modelo: rec.seleccion.modelo,
        instalacion: rec.seleccion.instalacion,
        cantidad: rec.seleccion.cantidad, flujoTotal: rec.seleccion.flujoTotal,
        cargaTotal: rec.cargaTotal, cargaTotalPSI: rec.cargaTotalPSI,
        capInstalada: rec.kgDiaInstalado,
        unidad: rec.modoCloro === "comercial" ? "kg/día" : "litros",
      };
    }
    return null;
  }, [modoCL, cloradorManual, rec]);

  const labelInstalacion = (inst) =>
    inst === "enLinea" ? "En línea" : inst === "fueraLinea" ? "Fuera de línea" : inst;

  if (!instalacion) {
    return (
      <div className="sanitizacion-bloque-equipo">
        <div className="sanitizacion-tipo-instalacion">
          <div className="sanitizacion-tipo-label">Selecciona el tipo de instalación</div>
          <div className="sistemas-calentamiento-grid" style={{ gridTemplateColumns: "1fr 1fr", marginTop: "0.5rem" }}>
            <div className="sistema-cal-card" onClick={() => setInstalacion("enLinea")}>
              <div className="sistema-cal-icon"><IconoCloradorAutomatico /></div>
              <div className="sistema-cal-label">En línea</div>
            </div>
            <div className="sistema-cal-card" onClick={() => setInstalacion("fueraLinea")}>
              <div className="sistema-cal-icon"><IconoCloradorAutomatico /></div>
              <div className="sistema-cal-label">Fuera de línea</div>
            </div>
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
            <button type="button" className={`bdc-modo-btn ${instalacion === "enLinea" ? "bdc-modo-activo" : ""}`}
              onClick={() => { setInstalacion("enLinea"); setSelManualCLId(null); setSelManualCLCant(1); }}>
              {instalacion === "enLinea" && <IconoCheck />}<span>En línea</span>
            </button>
            <button type="button" className={`bdc-modo-btn ${instalacion === "fueraLinea" ? "bdc-modo-activo" : ""}`}
              onClick={() => { setInstalacion("fueraLinea"); setSelManualCLId(null); setSelManualCLCant(1); }}>
              {instalacion === "fueraLinea" && <IconoCheck />}<span>Fuera de línea</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bdc-modo-toggle-wrapper">
        <div className="bdc-modo-toggle">
          <button type="button" className={`bdc-modo-btn ${modoCL === "recomendado" ? "bdc-modo-activo" : ""}`} onClick={() => setModoCL("recomendado")}>
            {modoCL === "recomendado" && <IconoCheck />}<span>Recomendado</span>
          </button>
          <button type="button" className={`bdc-modo-btn ${modoCL === "manual" ? "bdc-modo-activo" : ""}`} onClick={() => setModoCL("manual")}>
            {modoCL === "manual" && <IconoCheck />}<span>Selección manual</span>
          </button>
        </div>
      </div>

      <div className="layout-clima-bdc-fila2" style={{ marginTop: 0 }}>
        <div className="layout-clima-bdc-celda celda-bdc-rec">
          {infoActiva ? (
            <div className={`bdc-recomendada-card bdc-inset ${modoCL === "manual" ? "bdc-card-manual-activa" : ""}`}>
              <div className="bdc-rec-header">
                <IconoCloradorAutomatico />
                <div className="bdc-rec-titulo">
                  <span className="bdc-rec-label">{modoCL === "recomendado" ? "Recomendado" : "Manual"}</span>
                  <span className="bdc-rec-modelo">{infoActiva.marca} · {infoActiva.modelo}</span>
                </div>
                <span className={`bdc-modo-badge ${modoCL === "manual" ? "badge-manual" : "badge-auto"}`}>
                  {modoCL === "manual" ? "Manual" : "Auto"}
                </span>
              </div>
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
                  <div className="bdc-demanda-fila">
                    <span className="bdc-demanda-label">Capacidad instalada</span>
                    <span className="bdc-demanda-valor bdc-ok">{infoActiva.capInstalada} {infoActiva.unidad}</span>
                  </div>
                  {rec?.kgDiaNecesario != null && (
                    <div className="bdc-demanda-fila">
                      <span className="bdc-demanda-label">Demanda necesaria</span>
                      <span className="bdc-demanda-valor">{rec.kgDiaNecesario} kg/día</span>
                    </div>
                  )}
                  <div className="bdc-demanda-fila">
                    <span className="bdc-demanda-label">Instalación</span>
                    <span className="bdc-demanda-valor">{labelInstalacion(infoActiva.instalacion)}</span>
                  </div>
                </div>
              )}
              {infoActiva.cargaTotal != null && (
                <div className="bdc-rec-hidraulica">
                  <span className="bdc-hid-label">Carga hidráulica</span>
                  <span className="bdc-hid-valor">{infoActiva.cargaTotal} ft · {infoActiva.cargaTotalPSI} PSI</span>
                </div>
              )}
            </div>
          ) : (
            <div className="bdc-recomendada-card bdc-pendiente bdc-inset">
              <div className="bdc-rec-header">
                <IconoCloradorAutomatico />
                <div className="bdc-rec-titulo">
                  <span className="bdc-rec-label">Clorador automático</span>
                  <span className="bdc-rec-modelo bdc-pendiente-txt">
                    {modoCL === "recomendado" ? "Completa las dimensiones" : "Selecciona un equipo"}
                  </span>
                </div>
              </div>
            </div>
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
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Modo cálculo</span><span className="bdc-auto-val" style={{ textTransform: "capitalize" }}>{rec.modoCloro}</span></div>
                {rec.kgDiaNecesario != null && (<>
                  <div className="bdc-auto-fila"><span className="bdc-auto-label">Demanda necesaria</span><span className="bdc-auto-val">{rec.kgDiaNecesario} kg/día</span></div>
                  <div className="bdc-auto-fila"><span className="bdc-auto-label">Capacidad instalada</span><span className="bdc-auto-val">{rec.kgDiaInstalado} kg/día</span></div>
                  <div className="bdc-auto-fila"><span className="bdc-auto-label">Factor Ft</span><span className="bdc-auto-val">{rec.ft}</span></div>
                  <div className="bdc-auto-fila"><span className="bdc-auto-label">Temp. referencia</span><span className="bdc-auto-val">{rec.temp} °C</span></div>
                </>)}
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
          {modoCL === "manual" && (
            <div className="bdc-selector-manual bdc-inset">
              <div className="bdc-manual-header"><span className="bdc-manual-titulo">Catálogo — {labelInstalacion(instalacion)}</span></div>
              <div className="bdc-manual-filtros">
                <div className="campo">
                  <label>Marca</label>
                  <select value={filtroMarca} onChange={e => setFiltroMarca(e.target.value)}>
                    {marcasDisponibles.map(m => <option key={m} value={m}>{m === "todas" ? "Todas las marcas" : m}</option>)}
                  </select>
                </div>
              </div>
              <div className="bdc-manual-lista">
                {catalogoFiltrado.map(c => {
                  const esRec = rec && c.marca === rec.seleccion.marca && c.modelo === rec.seleccion.modelo;
                  const sel   = selManualCLId === c.id;
                  return (
                    <div key={c.id} className={`bdc-manual-fila ${sel ? "bdc-manual-fila-activa" : ""}`}
                      onClick={() => { setSelManualCLId(sel ? null : c.id); setSelManualCLCant(1); }}>
                      <div className="bdc-manual-fila-info">
                        <span className="bdc-manual-marca">{c.marca}</span>
                        <span className="bdc-manual-modelo">{c.modelo}</span>
                        <span className="bdc-manual-vel vel-1v">{c.specs.flujo} GPM</span>
                        {esRec && <span className="bdc-manual-badge-rec">★ Rec.</span>}
                      </div>
                      <div className="bdc-manual-fila-cap">{c.specs.capacidadComercial} kg/día</div>
                    </div>
                  );
                })}
                {catalogoFiltrado.length === 0 && <div className="bdc-manual-vacio">Sin modelos para estos filtros</div>}
              </div>
              {selManualCLId && (
                <div className="bdc-manual-resultado">
                  <div className="bdc-manual-cant-row">
                    <span className="bdc-manual-cant-label">Cantidad de equipos</span>
                    <div className="bdc-manual-cant-ctrl">
                      <button onClick={() => setSelManualCLCant(c => Math.max(1, c - 1))}>−</button>
                      <span>{selManualCLCant}</span>
                      <button onClick={() => setSelManualCLCant(c => c + 1)}>+</button>
                    </div>
                  </div>
                  {cloradorManual && (<>
                    <div className="bdc-demanda-fila"><span className="bdc-demanda-label">Flujo total</span><span className="bdc-demanda-valor">{parseFloat(cloradorManual.flujoTotal).toFixed(1)} GPM</span></div>
                    <div className="bdc-demanda-fila"><span className="bdc-demanda-label">Capacidad instalada</span><span className="bdc-demanda-valor bdc-ok">{parseFloat((cloradorManual.cantidad * cloradorManual.equipo.specs.capacidadComercial).toFixed(3))} kg/día</span></div>
                    {cloradorManual.hidraulica && (
                      <div className="bdc-manual-hidraulica-detalle">
                        <div className="bdc-auto-sep" style={{ margin: "0.5rem 0" }} />
                        <div className="bdc-hid-detalle-titulo">Carga hidráulica</div>
                        <div className="bdc-auto-fila"><span className="bdc-auto-label">Carga tramos</span><span className="bdc-auto-val">{cloradorManual.hidraulica.cargaTramos} ft</span></div>
                        <div className="bdc-auto-fila"><span className="bdc-auto-label">Carga fija</span><span className="bdc-auto-val">{cloradorManual.hidraulica.cargaFija_ft} ft</span></div>
                        <div className="bdc-auto-sep" style={{ margin: "0.5rem 0" }} />
                        <div className="bdc-auto-fila bdc-auto-total">
                          <span className="bdc-auto-label">Carga total</span>
                          <span className="bdc-auto-val bdc-hid-val-highlight">{cloradorManual.hidraulica.cargaTotal} ft · {cloradorManual.hidraulica.cargaTotalPSI} PSI</span>
                        </div>
                      </div>
                    )}
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
===================================================== */
function BloqueLamparaUV({ flujoMaxSistema }) {
  const [modoUV,          setModoUV]          = useState("recomendado");
  const [selManualUVId,   setSelManualUVId]   = useState(null);
  const [selManualUVCant, setSelManualUVCant] = useState(1);

  /* ── Recomendado ── */
  const rec = useMemo(() => {
    if (!flujoMaxSistema || flujoMaxSistema <= 0) return null;
    try {
      const r = generadorUV(flujoMaxSistema);
      return r?.error ? null : r;
    } catch { return null; }
  }, [flujoMaxSistema]);

  /* ── Manual ── */
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

  /* ── Info activa ── */
  const infoActiva = useMemo(() => {
    if (modoUV === "manual" && uvManual) {
      return {
        marca: uvManual.equipo.marca, modelo: uvManual.equipo.modelo,
        cantidad: uvManual.cantidad, flujoTotal: uvManual.flujoTotal,
        cargaTotal: uvManual.hidraulica?.cargaTotal,
        cargaTotalPSI: uvManual.hidraulica?.cargaTotalPSI,
      };
    }
    if (rec) {
      return {
        marca: rec.seleccion.marca, modelo: rec.seleccion.modelo,
        cantidad: rec.seleccion.cantidad, flujoTotal: rec.seleccion.flujoTotal,
        cargaTotal: rec.cargaTotal, cargaTotalPSI: rec.cargaTotalPSI,
      };
    }
    return null;
  }, [modoUV, uvManual, rec]);

  if (!flujoMaxSistema || flujoMaxSistema <= 0) {
    return (
      <div className="sanitizacion-pendiente">
        Completa las dimensiones para calcular el flujo máximo del sistema
      </div>
    );
  }

  return (
    <div className="sanitizacion-bloque-equipo">
      <div className="bdc-modo-toggle-wrapper">
        <div className="bdc-modo-toggle">
          <button type="button" className={`bdc-modo-btn ${modoUV === "recomendado" ? "bdc-modo-activo" : ""}`} onClick={() => setModoUV("recomendado")}>
            {modoUV === "recomendado" && <IconoCheck />}<span>Recomendado</span>
          </button>
          <button type="button" className={`bdc-modo-btn ${modoUV === "manual" ? "bdc-modo-activo" : ""}`} onClick={() => setModoUV("manual")}>
            {modoUV === "manual" && <IconoCheck />}<span>Selección manual</span>
          </button>
        </div>
      </div>

      {/* Flujo de referencia */}
      <div style={{ fontSize: "0.7rem", color: "#94a3b8", padding: "0.25rem 0.5rem 0.5rem" }}>
        Flujo máximo del sistema: <span style={{ color: "#34d399", fontWeight: 600 }}>{parseFloat(flujoMaxSistema).toFixed(1)} GPM</span>
      </div>

      <div className="layout-clima-bdc-fila2" style={{ marginTop: 0 }}>
        <div className="layout-clima-bdc-celda celda-bdc-rec">
          {infoActiva ? (
            <div className={`bdc-recomendada-card bdc-inset ${modoUV === "manual" ? "bdc-card-manual-activa" : ""}`}>
              <div className="bdc-rec-header">
                <IconoLamparaUV />
                <div className="bdc-rec-titulo">
                  <span className="bdc-rec-label">{modoUV === "recomendado" ? "Recomendado" : "Manual"}</span>
                  <span className="bdc-rec-modelo">{infoActiva.marca} · {infoActiva.modelo}</span>
                </div>
                <span className={`bdc-modo-badge ${modoUV === "manual" ? "badge-manual" : "badge-auto"}`}>
                  {modoUV === "manual" ? "Manual" : "Auto"}
                </span>
              </div>
              <div className="bdc-rec-stats">
                <div className="bdc-stat"><span className="bdc-stat-valor">{infoActiva.cantidad}</span><span className="bdc-stat-label">equipos</span></div>
                <div className="bdc-stat-sep" />
                <div className="bdc-stat"><span className="bdc-stat-valor">{parseFloat(infoActiva.flujoTotal).toFixed(1)}</span><span className="bdc-stat-label">GPM total</span></div>
                <div className="bdc-stat-sep" />
                <div className="bdc-stat"><span className="bdc-stat-valor">{infoActiva.cargaTotal}</span><span className="bdc-stat-label">ft CDT</span></div>
                <div className="bdc-stat-sep" />
                <div className="bdc-stat"><span className="bdc-stat-valor">{infoActiva.cargaTotalPSI}</span><span className="bdc-stat-label">PSI</span></div>
              </div>
              {rec && (
                <div className="bdc-rec-demanda">
                  <div className="bdc-demanda-fila">
                    <span className="bdc-demanda-label">Flujo sistema</span>
                    <span className="bdc-demanda-valor">{parseFloat(flujoMaxSistema).toFixed(1)} GPM</span>
                  </div>
                  <div className="bdc-demanda-fila">
                    <span className="bdc-demanda-label">Flujo instalado</span>
                    <span className="bdc-demanda-valor bdc-ok">{infoActiva.flujoTotal} GPM</span>
                  </div>
                  {rec.seleccion?.exceso != null && modoUV === "recomendado" && (
                    <div className="bdc-demanda-fila">
                      <span className="bdc-demanda-label">Exceso</span>
                      <span className="bdc-demanda-valor bdc-exceso">+{parseFloat(rec.seleccion.exceso).toFixed(1)} GPM</span>
                    </div>
                  )}
                </div>
              )}
              {infoActiva.cargaTotal != null && (
                <div className="bdc-rec-hidraulica">
                  <span className="bdc-hid-label">Carga hidráulica</span>
                  <span className="bdc-hid-valor">{infoActiva.cargaTotal} ft · {infoActiva.cargaTotalPSI} PSI</span>
                </div>
              )}
            </div>
          ) : (
            <div className="bdc-recomendada-card bdc-pendiente bdc-inset">
              <div className="bdc-rec-header">
                <IconoLamparaUV />
                <div className="bdc-rec-titulo">
                  <span className="bdc-rec-label">Lámpara UV</span>
                  <span className="bdc-rec-modelo bdc-pendiente-txt">
                    {modoUV === "recomendado" ? "Calculando..." : "Selecciona un equipo"}
                  </span>
                </div>
              </div>
            </div>
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
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Flujo sistema</span><span className="bdc-auto-val">{rec.seleccion.flujoMaxSistema} GPM</span></div>
                <div className="bdc-auto-fila"><span className="bdc-auto-label">Exceso flujo</span><span className="bdc-auto-val">{rec.seleccion.exceso} GPM</span></div>
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

          {modoUV === "manual" && (
            <div className="bdc-selector-manual bdc-inset">
              <div className="bdc-manual-header"><span className="bdc-manual-titulo">Catálogo de lámparas UV</span></div>
              <div className="bdc-manual-lista">
                {generadoresUV.filter(g => g.metadata.activo).map(g => {
                  const esRec = rec && g.marca === rec.seleccion.marca && g.modelo === rec.seleccion.modelo;
                  const sel   = selManualUVId === g.id;
                  return (
                    <div key={g.id} className={`bdc-manual-fila ${sel ? "bdc-manual-fila-activa" : ""}`}
                      onClick={() => { setSelManualUVId(sel ? null : g.id); setSelManualUVCant(1); }}>
                      <div className="bdc-manual-fila-info">
                        <span className="bdc-manual-marca">{g.marca}</span>
                        <span className="bdc-manual-modelo">{g.modelo}</span>
                        {esRec && <span className="bdc-manual-badge-rec">★ Rec.</span>}
                      </div>
                      <div className="bdc-manual-fila-cap">{g.specs.flujo} GPM</div>
                    </div>
                  );
                })}
              </div>
              {selManualUVId && (
                <div className="bdc-manual-resultado">
                  <div className="bdc-manual-cant-row">
                    <span className="bdc-manual-cant-label">Cantidad de equipos</span>
                    <div className="bdc-manual-cant-ctrl">
                      <button onClick={() => setSelManualUVCant(c => Math.max(1, c - 1))}>−</button>
                      <span>{selManualUVCant}</span>
                      <button onClick={() => setSelManualUVCant(c => c + 1)}>+</button>
                    </div>
                  </div>
                  {uvManual && (<>
                    <div className="bdc-demanda-fila">
                      <span className="bdc-demanda-label">Flujo total instalado</span>
                      <span className={`bdc-demanda-valor ${uvManual.flujoTotal >= flujoMaxSistema ? "bdc-ok" : "bdc-insuf"}`}>
                        {parseFloat(uvManual.flujoTotal).toFixed(1)} GPM
                      </span>
                    </div>
                    <div className="bdc-demanda-fila">
                      <span className="bdc-demanda-label">Flujo sistema</span>
                      <span className="bdc-demanda-valor">{parseFloat(flujoMaxSistema).toFixed(1)} GPM</span>
                    </div>
                    {uvManual.flujoTotal < flujoMaxSistema && (
                      <div className="bdc-manual-aviso">⚠ Flujo insuficiente — agrega más equipos</div>
                    )}
                    {uvManual.hidraulica && (
                      <div className="bdc-manual-hidraulica-detalle">
                        <div className="bdc-auto-sep" style={{ margin: "0.5rem 0" }} />
                        <div className="bdc-hid-detalle-titulo">Carga hidráulica</div>
                        <div className="bdc-auto-fila"><span className="bdc-auto-label">Carga tramos</span><span className="bdc-auto-val">{uvManual.hidraulica.cargaTramos} ft</span></div>
                        <div className="bdc-auto-fila"><span className="bdc-auto-label">Carga fija</span><span className="bdc-auto-val">{uvManual.hidraulica.cargaFija_ft} ft</span></div>
                        <div className="bdc-auto-sep" style={{ margin: "0.5rem 0" }} />
                        <div className="bdc-auto-fila bdc-auto-total">
                          <span className="bdc-auto-label">Carga total</span>
                          <span className="bdc-auto-val bdc-hid-val-highlight">{uvManual.hidraulica.cargaTotal} ft · {uvManual.hidraulica.cargaTotalPSI} PSI</span>
                        </div>
                      </div>
                    )}
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
   EQUIPAMIENTO
===================================================== */
export default function Equipamiento({
  setSeccion, sistemaActivo, datosPorSistema,
  setDatosPorSistema, configBombas, resultadoClorador,
  flujoMaxGlobal,
}) {
  const [hoveredField, setHoveredField] = useState(null);
  const [sistemasSeleccionadosSanit, setSistemasSeleccionadosSanit] = useState({});

  const toggleSanitizacion = (key) => {
    setSistemasSeleccionadosSanit(prev => {
      if (prev[key]) { const next = { ...prev }; delete next[key]; return next; }
      return { ...prev, [key]: true };
    });
  };

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

  const descripcionesCampos = {
    calentamiento: "Sistema encargado del aporte energético térmico",
    sanitizacion:  "Sistema de desinfección y control microbiológico del agua",
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

        </div>

        <div className="selector-footer fijo equipamiento">
          <span>Modo ingeniería · Equipamiento</span>
          <span className="footer-highlight">
            {hoveredField ? descripcionesCampos[hoveredField] : descripcionesCampos.default}
          </span>
        </div>

      </div>
    </div>
  );
}