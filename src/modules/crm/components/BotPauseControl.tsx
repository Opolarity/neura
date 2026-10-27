import { useState } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/shared/utils/utils";
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

  // El estado va en el propio ícono: en pausa se ve en ámbar suave, y el
  // detalle (hasta cuándo, quién) en el title y dentro del menú.
  const estado = state.paused
    ? manual
      ? `Bot en pausa ${hasta}`
      : `Bot en pausa: respondió el dueño ${hasta}`
    : "Bot activo en este chat";
  const titulo = state.paused && state.pausedBy ? `${estado} · por ${state.pausedBy}` : estado;
  const iconClass = cn(
    "h-7 w-7 shrink-0 rounded-full",
    state.paused && "border-transparent bg-warning-soft text-warning-soft-foreground hover:bg-warning-soft"
  );

  return (
    <>
      <ComponentPermission codeIn={["crm_conversations.take"]}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className={iconClass} disabled={busy} title={titulo} aria-label={titulo}>
              {state.paused ? <PauseCircle className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 text-xs">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{estado}</DropdownMenuLabel>
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
              <DropdownMenuItem className="text-xs" onSelect={abrirFecha}>
                Hasta una fecha…
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs" onSelect={() => onPause(null)}>
                Hasta que lo reactive
              </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
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
