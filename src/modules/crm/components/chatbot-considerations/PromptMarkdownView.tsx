import type { ReactNode } from "react";
import type { JSONContent } from "@tiptap/core";
import { cn } from "@/shared/utils/utils";
import { markdownToDoc } from "../../utils/promptMarkdown";
import Highlight from "./Highlight";

const inline = (nodes: JSONContent[] = [], query: string): ReactNode[] =>
  nodes.map((n, i) => {
    if (n.type === "hardBreak") return <br key={i} />;
    let el: ReactNode = <Highlight text={n.text ?? ""} query={query} />;
    const has = (m: string) => n.marks?.some((x) => x.type === m);
    if (has("code")) el = <code className="rounded bg-muted px-1 py-0.5 text-[0.92em]">{el}</code>;
    if (has("italic")) el = <em>{el}</em>;
    if (has("bold")) el = <strong className="font-semibold">{el}</strong>;
    return <span key={i}>{el}</span>;
  });

const block = (n: JSONContent, i: number, query: string): ReactNode => {
  switch (n.type) {
    case "paragraph":
      return <p key={i}>{inline(n.content, query)}</p>;
    case "blockquote":
      return (
        <blockquote key={i} className="border-l-2 border-border pl-3 text-muted-foreground">
          {(n.content ?? []).map((c, k) => block(c, k, query))}
        </blockquote>
      );
    case "bulletList":
      return (
        <ul key={i} className="list-disc space-y-0.5 pl-5">
          {(n.content ?? []).map((li, k) => (
            <li key={k}>{(li.content ?? []).map((c, j) => block(c, j, query))}</li>
          ))}
        </ul>
      );
    case "orderedList":
      return (
        <ol key={i} start={Number(n.attrs?.start ?? 1)} className="list-decimal space-y-0.5 pl-5">
          {(n.content ?? []).map((li, k) => (
            <li key={k}>{(li.content ?? []).map((c, j) => block(c, j, query))}</li>
          ))}
        </ol>
      );
    default:
      return null;
  }
};

/**
 * Un texto del prompt como se lee: negritas, cursivas, puntos y citas ya
 * formateados, sin los símbolos que usa la IA (`**`, `*`, `` ` ``, `- `, `> `).
 * Lo que va entre comillas invertidas (lo que el bot copia tal cual) va con
 * fondo gris.
 */
export default function PromptMarkdownView({ text, query, className }: { text: string; query: string; className?: string }) {
  const doc = markdownToDoc(text);
  return <div className={cn("space-y-1 break-words text-sm leading-relaxed", className)}>{(doc.content ?? []).map((b, i) => block(b, i, query))}</div>;
}
