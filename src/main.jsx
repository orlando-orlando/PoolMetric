import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./estilos.css";
import { AuthProvider, useAuth } from "./utils/AuthContext.jsx";
import Login from "./pages/Login.jsx";
import PlanExpirado from "./pages/PlanExpirado.jsx";
const root = document.getElementById("root");
// Guardián: decide qué mostrar según la sesión y el acceso.
function AppConAuth({ App }) {
  const { session, perfil, perfilCargado, cargando, accesoPermitido, cerrarSesion, confirmandoPago } = useAuth();
  // Si hay sesión válida pero el perfil terminó de cargar y NO existe (cuenta borrada
  // o error), es un estado inválido: cerramos sesión para mandar al login limpiamente.
  useEffect(() => {
    if (session && perfilCargado && !perfil) {
      cerrarSesion();
    }
  }, [session, perfilCargado, perfil]);
  const Cargando = (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", color: "#94a3b8", fontFamily: "system-ui, sans-serif" }}>
      Cargando...
    </div>
  );
  // Tras volver de un pago, mientras se confirma el plan nuevo con el webhook.
  if (confirmandoPago) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0f172a", color: "#e2e8f0", fontFamily: "system-ui, sans-serif", gap: "1.2rem" }}>
        <div style={{ width: "42px", height: "42px", border: "3px solid #1e293b", borderTopColor: "#0284c7", borderRadius: "50%", animation: "girarSpinner 0.8s linear infinite" }} />
        <div style={{ fontSize: "1.25rem", fontWeight: 600 }}>Confirmando tu pago…</div>
        <div style={{ fontSize: "0.9rem", color: "#94a3b8" }}>Esto toma solo unos segundos.</div>
        <style>{`@keyframes girarSpinner { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }
  if (cargando) return Cargando;
  // Sin sesión → Login.
  if (!session) return <Login />;
  // Con sesión pero el perfil todavía se está cargando → esperar (evita parpadeo).
  if (!perfilCargado) return Cargando;
  // Perfil terminó de cargar pero no existe → el useEffect ya cerró sesión; mostrar Login.
  if (!perfil) return <Login />;
  // Con sesión pero acceso vencido (gratis expirado o bloqueado) → pantalla de planes.
  if (!accesoPermitido()) return <PlanExpirado />;
  // Con sesión y acceso vigente → la app.
  return <App />;
}
if (window.location.pathname === "/correo-confirmado") {
  import("./pages/CorreoConfirmado.jsx").then((m) => {
    ReactDOM.createRoot(root).render(<m.default />);
  });
} else if (window.location.pathname === "/memoria-calculo") {
  import("./pages/MemoriaCalculo.jsx").then((m) => {
    ReactDOM.createRoot(root).render(<m.default />);
  });
} else if (window.location.pathname === "/memoria-pdf") {
  import("./pages/MemoriaPDF.jsx").then((m) => {
    ReactDOM.createRoot(root).render(<m.default />);
  });
} else {
  import("./App.jsx").then((m) => {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <AuthProvider>
          <AppConAuth App={m.default} />
        </AuthProvider>
      </React.StrictMode>
    );
  });
}