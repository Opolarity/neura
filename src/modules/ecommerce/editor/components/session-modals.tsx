import { Button } from "@/components/ui/button"

// z-[100] para quedar por encima de los Dialog de Radix (z-50)
function ModalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
      <div className="mx-4 max-w-md rounded-lg border border-border bg-background p-6 text-center shadow-lg">
        {children}
      </div>
    </div>
  )
}

interface IdleWarningDialogProps {
  onExit: () => void
  onContinue: () => void
}

export function IdleWarningDialog({ onExit, onContinue }: IdleWarningDialogProps) {
  return (
    <ModalShell>
      <h2 className="text-lg font-semibold text-foreground">¿Sigues ahí?</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Llevas 15 minutos sin actividad. Si no respondes, la sesión se
        cerrará en 5 minutos.
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <Button variant="outline" onClick={onExit}>
          Salir
        </Button>
        <Button onClick={onContinue}>Seguir editando</Button>
      </div>
    </ModalShell>
  )
}

interface UnsavedChangesDialogProps {
  onExit: () => void
  onSaveAndExit: () => void
  isSaving?: boolean
}

export function UnsavedChangesDialog({
  onExit,
  onSaveAndExit,
  isSaving,
}: UnsavedChangesDialogProps) {
  return (
    <ModalShell>
      <h2 className="text-lg font-semibold text-foreground">
        Cambios sin guardar
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Tienes cambios sin guardar. ¿Quieres guardarlos antes de salir?
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <Button variant="outline" onClick={onExit}>
          Salir
        </Button>
        <Button onClick={onSaveAndExit} disabled={isSaving}>
          Guardar cambios
        </Button>
      </div>
    </ModalShell>
  )
}

interface LocalBackupDialogProps {
  /** Hace cuantos minutos se guardo el respaldo, ya redondeado. */
  minutesAgo: number
  onRestore: () => void
  onDiscard: () => void
}

/**
 * Hay cambios de una sesion anterior mas nuevos que lo guardado en el servidor.
 *
 * Va encima del editor, que para entonces ya esta montado con el canvas todavia
 * tapado: hasta que no se decide, no se carga ningun contenido. Asi la decision
 * no reemplaza la pantalla entera ni obliga a montar el editor dos veces segun
 * lo que se elija.
 */
export function LocalBackupDialog({
  minutesAgo,
  onRestore,
  onDiscard,
}: LocalBackupDialogProps) {
  return (
    <ModalShell>
      <h2 className="text-lg font-semibold text-foreground">
        Respaldo local encontrado
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Hay cambios sin guardar de una sesión anterior (hace {minutesAgo} min)
        más recientes que la última versión guardada. ¿Quieres restaurarlos?
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <Button onClick={onRestore}>Restaurar</Button>
        <Button variant="outline" onClick={onDiscard}>
          Descartar
        </Button>
      </div>
    </ModalShell>
  )
}

interface SessionExpiredOverlayProps {
  hadPendingChanges?: boolean
}

export function SessionExpiredOverlay({
  hadPendingChanges,
}: SessionExpiredOverlayProps) {
  return (
    <ModalShell>
      <h2 className="text-lg font-semibold text-foreground">Sesión expirada</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Tu sesión del editor ha terminado. Vuelve a entrar desde Neura para
        continuar editando.
      </p>
      {hadPendingChanges && (
        <p className="mt-2 text-sm text-muted-foreground">
          Tus cambios sin guardar quedaron respaldados en este navegador y
          podrás restaurarlos al volver.
        </p>
      )}
    </ModalShell>
  )
}
