import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
import { getCategories } from "@/modules/ecommerce/editor/tienda/api"
import type { EdgeCategory } from "@/modules/ecommerce/editor/tienda/types"
import { useDebounce } from "@/modules/ecommerce/editor/hooks/use-debounce"
import { cn } from "@/shared/utils/utils"

const PAGE_SIZE = 10

interface CategoryIdsPickerProps {
    value: string
    onChange: (csv: string) => void
    disabled?: boolean
}

export function parseCategoryIds(csv: string): number[] {
    return (csv || "")
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id !== "" && !isNaN(Number(id)))
        .map((id) => Number(id))
}

export function CategoryIdsPicker({ value, onChange, disabled }: CategoryIdsPickerProps) {
    const [open, setOpen] = useState(false)
    const { triggerRef, side } = usePopoverListSide(open, ALTURA_POPOVER)

    const [search, setSearch] = useState("")
    const debouncedSearch = useDebounce(search, 300)
    const [page, setPage] = useState(1)
    const [categories, setCategories] = useState<EdgeCategory[]>([])
    const [loading, setLoading] = useState(false)

    const selectedIds = useMemo(() => parseCategoryIds(value), [value])

    // Todas las categorias se traen una sola vez; la busqueda y la paginacion
    // se resuelven en cliente sobre esa lista cacheada.
    const loadedRef = useRef(false)
    const needsList = open || selectedIds.length > 0
    useEffect(() => {
        if (!needsList || loadedRef.current) return
        loadedRef.current = true

        let cancelled = false
        const load = async () => {
            setLoading(true)
            const response = await getCategories()
            if (cancelled) return
            setCategories(response.success ? response.data.filter((c) => c.id !== 0) : [])
            setLoading(false)
        }
        load()
        return () => {
            cancelled = true
        }
    }, [needsList])

    const filtered = useMemo(() => {
        const term = debouncedSearch.trim().toLowerCase()
        if (!term) return categories
        return categories.filter(
            (c) =>
                c.name.toLowerCase().includes(term) || String(c.id).includes(term),
        )
    }, [categories, debouncedSearch])

    useEffect(() => {
        setPage(1)
    }, [debouncedSearch])

    const total = filtered.length
    const items = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    const nameById = useMemo(
        () => new Map(categories.map((c) => [c.id, c.name])),
        [categories],
    )

    const emit = useCallback(
        (next: number[]) => {
            onChange(next.join(", "))
        },
        [onChange],
    )

    const toggle = (category: EdgeCategory) => {
        emit(
            selectedIds.includes(category.id)
                ? selectedIds.filter((id) => id !== category.id)
                : [...selectedIds, category.id],
        )
    }

    const remove = (id: number) => emit(selectedIds.filter((i) => i !== id))

    const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
    const to = Math.min(page * PAGE_SIZE, total)
    const hasNext = page * PAGE_SIZE < total

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
                    {selectedIds.length === 0 ? (
                        <span className="text-muted-foreground">Seleccionar categorías...</span>
                    ) : (
                        selectedIds.map((id) => {
                            const name = nameById.get(id)
                            return (
                                <Badge
                                    key={id}
                                    variant="secondary"
                                    className="gap-1 pr-1 font-normal"
                                >
                                    <span>
                                        #{id}
                                        {name ? ` ${name}` : ""}
                                    </span>
                                    <button
                                        type="button"
                                        aria-label={`Quitar categoría ${id}`}
                                        className="rounded-full p-0.5 hover:bg-background/60"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            remove(id)
                                        }}
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            )
                        })
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
                        placeholder="Buscar categoría o ID..."
                        className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                </div>

                <div className="min-h-0 max-h-[260px] flex-1 overflow-y-auto">
                    {loading ? (
                        <PopoverListSkeleton count={PAGE_SIZE} />
                    ) : items.length === 0 ? (
                        <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                            No se encontraron categorías
                        </div>
                    ) : (
                        items.map((category, index) => {
                            const isSelected = selectedIds.includes(category.id)
                            const image = category.image_url
                            return (
                                <button
                                    key={category.id}
                                    type="button"
                                    onClick={() => toggle(category)}
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
                                                alt={category.name}
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
                                            {category.name}
                                        </span>
                                        <span className="block text-xs text-muted-foreground">
                                            {category.id}
                                        </span>
                                    </span>
                                </button>
                            )
                        })
                    )}
                </div>

                <div className="flex shrink-0 items-center justify-between gap-2 border-t px-3 py-2">
                    <span className="text-xs text-muted-foreground">
                        {from}-{to} de {total}
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
