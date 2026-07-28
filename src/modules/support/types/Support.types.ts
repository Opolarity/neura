export type SupportRequestType = "ticket" | "suggestion";

export interface SupportRequestPayload {
  title: string;
  description?: string;
  requestType: SupportRequestType;
  reporterName: string;
}
