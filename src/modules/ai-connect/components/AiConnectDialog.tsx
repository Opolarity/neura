import { useState } from "react";
import { Check, Copy, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/shared/hooks/use-toast";
import { formatDateLong } from "@/shared/utils/date";
import {
  AI_APP_GUIDES,
  AI_APP_ORDER,
  CLAUDE_CODE_COMMAND,
  MCP_GUIDE_URL,
  MCP_URL,
} from "../constants/aiConnect.constants";
import type { AiApp, AiConnection } from "../types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connections: AiConnection[];
  /** Sin estado (la consulta de grants fallo): el modal queda como guia. */
  statusAvailable: boolean;
  onRevoke: (clientId: string) => Promise<void>;
}

async function copyText(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast({ title: `${label} copiada` });
  } catch {
    toast({ title: "No se pudo copiar", description: text, variant: "destructive" });
  }
}

export function AiConnectDialog({ open, onOpenChange, connections, statusAvailable, onRevoke }: Props) {
  const [tab, setTab] = useState<AiApp>("claude");
  // Apps cuya pestaña de conectores se abrio desde aqui y aun no aparecen
  // como grant. Se limpia sola: en cuanto llega el grant, manda "conectado".
  const [waiting, setWaiting] = useState<Partial<Record<AiApp, boolean>>>({});
  const [revoking, setRevoking] = useState<string | null>(null);

  const startConnect = async (app: AiApp) => {
    const guide = AI_APP_GUIDES[app];
    await copyText(MCP_URL, "URL del MCP");
    if (guide.settingsUrl) window.open(guide.settingsUrl, "_blank", "noopener,noreferrer");
    setWaiting((prev) => ({ ...prev, [app]: true }));
  };

  const revoke = async (clientId: string) => {
    setRevoking(clientId);
    try {
      await onRevoke(clientId);
    } catch (err) {
      toast({
        title: "No se pudo desconectar",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setRevoking(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Conecta Neura con tu IA</DialogTitle>
          <DialogDescription>
            Pregunta por tus ventas, el stock por talla y color o tus promociones desde Claude o ChatGPT.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(value) => setTab(value as AiApp)} className="flex flex-col gap-4">
          <TabsList className="grid w-full grid-cols-3">
            {AI_APP_ORDER.map((app) => (
              <TabsTrigger key={app} value={app}>
                {AI_APP_GUIDES[app].label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mcp-url">URL del servidor MCP</Label>
            <div className="flex gap-2">
              <Input id="mcp-url" readOnly value={MCP_URL} className="font-mono" />
              <Button type="button" variant="outline" onClick={() => void copyText(MCP_URL, "URL del MCP")}>
                <Copy className="mr-2 h-4 w-4" />
                Copiar
              </Button>
            </div>
          </div>

          {AI_APP_ORDER.map((app) => {
            const guide = AI_APP_GUIDES[app];
            const appConnections = statusAvailable ? connections.filter((c) => c.app === app) : [];

            return (
              <TabsContent key={app} value={app} className="mt-0 flex flex-col gap-4">
                {appConnections.length > 0 ? (
                  appConnections.map((connection) => (
                    <div
                      key={connection.clientId}
                      className="flex items-center gap-3 rounded-lg bg-success-soft px-4 py-3 text-success-soft-foreground"
                    >
                      <Check className="h-5 w-5 shrink-0" />
                      <div className="flex flex-1 flex-col">
                        <span className="text-sm font-semibold">Conectado con {connection.name}</span>
                        <span className="text-xs">Autorizado el {formatDateLong(connection.grantedAt)}</span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-foreground"
                        disabled={revoking === connection.clientId}
                        onClick={() => void revoke(connection.clientId)}
                      >
                        {revoking === connection.clientId && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Desconectar
                      </Button>
                    </div>
                  ))
                ) : guide.settingsUrl && waiting[app] && statusAvailable ? (
                  <div className="flex items-center gap-3 rounded-lg border bg-muted px-4 py-3">
                    <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">Esperando que autorices en {guide.label}…</span>
                      <span className="text-xs text-muted-foreground">
                        Elige tu empresa e inicia sesión con tu usuario de Neura. Al volver aquí verás el estado.
                      </span>
                    </div>
                  </div>
                ) : guide.settingsUrl ? (
                  <div className="flex flex-col gap-2">
                    <Button type="button" size="lg" onClick={() => void startConnect(app)}>
                      Abrir {guide.label} y conectar
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      Copiamos la URL y abrimos {guide.label} en una pestaña nueva.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium">Comando para Claude Code</span>
                    <div className="flex gap-2">
                      <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-md border bg-muted px-3 py-2.5 font-mono text-sm">
                        {CLAUDE_CODE_COMMAND}
                      </code>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        title="Copiar comando"
                        onClick={() => void copyText(CLAUDE_CODE_COMMAND, "Línea de comando")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <span className="text-sm font-semibold">Paso a paso</span>
                  <ol className="flex flex-col gap-3">
                    {guide.steps.map((step, i) => (
                      <li key={step} className="flex items-start gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums">
                          {i + 1}
                        </span>
                        <span className="pt-0.5 text-sm leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>

        <div className="-mx-6 -mb-6 flex flex-wrap items-center justify-between gap-2 border-t bg-muted px-6 py-3 text-xs text-muted-foreground sm:rounded-b-lg">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Solo lectura · responde con los permisos de tu rol
          </span>
          <a href={MCP_GUIDE_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground hover:underline">
            Ver la guía completa
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
