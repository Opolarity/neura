// Visibilidad por dispositivo: los tres interruptores para ocultar el
// componente seleccionado en escritorio, tableta o celular.
//
// Es una seccion propia del panel, comun a todos los componentes y siempre la
// ultima: no la monta cada componente, sino el propio panel (ver
// settings-panel.tsx). Lee y escribe las props del nodo seleccionado
// directamente desde craft.js, asi que no necesita que cada componente le pase
// nada.

import { useId } from "react"
import { useEditor } from "@craftjs/core"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { FieldLabel } from "@/modules/ecommerce/editor/components/field-label"
import { SettingsSection } from "@/modules/ecommerce/editor/components/settings-section"
import { Monitor, Tablet, Smartphone } from "lucide-react"

export type VisibilityKey = "hiddenOnDesktop" | "hiddenOnTablet" | "hiddenOnMobile"

/** Las props de visibilidad del nodo seleccionado y su setter. */
function useDeviceVisibility() {
  const { selected, actions } = useEditor((state) => {
    const nodeIdSet = state.events.selected
    if (!nodeIdSet) return { selected: null }

    const nodeId = Array.from(nodeIdSet)[0]
    if (!nodeId) return { selected: null }

    const node = state.nodes[nodeId]
    if (!node) return { selected: null }

    return {
      selected: {
        id: nodeId,
        hiddenOnDesktop: (node.data.props.hiddenOnDesktop as boolean) ?? false,
        hiddenOnTablet: (node.data.props.hiddenOnTablet as boolean) ?? false,
        hiddenOnMobile: (node.data.props.hiddenOnMobile as boolean) ?? false,
      },
    }
  })

  const setVisibility = (key: VisibilityKey, value: boolean) => {
    if (!selected) return
    actions.setProp(selected.id, (props: Record<string, unknown>) => {
      props[key] = value
    })
  }

  const anyHidden =
    !!selected &&
    (selected.hiddenOnDesktop || selected.hiddenOnTablet || selected.hiddenOnMobile)

  return { selected, setVisibility, anyHidden }
}

/** Aviso para la cabecera de la seccion, visible aunque este contraida. */
export function VisibilityBadge({ hidden }: { hidden: boolean }) {
  if (!hidden) return null
  return (
    <span className="text-[11px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium">
      Oculto
    </span>
  )
}

function HiddenBadge() {
  const { anyHidden } = useDeviceVisibility()
  return <VisibilityBadge hidden={anyHidden} />
}

const DISPOSITIVOS: { key: VisibilityKey; icon: typeof Monitor; label: string }[] = [
  { key: "hiddenOnDesktop", icon: Monitor, label: "Escritorio (≥1024px)" },
  { key: "hiddenOnTablet", icon: Tablet, label: "Tableta (768–1023px)" },
  { key: "hiddenOnMobile", icon: Smartphone, label: "Celular (<768px)" },
]

function DeviceVisibilityFields() {
  const { selected, setVisibility } = useDeviceVisibility()
  if (!selected) return null
  return <VisibilityFields values={selected} onChange={setVisibility} />
}

/**
 * Los tres interruptores, sin la seccion ni el nodo seleccionado: leen de
 * `values` y avisan con `onChange`. Lo usa lo que no es un bloque de craft,
 * como la config de un popup.
 */
export function VisibilityFields({
  values,
  onChange,
  help = "Activa para ocultar este componente en ese dispositivo. En el editor siempre es visible.",
}: {
  values: Record<VisibilityKey, boolean>
  onChange: (key: VisibilityKey, value: boolean) => void
  help?: string
}) {
  const idBase = useId()

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel helpLabel="Cómo funciona la visibilidad por dispositivo" help={help}>
        Visibilidad
      </FieldLabel>
      <div className="flex flex-col gap-3">
        {DISPOSITIVOS.map(({ key, icon: Icon, label }) => (
          <div key={key} className="flex items-center justify-between">
            <Label
              htmlFor={`${idBase}-${key}`}
              className="flex items-center gap-2 text-[11px] font-normal text-foreground/80"
            >
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{label}</span>
            </Label>
            <Switch
              id={`${idBase}-${key}`}
              checked={values[key]}
              onCheckedChange={(val) => onChange(key, val)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * La seccion completa, tal como la monta el panel. Va detras del settings del
 * componente, sea cual sea, de modo que todos la tienen sin declararla.
 */
export function VisibilitySettings() {
  const { selected } = useDeviceVisibility()
  if (!selected) return null

  return (
    <div className="flex flex-col">
      <SettingsSection
        title="Visibilidad por dispositivo"
        // Cierra el bloque de secciones: siempre es la ultima del panel.
        className="border-b"
        badge={<HiddenBadge />}
      >
        <div className="flex flex-col gap-3">
          <DeviceVisibilityFields />
        </div>
      </SettingsSection>
    </div>
  )
}
