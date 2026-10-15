// La seccion Avanzado del panel de propiedades.
//
// Es la misma para todos los componentes, asi que vive aqui y no repetida en
// cada uno. Va siempre la ultima seccion del componente; detras de ella el
// panel monta la de visibilidad por dispositivo, que es la que cierra.
//
// Trae la clase CSS, un identificador opcional y un campo de CSS libre (un
// editor de codigo con autocompletado, ver css-code-editor.tsx).

import { useId, useRef, type ReactNode } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FieldLabel } from "@/modules/ecommerce/editor/components/field-label"
import { CssCodeEditor, type CssCodeEditorHandle } from "@/modules/ecommerce/editor/components/css-code-editor"
import { SettingsSection } from "@/modules/ecommerce/editor/components/settings-section"

/**
 * La palabra que, dentro del CSS libre, representa al propio componente. Es la
 * misma que usa Elementor, y la razon de que exista es que cada componente se
 * pinta con una clase distinta generada al vuelo: sin un nombre fijo al que
 * apuntar no habria forma de escribirle reglas a mano.
 */
export const CSS_SELECTOR_KEYWORD = "selector"

/**
 * Pasa el CSS escrito a mano a reglas aplicables.
 *
 * Cambia la palabra reservada por la clase real del componente y desactiva
 * cualquier intento de cerrar la etiqueta <style>. Eso ultimo no es teorico: un
 * "</style>" dentro del texto terminaria el bloque y lo que viniera detras se
 * interpretaria como HTML dentro de la tienda publica.
 *
 * No valida el CSS. Una regla mal escrita la descarta el navegador por su
 * cuenta, que es lo mismo que pasaria escribiendola en una hoja de estilos.
 */
export function compileCustomCss(css: string | undefined, className: string) {
  if (!css) return ""
  const seguro = css.replace(/</g, "\\3C ")
  // La palabra tiene que ir suelta, y "suelta" en CSS no es lo mismo que para
  // un \b de toda la vida: el guion y el guion bajo forman parte de los
  // nombres de clase, asi que sin esto una clase como ".mi-selector" se
  // partiria por la mitad. El caracter de delante se captura y se repone.
  return seguro.replace(
    new RegExp(`(^|[^\\w-])${CSS_SELECTOR_KEYWORD}(?![\\w-])`, "g"),
    (_, anterior: string) => `${anterior}.${className}`,
  )
}

/**
 * La clase propia del componente y el bloque de estilos con su CSS libre.
 *
 * La clase se genera aunque no haya CSS escrito: tiene que ser estable entre
 * renders para que las reglas no dejen de aplicarse al reescribirlas.
 */
export function useCustomCss(css: string | undefined) {
  const id = useId()
  const className = `ec-${id.replace(/:/g, "")}`
  const reglas = compileCustomCss(css, className)
  return {
    className,
    customCssTag: reglas ? <style>{reglas}</style> : null,
  }
}

export function AdvancedSection({
  customClass,
  onCustomClassChange,
  customCss,
  onCustomCssChange,
  elementId,
  onElementIdChange,
  idLabel = "Id",
  idHelp,
  classHelp,
  children,
}: {
  customClass: string
  onCustomClassChange: (value: string) => void
  /** Ayuda del campo de clase (va en tooltip), para lo propio del componente. */
  classHelp?: ReactNode
  customCss: string
  onCustomCssChange: (value: string) => void
  /**
   * El identificador del elemento en el HTML. Solo lo ofrecen los componentes
   * que de verdad lo guardan: de el dependen los enlaces ancla y los
   * disparadores de modales, y anadirlo a uno que no lo aplica no haria nada.
   */
  elementId?: string
  onElementIdChange?: (value: string) => void
  idLabel?: string
  idHelp?: ReactNode
  /** Campos propios del componente, si los tuviera. */
  children?: ReactNode
}) {
  const claseId = useId()
  const cssId = useId()
  const idCampo = useId()
  const editorCss = useRef<CssCodeEditorHandle>(null)
  const ofreceId = elementId !== undefined && onElementIdChange !== undefined

  return (
    <SettingsSection title="Avanzado">
      <div className="flex flex-col gap-3">
        {ofreceId && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={idCampo} className="text-[11px] text-foreground/80">
              {idLabel}
            </Label>
            <Input
              id={idCampo}
              className="h-8 text-[12px] md:text-[12px]"
              value={elementId}
              placeholder="ej: ofertas"
              onChange={(e) => onElementIdChange?.(e.target.value)}
            />
            {idHelp}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor={claseId} help={classHelp} helpLabel="Para qué sirve la clase">
            Clase(s) CSS
          </FieldLabel>
          <Input
            id={claseId}
            className="h-8 text-[12px] md:text-[12px]"
            value={customClass}
            placeholder="ej: mi-clase"
            onChange={(e) => onCustomClassChange(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel
            htmlFor={cssId}
            onClick={() => editorCss.current?.focus()}
            helpLabel="Cómo escribir el CSS personalizado"
            help={
              <>
                Escribe <code className="font-mono">{CSS_SELECTOR_KEYWORD}</code>{" "}
                para referirte a este componente. Todo lo que pongas dentro se le
                aplica solo a él.
              </>
            }
          >
            CSS personalizado
          </FieldLabel>
          <CssCodeEditor
            ref={editorCss}
            id={cssId}
            value={customCss}
            placeholder={`${CSS_SELECTOR_KEYWORD} { color: red; }`}
            keyword={CSS_SELECTOR_KEYWORD}
            onChange={onCustomCssChange}
          />
        </div>

        {children}
      </div>
    </SettingsSection>
  )
}
