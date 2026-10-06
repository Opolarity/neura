import { Bot, Lock, SquarePen, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/shared/utils/date";
import { rolLabel, toFriendlyText } from "../../adapters/chatbotTemplates.adapter";
import { topicLabel } from "../../adapters/chatbotTemplateTopics";
import type { ChatbotTemplate } from "../../types/chatbotTemplates.types";

interface ChatbotTemplatesTableProps {
  rows: ChatbotTemplate[];
  searching: boolean;
  onEdit: (template: ChatbotTemplate) => void;
  /** T-922: para todas las que no están bloqueadas. */
  onDelete: (template: ChatbotTemplate) => void;
}

export default function ChatbotTemplatesTable({ rows, searching, onEdit, onDelete }: ChatbotTemplatesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[260px]">Plantilla</TableHead>
          <TableHead className="w-[220px]">Etiquetas</TableHead>
          <TableHead>Texto</TableHead>
          <TableHead className="w-[200px]">Última edición</TableHead>
          <TableHead className="w-[110px]">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
              {searching ? "Ninguna plantilla coincide con la búsqueda o la etiqueta." : "No hay plantillas cargadas."}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((t) => (
            <TableRow key={t.id}>
              <TableCell>
                <div className="flex flex-col items-start gap-1">
                  <span className="font-mono text-xs">{t.name}</span>
                  {t.fromErp && <Badge variant="info">Creada en el ERP</Badge>}
                  {t.locked ? (
                    <span
                      className="flex items-center gap-1 text-xs text-muted-foreground"
                      title="Parte de un flujo fijo del bot (pedido, pago o comprobantes): solo se edita el texto"
                    >
                      <Lock className="w-3 h-3" />
                      Bloqueada
                    </span>
                  ) : (
                    t.rol && (
                      <span
                        className="flex items-center gap-1 text-xs text-muted-foreground"
                        title={`El bot la usa para: ${rolLabel(t.rol)}. Si la eliminas, ese mensaje lo redacta el bot.`}
                      >
                        <Bot className="w-3 h-3" />
                        Usada por el bot
                      </span>
                    )
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  <Badge variant={t.topic ? "secondary" : "outline"}>{topicLabel(t.topic)}</Badge>
                  {t.tags.map((g) => (
                    <Badge key={g} variant="outline">
                      {g}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <p className="line-clamp-2 whitespace-pre-line text-sm">{toFriendlyText(t.content)}</p>
              </TableCell>
              <TableCell className="text-sm">
                {t.edited ? (
                  <div className="flex flex-col">
                    <span>{formatDateTime(t.updatedAt)}</span>
                    <span className="text-xs text-muted-foreground">{t.updatedByName}</span>
                  </div>
                ) : (
                  <Badge variant="pending">Original</Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" title="Editar plantilla" onClick={() => onEdit(t)}>
                    <SquarePen className="w-4 h-4" />
                  </Button>
                  {!t.locked && (
                    <Button
                      variant="outline"
                      size="sm"
                      title="Eliminar plantilla"
                      aria-label={`Eliminar la plantilla ${t.name}`}
                      className="text-destructive hover:text-destructive"
                      onClick={() => onDelete(t)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
