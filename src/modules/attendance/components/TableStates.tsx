import { Loader2 } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";

/** Filas de "cargando" y "sin resultados", como en el resto de listados. */
export const LoadingRow = ({ colSpan, label }: { colSpan: number; label: string }) => (
  <TableRow>
    <TableCell colSpan={colSpan} className="text-center py-8">
      <div className="flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        {label}
      </div>
    </TableCell>
  </TableRow>
);

export const EmptyRow = ({ colSpan, label }: { colSpan: number; label: string }) => (
  <TableRow>
    <TableCell colSpan={colSpan} className="text-center text-muted-foreground p-10">
      {label}
    </TableCell>
  </TableRow>
);

export const Dash = () => <span className="text-muted-foreground text-sm">—</span>;
