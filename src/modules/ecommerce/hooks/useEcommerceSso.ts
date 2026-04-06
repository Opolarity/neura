import { useState } from "react";
import { toast } from "sonner";
import { generateSSOToken } from "../services/sso.service";

const ECOMMERCE_SSO_URL = "https://overtake.com.pe/editor";
//const ECOMMERCE_SSO_URL = "http://localhost:3000/editor";

export const useEcommerceSso = () => {
  const [loadingMIN, setLoadingMIN] = useState(false);
  const [loadingMAY, setLoadingMAY] = useState(false);

  const redirectToEcommerceMIN = async () => {
    setLoadingMIN(true);
    try {
      const { token } = await generateSSOToken("MIN");
      window.open(`${ECOMMERCE_SSO_URL}?token=${token}`, "_blank");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Error al redirigir al ecommerce";
      toast.error(message);
    } finally {
      setLoadingMIN(false);
    }
  };
  const redirectToEcommerceMAY = async () => {
    setLoadingMIN(true);
    try {
      const { token } = await generateSSOToken("MAY");
      window.open(`${ECOMMERCE_SSO_URL}?token=${token}`, "_blank");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Error al redirigir al ecommerce";
      toast.error(message);
    } finally {
      setLoadingMIN(false);
    }
  };

  return { redirectToEcommerceMIN, redirectToEcommerceMAY, loadingMIN, loadingMAY };
};
