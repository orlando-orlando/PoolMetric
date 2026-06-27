import { supabase } from "./supabase.js";

// Devuelve cuántos cupos de fundador quedan libres (reclamado_por = null).
export async function cuposFundadorDisponibles() {
  const { count, error } = await supabase
    .from("cupos_fundador")
    .select("id", { count: "exact", head: true })
    .is("reclamado_por", null);

  if (error) {
    console.error("Error consultando cupos:", error.message);
    return null; // null = no se pudo saber
  }
  return count ?? 0;
}
