import React, { useCallback, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import { Label } from './label';
import { Toggle } from './toggle';
import { Separator } from './separator';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Link as LinkIcon, Unlink, Heading1, Heading2, Heading3,
  Undo, Redo, Highlighter, RemoveFormatting, Quote,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

interface WysiwygEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
  toolbar?: 'basic' | 'full';
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

const WysiwygEditor: React.FC<WysiwygEditorProps> = ({
  label,
  value,
  onChange,
  placeholder = '',
  height = '120px',
  toolbar = 'basic',
}) => {
  const isInternalChange = useRef(false);

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
    ],
    content: value,
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

  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-2 border border-border rounded-lg overflow-hidden bg-background shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-muted/40 border-b border-border">
          {/* Undo/Redo */}
          <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} tooltip="Deshacer">
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} tooltip="Rehacer">
            <Redo className="h-4 w-4" />
          </ToolbarButton>

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Headings (full only) */}
          {toolbar === 'full' && (
            <>
              <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} tooltip="Título 1">
                <Heading1 className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} tooltip="Título 2">
                <Heading2 className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} tooltip="Título 3">
                <Heading3 className="h-4 w-4" />
              </ToolbarButton>
              <Separator orientation="vertical" className="mx-1 h-6" />
            </>
          )}

          {/* Text formatting */}
          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} tooltip="Negrita">
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} tooltip="Cursiva">
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} tooltip="Subrayado">
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
          {toolbar === 'full' && (
            <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} tooltip="Tachado">
              <Strikethrough className="h-4 w-4" />
            </ToolbarButton>
          )}

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Highlight (full only) */}
          {toolbar === 'full' && (
            <>
              <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()} isActive={editor.isActive('highlight')} tooltip="Resaltar">
                <Highlighter className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} tooltip="Cita">
                <Quote className="h-4 w-4" />
              </ToolbarButton>
              <Separator orientation="vertical" className="mx-1 h-6" />
            </>
          )}

          {/* Lists */}
          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} tooltip="Lista">
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} tooltip="Lista numerada">
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>

          {/* Alignment (full only) */}
          {toolbar === 'full' && (
            <>
              <Separator orientation="vertical" className="mx-1 h-6" />
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

          <Separator orientation="vertical" className="mx-1 h-6" />

          {/* Link */}
          <ToolbarButton onClick={setLink} isActive={editor.isActive('link')} tooltip="Enlace">
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
          {editor.isActive('link') && (
            <ToolbarButton onClick={() => editor.chain().focus().unsetLink().run()} tooltip="Quitar enlace">
              <Unlink className="h-4 w-4" />
            </ToolbarButton>
          )}

          {/* Clear formatting */}
          <ToolbarButton onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} tooltip="Limpiar formato">
            <RemoveFormatting className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Editor */}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default WysiwygEditor;
