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
      <div className={`mt-2 border border-border rounded-lg overflow-hidden bg-background shadow-sm ${disabled ? 'opacity-70' : ''}`}>
        {/* Toolbar */}
        {!disabled && (
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-muted/40 border-b border-border">
          {/* Undo/Redo */}
          <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} tooltip="Deshacer">
            <Undo className="h-4 w-4" />
          </ToolbarButton>
...
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
