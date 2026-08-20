import { Bot, MessageSquare, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PROVIDER_LABEL, type AssistantProvider } from "../types";

interface Props {
  onPick: (provider: AssistantProvider) => void;
  busy: boolean;
}

// Los requisitos van EN la tarjeta, no en un aviso al final: son la causa mas
// frecuente de que la conexion falle, y leerlos despues de intentarlo no sirve.
const OPCIONES: {
  provider: AssistantProvider;
  icon: typeof Bot;
  requisito: string;
  primario: boolean;
}[] = [
  {
    provider: "claude",
    icon: Bot,
    requisito: "Requiere plan Pro o Max. Las cuentas gratuitas no funcionan.",
    primario: true,
  },
  {
    provider: "codex",
    icon: MessageSquare,
    requisito:
      "Requiere plan Plus, Pro o Business. Activa antes la autorización por código de dispositivo.",
    primario: false,
  },
];

export function ProviderPicker({ onPick, busy }: Props) {
  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <p className="text-sm text-muted-foreground">
        Elige un proveedor. Se conecta una sola cuenta y la usa todo el equipo.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {OPCIONES.map(({ provider, icon: Icon, requisito, primario }) => (
          <div
            key={provider}
            className="flex flex-col gap-4 rounded-lg border p-5"
          >
            <div className="flex items-center gap-3">
              {/* El icono no lleva color propio: lo hereda del texto. */}
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-base font-semibold">
                {PROVIDER_LABEL[provider]}
              </span>
            </div>

            <p className="text-sm text-muted-foreground flex-1">{requisito}</p>

            <Button
              variant={primario ? "default" : "outline"}
              onClick={() => onPick(provider)}
              disabled={busy}
              className="w-full"
            >
              Conectar con {PROVIDER_LABEL[provider]}
            </Button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 text-sm text-muted-foreground">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          Si eliges ChatGPT, activa la autorización por código de dispositivo en
          los ajustes de seguridad de esa cuenta. Sin eso, el enlace de conexión
          no llega a completarse.
        </p>
      </div>
    </div>
  );
}
