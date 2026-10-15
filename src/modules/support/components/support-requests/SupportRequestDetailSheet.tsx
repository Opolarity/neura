import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateDisplay, formatDateTime } from "@/shared/utils/date";
import type {
  SupportAttachment,
  SupportErrorCode,
  SupportMessage,
  SupportRequestDetail,
} from "../../types/Support.types";
import { formatSupportCodes } from "../../utils/requestCodes";
import { SupportRichText } from "./SupportRichText";
import { SupportAttachmentLink } from "./SupportAttachmentLink";
import { SupportConversation } from "./SupportConversation";
import { SupportReplyBox } from "./SupportReplyBox";
import { SupportRequestsErrorState } from "./SupportRequestsErrorState";
import { SupportStatusBadge } from "./SupportStatusBadge";

interface SupportRequestDetailSheetProps {
  open: boolean;
  detail: SupportRequestDetail | null;
  /** Hilo listo para pintar: detalle + mensajes propios aún sin confirmar. */
  messages: SupportMessage[];
  loading: boolean;
  errorState: { message: string; code: SupportErrorCode } | null;
  refreshError: boolean;
  onClose: () => void;
  onRetry: () => void;
  /** Encola el mensaje; true si quedó encolado (aparece al instante en el hilo). */
  onSendMessage: (content: string, attachments?: SupportAttachment[]) => boolean;
  onRetryMessage: (localId: string) => void;
  onDiscardMessage: (localId: string) => void;
}

type SheetTab = "detail" | "chat";

// Los nombres de prioridad sí son un conjunto cerrado de la API (low/medium/high/urgent)
const PRIORITY_LABEL: Record<string, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  urgent: "Urgente",
};

/**
 * conversation_status orienta al usuario sobre de quién es el turno. Es un
 * conjunto abierto: un valor desconocido no pinta nada, en vez de inventar copy.
 */
