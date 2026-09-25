import { useState } from "react";

/**
 * Las tablas con selección la conservan al paginar, pero buscar, ordenar o
 * filtrar cambia el listado: antes de hacerlo con líneas seleccionadas se pide
 * confirmación y, si se acepta, se deselecciona todo.
 *
 * `guard(selectedCount, clear, action)` ejecuta la acción directamente si no
 * hay nada seleccionado; si lo hay, la deja pendiente hasta que se confirme en
 * `<DeselectConfirmDialog {...dialogProps} />`. Un mismo guard sirve para
 * varias selecciones independientes (una por pestaña): cada llamada lleva su
 * propio `clear`.
 */
export const useDeselectGuard = () => {
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(
    null,
  );

  const guard = (
    selectedCount: number,
    clear: () => void,
    action: () => void,
  ) => {
    if (selectedCount === 0) {
      action();
      return;
    }
    setPendingAction(() => () => {
      clear();
      action();
    });
  };

  const dialogProps = {
    open: pendingAction !== null,
    onCancel: () => setPendingAction(null),
    onConfirm: () => {
      pendingAction?.();
      setPendingAction(null);
    },
  };

  return { guard, dialogProps };
};
