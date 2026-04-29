import React, { useEffect, useState, useCallback } from "react";
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

  const fetchPermissions = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setPermissions({ ...defaultPermissions, permissionsLoading: false });
      return;
    }
    setPermissions(prev => ({ ...prev, permissionsLoading: true }));
    const { data, error } = await supabase.rpc('sp_get_user_views');
    if (error || !data) {
      setPermissions({ views: [], functionIds: [], role: null, permissionsLoading: false });
      return;
    }
    const parsed = data as any;
    setPermissions({
      views: parsed.views ?? [],
      functionIds: (parsed.functions ?? []).map((f: any) => f.id),
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

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      fetchPermissions(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      fetchPermissions(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [fetchPermissions]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    setPermissions({ ...defaultPermissions, permissionsLoading: false });
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
