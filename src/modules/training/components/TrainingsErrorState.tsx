import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TrainingErrorCode } from "../types/Training.types";

interface TrainingsErrorStateProps {
  code: TrainingErrorCode;
  message: string;
  onRetry: () => void;
  retrying: boolean;
}

/**
 * Los casos que el usuario del ERP no puede resolver solo (configuración,
 * alta del cliente en OPOLARITY) se explican y NO ofrecen reintentar: el
 * botón sugeriría que insistir sirve de algo.
 */
const ADMIN_CODES: TrainingErrorCode[] = [
  "not_configured",
  "invalid_api_key",
  "client_not_found",
  "company_document",
  "server_config",
];

export const TrainingsErrorState = ({
  code,
  message,
  onRetry,
  retrying,
}: TrainingsErrorStateProps) => {
  const needsAdmin = ADMIN_CODES.includes(code);

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
      <AlertTriangle className="w-8 h-8" />
      <p className="max-w-md text-muted-foreground">{message}</p>
      {!needsAdmin && (
        <Button variant="outline" onClick={onRetry} disabled={retrying}>
          <RefreshCw className={`w-4 h-4 mr-2 ${retrying ? "animate-spin" : ""}`} />
          Reintentar
        </Button>
      )}
    </div>
  );
};
