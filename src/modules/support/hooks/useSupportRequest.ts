import { useState } from "react";
import { createSupportRequest } from "../services/Support.service";
import type { SupportRequestPayload } from "../types/Support.types";

export const useSupportRequest = () => {
  const [sending, setSending] = useState(false);

  const submit = async (payload: SupportRequestPayload) => {
    setSending(true);
    try {
      return await createSupportRequest(payload);
    } finally {
      setSending(false);
    }
  };

  return { sending, submit };
};
