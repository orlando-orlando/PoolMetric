import { useState, useEffect } from "react";
import { useAuth } from "../utils/AuthContext.jsx";
import { iniciarCheckout } from "../utils/api.js";
import { cuposFundadorDisponibles } from "../utils/cupos.js";
export default function PlanExpirado({ comoOverlay = false, onCerrar = null }) {
  const { usuario, cerrarSesion } = useAuth();
  const [procesando, setProcesando] = useState(null);
  const [cuposLibres, setCuposLibres] = useState(null); // null = cargando/desconocido
  useEffect(() => {
    cuposFundadorDisponibles().then(setCuposLibres);
  }, []);
  const fundadorAgotado = cuposLibres === 0;
  const handleSuscribir = async (plan) => {
    setProcesando(plan);
    try {
      const url = await iniciarCheckout(plan);
      window.location.href = url; // redirige a la página de pago de Stripe
    } catch (e) {
      alert(e.message || "No se pudo iniciar el pago.");
      setProcesando(null);
    }
  };
  return (
    <div style={S.fondo}>
      <div style={S.tarjeta}>
        {comoOverlay && (
          <button onClick={onCerrar} style={S.cerrarOverlay} aria-label="Cerrar">×</button>
        )}
        <h1 style={S.titulo}>{comoOverlay ? "Mejora tu plan" : "Tu prueba terminó"}</h1>
        <p style={S.subtitulo}>
          {comoOverlay
            ? "Elige un plan para desbloquear PoolMetric sin límites."
            : "Tu periodo de prueba de 30 días llegó a su fin. Elige un plan para seguir usando PoolMetric."}
        </p>
        <div style={S.planes}>
          {/* Plan Fundador */}
          <div style={{ ...S.plan, ...(fundadorAgotado ? S.planAgotado : {}) }}>
            {fundadorAgotado && <div style={S.selloAgotado}>AGOTADO</div>}
            <div style={S.planBadge}>Cupos limitados</div>
            <h2 style={S.planNombre}>Fundador</h2>
            <div style={S.planPrecio}>$49 <span style={S.planPrecioSub}>USD/mes</span></div>
            <div style={S.planNota}>Precio congelado de por vida — nunca sube</div>
            <ul style={S.beneficios}>
              <li>Todo ilimitado</li>
              <li>Cálculos, reporte y memoria</li>
              <li>Proyectos guardados ilimitados</li>
              <li>Tu precio nunca cambia</li>
            </ul>
            <button
              style={fundadorAgotado ? S.botonAgotado : S.botonPlan}
              onClick={() => handleSuscribir("fundador")}
              disabled={procesando !== null || fundadorAgotado}
            >
              {fundadorAgotado ? "Cupos agotados" : (procesando === "fundador" ? <ProcesandoBtn /> : "Elegir Fundador")}
            </button>
          </div>
          {/* Plan Pro */}
          <div style={S.plan}>
            <h2 style={S.planNombre}>Pro</h2>
            <div style={S.planPrecio}>$89 <span style={S.planPrecioSub}>USD/mes</span></div>
            <div style={S.planNota}>&nbsp;</div>
            <ul style={S.beneficios}>
              <li>Todo ilimitado</li>
              <li>Cálculos, reporte y memoria</li>
              <li>Proyectos guardados ilimitados</li>
              <li>Soporte prioritario</li>
            </ul>
            <button style={S.botonPlanSec} onClick={() => handleSuscribir("pro")} disabled={procesando !== null}>
              {procesando === "pro" ? <ProcesandoBtn /> : "Elegir Pro"}
            </button>
          </div>
        </div>
        <div style={S.footer}>
          <span style={S.emailTxt}>{usuario?.email}</span>
          <button onClick={() => cerrarSesion()} style={S.cerrar}>Cerrar sesión</button>
        </div>
      </div>
    </div>
  );
}

const S = {
  fondo: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", fontFamily: "system-ui, sans-serif", padding: "1rem" },
  tarjeta: { background: "#1e293b", padding: "2.5rem", borderRadius: "12px", width: "100%", maxWidth: "640px", boxShadow: "0 10px 40px rgba(0,0,0,0.4)", position: "relative" },
  titulo: { color: "#f1f5f9", fontSize: "1.8rem", fontWeight: 700, margin: 0, textAlign: "center" },
  subtitulo: { color: "#94a3b8", fontSize: "0.95rem", textAlign: "center", marginTop: "0.6rem", marginBottom: "2rem", lineHeight: 1.5 },
  planes: { display: "flex", gap: "1rem", flexWrap: "wrap" },
  plan: { flex: "1 1 260px", background: "#0f172a", border: "1px solid #334155", borderRadius: "10px", padding: "1.5rem", position: "relative" },
  planBadge: { position: "absolute", top: "-10px", right: "12px", background: "#0284c7", color: "white", fontSize: "0.65rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "20px" },
  planNombre: { color: "#38bdf8", fontSize: "1.2rem", fontWeight: 700, margin: 0 },
  planPrecio: { color: "#f1f5f9", fontSize: "1.8rem", fontWeight: 700, marginTop: "0.5rem", marginBottom: "0.4rem" },
  planPrecioSub: { color: "#64748b", fontSize: "0.8rem", fontWeight: 400 },
  planNota: { color: "#38bdf8", fontSize: "0.72rem", fontWeight: 600, marginBottom: "1rem", minHeight: "1rem" },
  beneficios: { listStyle: "none", padding: 0, margin: "0 0 1.5rem 0", color: "#cbd5e1", fontSize: "0.85rem", lineHeight: 1.9 },
  botonPlan: { width: "100%", padding: "0.7rem", borderRadius: "8px", border: "none", background: "#0284c7", color: "white", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer" },
  planAgotado: { opacity: 0.55 },
  selloAgotado: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(-12deg)", background: "#dc2626", color: "white", fontSize: "1.1rem", fontWeight: 800, letterSpacing: "0.1em", padding: "0.4rem 1.2rem", borderRadius: "6px", boxShadow: "0 4px 12px rgba(0,0,0,0.4)", zIndex: 2, pointerEvents: "none" },
  botonAgotado: { width: "100%", padding: "0.7rem", borderRadius: "8px", border: "1px solid #475569", background: "#1e293b", color: "#64748b", fontSize: "0.9rem", fontWeight: 600, cursor: "not-allowed" },
  botonPlanSec: { width: "100%", padding: "0.7rem", borderRadius: "8px", border: "1px solid #334155", background: "transparent", color: "#cbd5e1", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer" },
  footer: { marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center" },
  emailTxt: { color: "#64748b", fontSize: "0.8rem" },
  cerrar: { background: "none", border: "none", color: "#38bdf8", fontSize: "0.85rem", cursor: "pointer" },
  cerrarOverlay: { position: "absolute", top: "1rem", right: "1.2rem", background: "none", border: "none", color: "#94a3b8", fontSize: "1.6rem", lineHeight: 1, cursor: "pointer", padding: 0 },
};

// Spinner + texto que se muestra en los botones de plan mientras se crea la sesión de pago.
function ProcesandoBtn() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}>
      <span style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "white", borderRadius: "50%", animation: "girarBtn 0.7s linear infinite" }} />
      Procesando…
      <style>{`@keyframes girarBtn { to { transform: rotate(360deg); } }`}</style>
    </span>
  );
}
