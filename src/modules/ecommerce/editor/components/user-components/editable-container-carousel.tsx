// Carrusel cuyas diapositivas son Contenedores: cada hijo del bloque es una
// slide, y dentro de cada una va lo que se quiera (titulos, textos, botones,
// iconos...). Es lo que no alcanza el Carrusel de tarjetas, que guarda cada
// tarjeta como datos fijos (imagen, titulo, descripcion) y no admite hijos.
//
// Los hijos no se pintan con `children`: craft los entrega envueltos en un
// unico Fragment, y cada uno tiene que ir en su propio CarouselItem. Por eso
// se leen los ids de los hijos del nodo y se pinta cada uno con NodeElement,
// que es lo mismo que hace craft por dentro. Fuera del editor (tienda y
// preview) el arbol es el mismo, asi que no hace falta nada aparte.

import { useCallback, useEffect, useId, useState } from "react"
import { Element, NodeElement, useEditor, useNode, type Node } from "@craftjs/core"
import Autoplay from "embla-carousel-autoplay"
import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from "lucide-react"
import { useVisibilityStyle } from "@/modules/ecommerce/editor/hooks/use-visibility-style"
import { useResponsiveValue } from "@/modules/ecommerce/editor/components/viewport-context"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel"
import { useEditorCarouselReset } from "@/modules/ecommerce/editor/hooks/use-editor-carousel-reset"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SettingsSection } from "@/modules/ecommerce/editor/components/settings-section"
import { AdvancedSection, useCustomCss } from "@/modules/ecommerce/editor/components/advanced-section"
import { SelectableNode } from "@/modules/ecommerce/editor/components/selectable-node"
import { BorderSection, useBorderCss } from "@/modules/ecommerce/editor/components/border-section"
import { SpacingSection, useSpacingCss } from "@/modules/ecommerce/editor/components/spacing-section"
import type { BorderStyle } from "@/modules/ecommerce/editor/components/box-measures"
import { buildNodeTree, serializeTree } from "@/modules/ecommerce/editor/lib/editor-clipboard"
import { cn } from "@/shared/utils/utils"
import { EditableContainer } from "./editable-container"

// ── Types ──────────────────────────────────────────────

interface EditableContainerCarouselProps {
  children?: React.ReactNode
  slidesDesktop?: number
  slidesTablet?: number
  slidesMobile?: number
  gap?: number
  autoPlayInterval?: number
  loop?: boolean
  showArrows?: boolean
  showDots?: boolean
  borderStyle?: BorderStyle
  borderColor?: string
  customClass?: string
  /** CSS escrito a mano. Ver AdvancedSection. */
  customCss?: string
  hiddenOnDesktop?: boolean
  hiddenOnTablet?: boolean
  hiddenOnMobile?: boolean
  [key: string]: unknown
}

/**
 * La slide con la que nace el bloque y la que agrega "Añadir slide": un
 * Contenedor vertical con alto minimo, para que se vea y se pueda soltar algo
 * dentro aunque este vacio.
 */
export function newSlideElement() {
  return <Element is={EditableContainer} canvas flexDirection="column" minHeight="240px" />
}

// ── Component ──────────────────────────────────────────

