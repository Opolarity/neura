import { Download, Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateDisplay, formatDateTime } from "@/shared/utils/date";
import type {
  SupportErrorCode,
  SupportRequestDetail,
} from "../../types/Support.types";
import { sanitizeSupportHtml } from "../../utils/sanitizeSupportHtml";
import { SupportRequestsErrorState } from "./SupportRequestsErrorState";
import { SupportStatusBadge } from "./SupportStatusBadge";

interface SupportRequestDetailModalProps {
  open: boolean;
  detail: SupportRequestDetail | null;
  loading: boolean;
  errorState: { message: string; code: SupportErrorCode } | null;
  onClose: () => void;
  onRetry: () => void;
}

// Los nombres de prioridad sí son un conjunto cerrado de la API (low/medium/high/urgent)
const PRIORITY_LABEL: Record<string, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  urgent: "Urgente",
};

const formatFileSize = (bytes: number | null): string | null => {
  if (bytes === null || bytes < 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
    {children}
  </h3>
);

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start justify-between gap-4">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-medium text-right">{value}</span>
  </div>
);

const DetailBody = ({ detail }: { detail: SupportRequestDetail }) => {
  const { task } = detail;
  const priority = task?.priority
    ? PRIORITY_LABEL[task.priority.toLowerCase()] ?? task.priority
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={detail.requestType === "ticket" ? "default" : "secondary"}>
          {detail.requestType === "ticket" ? "Problema" : "Sugerencia"}
        </Badge>
        <SupportStatusBadge item={detail} />
        {detail.taskCode && (
          <span className="text-xs text-muted-foreground">Tarea {detail.taskCode}</span>
        )}
      </div>

      <div className="space-y-2">
        <InfoRow label="Reportado por" value={detail.reporterName || "-"} />
        <InfoRow label="Creada" value={formatDateTime(detail.createdAt)} />
        <InfoRow label="Última actualización" value={formatDateTime(detail.updatedAt)} />
        {detail.reviewedAt && (
          <InfoRow label="Revisada" value={formatDateTime(detail.reviewedAt)} />
        )}
      </div>

      <Separator />

      <div className="space-y-2">
        <SectionTitle>Descripción</SectionTitle>
        {detail.descriptionHtml ? (
          <div
            className="text-sm leading-relaxed [&_a]:underline [&_img]:max-w-full [&_img]:rounded [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
            // Sanea en sanitizeSupportHtml: viene del WysiwygEditor y da la vuelta por OPOLARITY
            dangerouslySetInnerHTML={{
              __html: sanitizeSupportHtml(detail.descriptionHtml),
            }}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Sin descripción.</p>
        )}
      </div>

      {detail.attachments.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <SectionTitle>Adjuntos ({detail.attachments.length})</SectionTitle>
            <ul className="space-y-1">
              {detail.attachments.map((file) => {
                const size = formatFileSize(file.sizeBytes);
                return (
                  <li key={file.id}>
                    <a
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{file.fileName}</span>
                      {size && (
                        <span className="ml-auto text-xs text-muted-foreground shrink-0">
                          {size}
                        </span>
                      )}
                      <Download className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}

      <Separator />

      <div className="space-y-3">
        <SectionTitle>Seguimiento</SectionTitle>
        {task ? (
          <>
            <div className="space-y-2">
              <InfoRow label="Estado de la tarea" value={task.status} />
              {priority && <InfoRow label="Prioridad" value={priority} />}
              {task.environments.length > 0 && (
                <InfoRow label="Ambientes" value={task.environments.join(", ")} />
              )}
              {task.startDate && (
                <InfoRow
                  label="Inicio estimado"
                  value={formatDateDisplay(task.startDate)}
                />
              )}
              {task.dueDate && (
                <InfoRow
                  label="Entrega estimada"
                  value={formatDateDisplay(task.dueDate)}
                />
              )}
            </div>

            {/* progress es null cuando la tarea no tiene subtareas: no se pinta barra en cero */}
            {task.progress !== null && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {task.subtasksDone ?? 0} de {task.subtasksTotal ?? 0} subtareas
                  </span>
                  <span>{task.progress}%</span>
                </div>
                <Progress value={task.progress} />
              </div>
            )}

            {(task.startDate || task.dueDate) && (
              <p className="text-xs text-muted-foreground">
                Las fechas son estimaciones del equipo, no compromisos.
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            La solicitud sigue en revisión por el equipo de soporte: todavía no se ha
            convertido en tarea.
          </p>
        )}
      </div>
    </div>
  );
};

export const SupportRequestDetailModal = ({
  open,
  detail,
  loading,
  errorState,
  onClose,
  onRetry,
}: SupportRequestDetailModalProps) => (
  <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="pr-6">
          {detail?.title ?? "Detalle de la solicitud"}
        </DialogTitle>
        <DialogDescription>
          Información de la solicitud enviada al equipo de soporte.
        </DialogDescription>
      </DialogHeader>

      {loading ? (
        <div className="space-y-3 py-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : errorState ? (
        <SupportRequestsErrorState
          code={errorState.code}
          message={errorState.message}
          onRetry={onRetry}
          fallbackTitle="No se pudo cargar la solicitud"
        />
      ) : detail ? (
        <DetailBody detail={detail} />
      ) : null}
    </DialogContent>
  </Dialog>
);
