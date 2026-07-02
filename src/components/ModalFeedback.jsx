import { useState } from "react";
import { createPortal } from "react-dom";
import { enviarEncuesta, enviarSugerencia, posponerFeedback } from "../utils/feedback.js";

/* ────────────────────────────────────────────────────────────────
   ModalFeedback
   modo="encuesta"    → formulario de 5 preguntas (popup o abierto manual)
   modo="sugerencia"  → caja libre para pedir features/ideas (botón permanente)
   onCerrar()         → cierra sin más
   esPopup            → si true, muestra "Más tarde" (pospone 7 días)
   ──────────────────────────────────────────────────────────────── */

const FUNCIONES = [
  "Cálculo hidráulico",
  "Selección automática de equipos",
  "Equilibrio hidráulico",
  "Memoria de cálculo PDF",
  "Cálculo térmico",
  "Explosión de materiales",
  "Dimensionamiento desde PDF o imagen",
  "Selección automática de tuberías",
  "Otra",
];

const PERFILES = [
  "Ingeniero diseñador",
  "Constructor de piscinas",
  "Distribuidor de equipos",
  "Contratista",
  "Arquitecto",
  "Estudiante",
  "Otro",
];

const AHORROS = [
  "Menos de 1 hora",
  "Entre 1 y 2 horas",
  "Entre 2 y 4 horas",
  "Entre 4 y 8 horas",
  "Más de 8 horas",
];

export default function ModalFeedback(props) {
  return createPortal(<ModalFeedbackInner {...props} />, document.body);
}

