// La seccion "Enlace" del panel de propiedades, para cualquier bloque que pueda
// llevar a una direccion.
//
// Vive aparte porque la comparten ya el Contenedor y el Boton, y la van a
// necesitar los demas bloques que hoy tienen `href` suelto (Imagen, Icono,
// Texto, Titulo). Escrita en cada panel se iria desincronizando: el Boton
// emparejaba su label con el campo y el Contenedor no, y el Boton no le ponia
// al Input el `md:text-[12px]` que hace falta para que no crezca a 14px en
// escritorio.
//
// Las props que lee y escribe se llaman igual en todos: `href`,
// `openInNewTab` y, solo donde el bloque puede no navegar, `linkType` (con
// `popupSlug` y `popupAction` cuando abre un popup, ver ModalProvider).

import { useEffect, useId, useState, type ReactNode } from "react"
import { useNode } from "@craftjs/core"
import { listPages, type VisualEditListItem } from "@/modules/ecommerce/editor/lib/editor-store"
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
import { FieldLabel } from "@/modules/ecommerce/editor/components/field-label"
import { SettingsSection } from "@/modules/ecommerce/editor/components/settings-section"

export type PopupLinkAction = "open" | "close" | "toggle"

export type PopupTarget = { action: PopupLinkAction; slug: string }

/**
 * Lo que un bloque de tipo "Popup" le hace a que popup, o null si no hace
 * nada: sin popup elegido solo tiene sentido "Cerrar", que cierra el abierto.
 */
export function popupTargetOf(props: {
    linkType?: string
    popupSlug?: string
    popupAction?: PopupLinkAction
}): PopupTarget | null {
    if (props.linkType !== "popup") return null
    const action = props.popupAction ?? "open"
    const slug = props.popupSlug ?? ""
    if (!slug && action !== "close") return null
    return { action, slug }
}

/** Los atributos que lee ModalProvider para ejecutar la accion. */
export function popupDataAttributes(target: PopupTarget) {
    return { "data-popup-action": target.action, "data-popup-slug": target.slug }
}

type LinkProps = {
    href?: string
    openInNewTab?: boolean
    linkType?: "url" | "button" | "popup"
    popupSlug?: string
    popupAction?: PopupLinkAction
    [key: string]: unknown
}

/**
 * Que popup abre y que hace con el. Va aparte para pedir la lista de popups
 * solo cuando el bloque es de tipo "Popup", y no cada vez que se abre la
 * seccion Enlace de cualquier boton.
 */
function PopupLinkFields({
    popupSlug,
    popupAction,
    onChange,
}: {
    popupSlug: string | undefined
    popupAction: PopupLinkAction | undefined
    onChange: (patch: Pick<LinkProps, "popupSlug" | "popupAction">) => void
}) {
    const [popups, setPopups] = useState<VisualEditListItem[]>([])
    const [loading, setLoading] = useState(true)
    const popupId = useId()
    const accionId = useId()

    useEffect(() => {
        let vivo = true
        listPages()
            .then((pages) => {
                if (vivo) setPopups(pages.filter((page) => page.type === "modal"))
            })
            .catch((error) => console.error("Error loading popups:", error))
            .finally(() => {
                if (vivo) setLoading(false)
            })
        return () => {
            vivo = false
        }
    }, [])

    const action = popupAction ?? "open"

    return (
        <>
            <div className="flex flex-col gap-1.5">
                <Label htmlFor={accionId} className="text-[11px] text-foreground/80">Acción</Label>
                <Select
                    value={action}
                    onValueChange={(val) => onChange({ popupAction: val as PopupLinkAction })}
                >
                    <SelectTrigger id={accionId} className="h-8 text-[12px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem className="text-[12px]" value="open">Abrir popup</SelectItem>
                        <SelectItem className="text-[12px]" value="toggle">Abrir o cerrar popup</SelectItem>
                        <SelectItem className="text-[12px]" value="close">Cerrar popup</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-col gap-1.5">
                <Label htmlFor={popupId} className="text-[11px] text-foreground/80">Popup</Label>
                <Select
                    value={popupSlug || ""}
                    onValueChange={(val) => onChange({ popupSlug: val })}
                >
                    <SelectTrigger id={popupId} className="h-8 text-[12px]">
                        <SelectValue placeholder={loading ? "Cargando popups..." : "Selecciona un popup"} />
                    </SelectTrigger>
                    <SelectContent>
                        {popups.map((popup) => (
                            <SelectItem className="text-[12px]" key={popup.id} value={popup.slug}>
                                {popup.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {/* Sin popup, "Cerrar" cierra el que este abierto: es lo que
                    quiere un boton puesto dentro del propio popup. */}
                {action === "close" && (
                    <p className="text-[11px] text-muted-foreground">
                        Déjalo vacío para cerrar el popup que esté abierto.
                    </p>
                )}
            </div>
        </>
    )
}

const LINK_TYPE_LABELS: Record<LinkType, string> = {
    button: "Botón",
    url: "URL",
    popup: "Popup",
}

type LinkType = NonNullable<LinkProps["linkType"]>

export function LinkSection({
    help,
    helpLabel,
    withLinkType = false,
    linkTypes,
    placeholder = "https://ejemplo.com",
    className,
    defaultOpen,
}: {
    /** Ayuda del campo, en el tooltip del icono. Ver FieldLabel. */
    help?: ReactNode
    /** Texto accesible del icono de ayuda. */
    helpLabel?: string
    /**
     * Enseña el desplegable "Tipo de enlace" con los tres tipos.
     *
     * Solo lo quiere el bloque que puede no navegar: un Boton de tipo "Botón"
     * dispara algo en la propia pagina, asi que ni el campo del enlace ni la
     * pestaña nueva le sirven de nada y se ocultan.
     */
    withLinkType?: boolean
    /**
     * Los tipos que ofrece el desplegable, para el bloque que no tiene esa vida
     * de Boton pero si puede abrir un popup: un Contenedor, un Icono o una
     * Imagen van con `["url", "popup"]`. Gana sobre `withLinkType`.
     */
    linkTypes?: LinkType[]
    placeholder?: string
    className?: string
    defaultOpen?: boolean
}) {
    const {
        actions: { setProp },
        href,
        openInNewTab,
        linkType,
        popupSlug,
        popupAction,
    } = useNode((node) => ({
        href: node.data.props.href as string | undefined,
        openInNewTab: node.data.props.openInNewTab as boolean | undefined,
        linkType: node.data.props.linkType as LinkProps["linkType"],
        popupSlug: node.data.props.popupSlug as string | undefined,
        popupAction: node.data.props.popupAction as PopupLinkAction | undefined,
    }))

    const enlaceId = useId()
    const pestanaId = useId()

    const tipos: LinkType[] | null =
        linkTypes ?? (withLinkType ? ["button", "url", "popup"] : null)

    // Sin el desplegable no hay "otra vida" posible: el bloque siempre puede
    // llevar enlace, asi que el campo y la pestaña se enseñan siempre.
    const navega = !tipos || (linkType ?? "url") === "url"

    return (
        <SettingsSection title="Enlace" className={className} defaultOpen={defaultOpen}>
            <div className="flex flex-col gap-3">
                {tipos && (
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[11px] text-foreground/80">Tipo de enlace</Label>
                        <Select
                            value={linkType ?? "url"}
                            onValueChange={(val) =>
                                setProp((props: LinkProps) => {
                                    props.linkType = val as LinkProps["linkType"]
                                })
                            }
                        >
                            <SelectTrigger className="h-8 text-[12px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {tipos.map((tipo) => (
                                    <SelectItem key={tipo} className="text-[12px]" value={tipo}>
                                        {LINK_TYPE_LABELS[tipo]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {tipos?.includes("popup") && linkType === "popup" && (
                    <PopupLinkFields
                        popupSlug={popupSlug}
                        popupAction={popupAction}
                        onChange={(patch) =>
                            setProp((props: LinkProps) => {
                                Object.assign(props, patch)
                            })
                        }
                    />
                )}

                {navega && (
                    <div className="flex flex-col gap-1.5">
                        <FieldLabel htmlFor={enlaceId} help={help} helpLabel={helpLabel}>
                            Enlace
                        </FieldLabel>
                        <Input
                            id={enlaceId}
                            className="h-8 text-[12px] md:text-[12px]"
                            placeholder={placeholder}
                            value={href ?? ""}
                            onChange={(e) =>
                                setProp((props: LinkProps) => {
                                    props.href = e.target.value
                                })
                            }
                        />
                    </div>
                )}

                {/* Va pegado a su campo: depende de el y sin enlace no hay
                    ninguna pestaña que abrir. */}
                {navega && (
                    <div className="flex items-center justify-between">
                        <Label htmlFor={pestanaId} className="text-[11px] text-foreground/80">
                            Abrir en nueva pestaña
                        </Label>
                        <Switch
                            id={pestanaId}
                            checked={Boolean(openInNewTab)}
                            onCheckedChange={(val) =>
                                setProp((props: LinkProps) => {
                                    props.openInNewTab = val
                                })
                            }
                        />
                    </div>
                )}
            </div>
        </SettingsSection>
    )
}
