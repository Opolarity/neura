import { Bold, Italic, List, ListOrdered, Quote, Strikethrough } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { InlineMark, LineMark } from "../../adapters/whatsappFormat";

export type FormatAction = { type: "inline"; mark: InlineMark } | { type: "lines"; mark: LineMark };

const ACTIONS: { icon: LucideIcon; title: string; action: FormatAction }[] = [
  { icon: Bold, title: "Negrita (Ctrl+B)", action: { type: "inline", mark: "*" } },
  { icon: Italic, title: "Cursiva (Ctrl+I)", action: { type: "inline", mark: "_" } },
  { icon: Strikethrough, title: "Tachado (Ctrl+Shift+X)", action: { type: "inline", mark: "~" } },
  { icon: List, title: "Lista con viñetas", action: { type: "lines", mark: "bullet" } },
  { icon: ListOrdered, title: "Lista numerada", action: { type: "lines", mark: "number" } },
  { icon: Quote, title: "Cita", action: { type: "lines", mark: "quote" } },
];

/** Barra de formato de WhatsApp sobre el cuadro de texto. */
export default function FormatToolbar({ onApply }: { onApply: (action: FormatAction) => void }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-md border bg-muted p-1" role="toolbar" aria-label="Formato del texto">
      {ACTIONS.map(({ icon: Icon, title, action }) => (
        <Button
          key={title}
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          title={title}
          aria-label={title}
          // Que el clic no le saque el foco (ni la selección) al cuadro de texto.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onApply(action)}
        >
          <Icon className="w-4 h-4" />
        </Button>
      ))}
    </div>
  );
}
