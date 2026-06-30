import { useState, useEffect } from "react";
import { Trash2, X } from "lucide-react";
import { guardarProyecto, listarProyectos, cargarProyecto, borrarProyecto } from "../utils/proyectos.js";

export default function ProyectosDrawer({
  abierto, onCerrar, esGratis,
  datosPorSistema, sistemaActivo, seccion,
  setDatosPorSistema, setSistemaActivo, setSeccion, setProyectoVersion,
}) {
  const [proyectos, setProyectos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [proyectoCargadoId, setProyectoCargadoId] = useState(null);

  // Cargar la lista cada vez que se abre el drawer
  useEffect(() => {
    if (abierto) recargarLista();
  }, [abierto]);

  // El mensaje (guardado/error) desaparece solo a los 3 segundos
  useEffect(() => {
    if (!mensaje) return;
    const t = setTimeout(() => setMensaje(null), 3000);
    return () => clearTimeout(t);
  }, [mensaje]);

  async function recargarLista() {
    setCargando(true);
    const { data, error } = await listarProyectos();
    setCargando(false);
    if (error) { setMensaje({ tipo: "error", txt: error.message }); return; }
    setProyectos(data ?? []);
  }

  async function handleGuardar() {
    const nombre = window.prompt("Nombre del proyecto:");
    if (!nombre || !nombre.trim()) return;
    const { error } = await guardarProyecto(nombre.trim(), { datosPorSistema, sistemaActivo, seccion });
    if (error) {
      setMensaje({ tipo: "error", txt: error.message });
      return;
    }
    setMensaje({ tipo: "ok", txt: "Proyecto guardado." });
    recargarLista();
  }

  async function handleCargar(id) {
    const ok = window.confirm("¿Cargar este proyecto? Se perderán los cambios no guardados.");
    if (!ok) return;
    const { data, error } = await cargarProyecto(id);
    if (error || !data) { setMensaje({ tipo: "error", txt: error?.message ?? "No se pudo cargar." }); return; }
    const d = data.datos ?? {};
    setDatosPorSistema(d.datosPorSistema ?? {});
    setSistemaActivo(d.sistemaActivo ?? null);
    setSeccion(d.seccion ?? "dimensiones");
    setProyectoCargadoId(id); // recordar cuál está cargado
    setProyectoVersion(v => v + 1); // fuerza re-montaje limpio de las secciones
    onCerrar();
  }

  async function handleBorrar(id, e) {
    e.stopPropagation();
    const ok = window.confirm("¿Borrar este proyecto? Esta acción no se puede deshacer.");
    if (!ok) return;
    const { error } = await borrarProyecto(id);
    if (error) { setMensaje({ tipo: "error", txt: error.message }); return; }
    // Resetear la app SOLO si borraste el proyecto que tenías cargado.
    if (id === proyectoCargadoId) {
      setDatosPorSistema({});
      setSistemaActivo(null);
      setSeccion("dimensiones");
      setProyectoCargadoId(null);
      setProyectoVersion(v => v + 1); // re-montaje limpio al resetear
    }
    recargarLista();
  }

  if (!abierto) return null;

  const fmtFecha = (s) => {
    try { return new Date(s).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }); }
    catch { return ""; }
  };

  return (
    <>
      <div style={S.overlay} onClick={onCerrar} />
      <div style={S.drawer}>
        <div style={S.header}>
          <h2 style={S.titulo}>Mis proyectos</h2>
          <button style={S.cerrar} onClick={onCerrar}><X size={18} /></button>
        </div>

        <button
          style={{ ...S.btnGuardar, ...(esGratis ? S.btnGuardarOff : {}) }}
          onClick={handleGuardar}
          disabled={esGratis}
          title={esGratis ? "Mejora tu plan para guardar proyectos" : ""}
        >
          {esGratis ? "Guardar (mejora tu plan)" : "+ Guardar proyecto actual"}
        </button>

        {mensaje && (
          <div style={mensaje.tipo === "error" ? S.msgError : S.msgOk}>{mensaje.txt}</div>
        )}

        <div style={S.lista}>
          {cargando && <div style={S.vacio}>Cargando…</div>}
          {!cargando && proyectos.length === 0 && (
            <div style={S.vacio}>No tienes proyectos guardados.</div>
          )}
          {!cargando && proyectos.map((p) => (
            <div key={p.id} style={S.item} onClick={() => handleCargar(p.id)}>
              <div style={S.itemInfo}>
                <span style={S.itemNombre}>{p.nombre}</span>
                <span style={S.itemFecha}>{fmtFecha(p.actualizado_en)}</span>
              </div>
              <button style={S.itemBorrar} onClick={(e) => handleBorrar(p.id, e)} title="Borrar"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

const S = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000 },
  drawer: { position: "fixed", top: 0, right: 0, height: "100vh", width: "340px", background: "#1e293b", zIndex: 1001, boxShadow: "-4px 0 24px rgba(0,0,0,0.4)", display: "flex", flexDirection: "column", padding: "1.2rem", fontFamily: "system-ui, sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" },
  titulo: { color: "#f1f5f9", fontSize: "1.2rem", fontWeight: 700, margin: 0 },
  cerrar: { background: "none", border: "none", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", padding: "0.2rem" },
  btnGuardar: { width: "100%", padding: "0.7rem", borderRadius: "8px", border: "none", background: "#0284c7", color: "white", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer" },
  btnGuardarOff: { background: "#334155", color: "#64748b", cursor: "not-allowed" },
  msgError: { marginTop: "0.8rem", padding: "0.5rem", borderRadius: "6px", background: "rgba(239,68,68,0.15)", color: "#fca5a5", fontSize: "0.8rem" },
  msgOk: { marginTop: "0.8rem", padding: "0.5rem", borderRadius: "6px", background: "rgba(34,197,94,0.15)", color: "#86efac", fontSize: "0.8rem" },
  lista: { marginTop: "1.2rem", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" },
  vacio: { color: "#64748b", fontSize: "0.85rem", textAlign: "center", marginTop: "1rem" },
  item: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.7rem", borderRadius: "8px", background: "#0f172a", border: "1px solid #334155", cursor: "pointer" },
  itemInfo: { display: "flex", flexDirection: "column", gap: "0.2rem" },
  itemNombre: { color: "#e2e8f0", fontSize: "0.9rem", fontWeight: 600 },
  itemFecha: { color: "#64748b", fontSize: "0.72rem" },
  itemBorrar: { background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center", padding: "0.3rem" },
};
