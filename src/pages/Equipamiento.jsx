import { useState, useMemo } from "react";
import "../estilos.css";
import EquipoSelect from "../components/EquipoSelect";
import { generadoresDeCloro } from "../data/generadoresDeCloro";
import { calcularCargaCloradorManual } from "../utils/generadorDeCloro";

/* =====================================================
   ICONOS SVG
===================================================== */
const IconoBombaCalor = () => (
  <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
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
  <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
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
  <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
    <rect x="10" y="10" width="20" height="26" rx="3" stroke="#7dd3fc" strokeWidth="1.5" fill="rgba(30,64,175,0.15)"/>
    <rect x="13" y="13" width="14" height="9" rx="1" stroke="#38bdf8" strokeWidth="1" fill="rgba(56,189,248,0.08)"/>
    <path d="M17 28 Q18 25 19 27 Q20 24 21 27 Q22 25 23 28" stroke="#fb923c" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <path d="M30 16 L36 16" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M30 30 L36 30" stroke="#fb923c" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IconoCalentadorElectrico = () => (
  <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
    <ellipse cx="22" cy="11" rx="10" ry="3" stroke="#7dd3fc" strokeWidth="1.5" fill="rgba(30,64,175,0.2)"/>
    <rect x="12" y="11" width="20" height="24" stroke="#7dd3fc" strokeWidth="1.5" fill="rgba(30,64,175,0.15)"/>
    <ellipse cx="22" cy="35" rx="10" ry="3" stroke="#7dd3fc" strokeWidth="1.5" fill="rgba(30,64,175,0.2)"/>
    <path d="M17 20 L17 26 Q17 28 19 28 L25 28 Q27 28 27 26 L27 20" stroke="#fb923c" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 14 L19 18 L22 18 L20 22 L25 17 L22 17 L24 14 Z" fill="#fbbf24" opacity="0.9"/>
  </svg>
);

