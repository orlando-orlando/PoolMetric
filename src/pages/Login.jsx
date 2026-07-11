import { useState, useEffect } from "react";
import { useAuth } from "../utils/AuthContext.jsx";

export default function Login() {
  const { iniciarSesion, registrarse } = useAuth();
  const [modo, setModo] = useState("login"); // "login" | "registro"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState(null);
  const [cargando, setCargando] = useState(false);

  // Login es dueño de su propio título; al montar (tras logout o entrada directa)
  // reseteamos para no heredar "PoolMetric · <sección>" de la sesión anterior.
  useEffect(() => { document.title = "PoolMetric · Iniciar sesión"; }, []);

  const enviar = async (e) => {
    e.preventDefault();
    setMensaje(null);
    setCargando(true);

    const fn = modo === "login" ? iniciarSesion : registrarse;
    const { data, error } = await fn(email.trim(), password);

    setCargando(false);

    if (error) {
      setMensaje({ tipo: "error", texto: error.message });
      return;
    }

    if (modo === "registro") {
      // Si la confirmación de email está activada, no hay sesión inmediata
      if (!data.session) {
        setMensaje({
          tipo: "ok",
          texto: "Cuenta creada. Revisa tu correo para confirmar antes de entrar.",
        });
      }
      // Si no requiere confirmación, onAuthStateChange detecta la sesión y entra solo
    }
    // En login exitoso, el AuthContext detecta la sesión y la app cambia sola
  };

  return (
    <div style={S.fondo}>
      <div style={S.tarjeta}>
        <h1 style={S.titulo}>PoolMetric</h1>
        <p style={S.subtitulo}>
          {modo === "login" ? "Inicia sesión para continuar" : "Crea tu cuenta"}
        </p>

        <form onSubmit={enviar} style={S.form}>
          <label style={S.label}>Correo electrónico</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={S.input}
            placeholder="tu@correo.com"
          />

          <label style={S.label}>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={S.input}
            placeholder="Mínimo 6 caracteres"
          />

          <button type="submit" disabled={cargando} style={S.boton}>
            {cargando ? "Procesando..." : modo === "login" ? "Iniciar sesión" : "Crear cuenta"}
          </button>
        </form>

        {mensaje && (
          <div style={mensaje.tipo === "error" ? S.error : S.exito}>
            {mensaje.texto}
          </div>
        )}

        <button
          onClick={() => { setModo(modo === "login" ? "registro" : "login"); setMensaje(null); }}
          style={S.toggle}
        >
          {modo === "login"
            ? "¿No tienes cuenta? Crear una"
            : "¿Ya tienes cuenta? Iniciar sesión"}
        </button>
      </div>
    </div>
  );
}

const S = {
  fondo: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", fontFamily: "system-ui, sans-serif" },
  tarjeta: { background: "#1e293b", padding: "2.5rem", borderRadius: "12px", width: "100%", maxWidth: "380px", boxShadow: "0 10px 40px rgba(0,0,0,0.4)" },
  titulo: { color: "#38bdf8", fontSize: "1.8rem", fontWeight: 700, margin: 0, textAlign: "center" },
  subtitulo: { color: "#94a3b8", fontSize: "0.9rem", textAlign: "center", marginTop: "0.4rem", marginBottom: "1.5rem" },
  form: { display: "flex", flexDirection: "column", gap: "0.4rem" },
  label: { color: "#cbd5e1", fontSize: "0.8rem", marginTop: "0.6rem" },
  input: { padding: "0.7rem", borderRadius: "8px", border: "1px solid #334155", background: "#0f172a", color: "#e2e8f0", fontSize: "0.9rem" },
  boton: { marginTop: "1.2rem", padding: "0.8rem", borderRadius: "8px", border: "none", background: "#0284c7", color: "white", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer" },
  toggle: { marginTop: "1.2rem", background: "none", border: "none", color: "#38bdf8", fontSize: "0.85rem", cursor: "pointer", width: "100%", textAlign: "center" },
  error: { marginTop: "1rem", padding: "0.7rem", borderRadius: "8px", background: "rgba(239,68,68,0.15)", color: "#fca5a5", fontSize: "0.85rem", textAlign: "center" },
  exito: { marginTop: "1rem", padding: "0.7rem", borderRadius: "8px", background: "rgba(34,197,94,0.15)", color: "#86efac", fontSize: "0.85rem", textAlign: "center" },
};
