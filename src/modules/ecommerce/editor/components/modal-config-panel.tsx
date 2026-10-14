// El panel de un popup, con las secciones del resto de bloques: primero
// Contenido, con lo que es solo del popup (presentacion, fondo de pagina,
// animacion, cierre y disparador), y despues las compartidas, que leen y
// escriben el marco en `config.style` (ver lib/popup-presets.ts).

import type { ReactNode } from "react"
import {
  type ModalConfig,
  type PopupAnimation,
  type PopupPresentation,
  type PopupShadow,
  type PopupSide,
} from "@/modules/ecommerce/editor/lib/editor-store"
import {
  POPUP_ANIMATIONS,
  POPUP_APPEARANCE_LEGACY,
  POPUP_PRESENTATIONS,
  POPUP_PRESETS,
  POPUP_SHADOWS,
  overlayColorOf,
  ownPresentationOf,
  ownSideOf,
  popupBorderLegacy,
  popupSpacingLegacy,
  presentationFor,
  sideFor,
  withPresentation,
} from "@/modules/ecommerce/editor/lib/popup-presets"
import { AdvancedSection } from "@/modules/ecommerce/editor/components/advanced-section"
import { AppearanceFields } from "@/modules/ecommerce/editor/components/appearance-section"
import { BorderFields } from "@/modules/ecommerce/editor/components/border-section"
import { ColorField } from "@/modules/ecommerce/editor/components/color-field"
import { PanelField } from "@/modules/ecommerce/editor/components/panel-field"
import { ResponsiveField } from "@/modules/ecommerce/editor/components/responsive-field"
import { SettingsSection } from "@/modules/ecommerce/editor/components/settings-section"
import { SpacingFields } from "@/modules/ecommerce/editor/components/spacing-section"
import { useViewport, type Viewport } from "@/modules/ecommerce/editor/components/viewport-context"
import {
  VisibilityBadge,
  VisibilityFields,
  type VisibilityKey,
} from "@/modules/ecommerce/editor/components/visibility-settings"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ModalConfigPanelProps {
  config: ModalConfig
  onChange: (config: ModalConfig) => void
}

const INPUT_CLASS = "h-8 text-[12px] md:text-[12px]"
const TRIGGER_CLASS = "h-8 text-[12px]"
// Valor del desplegable para "sin valor propio": Radix no admite "" en un item.
const HEREDA = "__hereda"

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-[11px] text-foreground/80">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

/** Un bloque de Contenido con su titulo, separado del anterior. */
function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-t border-border pt-3 first:border-t-0 first:pt-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  )
}

const MODO_MAYOR: Record<Exclude<Viewport, "desktop">, string> = {
  tablet: "escritorio",
  mobile: "tableta",
}

