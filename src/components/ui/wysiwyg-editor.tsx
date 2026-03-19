import React, { useCallback, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Mark, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Label } from './label';
import { Toggle } from './toggle';
import { Separator } from './separator';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Link as LinkIcon, Unlink, Heading1, Heading2, Heading3,
  Undo, Redo, Highlighter, RemoveFormatting, Quote,
  Code, Code2, Pilcrow, ListChecks, Palette, Tag,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    customClass: {
      setCustomClass: (className: string) => ReturnType;
      unsetCustomClass: () => ReturnType;
    };
  }
}

const CustomClass = Mark.create({
  name: 'customClass',
  addAttributes() {
    return {
      class: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: 'span[class]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0];
  },
  addCommands() {
    return {
      setCustomClass:
        (className: string) =>
        ({ commands }) =>
          commands.setMark(this.name, { class: className }),
      unsetCustomClass:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});

interface WysiwygEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
  toolbar?: 'basic' | 'full';
  disabled?: boolean;
}

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
  <TooltipProvider delayDuration={300}>
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle
          size="sm"
          pressed={isActive}
          onPressedChange={() => onClick()}
          disabled={disabled}
          className="h-8 w-8 p-0 data-[state=on]:bg-primary/15 data-[state=on]:text-primary hover:bg-muted"
        >
          {children}
        </Toggle>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const ToolbarSeparator = () => (
  <Separator orientation="vertical" className="h-6 mx-0.5" />
);

const WysiwygEditor: React.FC<WysiwygEditorProps> = ({
  label,
  value,
  onChange,
  placeholder = '',
  height = '120px',
  toolbar = 'basic',
  disabled = false,
}) => {
  const isInternalChange = useRef(false);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-primary underline cursor-pointer' },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({ placeholder }),
      TaskList,
      TaskItem.configure({ nested: true }),
      CustomClass,
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      isInternalChange.current = true;
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none px-3 py-2 min-h-[80px]',
        style: `height: ${height}; overflow-y: auto;`,
      },
    },
  });

  // Sync external value changes (e.g. async product load)
  useEffect(() => {
    if (editor && !isInternalChange.current && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
    isInternalChange.current = false;
  }, [value, editor]);

  const applyClass = useCallback(() => {
    if (!editor) return;
    const current = editor.getAttributes('customClass').class ?? '';
    const className = window.prompt('Clase CSS:', current);
    if (className === null) return;
    if (className === '') {
      editor.chain().focus().unsetCustomClass().run();
      return;
    }
    editor.chain().focus().setCustomClass(className).run();
  }, [editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL del enlace:', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  const isFull = toolbar === 'full';

  return (
    <div>
      <Label>{label}</Label>
      <div className={`mt-2 border border-border rounded-lg overflow-hidden bg-background shadow-sm ${disabled ? 'opacity-70' : ''}`}>
        {/* Toolbar */}
        {!disabled && (
          <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-muted/40 border-b border-border">

            {/* Undo / Redo */}
            <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} tooltip="Deshacer">
              <Undo className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} tooltip="Rehacer">
              <Redo className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarSeparator />

            {/* Bold / Italic / Underline / Strike */}
            <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} tooltip="Negrita">
              <Bold className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} tooltip="Cursiva">
              <Italic className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} tooltip="Subrayado">
              <UnderlineIcon className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} tooltip="Tachado">
              <Strikethrough className="h-4 w-4" />
            </ToolbarButton>

            {/* Color + Highlight (full only) */}
            {isFull && (
              <>
                <ToolbarSeparator />
                <div className="relative">
                  <ToolbarButton tooltip="Color de texto" onClick={() => colorInputRef.current?.click()}>
                    <Palette className="h-4 w-4" />
                  </ToolbarButton>
                  <input
                    ref={colorInputRef}
                    type="color"
                    className="absolute opacity-0 w-0 h-0 pointer-events-none"
                    onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                  />
                </div>
                <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive('highlight')} tooltip="Resaltado">
                  <Highlighter className="h-4 w-4" />
                </ToolbarButton>
              </>
            )}

            {/* Headings + Paragraph (full only) */}
            {isFull && (
              <>
                <ToolbarSeparator />
                <ToolbarButton onClick={() => editor.chain().focus().setParagraph().run()} isActive={editor.isActive('paragraph')} tooltip="Párrafo">
                  <Pilcrow className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} tooltip="Título 1">
                  <Heading1 className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} tooltip="Título 2">
                  <Heading2 className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} tooltip="Título 3">
                  <Heading3 className="h-4 w-4" />
                </ToolbarButton>
              </>
            )}

            {/* Blockquote / Code / CodeBlock (full only) */}
            {isFull && (
              <>
                <ToolbarSeparator />
                <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} tooltip="Cita">
                  <Quote className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} tooltip="Código inline">
                  <Code className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} tooltip="Bloque de código">
                  <Code2 className="h-4 w-4" />
                </ToolbarButton>
              </>
            )}

            <ToolbarSeparator />

            {/* Lists */}
            <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} tooltip="Lista con viñetas">
              <List className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} tooltip="Lista numerada">
              <ListOrdered className="h-4 w-4" />
            </ToolbarButton>
            {isFull && (
              <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')} tooltip="Lista de tareas">
                <ListChecks className="h-4 w-4" />
              </ToolbarButton>
            )}

            {/* Text align (full only) */}
            {isFull && (
              <>
                <ToolbarSeparator />
                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} tooltip="Alinear izquierda">
                  <AlignLeft className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} tooltip="Centrar">
                  <AlignCenter className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} tooltip="Alinear derecha">
                  <AlignRight className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })} tooltip="Justificar">
                  <AlignJustify className="h-4 w-4" />
                </ToolbarButton>
              </>
            )}

            <ToolbarSeparator />

            {/* Link / Unlink */}
            <ToolbarButton onClick={setLink} isActive={editor.isActive('link')} tooltip="Agregar enlace">
              <LinkIcon className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().unsetLink().run()} disabled={!editor.isActive('link')} tooltip="Quitar enlace">
              <Unlink className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={applyClass} isActive={editor.isActive('customClass')} tooltip="Clase CSS">
              <Tag className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarSeparator />

            {/* Clear formatting */}
            <ToolbarButton onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} tooltip="Limpiar formato">
              <RemoveFormatting className="h-4 w-4" />
            </ToolbarButton>

          </div>
        )}

        {/* Editor */}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default WysiwygEditor;
