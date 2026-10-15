import { AlertTriangle, BookOpen, RefreshCw, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Lo que el usuario del ERP no puede arreglar reintentando. */
const ADMIN_CODES = ["not_configured", "invalid_api_key", "server_config"];

interface LearningErrorStateProps {
  code: string;
  message: string;
  onRetry: () => void;
  retrying: boolean;
}

export const LearningErrorState = ({
  code,
  message,
  onRetry,
  retrying,
}: LearningErrorStateProps) => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border px-6 py-12 text-center">
    <AlertTriangle className="h-8 w-8" />
    <p className="max-w-md text-muted-foreground">{message}</p>
    {!ADMIN_CODES.includes(code) && (
      <Button variant="outline" onClick={onRetry} disabled={retrying}>
        <RefreshCw className={`mr-2 h-4 w-4 ${retrying ? "animate-spin" : ""}`} />
        Reintentar
      </Button>
    )}
  </div>
);

/** Todavía no hay ningún video publicado para este ERP. */
export const LearningEmptyState = () => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border px-6 py-16 text-center">
    <BookOpen className="h-8 w-8" />
    <p className="font-medium text-foreground">Aún no hay tutoriales</p>
    <p className="max-w-md text-sm text-muted-foreground">
      Muy pronto encontrarás aquí videos cortos para sacarle el máximo provecho al ERP.
    </p>
  </div>
);

/** Hay videos, pero ninguno coincide con la búsqueda o los filtros. */
export const LearningNoResults = ({ onClear }: { onClear: () => void }) => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border px-6 py-16 text-center">
    <SearchX className="h-8 w-8" />
    <p className="font-medium text-foreground">No encontramos tutoriales con esos filtros</p>
    <Button variant="outline" onClick={onClear}>
      Limpiar filtros
    </Button>
  </div>
);
