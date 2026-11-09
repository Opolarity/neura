import { useEffect, useRef } from "react";
import { useBlocker } from "react-router-dom";
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

/**
 * Con cambios sin guardar, salir del editor pide confirmación: al pulsar
 * Volver o retroceder en el navegador (useBlocker), y al cerrar o recargar la
 * pestaña (beforeunload, cuyo aviso lo dibuja el navegador). Vale igual en
 * edición y en vista previa: es la misma pantalla.
 */
export function UnsavedChangesDialog({ dirty }: { dirty: boolean }) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // «Salir sin guardar»: el diálogo se cierra al pulsarlo y su cierre no
  // debe cancelar la salida (antes, el reset ganaba y no se salía).
  const leavingRef = useRef(false);

  // Si se guarda con la salida pendiente, ya no hay nada que confirmar.
  useEffect(() => {
    if (blocker.state === "blocked" && !dirty) blocker.proceed();
  }, [blocker, dirty]);

  return (
    <AlertDialog
      open={blocker.state === "blocked"}
      onOpenChange={(open) => {
        if (!open && blocker.state === "blocked" && !leavingRef.current)
          blocker.reset();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hay cambios sin guardar</AlertDialogTitle>
          <AlertDialogDescription>
            Si sales ahora, se pierden los cambios de la plantilla desde la
            última vez que guardaste.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => blocker.state === "blocked" && blocker.reset()}
          >
            Seguir editando
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => {
              if (blocker.state !== "blocked") return;
              leavingRef.current = true;
              blocker.proceed();
            }}
          >
            Salir sin guardar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
