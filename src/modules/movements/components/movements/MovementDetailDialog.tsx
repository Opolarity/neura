import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";
import { getMovementDetails } from "../../services/movements.service";
import { movementDetailAdapter } from "../../adapters/Movement.adapter";
import { MovementDetail, MovementDetailApiResponse } from "../../types/Movements.types";

interface MovementDetailDialogProps {
  movementId: number | null;
  onClose: () => void;
}

const MovementDetailDialog = ({ movementId, onClose }: MovementDetailDialogProps) => {
  const [detail, setDetail] = useState<MovementDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (movementId === null) {
      setDetail(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    getMovementDetails(movementId)
      .then((data: MovementDetailApiResponse) => setDetail(movementDetailAdapter(data.movement)))
      .catch((err: Error) => setError(err?.message ?? "Error al cargar el movimiento"))
      .finally(() => setLoading(false));
  }, [movementId]);

  return (
    <Dialog open={movementId !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Detalle del Movimiento</DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Cargando...
          </div>
        )}

        {error && (
          <div className="py-4 text-sm text-red-500">{error}</div>
        )}

        {!loading && !error && detail && (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID</span>
              <span className="font-semibold">{detail.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha</span>
              <span>{detail.date}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Tipo</span>
              <Badge className={detail.type === "Ingreso" ? "bg-green-500" : "bg-red-500"}>
                {detail.type === "Egreso" ? (
                  <TrendingUp className="w-3 h-3 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-1" />
                )}
                {detail.type}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Categoría</span>
              <span>{detail.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Descripción</span>
              <span className="text-right max-w-[60%]">{detail.description}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Método de pago</span>
              <span>{detail.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cuenta</span>
              <span>{detail.businessAccount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sucursal</span>
              <span>{detail.branch}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Usuario</span>
              <span>{detail.user}</span>
            </div>
            <div className="flex justify-between font-semibold text-base pt-2 border-t">
              <span>Monto</span>
              <span className={detail.type === "Ingreso" ? "text-green-600" : "text-red-600"}>
                {detail.type === "Ingreso" ? "+" : "-"}
                {detail.formattedAmount}
              </span>
            </div>
            {detail.filesUrl.length > 0 && (
              <div className="pt-2 border-t space-y-2">
                <span className="text-muted-foreground">Adjuntos</span>
                <div className="flex flex-wrap gap-2">
                  {detail.filesUrl.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 underline"
                    >
                      {url.split("/").pop()}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MovementDetailDialog;
