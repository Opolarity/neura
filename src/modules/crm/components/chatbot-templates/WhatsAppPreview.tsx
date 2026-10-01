import { cn } from "@/shared/utils/utils";
import { parseWhatsApp } from "../../adapters/whatsappFormat";

/** El texto con el formato de WhatsApp aplicado (negrita, cursiva, tachado, citas). */
export default function WhatsAppPreview({ text }: { text: string }) {
  return (
    <div className="min-h-[200px] rounded-md border bg-muted p-3">
      <div className="w-fit max-w-full rounded-lg rounded-tl-none border bg-background px-3 py-2 text-sm shadow-sm break-words">
        {parseWhatsApp(text).map((line, i) => {
          const content = line.spans.length ? (
            line.spans.map((s, k) => (
              <span
                key={k}
                className={cn(s.bold && "font-semibold", s.italic && "italic", s.strike && "line-through")}
              >
                {s.text}
              </span>
            ))
          ) : (
            <br />
          );
          return line.kind === "quote" ? (
            <div key={i} className="border-l-4 border-border pl-2 text-muted-foreground">
              {content}
            </div>
          ) : (
            <div key={i} className="whitespace-pre-wrap">
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
