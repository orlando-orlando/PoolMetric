import { useEffect, useState } from "react";

// Página standalone que se muestra en la pestaña abierta desde el correo de
// confirmación. Supabase ya procesó el token en el redirect (la sesión quedó
// creada y la pestaña original se logueó sola vía onAuthStateChange). Aquí NO
// montamos la app: solo confirmamos visualmente y sugerimos cerrar la pestaña.
export default function CorreoConfirmado() {
  // Si el hash trae error (link vencido o inválido), lo mostramos distinto.
  const [hayError] = useState(() => window.location.hash.includes("error"));

  useEffect(() => {
    document.title = hayError
      ? "PoolMetric · Enlace inválido"
      : "PoolMetric · Correo confirmado";
  }, [hayError]);

  return (
    <div style={S.fondo}>
      <div style={S.tarjeta}>
        <div style={S.logo}>PoolMetric</div>
        {hayError ? (
          <>
            <div style={{ ...S.icono, background: "#7f1d1d", color: "#fecaca" }}>!</div>
            <div style={S.titulo}>El enlace no es válido</div>
            <div style={S.texto}>
              El enlace de confirmación expiró o ya fue usado. Vuelve a
              PoolMetric e intenta registrarte de nuevo para recibir uno nuevo.
            </div>
          </>
        ) : (
          <>
            <div style={S.icono}>✓</div>
            <div style={S.titulo}>Correo confirmado</div>
            <div style={S.texto}>
              Tu cuenta quedó activada. Ya iniciaste sesión en la pestaña de
              PoolMetric que tenías abierta — puedes cerrar esta pestaña y
              continuar ahí.
            </div>
          </>
        )}
        <a href="https://app.poolmetric.app" style={S.boton}>
          Ir a PoolMetric
        </a>
      </div>
    </div>
  );
}

const S = {
  fondo: {
    minHeight: "100vh", display: "flex", alignItems: "center",
    justifyContent: "center", background: "#0f172a", padding: "1.5rem",
    fontFamily: "system-ui, sans-serif",
  },
  tarjeta: {
    background: "#1a2236", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "16px", padding: "2.5rem 2rem", maxWidth: "400px",
    width: "100%", textAlign: "center",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  },
  logo: {
    fontSize: "1.6rem", fontWeight: 800, color: "#38bdf8",
    marginBottom: "1.5rem", letterSpacing: "-0.02em",
  },
  icono: {
    width: "56px", height: "56px", borderRadius: "50%",
    background: "#0d3b2e", color: "#34d399", fontSize: "1.8rem",
    fontWeight: 700, display: "flex", alignItems: "center",
    justifyContent: "center", margin: "0 auto 1.2rem",
  },
  titulo: {
    fontSize: "1.25rem", fontWeight: 700, color: "#f1f5f9",
    marginBottom: "0.6rem",
  },
  texto: {
    fontSize: "0.9rem", color: "#94a3b8", lineHeight: 1.5,
    marginBottom: "1.6rem",
  },
  boton: {
    display: "inline-block", padding: "0.7rem 1.4rem",
    background: "#0284c7", color: "#fff", borderRadius: "8px",
    fontSize: "0.9rem", fontWeight: 600, textDecoration: "none",
  },
};