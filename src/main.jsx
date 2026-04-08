import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./estilos.css";

const root = document.getElementById("root");

if (window.location.pathname === "/memoria-calculo") {
  import("./pages/MemoriaCalculo.jsx").then((m) => {
    ReactDOM.createRoot(root).render(<m.default />);
  });
} else {
  import("./App.jsx").then((m) => {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <m.default />
      </React.StrictMode>
    );
  });
}