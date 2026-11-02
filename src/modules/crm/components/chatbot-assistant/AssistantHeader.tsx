import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Props {
  pendingChanges: number;
  publishing: boolean;
  canManage: boolean;
  onPublish: () => void;
  onDiscard: () => void;
}

/** Header del asistente: título y publicar o descartar el borrador. */
export const AssistantHeader = ({ pendingChanges, publishing, canManage, onPublish, onDiscard }: Props) => (
  <div className="flex flex-wrap items-center justify-between gap-2">
    <h1 className="text-2xl font-bold text-foreground">Asistente de ventas</h1>

    {canManage && (
      <div className="flex items-center gap-2">
        {pendingChanges > 0 && (
          <Badge variant="warning">
            {pendingChanges === 1 ? "1 cambio sin publicar" : `${pendingChanges} cambios sin publicar`}
          </Badge>
        )}
        <Button variant="outline" size="sm" onClick={onDiscard} disabled={publishing || pendingChanges === 0}>
          Descartar
        </Button>
        <Button size="sm" onClick={onPublish} disabled={publishing || pendingChanges === 0}>
          {publishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Publicar
        </Button>
      </div>
    )}
  </div>
);
