import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComponentPermission } from "@/shared/components/component-permission";
import { PROVIDER_LABEL, type AssistantConnection } from "../types";

interface Props {
  connection: AssistantConnection;
  onDisconnect: () => void;
  disconnecting: boolean;
}

/**
 * Cabecera de la pantalla con la cuenta ya conectada.
 *
 * Solo dos cosas: quien es y si esta operativo. La cuenta y quien la conecto
 * van debajo, en texto atenuado: es informacion de administracion, no de uso
 * diario, y competia con el titulo cuando iba en un badge.
 */
export function ConnectionStatus({ connection, onDisconnect, disconnecting }: Props) {
  const proveedor = connection.provider ? PROVIDER_LABEL[connection.provider] : "IA";

  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Bot className="h-5 w-5" />
        </span>

        <div className="flex flex-col gap-0.5">
          <span className="text-base font-semibold leading-none">Asistente IA</span>

          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            {/* El punto es estado, no adorno: por eso lleva color. */}
            <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
            En línea
          </span>

          <span className="mt-1 text-xs text-muted-foreground">
            Cuenta de {proveedor} de la empresa
            {connection.connectedBy && <> · conectada por {connection.connectedBy}</>}
          </span>
        </div>
      </div>

      <ComponentPermission codeIn={["assistant.admin"]}>
        <Button
          variant="outline"
          size="sm"
          onClick={onDisconnect}
          disabled={disconnecting}
        >
          {disconnecting ? "Desconectando..." : "Desconectar cuenta"}
        </Button>
      </ComponentPermission>
    </div>
  );
}
