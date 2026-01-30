// =============================================
// usePOSSession Hook
// Manages POS cash session state
// =============================================

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  openPOSSession,
  closePOSSession,
  getActivePOSSession,
} from "../services/POSSession.service";
import { adaptPOSSession } from "../adapters/POS.adapter";
import type {
  POSSession,
  OpenPOSSessionRequest,
  ClosePOSSessionRequest,
} from "../types/POS.types";

export const usePOSSession = () => {
  const { toast } = useToast();
  const [session, setSession] = useState<POSSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [closing, setClosing] = useState(false);

  // Check for active session on mount
  useEffect(() => {
    checkActiveSession();
  }, []);

  const checkActiveSession = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getActivePOSSession();
      setSession(data ? adaptPOSSession(data) : null);
    } catch (error) {
      console.error("Error checking cash session:", error);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOpenSession = useCallback(
    async (request: OpenPOSSessionRequest) => {
      try {
        setOpening(true);
        const data = await openPOSSession(request);
        const adapted = adaptPOSSession(data.session);
        setSession(adapted);
        toast({
          title: "Sesion iniciada",
          description: `Caja abierta con S/ ${request.openingAmount.toFixed(2)}`,
        });
        return adapted;
      } catch (error: unknown) {
        console.error("Error opening session:", error);
        const errorMessage =
          error instanceof Error ? error.message : "No se pudo abrir la caja";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        throw error;
      } finally {
        setOpening(false);
      }
    },
    [toast]
  );

  const handleCloseSession = useCallback(
    async (request: ClosePOSSessionRequest) => {
      try {
        setClosing(true);
        const data = await closePOSSession(request);
        const result = data.session;
        setSession(null);
        toast({
          title: "Sesion cerrada",
          description: `Caja cerrada. Diferencia: S/ ${result.difference?.toFixed(2) || "0.00"}`,
        });
        return result;
      } catch (error: unknown) {
        console.error("Error closing session:", error);
        const errorMessage =
          error instanceof Error ? error.message : "No se pudo cerrar la caja";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        throw error;
      } finally {
        setClosing(false);
      }
    },
    [toast]
  );

  return {
    session,
    loading,
    opening,
    closing,
    hasActiveSession: !!session,
    checkActiveSession,
    openSession: handleOpenSession,
    closeSession: handleCloseSession,
  };
};
