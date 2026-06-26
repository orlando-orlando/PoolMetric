import { supabase } from "./supabase.js";

// Guarda un proyecto nuevo. datos = { datosPorSistema, sistemaActivo }.
// Devuelve { data, error }. El RLS rechaza a usuarios gratis automáticamente.
export async function guardarProyecto(nombre, datos) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: { message: "No autenticado" } };

  return await supabase
    .from("proyectos")
    .insert({ user_id: user.id, nombre, datos })
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
