export type SupportRequestType = "ticket" | "suggestion";

export interface SupportAttachment {
  fileName: string;
  mimeType: string;
  contentBase64: string;
}

export interface SupportRequestPayload {
  title: string;
  description?: string;
  requestType: SupportRequestType;
  reporterName: string;
  attachments?: SupportAttachment[];
}

export const MAX_ATTACHMENTS = 5;
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024; // 5 MB
