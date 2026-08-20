import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  PROVIDER_LABEL,
  type AssistantAuthStart,
  type AssistantProvider,
} from "../types";
import {
  confirmAuth,
  startAuth,
  submitAuthCode,
} from "../services/assistant.service";

interface Props {
  onConnected: () => void;
}

/**
 * Conectar la cuenta de IA de la empresa. Se hace UNA vez y sirve para todos.
 *
 * Los dos proveedores usan el mismo patron (abrir un enlace y autorizar) pero
 * terminan distinto: Claude devuelve un codigo que hay que traer de vuelta,
 * Codex lo resuelve por su cuenta en cuanto el admin lo aprueba en el navegador.
 * `needsCode` decide cual de los dos finales se muestra.
 */
export function AdminConnectPanel({ onConnected }: Props) {
  const [provider, setProvider] = useState<AssistantProvider | null>(null);
  const [auth, setAuth] = useState<AssistantAuthStart | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function begin(chosen: AssistantProvider) {
    setBusy(true);
    setError(null);
    setProvider(chosen);
    try {
      setAuth(await startAuth(chosen));
    } catch (err) {
      setProvider(null);
      setError(err instanceof Error ? err.message : "No se pudo iniciar la conexión.");
    } finally {
      setBusy(false);
    }
  }

  /** Claude: se devuelve el código que el proveedor le dio al admin. */
  async function finishWithCode() {
    if (!auth || !code.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await submitAuthCode(auth.authId, code.trim());
      onConnected();
    } catch (err) {
      setError(err instanceof Error ? err.message : "El código no fue aceptado.");
    } finally {
      setBusy(false);
    }
  }

  /** Codex: no hay código, pero hay que cerrar el flujo en el gateway. */
  async function finishWithoutCode() {
    if (!provider) return;
    setBusy(true);
    setError(null);
    try {
      await confirmAuth(provider);
      onConnected();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo confirmar la autorización.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!auth) {
    return (
      <div className="flex flex-col gap-4 max-w-xl">
        <div>
          <h2 className="text-lg font-semibold">Conectar la cuenta de IA</h2>
          <p className="text-sm text-muted-foreground">
            Se conecta una sola cuenta y la usa todo el equipo. Elige con cuál.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => begin("claude")} disabled={busy}>
            Conectar con Claude
          </Button>
          <Button variant="outline" onClick={() => begin("codex")} disabled={busy}>
            Conectar con ChatGPT
          </Button>
        </div>

        {/* Los dos motivos reales por los que este flujo falla en el primer
            intento. Decirlos antes ahorra el ticket. */}
        <Alert>
          <AlertDescription className="text-sm">
            La cuenta necesita suscripción de pago: <strong>Claude Pro o Max</strong>, o{" "}
            <strong>ChatGPT Plus, Pro o Business</strong>. Las cuentas gratuitas no sirven.
            <br />
            Si eliges ChatGPT, activa antes la{" "}
            <strong>autorización por código de dispositivo</strong> en los ajustes de
            seguridad de esa cuenta.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const label = provider ? PROVIDER_LABEL[provider] : "";

  return (
    <div className="flex flex-col gap-4 max-w-xl">
      <div>
        <h2 className="text-lg font-semibold">Autoriza la cuenta de {label}</h2>
        <p className="text-sm text-muted-foreground">
          Abre este enlace, inicia sesión y autoriza el acceso.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <a
        href={auth.url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium underline-offset-4 hover:underline break-all"
      >
        {auth.url}
      </a>

      {auth.code && (
        <div className="rounded-md border p-4">
          <p className="text-sm text-muted-foreground">
            Código a confirmar en esa página:
          </p>
          <p className="text-2xl font-bold tracking-widest">{auth.code}</p>
        </div>
      )}

      {auth.needsCode ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="assistant-auth-code">
            Pega aquí el código que te devuelve la página
          </Label>
          <div className="flex gap-2">
            <Input
              id="assistant-auth-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Código de autorización"
              autoComplete="off"
            />
            <Button onClick={() => void finishWithCode()} disabled={busy || !code.trim()}>
              {busy ? "Validando..." : "Conectar"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button onClick={() => void finishWithoutCode()} disabled={busy}>
            {busy ? "Comprobando..." : "Ya lo autoricé"}
          </Button>
          <span className="text-sm text-muted-foreground">
            Apruébalo en el navegador y pulsa el botón.
          </span>
        </div>
      )}
    </div>
  );
}
