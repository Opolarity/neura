import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  defaultModalConfig,
  savePage,
  saveModal,
  type PopupPresentation,
} from "@/modules/ecommerce/editor/lib/editor-store"
import {
  POPUP_PRESENTATIONS,
  POPUP_PRESETS,
  withPresentation,
} from "@/modules/ecommerce/editor/lib/popup-presets"

/** El slug es el identificador y va en la URL: solo minusculas, numeros y guion. */
function aSlug(texto: string): string {
  return texto
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

export function NewPageDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}) {
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [creando, setCreando] = useState(false)

  async function crear() {
    if (!title || !slug || creando) return
    setCreando(true)
    try {
      // Nace como borrador: una pagina recien creada esta vacia, y publicarla de
      // entrada seria poner una pagina en blanco a la vista del publico.
      const creada = await savePage(aSlug(slug), title, "", "page", "draft")
      if (!creada) {
        toast.error("No se pudo crear la página")
        return
      }
      setTitle("")
      setSlug("")
      onOpenChange(false)
      onCreated()
    } finally {
      setCreando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear nueva página</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                setSlug(aSlug(e.target.value))
              }}
              placeholder="Mi nueva pagina"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Slug (URL)</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/p/</span>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="mi-nueva-pagina"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Se guardará como borrador hasta que la publiques. Los borradores no
            son visibles en el sitio.
          </p>
          <Button onClick={crear} className="w-full" disabled={creando}>
            {creando ? "Creando..." : "Crear página"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function NewModalDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}) {
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [presentation, setPresentation] = useState<PopupPresentation>("modal")
  const [creando, setCreando] = useState(false)

  async function crear() {
    if (!title || !slug || creando) return
    setCreando(true)
    try {
      // Igual que las paginas: un modal vacio no tiene por que saltarle encima a
      // nadie en la tienda antes de tener contenido. El resto de la config se
      // ajusta en el editor, junto al contenido.
      const config = withPresentation(defaultModalConfig, presentation)
      const creado = await saveModal(aSlug(slug), title, config, "", "draft")
      if (!creado) {
        toast.error("No se pudo crear el modal")
        return
      }
      setTitle("")
      setSlug("")
      setPresentation("modal")
      onOpenChange(false)
      onCreated()
    } finally {
      setCreando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear nuevo modal</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Titulo</Label>
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                setSlug(aSlug(e.target.value))
              }}
              placeholder="Mi modal"
            />
          </div>

          <div>
            <Label>ID (slug)</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="mi-modal"
            />
          </div>

          <div>
            <Label>Presentación</Label>
            <Select
              value={presentation}
              onValueChange={(v) => setPresentation(v as PopupPresentation)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POPUP_PRESENTATIONS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {POPUP_PRESETS[p].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-muted-foreground">
              {POPUP_PRESETS[presentation].description}
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            El tamaño, el cierre y cuándo se abre se ajustan en el editor. Se
            guardará como borrador hasta que lo publiques; los borradores no son
            visibles en el sitio.
          </p>

          <Button onClick={crear} className="w-full" disabled={creando}>
            {creando ? "Creando..." : "Crear modal"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