const CONVERSATION_LABEL: Record<string, string> = {
  open: "Tu mensaje está en revisión",
  answered: "Soporte respondió, puedes contestar",
  closed: "Conversación cerrada",
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
          // Una palabra o URL larga baja de línea en vez de dar scroll horizontal
          <SupportRichText
            html={detail.descriptionHtml}
            className="[overflow-wrap:anywhere]"
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
              {detail.attachments.map((file) => (
                <li key={file.id}>
                  <SupportAttachmentLink file={file} />
                </li>
              ))}
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

/**
 * Panel lateral de la solicitud con dos pestañas: Detalle (datos, descripción,
 * adjuntos y seguimiento de la tarea) y Chat (el hilo con el equipo de
 * soporte). La caja de respuesta queda fija abajo en las dos.
 */
export const SupportRequestDetailSheet = ({
  open,
  detail,
  messages,
  loading,
  errorState,
  refreshError,
  onClose,
  onRetry,
  onSendMessage,
  onRetryMessage,
  onDiscardMessage,
}: SupportRequestDetailSheetProps) => {
  const conversationLabel = detail?.conversationStatus
    ? CONVERSATION_LABEL[detail.conversationStatus]
    : undefined;

  const detailId = detail?.id ?? null;
  const chatCount = messages.filter((m) => m.origin !== "system").length;
  const supportCount = messages.filter((m) => m.origin === "internal").length;

  // Pestaña elegida por solicitud. Sin elección, se entra por el chat si ya
  // hay conversación; si no, por el detalle, que es lo primero que hay que leer.
  const [tabChoice, setTabChoice] = useState<{ id: string; tab: SheetTab } | null>(null);
  const tab: SheetTab =
    tabChoice && tabChoice.id === detailId
      ? tabChoice.tab
      : detail && detail.messages.length > 0
        ? "chat"
        : "detail";
  const selectTab = (next: SheetTab) => {
    if (detailId) setTabChoice({ id: detailId, tab: next });
  };

  // Punto en "Chat" cuando soporte escribe mientras se mira el detalle
  const [seen, setSeen] = useState<{ id: string; count: number } | null>(null);
  useEffect(() => {
    if (!detailId) return;
    setSeen((prev) =>
      tab === "chat" || prev?.id !== detailId ? { id: detailId, count: supportCount } : prev,
    );
  }, [detailId, tab, supportCount]);
  const hasUnread =
    tab !== "chat" && seen?.id === detailId && supportCount > (seen?.count ?? 0);

  // Archivos soltados sobre el hilo: los valida y agrega la caja de respuesta
  const [droppedFiles, setDroppedFiles] = useState<{ files: File[]; nonce: number } | null>(
    null,
  );

  const handleSend = (content: string, attachments?: SupportAttachment[]) => {
    const queued = onSendMessage(content, attachments);
    // Lo enviado se ve en el chat, aunque se haya escrito desde el detalle
    if (queued) selectTab("chat");
    return queued;
  };

  const showBody = !loading && !errorState && detail;

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl lg:max-w-2xl flex flex-col gap-0 p-0"
      >
        <Tabs
          value={tab}
          onValueChange={(value) => selectTab(value as SheetTab)}
          className="flex min-h-0 flex-1 flex-col"
          // Un archivo soltado en cualquier parte del panel se adjunta (sin
          // esto el navegador lo abre y se sale de la pantalla)
          onDragOver={(event) => {
            if (showBody && Array.from(event.dataTransfer.types).includes("Files")) {
              event.preventDefault();
            }
          }}
          onDrop={(event) => {
            if (!showBody || event.dataTransfer.files.length === 0) return;
            event.preventDefault();
            setDroppedFiles({ files: Array.from(event.dataTransfer.files), nonce: Date.now() });
          }}
        >
          <SheetHeader className="space-y-3 border-b px-6 py-4 text-left">
            <div>
              <SheetTitle className="pr-6">
                {detail?.title ?? "Detalle de la solicitud"}
              </SheetTitle>
              <SheetDescription>
                Información de la solicitud enviada al equipo de soporte.
              </SheetDescription>
            </div>

            {detail && (
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={detail.requestType === "ticket" ? "default" : "secondary"}>
                  {detail.requestType === "ticket" ? "Problema" : "Sugerencia"}
                </Badge>
                <SupportStatusBadge item={detail} />
                {formatSupportCodes(detail) !== "" && (
                  <span className="text-xs text-muted-foreground">
                    {formatSupportCodes(detail)}
                  </span>
                )}
                {conversationLabel && (
                  <Badge variant="outline">{conversationLabel}</Badge>
                )}
              </div>
            )}

            {showBody && (
              <TabsList className="grid w-full grid-cols-2 sm:w-72">
                <TabsTrigger value="detail">Detalle</TabsTrigger>
                <TabsTrigger value="chat" className="gap-1.5">
                  Chat
                  {chatCount > 0 && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      ({chatCount})
                    </span>
                  )}
                  {hasUnread && (
                    <span
                      className="h-2 w-2 rounded-full bg-primary"
                      aria-label="Mensajes nuevos"
                    />
                  )}
                </TabsTrigger>
              </TabsList>
            )}
          </SheetHeader>

          {showBody ? (
            <>
              {/* forceMount: cambiar de pestaña no pierde la posición de lectura */}
              <TabsContent
                value="detail"
                forceMount
                className="mt-0 min-h-0 flex-1 overflow-y-auto px-6 py-4 data-[state=inactive]:hidden"
              >
                <DetailBody detail={detail} />
              </TabsContent>

              <TabsContent
                value="chat"
                forceMount
                className="mt-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
              >
                <SupportConversation
                  messages={messages}
                  refreshError={refreshError}
                  onRetryMessage={onRetryMessage}
                  onDiscardMessage={onDiscardMessage}
                />
              </TabsContent>

              {/* key: el borrador y los archivos nunca pasan de una solicitud a otra */}
              <div className="border-t px-4 py-3 sm:px-6">
                <SupportReplyBox
                  key={detail.id}
                  requestId={detail.id}
                  onSend={handleSend}
                  droppedFiles={droppedFiles}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {loading ? (
                <div className="space-y-3">
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
              ) : null}
            </div>
          )}
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};
