import { useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { generateSSOToken } from "../services/sso.service";

//const ECOMMERCE_SSO_URL = "http://localhost:3000/editor";

export const useEcommerceSso = () => {
  const [loading, setLoading] = useState(false);

  const redirectToEcommerce = async (channelId: number, url: string) => {
    setLoading(true);
    try {
      const { token } = await generateSSOToken(channelId);

      window.open(`${url}editor?token=${token}`, "_blank");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Error al redirigir al ecommerce";
      toast({ title: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return { redirectToEcommerce, loading };
};