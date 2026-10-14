import { useState } from "react"
import { useEditor, Element } from "@craftjs/core"
import {
  Pilcrow,
  Image,
  LayoutTemplate,
  Megaphone,
  Grid3X3,
  ShoppingBag,
  Sparkles,
  Mail,
  BoxSelect,
  GalleryHorizontalEnd,
  Square,
  Star,
  Clapperboard,
  BadgePercent,
  Menu,
  ListTree,
  ChevronDown,
  X,
  PackageSearch,
  User,
  Search,
  MessageSquareText,
  Info,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { EditableImage } from "./user-components/editable-image"
import { EditableCarousel, defaultBanners } from "./user-components/editable-carousel"
import { EditableHero } from "./user-components/editable-hero"
import { EditableContainer } from "./user-components/editable-container"
import { EditableCardCarousel } from "./user-components/editable-card-carousel"
import { EditableContainerCarousel, newSlideElement } from "./user-components/editable-container-carousel"
import { EditableButton } from "./user-components/editable-button"
import { EditableVideo } from "./user-components/editable-video"
import { EditablePromotionalText } from "./user-components/editable-promotional-text"
import { EditableImageCarousel } from "./user-components/editable-image-carousel"
import { EditableCategoryCarousel } from "./user-components/editable-category-carousel"
import { EditableProductGrid } from "./user-components/editable-product-grid"
import { EditableProductCarousel } from "./user-components/editable-product-carousel"
import { EditableCategoryGrid } from "./user-components/editable-category-grid"
import { EditableBenefits } from "./user-components/editable-benefits"
import { EditableTestimonials } from "./user-components/editable-testimonials"
import { EditableFAQ } from "./user-components/editable-faq"
import { EditableMegaMenu } from "./user-components/editable-mega-menu"
import { EditableIcon } from "./user-components/editable-icon"
import { EditableRichText } from "./user-components/editable-rich-text"
import { EditableNestedLinks } from "./user-components/editable-nested-links"
import { EditableDropdownButton } from "./user-components/editable-dropdown-button"
import { EditableHoverableDropdown } from "./user-components/editable-hoverable-dropdown"
import { EditableProductPopover } from "./user-components/editable-product-popover"
import { EditableCart } from "./user-components/editable-cart"
import EditableAccount from "./user-components/editable-account"
import { EditableSearch } from "./user-components/editable-search"
import { EditableGoogleReviews } from "./user-components/editable-google-reviews"

/**
 * Los tres grupos del toolbox, en el orden en que se enseñan. Estructura va
 * primero y abierto: es por donde se empieza una pagina.
 */
export const COMPONENT_SECTIONS = ["Estructura", "Contenido", "Tienda"] as const
export type ComponentSection = (typeof COMPONENT_SECTIONS)[number]

interface ComponentItem {
  name: string
  section: ComponentSection
  icon: React.ReactNode
  component: React.ReactElement
}

interface EditorSidebarProps {
  components: ComponentItem[]
}

export function EditorSidebar({ components }: EditorSidebarProps) {
  const { connectors } = useEditor()
  const [searchQuery, setSearchQuery] = useState("")

  // Sin tildes ni mayusculas: "boton" tiene que encontrar "Botón". NFD separa
  // la letra de su acento y el rango 0300-036F son justo esos acentos.
  const fold = (text: string) =>
    text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  const query = fold(searchQuery.trim())
  const searching = query.length > 0

  // Por grupo y, dentro de cada uno, por nombre: asi el orden no depende de
  // como esten declarados los componentes.
  const groups = COMPONENT_SECTIONS.map((section) => ({
    section,
    items: components
      .filter(
        (item) =>
          item.section === section &&
          (!searching || fold(item.name).includes(query)),
      )
      .sort((a, b) => a.name.localeCompare(b.name, "es")),
  })).filter((group) => group.items.length > 0)

  // Que grupos estan abiertos. Estructura arranca abierto; los demas
  // cerrados. Mientras se busca se abren todos, para que un resultado nunca
  // quede escondido tras una cabecera plegada.
  const [openSections, setOpenSections] = useState<Record<ComponentSection, boolean>>({
    Estructura: true,
    Contenido: false,
    Tienda: false,
  })

  return (
    // El titulo y el buscador se quedan fijos: el scroll es solo del listado,
    // asi el buscador sigue a la vista mientras se recorren los componentes.
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 px-4 pt-4">
        <div className="mb-3 flex items-center gap-1">
          <h3 className="font-semibold text-sm text-foreground">Componentes</h3>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="Como se usan los componentes"
                className="text-muted-foreground hover:text-foreground cursor-help"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[220px] text-[12px]">
              Arrastra un componente al canvas.
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="relative mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar componente..."
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* El padding va dentro del viewport para que la barra quede pegada
          al borde de la columna y no flotando sobre el contenido. */}
      <ScrollArea
        className="min-h-0 flex-1 [&>[data-radix-scroll-area-viewport]>div]:!block"
        thumbClassName="bg-primary"
      >
        <div className="px-4 pb-4">
          {groups.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Sin resultados.
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {groups.map(({ section, items }) => (
                <Collapsible
                  key={section}
                  open={searching || openSections[section]}
                  onOpenChange={(open) =>
                    setOpenSections((prev) => ({ ...prev, [section]: open }))
                  }
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between gap-2 py-2 cursor-pointer select-none">
                      <p className="text-sm font-medium">
                        {section}
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground tabular-nums">
                          {items.length}
                        </span>
                      </p>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                          searching || openSections[section] ? "" : "-rotate-90"
                        }`}
                      />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pb-2">
                    <div className="grid grid-cols-2 gap-2">
                      {items.map((item) => (
                        <div
                          key={item.name}
                          ref={(ref) => {
                            if (ref) connectors.create(ref, item.component)
                          }}
                          className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border bg-background hover:border-primary hover:bg-primary/5 cursor-grab active:cursor-grabbing transition-colors"
                        >
                          <div className="text-muted-foreground">{item.icon}</div>
                          <span className="text-xs text-foreground font-medium text-center">
                            {item.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

export const defaultComponents: ComponentItem[] = [
  {
    name: "Beneficios",
    section: "Contenido",
    icon: <Sparkles className="h-5 w-5" />,
    component: <Element is={EditableBenefits} />,
  },
  {
    name: "Botón",
    section: "Contenido",
    icon: <Square className="h-5 w-5" />,
    // Un boton recien puesto nace sin ancho ni alto. Las unidades van aqui y no
    // en craft.props porque este es el unico momento en que se sabe que el boton
    // es nuevo: a los ya publicados les falta la prop, y esa falta es la que el
    // componente lee como el formato de antes.
    //
    // Solo se marca el modo escritorio: la tableta y el celular lo heredan de el
    // mientras no se les ponga uno propio, y dejarles un "auto" escrito seria
    // decidir por ellos que no heredan.
    component: (
      <Element
        is={EditableButton}
        widthUnitDesktop="auto"
        heightUnitDesktop="auto"
      />
    ),
  },
  {
    name: "Vista rápida",
    section: "Tienda",
    icon: <PackageSearch className="h-5 w-5" />,
    component: <Element is={EditableProductPopover} />,
  },
  {
    name: "Carrusel de tarjetas",
    section: "Contenido",
    icon: <GalleryHorizontalEnd className="h-5 w-5" />,
    component: <Element is={EditableCardCarousel} />,
  },
  {
    name: "Carrusel de contenedores",
    section: "Estructura",
    icon: <GalleryHorizontalEnd className="h-5 w-5" />,
    // Nace con tres slides vacias para que se vea como carrusel desde el primer
    // momento; cada una es un Contenedor donde se sueltan titulos y botones.
    component: (
      <Element is={EditableContainerCarousel} canvas>
        {newSlideElement()}
        {newSlideElement()}
        {newSlideElement()}
      </Element>
    ),
  },
  {
    name: "Carrusel de banners",
    section: "Contenido",
    icon: <Megaphone className="h-5 w-5" />,
    // Sin canvas, TypeScript exige las props obligatorias: se pasan los mismos
    // valores que craft.props, asi que el resultado al soltar no cambia.
    component: <Element is={EditableCarousel} banners={defaultBanners} height="400px" autoPlayInterval={5000} />,
  },
  {
    name: "Grilla de categorías",
    section: "Tienda",
    icon: <Grid3X3 className="h-5 w-5" />,
    component: <Element is={EditableCategoryGrid} />,
  },
  {
    name: "Contenedor",
    section: "Estructura",
    icon: <BoxSelect className="h-5 w-5" />,
    // Un contenedor recien puesto reparte sus elementos en horizontal. La
    // direccion va aqui y no en craft.props porque este es el unico momento en
    // que se sabe que el contenedor es nuevo: craft.props tapa lo que falte en
    // una pagina guardada, asi que cambiarla ahi le daria la vuelta al diseno
    // de los contenedores ya publicados que no la lleven escrita.
    component: <Element is={EditableContainer} flexDirection="row" canvas />,
  },
  {
    name: "Texto enriquecido",
    section: "Contenido",
    icon: <Pilcrow className="h-5 w-5" />,
    component: <Element is={EditableRichText} />,
  },
  {
    name: "Desplegable (clic)",
    section: "Contenido",
    icon: <ChevronDown className="h-5 w-5" />,
    component: <Element is={EditableDropdownButton} />,
  },
  {
    name: "Desplegable (hover)",
    section: "Contenido",
    icon: <ChevronDown className="h-5 w-5" />,
    component: <Element is={EditableHoverableDropdown} />,
  },
  {
    name: "Preguntas frecuentes",
    section: "Contenido",
    icon: <Sparkles className="h-5 w-5" />,
    component: <Element is={EditableFAQ} />,
  },
  {
    name: "Portada",
    section: "Contenido",
    icon: <LayoutTemplate className="h-5 w-5" />,
    component: <Element is={EditableHero} slides={[]} />,
  },
  {
    name: "Icono",
    section: "Contenido",
    icon: <Star className="h-5 w-5" />,
    component: <Element is={EditableIcon} />,
  },
  {
    name: "Carrusel de imágenes",
    section: "Contenido",
    icon: <GalleryHorizontalEnd className="h-5 w-5" />,
    component: <Element is={EditableImageCarousel} />,
  },
  {
    name: "Carrusel de categorías",
    section: "Tienda",
    icon: <GalleryHorizontalEnd className="h-5 w-5" />,
    component: <Element is={EditableCategoryCarousel} />,
  },
  {
    name: "Imagen",
    section: "Contenido",
    icon: <Image className="h-5 w-5" />,
    component: <Element is={EditableImage} src="/images/hero-banner.jpg" alt="Imagen" />,
  },
  {
    name: "Enlaces anidados",
    section: "Contenido",
    icon: <ListTree className="h-5 w-5" />,
    component: <Element is={EditableNestedLinks} />,
  },
  {
    name: "Megamenú",
    section: "Contenido",
    icon: <Menu className="h-5 w-5" />,
    component: <Element is={EditableMegaMenu} />,
  },
  {
    name: "Carrusel de productos",
    section: "Tienda",
    icon: <GalleryHorizontalEnd className="h-5 w-5" />,
    component: <Element is={EditableProductCarousel} />,
  },
  {
    name: "Grilla de productos",
    section: "Tienda",
    icon: <Grid3X3 className="h-5 w-5" />,
    component: <Element is={EditableProductGrid} />,
  },
  {
    name: "Cinta promocional",
    section: "Contenido",
    icon: <BadgePercent className="h-5 w-5" />,
    component: <Element is={EditablePromotionalText} />,
  },
  {
    name: "Testimonios",
    section: "Contenido",
    icon: <Sparkles className="h-5 w-5" />,
    component: <Element is={EditableTestimonials} />,
  },
  {
    name: "Reseñas de Google",
    section: "Contenido",
    icon: <MessageSquareText className="h-5 w-5" />,
    component: <Element is={EditableGoogleReviews} />,
  },
  {
    name: "Video",
    section: "Contenido",
    icon: <Clapperboard className="h-5 w-5" />,
    component: <Element is={EditableVideo} src="/videos/demo.mp4" />,
  },
  {
    name: "Carrito",
    section: "Tienda",
    icon: <ShoppingBag className="h-5 w-5" />,
    component: <Element is={EditableCart} />,
  },
  {
    name: "Buscador",
    section: "Tienda",
    icon: <Search className="h-5 w-5" />,
    component: <Element is={EditableSearch} />,
  },
  {
    name: "Cuenta",
    section: "Tienda",
    icon: <User className="h-5 w-5" />,
    component: <Element is={EditableAccount} />,
  },
]
