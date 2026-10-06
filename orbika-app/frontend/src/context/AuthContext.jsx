import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { normalizarRolPublico, rutaRecuperacion } from "./auth.helpers";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setCargando(false);
    });

    // Se actualiza solo cuando Supabase renueva o cierra la sesión.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nuevaSesion) => {
      setCargando(true);
      setSession(nuevaSesion);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setPerfil(null);
      setCargando(false);
      return;
    }
    supabase
      .from("perfiles")
      .select("*")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => setPerfil(data))
      .finally(() => setCargando(false));
  }, [session]);

  // CU-01: Registrar usuario. El rol y el nombre quedan en user_metadata;
  // el trigger manejar_nuevo_usuario() de Supabase crea la fila en "perfiles".
  async function registrarse({ nombre, correo, contrasena, rol, telefono, nombreNegocio, ubicacion }) {
    const { error } = await supabase.auth.signUp({
      email: correo,
      password: contrasena,
      options: { data: {
        nombre,
        rol: normalizarRolPublico(rol),
        telefono,
        nombre_negocio: nombreNegocio?.trim() || null,
        ubicacion: ubicacion?.trim() || null,
      } },
    });
    if (error) throw error;
  }

  // CU-02: Iniciar sesión.
  async function iniciarSesion(correo, contrasena) {
    const { error } = await supabase.auth.signInWithPassword({ email: correo, password: contrasena });
    if (error) throw error;
  }

  // CU-02: Cerrar sesión.
  async function cerrarSesion() {
    await supabase.auth.signOut();
  }

  // CU-13: Recuperar contraseña (Supabase Auth envía el correo).
  async function recuperarContrasena(correo) {
    const { error } = await supabase.auth.resetPasswordForEmail(correo, {
      redirectTo: rutaRecuperacion(),
    });
    if (error) throw error;
  }

  async function actualizarContrasena(contrasena) {
    const { error } = await supabase.auth.updateUser({ password: contrasena });
    if (error) throw error;
  }

  const value = {
    session,
    usuario: session?.user ?? null,
    perfil,
    cargando,
    registrarse,
    iniciarSesion,
    cerrarSesion,
    recuperarContrasena,
    actualizarContrasena,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