export function EditableContainerCarousel(props: EditableContainerCarouselProps) {
  const {
    slidesDesktop = 3,
    slidesTablet = 2,
    slidesMobile = 1,
    gap = 16,
    autoPlayInterval = 0,
    loop = false,
    showArrows = true,
    showDots = false,
    customClass = "",
    customCss,
    hiddenOnDesktop = false,
    hiddenOnTablet = false,
    hiddenOnMobile = false,
  } = props

  const { id: nodeId, slideIds } = useNode((node) => ({
    slideIds: node.data.nodes,
  }))

  // Que slide contiene lo seleccionado en el editor (-1 si nada). Sirve para
  // llevar el carrusel hasta ella cuando se elige algo de una slide que esta
  // fuera de la vista, desde Capas o desde la lista del panel.
  const { enabled, selectedSlide } = useEditor((state, query) => {
    let index = -1
    if (state.options.enabled) {
      const children = state.nodes[nodeId]?.data.nodes ?? []
      for (const selectedId of state.events.selected) {
        if (!state.nodes[selectedId]) continue
        const chain = [selectedId, ...query.node(selectedId).ancestors(true)]
        index = children.findIndex((childId) => chain.includes(childId))
        if (index !== -1) break
      }
    }
    return { enabled: state.options.enabled, selectedSlide: index }
  })

  const { visClass, visibilityJsx } = useVisibilityStyle({ hiddenOnDesktop, hiddenOnTablet, hiddenOnMobile })
  const slidesActive = useResponsiveValue({ desktop: slidesDesktop, tablet: slidesTablet, mobile: slidesMobile })

  const reactId = useId()
  const carouselClass = `container-carousel-${reactId.replace(/:/g, "")}`

  const { className: customCssClass, customCssTag } = useCustomCss(customCss)
  const borde = useBorderCss(props as Record<string, unknown>)
  const medidas = useSpacingCss(props as Record<string, unknown>)

  const [api, setApi] = useState<CarouselApi>()
  useEditorCarouselReset(api)

  useEffect(() => {
    if (!enabled || !api || selectedSlide < 0) return
    if (api.slidesInView().includes(selectedSlide)) return
    api.scrollTo(selectedSlide, true)
  }, [enabled, api, selectedSlide])

  // Puntos: uno por cada posicion a la que se puede llegar, no por slide (con
  // 3 visibles y 5 slides hay 3 posiciones).
  const [snapCount, setSnapCount] = useState(0)
  const [selectedSnap, setSelectedSnap] = useState(0)
  useEffect(() => {
    if (!api) return
    const sync = () => {
      setSnapCount(api.scrollSnapList().length)
      setSelectedSnap(api.selectedScrollSnap())
    }
    sync()
    api.on("select", sync)
    api.on("reInit", sync)
    return () => {
      api.off("select", sync)
      api.off("reInit", sync)
    }
  }, [api])

  const plugins = autoPlayInterval > 0 && !enabled
    ? [Autoplay({ delay: autoPlayInterval, stopOnInteraction: true })]
    : []

  const isEmpty = slideIds.length === 0

  const flexBasis = (n: number) =>
    `flex: 0 0 calc(${100 / n}% - ${gap * (n - 1) / n}px); min-width: 0;`

  return (
    <>
      <style>{slidesActive !== null ? `
        .${carouselClass} .embla-item { ${flexBasis(slidesActive)} }
      ` : `
        .${carouselClass} .embla-item { ${flexBasis(slidesMobile)} }
        @media (min-width: 768px) {
          .${carouselClass} .embla-item { ${flexBasis(slidesTablet)} }
        }
        @media (min-width: 1024px) {
          .${carouselClass} .embla-item { ${flexBasis(slidesDesktop)} }
        }
      `}</style>

      {visibilityJsx}
      {customCssTag}
      {borde.styleTag}
      {medidas.styleTag}
      <SelectableNode
        className={`${carouselClass} ${borde.className} ${medidas.className} w-full ${visClass} ${customCssClass} ${customClass} ${enabled && isEmpty
          ? "border-2 border-dashed border-muted-foreground/30"
          : ""
          }`}
      >
        {enabled && isEmpty ? (
          <div className="flex items-center justify-center w-full min-h-[120px] text-xs text-muted-foreground/50">
            Arrastra contenedores aqui: cada uno es una slide
          </div>
        ) : (
          <Carousel
            setApi={setApi}
            // En el editor no se arrastra el carrusel: el arrastre es de craft,
            // para mover componentes. Se navega con las flechas o seleccionando.
            opts={{ loop, align: "start", watchDrag: !enabled }}
            plugins={plugins}
            className="w-full"
          >
            <CarouselContent className="ml-0" style={{ gap }}>
              {slideIds.map((slideId) => (
                // flex: la slide ocupa todo el alto del item, asi todas miden
                // lo mismo que la mas alta.
                <CarouselItem key={slideId} className="embla-item !p-0 flex">
                  <NodeElement id={slideId} />
                </CarouselItem>
              ))}
            </CarouselContent>
            {showArrows && (
              <>
                {/* pointer-events-auto: en edicion SelectableNode apaga el
                    puntero del contenido, y las flechas son la forma de
                    recorrer el carrusel mientras se edita. */}
                <CarouselPrevious className="left-2 z-30 pointer-events-auto bg-black/30 hover:bg-black/50 border-0 text-white" />
                <CarouselNext className="right-2 z-30 pointer-events-auto bg-black/30 hover:bg-black/50 border-0 text-white" />
              </>
            )}
            {showDots && snapCount > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {Array.from({ length: snapCount }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Ir a la posicion ${i + 1}`}
                    onClick={() => api?.scrollTo(i)}
                    className={cn(
                      "h-2 rounded-full transition-all pointer-events-auto",
                      i === selectedSnap ? "w-6 bg-foreground" : "w-2 bg-foreground/30"
                    )}
                  />
                ))}
              </div>
            )}
          </Carousel>
        )}
      </SelectableNode>
    </>
  )
}

// ── Settings ───────────────────────────────────────────

const slidesOptions = ["1", "2", "3", "4", "5", "6"]

const esContenedor = (node: Node) => node.data.type === EditableContainer

function EditableContainerCarouselSettings() {
  const {
    id: nodeId,
    actions: { setProp },
    slidesDesktop,
    slidesTablet,
    slidesMobile,
    gap,
    autoPlayInterval,
    loop,
    showArrows,
    showDots,
    customClass,
    customCss,
  } = useNode((node) => ({
    slidesDesktop: node.data.props.slidesDesktop as number,
    slidesTablet: node.data.props.slidesTablet as number,
    slidesMobile: node.data.props.slidesMobile as number,
    gap: node.data.props.gap as number,
    autoPlayInterval: node.data.props.autoPlayInterval as number,
    loop: node.data.props.loop as boolean,
    showArrows: node.data.props.showArrows as boolean,
    showDots: node.data.props.showDots as boolean,
    customClass: node.data.props.customClass as string | undefined,
    customCss: node.data.props.customCss as string | undefined,
  }))

  const { actions, query, slides } = useEditor((state) => ({
    slides: (state.nodes[nodeId]?.data.nodes ?? []).map((childId, i) => ({
      id: childId,
      name:
        (state.nodes[childId]?.data.custom?.displayName as string | undefined)?.trim() ||
        `Slide ${i + 1}`,
    })),
  }))

  const addSlide = useCallback(() => {
    const tree = query.parseReactElement(newSlideElement()).toNodeTree()
    actions.addNodeTree(tree, nodeId)
  }, [actions, query, nodeId])

  // La misma copia que el "Duplicar" de Capas y que el pegar: arbol entero,
  // con ids nuevos en todos los nodos.
  const duplicateSlide = useCallback(
    (slideId: string, index: number) => {
      const tree = buildNodeTree(query as never, serializeTree(query as never, slideId), nodeId)
      actions.addNodeTree(tree, nodeId, index + 1)
    },
    [actions, query, nodeId]
  )

  // craft.move cuenta el indice antes de quitar el nodo de su sitio: bajar
  // una posicion es +2, no +1.
  const moveSlide = (slideId: string, index: number, delta: -1 | 1) => {
    const target = delta === 1 ? index + 2 : index - 1
    if (target < 0 || target > slides.length) return
    actions.move(slideId, nodeId, target)
  }

  const setNumber = (key: keyof EditableContainerCarouselProps, value: number) =>
    setProp((props: EditableContainerCarouselProps) => {
      props[key] = value
    })

  const setBool = (key: keyof EditableContainerCarouselProps, value: boolean) =>
    setProp((props: EditableContainerCarouselProps) => {
      props[key] = value
    })

  return (
    <div className="flex flex-col">
      <SettingsSection title="Slides" className="border-t-0" defaultOpen>
        <div className="flex flex-col gap-2">
          <p className="text-[10px] text-foreground/60">
            Cada slide es un Contenedor: seleccionalo para editarlo y suelta dentro
            titulos, textos o botones.
          </p>
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className="flex items-center gap-1 bg-card border rounded-lg pl-2.5 pr-1 py-1"
            >
              <button
                type="button"
                className="flex-1 min-w-0 truncate text-left text-[12px] hover:underline"
                onClick={() => actions.selectNode(slide.id)}
                title="Seleccionar slide"
              >
                {slide.name}
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={index === 0}
                onClick={() => moveSlide(slide.id, index, -1)}
                title="Subir"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={index === slides.length - 1}
                onClick={() => moveSlide(slide.id, index, 1)}
                title="Bajar"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => duplicateSlide(slide.id, index)}
                title="Duplicar"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                disabled={slides.length <= 1}
                onClick={() => actions.delete(slide.id)}
                title="Eliminar"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="h-8 text-[12px]" onClick={addSlide}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Añadir slide
          </Button>
        </div>
      </SettingsSection>

      <SettingsSection title="Distribución">
        <div className="flex flex-col gap-3">
          {([
            ["slidesDesktop", "Escritorio (≥1024px)", slidesDesktop],
            ["slidesTablet", "Tableta (≥768px)", slidesTablet],
            ["slidesMobile", "Celular (<768px)", slidesMobile],
          ] as const).map(([key, label, value]) => (
            <div key={key} className="flex flex-col gap-1.5">
              <Label className="text-[11px] text-foreground/80">{label}</Label>
              <Select value={String(value)} onValueChange={(val) => setNumber(key, parseInt(val))}>
                <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {slidesOptions.map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-[12px]">{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Espaciado (gap px)</Label>
            <Input
              className="h-8 text-[12px] md:text-[12px]"
              type="number"
              value={gap}
              min={0}
              max={64}
              onChange={(e) => setNumber("gap", parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Reproducción">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Intervalo auto-play (ms)</Label>
            <Input
              className="h-8 text-[12px] md:text-[12px]"
              type="number"
              value={autoPlayInterval}
              min={0}
              step={500}
              onChange={(e) => setNumber("autoPlayInterval", parseInt(e.target.value) || 0)}
            />
            <p className="text-[10px] text-foreground/60 mt-1">0 para desactivar</p>
          </div>
          {([
            ["loop", "Loop infinito", loop],
            ["showArrows", "Mostrar flechas", showArrows],
            ["showDots", "Mostrar indicadores", showDots],
          ] as const).map(([key, label, value]) => (
            <div key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`container-carousel-${key}`}
                checked={Boolean(value)}
                onChange={(e) => setBool(key, e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor={`container-carousel-${key}`} className="text-[11px] text-foreground/80">
                {label}
              </Label>
            </div>
          ))}
        </div>
      </SettingsSection>

      <SpacingSection />

      <BorderSection />

      <AdvancedSection
        customClass={customClass ?? ""}
        onCustomClassChange={(val) =>
          setProp((props: EditableContainerCarouselProps) => (props.customClass = val))
        }
        customCss={customCss ?? ""}
        onCustomCssChange={(val) =>
          setProp((props: EditableContainerCarouselProps) => (props.customCss = val))
        }
      />
    </div>
  )
}

// ── CraftJS Config ─────────────────────────────────────

EditableContainerCarousel.craft = {
  displayName: "Carrusel de contenedores",
  props: {
    slidesDesktop: 3,
    slidesTablet: 2,
    slidesMobile: 1,
    gap: 16,
    autoPlayInterval: 0,
    loop: false,
    showArrows: true,
    showDots: false,
    borderStyle: "solid" as const,
    borderColor: "transparent",
    hiddenOnDesktop: false,
    hiddenOnTablet: false,
    hiddenOnMobile: false,
  },
  related: {
    settings: EditableContainerCarouselSettings,
  },
  rules: {
    canDrag: () => true,
    // Solo Contenedores como hijos directos: cada uno es una slide. Dentro de
    // ellos va cualquier cosa. Lo aplica tambien el pegar (canPasteInto).
    canMoveIn: (incoming: Node[]) => incoming.every(esContenedor),
  },
}
