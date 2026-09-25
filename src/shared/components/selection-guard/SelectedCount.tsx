/** "N seleccionados" junto a la barra de filtros; no pinta nada con 0. */
export const SelectedCount = ({ count }: { count: number }) =>
  count > 0 ? (
    <p className="text-sm text-muted-foreground whitespace-nowrap">
      {count} seleccionado{count === 1 ? "" : "s"}
    </p>
  ) : null;
