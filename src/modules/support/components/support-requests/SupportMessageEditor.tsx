import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import { Extension, type Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Code,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  RemoveFormatting,
  Strikethrough,
} from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/shared/utils/utils";
import { docToMarkdown, markdownToDoc } from "../../utils/supportMarkdown";

export interface SupportMessageEditorHandle {
  focus: () => void;
  clear: () => void;
}

interface SupportMessageEditorProps {
  /** Texto (Markdown) con el que arranca: el borrador guardado. */
  initialMarkdown: string;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  /** Cada cambio, ya convertido al texto que se envía. */
  onChange: (markdown: string) => void;
  /** Enter (fuera de una lista) o Ctrl/Cmd+Enter. */
  onSubmit: () => void;
  /** Archivos pegados: van como adjuntos, nunca incrustados en el texto. */
  onPasteFiles: (files: File[]) => void;
}

/** Unas 6 líneas de text-sm/leading-6 más el padding vertical. */
const MAX_HEIGHT_PX = 6 * 24 + 16;

/**
 * Enter envía, como en cualquier chat. Dentro de una lista Enter crea el
 * siguiente elemento (y en uno vacío sale de la lista), y mientras se compone
 * un carácter (acentos, IME) no hace nada. Shift+Enter es salto de línea.
 */
const SubmitOnEnter = Extension.create<{ onSubmit: () => void; onLink: () => void }>({
  name: "submitOnEnter",
  // Antes que los atajos de párrafo y lista, para decidir primero
  priority: 1000,
  addOptions() {
    return { onSubmit: () => undefined, onLink: () => undefined };
  },
  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        if (editor.view.composing) return false;
        if (editor.isActive("listItem")) return false;
        this.options.onSubmit();
        return true;
      },
      // Fuera de una lista, Shift+Enter abre un párrafo nuevo (no un <br>): así
      // "- " o "1. " al empezar la línea arman una lista. Para el texto que se
      // envía da igual: los dos son un salto de línea.
      "Shift-Enter": ({ editor }) => {
        if (editor.view.composing) return false;
        if (editor.isActive("listItem")) return false;
        return editor.commands.splitBlock();
      },
      "Mod-Enter": () => {
        this.options.onSubmit();
        return true;
      },
      "Mod-k": () => {
        this.options.onLink();
        return true;
      },
    };
  },
});

