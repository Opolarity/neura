// =============================================
// Cash Session Service
// API calls for managing POS cash sessions
// =============================================

import { supabase } from "@/integrations/supabase/client";
import type {
  OpenPOSSessionRequest,
  ClosePOSSessionRequest,
  POSSessionApiResponse,
} from "../types/POS.types";
import { statussesByModuleCode, typesByModuleCode } from "@/shared/services/service";

export const openPOSSession = async (
  request: OpenPOSSessionRequest
): Promise<{ success: boolean; session: POSSessionApiResponse }> => {
  const { data, error } = await supabase.functions.invoke(
    "manage-cash-session",
    {
      body: {
        action: "open",
        openingAmount: request.openingAmount,
        notes: request.notes || null,
      },
    }
  );

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
};

export const closePOSSession = async (
  request: ClosePOSSessionRequest
): Promise<{ success: boolean; session: POSSessionApiResponse }> => {
  const { data, error } = await supabase.functions.invoke(
    "manage-cash-session",
    {
      body: {
        action: "close",
        sessionId: request.sessionId,
        closingAmount: request.closingAmount,
        notes: request.notes || null,
      },
    }
  );

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
};

export const getActivePOSSession = async (): Promise<POSSessionApiResponse | null> => {

  const openType = (await statussesByModuleCode('POS')).filter(t => t.code === 'OPE')[0]; 

  const { data, error } = await supabase.functions.invoke(
    "manage-cash-session",
    {
      body: { action: "get-active", openTypeId: openType?.id },
    }
  );

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data || null;
};
