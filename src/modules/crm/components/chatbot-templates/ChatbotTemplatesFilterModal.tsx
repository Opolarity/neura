import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TagFilter } from "../../hooks/useChatbotTemplates";
import type { ChatbotTagApi } from "../../types/chatbotTemplates.types";

/** Valor del Select para "todas": Radix no admite un SelectItem con value "". */
const ALL = "__all__";

interface Props {
  tags: ChatbotTagApi[];
  /** Plantillas sin etiqueta principal: si hay, se ofrece filtrarlas. */
  withoutTopic: number;
  tagFilter: TagFilter;
  isOpen: boolean;
  onClose: () => void;
  onApply: (tagFilter: TagFilter) => void;
}

/** El pop-up de filtros de Plantillas, igual que el de las demás tablas: se aplica con «Aplicar». */
const ChatbotTemplatesFilterModal = ({ tags, withoutTopic, tagFilter, isOpen, onClose, onApply }: Props) => {
  const [tag, setTag] = useState<TagFilter>(tagFilter);

  useEffect(() => {
    if (isOpen) setTag(tagFilter);
  }, [isOpen, tagFilter]);

  const principales = tags.filter((g) => g.is_jev);
  const otras = tags.filter((g) => !g.is_jev);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Filtrar plantillas</DialogTitle>
        </DialogHeader>

        <div className="max-h-[50vh]">
          <ScrollArea className="h-full">
            <div className="space-y-4 py-4 pl-1 pr-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Etiqueta</Label>
                <Select value={tag || ALL} onValueChange={(v) => setTag(v === ALL ? "" : v)}>
                  <SelectTrigger aria-label="Filtrar por etiqueta">
                    <SelectValue placeholder="Todas las etiquetas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Todas las etiquetas</SelectItem>
                    {principales.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Principales</SelectLabel>
                        {principales.map((g) => (
                          <SelectItem key={g.id} value={String(g.id)}>
                            {g.name} ({g.templates_count})
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                    {otras.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Otras</SelectLabel>
                        {otras.map((g) => (
                          <SelectItem key={g.id} value={String(g.id)}>
                            {g.name} ({g.templates_count})
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                    {withoutTopic ? (
                      <SelectItem value="none">Sin etiqueta principal ({withoutTopic})</SelectItem>
                    ) : null}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => setTag("")}>
            Limpiar
          </Button>
          <Button onClick={() => onApply(tag)}>Aplicar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChatbotTemplatesFilterModal;
