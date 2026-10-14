// Marca de seleccion comun a los componentes del editor: el contenedor que
// craft.js usa para conectar y arrastrar el nodo, mas el borde que lo resalta
// al seleccionarlo.
//
// Vive en un solo sitio a proposito. Cuando cada componente se pintaba su
// propia marca acabaron conviviendo tres: outline morado en 27, outline verde
// en 4 y un borde naranja en 2. Con el wrapper, el color y el grosor se cambian
// aqui una vez y valen para todos.

import type { CSSProperties, ElementType, MouseEventHandler, ReactNode } from "react"
import { useEditor, useNode } from "@craftjs/core"
import { cn } from "@/shared/utils/utils"
import { popupDataAttributes, type PopupTarget } from "@/modules/ecommerce/editor/components/link-section"

const HIDDEN_BADGE =
    "bg-amber-500 text-white text-[9px] font-bold px-1 py-0.5 rounded leading-none"

interface SelectableNodeProps {
    children: ReactNode
    // Clases del propio componente (tamano, overflow, clases generadas...). En
    // edicion el wrapper le antepone "relative", que es de lo que cuelgan los
    // overlays.
    className?: string
    style?: CSSProperties
    /**
     * Marca el componente como clicable en modo edicion (cursor de mano).
     *
     * Solo para los que responden al clic por si mismos (boton, buscador,
     * carrito, cuenta): el cursor avisa de que ahi hay algo que en la tienda
     * reacciona, aunque en el editor solo sirva para seleccionar.
     *
     * Antes esto era una capa transparente por encima del contenido. Dejo de
     * hacer falta cuando el contenido paso a no recibir el puntero, que ademas
     * lo consigue sin tapar a los hijos.
     */
    clickable?: boolean
    /**
     * Etiqueta a renderizar. Por defecto "div", pero hay componentes que se
     * sirven en la tienda publica como <section>: forzarlos a div les cambiaria
     * la semantica del HTML publicado, no solo el editor.
     */
    as?: ElementType
    /**
     * Destino del enlace cuando el componente se sirve como <a> (ver `as`).
     *
     * Lo necesita el Contenedor, que es canvas: su enlace tiene que ser el
     * mismo elemento que craft conecta y arrastra. Un <a> por fuera dejaria el
     * nodo del editor dentro de un elemento que craft no conoce, y uno por
     * dentro partiria el layout, porque el flex o el grid los reparte esta
     * caja y sus hijos dejarian de ser hijos suyos.
     *
     * En edicion no se escribe ninguno de los tres: ahi el clic sirve para
     * seleccionar el bloque, igual que en Imagen, Boton e Icono. Estos lo
     * resuelven con preventDefault en su propio onClick, pero aqui no vale:
     * este wrapper ya se come el onClick mientras se edita, y ademas un <a>
     * con href arranca el arrastre nativo del navegador y le pisa el de craft.
     */
    href?: string
    target?: string
    rel?: string
    /**
     * Lo que el componente le hace a un popup al pulsarlo, cuando su tipo de
     * enlace es "Popup" (ver LinkSection y ModalProvider). Por lo mismo que
     * `href`: tiene que ir en el elemento que craft conecta, y solo fuera del
     * editor. Lo convierte en un boton para el lector de pantalla y el teclado.
     */
    popup?: PopupTarget | null
    /**
     * Id del DOM. Varios componentes lo exponen como propiedad editable ("Id")
     * y de el dependen los enlaces ancla (#mi-seccion) y los disparadores de
     * modales de paginas ya publicadas: si el wrapper no lo reenviara, migrarlas
     * las romperia en silencio.
     */
    id?: string
    // Handlers del contenedor. Algunos componentes los necesitan en la raiz: el
    // area de clic o de hover que ve el cliente es justo la del contenedor, y
    // bajarlos a un hijo la encogeria.
    onClick?: MouseEventHandler<HTMLElement>
    onMouseEnter?: MouseEventHandler<HTMLElement>
    onMouseLeave?: MouseEventHandler<HTMLElement>
    /** Clases que solo se aplican mientras el nodo esta seleccionado. */
    activeClassName?: string
    /**
     * Deja que el contenido siga recibiendo el puntero en modo edicion.
     *
     * Por defecto el wrapper lo apaga, que es lo que impide que al editar se
     * disparen los enlaces, los botones y los hover de la tienda. Solo lo
     * necesitan los componentes que se escriben dentro del canvas (Texto y
     * Texto enriquecido): sin puntero no se puede colocar el cursor.
     */
    contentEvents?: boolean
}

