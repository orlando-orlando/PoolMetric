import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./estilos.css";
import { AuthProvider, useAuth } from "./utils/AuthContext.jsx";
import Login from "./pages/Login.jsx";
import PlanExpirado from "./pages/PlanExpirado.jsx";
const root = document.getElementById("root");
// Guardián: decide qué mostrar según la sesión y el acceso.
function AppConAuth({ App }) {
  const { session, perfil, cargando, accesoPermitido } = useAuth();
  if (cargando) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", color: "#94a3b8", fontFamily: "system-ui, sans-serif" }}>
        Cargando...
      </div>
    );
  }
  // Sin sesión → Login.
  if (!session) return <Login />;
  // Con sesión pero el perfil aún no cargó → esperar (evita parpadeo).
  if (!perfil) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", color: "#94a3b8", fontFamily: "system-ui, sans-serif" }}>
        Cargando...
      </div>
    );
  }
  // Con sesión pero acceso vencido (gratis expirado o bloqueado) → pantalla de planes.
  if (!accesoPermitido()) return <PlanExpirado />;
  // Con sesión y acceso vigente → la app.
  return <App />;
}
if (window.location.pathname === "/memoria-calculo") {
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