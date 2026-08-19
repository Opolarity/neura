import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import AuthContext from "./AuthContext";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getHeaderUserData } from "@/shared/services/service";
import { getParameter } from "@/modules/settings/services/Parameters.service";
import { AppUser } from "../types";

// sp_get_user_permissions está tipado como Json: puede llegar como array plano
// de códigos, como array de objetos ({ code }) o envuelto en un objeto
// ({ isAdmin, permissions: [...] }). getFilterSidebar necesita string[] sí o sí.
// El campo se lee por nombre: buscar "el primer array del objeto" solo acertaba
// por el orden en que jsonb serializa las claves.
function toCodes(raw: unknown): string[] {
  return (Array.isArray(raw) ? raw : [])
    .map((item) => (typeof item === "string" ? item : (item as any)?.code))
    .filter((code): code is string => typeof code === "string");
}

function toPermissionCodes(data: unknown): string[] {
  const raw = Array.isArray(data)
    ? data
    : (data as { permissions?: unknown })?.permissions;

  return toCodes(raw);
}

// La RPC devuelve { isAdmin, permissions }. Se compara contra true para que
// las formas legacy (array plano, sin la clave) caigan en false: ante la duda,
// el usuario NO es admin y se evalúan sus codes uno por uno.
function toIsAdmin(data: unknown): boolean {
  return (data as { isAdmin?: unknown })?.isAdmin === true;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionCodes, setPermissionCodes] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [appUserLoading, setAppUserLoading] = useState(true);
  const [companyShortName, setCompanyShortName] = useState("");
  const [companyShortNameLoading, setCompanyShortNameLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  // Evita recargar permisos cuando cambia el token (tab switch) sin cambio de usuario
  const lastFetchedUserId = useRef<string | null>('__unset__');

  const fetchPermissions = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setPermissionCodes([]);
      setIsAdmin(false);
      setPermissionsLoading(false);
      return;
    }
    setPermissionsLoading(true);
    // El finally es obligatorio: si una excepción deja permissionsLoading en
    // true, ProtectedRoute devuelve null para siempre y las rutas protegidas
    // quedan en blanco.
    try {
      const { data, error } = await supabase.rpc('sp_get_user_permissions');
      console.log('[AuthProvider] sp_get_user_permissions →', { data, error });
      if (error || !data) {
        console.error('[AuthProvider] sp_get_user_permissions falló:', error);
        setPermissionCodes([]);
        setIsAdmin(false);
        return;
      }
      setPermissionCodes(toPermissionCodes(data));
      setIsAdmin(toIsAdmin(data));
    } catch (error) {
      console.error('[AuthProvider] sp_get_user_permissions lanzó:', error);
      setPermissionCodes([]);
      setIsAdmin(false);
    } finally {
      setPermissionsLoading(false);
    }
  }, []);

  const fetchAppUser = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setAppUser(null);
      setAppUserLoading(false);
      return;
    }
    setAppUserLoading(true);
    try {
      const profile = await getHeaderUserData(currentUser.id);
      setAppUser(profile);
    } catch (error) {
      console.error('[AuthProvider] getHeaderUserData falló:', error);
      setAppUser(null);
    } finally {
      setAppUserLoading(false);
    }
  }, []);

  // El ERP comparte Supabase Auth con el ecommerce: solo los usuarios cuyo
  // account tiene el tipo COL pueden usarlo. La RPC valida contra
  // profiles → account_types → types en el backend.
  const validateErpAccess = useCallback(async (): Promise<boolean> => {
    const { data, error } = await supabase.rpc('sp_validate_erp_access');
    if (error) {
      console.error('[AuthProvider] sp_validate_erp_access falló:', error);
      return false;
    }
    return (data as { allowed?: boolean } | null)?.allowed === true;
  }, []);

  const maybeRefetchUserData = useCallback(async (currentUser: User | null) => {
    const userId = currentUser?.id ?? null;
    if (userId === lastFetchedUserId.current) return;
    lastFetchedUserId.current = userId;
    if (currentUser) {
      const allowed = await validateErpAccess();
      if (!allowed) {
        // Sesión de un usuario sin tipo COL (ej: cliente del ecommerce): se
        // expulsa. Al poner lastFetchedUserId en null, el SIGNED_OUT posterior
        // entra aquí con userId null y sale por el early-return, así que
        // permissionsLoading y appUserLoading se quedan en true. No cuelga
        // nada: se acaba en /login, donde PublicRoute solo mira `loading`, y el
        // siguiente login válido los vuelve a resolver.
        lastFetchedUserId.current = null;
        await signOut();
        return;
      }
    }
    fetchPermissions(currentUser);
    fetchAppUser(currentUser);
  }, [fetchPermissions, fetchAppUser, validateErpAccess]);

  // No depende del usuario: se carga una sola vez, no en cada cambio de sesión.
  useEffect(() => {
    getParameter("CompanyShortName")
      .then((value) => {
        if (value) setCompanyShortName(value);
      })
      .finally(() => setCompanyShortNameLoading(false));
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // Evita re-renders si el user ID no cambió (ej: TOKEN_REFRESHED en tab switch)
      setUser(prev => {
        const next = session?.user ?? null;
        return prev?.id === next?.id ? prev : next;
      });
      setLoading(false);
      // Aquí es donde muere el splash de "Cerrando sesión...": cuando ya no hay
      // sesión, ProtectedLayout redirige al login y el splash sobra.
      if (!session) setSigningOut(false);
      maybeRefetchUserData(session?.user ?? null);
    });

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        maybeRefetchUserData(session?.user ?? null);
      })
      .catch((error) => {
        console.error('[AuthProvider] getSession falló:', error);
      })
      // Igual que arriba: si loading nunca baja, PublicRoute se queda en null
      // y el login no llega a renderizarse.
      .finally(() => setLoading(false));

    return () => subscription.unsubscribe();
  }, [maybeRefetchUserData]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error };

    const allowed = await validateErpAccess();
    if (!allowed) {
      await supabase.auth.signOut({ scope: 'local' });
      return {
        error: {
          name: 'ErpAccessDenied',
          code: 'erp_access_denied',
          message: 'El usuario no tiene acceso al ERP',
        },
      };
    }
    return { error: null };
  }, [validateErpAccess]);

  // Aquí NO se limpian permisos ni appUser: hacerlo antes del signOut dejaba un
  // render con el usuario todavía dentro pero con permissionCodes vacío y
  // permissionsLoading en false, y ProtectedRoute lo leía como "no tienes
  // acceso" (toast rojo + redirección a /) antes de que llegara el SIGNED_OUT.
  // El propio onAuthStateChange ya limpia todo vía maybeRefetchUserData(null),
  // y lo hace en el mismo lote que setUser(null), así que ProtectedLayout se va
  // al login sin que ProtectedRoute llegue a renderizarse.
  const signOut = useCallback(async () => {
    setSigningOut(true);
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.error('[AuthProvider] signOut falló:', error);
      // Sin esto el splash se quedaría pegado: el SIGNED_OUT que lo apaga no va
      // a llegar nunca.
      setSigningOut(false);
    }
  }, []);

  const refreshPermissions = useCallback(async () => {
    await fetchPermissions(user);
  }, [user, fetchPermissions]);

  // React compara el value del Provider por identidad: un objeto literal aquí
  // se recrea en cada render y re-renderiza a TODOS los consumidores del
  // contexto aunque ningún valor haya cambiado. Este provider envuelve la app
  // entera, así que cada TOKEN_REFRESHED o cambio de pestaña barría el árbol
  // completo.
  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      permissionCodes,
      isAdmin,
      permissionsLoading,
      appUser,
      appUserLoading,
      companyShortName,
      companyShortNameLoading,
      signingOut,
      signIn,
      signOut,
      refreshPermissions,
    }),
    [
      user,
      session,
      loading,
      permissionCodes,
      isAdmin,
      permissionsLoading,
      appUser,
      appUserLoading,
      companyShortName,
      companyShortNameLoading,
      signingOut,
      signIn,
      signOut,
      refreshPermissions,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
