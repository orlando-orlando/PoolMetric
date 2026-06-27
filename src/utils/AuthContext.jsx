import { createContext, useContext, useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [perfilCargado, setPerfilCargado] = useState(false); // ¿terminó el intento de cargar perfil?
  const [cargando, setCargando] = useState(true);
  // Carga el perfil del usuario desde la tabla profiles
  const cargarPerfil = async (userId) => {
    if (!userId) { setPerfil(null); setPerfilCargado(true); return; }
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
    setPerfilCargado(true); // el intento terminó, haya o no perfil
  };
  // Rastrea el id del usuario actualmente cargado, para ignorar eventos de auth
  // que no cambian de usuario (refresh de token, sincronización entre pestañas).
  const usuarioActualRef = useRef(null);

  useEffect(() => {
    // 1. Al montar, revisar sesión existente
    supabase.auth.getSession().then(async ({ data }) => {
      const userId = data.session?.user?.id ?? null;
      usuarioActualRef.current = userId;
      setSession(data.session);
      if (userId) await cargarPerfil(userId);
      setCargando(false);

      // 1b. Si venimos de un pago exitoso, el webhook pudo tardar en actualizar el
      // plan. Recargamos el perfil con reintentos hasta ver el cambio, y limpiamos la URL.
      const params = new URLSearchParams(window.location.search);
      if (userId && params.get("pago") === "exito") {
        // Limpiar el parámetro de la URL (sin recargar la página)
        window.history.replaceState({}, "", window.location.pathname);
        // Reintentar la carga del perfil unas veces, dando tiempo al webhook
        for (let i = 0; i < 5; i++) {
          await new Promise((r) => setTimeout(r, 1500));
          await cargarPerfil(userId);
        }
      }
    });
    // 2. Escuchar cambios de sesión
    const { data: listener } = supabase.auth.onAuthStateChange(async (_evento, nuevaSesion) => {
      const nuevoUserId = nuevaSesion?.user?.id ?? null;

      // Si el usuario NO cambió (mismo id o sigue sin sesión), solo actualizamos la
      // referencia de sesión y NO recargamos el perfil. Esto evita que abrir otra
      // pestaña (que dispara un evento de auth) re-monte y resetee la app principal.
      if (nuevoUserId === usuarioActualRef.current) {
        setSession(nuevaSesion);
        return;
      }

      // El usuario SÍ cambió → login o logout real.
      usuarioActualRef.current = nuevoUserId;
      setSession(nuevaSesion);
      if (nuevoUserId) {
        setPerfilCargado(false);
        await cargarPerfil(nuevoUserId);
      } else {
        setPerfil(null);
        setPerfilCargado(false);
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
      if (perfil.fue_cliente_pago) return false; // ya fue cliente de pago: no recicla el trial gratis
      if (!perfil.expira_en) return false;
      return new Date(perfil.expira_en) > new Date(); // aún no vence
    }
    return false;
  };

  const valor = {
    session,
    usuario: session?.user ?? null,
    perfil,
    perfilCargado,
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
