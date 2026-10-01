import { SquarePen } from "lucide-react";
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
import { toFriendlyText } from "../../adapters/chatbotTemplates.adapter";
import type { ChatbotTemplate } from "../../types/chatbotTemplates.types";

interface ChatbotTemplatesTableProps {
  rows: ChatbotTemplate[];
  searching: boolean;
  onEdit: (template: ChatbotTemplate) => void;
}

export default function ChatbotTemplatesTable({ rows, searching, onEdit }: ChatbotTemplatesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[260px]">Plantilla</TableHead>
          <TableHead>Texto</TableHead>
          <TableHead className="w-[200px]">Última edición</TableHead>
          <TableHead className="w-[80px]">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
              {searching ? "Ninguna plantilla coincide con la búsqueda." : "No hay plantillas cargadas."}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="font-mono text-xs">{t.name}</TableCell>
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
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
