import { useCallback, useEffect, useRef, useState } from "react"
import Image from "@/modules/ecommerce/editor/tienda/next-image"
import { Search, X, ImageIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { PopoverListSkeleton } from "@/shared/components/popover-list/PopoverListSkeleton"
import {
    POPOVER_LIST_COLLISION_PADDING,
    POPOVER_LIST_CONTENT_CLASS,
} from "@/shared/components/popover-list/popoverList"
import { usePopoverListSide } from "@/shared/components/popover-list/usePopoverListSide"

// Alto del popover con la lista llena: buscador 41 + lista 260 + pie 45 + bordes.
const ALTURA_POPOVER = 350
import { getProductList, getProductGrid } from "@/modules/ecommerce/editor/tienda/api"
import type { EdgeProduct } from "@/modules/ecommerce/editor/tienda/types"
import { useDebounce } from "@/modules/ecommerce/editor/hooks/use-debounce"
import { cn } from "@/shared/utils/utils"

const PAGE_SIZE = 10

interface SelectedProduct {
    id: number
    name: string
}

interface ProductIdsPickerProps {
    value: string
    onChange: (csv: string) => void
    disabled?: boolean
}

function parseIds(csv: string): number[] {
    return (csv || "")
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id !== "" && !isNaN(Number(id)))
        .map((id) => Number(id))
}

export function ProductIdsPicker({ value, onChange, disabled }: ProductIdsPickerProps) {
    const [open, setOpen] = useState(false)
    const { triggerRef, side } = usePopoverListSide(open, ALTURA_POPOVER)
    const [selected, setSelected] = useState<SelectedProduct[]>([])

    const [search, setSearch] = useState("")
    const debouncedSearch = useDebounce(search, 400)
    const [page, setPage] = useState(1)
    const [items, setItems] = useState<EdgeProduct[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(false)

    // Hidrata los badges (nombre de cada producto) a partir del CSV persistido.
    const hydratedRef = useRef<string>("")
    useEffect(() => {
        const ids = parseIds(value)
        const key = ids.join(",")
        if (hydratedRef.current === key) return
        hydratedRef.current = key

        if (ids.length === 0) {
            setSelected([])
            return
        }

        let cancelled = false
        const hydrate = async () => {
            const response = await getProductGrid({ product_ids: ids })
            if (cancelled) return
            const byId = new Map(response.data.data.map((p) => [p.product_id, p.name]))
            setSelected(ids.map((id) => ({ id, name: byId.get(id) ?? "" })))
        }
        hydrate()
        return () => {
            cancelled = true
        }
    }, [value])

    // Listado paginado / búsqueda del popover.
    useEffect(() => {
        if (!open) return
        let cancelled = false
        const fetchPage = async () => {
            setLoading(true)
            const response = await getProductList(
                undefined,
                PAGE_SIZE,
                page,
                debouncedSearch.trim() || undefined,
            )
            if (cancelled) return
            setItems(response.success ? response.data : [])
            // El total solo viene si la edge function devuelve info de paginacion.
            setTotal(response.page?.total ?? 0)
            setLoading(false)
        }
        fetchPage()
        return () => {
            cancelled = true
        }
    }, [open, page, debouncedSearch])

    useEffect(() => {
        setPage(1)
    }, [debouncedSearch])

    const emit = useCallback(
        (next: SelectedProduct[]) => {
            setSelected(next)
            const csv = next.map((p) => p.id).join(", ")
            hydratedRef.current = next.map((p) => p.id).join(",")
            onChange(csv)
        },
        [onChange],
    )

    const toggle = (product: EdgeProduct) => {
        const exists = selected.some((p) => p.id === product.product_id)
        emit(
            exists
                ? selected.filter((p) => p.id !== product.product_id)
                : [...selected, { id: product.product_id, name: product.name }],
        )
    }

    const remove = (id: number) => emit(selected.filter((p) => p.id !== id))

    const from = items.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
    const to = (page - 1) * PAGE_SIZE + items.length
    // Sin total conocido, se infiere que hay mas paginas si la actual vino llena.
    const hasNext = total > 0 ? page * PAGE_SIZE < total : items.length === PAGE_SIZE

    return (
        <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
            <PopoverTrigger asChild disabled={disabled} ref={triggerRef}>
                <div
                    role="button"
                    tabIndex={disabled ? -1 : 0}
                    className={cn(
                        "flex min-h-9 w-full flex-wrap items-center gap-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm",
                        disabled
                            ? "cursor-not-allowed opacity-50"
                            : "cursor-pointer hover:border-ring",
                    )}
                >
                    {selected.length === 0 ? (
                        <span className="text-muted-foreground">Seleccionar productos...</span>
                    ) : (
                        selected.map((p) => (
                            <Badge
                                key={p.id}
                                variant="secondary"
                                className="gap-1 pr-1 font-normal"
                            >
                                <span>
                                    #{p.id}
                                    {p.name ? ` ${p.name}` : ""}
                                </span>
                                <button
                                    type="button"
                                    aria-label={`Quitar producto ${p.id}`}
                                    className="rounded-full p-0.5 hover:bg-background/60"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        remove(p.id)
                                    }}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))
                    )}
                </div>
            </PopoverTrigger>

            <PopoverContent
                side={side}
                align="start"
                collisionPadding={POPOVER_LIST_COLLISION_PADDING}
                className={cn(POPOVER_LIST_CONTENT_CLASS, "w-[360px]")}
            >
                <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2.5">
                    <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <input
                        autoFocus
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar producto o SKU..."
                        className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                </div>

                <div className="min-h-0 max-h-[260px] flex-1 overflow-y-auto">
                    {loading ? (
                        <PopoverListSkeleton count={PAGE_SIZE} />
                    ) : items.length === 0 ? (
                        <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                            No se encontraron productos
                        </div>
                    ) : (
                        items.map((product, index) => {
                            const isSelected = selected.some((p) => p.id === product.product_id)
                            const image = product.images?.[0]
                            return (
                                <button
                                    key={product.product_id}
                                    type="button"
                                    onClick={() => toggle(product)}
                                    className={cn(
                                        "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-accent",
                                        isSelected && "bg-secondary text-secondary-foreground hover:bg-secondary",
                                    )}
                                >
                                    <span className="w-6 shrink-0 text-xs text-muted-foreground">
                                        #{(page - 1) * PAGE_SIZE + index + 1}
                                    </span>
                                    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-muted">
                                        {image ? (
                                            <Image
                                                src={image}
                                                alt={product.name}
                                                fill
                                                sizes="40px"
                                                className="object-cover"
                                            />
                                        ) : (
                                            <ImageIcon className="absolute inset-0 m-auto h-4 w-4 text-muted-foreground" />
                                        )}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-medium">
                                            {product.name}
                                        </span>
                                        <span className="block text-xs text-muted-foreground">
                                            {product.product_id}
                                        </span>
                                    </span>
                                </button>
                            )
                        })
                    )}
                </div>

                <div className="flex shrink-0 items-center justify-between gap-2 border-t px-3 py-2">
                    <span className="text-xs text-muted-foreground">
                        {from}-{to}
                        {total > 0 ? ` de ${total}` : ""}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            disabled={page <= 1 || loading}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                            Anterior
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            disabled={!hasNext || loading}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            Siguiente
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
