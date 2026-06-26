import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "./supabase.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Carga el perfil del usuario desde la tabla profiles
  const cargarPerfil = async (userId) => {
    if (!userId) { setPerfil(null); return; }
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) {
      console.error("Error cargando perfil:", error.message);
      setPerfil(null);
    } else {
      setPerfil(data);
    }
  };

  useEffect(() => {
    // 1. Al montar, revisar sesión existente
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user) await cargarPerfil(data.session.user.id);
      setCargando(false);
    });

    // 2. Escuchar cambios de sesión
    const { data: listener } = supabase.auth.onAuthStateChange(async (_evento, nuevaSesion) => {
      setSession(nuevaSesion);
      if (nuevaSesion?.user) {
        await cargarPerfil(nuevaSesion.user.id);
      } else {
        setPerfil(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const registrarse = (email, password) =>
    supabase.auth.signUp({ email, password });

  const iniciarSesion = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  const cerrarSesion = () => supabase.auth.signOut();

  // Recargar el perfil manualmente (útil tras cambiar de plan, etc.)
  const recargarPerfil = () => cargarPerfil(session?.user?.id);

  // ¿El usuario tiene acceso a la app?
  // - fundador / pro → siempre.
  // - gratis → solo si no ha vencido (expira_en en el futuro) y no está bloqueado.
  const accesoPermitido = () => {
    if (!perfil) return false;
    if (perfil.acceso_bloqueado) return false;
    if (perfil.plan === "fundador" || perfil.plan === "pro") return true;
    if (perfil.plan === "gratis") {
      if (!perfil.expira_en) return false;
      return new Date(perfil.expira_en) > new Date(); // aún no vence
    }
    return false;
  };

  const valor = {
    session,
    usuario: session?.user ?? null,
    perfil,
    cargando,
    registrarse,
    iniciarSesion,
    cerrarSesion,
    recargarPerfil,
    accesoPermitido,
  };

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
