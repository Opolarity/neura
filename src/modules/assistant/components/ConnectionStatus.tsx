import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ComponentPermission } from "@/shared/components/component-permission";
import { PROVIDER_LABEL, type AssistantConnection } from "../types";

interface Props {
  connection: AssistantConnection;
  onDisconnect: () => void;
  disconnecting: boolean;
}

/**
 * Cabecera de la pantalla cuando ya hay cuenta conectada. La cuenta es una sola
 * y es de la empresa, asi que esto informa a TODOS los usuarios de con que
 * proveedor estan hablando y quien lo dejo conectado.
 */
export function ConnectionStatus({ connection, onDisconnect, disconnecting }: Props) {
  const label = connection.provider ? PROVIDER_LABEL[connection.provider] : "—";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="success">Conectado</Badge>
        <span className="text-sm">
          Cuenta de <span className="font-medium">{label}</span> de la empresa
        </span>
        {connection.connectedBy && (
          <span className="text-sm text-muted-foreground">
            · conectada por {connection.connectedBy}
          </span>
        )}
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
