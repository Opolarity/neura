import { useEffect, useId, useState } from "react"
import { useEditor, useNode } from "@craftjs/core"
import Autoplay from "embla-carousel-autoplay"
import { ExternalLink, Loader2, Star } from "lucide-react"
import { ColorField } from "@/modules/ecommerce/editor/components/color-field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import { useDebounce } from "@/modules/ecommerce/editor/hooks/use-debounce"
import { useVisibilityStyle } from "@/modules/ecommerce/editor/hooks/use-visibility-style"
import { useEditorCarouselReset } from "@/modules/ecommerce/editor/hooks/use-editor-carousel-reset"
import { useResponsiveValue } from "@/modules/ecommerce/editor/components/viewport-context"
import { SettingsSection } from "@/modules/ecommerce/editor/components/settings-section"
import { AdvancedSection, useCustomCss } from "@/modules/ecommerce/editor/components/advanced-section"
import { BorderSection, useBorderCss } from "@/modules/ecommerce/editor/components/border-section"
import {
  SpacingSection,
  uniformSpacing,
  useSpacingCss,
  type SpacingLegacy,
} from "@/modules/ecommerce/editor/components/spacing-section"
import {
  TypographySection,
  useTypographyCss,
} from "@/modules/ecommerce/editor/components/typography-section"
import type { BorderStyle } from "@/modules/ecommerce/editor/components/box-measures"
import { SelectableNode } from "@/modules/ecommerce/editor/components/selectable-node"

interface GoogleAuthorAttribution {
  displayName?: string
  uri?: string
  photoUri?: string
}

interface GoogleReview {
  name?: string
  relativePublishTimeDescription?: string
  rating?: number
  text?: { text?: string; languageCode?: string }
  originalText?: { text?: string; languageCode?: string }
  authorAttribution?: GoogleAuthorAttribution
  googleMapsUri?: string
}

interface GooglePlaceReviews {
  id?: string
  displayName?: { text?: string; languageCode?: string }
  rating?: number
  userRatingCount?: number
  reviews?: GoogleReview[]
  googleMapsUri?: string
  attributions?: Array<{ provider?: string; providerUri?: string }>
}

interface EditableGoogleReviewsProps {
  placeId?: string
  languageCode?: string
  slidesDesktop?: number
  slidesTablet?: number
  slidesMobile?: number
  gap?: number
  /**
   * @deprecated El relleno uniforme anterior. Se sigue leyendo porque lo traen los
   * bloques ya publicados; hoy el relleno va por lado y por modo (ver
   * SpacingSection) y este valor solo alimenta su `legacy`.
   */
  padding?: number
  background?: string
  borderStyle?: BorderStyle
  borderColor?: string
  cardBackground?: string
  /**
   * El color del texto del bloque. Lo leen y lo escriben la seccion
   * "Tipografía" y su `useTypographyCss`, que lo pintan en el contenedor raiz:
   * el render no lo aplica por su cuenta en ningun sitio.
   */
  textColor?: string
  starColor?: string
  autoplay?: boolean
  interval?: number
  showArrows?: boolean
  showIndicators?: boolean
  loop?: boolean
  customClass?: string
  /** CSS escrito a mano. Ver AdvancedSection. */
  customCss?: string
  hiddenOnDesktop?: boolean
  hiddenOnTablet?: boolean
  hiddenOnMobile?: boolean
  /** Medidas por modo (Tamaño y espaciado) y bordes: ver spacing-section / border-section. */
  [key: string]: unknown
}

// El relleno del formato anterior: un solo numero para los cuatro lados
// (`padding`, 24 por defecto). La seccion lo enseña y lo migra al primer cambio.
function spacingLegacyOf(props: { padding?: number }): SpacingLegacy {
  const padding = props.padding ?? 24
  return {
    padding: uniformSpacing(padding),
    paddingValueFor: () => padding,
  }
}

function Stars({ rating, color }: { rating: number; color: string }) {
  const roundedRating = Math.max(0, Math.min(5, Math.round(rating)))

  return (
    <div className="flex gap-0.5" aria-label={`${rating} de 5 estrellas`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className="h-4 w-4"
          style={{
            color,
            fill: index < roundedRating ? color : "transparent",
            opacity: index < roundedRating ? 1 : 0.35,
          }}
        />
      ))}
    </div>
  )
}

