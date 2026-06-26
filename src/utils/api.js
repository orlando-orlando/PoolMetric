import { supabase } from "./supabase.js";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function postCalc(endpoint, payload) {
  // Obtener el token de sesión actual para autenticar la petición
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const resp = await fetch(`${API_BASE}/api/calc/${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
    // Si el backend dice que el acceso expiró, propagar un error reconocible
    if (err.codigo === "ACCESO_EXPIRADO") {
      const e = new Error(err.error || "Acceso expirado");
      e.codigo = "ACCESO_EXPIRADO";
      throw e;
    }
    throw new Error(err.error || `Error HTTP ${resp.status}`);
  }
  return resp.json();
}

export function apiEquilibrio(input) {
  return postCalc("equilibrio", input);
}
export function apiCalentamiento(input) {
  return postCalc("calentamiento", input);
}
export function apiEmpotrable(input) {
  return postCalc("empotrable", input);
}
export function apiFiltro(input) {
  return postCalc("filtro", input);
}
export function apiSanitizacion(input) {
  return postCalc("sanitizacion", input);
}
export function apiMotobomba(input) {
  return postCalc("motobomba", input);
}