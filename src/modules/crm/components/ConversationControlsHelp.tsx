import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const AYUDA: { nombre: string; texto: string }[] = [
  {
    nombre: "Vence en…",
    texto:
      "Lo que queda de las 24 h que da WhatsApp desde el último mensaje del cliente. Al vencer ya no se le puede escribir hasta que vuelva a hablar.",
  },
  {
    nombre: "Etapa",
    texto: "Ubica el chat en una columna del tablero del CRM. Es solo para organizarse: no afecta al bot.",
  },
  {
    nombre: "Asignar a…",
    texto: "Elige el asesor que se encarga del cliente. Mientras esté asignado, el bot no responde.",
  },
  {
    nombre: "Pausar bot",
    texto:
      "Calla al bot solo en este chat por 1 h, 24 h, hasta una fecha o hasta reactivarlo. Al vencer vuelve a responder solo.",
  },
  {
    nombre: "Tomar el control",
    texto: "Te haces cargo del chat y el bot deja de responder hasta que lo devuelvas.",
  },
];

/**
 * Explica los controles del encabezado del chat. Son varios y tres de ellos
 * callan al bot de formas distintas, así que se aclara qué hace cada uno.
 */
export const ConversationControlsHelp = () => (
  <Popover>
    <PopoverTrigger asChild>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 text-muted-foreground"
        aria-label="¿Qué hace cada botón?"
        title="¿Qué hace cada botón?"
      >
        <Info className="h-4 w-4" />
      </Button>
    </PopoverTrigger>
    <PopoverContent align="end" className="w-80 p-3 text-xs">
      <p className="mb-2 text-[13px] font-semibold">¿Qué hace cada botón?</p>
      <dl className="space-y-2">
        {AYUDA.map((item) => (
          <div key={item.nombre}>
            <dt className="font-medium">{item.nombre}</dt>
            <dd className="text-muted-foreground">{item.texto}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 rounded-md bg-muted px-2 py-1.5 text-muted-foreground">
        Asignar, Pausar bot y Tomar el control se suman: basta con que uno esté
        activo para que el bot no responda.
      </p>
    </PopoverContent>
  </Popover>
);
