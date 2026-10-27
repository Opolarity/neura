import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { headingText } from "../../adapters/chatbotConsiderations.adapter";
import type { PromptBlock, PromptBlockCreateInput } from "../../types/chatbotConsiderations.types";

interface AddPromptBlockDialogProps {
  open: boolean;
  headings: PromptBlock[];
  initialTitle: string;
  initialHeadingKey: string | null;
  saving: boolean;
  onClose: () => void;
  onCreate: (input: PromptBlockCreateInput) => Promise<boolean>;
}

/** Agregar algo que el bot no sabe: va al final de la sección elegida. */
export default function AddPromptBlockDialog({ open, headings, initialTitle, initialHeadingKey, saving, onClose, onCreate }: AddPromptBlockDialogProps) {
  const [headingKey, setHeadingKey] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setHeadingKey(initialHeadingKey ?? "");
    setTitle(initialTitle);
    setContent("");
    setTags("");
    setError(null);
  }, [open, initialTitle, initialHeadingKey]);

  const submit = async () => {
    if (!headingKey) return setError("Elige en qué sección va.");
    if (!title.trim()) return setError("Ponle un título.");
    if (!content.trim()) return setError("Escribe qué tiene que saber el bot.");
    const ok = await onCreate({
      headingKey,
      title: title.trim(),
      content,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    });
    if (ok) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Agregar al chatbot</DialogTitle>
          <DialogDescription>Lo que escribas acá el bot lo usa en menos de un minuto. Si choca con una regla del sistema, gana la regla.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="add-block-section">Sección</Label>
            <Select value={headingKey} onValueChange={(v) => { setHeadingKey(v); setError(null); }}>
              <SelectTrigger id="add-block-section">
                <SelectValue placeholder="¿En qué parte va?" />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {headings.map((h) => (
                  <SelectItem key={h.headingKey} value={h.headingKey}>
                    {h.headingLevel === 3 ? `   ↳ ${headingText(h)}` : headingText(h)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="add-block-title">Título</Label>
            <Input id="add-block-title" value={title} maxLength={120} placeholder="Garantía de las prendas" onChange={(e) => { setTitle(e.target.value); setError(null); }} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="add-block-content">Qué tiene que saber el bot</Label>
            <Textarea
              id="add-block-content"
              rows={6}
              maxLength={4000}
              value={content}
              placeholder={"Las prendas tienen 15 días de garantía por fallas de fábrica. Para hacerla válida, el cliente escribe al equipo con su número de pedido y una foto."}
              onChange={(e) => { setContent(e.target.value); setError(null); }}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="add-block-tags">Etiquetas</Label>
            <Input id="add-block-tags" value={tags} placeholder="Garantía, Cambios" onChange={(e) => setTags(e.target.value)} />
            <p className="text-xs text-muted-foreground">Separadas por coma. Sirven para encontrarlo después.</p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving}>
            Agregar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
