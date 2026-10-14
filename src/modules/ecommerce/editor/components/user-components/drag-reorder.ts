// Utilidades compartidas para reordenar por drag las listas de items de los
// paneles de settings (mismo patron que editable-card-carousel): cada item
// recibe un id y un nombre fijo ("Card N", "Slide N", ...) al crearse, que
// viajan con el al reordenar.

import { useState, type DragEvent } from "react"

export function generateId(): string {
  return Math.random().toString(36).slice(2, 9)
}

export function reorderById<T extends { id?: string }>(
  items: T[],
  fromId: string,
  toId: string
): T[] {
  if (fromId === toId) return items
  const fromIndex = items.findIndex((it) => it.id === fromId)
  const toIndex = items.findIndex((it) => it.id === toId)
  if (fromIndex === -1 || toIndex === -1) return items
  const next = [...items]
  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)
  return next
}

// Rellena id/nombre en items guardados antes de que existieran estos campos.
export function backfillIdsAndNames<T extends { id?: string; name?: string }>(
  items: T[],
  namePrefix: string
): T[] {
  return items.map((it, i) => ({
    ...it,
    id: it.id ?? generateId(),
    name: it.name ?? `${namePrefix} ${i + 1}`,
  }))
}

// Mismo criterio que el `??` de backfillIdsAndNames: solo falta lo que esta
// ausente. Un nombre vacio a proposito (el usuario borro el campo) no se
// rellena; si aqui se usara `!it.name`, el backfill nunca lo completaria y el
// efecto que lo llama se repetiria en bucle.
export function needsBackfill(items: Array<{ id?: string; name?: string }>): boolean {
  return items.some((it) => it.id == null || it.name == null)
}

// Siguiente nombre por defecto libre ("Beneficio 3"): mira los items que ya
// siguen el patron "<prefijo> <n>" para no repetir numero despues de borrar.
export function nextDefaultName(
  items: Array<{ name?: string }>,
  prefix: string
): string {
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const pattern = new RegExp(`^${escaped}\\s+(\\d+)$`)
  let max = 0
  for (const it of items) {
    const match = it.name?.trim().match(pattern)
    if (match) max = Math.max(max, parseInt(match[1], 10))
  }
  return `${prefix} ${max + 1}`
}

// Nombre para una copia: "Beneficio 1" -> "Beneficio 1 (1)". El sufijo no se
// anida (duplicar "Beneficio 1 (1)" da "Beneficio 1 (2)"): se parte siempre del
// nombre base y se busca el primer numero de copia libre.
export function nextCopyName(items: Array<{ name?: string }>, name: string): string {
  const base = name.trim().replace(/\s*\(\d+\)$/, "").trim() || name.trim()
  const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const pattern = new RegExp(`^${escaped}\\s*\\((\\d+)\\)$`)
  let max = 0
  for (const it of items) {
    const match = it.name?.trim().match(pattern)
    if (match) max = Math.max(max, parseInt(match[1], 10))
  }
  return `${base} (${max + 1})`
}

// Duplica el item de `index` y deja la copia justo debajo del original, con id
// nuevo y nombre de copia. `prefix` solo se usa si el item no tiene nombre.
export function duplicateAt<T extends { id?: string; name?: string }>(
  items: T[],
  index: number,
  prefix: string
): T[] {
  const source = items[index]
  if (!source) return items
  const base = source.name?.trim() || `${prefix} ${index + 1}`
  const copy = { ...source, id: generateId(), name: nextCopyName(items, base) }
  const next = [...items]
  next.splice(index + 1, 0, copy)
  return next
}

export function useDragReorder(onReorder: (fromId: string, toId: string) => void) {
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const handleDragStart = (e: DragEvent<HTMLElement>, id: string) => {
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", id)
    const headerRow = e.currentTarget.parentElement
    if (headerRow) e.dataTransfer.setDragImage(headerRow, 12, 12)
    setDraggedId(id)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setOverId(null)
  }

  const handleDragOver = (e: DragEvent<HTMLElement>, id?: string) => {
    if (draggedId && id) {
      e.preventDefault()
      setOverId(id)
    }
  }

  const handleDrop = (e: DragEvent<HTMLElement>, targetId?: string) => {
    e.preventDefault()
    if (draggedId && targetId && draggedId !== targetId) onReorder(draggedId, targetId)
    setDraggedId(null)
    setOverId(null)
  }

  // Clases visuales del item mientras se arrastra / al pasar por encima.
  const itemDragClass = (id?: string) =>
    `${draggedId && draggedId === id ? "opacity-40" : ""} ${
      overId && overId === id && draggedId !== id ? "ring-2 ring-primary" : ""
    }`

  return { draggedId, overId, handleDragStart, handleDragEnd, handleDragOver, handleDrop, itemDragClass }
}