function ModalFeedbackInner({ modo = "encuesta", onCerrar, esPopup = false }) {
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState(null);

  // Encuesta
  const [ahorro, setAhorro] = useState("");
  const [probabilidad, setProbabilidad] = useState(null);
  const [funciones, setFunciones] = useState([]);
  const [mejoras, setMejoras] = useState("");
  const [perfilProf, setPerfilProf] = useState("");

  // Sugerencia
  const [mensaje, setMensaje] = useState("");

  const toggleFuncion = (f) =>
    setFunciones((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));

  const puedeEnviarEncuesta = ahorro && probabilidad != null;

  async function handleEnviarEncuesta() {
    if (!puedeEnviarEncuesta) return;
    setEnviando(true); setError(null);
    const { error } = await enviarEncuesta({
      ahorroTiempo: ahorro,
      probabilidadUso: probabilidad,
      funcionesValoradas: funciones,
      mejoras,
      perfilProfesional: perfilProf,
    });
    setEnviando(false);
    if (error) { setError(error.message); return; }
    setEnviado(true);
  }

  async function handleEnviarSugerencia() {
    if (!mensaje.trim()) return;
    setEnviando(true); setError(null);
    const { error } = await enviarSugerencia(mensaje);
    setEnviando(false);
    if (error) { setError(error.message); return; }
    setEnviado(true);
  }

  async function handleMasTarde() {
    if (esPopup) await posponerFeedback();
    onCerrar?.();
  }

  // Pantalla de agradecimiento
  if (enviado) {
    return (
      <div style={S.fondo} onClick={onCerrar}>
        <div style={S.card} onClick={(e) => e.stopPropagation()}>
          <button onClick={onCerrar} style={S.cerrar} aria-label="Cerrar">×</button>
          <div style={S.graciasIcono}>🎉</div>
          <h2 style={S.titulo}>¡Muchas gracias por tu ayuda!</h2>
          <p style={S.sub}>
            Tu opinión nos permitirá seguir mejorando PoolMetric para toda la comunidad de
            ingenieros y diseñadores de piscinas.
          </p>
          {modo === "encuesta" && (
            <p style={S.notaBoton}>
              ¿Se te ocurre algo más adelante? Puedes usar el botón <b>“Danos tu opinión”</b> en
              tu menú cuando quieras pedir una función o dejarnos una idea.
            </p>
          )}
          <button style={S.btnPrimario} onClick={onCerrar}>Cerrar</button>
        </div>
      </div>
    );
  }

  // Modo sugerencia (botón permanente)
  if (modo === "sugerencia") {
    return (
      <div style={S.fondo} onClick={onCerrar}>
        <div style={S.card} onClick={(e) => e.stopPropagation()}>
          <button onClick={onCerrar} style={S.cerrar} aria-label="Cerrar">×</button>
          <h2 style={S.titulo}>¿Qué te gustaría mejorar?</h2>
          <p style={S.sub}>
            Cuéntanos qué función, equipo o mejora te gustaría ver en PoolMetric. Leemos todo.
          </p>
          <textarea
            style={S.textarea}
            rows={5}
            placeholder="Escribe tu idea, sugerencia o el equipo que necesitas…"
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
          />
          {error && <p style={S.error}>{error}</p>}
          <div style={S.acciones}>
            <button style={S.btnSecundario} onClick={onCerrar}>Cancelar</button>
            <button
              style={{ ...S.btnPrimario, opacity: mensaje.trim() && !enviando ? 1 : 0.5 }}
              onClick={handleEnviarSugerencia}
              disabled={!mensaje.trim() || enviando}
            >
              {enviando ? "Enviando…" : "Enviar"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Modo encuesta (popup o manual)
  return (
    <div style={S.fondo} onClick={esPopup ? undefined : onCerrar}>
      <div style={{ ...S.card, ...S.cardAncha }} onClick={(e) => e.stopPropagation()}>
        {!esPopup && <button onClick={onCerrar} style={S.cerrar} aria-label="Cerrar">×</button>}
        <h2 style={S.titulo}>Ayúdanos a mejorar PoolMetric</h2>
        <p style={S.sub}>Tu opinión nos ayuda a seguir mejorando. Solo te tomará 30 segundos.</p>

        <div style={S.scroll}>
          {/* 1. Ahorro de tiempo */}
          <div style={S.pregunta}>
            <label style={S.label}>1. ¿Cuánto tiempo te ahorró PoolMetric en este proyecto? <span style={S.oblig}>*</span></label>
            <div style={S.opcionesCol}>
              {AHORROS.map((a) => (
                <button
                  key={a}
                  style={{ ...S.opcion, ...(ahorro === a ? S.opcionActiva : {}) }}
                  onClick={() => setAhorro(a)}
                >{a}</button>
              ))}
            </div>
          </div>

          {/* 2. Probabilidad */}
          <div style={S.pregunta}>
            <label style={S.label}>2. ¿Qué tan probable es que vuelvas a usar PoolMetric? <span style={S.oblig}>*</span></label>
            <div style={S.escala}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  style={{ ...S.numero, ...(probabilidad === n ? S.numeroActivo : {}) }}
                  onClick={() => setProbabilidad(n)}
                >{n}</button>
              ))}
            </div>
          </div>

          {/* 3. Funciones (multi) */}
          <div style={S.pregunta}>
            <label style={S.label}>3. ¿Qué funciones te aportaron más valor? <span style={S.opcional}>(opcional, varias)</span></label>
            <div style={S.chips}>
              {FUNCIONES.map((f) => (
                <button
                  key={f}
                  style={{ ...S.chip, ...(funciones.includes(f) ? S.chipActivo : {}) }}
                  onClick={() => toggleFuncion(f)}
                >{f}</button>
              ))}
            </div>
          </div>

          {/* 4. Mejoras */}
          <div style={S.pregunta}>
            <label style={S.label}>4. ¿Qué mejorarías o qué te gustaría ver? <span style={S.opcional}>(opcional)</span></label>
            <textarea
              style={S.textarea}
              rows={3}
              placeholder="Cuéntanos…"
              value={mejoras}
              onChange={(e) => setMejoras(e.target.value)}
            />
          </div>

          {/* 5. Perfil */}
          <div style={S.pregunta}>
            <label style={S.label}>5. ¿Cuál describe mejor tu trabajo? <span style={S.opcional}>(opcional)</span></label>
            <div style={S.chips}>
              {PERFILES.map((p) => (
                <button
                  key={p}
                  style={{ ...S.chip, ...(perfilProf === p ? S.chipActivo : {}) }}
                  onClick={() => setPerfilProf(p)}
                >{p}</button>
              ))}
            </div>
          </div>
        </div>

        {error && <p style={S.error}>{error}</p>}
        <div style={S.acciones}>
          {esPopup && <button style={S.btnSecundario} onClick={handleMasTarde}>Más tarde</button>}
          {!esPopup && <button style={S.btnSecundario} onClick={onCerrar}>Cancelar</button>}
          <button
            style={{ ...S.btnPrimario, opacity: puedeEnviarEncuesta && !enviando ? 1 : 0.5 }}
            onClick={handleEnviarEncuesta}
            disabled={!puedeEnviarEncuesta || enviando}
          >
            {enviando ? "Enviando…" : "Enviar comentarios"}
          </button>
        </div>
      </div>
    </div>
  );
}

