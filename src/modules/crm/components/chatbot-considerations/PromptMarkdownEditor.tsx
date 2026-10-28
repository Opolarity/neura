import { useRef } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import { Bold, Code, Italic, List, ListOrdered } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/shared/utils/utils";
import { docToMarkdown, markdownToDoc, PROMPT_EDITOR_EXTENSIONS } from "../../utils/promptMarkdown";

const ToolbarButton = ({ onClick, isActive, disabled, tooltip, children }: { onClick: () => void; isActive: boolean; disabled: boolean; tooltip: string; children: React.ReactNode }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Toggle
        size="sm"
        pressed={isActive}
        onPressedChange={() => onClick()}
        disabled={disabled}
        aria-label={tooltip}
        className="h-8 w-8 p-0 data-[state=on]:bg-primary/15 data-[state=on]:text-primary hover:bg-muted"
      >
        {children}
      </Toggle>
    </TooltipTrigger>
    <TooltipContent side="top" className="text-xs">
      {tooltip}
    </TooltipContent>
  </Tooltip>
);

interface PromptMarkdownEditorProps {
  /** El texto del prompt con el que arranca. */
  initialMarkdown: string;
  disabled: boolean;
  /** Cada cambio, ya convertido al formato que lee la IA. */
  onChange: (markdown: string) => void;
}

/**
 * Editor de un párrafo de Consideraciones, como el del chat de soporte: se ve
 * el texto formateado y se marca negrita, cursiva, texto exacto y puntos con
 * botones. Lo que se guarda es el formato que lee la IA (promptMarkdown).
 */
export default function PromptMarkdownEditor({ initialMarkdown, disabled, onChange }: PromptMarkdownEditorProps) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    extensions: PROMPT_EDITOR_EXTENSIONS,
    content: markdownToDoc(initialMarkdown),
    editable: !disabled,
    autofocus: "end",
    onUpdate: ({ editor: current }) => onChangeRef.current(docToMarkdown(current.getJSON())),
    editorProps: {
      attributes: {
        "aria-label": "Texto del párrafo",
        class: cn(
          "min-h-[72px] max-h-[420px] overflow-y-auto px-3 py-2 text-sm leading-relaxed focus:outline-none",
          "whitespace-pre-wrap break-words [overflow-wrap:anywhere]",
          "[&_p]:m-0 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_li_p]:m-0",
          "[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground",
          "[&_strong]:font-semibold [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.92em]"
        ),
      },
    },
  });

  const active = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current?.isActive("bold") ?? false,
      italic: current?.isActive("italic") ?? false,
      code: current?.isActive("code") ?? false,
      bulletList: current?.isActive("bulletList") ?? false,
      orderedList: current?.isActive("orderedList") ?? false,
    }),
  });

  if (!editor) return null;
  const run = (fn: (e: Editor) => void) => () => fn(editor);

  return (
    <div className={cn("rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring", disabled && "opacity-50")}>
      <TooltipProvider delayDuration={300}>
        <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 px-1 py-0.5" role="toolbar" aria-label="Formato del texto">
          <ToolbarButton onClick={run((e) => e.chain().focus().toggleBold().run())} isActive={!!active?.bold} disabled={disabled} tooltip="Negrita (Ctrl+B)">
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={run((e) => e.chain().focus().toggleItalic().run())} isActive={!!active?.italic} disabled={disabled} tooltip="Cursiva (Ctrl+I)">
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={run((e) => e.chain().focus().toggleCode().run())} isActive={!!active?.code} disabled={disabled} tooltip="Texto exacto: el bot lo copia tal cual">
            <Code className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={run((e) => e.chain().focus().toggleBulletList().run())} isActive={!!active?.bulletList} disabled={disabled} tooltip="Lista con viñetas">
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={run((e) => e.chain().focus().toggleOrderedList().run())} isActive={!!active?.orderedList} disabled={disabled} tooltip="Lista numerada">
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
        </div>
      </TooltipProvider>
      <EditorContent editor={editor} />
    </div>
  );
}