export function SelectableNode({
    children,
    className,
    style,
    clickable = false,
    as: Tag = "div",
    href,
    target,
    rel,
    popup,
    id,
    onClick,
    onMouseEnter,
    onMouseLeave,
    activeClassName,
    contentEvents = false,
}: SelectableNodeProps) {
    const {
        connectors: { connect, drag },
        isActive,
        hiddenOnDesktop,
        hiddenOnTablet,
        hiddenOnMobile,
    } = useNode((node) => ({
        isActive: node.events.selected,
        // Las lee del nodo y no por props: asi las marcas D/T/M salen en los
        // 33 componentes sin que cada uno tenga que acordarse de pasarlas.
        hiddenOnDesktop: Boolean(node.data.props.hiddenOnDesktop),
        hiddenOnTablet: Boolean(node.data.props.hiddenOnTablet),
        hiddenOnMobile: Boolean(node.data.props.hiddenOnMobile),
    }))

    const { enabled } = useEditor((state) => ({
        enabled: state.options.enabled,
    }))

    return (
        <Tag
            ref={(ref: HTMLElement | null) => {
                if (ref && enabled) connect(drag(ref))
            }}
            id={id}
            // El enlace solo fuera del editor, por lo dicho en la prop `href`.
            href={enabled ? undefined : href}
            target={enabled ? undefined : target}
            rel={enabled ? undefined : rel}
            {...(popup && !enabled
                ? { ...popupDataAttributes(popup), role: "button", tabIndex: 0 }
                : {})}
            // El "relative" solo en edicion: es el ancla de los overlays, que no
            // existen fuera del editor. En la tienda publica el componente se
            // sirve con sus clases de siempre, sin CSS del editor encima.
            className={cn(
                enabled && "relative",
                // En edicion el contenido no recibe el puntero: asi no se
                // disparan los enlaces, los botones ni los hover de la tienda.
                // pointer-events se hereda, con lo que basta apagarlo en los
                // hijos directos para que caiga todo el subarbol.
                enabled && !contentEvents && "[&>*]:pointer-events-none",
                // ...y el nodo lo recupera para si mismo, porque su padre pudo
                // haberlo apagado: es lo que mantiene seleccionables y
                // soltables los componentes anidados. Con "!" para ganarle al
                // [&>*] del padre, que tiene la misma especificidad.
                enabled && "!pointer-events-auto",
                // El contenido no recibe el puntero, asi que el cursor lo pone
                // este contenedor y cubre toda el area del componente.
                enabled && clickable && "cursor-pointer",
                // Un <a> ya trae la mano; el div que abre un popup no.
                !enabled && popup && "cursor-pointer",
                className,
                isActive && activeClassName,
            )}
            style={style}
            // En edicion no se registra ningun evento de tienda: el componente
            // conserva sus props y se guarda igual, pero no navega, no abre
            // popovers ni responde al hover mientras se edita. Fuera del editor
            // (preview y tienda publica son el mismo enabled=false) van todos.
            onClick={enabled ? undefined : onClick}
            onMouseEnter={enabled ? undefined : onMouseEnter}
            onMouseLeave={enabled ? undefined : onMouseLeave}
        >
            {/* El borde se dibuja hacia dentro (inset-0) y no captura el puntero,
                para no robarle el clic a la capa de arriba.
                ERP: el lienzo lleva los colores de la tienda (.store-canvas), asi
                que el borde usa el color del editor (--editor-chrome) y no
                --primary, que ahi seria negro. */}
            {enabled && isActive && (
                <div className="absolute inset-0 z-20 pointer-events-none border-2 border-[hsl(var(--editor-chrome))]" />
            )}
            {/* Marcas de "oculto en escritorio / tableta / celular". Solo en
                edicion: en la tienda el componente directamente no se pinta en
                ese dispositivo. Por encima del borde de seleccion. */}
            {enabled && (hiddenOnDesktop || hiddenOnTablet || hiddenOnMobile) && (
                <div className="absolute top-1 right-1 z-30 flex gap-0.5 pointer-events-none">
                    {hiddenOnDesktop && <span className={HIDDEN_BADGE}>D</span>}
                    {hiddenOnTablet && <span className={HIDDEN_BADGE}>T</span>}
                    {hiddenOnMobile && <span className={HIDDEN_BADGE}>M</span>}
                </div>
            )}
            {children}
        </Tag>
    )
}
