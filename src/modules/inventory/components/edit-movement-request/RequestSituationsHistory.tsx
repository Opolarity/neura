import { formatDateTime } from "@/shared/utils/date";
import { MessageSquare } from "lucide-react";

export interface SituationHistoryItem {
  id: number;
  created_at: string;
  userName: string;
  message: string | null;
  situationName: string;
  notes: string | null;
}

interface Props {
  situations: SituationHistoryItem[];
}

const RequestSituationsHistory = ({ situations }: Props) => {
  if (situations.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        Historial de la solicitud
      </h3>
      <div className="space-y-3">
        {situations.map((sit) => (
          <div
            key={sit.id}
            className="rounded-lg border border-border bg-muted/40 p-4 space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {sit.userName}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDateTime(sit.created_at)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {sit.situationName}
              </span>
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
    </div>
  );
};

export default RequestSituationsHistory;
