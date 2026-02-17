import { useState } from "react";
import { toast } from "sonner";
import { generateSSOToken } from "../services/sso.service";

const ECOMMERCE_SSO_URL = "https://ecommerce.neura.pe/editor";

export const useEcommerceSso = () => {
  const [loading, setLoading] = useState(false);

  const redirectToEcommerce = async () => {
    setLoading(true);
    try {
      const { token } = await generateSSOToken();
      window.open(`${ECOMMERCE_SSO_URL}?token=${token}`, '_blank');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error al redirigir al ecommerce";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return { redirectToEcommerce, loading };
};
