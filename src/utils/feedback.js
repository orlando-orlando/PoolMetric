import { supabase } from "./supabase.js";

/* ────────────────────────────────────────────────────────────────
   Feedback de beta fundadores.
   - "encuesta": el formulario de satisfacción (5 preguntas).
   - "sugerencia": mensajes libres del botón permanente (features, ideas).
   Cada envío es una fila nueva (historial completo por usuario).
   El control del popup vive en profiles: feedback_enviado / feedback_pospuesto_en.
   ──────────────────────────────────────────────────────────────── */

// Envía la encuesta de satisfacción y marca el perfil como "ya respondió".
export async function enviarEncuesta({ ahorroTiempo, probabilidadUso, funcionesValoradas, mejoras, perfilProfesional }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: { message: "No autenticado" } };

  const { data, error } = await supabase
    .from("feedback")
    .insert({
      user_id: user.id,
      tipo: "encuesta",
      ahorro_tiempo: ahorroTiempo ?? null,
      probabilidad_uso: probabilidadUso ?? null,
      funciones_valoradas: funcionesValoradas ?? null,
      mejoras: mejoras ?? null,
      perfil_profesional: perfilProfesional ?? null,
    })
    .select()
    .single();

  if (error) return { data: null, error };

  // Marcar en el perfil que ya respondió → el popup no vuelve a salir.
  await supabase
    .from("profiles")
    .update({ feedback_enviado: true })
    .eq("id", user.id);

  return { data, error: null };
}

// Envía una sugerencia libre desde el botón permanente. NO marca feedback_enviado
// (el botón siempre debe seguir disponible para más ideas).
export async function enviarSugerencia(mensaje) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: { message: "No autenticado" } };
  if (!mensaje || !mensaje.trim()) return { data: null, error: { message: "Mensaje vacío" } };

  return await supabase
    .from("feedback")
    .insert({ user_id: user.id, tipo: "sugerencia", mensaje: mensaje.trim() })
    .select()
    .single();
}

// El usuario pospone el popup ("Más tarde"): guarda la fecha para no molestar 7 días.
export async function posponerFeedback() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: { message: "No autenticado" } };

  return await supabase
    .from("profiles")
    .update({ feedback_pospuesto_en: new Date().toISOString() })
    .eq("id", user.id);
}

// Decide si el popup de encuesta debe mostrarse, a partir del perfil ya cargado.
// Reglas: no mostrar si ya respondió; si lo pospuso, esperar 7 días.
const DIAS_ESPERA = 7;
export function debeMostrarPopup(perfil) {
  if (!perfil) return false;
  if (perfil.feedback_enviado) return false;
  if (perfil.feedback_pospuesto_en) {
    const pospuesto = new Date(perfil.feedback_pospuesto_en).getTime();
    const ahora = Date.now();
    const dias = (ahora - pospuesto) / (1000 * 60 * 60 * 24);
    if (dias < DIAS_ESPERA) return false;
  }
  return true;
}

// Consulta directa a Supabase (sin React context) para saber si mostrar el popup.
// Útil en la pestaña del PDF, que no está dentro del AuthProvider pero sí comparte
// la sesión de Supabase (persistida en localStorage). Devuelve true/false.
export async function debeMostrarPopupAsync() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data, error } = await supabase
    .from("profiles")
    .select("feedback_enviado, feedback_pospuesto_en")
    .eq("id", user.id)
    .single();
  if (error || !data) return false;
  return debeMostrarPopup(data);
}