import React, { useEffect, useState, useCallback, useRef } from "react";
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

// Permisos con type='component': acciones dentro de una vista. Se mantienen
// SEPARADOS de permissionCodes — ProtectedRoute trata cada entrada de
// permissionCodes como concesión de ruta y AppSidebar se la pasa a
// getFilterSidebar, así que mezclarlas contaminaría ambos.
// El fallback al array plano no aplica aquí: ese formato solo trae rutas.
function toCapabilityCodes(data: unknown): string[] {
  if (Array.isArray(data)) return [];

  return toCodes((data as { capabilities?: unknown })?.capabilities);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionCodes, setPermissionCodes] = useState<string[]>([]);
  const [capabilityCodes, setCapabilityCodes] = useState<string[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [appUserLoading, setAppUserLoading] = useState(true);
  const [companyShortName, setCompanyShortName] = useState("");
  const [companyShortNameLoading, setCompanyShortNameLoading] = useState(true);
  // Evita recargar permisos cuando cambia el token (tab switch) sin cambio de usuario
  const lastFetchedUserId = useRef<string | null>('__unset__');

  const fetchPermissions = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setPermissionCodes([]);
      setCapabilityCodes([]);
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
        setCapabilityCodes([]);
        return;
      }
      setPermissionCodes(toPermissionCodes(data));
      setCapabilityCodes(toCapabilityCodes(data));
    } catch (error) {
      console.error('[AuthProvider] sp_get_user_permissions lanzó:', error);
      setPermissionCodes([]);
      setCapabilityCodes([]);
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
        // Sesión de un usuario sin tipo COL (ej: cliente del ecommerce):
        // se expulsa. signOut deja los estados de carga en false, así que
        // no queda splash colgado.
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

  const signIn = async (email: string, password: string) => {
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
  };

  const signOut = async () => {
    setPermissionCodes([]);
    setCapabilityCodes([]);
    setPermissionsLoading(false);
    setAppUser(null);
    setAppUserLoading(false);
    await supabase.auth.signOut({scope: 'local'});
  };

  const refreshPermissions = useCallback(async () => {
    await fetchPermissions(user);
  }, [user, fetchPermissions]);

  const value = {
    user,
    session,
    loading,
    permissionCodes,
    capabilityCodes,
    permissionsLoading,
    appUser,
    appUserLoading,
    companyShortName,
    companyShortNameLoading,
    signIn,
    signOut,
    refreshPermissions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
