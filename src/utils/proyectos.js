import { supabase } from "./supabase.js";

// Guarda un proyecto nuevo. datos = { datosPorSistema, sistemaActivo }.
// Devuelve { data, error }. El RLS rechaza a usuarios gratis automáticamente.
// Quita datos pesados que no necesitan persistirse: las "iteraciones" de la
// verificación (el registro paso a paso) pueden pesar cientos de MB con flujo alto
// y no se necesitan para restaurar el proyecto. El resultado final sí se conserva.
function adelgazarDatos(datos) {
  const d = structuredClone(datos);
  const vr = d?.datosPorSistema?.equipamiento?.verificacionResultado;
  if (vr && Array.isArray(vr.iteraciones)) {
    vr.iteraciones = []; // vaciar las iteraciones (se regeneran al reverificar)
  }
  return d;
}

export async function guardarProyecto(nombre, datos) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: { message: "No autenticado" } };
  const datosLigeros = adelgazarDatos(datos);
  return await supabase
    .from("proyectos")
    .insert({ user_id: user.id, nombre, datos: datosLigeros })
    .select()
    .single();
}

// Lista los proyectos del usuario (sin el campo datos, que es pesado).
// Solo trae lo necesario para mostrar la lista.
export async function listarProyectos() {
  return await supabase
    .from("proyectos")
    .select("id, nombre, creado_en, actualizado_en")
    .order("actualizado_en", { ascending: false });
}

// Carga un proyecto completo por id (incluye el campo datos).
export async function cargarProyecto(id) {
  return await supabase
    .from("proyectos")
    .select("*")
    .eq("id", id)
    .single();
}

// Actualiza un proyecto existente (sobrescribe datos y actualiza la fecha).
export async function actualizarProyecto(id, datos) {
  return await supabase
    .from("proyectos")
    .update({ datos, actualizado_en: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
}

// Borra un proyecto por id.
export async function borrarProyecto(id) {
  return await supabase
    .from("proyectos")
    .delete()
    .eq("id", id);
}
