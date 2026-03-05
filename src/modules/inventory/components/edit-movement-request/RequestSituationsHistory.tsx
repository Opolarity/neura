import { useState } from "react";
import { formatDateTime } from "@/shared/utils/date";
import { MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface SituationHistoryItem {
  id: number;
  created_at: string;
  userName: string;
  message: string | null;
  situationName: string;
  notes: string | null;
  warehouseName: string | null;
  warehouseId: number | null;
}

export interface SituationOption {
  id: number;
  name: string;
  status_id: number;
  code: string | null;
  statusCode: string | null;
}

interface Props {
  situations: SituationHistoryItem[];
  situationOptions: SituationOption[];
  generatedNotes: string;
  onSubmitNewSituation: (message: string, situationId: number) => Promise<void>;
  submitting?: boolean;
  quantitiesChanged?: boolean;
  userWarehouseId?: number | null;
  readOnly?: boolean;
}

const RequestSituationsHistory = ({
  situations,
  situationOptions,
  generatedNotes,
  onSubmitNewSituation,
  submitting = false,
  quantitiesChanged = false,
  readOnly = false,
  userWarehouseId = null,
}: Props) => {
  const [newMessage, setNewMessage] = useState("");
  const [selectedSituationId, setSelectedSituationId] = useState<string>("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Auto-select NEG situation when quantities change
  const negOption = situationOptions.find((s) => s.code === "NEG");
  const effectiveSituationId = quantitiesChanged && negOption
    ? negOption.id.toString()
    : selectedSituationId;

  const getSelectedSituation = () => 
    situationOptions.find((s) => s.id === Number(effectiveSituationId));

  const handleSubmit = async () => {
    if (!effectiveSituationId || !newMessage.trim()) return;

    const selectedSit = getSelectedSituation();
    if (selectedSit && (selectedSit.statusCode === "CFM" || selectedSit.statusCode === "COM")) {
      setShowConfirmDialog(true);
      return;
    }

    await executeSubmit();
  };

  const executeSubmit = async () => {
    await onSubmitNewSituation(newMessage.trim(), Number(effectiveSituationId));
    setNewMessage("");
    setSelectedSituationId("");
  };

  const handleConfirm = async () => {
    setShowConfirmDialog(false);
    await executeSubmit();
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        Historial de la solicitud
      </h3>

      {situations.length > 0 && (
        <div className="space-y-3">
          {situations.map((sit) => (
            <div
              key={sit.id}
              className={`rounded-lg border p-4 space-y-1 ${
                userWarehouseId && sit.warehouseId && sit.warehouseId !== userWarehouseId
                  ? "border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-700"
                  : "border-border bg-muted/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {sit.userName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(sit.created_at)}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {sit.situationName}
                </span>
                {sit.warehouseName && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                    {sit.warehouseName}
                  </span>
                )}
              </div>
              {sit.message && (
                <p className="text-sm text-foreground/80 pt-1">{sit.message}</p>
              )}
              {sit.notes && (
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap bg-background rounded p-2 mt-1 border border-border">
                  {sit.notes}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New message form */}
      {!readOnly && (
      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Agregar actualización</h4>

        <div className="flex flex-row gap-3">
          <div className="flex-1 flex flex-col gap-1">
            <Label className="text-xs">Situación</Label>
            <Select
              value={effectiveSituationId}
              onValueChange={setSelectedSituationId}
              disabled={quantitiesChanged && !!negOption}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona situación" />
              </SelectTrigger>
              <SelectContent>
                {situationOptions.map((s) => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs">Mensaje</Label>
          <Textarea
            placeholder="Escribe un mensaje..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            rows={2}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs">Productos (auto-generado)</Label>
          <pre className="text-xs text-muted-foreground whitespace-pre-wrap bg-background rounded p-2 border border-border">
            {generatedNotes || "Sin productos"}
          </pre>
        </div>

        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={submitting || !effectiveSituationId || !newMessage.trim()}
          className="gap-2"
        >
          <Send className="h-4 w-4" />
          {submitting ? "Enviando..." : "Enviar"}
        </Button>
      </div>
      )}

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {getSelectedSituation()?.statusCode === "CFM" 
                ? "¿Confirmar solicitud?" 
                : "¿Completar solicitud?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {getSelectedSituation()?.statusCode === "CFM"
                ? "Estás a punto de confirmar esta solicitud. Los productos aprobados serán marcados como confirmados. Esta acción no se puede deshacer fácilmente."
                : "Estás a punto de completar esta solicitud. Esta acción no se puede deshacer fácilmente."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              {getSelectedSituation()?.statusCode === "CFM" ? "Confirmar" : "Completar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RequestSituationsHistory;
