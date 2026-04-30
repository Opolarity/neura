import React, { useEffect, useState, useCallback, useRef } from "react";
import AuthContext from "./AuthContext";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { UserPermissions, defaultPermissions } from "../types";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<UserPermissions>(defaultPermissions);
  // Evita recargar permisos cuando cambia el token (tab switch) sin cambio de usuario
  const lastFetchedUserId = useRef<string | null>('__unset__');

  const fetchPermissions = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setPermissions({ views: [], functionIds: [], functionData: [], role: null, permissionsLoading: false });
      return;
    }
    setPermissions(prev => ({ ...prev, permissionsLoading: true }));
    const { data, error } = await supabase.rpc('sp_get_user_views');
    console.log('[AuthProvider] sp_get_user_views →', { data, error });
    if (error || !data) {
      console.error('[AuthProvider] SP falló:', error);
      setPermissions({ views: [], functionIds: [], functionData: [], role: null, permissionsLoading: false });
      return;
    }
    const parsed = data as any;
    const funcs = parsed.functions ?? [];
    console.log('[AuthProvider] functions recibidas:', funcs.length, funcs.slice(0, 2));
    console.log('[AuthProvider] views recibidas:', parsed.views);
    setPermissions({
      views: parsed.views ?? [],
      functionIds: funcs.map((f: any) => f.id),
      functionData: funcs,
      role: {
        roleIds: parsed.role?.role_id ?? [],
        roleNames: parsed.role?.role_name ?? [],
        isAdmin: parsed.role?.admin ?? false,
        capabilityIds: parsed.role?.capability_id ?? [],
        capabilityNames: parsed.role?.capability_name ?? [],
      },
      permissionsLoading: false,
    });
  }, []);

  const maybeRefetchPermissions = useCallback((currentUser: User | null) => {
    const userId = currentUser?.id ?? null;
    if (userId === lastFetchedUserId.current) return;
    lastFetchedUserId.current = userId;
    fetchPermissions(currentUser);
  }, [fetchPermissions]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      maybeRefetchPermissions(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      maybeRefetchPermissions(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [maybeRefetchPermissions]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    setPermissions({ views: [], functionIds: [], functionData: [], role: null, permissionsLoading: false });
    await supabase.auth.signOut();
  };

  const refreshPermissions = useCallback(async () => {
    await fetchPermissions(user);
  }, [user, fetchPermissions]);

  const value = {
    user,
    session,
    loading,
    permissions,
    signIn,
    signOut,
    refreshPermissions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
