// Editor de CSS para el campo "CSS personalizado" de la seccion Avanzado.
//
// Es CodeMirror montado a mano (sin wrapper de React) para no arrastrar otra
// dependencia: se crea la vista una vez, se le pasan los cambios por un
// listener y, si el valor cambia desde fuera (deshacer del editor, pegar un
// componente), se reemplaza el documento entero.
//
// Ademas del autocompletado de CSS que trae el lenguaje (propiedades, valores,
// pseudoclases), ofrece la palabra reservada del componente: en posicion de
// selector se sugiere igual que si fuera un nombre de etiqueta.

import { forwardRef, useEffect, useId, useImperativeHandle, useRef } from "react"
import { EditorState } from "@codemirror/state"
import {
  EditorView,
  keymap,
  placeholder as placeholderExt,
} from "@codemirror/view"
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands"
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
  type CompletionContext,
  type CompletionResult,
} from "@codemirror/autocomplete"
import { css, cssLanguage } from "@codemirror/lang-css"
import {
  defaultHighlightStyle,
  syntaxHighlighting,
  syntaxTree,
} from "@codemirror/language"
import { cn } from "@/shared/utils/utils"

/**
 * Sugiere la palabra reservada del componente cuando el cursor esta en
 * posicion de selector: fuera de cualquier bloque `{ }`.
 *
 * El parser de CSS lee una palabra suelta a ese nivel como TagName, que es lo
 * mismo que hace el autocompletado propio del lenguaje para sugerir etiquetas
 * (div, span...). Aqui se anade la palabra a esa misma posicion; dentro de un
 * bloque no se ofrece, porque alli lo que toca son propiedades.
 */
function completarPalabraReservada(keyword: string) {
  return (context: CompletionContext): CompletionResult | null => {
    const node = syntaxTree(context.state).resolveInner(context.pos, -1)
    for (let n: typeof node | null = node; n; n = n.parent) {
      if (n.name === "Block") return null
    }
    const palabra = context.matchBefore(/[\w-]*/)
    if (!palabra) return null
    if (palabra.from === palabra.to && !context.explicit) return null
    return {
      from: palabra.from,
      options: [
        {
          label: keyword,
          type: "class",
          detail: "este componente",
          boost: 99,
        },
      ],
      validFor: /^[\w-]*$/,
    }
  }
}

const tema = EditorView.theme({
  "&": {
    fontSize: "12px",
    backgroundColor: "hsl(var(--background))",
    color: "hsl(var(--foreground))",
  },
  ".cm-scroller": {
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    lineHeight: "1.5",
    minHeight: "6rem",
  },
  ".cm-content": { padding: "8px 0" },
  ".cm-line": { padding: "0 12px" },
  "&.cm-focused": { outline: "none" },
  ".cm-placeholder": { color: "hsl(var(--muted-foreground))" },
  ".cm-activeLine": { backgroundColor: "transparent" },
  ".cm-tooltip": {
    border: "1px solid hsl(var(--border))",
    backgroundColor: "hsl(var(--popover))",
    color: "hsl(var(--popover-foreground))",
    borderRadius: "6px",
    fontSize: "12px",
  },
  ".cm-tooltip.cm-tooltip-autocomplete > ul": {
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
  ".cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]": {
    backgroundColor: "hsl(var(--accent))",
    color: "hsl(var(--accent-foreground))",
  },
})

export type CssCodeEditorHandle = {
  /**
   * Enfoca el area editable. Hace falta porque un label con htmlFor no puede
   * enfocarla: el contenteditable de CodeMirror no es un elemento etiquetable.
   */
  focus: () => void
}

export const CssCodeEditor = forwardRef<
  CssCodeEditorHandle,
  {
  id?: string
  value: string
  onChange: (value: string) => void
  /**
   * En una sola linea: CodeMirror lo pinta dentro de la primera linea del
   * documento, y con saltos de linea esa linea (y el cursor) crecen hasta
   * abarcarlos todos.
   */
  placeholder?: string
  /** Palabra que se sugiere en posicion de selector, si la hay. */
  keyword?: string
  className?: string
  }
>(function CssCodeEditor(
  { id, value, onChange, placeholder, keyword, className },
  ref,
) {
  const contenedor = useRef<HTMLDivElement>(null)
  const vista = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const idGenerado = useId()
  useImperativeHandle(ref, () => ({ focus: () => vista.current?.focus() }), [])

  useEffect(() => {
    if (!contenedor.current) return
    const extensiones = [
      history(),
      closeBrackets(),
      autocompletion(),
      css(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      keymap.of([
        ...closeBracketsKeymap,
        ...completionKeymap,
        ...historyKeymap,
        ...defaultKeymap,
        indentWithTab,
      ]),
      EditorView.lineWrapping,
      tema,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) onChangeRef.current(update.state.doc.toString())
      }),
    ]
    if (placeholder) extensiones.push(placeholderExt(placeholder))
    if (keyword) {
      extensiones.push(
        cssLanguage.data.of({ autocomplete: completarPalabraReservada(keyword) }),
      )
    }
    const view = new EditorView({
      state: EditorState.create({ doc: value, extensions: extensiones }),
      parent: contenedor.current,
    })
    vista.current = view
    return () => {
      view.destroy()
      vista.current = null
    }
    // El valor inicial y el placeholder no cambian la vista una vez creada; el
    // valor se sincroniza en el efecto de abajo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword])

  useEffect(() => {
    const view = vista.current
    if (!view) return
    const actual = view.state.doc.toString()
    if (actual === value) return
    view.dispatch({
      changes: { from: 0, to: actual.length, insert: value },
    })
  }, [value])

  return (
    <div
      id={id ?? idGenerado}
      ref={contenedor}
      className={cn(
        "w-full overflow-hidden rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        className,
      )}
    />
  )
})