const IconoClorador = () => (
  <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
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
        <div className="bdc-stat">
          <span className="bdc-stat-valor">{cantidad}</span>
          <span className="bdc-stat-label">equipos</span>
        </div>
        <div className="bdc-stat-sep" />
        <div className="bdc-stat">
          <span className="bdc-stat-valor">{parseFloat(flujoTotal).toFixed(1)}</span>
          <span className="bdc-stat-label">GPM total</span>
        </div>
        <div className="bdc-stat-sep" />
        <div className="bdc-stat">
          <span className="bdc-stat-valor">{cargaTotal}</span>
          <span className="bdc-stat-label">ft CDT</span>
        </div>
        <div className="bdc-stat-sep" />
        <div className="bdc-stat">
          <span className="bdc-stat-valor">{cargaTotalPSI}</span>
          <span className="bdc-stat-label">PSI</span>
        </div>
      </div>
      <div style={{ padding: "0.4rem 0.75rem 0.5rem", fontSize: "0.68rem", color: "#475569", borderTop: "1px solid rgba(71,85,105,0.3)", marginTop: "0.25rem" }}>
        Configurable en <span style={{ color: "#60a5fa" }}>Calentamiento →</span>
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
   BLOQUE GENERADOR DE CLORO — editable
===================================================== */
function BloqueGeneradorCloro({ resultadoClorador, setDatosPorSistema }) {

  const [modoCL, setModoCL]               = useState("recomendado");
  const [selManualCLId, setSelManualCLId] = useState(null);
  const [selManualCLCant, setSelManualCLCant] = useState(1);
  const [filtroMarca, setFiltroMarca]     = useState("todas");

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
      return {
        equipo,
        cantidad:    selManualCLCant,
        flujoTotal:  equipo.specs.flujo * selManualCLCant,
        hidraulica,
      };
    } catch { return null; }
  }, [selManualCLId, selManualCLCant]);

  /* ── guarda en datosPorSistema para que App.jsx pueda leerlo si hace falta ── */
  const cloradorEfectivo = modoCL === "manual" ? cloradorManual : rec;

  const fmtBTU = (v) => Math.round(v).toLocaleString("es-MX");

  /* ── info a mostrar en tarjeta resumen ── */
  const infoActiva = useMemo(() => {
    if (modoCL === "manual" && cloradorManual) {
      return {
        marca:      cloradorManual.equipo.marca,
        modelo:     cloradorManual.equipo.modelo,
        cantidad:   cloradorManual.cantidad,
        flujoTotal: cloradorManual.flujoTotal,
        cargaTotal:    cloradorManual.hidraulica?.cargaTotal,
        cargaTotalPSI: cloradorManual.hidraulica?.cargaTotalPSI,
        capInstalada:  parseFloat((cloradorManual.cantidad * cloradorManual.equipo.specs.capacidadComercial).toFixed(3)),
        unidad: "kg/día",
      };
    }
    if (rec) {
      return {
        marca:      rec.seleccion.marca,
        modelo:     rec.seleccion.modelo,
        cantidad:   rec.seleccion.cantidad,
        flujoTotal: rec.seleccion.flujoTotal,
        cargaTotal:    rec.cargaTotal,
        cargaTotalPSI: rec.cargaTotalPSI,
        capInstalada:  rec.kgDiaInstalado,
        unidad: rec.modoCloro === "comercial" ? "kg/día" : "litros",
      };
    }
    return null;
  }, [modoCL, cloradorManual, rec]);

  if (!rec) {
    return (
      <div style={{ padding: "0.75rem", fontSize: "0.75rem", color: "#475569" }}>
        Completa las dimensiones para ver la selección de generadores de cloro
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>

      {/* ── Toggle recomendado / manual ── */}
      <div className="bdc-modo-toggle-wrapper">
        <div className="bdc-modo-toggle">
          <button
            type="button"
            className={`bdc-modo-btn ${modoCL === "recomendado" ? "bdc-modo-activo" : ""}`}
            onClick={() => setModoCL("recomendado")}
          >
            {modoCL === "recomendado" && <IconoCheck />}
            <span>Recomendado</span>
          </button>
          <button
            type="button"
            className={`bdc-modo-btn ${modoCL === "manual" ? "bdc-modo-activo" : ""}`}
            onClick={() => setModoCL("manual")}
          >
            {modoCL === "manual" && <IconoCheck />}
            <span>Selección manual</span>
          </button>
        </div>
      </div>

      <div className="layout-clima-bdc-fila2" style={{ marginTop: 0 }}>

        {/* ── Tarjeta resumen ── */}
        <div className="layout-clima-bdc-celda celda-bdc-rec">
          {infoActiva ? (
            <div className={`bdc-recomendada-card bdc-inset ${modoCL === "manual" ? "bdc-card-manual-activa" : ""}`}>
              <div className="bdc-rec-header">
                <IconoClorador />
                <div className="bdc-rec-titulo">
                  <span className="bdc-rec-label">
                    {modoCL === "recomendado" ? "Recomendado" : "Selección manual"}
                  </span>
                  <span className="bdc-rec-modelo">
                    {infoActiva.marca} · {infoActiva.modelo}
                  </span>
                </div>
                <span className={`bdc-modo-badge ${modoCL === "manual" ? "badge-manual" : "badge-auto"}`}>
                  {modoCL === "manual" ? "Manual" : "Auto"}
                </span>
              </div>

              <div className="bdc-rec-stats">
                <div className="bdc-stat">
                  <span className="bdc-stat-valor">{infoActiva.cantidad}</span>
                  <span className="bdc-stat-label">equipos</span>
                </div>
                <div className="bdc-stat-sep" />
                <div className="bdc-stat">
                  <span className="bdc-stat-valor">{parseFloat(infoActiva.flujoTotal).toFixed(1)}</span>
                  <span className="bdc-stat-label">GPM total</span>
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

              {/* capacidad instalada — solo comercial o cuando hay valor */}
              {infoActiva.capInstalada != null && (
                <div className="bdc-rec-demanda">
                  <div className="bdc-demanda-fila">
                    <span className="bdc-demanda-label">Capacidad instalada</span>
                    <span className="bdc-demanda-valor bdc-ok">
                      {infoActiva.capInstalada} {infoActiva.unidad}
                    </span>
                  </div>
                  {rec.kgDiaNecesario != null && (
                    <div className="bdc-demanda-fila">
                      <span className="bdc-demanda-label">Demanda necesaria</span>
                      <span className="bdc-demanda-valor">
                        {rec.kgDiaNecesario} kg/día
                      </span>
                    </div>
                  )}
                </div>
              )}

              {infoActiva.cargaTotal != null && (
                <div className="bdc-rec-hidraulica">
                  <span className="bdc-hid-label">Carga hidráulica</span>
                  <span className="bdc-hid-valor">
                    {infoActiva.cargaTotal} ft · {infoActiva.cargaTotalPSI} PSI
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="bdc-recomendada-card bdc-pendiente bdc-inset">
              <div className="bdc-rec-header">
                <IconoClorador />
                <div className="bdc-rec-titulo">
                  <span className="bdc-rec-label">Generador de cloro</span>
                  <span className="bdc-rec-modelo bdc-pendiente-txt">
                    {modoCL === "recomendado"
                      ? "Completa las dimensiones para ver la recomendación"
                      : "Selecciona un equipo del catálogo"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Panel derecho ── */}
        <div className="layout-clima-bdc-celda celda-bdc-manual">

          {/* MODO RECOMENDADO — detalle */}
          {modoCL === "recomendado" && rec && (
            <div className="bdc-info-automatica bdc-inset">
              <div className="bdc-manual-header">
                <span className="bdc-manual-titulo">Detalle de selección automática</span>
              </div>
              <div className="bdc-auto-detalle">
                <div className="bdc-auto-fila">
                  <span className="bdc-auto-label">Marca</span>
                  <span className="bdc-auto-val">{rec.seleccion.marca}</span>
                </div>
                <div className="bdc-auto-fila">
                  <span className="bdc-auto-label">Modelo</span>
                  <span className="bdc-auto-val">{rec.seleccion.modelo}</span>
                </div>
                <div className="bdc-auto-fila">
                  <span className="bdc-auto-label">Cantidad</span>
                  <span className="bdc-auto-val">{rec.seleccion.cantidad} equipo{rec.seleccion.cantidad > 1 ? "s" : ""}</span>
                </div>
                <div className="bdc-auto-fila">
                  <span className="bdc-auto-label">Flujo por equipo</span>
                  <span className="bdc-auto-val">{rec.seleccion.flujoPorEquipo} GPM</span>
                </div>
                <div className="bdc-auto-fila">
                  <span className="bdc-auto-label">Flujo total</span>
                  <span className="bdc-auto-val">{rec.seleccion.flujoTotal} GPM</span>
                </div>
                <div className="bdc-auto-fila">
                  <span className="bdc-auto-label">Modo cálculo</span>
                  <span className="bdc-auto-val" style={{ textTransform: "capitalize" }}>{rec.modoCloro}</span>
                </div>
                {rec.kgDiaNecesario != null && (
                  <>
                    <div className="bdc-auto-fila">
                      <span className="bdc-auto-label">Demanda necesaria</span>
                      <span className="bdc-auto-val">{rec.kgDiaNecesario} kg/día</span>
                    </div>
                    <div className="bdc-auto-fila">
                      <span className="bdc-auto-label">Capacidad instalada</span>
                      <span className="bdc-auto-val">{rec.kgDiaInstalado} kg/día</span>
                    </div>
                    <div className="bdc-auto-fila">
                      <span className="bdc-auto-label">Factor Ft</span>
                      <span className="bdc-auto-val">{rec.ft}</span>
                    </div>
                    <div className="bdc-auto-fila">
                      <span className="bdc-auto-label">Temp. referencia</span>
                      <span className="bdc-auto-val">{rec.temp} °C</span>
                    </div>
                  </>
                )}
                <div className="bdc-auto-sep" />
                <div className="bdc-auto-fila">
                  <span className="bdc-auto-label">Carga tramos</span>
                  <span className="bdc-auto-val">{rec.cargaTramos} ft</span>
                </div>
                <div className="bdc-auto-fila">
                  <span className="bdc-auto-label">Carga fija</span>
                  <span className="bdc-auto-val">{rec.cargaFija_ft} ft</span>
                </div>
                <div className="bdc-auto-sep" />
                <div className="bdc-auto-fila bdc-auto-total">
                  <span className="bdc-auto-label">Carga total</span>
                  <span className="bdc-auto-val bdc-hid-val-highlight">
                    {rec.cargaTotal} ft · {rec.cargaTotalPSI} PSI
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* MODO MANUAL — catálogo */}
          {modoCL === "manual" && (
            <div className="bdc-selector-manual bdc-inset">
              <div className="bdc-manual-header">
                <span className="bdc-manual-titulo">Catálogo de generadores</span>
              </div>

              <div className="bdc-manual-filtros">
                <div className="campo">
                  <label>Marca</label>
                  <select value={filtroMarca} onChange={e => setFiltroMarca(e.target.value)}>
                    {marcasDisponibles.map(m => (
                      <option key={m} value={m}>{m === "todas" ? "Todas las marcas" : m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bdc-manual-lista">
                {catalogoFiltrado.map(g => {
                  const esRecomendado = rec && g.marca === rec.seleccion.marca && g.modelo === rec.seleccion.modelo;
                  const seleccionado  = selManualCLId === g.id;
                  return (
                    <div
                      key={g.id}
                      className={`bdc-manual-fila ${seleccionado ? "bdc-manual-fila-activa" : ""}`}
                      onClick={() => { setSelManualCLId(seleccionado ? null : g.id); setSelManualCLCant(1); }}
                    >
                      <div className="bdc-manual-fila-info">
                        <span className="bdc-manual-marca">{g.marca}</span>
                        <span className="bdc-manual-modelo">{g.modelo}</span>
                        <span className="bdc-manual-vel vel-1v">{g.specs.flujo} GPM</span>
                        {esRecomendado && <span className="bdc-manual-badge-rec">★ Rec.</span>}
                      </div>
                      <div className="bdc-manual-fila-cap">
                        {g.specs.capacidadComercial} kg/día
                      </div>
                    </div>
                  );
                })}
                {catalogoFiltrado.length === 0 && (
                  <div className="bdc-manual-vacio">Sin modelos para estos filtros</div>
                )}
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

                  {cloradorManual && (
                    <>
                      <div className="bdc-demanda-fila">
                        <span className="bdc-demanda-label">Flujo total</span>
                        <span className="bdc-demanda-valor">
                          {parseFloat(cloradorManual.flujoTotal).toFixed(1)} GPM
                        </span>
                      </div>
                      <div className="bdc-demanda-fila">
                        <span className="bdc-demanda-label">Capacidad instalada</span>
                        <span className="bdc-demanda-valor bdc-ok">
                          {parseFloat((cloradorManual.cantidad * cloradorManual.equipo.specs.capacidadComercial).toFixed(3))} kg/día
                        </span>
                      </div>
                      {cloradorManual.hidraulica && (
                        <div className="bdc-manual-hidraulica-detalle">
                          <div className="bdc-auto-sep" style={{ margin: "0.5rem 0" }} />
                          <div className="bdc-hid-detalle-titulo">Carga hidráulica calculada</div>
                          <div className="bdc-auto-fila">
                            <span className="bdc-auto-label">Carga tramos</span>
                            <span className="bdc-auto-val">{cloradorManual.hidraulica.cargaTramos} ft</span>
                          </div>
                          <div className="bdc-auto-fila">
                            <span className="bdc-auto-label">Carga fija</span>
                            <span className="bdc-auto-val">{cloradorManual.hidraulica.cargaFija_ft} ft</span>
                          </div>
                          <div className="bdc-auto-sep" style={{ margin: "0.5rem 0" }} />
                          <div className="bdc-auto-fila bdc-auto-total">
                            <span className="bdc-auto-label">Carga total</span>
                            <span className="bdc-auto-val bdc-hid-val-highlight">
                              {cloradorManual.hidraulica.cargaTotal} ft · {cloradorManual.hidraulica.cargaTotalPSI} PSI
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {!selManualCLId && (
                <div className="bdc-manual-hint">
                  Selecciona un equipo del catálogo para calcular carga y flujo
                </div>
              )}
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
export default function Equipamiento({ setSeccion, sistemaActivo, datosPorSistema, setDatosPorSistema, configBombas, resultadoClorador }) {

  const [hoveredField, setHoveredField]     = useState(null);
  const [sistemaAbierto, setSistemaAbierto] = useState(null);
  const [usaPrefiltro, setUsaPrefiltro]     = useState(false);
  const [tipoFiltro, setTipoFiltro]         = useState("");
  const [tipoCloro, setTipoCloro]           = useState("");
  const [usaUV, setUsaUV]                   = useState(false);
  const [usaOzono, setUsaOzono]             = useState(false);
  const [tipoReflector, setTipoReflector]   = useState("");

  const equiposCalentamiento = useMemo(() =>
    extraerInfoCalentamiento(datosPorSistema?.calentamiento),
  [datosPorSistema?.calentamiento]);

  const hayCalentamiento = equiposCalentamiento.length > 0;

  const descripcionesCampos = {
    filtrado:      "Sistema de protección, recirculación y limpieza hidráulica",
    calentamiento: "Sistema encargado del aporte energético térmico",
    sanitizacion:  "Sistema de desinfección y control microbiológico",
    iluminacion:   "Sistema de iluminación subacuática",
    empotrables:   "Elementos hidráulicos integrados al vaso",
    jacuzzi:       "Sistema especializado de hidromasaje",
    recubrimiento: "Acabados interiores del cuerpo de agua",
    default:       "Configuración integral del equipamiento del sistema"
  };

  const toggleSistema = (id) => setSistemaAbierto(prev => prev === id ? null : id);

  function renderSistemaCard({ id, titulo, abierto, contenido }) {
    return (
      <div className="tarjeta-tecnica sistema-card">
        <div className={`sistema-header-interno ${abierto ? "abierto" : ""}`} onClick={() => toggleSistema(id)}>
          <div className="sistema-titulo">{titulo}</div>
          <div className="sistema-boton">{abierto ? "Cerrar" : "Configurar"}</div>
        </div>
        <div className={`sistema-contenido-interno ${abierto ? "expandido" : ""}`}>
          {contenido}
        </div>
      </div>
    );
  }

  function GrupoSistema({ titulo, subtitulo, children }) {
    return (
      <div className="grupo-sistema">
        <div className="grupo-sistema-header">
          <div className="grupo-sistema-titulo">{titulo}</div>
          {subtitulo && <div className="grupo-sistema-subtitulo">{subtitulo}</div>}
        </div>
        <div className="grupo-sistema-contenido">{children}</div>
      </div>
    );
  }

  const bloquesSistema = (() => {
    if (!sistemaActivo) return [];
    switch (sistemaActivo) {
      case "alberca":               return [{ id: "cuerpo-1",           titulo: "Cuerpo 1",                          subtitulo: "Alberca · Tipo de sistema seleccionado",      tieneJacuzzi: false }];
      case "jacuzzi":               return [{ id: "jacuzzi-1",          titulo: "Jacuzzi",                           subtitulo: "1 cuerpo · Tipo de sistema seleccionado",     tieneJacuzzi: true  }];
      case "chapoteadero":          return [{ id: "chapoteadero-1",     titulo: "Chapoteadero",                      subtitulo: "1 cuerpo · Tipo de sistema seleccionado",     tieneJacuzzi: false }];
      case "espejoAgua":            return [{ id: "espejo-1",           titulo: "Espejo de agua",                    subtitulo: "1 cuerpo · Tipo de sistema seleccionado",     tieneJacuzzi: false }];
      case "albercaJacuzzi1":       return [{ id: "alberca-combinado",  titulo: "Alberca · 1 cuerpo combinado",      subtitulo: "Tipo de sistema seleccionado",                tieneJacuzzi: false }, { id: "jacuzzi-combinado",      titulo: "Jacuzzi · 1 cuerpo combinado",      subtitulo: "Tipo de sistema seleccionado", tieneJacuzzi: true  }];
      case "albercaChapo1":         return [{ id: "alberca-combinado",  titulo: "Alberca · 1 cuerpo combinado",      subtitulo: "Tipo de sistema seleccionado",                tieneJacuzzi: false }, { id: "chapoteadero-combinado", titulo: "Chapoteadero · 1 cuerpo combinado", subtitulo: "Tipo de sistema seleccionado", tieneJacuzzi: false }];
      case "albercaJacuzziJacuzzi": return [{ id: "alberca-combinado",  titulo: "Alberca · 1 cuerpo combinado",      subtitulo: "Tipo de sistema seleccionado",                tieneJacuzzi: false }, { id: "jacuzzi-combinado-1",    titulo: "Jacuzzi 1 · 1 cuerpo combinado",    subtitulo: "Tipo de sistema seleccionado", tieneJacuzzi: true  }, { id: "jacuzzi-combinado-2",    titulo: "Jacuzzi 2 · 1 cuerpo combinado",    subtitulo: "Tipo de sistema seleccionado", tieneJacuzzi: true  }];
      case "albercaChapoAsoleadero":return [{ id: "alberca-combinado",  titulo: "Alberca · 1 cuerpo combinado",      subtitulo: "Tipo de sistema seleccionado",                tieneJacuzzi: false }, { id: "chapoteadero-combinado", titulo: "Chapoteadero · 1 cuerpo combinado", subtitulo: "Tipo de sistema seleccionado", tieneJacuzzi: false }, { id: "asoleadero-combinado",   titulo: "Asoleadero · 1 cuerpo combinado",   subtitulo: "Tipo de sistema seleccionado", tieneJacuzzi: false }];
      case "albercaJacuzziChapo":   return [{ id: "alberca-combinado",  titulo: "Alberca · 1 cuerpo combinado",      subtitulo: "Tipo de sistema seleccionado",                tieneJacuzzi: false }, { id: "jacuzzi-combinado",      titulo: "Jacuzzi · 1 cuerpo combinado",      subtitulo: "Tipo de sistema seleccionado", tieneJacuzzi: true  }, { id: "chapoteadero-combinado", titulo: "Chapoteadero · 1 cuerpo combinado", subtitulo: "Tipo de sistema seleccionado", tieneJacuzzi: false }];
      case "albercaAsoleaderoAsoleadero": return [{ id: "alberca-combinado", titulo: "Alberca · 1 cuerpo combinado", subtitulo: "Tipo de sistema seleccionado",                tieneJacuzzi: false }, { id: "asoleadero-combinado-1", titulo: "Asoleadero 1 · 1 cuerpo combinado", subtitulo: "Tipo de sistema seleccionado", tieneJacuzzi: false }, { id: "asoleadero-combinado-2", titulo: "Asoleadero 2 · 1 cuerpo combinado", subtitulo: "Tipo de sistema seleccionado", tieneJacuzzi: false }];
      default: return [];
    }
  })();

  return (
    <div className="form-section hero-wrapper equipamiento">
      <div className="selector-tecnico modo-experto">

        <div className="selector-header">
          <div className="selector-titulo">Equipamiento del sistema</div>
          <div className="selector-subtitulo-tecnico">Selección técnica de equipos y empotrables</div>
        </div>

        <div className="selector-acciones">
          <button className="btn-secundario" onClick={() => setSeccion("calentamiento")}>
            ← Volver a Calentamiento
          </button>
        </div>

        <div className="selector-contenido entrada">
          <div className="selector-grupo">
            <div className="selector-subtitulo">Sistemas del proyecto</div>

            {/* ── CALENTAMIENTO solo lectura ── */}
            {hayCalentamiento && (
              <div className="grupo-sistema" style={{ marginBottom: "1.5rem" }}>
                <div className="grupo-sistema-header">
                  <div className="grupo-sistema-titulo">🔥 Calentamiento</div>
                  <div className="grupo-sistema-subtitulo">Configurado en Calentamiento · solo lectura</div>
                </div>
                <div className="grupo-sistema-contenido">
                  <div className="tarjeta-tecnica sistema-card">
                    <div className="sistema-contenido-interno expandido">
                      <div style={{ padding: "0.75rem 0.5rem 0.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {equiposCalentamiento.map((eq) => (
                          <TarjetaCalentamientoReadonly key={eq.key} icono={eq.icono} label={eq.label} modo={eq.modo} marca={eq.marca} modelo={eq.modelo} cantidad={eq.cantidad} flujoTotal={eq.flujoTotal} cargaTotal={eq.cargaTotal} cargaTotalPSI={eq.cargaTotalPSI} />
                        ))}
                      </div>
                      <div style={{ padding: "0.5rem 0.75rem 0.75rem", textAlign: "right" }}>
                        <button className="btn-secundario" style={{ fontSize: "0.72rem", padding: "0.3rem 0.8rem" }} onClick={() => setSeccion("calentamiento")}>
                          Editar en Calentamiento →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── BLOQUES POR CUERPO ── */}
            {bloquesSistema.map((bloque) => (
              <GrupoSistema key={bloque.id} titulo={bloque.titulo} subtitulo={bloque.subtitulo}>
                <div className="tarjetas-grid">

                  {/* FILTRADO */}
                  {renderSistemaCard({
                    id: `${bloque.id}-filtrado`,
                    titulo: "💧 Filtrado",
                    abierto: sistemaAbierto === `${bloque.id}-filtrado`,
                    contenido: (
                      <>
                        <div className="decision-card">
                          <div className="decision-grupo">
                            <label className="decision-label">¿Incluir prefiltro?</label>
                            <select className="input-azul" value={usaPrefiltro ? "si" : "no"} onChange={e => setUsaPrefiltro(e.target.value === "si")}>
                              <option value="no">No</option>
                              <option value="si">Sí</option>
                            </select>
                          </div>
                          <div className="decision-grupo">
                            <label className="decision-label">Tipo de filtro</label>
                            <select className="input-azul" value={tipoFiltro} onChange={e => setTipoFiltro(e.target.value)}>
                              <option value="">Seleccionar...</option>
                              <option value="arena">Filtro de arena</option>
                              <option value="cartucho">Filtro de cartucho</option>
                            </select>
                          </div>
                        </div>
                        {usaPrefiltro             && <EquipoSelect titulo="Prefiltro" />}
                        {tipoFiltro === "arena"    && <EquipoSelect titulo="Filtro de arena" />}
                        {tipoFiltro === "cartucho" && <EquipoSelect titulo="Filtro de cartucho" />}
                      </>
                    )
                  })}

                  {/* SANITIZACIÓN — con generador de cloro integrado */}
                  {renderSistemaCard({
                    id: `${bloque.id}-sanitizacion`,
                    titulo: "🧪 Sanitización",
                    abierto: sistemaAbierto === `${bloque.id}-sanitizacion`,
                    contenido: (
                      <>
                        <div className="decision-card">
                          <div className="decision-grupo">
                            <label className="decision-label">Sistema principal de cloro</label>
                            <select className="input-azul" value={tipoCloro} onChange={e => setTipoCloro(e.target.value)}>
                              <option value="">Seleccionar...</option>
                              <option value="cloro">Generador de cloro salino</option>
                              <option value="fuera-linea">Clorador automático fuera de línea</option>
                              <option value="en-linea">Clorador automático en línea</option>
                            </select>
                          </div>
                        </div>

                        {/* ── GENERADOR DE CLORO SALINO — editable ── */}
                        {tipoCloro === "cloro" && (
                          <div style={{ marginTop: "0.5rem" }}>
                            <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginBottom: "0.5rem", paddingLeft: "0.25rem" }}>
                              Generador de cloro salino
                            </div>
                            <BloqueGeneradorCloro
                              resultadoClorador={resultadoClorador}
                              setDatosPorSistema={setDatosPorSistema}
                            />
                          </div>
                        )}
                        {tipoCloro === "fuera-linea" && <EquipoSelect titulo="Clorador automático fuera de línea" />}
                        {tipoCloro === "en-linea"    && <EquipoSelect titulo="Clorador automático en línea" />}

                        <div className="decision-card" style={{ marginTop: "0.5rem" }}>
                          <div className={`decision-toggle ${usaUV ? "activo" : ""}`} onClick={() => setUsaUV(!usaUV)}>
                            <span>Generador UV</span>
                            <span className="decision-estado">{usaUV ? "Incluido" : "No incluido"}</span>
                          </div>
                          <div className={`decision-toggle ${usaOzono ? "activo" : ""}`} onClick={() => setUsaOzono(!usaOzono)}>
                            <span>Generador de ozono</span>
                            <span className="decision-estado">{usaOzono ? "Incluido" : "No incluido"}</span>
                          </div>
                        </div>
                        {usaUV    && <EquipoSelect titulo="Generador UV" />}
                        {usaOzono && <EquipoSelect titulo="Generador de ozono" />}
                      </>
                    )
                  })}

                  {/* ILUMINACIÓN */}
                  {renderSistemaCard({
                    id: `${bloque.id}-iluminacion`,
                    titulo: "💡 Iluminación",
                    abierto: sistemaAbierto === `${bloque.id}-iluminacion`,
                    contenido: (
                      <>
                        <div className="decision-card">
                          <div className="decision-grupo">
                            <label className="decision-label">Tipo de reflector</label>
                            <select className="input-azul" value={tipoReflector} onChange={e => setTipoReflector(e.target.value)}>
                              <option value="">Seleccionar...</option>
                              <option value="extraplano-led">Reflector extraplano LED</option>
                              <option value="incandescente">Reflector tradicional incandescente</option>
                              <option value="sin-nicho-led">Reflector sin nicho LED</option>
                            </select>
                          </div>
                        </div>
                        {tipoReflector === "extraplano-led" && <EquipoSelect titulo="Reflector extraplano LED" />}
                        {tipoReflector === "incandescente"  && <EquipoSelect titulo="Reflector tradicional incandescente" />}
                        {tipoReflector === "sin-nicho-led"  && <EquipoSelect titulo="Reflector sin nicho LED" />}
                        {tipoReflector && <EquipoSelect titulo="Transformador" />}
                      </>
                    )
                  })}

                  {/* EMPOTRABLES */}
                  {renderSistemaCard({
                    id: `${bloque.id}-empotrables`,
                    titulo: "🔹 Empotrables",
                    abierto: sistemaAbierto === `${bloque.id}-empotrables`,
                    contenido: (
                      <>
                        <EquipoSelect titulo="Boquilla de retorno" />
                        <EquipoSelect titulo="Desnatador" />
                        <EquipoSelect titulo="Dren de fondo" />
                        <EquipoSelect titulo="Dren de canal" />
                        <EquipoSelect titulo="Boquilla de barredora" />
                        <EquipoSelect titulo="Rejilla perimetral" />
                      </>
                    )
                  })}

                  {/* MOTOBOMBAS */}
                  {renderSistemaCard({
                    id: `${bloque.id}-motobombas`,
                    titulo: "🌀 Motobombas",
                    abierto: sistemaAbierto === `${bloque.id}-motobombas`,
                    contenido: (
                      <>
                        <EquipoSelect titulo="Motobomba de filtrado" />
                        {configBombas?.calentamiento && <EquipoSelect titulo="Motobomba de calentamiento" />}
                        {configBombas?.infinity       && <EquipoSelect titulo="Motobomba de infinity" />}
                      </>
                    )
                  })}

                  {/* JACUZZI */}
                  {bloque.tieneJacuzzi && renderSistemaCard({
                    id: `${bloque.id}-jacuzzi`,
                    titulo: "💨 Jacuzzi",
                    abierto: sistemaAbierto === `${bloque.id}-jacuzzi`,
                    contenido: (
                      <>
                        <EquipoSelect titulo="Motobomba hidrojets" />
                        <EquipoSelect titulo="Empotrables hidrojets" />
                        <EquipoSelect titulo="Empotrables salero" />
                        <EquipoSelect titulo="Soplador" />
                        <EquipoSelect titulo="Dren de fondo jacuzzi" />
                        <EquipoSelect titulo="Retorno jacuzzi" />
                        <EquipoSelect titulo="Desnatador jacuzzi" />
                        <EquipoSelect titulo="Barredora jacuzzi" />
                        <EquipoSelect titulo="Reflector jacuzzi" />
                      </>
                    )
                  })}

                  {/* RECUBRIMIENTO */}
                  {renderSistemaCard({
                    id: `${bloque.id}-recubrimiento`,
                    titulo: "🎨 Recubrimiento",
                    abierto: sistemaAbierto === `${bloque.id}-recubrimiento`,
                    contenido: (
                      <>
                        <EquipoSelect titulo="Recubrimiento m²" />
                        <EquipoSelect titulo="Adhesivo" />
                      </>
                    )
                  })}

                </div>
              </GrupoSistema>
            ))}

          </div>

          <div className="selector-footer fijo equipamiento">
            <span>Modo ingeniería · Equipamiento</span>
            <span className="footer-highlight">
              {hoveredField ? descripcionesCampos[hoveredField] : descripcionesCampos.default}
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}