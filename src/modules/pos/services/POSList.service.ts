// =============================================
// POS Sessions List Service
// =============================================

import { supabase } from "@/integrations/supabase/client";
import { buildEndpoint } from "@/shared/utils/utils";
import type {
  POSSessionsListApiResponse,
  POSSessionsListFilters,
} from "../types/POSList.types";

export const getPOSSessionsList = async (
  filters: Partial<POSSessionsListFilters> = {}
): Promise<POSSessionsListApiResponse> => {
  const endpoint = buildEndpoint("get-pos-sessions-list", filters);

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) {
    console.error("Invoke error:", error);
    throw error;
  }

  return (
    data ?? {
      sessions_data: {
        data: [],
        page: { p_page: 1, p_size: 20, total: 0 },
      },
    }
  );
};