const ToolbarButton = ({
  onClick,
  isActive = false,
  disabled = false,
  tooltip,
  children,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  tooltip: string;
  children: React.ReactNode;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Toggle
        size="sm"
        pressed={isActive}
        onPressedChange={() => onClick()}
        disabled={disabled}
        aria-label={tooltip}
        // Mismo aspecto que la barra del editor de Productos
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

/**
 * Editor del chat de soporte. Usa TipTap como el editor de Productos, pero con
 * solo los formatos que se pueden escribir como texto plano (ver
 * supportMarkdown): negrita, cursiva, tachado, código, listas y enlaces. Sin
 * color, subrayado, títulos ni imágenes incrustadas: Tasks no podría
 * mostrarlos. El editor compartido de `components/ui` no se toca.
 */
export const SupportMessageEditor = forwardRef<SupportMessageEditorHandle, SupportMessageEditorProps>(
  (
    { initialMarkdown, placeholder, disabled = false, invalid = false, onChange, onSubmit, onPasteFiles },
    ref,
  ) => {
    // Callbacks en refs: TipTap guarda los handlers al crearse
    const onChangeRef = useRef(onChange);
    const onSubmitRef = useRef(onSubmit);
    const onPasteFilesRef = useRef(onPasteFiles);
    const setLinkRef = useRef<() => void>(() => undefined);
    onChangeRef.current = onChange;
    onSubmitRef.current = onSubmit;
    onPasteFilesRef.current = onPasteFiles;

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: false,
          blockquote: false,
          codeBlock: false,
          horizontalRule: false,
          underline: false,
          link: {
            openOnClick: false,
            autolink: true,
            linkOnPaste: true,
            protocols: ["http", "https", "mailto"],
            HTMLAttributes: { class: "underline underline-offset-2", rel: "noopener noreferrer" },
          },
        }),
        Placeholder.configure({ placeholder: placeholder ?? "" }),
        SubmitOnEnter.configure({
          onSubmit: () => onSubmitRef.current(),
          onLink: () => setLinkRef.current(),
        }),
      ],
      content: markdownToDoc(initialMarkdown),
      editable: !disabled,
      onUpdate: ({ editor: current }) => {
        onChangeRef.current(docToMarkdown(current.getJSON()));
      },
      editorProps: {
        attributes: {
          "aria-label": placeholder ?? "Mensaje",
          "aria-multiline": "true",
          role: "textbox",
          class: cn(
            "min-h-[40px] overflow-y-auto px-3 py-2 text-sm leading-6 focus:outline-none",
            // Palabras y URLs largas bajan de línea: el editor nunca se ensancha
            "whitespace-pre-wrap break-words [overflow-wrap:anywhere]",
            "[&_p]:m-0 [&_ul]:my-1 [&_ol]:my-1 [&_li]:mb-0.5 [&_li_p]:m-0",
            "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em]",
          ),
          style: `max-height: ${MAX_HEIGHT_PX}px;`,
        },
        handlePaste: (_view, event) => {
          const files = Array.from(event.clipboardData?.files ?? []);
          if (files.length === 0) return false; // texto: lo pega el editor
          event.preventDefault();
          onPasteFilesRef.current(files);
          return true;
        },
      },
    });

    // El estado de los botones se lee aparte: el editor no re-renderiza por tecla
    const active = useEditorState({
      editor,
      selector: ({ editor: current }) => ({
        bold: current?.isActive("bold") ?? false,
        italic: current?.isActive("italic") ?? false,
        strike: current?.isActive("strike") ?? false,
        code: current?.isActive("code") ?? false,
        bulletList: current?.isActive("bulletList") ?? false,
        orderedList: current?.isActive("orderedList") ?? false,
        link: current?.isActive("link") ?? false,
      }),
    });

    useEffect(() => {
      editor?.setEditable(!disabled);
    }, [disabled, editor]);

    const setLink = useCallback(() => {
      if (!editor) return;
      const previous = editor.getAttributes("link").href as string | undefined;
      const url = window.prompt("URL del enlace (https://…):", previous ?? "");
      if (url === null) return;
      const trimmed = url.trim();
      if (trimmed === "") {
        editor.chain().focus().extendMarkRange("link").unsetLink().run();
        return;
      }
      // Solo enlaces que Tasks y el chat aceptan
      const href = /^(https?:\/\/|mailto:)/i.test(trimmed) ? trimmed : `https://${trimmed}`;
      if (editor.state.selection.empty && !editor.isActive("link")) {
        editor
          .chain()
          .focus()
          .insertContent({ type: "text", text: href, marks: [{ type: "link", attrs: { href } }] })
          .run();
        return;
      }
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    }, [editor]);
    setLinkRef.current = setLink;

    useImperativeHandle(
      ref,
      () => ({
        focus: () => editor?.commands.focus("end"),
        clear: () => {
          editor?.commands.clearContent(true);
          editor?.commands.focus();
        },
      }),
      [editor],
    );

    if (!editor) return null;

    const run = (fn: (e: Editor) => void) => () => fn(editor);

    return (
      <div
        className={cn(
          "min-w-0 rounded-md border border-input bg-background ring-offset-background",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          invalid && "border-destructive focus-within:ring-destructive",
          disabled && "opacity-50",
          // Placeholder de TipTap (clase is-editor-empty en el primer párrafo)
          "[&_p.is-editor-empty:first-child]:before:pointer-events-none [&_p.is-editor-empty:first-child]:before:float-left",
          "[&_p.is-editor-empty:first-child]:before:h-0 [&_p.is-editor-empty:first-child]:before:text-muted-foreground",
          "[&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
        )}
      >
        <TooltipProvider delayDuration={300}>
          <div
            className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 px-1 py-0.5"
            role="toolbar"
            aria-label="Formato del mensaje"
          >
            <ToolbarButton onClick={run((e) => e.chain().focus().toggleBold().run())} isActive={active?.bold} disabled={disabled} tooltip="Negrita (Ctrl+B)">
              <Bold className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={run((e) => e.chain().focus().toggleItalic().run())} isActive={active?.italic} disabled={disabled} tooltip="Cursiva (Ctrl+I)">
              <Italic className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={run((e) => e.chain().focus().toggleStrike().run())} isActive={active?.strike} disabled={disabled} tooltip="Tachado (Ctrl+Shift+S)">
              <Strikethrough className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={run((e) => e.chain().focus().toggleCode().run())} isActive={active?.code} disabled={disabled} tooltip="Código (Ctrl+E)">
              <Code className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={run((e) => e.chain().focus().toggleBulletList().run())} isActive={active?.bulletList} disabled={disabled} tooltip="Lista con viñetas">
              <List className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={run((e) => e.chain().focus().toggleOrderedList().run())} isActive={active?.orderedList} disabled={disabled} tooltip="Lista numerada">
              <ListOrdered className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={setLink} isActive={active?.link} disabled={disabled} tooltip="Enlace (Ctrl+K)">
              <LinkIcon className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={run((e) => e.chain().focus().clearNodes().unsetAllMarks().run())} disabled={disabled} tooltip="Limpiar formato">
              <RemoveFormatting className="h-4 w-4" />
            </ToolbarButton>
          </div>
        </TooltipProvider>

        <EditorContent editor={editor} />
      </div>
    );
  },
);
SupportMessageEditor.displayName = "SupportMessageEditor";
