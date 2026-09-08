import { useEffect } from "react";
import { useRouteError } from "react-router-dom";
import { Button } from "@/components/ui/button";

// Pantalla de error de ruta: reemplaza el "Unexpected Application Error!"
// por defecto de react-router (p. ej. cuando falla la carga de un chunk).
const RouteError = () => {
  const error = useRouteError();

  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-2 text-2xl font-bold">Ocurrió un problema al cargar la página</h1>
        <p className="mb-6 text-muted-foreground">
          Puede deberse a una versión nueva del sistema. Recarga para continuar.
        </p>
        <Button onClick={() => window.location.reload()}>Recargar</Button>
      </div>
    </div>
  );
};

export default RouteError;
