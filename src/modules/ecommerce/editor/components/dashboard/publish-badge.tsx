import { Badge, type BadgeProps } from "@/components/ui/badge"
import { cn } from "@/shared/utils/utils"
import { type PublishState } from "@/modules/ecommerce/editor/lib/editor-store"

/**
 * El estado de una fila, como pastilla del sistema.
 *
 * Se mapea estado -> variante del Badge, nunca estado -> clases de color: los
 * colores los ponen los pares fijos fondo+texto de cada variante.
 *
 *   Publicada  -> success: vivo para todo el mundo.
 *   Privada    -> info: vivo, pero solo para quien viene del ERP.
 *   Programada -> warning: sale sola en su fecha.
 *   Borrador   -> pending: nunca se publico.
 *   En papelera-> secondary: no se ve en ningun sitio.
 *
 * El matiz "tiene cambios sin publicar" (`pending`) va como una segunda pastilla
 * pequena, no como un estado mas: una pagina puede estar Publicada o Privada y a
 * la vez tener un borrador guardado que el publico todavia no ve.
 */
const ESTADOS: Record<
  PublishState,
  { texto: string; variant: BadgeProps["variant"]; title: string }
> = {
  published: {
    texto: "Publicada",
    variant: "success",
    title: "Publicada: es lo que ve el publico",
  },
  private: {
    texto: "Privada",
    variant: "info",
    title: "Privada: solo la ven los usuarios que vienen del ERP",
  },
  scheduled: {
    texto: "Programada",
    variant: "warning",
    title: "Programada: se publicara sola en su fecha",
  },
  draft: {
    texto: "Borrador",
    variant: "pending",
    title: "Borrador: no se ve en el sitio",
  },
  trash: {
    texto: "En papelera",
    variant: "secondary",
    title: "En la papelera: no se ve en ningun sitio",
  },
}

/** Fecha corta para la programada: "20 sep, 15:00". */
function fechaCorta(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleString("es-PE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function PublishBadge({
  state,
  pending = false,
  scheduledAt,
  className,
}: {
  state: PublishState
  /** Hay cambios guardados sin publicar sobre lo que esta vivo. */
  pending?: boolean
  /** Para el estado `scheduled`: se muestra la fecha junto a la pastilla. */
  scheduledAt?: string | null
  className?: string
}) {
  const estado = ESTADOS[state]
  const fecha = state === "scheduled" ? fechaCorta(scheduledAt) : null

  return (
    <span className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <Badge variant={estado.variant} title={estado.title}>
        {estado.texto}
      </Badge>

      {fecha && (
        <span className="text-xs text-muted-foreground" title="Fecha de publicación programada">
          {fecha}
        </span>
      )}

      {/* Solo tiene sentido sobre algo vivo: en Borrador/Programada/Papelera el
          borrador ES el contenido, no un cambio "por encima" de lo publicado. */}
      {pending && (state === "published" || state === "private") && (
        <Badge
          variant="warning"
          title="Hay cambios guardados que el público todavía no ve"
        >
          Cambios sin publicar
        </Badge>
      )}
    </span>
  )
}
