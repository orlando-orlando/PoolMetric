const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function postCalc(endpoint, payload) {
  const resp = await fetch(`${API_BASE}/api/calc/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
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