import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PROVIDER_LABEL, type AssistantAuthStart, type AssistantProvider } from "../types";

interface Props {
  provider: AssistantProvider;
  auth: AssistantAuthStart;
  code: string;
  onCodeChange: (v: string) => void;
  onConfirm: () => void;
  busy: boolean;
}

/** Un paso numerado. La numeracion es real: hay que hacerlos EN ORDEN. */
function Paso({ n, titulo, children }: { n: number; titulo: string; children?: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums">
        {n}
      </span>
      <div className="flex flex-1 flex-col gap-2 min-w-0">
        <p className="text-sm font-medium leading-6">{titulo}</p>
        {children}
      </div>
    </div>
  );
}

export function AuthSteps({ provider, auth, code, onCodeChange, onConfirm, busy }: Props) {
  const [copiado, setCopiado] = useState(false);

  async function copiar(texto: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso de portapapeles el codigo sigue visible y seleccionable.
    }
  }

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Paso 2 · Autorizar {PROVIDER_LABEL[provider]}
      </p>

      <div className="flex flex-col gap-5 rounded-lg border p-5">
        <Paso n={1} titulo="Abre el enlace, inicia sesión y autoriza el acceso">
          <a
            href={auth.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 rounded-md bg-muted px-3 py-2 text-sm font-medium hover:underline underline-offset-4"
          >
            <span className="truncate">{auth.url.replace(/^https?:\/\//, "")}</span>
            <ExternalLink className="h-4 w-4 shrink-0" />
          </a>
        </Paso>

        {auth.code && (
          <Paso n={2} titulo="Confirma este código en esa página">
            <div className="flex items-center justify-between gap-3 rounded-md bg-muted px-3 py-3">
              <span className="font-mono text-2xl font-semibold tracking-widest tabular-nums">
                {auth.code}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void copiar(auth.code!)}
                title="Copiar el código"
              >
                {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span className="ml-2">{copiado ? "Copiado" : "Copiar"}</span>
              </Button>
            </div>
          </Paso>
        )}

        <Paso n={auth.code ? 3 : 2} titulo="Vuelve aquí y confirma">
          {auth.needsCode ? (
            <div className="flex gap-2">
              <Input
                value={code}
                onChange={(e) => onCodeChange(e.target.value)}
                placeholder="Pega el código que te devuelve la página"
                autoComplete="off"
              />
              <Button onClick={onConfirm} disabled={busy || !code.trim()}>
                {busy ? "Validando..." : "Conectar"}
              </Button>
            </div>
          ) : (
            <div>
              <Button onClick={onConfirm} disabled={busy}>
                {busy ? "Comprobando..." : "Ya lo autoricé"}
              </Button>
            </div>
          )}
        </Paso>
      </div>
    </div>
  );
}
