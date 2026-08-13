import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

// El almacén y la sucursal del usuario no cambian dentro de una sesión, pero se
// consultaban en cada pantalla que los necesitaba: POS, crear venta, apertura de
// caja y las dos pantallas de devoluciones hacían cada una `auth.getUser()` —que
// es un round-trip a /auth/v1/user, no una lectura de memoria— y acto seguido su
// propio select a `profiles`. El id del usuario ya vive en el AuthProvider, así
// que aquí solo queda la consulta al perfil, una vez por sesión.
//
// El select es la unión de lo que pedía cada sitio por separado (unos
// `warehouses`, otros `branches(*)`), de modo que una sola consulta cubre a
// todos. Ojo: en este esquema la columna del usuario en `profiles` es "UID".
const PROFILE_SELECT = "*, warehouses(id, name, code), branches(*)";

export interface UserProfileWarehouse {
  id: number;
  name: string | null;
  code: string | null;
}

export interface UserProfile {
  UID: string;
  warehouse_id: number | null;
  branch_id: number | null;
  warehouses: UserProfileWarehouse | null;
  branches: Record<string, unknown> | null;
  [key: string]: unknown;
}

// PostgREST devuelve las relaciones como objeto o como array de un elemento
// según cómo infiera la cardinalidad. Los sitios que este hook reemplaza hacían
// este mismo `Array.isArray` a mano, cada uno por su cuenta; se normaliza aquí
// para que los consumidores reciban siempre un objeto.
function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export const userProfileQueryKey = (userId?: string) =>
  ["user-profile", userId] as const;

export async function fetchUserProfile(userId: string): Promise<UserProfile> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("UID", userId)
    .single();

  if (error) throw error;

  const row = data as Record<string, any>;

  return {
    ...row,
    warehouses: one<UserProfileWarehouse>(row.warehouses),
    branches: one<Record<string, unknown>>(row.branches),
  } as UserProfile;
}

/**
 * Perfil del usuario autenticado, resuelto una sola vez por sesión.
 *
 * `profile` sirve para render; `ensureProfile()` es para handlers y efectos de
 * carga: devuelve la caché si ya está y si no la resuelve una vez, sin duplicar
 * la petición.
 */
export function useUserProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const query = useQuery({
    queryKey: userProfileQueryKey(userId),
    enabled: !!userId,
    staleTime: Infinity,
    queryFn: () => fetchUserProfile(userId!),
  });

  const ensureProfile = useCallback(async (): Promise<UserProfile | null> => {
    if (!userId) return null;
    return queryClient.ensureQueryData({
      queryKey: userProfileQueryKey(userId),
      queryFn: () => fetchUserProfile(userId),
      staleTime: Infinity,
    });
  }, [queryClient, userId]);

  return {
    profile: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    ensureProfile,
  };
}
