import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { AssistantAuthStart, AssistantProvider } from "../types";
import { confirmAuth, startAuth, submitAuthCode } from "../services/assistant.service";
import { ProviderPicker } from "./ProviderPicker";
import { AuthSteps } from "./AuthSteps";

interface Props {
  onConnected: () => void;
}

/**
 * Conectar la cuenta de IA de la empresa. Se hace UNA vez y sirve para todos.
 *
 * Dos pantallas: elegir proveedor y autorizar. Los dos proveedores terminan
 * distinto -- Claude devuelve un codigo que hay que traer de vuelta, Codex lo
 * resuelve solo en cuanto el admin aprueba -- y `needsCode` decide cual mostrar.
 */
export function AdminConnectPanel({ onConnected }: Props) {
  const [provider, setProvider] = useState<AssistantProvider | null>(null);
  const [auth, setAuth] = useState<AssistantAuthStart | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function begin(elegido: AssistantProvider) {
    setBusy(true);
    setError(null);
    setProvider(elegido);
    try {
      setAuth(await startAuth(elegido));
    } catch (err) {
      setProvider(null);
      setError(err instanceof Error ? err.message : "No se pudo iniciar la conexión.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmar() {
    if (!auth || !provider) return;
    setBusy(true);
    setError(null);
    try {
      if (auth.needsCode) {
        await submitAuthCode(auth.authId, code.trim());
      } else {
        await confirmAuth(provider);
      }
      onConnected();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo confirmar la autorización.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <Alert variant="destructive" className="max-w-2xl">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!auth || !provider ? (
        <ProviderPicker onPick={(p) => void begin(p)} busy={busy} />
      ) : (
        <div className="flex flex-col gap-3">
          <AuthSteps
            provider={provider}
            auth={auth}
            code={code}
            onCodeChange={setCode}
            onConfirm={() => void confirmar()}
            busy={busy}
          />
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAuth(null);
                setProvider(null);
                setCode("");
                setError(null);
              }}
            >
              Elegir otro proveedor
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
