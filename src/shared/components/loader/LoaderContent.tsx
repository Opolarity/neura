import { Loader2 } from "lucide-react";

interface LoaderContentProps {
  message?: string;
}

// Única definición del aspecto del "cargando" de la app: lo comparten el splash
// de arranque (pantalla completa) y el PageLoader (área de contenido). Si hay
// que cambiar el spinner o la tipografía, se cambia aquí y no en cada pantalla.
export default function LoaderContent({ message = "Cargando..." }: LoaderContentProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin" />
      {message && <p className="text-muted-foreground text-sm">{message}</p>}
    </div>
  );
}
