import { RumErrorBoundary } from "@opolarity/rum/react";
import { Button } from "@/components/ui/button";

/**
 * Error boundary global del area autenticada: reporta el error de render al
 * RUM y muestra un fallback dentro del <main>, sin tapar sidebar ni header.
 */
export function RumBoundary({ children }: { children: React.ReactNode }) {
  return (
    <RumErrorBoundary name="dashboard" fallback={<RumErrorFallback />}>
      {children}
    </RumErrorBoundary>
  );
}

function RumErrorFallback() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className="text-lg font-semibold">Algo salió mal</h2>
      <p className="text-sm text-muted-foreground">
        Ocurrió un error inesperado. Ya quedó registrado; vuelve a cargar la página para continuar.
      </p>
      <Button variant="outline" onClick={() => window.location.reload()}>
        Recargar
      </Button>
    </div>
  );
}
