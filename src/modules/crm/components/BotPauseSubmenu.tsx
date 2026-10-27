import { useEffect, useState } from "react";
import { Bot, PauseCircle, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ComponentPermission } from "@/shared/components/component-permission";
import {
  formatDateTime,
  limaDateTimeLocalToIso,
  limaIsoToDateTimeLocal,
} from "@/shared/utils/date";
import type { BotPauseState } from "../types/crm.types";

interface Props {
  state: BotPauseState;
  busy: boolean;
  /** ISO con zona, o null para "hasta que lo reactive". */
  onPause: (until: string | null) => void;
  onResume: () => void;
  /** "Hasta una fecha…": el diálogo vive fuera del menú, que se cierra al elegir. */
  onPickDate: () => void;
}

const HORA_MS = 3600 * 1000;
/** El bot no acepta pausas con fecha a más de 365 días. */
const MAX_DIAS = 365;

/**
 * T-983: submenú "Bot" del menú ⋯ del chat. Pausa el bot en esta conversación
 * (1 h, 24 h, hasta una fecha o hasta reactivarlo), dice hasta cuándo está
 * pausado y permite reactivarlo antes.
 *
 * La pausa del dueño (Coexistencia: respondió desde la app) también se muestra,
 * pero no se puede reactivar desde acá: vence sola.
 */
export const BotPauseSubmenu = ({ state, busy, onPause, onResume, onPickDate }: Props) => {
  const manual = state.reason === "crm_manual";
  const hasta = state.indefinite
    ? "sin límite"
    : state.until
      ? `hasta ${formatDateTime(state.until)}`
      : "";

  const estado = state.paused
    ? manual
      ? `En pausa ${hasta}`
      : `En pausa: respondió el dueño ${hasta}`
    : "Activo en este chat";
  const detalle = state.paused && state.pausedBy ? `${estado} · por ${state.pausedBy}` : estado;

  return (
    <ComponentPermission codeIn={["crm_conversations.take"]}>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger
          className="items-start gap-2 text-xs [&>svg:last-child]:h-3.5 [&>svg:last-child]:w-3.5"
          disabled={busy}
        >
          {state.paused ? (
            <PauseCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
          ) : (
            <Bot className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          )}
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline gap-2">
              <span className="font-medium">Pausar bot</span>
              <span className="ml-auto text-muted-foreground">{state.paused ? "En pausa" : "Activo"}</span>
            </span>
            <span className="block text-[11px] text-muted-foreground">Lo calla solo en este chat.</span>
          </span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="w-56 text-xs">
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{detalle}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {state.paused && manual ? (
            <DropdownMenuItem className="text-xs" onSelect={onResume}>
              <PlayCircle className="mr-2 h-3.5 w-3.5" />
              Reactivar bot
            </DropdownMenuItem>
          ) : state.paused ? (
            // La pausa del dueño (respondió desde la app) vence sola.
            <DropdownMenuItem className="text-xs" disabled>
              Se reactiva solo al vencer
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem
                className="text-xs"
                onSelect={() => onPause(new Date(Date.now() + HORA_MS).toISOString())}
              >
                Por 1 hora
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-xs"
                onSelect={() => onPause(new Date(Date.now() + 24 * HORA_MS).toISOString())}
              >
                Por 24 horas
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs" onSelect={onPickDate}>
                Hasta una fecha…
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs" onSelect={() => onPause(null)}>
                Hasta que lo reactive
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    </ComponentPermission>
  );
};

/** "Pausar el bot hasta": fecha y hora en Lima, dentro de los 365 días. */
export const BotPauseDateDialog = ({
  open,
  onOpenChange,
  busy,
  onPause,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  busy: boolean;
  onPause: (until: string) => void;
}) => {
  const [fecha, setFecha] = useState("");

  // Cada vez que se abre propone mañana a esta hora.
  useEffect(() => {
    if (open) setFecha(limaIsoToDateTimeLocal(new Date(Date.now() + 24 * HORA_MS).toISOString()));
  }, [open]);

  const ahora = limaIsoToDateTimeLocal(new Date().toISOString());
  const tope = limaIsoToDateTimeLocal(new Date(Date.now() + MAX_DIAS * 24 * HORA_MS).toISOString());
  const fechaValida = !!fecha && fecha > ahora && fecha <= tope;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle>Pausar el bot hasta</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="bot-pause-until">Fecha y hora (Lima)</Label>
          <Input
            id="bot-pause-until"
            type="datetime-local"
            value={fecha}
            min={ahora}
            max={tope}
            onChange={(e) => setFecha(e.target.value)}
          />
          {!fechaValida && fecha && (
            <p className="text-xs text-destructive">
              Tiene que ser una fecha futura, dentro de {MAX_DIAS} días.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={!fechaValida || busy}
            onClick={() => {
              onPause(limaDateTimeLocalToIso(fecha));
              onOpenChange(false);
            }}
          >
            Pausar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
