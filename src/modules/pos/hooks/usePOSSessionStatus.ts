import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/modules/auth/hooks/useAuth";

export function usePOSSessionStatus() {
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    let channel: ReturnType<typeof supabase.channel>;

    const checkSession = async () => {
      const { data, error } = await supabase
        .from("pos_sessions")
        .select("id")
        .eq("user_id", user.id)
        .is("closed_at", null)
        .limit(1)
        .maybeSingle();

      if (!error) {
        setIsOpen(!!data);
      }

      setLoading(false);
    };

    checkSession();

    channel = supabase
      .channel(`pos-session-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pos_sessions",
          filter: `user_id=eq.${user.id}`,
        },
        async () => {
          await checkSession();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { isOpen, loading };
}
/*
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/modules/auth/hooks/useAuth";

export function usePOSSessionStatus() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    let channel: ReturnType<typeof supabase.channel>;

    const loadInitialState = async () => {
      const { data, error } = await supabase
        .from("pos_sessions")
        .select("id")
        .eq("user_id", user.id)
        .is("closed_at", null)
        .limit(1)
        .maybeSingle();

      if (!error) {
        setIsOpen(!!data);
      }

      setLoading(false);
    };

    loadInitialState();

    channel = supabase
      .channel(`pos-session-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pos_sessions",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const record = payload.new as any;
          if (!record) return;
          setIsOpen(record.closed_at === null);
        }
      )
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user]);

  return { isOpen, loading };
}
*/