export function EditableGoogleReviews(props: EditableGoogleReviewsProps) {
  const {
  placeId = "",
  languageCode = "es",
  slidesDesktop = 3,
  slidesTablet = 2,
  slidesMobile = 1,
  gap = 16,
  background = "transparent",
  cardBackground = "#f5f5f7",
  starColor = "#ff7a00",
  autoplay = false,
  interval = 5000,
  showArrows = true,
  showIndicators = true,
  loop = true,
  customClass = "",
  customCss,
  hiddenOnDesktop = false,
  hiddenOnTablet = false,
  hiddenOnMobile = false,
  } = props
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }))
  const { visClass, visibilityJsx } = useVisibilityStyle({
    hiddenOnDesktop,
    hiddenOnTablet,
    hiddenOnMobile,
  })
  const { className: customCssClass, customCssTag } = useCustomCss(customCss)
  // Bordes de la seccion "Bordes" del panel, en el contenedor raiz del bloque
  // (no en cada tarjeta). Nunca tuvo bordes antes: sin legacy.
  const borde = useBorderCss(props as Record<string, unknown>)
  // Medidas de la seccion "Tamaño y espaciado" (ancho, alto, relleno, margen).
  const medidas = useSpacingCss(props as Record<string, unknown>, spacingLegacyOf(props))
  // Letra de la seccion "Tipografía", en el contenedor raiz para que las
  // tarjetas la hereden: el texto de cada reseña lo trae la API de Google y no
  // el editor, asi que la tipografia del bloque es la unica forma de darle
  // formato. Sin legacy: `textColor` ya se llamaba asi y es lo unico de letra
  // que el bloque guardaba. El color viaja con esa herencia, asi que ni la
  // cabecera ni las tarjetas lo repiten en su `style`: seria pintar dos veces
  // la misma prop, una desde la seccion y otra a mano.
  const letra = useTypographyCss(props as Record<string, unknown>)
  const slidesActive = useResponsiveValue({ desktop: slidesDesktop, tablet: slidesTablet, mobile: slidesMobile })
  const debouncedPlaceId = useDebounce(placeId.trim(), 800)
  const [place, setPlace] = useState<GooglePlaceReviews | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [api, setApi] = useState<CarouselApi>()
  useEditorCarouselReset(api)
  const [current, setCurrent] = useState(0)
  const [slideCount, setSlideCount] = useState(0)
  const componentId = useId().replace(/:/g, "")
  const carouselClass = `google-reviews-${componentId}`

  useEffect(() => {
    if (!debouncedPlaceId) {
      setPlace(null)
      setError(null)
      return
    }

    const controller = new AbortController()

    async function loadReviews() {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          placeId: debouncedPlaceId,
          languageCode,
        })
        const response = await fetch(`/api/google-reviews?${params}`, {
          cache: "no-store",
          signal: controller.signal,
        })

        if (!response.ok) {
          const body = await response.json().catch(() => null)
          if (body?.error === "google_places_not_configured") {
            throw new Error("Configura GOOGLE_PLACES_API_KEY en el servidor.")
          }
          if (body?.error === "invalid_place_id") {
            throw new Error("El Place ID no es válido.")
          }
          throw new Error("No se pudieron obtener las reseñas de Google Maps.")
        }

        setPlace(await response.json())
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return
        setPlace(null)
        setError(requestError instanceof Error ? requestError.message : "No se pudieron cargar las reseñas.")
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadReviews()
    return () => controller.abort()
  }, [debouncedPlaceId, languageCode])

  useEffect(() => {
    if (!api) return

    const updateSelection = () => {
      setCurrent(api.selectedScrollSnap())
      setSlideCount(api.scrollSnapList().length)
    }

    updateSelection()
    api.on("select", updateSelection)
    api.on("reInit", updateSelection)

    return () => {
      api.off("select", updateSelection)
      api.off("reInit", updateSelection)
    }
  }, [api, place])

  const reviews = place?.reviews ?? []
  const plugins = autoplay && !enabled
    ? [Autoplay({ delay: interval, stopOnInteraction: true })]
    : []

  return (
    <>
      <style>{slidesActive !== null ? `
        .${carouselClass} .google-review-slide { flex-basis: ${100 / slidesActive}%; }
      ` : `
        .${carouselClass} .google-review-slide { flex-basis: ${100 / slidesMobile}%; }
        @media (min-width: 768px) {
          .${carouselClass} .google-review-slide { flex-basis: ${100 / slidesTablet}%; }
        }
        @media (min-width: 1024px) {
          .${carouselClass} .google-review-slide { flex-basis: ${100 / slidesDesktop}%; }
        }
      `}</style>
      {visibilityJsx}
      {customCssTag}
      {borde.styleTag}
      {medidas.styleTag}
      {letra.styleTag}
      <SelectableNode
        // Se sirve como <section> en la tienda publica: forzarlo a div le
        // cambiaria la semantica del HTML publicado.
        as="section"
        className={`${carouselClass} ${visClass} ${customCssClass} ${borde.className} ${medidas.className} ${letra.className} ${customClass} w-full`}
        style={{ background }}
      >
        {!placeId && enabled && (
          <div className="rounded-xl border-2 border-dashed border-muted-foreground/30 px-6 py-10 text-center text-sm text-muted-foreground">
            Ingresa el Place ID de Google Maps en las propiedades del componente.
          </div>
        )}

        {loading && (
          <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cargando reseñas...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-center text-sm text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && place && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {place.displayName?.text || "Reseñas de Google"}
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold">{place.rating?.toFixed(1) ?? "0.0"}</span>
                  <Stars rating={place.rating ?? 0} color={starColor} />
                  <span className="opacity-70">({place.userRatingCount ?? 0} reseñas)</span>
                </div>
              </div>
              {place.googleMapsUri && (
                <a
                  href={place.googleMapsUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
                >
                  Ver en <span translate="no">Google Maps</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>

            {reviews.length > 0 ? (
              <Carousel
                key={`${autoplay}-${interval}-${loop}-${reviews.length}`}
                setApi={setApi}
                opts={{ loop, align: "start" }}
                plugins={plugins}
                className="w-full px-1"
              >
                <CarouselContent style={{ marginLeft: -gap }}>
                  {reviews.map((review, index) => {
                    const author = review.authorAttribution
                    const reviewText = review.text?.text || review.originalText?.text || ""

                    return (
                      <CarouselItem
                        key={review.name || `${author?.displayName}-${index}`}
                        className="google-review-slide"
                        style={{ paddingLeft: gap }}
                      >
                        <article
                          className="flex h-full min-h-64 flex-col rounded-2xl p-5"
                          style={{ background: cardBackground }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              {author?.photoUri ? (
                                <img
                                  src={author.photoUri}
                                  alt=""
                                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/10 font-semibold">
                                  {(author?.displayName || "G").charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                {author?.uri ? (
                                  <a
                                    href={author.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block truncate font-semibold hover:underline"
                                  >
                                    {author.displayName || "Usuario de Google"}
                                  </a>
                                ) : (
                                  <p className="truncate font-semibold">
                                    {author?.displayName || "Usuario de Google"}
                                  </p>
                                )}
                                <p className="text-xs opacity-60">
                                  {review.relativePublishTimeDescription || ""}
                                </p>
                              </div>
                            </div>
                            <span className="shrink-0 text-xs font-semibold" translate="no">
                              Google Maps
                            </span>
                          </div>

                          <div className="mt-4">
                            <Stars rating={review.rating ?? 0} color={starColor} />
                          </div>
                          {/* La clase de la letra se repite aqui a proposito: el
                              cuerpo de la reseña trae su propio `text-sm
                              leading-relaxed`, que por ser del elemento le
                              ganaria al tamaño heredado del bloque. Puesta
                              encima, el tamaño y el alto de linea del panel si
                              llegan al texto que manda Google, y mientras nadie
                              los toque no se emite regla y el parrafo se sigue
                              viendo como siempre. */}
                          <p className={`mt-4 line-clamp-6 whitespace-pre-line text-sm leading-relaxed opacity-85 ${letra.className}`}>
                            {reviewText}
                          </p>
                          {review.googleMapsUri && (
                            <a
                              href={review.googleMapsUri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-auto pt-4 text-xs font-medium hover:underline"
                            >
                              Leer en <span translate="no">Google Maps</span>
                            </a>
                          )}
                        </article>
                      </CarouselItem>
                    )
                  })}
                </CarouselContent>
                {showArrows && reviews.length > 1 && (
                  <>
                    <CarouselPrevious className="left-2 z-10" />
                    <CarouselNext className="right-2 z-10" />
                  </>
                )}
              </Carousel>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Este lugar no tiene reseñas disponibles para mostrar.
              </p>
            )}

            {showIndicators && slideCount > 1 && (
              <div className="flex justify-center gap-1.5" aria-label="Posición del carrusel">
                {Array.from({ length: slideCount }, (_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => api?.scrollTo(index)}
                    className={`h-2 rounded-full transition-all ${
                      current === index ? "w-5 bg-foreground" : "w-2 bg-foreground/25"
                    }`}
                    aria-label={`Ir al grupo ${index + 1}`}
                  />
                ))}
              </div>
            )}

            <div className="text-center text-xs text-muted-foreground">
              <p>
                Reseñas proporcionadas por <span translate="no">Google Maps</span> y ordenadas por relevancia.
              </p>
              {place.attributions && place.attributions.length > 0 && (
                <p className="mt-1">
                  {place.attributions.map((attribution, index) => (
                    <span key={`${attribution.provider}-${index}`}>
                      {index > 0 && ", "}
                      {attribution.providerUri ? (
                        <a
                          href={attribution.providerUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-foreground"
                        >
                          {attribution.provider || "Proveedor de datos"}
                        </a>
                      ) : (
                        attribution.provider || "Proveedor de datos"
                      )}
                    </span>
                  ))}
                </p>
              )}
            </div>
          </div>
        )}
      </SelectableNode>
    </>
  )
}

const slideOptions = [1, 2, 3, 4, 5]

function EditableGoogleReviewsSettings() {
  const {
    actions: { setProp },
    placeId,
    languageCode,
    slidesDesktop,
    slidesTablet,
    slidesMobile,
    gap,
    padding,
    background,
    cardBackground,
    starColor,
    autoplay,
    interval,
    showArrows,
    showIndicators,
    loop,
    customClass,
    customCss,
  } = useNode((node) => ({
    placeId: node.data.props.placeId as string,
    languageCode: node.data.props.languageCode as string,
    slidesDesktop: node.data.props.slidesDesktop as number,
    slidesTablet: node.data.props.slidesTablet as number,
    slidesMobile: node.data.props.slidesMobile as number,
    gap: node.data.props.gap as number,
    padding: node.data.props.padding as number | undefined,
    background: node.data.props.background as string,
    cardBackground: node.data.props.cardBackground as string,
    starColor: node.data.props.starColor as string,
    autoplay: node.data.props.autoplay as boolean,
    interval: node.data.props.interval as number,
    showArrows: node.data.props.showArrows as boolean,
    showIndicators: node.data.props.showIndicators as boolean,
    loop: node.data.props.loop as boolean,
    customClass: node.data.props.customClass as string | undefined,
    customCss: node.data.props.customCss as string | undefined,
  }))

  const setNumber = (key: keyof EditableGoogleReviewsProps, value: string, fallback = 0) => {
    setProp((props: EditableGoogleReviewsProps) => {
      ;(props[key] as number | undefined) = Number.parseInt(value, 10) || fallback
    })
  }

  return (
    <div className="flex flex-col">
      {/* ── Conexión ── */}
      <SettingsSection title="Contenido" className="border-t-0" defaultOpen>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Place ID de Google Maps</Label>
            <Input
              value={placeId ?? ""}
              placeholder="ChIJ..."
              onChange={(event) =>
                setProp((props: EditableGoogleReviewsProps) => {
                  props.placeId = event.target.value.trim()
                })
              }
              className="h-8 text-[12px] md:text-[12px]"
            />
            <p className="text-[11px] text-foreground/80">
              Usa el identificador del negocio, no la URL pública de Google Maps.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Idioma</Label>
            <Select
              value={languageCode ?? "es"}
              onValueChange={(value) =>
                setProp((props: EditableGoogleReviewsProps) => {
                  props.languageCode = value
                })
              }
            >
              <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="es" className="text-[12px]">Español</SelectItem>
                <SelectItem value="en" className="text-[12px]">Inglés</SelectItem>
                <SelectItem value="pt" className="text-[12px]">Portugués</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SettingsSection>

      {/* ── Distribución ── */}
      <SettingsSection title="Distribución">
        <div className="flex flex-col gap-3">
          {([
            ["slidesDesktop", "Escritorio (≥1024px)", slidesDesktop],
            ["slidesTablet", "Tableta (≥768px)", slidesTablet],
            ["slidesMobile", "Celular (<768px)", slidesMobile],
          ] as const).map(([key, label, value]) => (
            <div key={key} className="flex flex-col gap-1.5">
              <Label className="text-[11px] text-foreground/80">{label}</Label>
              <Select value={String(value)} onValueChange={(next) => setNumber(key, next, 1)}>
                <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {slideOptions.map((option) => (
                    <SelectItem key={option} value={String(option)} className="text-[12px]">{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </SettingsSection>

      {/* ── Tipografía ── */}
      <TypographySection />

      {/* ── Style Settings ── */}
      <SettingsSection title="Estilos">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-foreground/80">Espaciado</Label>
            <Input
              type="number"
              min={0}
              value={gap}
              onChange={(event) => setNumber("gap", event.target.value)}
              className="h-8 text-[12px] md:text-[12px]"
            />
          </div>

          {/* El color del texto vive en "Tipografía": es el mismo `textColor`,
              y tenerlo en dos sitios dejaria dos controles para una prop. Aqui
              se quedan los que no son letra: los fondos y las estrellas. */}
          {([
            ["background", "Fondo", background],
            ["cardBackground", "Fondo de tarjetas", cardBackground],
            ["starColor", "Estrellas", starColor],
          ] as const).map(([key, label, value]) => (
            <div key={key} className="flex flex-col gap-1.5">
              <Label className="text-[11px] text-foreground/80">{label}</Label>
              <div className="[&_button]:h-8 [&_button]:text-[12px]">
                <ColorField
                  value={value}
                  onChange={(next) =>
                    setProp((props: EditableGoogleReviewsProps) => {
                      props[key] = next
                    })
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </SettingsSection>

      {/* ── Carrusel ── */}
      <SettingsSection title="Carrusel">
        <div className="flex flex-col gap-3">
          {([
            ["autoplay", "Reproducción automática", autoplay],
            ["showArrows", "Mostrar flechas", showArrows],
            ["showIndicators", "Mostrar indicadores", showIndicators],
            ["loop", "Carrusel infinito", loop],
          ] as const).map(([key, label, checked]) => (
            <Label key={key} className="flex items-center gap-2 text-[11px] text-foreground/80">
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) =>
                  setProp((props: EditableGoogleReviewsProps) => {
                    props[key] = event.target.checked
                  })
                }
              />
              {label}
            </Label>
          ))}

          {autoplay && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] text-foreground/80">Intervalo (ms)</Label>
              <Input
                type="number"
                min={1500}
                step={500}
                value={interval}
                onChange={(event) => setNumber("interval", event.target.value, 5000)}
                className="h-8 text-[12px] md:text-[12px]"
              />
            </div>
          )}
        </div>
      </SettingsSection>

      <SpacingSection legacy={spacingLegacyOf({ padding })} />

      <BorderSection />

      <AdvancedSection
        customClass={customClass ?? ""}
        onCustomClassChange={(val) =>
          setProp((props: EditableGoogleReviewsProps) => (props.customClass = val))
        }
        customCss={customCss ?? ""}
        onCustomCssChange={(val) =>
          setProp((props: EditableGoogleReviewsProps) => (props.customCss = val))
        }
      />
    </div>
  )
}

EditableGoogleReviews.craft = {
  displayName: "Reseñas de Google",
  props: {
    placeId: "",
    languageCode: "es",
    slidesDesktop: 3,
    slidesTablet: 2,
    slidesMobile: 1,
    gap: 16,
    padding: 24,
    background: "transparent",
    borderStyle: "solid" as const,
    borderColor: "transparent",
    cardBackground: "#f5f5f7",
    textColor: "#303030",
    starColor: "#ff7a00",
    autoplay: false,
    interval: 5000,
    showArrows: true,
    showIndicators: true,
    loop: true,
    hiddenOnDesktop: false,
    hiddenOnTablet: false,
    hiddenOnMobile: false,
  },
  related: {
    settings: EditableGoogleReviewsSettings,
  },
  rules: {
    canDrag: () => true,
    // Hoja: no pinta hijos, asi que no admite que se suelte ni pegue nada dentro.
    canMoveIn: () => false,
  },
}
