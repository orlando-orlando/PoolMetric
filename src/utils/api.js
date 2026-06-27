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
// Inicia el checkout de Stripe para un plan ("fundador" | "pro").
// Devuelve la URL de pago de Stripe a la que hay que redirigir.
export async function iniciarCheckout(plan) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Debes iniciar sesión para suscribirte.");
  const resp = await fetch(`${API_BASE}/api/stripe/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ plan }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
    throw new Error(err.error || `Error HTTP ${resp.status}`);
  }
  const { url } = await resp.json();
  if (!url) throw new Error("No se recibió la URL de pago.");
  return url;
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