import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/shared/components/page-loader";
import { useAuth } from "@/modules/auth";
import { useSystemConnection } from "../hooks/useSystemConnection";
import { useAssistant } from "../hooks/useAssistant";
import { AdminConnectPanel } from "../components/AdminConnectPanel";
import { ConnectionStatus } from "../components/ConnectionStatus";
import { ChatThread } from "../components/ChatThread";

const AssistantPage = () => {
  const { connection, loading, error, refresh, revoke } = useSystemConnection();
  const chat = useAssistant();
  const [disconnecting, setDisconnecting] = useState(false);

  // Aqui NO se usa <ComponentPermission>: ese componente solo sabe renderizar
  // cuando el permiso SI esta, y esta pantalla necesita tambien el caso
  // contrario (decirle al que no puede conectar a quien pedirselo).
  const { permissionCodes, isAdmin } = useAuth();
  const canConnect = isAdmin || permissionCodes.includes("assistant.admin");

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await revoke();
      chat.reset();
    } finally {
      setDisconnecting(false);
    }
  }

  if (loading) {
    return <PageLoader message="Cargando el asistente..." />;
  }

  const connected = Boolean(connection?.connected);

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <Card className="flex flex-col min-h-0 flex-1 overflow-hidden">
        <CardHeader className="!p-4">
          {connected && connection ? (
            <ConnectionStatus
              connection={connection}
              onDisconnect={() => void handleDisconnect()}
              disconnecting={disconnecting}
            />
          ) : (
            <div>
              <h1 className="text-lg font-semibold">Asistente IA</h1>
              <p className="text-sm text-muted-foreground">
                {error
                  ? "No se pudo consultar el estado de la conexión."
                  : "Todavía no hay una cuenta de IA conectada."}
              </p>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-4 pt-0 flex-1 min-h-0 overflow-hidden flex flex-col">
          {error ? (
            <div className="flex flex-col gap-3 max-w-xl">
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <div>
                <Button variant="outline" size="sm" onClick={() => void refresh()}>
                  Reintentar
                </Button>
              </div>
            </div>
          ) : connected ? (
            <ChatThread
              messages={chat.messages}
              sending={chat.sending}
              error={chat.error}
              onSend={(text) => void chat.send(text)}
              onStop={chat.stop}
            />
          ) : canConnect ? (
            <AdminConnectPanel onConnected={() => void refresh()} />
          ) : (
            <Alert>
              <AlertDescription>
                El asistente aún no está disponible: falta que un administrador
                conecte la cuenta de IA de la empresa.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AssistantPage;
