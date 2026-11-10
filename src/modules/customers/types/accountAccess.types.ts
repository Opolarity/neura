// Contrato de la edge function customer-account-access.

export type AccountAccessAction = "get" | "send_reset" | "change_email";

export interface AccountAccessInfoResponse {
  success: boolean;
  email: string;
  provider: string;
  can_edit_credentials: boolean;
}

export interface AccountAccessInfo {
  email: string;
  provider: string;
  canEditCredentials: boolean;
}
