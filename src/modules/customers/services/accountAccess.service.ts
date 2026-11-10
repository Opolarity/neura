import { invokeFunction } from "@/integrations/supabase/invokeFunction";
import type {
  AccountAccessInfo,
  AccountAccessInfoResponse,
} from "../types/accountAccess.types";

const FN = "customer-account-access";

export const getAccountAccessApi = async (accountId: number): Promise<AccountAccessInfo> => {
  const data = await invokeFunction<AccountAccessInfoResponse>(FN, {
    method: "POST",
    body: { account_id: accountId, action: "get" },
  });
  return {
    email: data.email ?? "",
    provider: data.provider ?? "email",
    canEditCredentials: data.can_edit_credentials === true,
  };
};

export const sendPasswordResetApi = async (accountId: number): Promise<void> => {
  await invokeFunction(FN, {
    method: "POST",
    body: { account_id: accountId, action: "send_reset" },
  });
};

export const changeAccountEmailApi = async (accountId: number, email: string): Promise<void> => {
  await invokeFunction(FN, {
    method: "POST",
    body: { account_id: accountId, action: "change_email", email },
  });
};
