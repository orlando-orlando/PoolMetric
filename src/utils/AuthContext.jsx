import { createContext, useContext, useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [perfilCargado, setPerfilCargado] = useState(false); // ¿terminó el intento de cargar perfil?
  const [cargando, setCargando] = useState(true);
  const [confirmandoPago, setConfirmandoPago] = useState(false); // mostrando "Confirmando tu pago..."
  // Carga el perfil del usuario desde la tabla profiles. Retorna el perfil (o null).
  const cargarPerfil = async (userId) => {
    if (!userId) { setPerfil(null); setPerfilCargado(true); return null; }
    // Un solo intento: consulta a Supabase con timeout. Sin reintento a
    // propósito: si Supabase está frío (cold-start), preferimos expulsar
    // rápido al login antes que dejar al usuario esperando/colgado. Al
    // reabrir, la sesión ya está caliente y entra instantáneo.
    const intento = async (ms) => {
      const consulta = supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout cargando perfil")), ms)
      );
      const { data, error } = await Promise.race([consulta, timeout]);
      if (error) throw new Error(error.message);
      return data;
    };
    try {
      const data = await intento(8000);
      setPerfil(data);
      setPerfilCargado(true);
      return data;
    } catch (e) {
      // Un solo intento fallido: nos rendimos y mandamos al login, sin limbo.
      console.error("Error cargando perfil:", e.message);
      setPerfil(null);
      setPerfilCargado(true);
      return null;
    }
  };
  // Rastrea el id del usuario actualmente cargado, para ignorar eventos de auth
  // que no cambian de usuario (refresh de token, sincronización entre pestañas).
  const usuarioActualRef = useRef(null);

  useEffect(() => {
    // 1. Al montar, revisar sesión existente
    supabase.auth.getSession().then(async ({ data }) => {
      try {
        const userId = data.session?.user?.id ?? null;
        usuarioActualRef.current = userId;
        setSession(data.session);
        if (userId) await cargarPerfil(userId);
      } catch (e) {
        console.error("Error al inicializar sesión:", e);
      } finally {
        // SIEMPRE salimos del estado "cargando", pase lo que pase, para que la app
        // nunca se quede en pantalla de carga colgada (ni aunque falle el perfil).
        setCargando(false);
      }
      // 1b. Si venimos de un pago exitoso, el webhook pudo tardar en actualizar el
      // plan. Mostramos "Confirmando tu pago..." mientras recargamos el perfil con
      // reintentos, hasta ver el cambio de plan. Limpiamos la URL al entrar.
      const userId = data.session?.user?.id ?? null;
      const params = new URLSearchParams(window.location.search);
      if (userId && params.get("pago") === "exito") {
        window.history.replaceState({}, "", window.location.pathname);
        setConfirmandoPago(true);
        for (let i = 0; i < 6; i++) {
          await new Promise((r) => setTimeout(r, 1500));
          const p = await cargarPerfil(userId);
          // Si el plan ya es de pago, dejamos de esperar.
          if (p && (p.plan === "fundador" || p.plan === "pro")) break;
        }
        setConfirmandoPago(false);
      }
    }).catch((e) => {
      // Si getSession() mismo falla, no dejamos la app colgada.
      console.error("Error obteniendo sesión:", e);
      setCargando(false);
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

  // Versión vigente de los términos/privacidad. Al cambiar los textos legales,
  // sube esta versión para poder distinguir qué versión aceptó cada usuario.
  const TERMINOS_VERSION = "2026-01";
  const registrarse = (email, password, aceptoTerminos = false) =>
    supabase.auth.signUp({
      email,
      password,
      options: {
        // Tras confirmar el correo, Supabase redirige aquí en vez de a la raíz.
        // La pestaña abierta desde el correo cae en /correo-confirmado (cartelito
        // "cerrá esta pestaña"), mientras la pestaña original se loguea sola.
        emailRedirectTo: "https://app.poolmetric.app/correo-confirmado",
        // Consentimiento de términos: viaja en user_metadata y el trigger
        // handle_new_user lo copia a profiles (terminos_aceptados_en / _version).
        data: {
          terminos_aceptados: aceptoTerminos ? "true" : "false",
          terminos_version: TERMINOS_VERSION,
        },
      },
    });
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
    confirmandoPago,
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
