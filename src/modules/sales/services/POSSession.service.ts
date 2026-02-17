// =============================================
// Cash Session Service
// API calls for managing POS cash sessions
// =============================================

import { supabase } from "@/integrations/supabase/client";
import type {
  OpenPOSSessionRequest,
  ClosePOSSessionRequest,
  POSSessionApiResponse,
  CashRegister,
} from "../types/POS.types";
import { statussesByModuleCode } from "@/shared/services/service";

// Get cash registers (business_accounts with type CHR from module BNA)
export const getCashRegisters = async (): Promise<CashRegister[]> => {
  // Fetch business accounts, CHR type IDs, open status, and open sessions in parallel
  const [baResult, typesResult, statusesResult] = await Promise.all([
    supabase.from("business_accounts").select("id, name, business_account_type_id, total_amount"),
    supabase.from("types").select("id, code, module:modules!inner(code)").eq("code", "CHR").eq("modules.code", "BNA"),
    statussesByModuleCode("POS"),
  ]);

  if (baResult.error) throw baResult.error;
  if (typesResult.error) throw typesResult.error;

  const openStatus = statusesResult.find(s => s.code === "OPE");
  
  // Get business_account IDs from currently open sessions
  let occupiedIds: number[] = [];
  if (openStatus) {
    const { data: openSessions, error: sessError } = await supabase
      .from("pos_sessions")
      .select("business_account")
      .eq("status_id", openStatus.id);
    
    if (!sessError && openSessions) {
      occupiedIds = openSessions.map(s => s.business_account);
    }
  }

  const chrTypeIds = typesResult.data?.map(t => t.id) || [];

  const filtered = (baResult.data || []).filter(ba =>
    chrTypeIds.includes(ba.business_account_type_id) && !occupiedIds.includes(ba.id)
  );

  return filtered.map(ba => ({
    id: ba.id,
    name: ba.name,
    totalAmount: ba.total_amount,
  }));
};

export const openPOSSession = async (
  request: OpenPOSSessionRequest
): Promise<{ success: boolean; session: POSSessionApiResponse }> => {
  const { data, error } = await supabase.functions.invoke(
    "manage-pos-session",
    {
      body: {
        action: "open",
        openingAmount: request.openingAmount,
        businessAccountId: request.businessAccountId,
        openingDifference: request.openingDifference,
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
    "manage-pos-session",
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
    "manage-pos-session",
    {
      body: { action: "get-active", openTypeId: openType?.id },
    }
  );

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data?.session || null;
};
