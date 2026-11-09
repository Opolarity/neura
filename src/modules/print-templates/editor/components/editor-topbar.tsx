import {
  ArrowLeft,
  Eye,
  Loader2,
  Redo2,
  Save,
  SquarePen,
  Undo2,
} from "lucide-react";
import { useEditor } from "@craftjs/core";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils/utils";
import { ZoomControl } from "./zoom-control";
import { EditorTooltip } from "./editor-tooltip";
import { TestPdfButton } from "../print/test-pdf-button";
import { ImpositionButton } from "./imposition-button";

/** Punto junto al nombre: verde todo guardado, ámbar cambios sin guardar. */
function SaveStatusDot({ dirty }: { dirty: boolean }) {
  const label = dirty ? "Cambios sin guardar" : "Cambios guardados";
  return (
    <EditorTooltip label={label}>
      <span
        role="status"
        aria-label={label}
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          dirty ? "bg-warning" : "bg-success",
        )}
      />
    </EditorTooltip>
  );
}

/**
 * Deshacer y rehacer, con el historial de craft. En vista previa no se edita,
 * así que quedan apagados.
 */
function HistoryButtons({ disabled }: { disabled: boolean }) {
  const { actions, canUndo, canRedo } = useEditor((_, query) => ({
    canUndo: query.history.canUndo(),
    canRedo: query.history.canRedo(),
  }));

  return (
    <div className="flex items-center">
      <EditorTooltip label="Deshacer">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => actions.history.undo()}
          disabled={disabled || !canUndo}
          aria-label="Deshacer"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
      </EditorTooltip>
      <EditorTooltip label="Rehacer">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => actions.history.redo()}
          disabled={disabled || !canRedo}
          aria-label="Rehacer"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
      </EditorTooltip>
    </div>
  );
}

export function EditorTopbar({
  viewOnly = false,
  title,
  section,
  dirty,
  saving,
  preview,
  scale,
  onZoomChange,
  onFit,
  onBack,
  onSave,
  onTogglePreview,
}: {
  /**
   * Solo para ver (una plantilla del sistema): sin estado de guardado,
   * Guardar, Vista previa ni historial.
   */
  viewOnly?: boolean;
  title: string;
  section: string;
  dirty: boolean;
  saving: boolean;
  preview: boolean;
  scale: number;
  onZoomChange: (scale: number) => void;
  onFit: () => void;
  onBack: () => void;
  onSave: () => void;
  onTogglePreview: () => void;
}) {
  return (
    <header className="h-14 shrink-0 border-b border-border bg-background flex items-center gap-3 px-4">
      <EditorTooltip label="Volver a las plantillas">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onBack}
          aria-label="Volver a las plantillas"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </EditorTooltip>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold truncate">{title}</p>
          {!viewOnly && <SaveStatusDot dirty={dirty} />}
        </div>
        <p className="text-[12px] text-muted-foreground truncate">{section}</p>
      </div>
      <div className="ml-auto flex items-center gap-2">
        {/* Solo para ver no hay historial: sin deshacer ni rehacer. */}
        {!viewOnly && <HistoryButtons disabled={preview} />}
        <ZoomControl scale={scale} onZoomChange={onZoomChange} onFit={onFit} />
        {/* Columnas y copias al imprimir: se guardan con la plantilla. */}
        {/* En /view se ve (siempre en vista previa); en el editor, al editar. */}
        <ImpositionButton disabled={preview && !viewOnly} />
        <TestPdfButton />
        {!viewOnly && (
          <>
            <EditorTooltip label="Guardar (Ctrl + S)">
              <Button
                size="sm"
                className="gap-2"
                onClick={onSave}
                disabled={saving || !dirty}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Guardar
              </Button>
            </EditorTooltip>
            {/* Cambia el enfoque, no de vista: esconde los paneles laterales. */}
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={onTogglePreview}
              aria-pressed={preview}
            >
              {preview ? (
                <SquarePen className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              {preview ? "Editar" : "Vista previa"}
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