export function ModalConfigPanel({ config, onChange }: ModalConfigPanelProps) {
  const viewport = useViewport() ?? "desktop"
  const set = <K extends keyof ModalConfig>(key: K, value: ModalConfig[K]) =>
    onChange({ ...config, [key]: value })

  /** Escribe en el marco, igual que setProp en un bloque. */
  const writeStyle = (cambio: (p: Record<string, unknown>) => void) => {
    const style = { ...config.style }
    cambio(style)
    onChange({ ...config, style })
  }

  const presentation = presentationFor(config, viewport)
  const preset = POPUP_PRESETS[presentation]

  const setPresentation = (activeViewport: Viewport, value: string) => {
    if (activeViewport === "desktop") {
      onChange(withPresentation(config, value as PopupPresentation))
      return
    }
    const key = activeViewport === "tablet" ? "presentationTablet" : "presentationMobile"
    set(key, value === HEREDA ? "" : (value as PopupPresentation))
  }

  const setSide = (activeViewport: Viewport, value: string) => {
    if (activeViewport === "desktop") {
      set("side", value as PopupSide)
      return
    }
    const key = activeViewport === "tablet" ? "sideTablet" : "sideMobile"
    set(key, value === HEREDA ? "" : (value as PopupSide))
  }

  const visibility = {
    hiddenOnDesktop: Boolean(config.style.hiddenOnDesktop),
    hiddenOnTablet: Boolean(config.style.hiddenOnTablet),
    hiddenOnMobile: Boolean(config.style.hiddenOnMobile),
  }

  return (
    <div className="flex flex-col">
      <SettingsSection title="Contenido" className="border-t-0" defaultOpen>
        <div className="flex flex-col gap-3">
          <Group title="Presentación">
            <ResponsiveField label="Tipo">
              {(activeViewport, id) => {
                const own = ownPresentationOf(config, activeViewport)
                const heredada = activeViewport !== "desktop" && !own
                return (
                  <Select
                    value={heredada ? HEREDA : presentationFor(config, activeViewport)}
                    onValueChange={(v) => setPresentation(activeViewport, v)}
                  >
                    <SelectTrigger id={id} className={TRIGGER_CLASS}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {activeViewport !== "desktop" && (
                        <SelectItem className="text-[12px]" value={HEREDA}>
                          Igual que {MODO_MAYOR[activeViewport]} (
                          {POPUP_PRESETS[presentationFor(config, activeViewport === "tablet" ? "desktop" : "tablet")].label})
                        </SelectItem>
                      )}
                      {POPUP_PRESENTATIONS.map((p) => (
                        <SelectItem key={p} className="text-[12px]" value={p}>
                          {POPUP_PRESETS[p].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )
              }}
            </ResponsiveField>
            <p className="text-[11px] text-muted-foreground">{preset.description}</p>

            {preset.sides.length > 0 && (
              <ResponsiveField label="Posición">
                {(activeViewport, id) => {
                  const own = ownSideOf(config, activeViewport)
                  const sides = POPUP_PRESETS[presentationFor(config, activeViewport)].sides
                  const heredada =
                    activeViewport !== "desktop" && (!own || !sides.some((s) => s.value === own))
                  return (
                    <Select
                      value={heredada ? HEREDA : sideFor(config, activeViewport)}
                      onValueChange={(v) => setSide(activeViewport, v)}
                    >
                      <SelectTrigger id={id} className={TRIGGER_CLASS}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {activeViewport !== "desktop" && (
                          <SelectItem className="text-[12px]" value={HEREDA}>
                            Igual que {MODO_MAYOR[activeViewport]}
                          </SelectItem>
                        )}
                        {sides.map((s) => (
                          <SelectItem key={s.value} className="text-[12px]" value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )
                }}
              </ResponsiveField>
            )}
          </Group>

          {/* Pantalla completa ya tapa la pagina entera: un fondo detras no se
              veria. */}
          {presentation !== "fullscreen" && (
            <Group title="Fondo de la página">
              <ToggleRow
                label="Oscurecer la página"
                checked={config.overlay}
                onChange={(v) => set("overlay", v)}
              />
              {config.overlay && (
                <>
                  <PanelField label="Color">
                    {() => (
                      <div className="[&_button]:h-8 [&_button]:text-[12px]">
                        <ColorField
                          value={overlayColorOf(config)}
                          // La opacidad va ya en el color: la aparte del formato
                          // anterior se deja en 100 para no aplicarla dos veces.
                          onChange={(val) =>
                            onChange({ ...config, overlayColor: val, overlayOpacity: 100 })
                          }
                        />
                      </div>
                    )}
                  </PanelField>
                  <PanelField label="Desenfoque (px)">
                    {(id) => (
                      <Input
                        id={id}
                        type="number"
                        min={0}
                        max={40}
                        className={INPUT_CLASS}
                        value={config.overlayBlur}
                        onChange={(e) => set("overlayBlur", Math.max(0, Number(e.target.value) || 0))}
                      />
                    )}
                  </PanelField>
                </>
              )}
            </Group>
          )}

          <Group title="Animación">
            <PanelField label="Tipo">
              {(id) => (
                <Select
                  value={config.animation}
                  onValueChange={(v) => set("animation", v as PopupAnimation)}
                >
                  <SelectTrigger id={id} className={TRIGGER_CLASS}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POPUP_ANIMATIONS.map((a) => (
                      <SelectItem key={a.value} className="text-[12px]" value={a.value}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </PanelField>
            {config.animation !== "none" && (
              <PanelField label="Duración (ms)">
                {(id) => (
                  <Input
                    id={id}
                    type="number"
                    min={0}
                    step={50}
                    className={INPUT_CLASS}
                    value={config.animationDuration}
                    onChange={(e) =>
                      set("animationDuration", Math.max(0, Number(e.target.value) || 0))
                    }
                  />
                )}
              </PanelField>
            )}
            {presentation === "bottomSheet" && (
              <p className="text-[11px] text-muted-foreground">
                La hoja inferior siempre sube desde abajo: es la animación que
                permite cerrarla arrastrando.
              </p>
            )}
          </Group>

          <Group title="Cierre">
            <ToggleRow
              label="Mostrar botón de cerrar"
              checked={config.showCloseButton}
              onChange={(v) => set("showCloseButton", v)}
            />
            <ToggleRow
              label={
                presentation === "bottomSheet"
                  ? "Cerrar al tocar fuera o arrastrar"
                  : "Cerrar al hacer clic fuera"
              }
              checked={config.closeOnOverlay}
              onChange={(v) => set("closeOnOverlay", v)}
            />
            <ToggleRow
              label="Cerrar con la tecla Esc"
              checked={config.closeOnEsc}
              onChange={(v) => set("closeOnEsc", v)}
            />
            <ToggleRow
              label="Bloquear la página mientras está abierto"
              checked={config.lockScroll}
              onChange={(v) => set("lockScroll", v)}
            />
            <PanelField label="Cerrar solo a los (segundos)">
              {(id) => (
                <Input
                  id={id}
                  type="number"
                  min={0}
                  className={INPUT_CLASS}
                  value={config.autoCloseSeconds}
                  onChange={(e) =>
                    set("autoCloseSeconds", Math.max(0, Number(e.target.value) || 0))
                  }
                />
              )}
            </PanelField>
            <p className="text-[11px] text-muted-foreground">0 para que no se cierre solo.</p>
            {!config.showCloseButton &&
              !config.closeOnOverlay &&
              !config.closeOnEsc &&
              !config.autoCloseSeconds && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                  Sin ninguna forma de cierre, el visitante solo podrá cerrarlo
                  con un botón del contenido que use la acción &quot;Cerrar
                  popup&quot;.
                </p>
              )}
          </Group>

          <Group title="Disparador">
            <PanelField label="Cuándo se abre">
              {(id) => (
                <Select
                  value={config.trigger}
                  onValueChange={(v) => set("trigger", v as ModalConfig["trigger"])}
                >
                  <SelectTrigger id={id} className={TRIGGER_CLASS}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem className="text-[12px]" value="onLoad">Al cargar la página</SelectItem>
                    <SelectItem className="text-[12px]" value="onButtonClick">Click en un elemento con clase CSS</SelectItem>
                    <SelectItem className="text-[12px]" value="onScroll">Al hacer scroll</SelectItem>
                    <SelectItem className="text-[12px]" value="onExitIntent">Al salir de la página</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </PanelField>

            {config.trigger === "onLoad" && (
              <>
                <PanelField label="Espera antes de mostrar (ms)">
                  {(id) => (
                    <Input
                      id={id}
                      type="number"
                      className={INPUT_CLASS}
                      value={config.triggerDelay}
                      onChange={(e) => set("triggerDelay", Number(e.target.value))}
                    />
                  )}
                </PanelField>
                <PanelField label="URL donde mostrarlo">
                  {(id) => (
                    <Input
                      id={id}
                      className={INPUT_CLASS}
                      value={config.triggerUrl}
                      onChange={(e) => set("triggerUrl", e.target.value)}
                      placeholder="https://tusitio.com/pagina"
                    />
                  )}
                </PanelField>
                <p className="text-[11px] text-muted-foreground">
                  Dejar vacío para mostrarlo en todas las páginas.
                </p>
              </>
            )}

            {config.trigger === "onButtonClick" && (
              <>
                <PanelField label="Clase CSS del elemento">
                  {(id) => (
                    <Input
                      id={id}
                      className={INPUT_CLASS}
                      value={config.triggerButtonClass}
                      onChange={(e) => set("triggerButtonClass", e.target.value)}
                      placeholder="open-modal"
                    />
                  )}
                </PanelField>
                <p className="text-[11px] text-muted-foreground">
                  Para un botón del editor es más simple usar su Tipo de enlace
                  &quot;Popup&quot;, sin clases.
                </p>
              </>
            )}

            {config.trigger === "onScroll" && (
              <PanelField label="Scroll % para activar">
                {(id) => (
                  <Input
                    id={id}
                    type="number"
                    min={0}
                    max={100}
                    className={INPUT_CLASS}
                    value={config.triggerScrollPercent}
                    onChange={(e) => set("triggerScrollPercent", Number(e.target.value))}
                  />
                )}
              </PanelField>
            )}

            <ToggleRow
              label="Mostrar solo una vez"
              checked={config.showOnce}
              onChange={(v) => set("showOnce", v)}
            />
            {config.showOnce && (
              <p className="text-[11px] text-muted-foreground">
                Al volver a publicarlo, se muestra otra vez a quien ya lo vio.
              </p>
            )}
          </Group>
        </div>
      </SettingsSection>

      <SettingsSection title="Tamaño y espaciado">
        {/* Solo las medidas que la presentacion del modo activo deja tocar; el
            margen no aplica a una capa flotante. */}
        <SpacingFields
          bag={config.style}
          write={writeStyle}
          legacy={popupSpacingLegacy(config)}
          fields={{ ...preset.sizing, margin: false }}
        />
      </SettingsSection>

      <SettingsSection title="Bordes">
        <BorderFields bag={config.style} write={writeStyle} legacy={popupBorderLegacy(config)} />
      </SettingsSection>

      <SettingsSection title="Apariencia">
        <AppearanceFields
          bag={config.style}
          write={writeStyle}
          legacy={POPUP_APPEARANCE_LEGACY}
        >
          <PanelField label="Sombra">
            {(id) => (
              <Select value={config.shadow} onValueChange={(v) => set("shadow", v as PopupShadow)}>
                <SelectTrigger id={id} className={TRIGGER_CLASS}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(POPUP_SHADOWS) as PopupShadow[]).map((s) => (
                    <SelectItem key={s} className="text-[12px]" value={s}>
                      {POPUP_SHADOWS[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </PanelField>
        </AppearanceFields>
      </SettingsSection>

      <AdvancedSection
        customClass={(config.style.customClass as string | undefined) ?? ""}
        onCustomClassChange={(val) =>
          writeStyle((p) => {
            p.customClass = val
          })
        }
        customCss={(config.style.customCss as string | undefined) ?? ""}
        onCustomCssChange={(val) =>
          writeStyle((p) => {
            p.customCss = val
          })
        }
      />

      <SettingsSection
        title="Visibilidad por dispositivo"
        className="border-b"
        badge={
          <VisibilityBadge
            hidden={visibility.hiddenOnDesktop || visibility.hiddenOnTablet || visibility.hiddenOnMobile}
          />
        }
      >
        <VisibilityFields
          values={visibility}
          help="Activa para que el popup no se abra en ese dispositivo. En el editor siempre es visible."
          onChange={(key: VisibilityKey, value) =>
            writeStyle((p) => {
              p[key] = value
            })
          }
        />
      </SettingsSection>
    </div>
  )
}
