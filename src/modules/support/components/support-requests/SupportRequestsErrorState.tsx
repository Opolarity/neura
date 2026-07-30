import { AlertTriangle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { SupportErrorCode } from "../../types/Support.types";

interface SupportRequestsErrorStateProps {
  code: SupportErrorCode;
  /** Mensaje que devolvió el backend; se usa cuando el código no tiene copy propio. */
  message: string;
  onRetry: () => void;
  retrying?: boolean;
}

const COPY: Partial<
  Record<SupportErrorCode, { title: string; description?: string; showMessage?: boolean }>
> = {
  not_configured: {
    title: "Soporte no disponible en este ambiente",
    description:
      "El servicio de soporte todavía no está habilitado aquí (falta la clave de acceso a OPOLARITY Tasks). Avisa al administrador para activarlo.",
  },
  client_not_found: {
    title: "Empresa no registrada en soporte",
    description:
      "El documento configurado en este ambiente no está registrado como cliente activo en OPOLARITY Tasks, así que todavía no hay solicitudes para mostrar.",
    showMessage: true,
  },
  invalid_api_key: {
    title: "Clave de acceso inválida",
    description:
      "La clave de acceso a OPOLARITY Tasks fue rechazada. Contacta al administrador.",
  },
  network_error: {
    title: "Sin conexión con el servicio de soporte",
    description: "No pudimos contactar al servicio. Revisa tu conexión e intenta nuevamente.",
  },
  upstream_unreachable: {
    title: "Sin conexión con el servicio de soporte",
    description: "No pudimos contactar al servicio. Revisa tu conexión e intenta nuevamente.",
  },
  unauthorized: {
    title: "Sesión expirada",
    description: "Vuelve a iniciar sesión para ver las solicitudes de soporte.",
  },
};

export const SupportRequestsErrorState = ({
  code,
  message,
  onRetry,
  retrying,
}: SupportRequestsErrorStateProps) => {
  const copy = COPY[code];
  const title = copy?.title ?? "No se pudieron cargar las solicitudes";
  const description = copy?.description ?? message;
  const extraMessage = copy?.showMessage ? message : null;

  return (
    <div className="p-6">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>
          <p>{description}</p>
          {extraMessage && (
            <p className="mt-1 text-xs opacity-80">{extraMessage}</p>
          )}
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={onRetry}
            disabled={retrying}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${retrying ? "animate-spin" : ""}`} />
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
};
