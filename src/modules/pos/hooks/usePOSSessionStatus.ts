import { useEffect } from "react";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { captureError } from "@/lib/rum";

// Misma convención que userProfileQueryKey (modules/auth/hooks/useUserProfile.ts).
export const posSessionStatusQueryKey = (userId?: string) =>
  ["pos-session-status", userId] as const;

// Único punto de refresco del chip de caja: lo invocan openSession/closeSession
// tras la edge function, el canal Realtime y la (re)suscripción del canal.
export function invalidatePOSSessionStatus(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: ["pos-session-status"] });
}

async function fetchPOSSessionOpen(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("pos_sessions")
    .select("id")
    .eq("user_id", userId)
    .is("closed_at", null)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export function usePOSSessionStatus() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: posSessionStatusQueryKey(userId),
    enabled: !!userId,
    queryFn: () => fetchPOSSessionOpen(userId!),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    if (!userId) return;
    const refresh = () => {
      void invalidatePOSSessionStatus(queryClient);
    };

    const channel = supabase
      .channel(`pos-session-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pos_sessions",
          filter: `user_id=eq.${userId}`,
        },
        refresh,
      )
      .subscribe((status, err) => {
        // Al (re)conectar se vuelve a consultar: cubre eventos perdidos mientras
        // el canal estuvo caído. Los fallos dejan de ser silenciosos.
        if (status === "SUBSCRIBED") {
          refresh();
          return;
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn("[pos-session] realtime", status, err);
          captureError(err ?? new Error(`pos-session realtime ${status}`));
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return { isOpen: query.data ?? false, loading: query.isPending };
}
