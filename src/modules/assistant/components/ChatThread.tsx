import { useEffect, useRef, useState } from "react";
import {
  Database,
  Loader2,
  MessageSquare,
  Package,
  Send,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TOOL_LABEL, type AssistantMessage } from "../types";
import { RichText } from "./RichText";

interface Props {
  messages: AssistantMessage[];
  sending: boolean;
  error: string | null;
  onSend: (text: string) => void;
  onStop: () => void;
}

/**
 * Un turno del asistente: avatar, lo que esta haciendo, y lo que responde.
 *
 * La linea de estado sale de las herramientas que llamo, no de su prosa
 * intermedia: "Consultando la base de datos" dice mas que "voy a revisar el
 * esquema y despues calcularlo". Los mensajes intermedios se descartan; solo
 * se pinta el ultimo bloque, que es la respuesta.
 */
function AssistantTurn({ message }: { message: AssistantMessage }) {
  const bloques = message.blocks.filter((b) => b.trim());
  const respuesta = bloques.length ? bloques[bloques.length - 1].trim() : "";
  // Mientras no haya respuesta, el ultimo mensaje intermedio hace de avance
  // (suele ser una repregunta: "¿de que periodo?").
  const enCurso = message.streaming && !respuesta && bloques.length > 0;

  return (
    <div className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted mt-0.5">
        <Sparkles className="h-4 w-4" />
      </span>

      <div className="flex flex-1 flex-col gap-2 min-w-0">
        {message.steps.map((paso, i) => (
          <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
            {paso.done ? (
              <Database className="h-4 w-4 shrink-0" />
            ) : (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            )}
            <span className="truncate">{TOOL_LABEL[paso.tool] ?? paso.tool}</span>
          </div>
        ))}

        {message.streaming && message.steps.length === 0 && !respuesta && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            <span>Pensando...</span>
          </div>
        )}

        {(respuesta || enCurso) && (
          <div className="text-sm leading-relaxed">
            <RichText text={respuesta || bloques[bloques.length - 1].trim()} />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Estado inicial. Las tres sugerencias no son decorativas: son las preguntas
 * que la gente hace de verdad, y sirven para que alguien que abre la pantalla
 * por primera vez sepa que puede pedir sin tener que adivinarlo.
 */
function EstadoInicial({
  onPick,
  disabled,
}: {
  onPick: (t: string) => void;
  disabled: boolean;
}) {
  const SUGERENCIAS = [
    { icon: TrendingUp, texto: "¿Cómo van las ventas de hoy?" },
    { icon: Package, texto: "¿Qué productos tienen stock bajo?" },
    { icon: Users, texto: "¿Quiénes son mis mejores clientes?" },
  ];

  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 px-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
        <MessageSquare className="h-6 w-6" />
      </span>

      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Pregúntale a tus datos</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          El asistente consulta tus ventas, stock y clientes en tiempo real.
          Prueba una de estas preguntas o escribe la tuya.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {SUGERENCIAS.map(({ icon: Icon, texto }) => (
          <button
            key={texto}
            type="button"
            onClick={() => onPick(texto)}
            disabled={disabled}
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm
                       hover:bg-muted disabled:opacity-50
                       ring-offset-background focus-visible:outline-none
                       focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Icon className="h-4 w-4 shrink-0" />
            {texto}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ChatThread({ messages, sending, error, onSend, onStop }: Props) {
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  // El scroll sigue a la respuesta mientras se transmite: sin esto el texto
  // nuevo crece por debajo del borde visible y parece que no pasa nada.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  function submit() {
    const text = draft.trim();
    if (!text || sending) return;
    onSend(text);
    setDraft("");
  }

  return (
    <div className="flex flex-col min-h-0 flex-1 gap-4">
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <EstadoInicial onPick={onSend} disabled={sending} />
        ) : (
          <div className="flex flex-col gap-6">
            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[80%] rounded-lg bg-primary px-4 py-2 text-primary-foreground">
                    <p className="whitespace-pre-wrap break-words text-sm">
                      {m.blocks.join("")}
                    </p>
                  </div>
                </div>
              ) : (
                <AssistantTurn key={m.id} message={m} />
              ),
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-end gap-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // Enter envia, Shift+Enter salta de linea: es lo que espera
            // cualquiera que haya usado un chat.
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Escribe tu mensaje..."
          rows={2}
          className="resize-none"
          disabled={sending}
        />
        {sending ? (
          <Button variant="outline" onClick={onStop} title="Detener respuesta">
            Detener
          </Button>
        ) : (
          <Button onClick={submit} disabled={!draft.trim()} title="Enviar mensaje">
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* El asistente escribe el SQL cada vez y puede elegir un criterio
          distinto; conviene que eso este a la vista, no solo en la documentacion. */}
      <p className="text-center text-xs text-muted-foreground">
        El asistente puede cometer errores. Verifica los datos importantes en tus reportes.
      </p>
    </div>
  );
}
