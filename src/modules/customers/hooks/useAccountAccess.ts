import { useCallback, useEffect, useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { toastError } from "@/shared/utils/toastError";
import {
  changeAccountEmailApi,
  getAccountAccessApi,
  sendPasswordResetApi,
  setAccountPasswordApi,
} from "../services/accountAccess.service";
import type { AccountAccessInfo } from "../types/accountAccess.types";

type Busy = null | "load" | "reset" | "email" | "password";

/** Estado y acciones del diálogo "Acceso a la cuenta" de un cliente. */
export const useAccountAccess = (accountId: number | null) => {
  const [info, setInfo] = useState<AccountAccessInfo | null>(null);
  const [busy, setBusy] = useState<Busy>(null);

  const load = useCallback(async () => {
    if (!accountId) return;
    setBusy("load");
    try {
      setInfo(await getAccountAccessApi(accountId));
    } catch (error) {
      setInfo(null);
      toastError(error, "No se pudo cargar la cuenta del cliente");
    } finally {
      setBusy(null);
    }
  }, [accountId]);

  useEffect(() => {
    setInfo(null);
    if (accountId) load();
  }, [accountId, load]);

  const sendReset = async () => {
    if (!accountId) return false;
    setBusy("reset");
    try {
      await sendPasswordResetApi(accountId);
      toast({
        title: "Enlace enviado",
        description: `Se mandó el enlace para restablecer la contraseña a ${info?.email ?? "su correo"}.`,
        variant: "success",
      });
      return true;
    } catch (error) {
      toastError(error, "No se pudo enviar el enlace");
      return false;
    } finally {
      setBusy(null);
    }
  };

  const changeEmail = async (email: string) => {
    if (!accountId) return false;
    setBusy("email");
    try {
      await changeAccountEmailApi(accountId, email);
      setInfo((prev) => (prev ? { ...prev, email: email.trim().toLowerCase() } : prev));
      toast({ title: "Correo actualizado", variant: "success" });
      return true;
    } catch (error) {
      toastError(error, "No se pudo cambiar el correo");
      return false;
    } finally {
      setBusy(null);
    }
  };

  const setPassword = async (password: string) => {
    if (!accountId) return false;
    setBusy("password");
    try {
      await setAccountPasswordApi(accountId, password);
      toast({ title: "Contraseña actualizada", variant: "success" });
      return true;
    } catch (error) {
      toastError(error, "No se pudo cambiar la contraseña");
      return false;
    } finally {
      setBusy(null);
    }
  };

  return { info, busy, sendReset, changeEmail, setPassword };
};
