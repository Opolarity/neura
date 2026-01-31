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
  const { data, error } = await supabase
    .from("business_accounts")
    .select(`
      id, 
      name, 
      business_account_type_id
    `);

  if (error) throw error;
  
  // Filter by type CHR from module BNA
  const { data: types, error: typesError } = await supabase
    .from("types")
    .select(`
      id,
      code,
      module:modules!inner(code)
    `)
    .eq("code", "CHR")
    .eq("modules.code", "BNA");

  if (typesError) throw typesError;
  
  const chrTypeIds = types?.map(t => t.id) || [];
  
  const filtered = (data || []).filter(ba => 
    chrTypeIds.includes(ba.business_account_type_id)
  );
  
  return filtered.map(ba => ({
    id: ba.id,
    name: ba.name
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