const S = {
  fondo: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1rem" },
  card: { position: "relative", background: "linear-gradient(135deg, rgba(15,23,42,.98), rgba(30,41,59,.98))", border: "1px solid rgba(148,163,184,.2)", borderRadius: 14, width: 460, maxWidth: "95vw", maxHeight: "92vh", padding: "1.8rem", boxShadow: "0 40px 80px rgba(0,0,0,.65)", color: "#e2e8f0", display: "flex", flexDirection: "column" },
  cardAncha: { width: 560 },
  cerrar: { position: "absolute", top: "1rem", right: "1.2rem", background: "none", border: "none", color: "#94a3b8", fontSize: "1.6rem", lineHeight: 1, cursor: "pointer", padding: 0 },
  titulo: { fontSize: "1.25rem", fontWeight: 700, margin: "0 0 .4rem", color: "#f1f5f9" },
  sub: { fontSize: ".85rem", color: "#94a3b8", margin: "0 0 1.2rem", lineHeight: 1.5 },
  scroll: { overflowY: "auto", paddingRight: ".4rem", marginBottom: "1rem" },
  pregunta: { marginBottom: "1.3rem" },
  label: { display: "block", fontSize: ".85rem", fontWeight: 600, color: "#cbd5e1", marginBottom: ".6rem", lineHeight: 1.4 },
  oblig: { color: "#f87171" },
  opcional: { color: "#64748b", fontWeight: 400, fontSize: ".78rem" },
  opcionesCol: { display: "flex", flexDirection: "column", gap: ".4rem" },
  opcion: { textAlign: "left", padding: ".55rem .8rem", borderRadius: 8, border: "1px solid rgba(148,163,184,.2)", background: "rgba(148,163,184,.06)", color: "#cbd5e1", fontSize: ".85rem", cursor: "pointer", transition: "all .15s" },
  opcionActiva: { border: "1px solid #38bdf8", background: "rgba(56,189,248,.15)", color: "#e0f2fe" },
  escala: { display: "flex", gap: ".3rem", flexWrap: "wrap" },
  numero: { width: 38, height: 38, borderRadius: 8, border: "1px solid rgba(148,163,184,.2)", background: "rgba(148,163,184,.06)", color: "#cbd5e1", fontSize: ".9rem", fontWeight: 600, cursor: "pointer", transition: "all .15s" },
  numeroActivo: { border: "1px solid #38bdf8", background: "rgba(56,189,248,.2)", color: "#e0f2fe" },
  chips: { display: "flex", flexWrap: "wrap", gap: ".4rem" },
  chip: { padding: ".45rem .7rem", borderRadius: 999, border: "1px solid rgba(148,163,184,.2)", background: "rgba(148,163,184,.06)", color: "#cbd5e1", fontSize: ".8rem", cursor: "pointer", transition: "all .15s" },
  chipActivo: { border: "1px solid #38bdf8", background: "rgba(56,189,248,.15)", color: "#e0f2fe" },
  textarea: { width: "100%", padding: ".7rem", borderRadius: 8, border: "1px solid rgba(148,163,184,.2)", background: "rgba(15,17,21,.6)", color: "#e2e8f0", fontSize: ".85rem", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" },
  acciones: { display: "flex", gap: ".7rem", justifyContent: "flex-end", marginTop: ".4rem" },
  btnPrimario: { padding: ".6rem 1.2rem", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#0ea5e9,#0284c7)", color: "#fff", fontSize: ".85rem", fontWeight: 600, cursor: "pointer" },
  btnSecundario: { padding: ".6rem 1.2rem", borderRadius: 8, border: "1px solid rgba(148,163,184,.25)", background: "transparent", color: "#94a3b8", fontSize: ".85rem", fontWeight: 500, cursor: "pointer" },
  error: { color: "#f87171", fontSize: ".8rem", margin: ".4rem 0" },
  graciasIcono: { fontSize: "3rem", textAlign: "center", marginBottom: ".5rem" },
  notaBoton: { fontSize: ".82rem", color: "#94a3b8", background: "rgba(56,189,248,.08)", border: "1px solid rgba(56,189,248,.15)", borderRadius: 8, padding: ".7rem .9rem", margin: "1rem 0", lineHeight: 1.5 },
};