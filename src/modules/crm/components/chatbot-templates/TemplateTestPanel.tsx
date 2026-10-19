import { useState } from "react";
import { FlaskConical, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toastError } from "@/shared/utils/toastError";
import { toTemplateTestResult } from "../../adapters/chatbotTemplates.adapter";
import { testChatbotTemplateApi } from "../../services/crm.service";
import type { TemplateTestChoice, TemplateTestResult } from "../../types/chatbotTemplates.types";

interface TemplateTestPanelProps {
  /** Nombre con que se guardaría (slug). */
  name: string;
  /** Texto en la sintaxis del bot ({clave}). */
  content: string;
  topic: string;
  tags: string[];
  /** Nombre de la plantilla que se edita (null = alta nueva). */
  editing: string | null;
  /** Para el aviso de operaciones: los ejemplos que escribió el admin. */
  onExamplesChange?: (examples: string[]) => void;
}

const MAX_EJEMPLOS = 3;

/** Una línea legible de lo que hace Jev con un mensaje. */
const describir = (c: TemplateTestChoice, propia: string | null): string => {
  if (c.error && !c.ganadora) return "Jev no respondió";
  if (!c.ganadora) return "No reconoce ninguna plantilla: responde el modelo";
  const pct = c.probabilidad != null ? ` (${Math.round(c.probabilidad * 100)} %)` : "";
  const quien = c.ganadora === propia ? "esta plantilla" : c.ganadora;
  if (c.accion === "jev_manda") return `Manda ${quien} sola${pct}`;
  if (c.accion === "llm_candidatas") return `El modelo ve ${quien} como candidata${pct}`;
  return `Elige ${quien}${pct}, pero responde el modelo`;
};

/**
 * T-921 (punto 1): "Probar antes de guardar". El admin escribe 1-3 mensajes
 * como los escribiría un cliente y ve qué hace el bot HOY y con esta
 * plantilla, más a cuál se parece su texto. La prueba la corre el servicio del
 * bot con Jev (la key no llega al navegador). No bloquea el guardado.
 */
export default function TemplateTestPanel({ name, content, topic, tags, editing, onExamplesChange }: TemplateTestPanelProps) {
  const [ejemplos, setEjemplos] = useState<string[]>([""]);
  const [probando, setProbando] = useState(false);
  const [resultado, setResultado] = useState<TemplateTestResult | null>(null);

  const validos = ejemplos.map((e) => e.trim()).filter(Boolean);
  const listo = validos.length > 0 && !!name && !!content.trim() && !!topic;

  const cambiar = (i: number, valor: string) => {
    const next = ejemplos.map((e, j) => (j === i ? valor : e));
    setEjemplos(next);
    onExamplesChange?.(next.map((e) => e.trim()).filter(Boolean));
  };

  const probar = async () => {
    setProbando(true);
    try {
      const api = await testChatbotTemplateApi({ examples: validos, draft: { name, text: content, topic, tags }, editing });
      setResultado(toTemplateTestResult(api));
    } catch (error) {
      toastError(error, undefined, "No se pudo probar la plantilla");
    } finally {
      setProbando(false);
    }
  };

  const parecida = resultado?.parecidas.find((p) => p.similitud >= 0.7);
  const sinJevSolo = resultado && resultado.modoTenant !== "active";

  return (
    <div className="flex flex-col gap-3 rounded-md border p-3">
      <div className="flex flex-col gap-1">
        <Label>Probar antes de guardar</Label>
        <p className="text-xs text-muted-foreground">
          Escribe hasta {MAX_EJEMPLOS} mensajes como los mandaría un cliente. Vas a ver qué hace el bot hoy y qué haría con
          esta plantilla.
        </p>
      </div>
      {ejemplos.map((e, i) => (
        <Input
          key={i}
          value={e}
          maxLength={300}
          placeholder={i === 0 ? "¿A qué hora abren el domingo?" : "Otro mensaje de ejemplo (opcional)"}
          aria-label={`Mensaje de ejemplo ${i + 1}`}
          onChange={(ev) => cambiar(i, ev.target.value)}
        />
      ))}
      <div className="flex flex-wrap gap-2">
        {ejemplos.length < MAX_EJEMPLOS && (
          <Button type="button" variant="outline" size="sm" onClick={() => setEjemplos([...ejemplos, ""])}>
            Agregar ejemplo
          </Button>
        )}
        <Button type="button" variant="outline" size="sm" disabled={!listo || probando} onClick={probar}>
          {probando ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <FlaskConical className="mr-1 h-4 w-4" />}
          Probar
        </Button>
      </div>

      {resultado && (
        <div className="flex flex-col gap-2 text-sm">
          {sinJevSolo && (
            <p className="text-xs text-muted-foreground">
              Hoy Jev está en modo {resultado.modoTenant === "off" ? "apagado" : "sombra"}: no manda nada solo. Esto es lo
              que elegiría.
            </p>
          )}
          {resultado.resultados.map((r) => (
            <div key={r.ejemplo} className="rounded-md bg-muted p-2">
              <p className="font-medium">“{r.ejemplo}”</p>
              <p className="text-xs">
                <span className="text-muted-foreground">Hoy: </span>
                {describir(r.hoy, null)}
              </p>
              <p className="text-xs">
                <span className="text-muted-foreground">Con esta plantilla: </span>
                {describir(r.conBorrador, name)}
              </p>
            </div>
          ))}
          {parecida ? (
            <p className="text-xs">
              <Badge variant="warning" className="mr-1">
                Parecida
              </Badge>
              Se parece a <span className="font-mono">{parecida.nombre}</span> ({Math.round(parecida.similitud * 100)} %).
              Revisa si no es la misma.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">No se parece a ninguna otra plantilla.</p>
          )}
        </div>
      )}
    </div>
  );
}
