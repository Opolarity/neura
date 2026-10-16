import { useState } from "react";
import { ChevronDown, PauseCircle, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
}

const HORA_MS = 3600 * 1000;
/** El bot no acepta pausas con fecha a más de 365 días. */
const MAX_DIAS = 365;

/**
 * T-983: pausar el bot en esta conversación (1 h, 24 h, hasta una fecha o
 * hasta reactivarlo), ver hasta cuándo está pausado y reactivarlo antes.
 *
 * La pausa del dueño (Coexistencia: respondió desde la app) también se muestra,
 * pero no se puede reactivar desde acá: vence sola.
 */
export const BotPauseControl = ({ state, busy, onPause, onResume }: Props) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fecha, setFecha] = useState("");

  const manual = state.reason === "crm_manual";
  const hasta = state.indefinite
    ? "sin límite"
    : state.until
      ? `hasta ${formatDateTime(state.until)}`
      : "";

  const abrirFecha = () => {
    setFecha(limaIsoToDateTimeLocal(new Date(Date.now() + 24 * HORA_MS).toISOString()));
    setDialogOpen(true);
  };

  const ahora = limaIsoToDateTimeLocal(new Date().toISOString());
  const tope = limaIsoToDateTimeLocal(new Date(Date.now() + MAX_DIAS * 24 * HORA_MS).toISOString());
  const fechaValida = !!fecha && fecha > ahora && fecha <= tope;

  return (
    <>
      {state.paused && (
        <span
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-warning-soft px-2 py-0.5 text-[10.5px] font-medium leading-none text-warning-soft-foreground"
          title={state.pausedBy ? `Pausado por ${state.pausedBy}` : undefined}
        >
          <PauseCircle className="h-3 w-3" />
          {manual ? `Bot en pausa ${hasta}` : `Bot en pausa: respondió el dueño ${hasta}`}
        </span>
      )}

      <ComponentPermission codeIn={["crm_conversations.take"]}>
        {state.paused && manual ? (
          <Button
            variant="secondary"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={onResume}
            disabled={busy}
          >
            <PlayCircle className="mr-1 h-3.5 w-3.5" />
            Reactivar bot
          </Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 px-2 text-xs" disabled={busy}>
                <PauseCircle className="mr-1 h-3.5 w-3.5" />
                Pausar bot
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-xs">
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
              <DropdownMenuItem className="text-xs" onSelect={abrirFecha}>
                Hasta una fecha…
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs" onSelect={() => onPause(null)}>
                Hasta que lo reactive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </ComponentPermission>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!fechaValida || busy}
              onClick={() => {
                onPause(limaDateTimeLocalToIso(fecha));
                setDialogOpen(false);
              }}
            >
              Pausar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
