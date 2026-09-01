// =============================================
// POS Sessions List Service
// =============================================

import { buildEndpoint } from "@/shared/utils/utils";
import type {
  POSSessionsListApiResponse,
  POSSessionsListFilters,
} from "../types/POSList.types";
import { invokeFunction } from "@/integrations/supabase/invokeFunction";

export const getPOSSessionsList = async (
  filters: Partial<POSSessionsListFilters> = {}
): Promise<POSSessionsListApiResponse> => {
  const endpoint = buildEndpoint("get-pos-sessions-list", filters);

  const data = await invokeFunction(endpoint, {
    method: "GET",
  });

  return (
    data ?? {
      sessions_data: {
        data: [],
        page: { p_page: 1, p_size: 20, total: 0 },
      },
    }
  );
};
