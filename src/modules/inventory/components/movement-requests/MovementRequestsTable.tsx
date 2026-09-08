import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { MovementRequestListItem } from "../../types/MovementRequestList.types";
import { formatDateTime } from "@/shared/utils/date";
import MovementRequestStepsBar from "./MovementRequestStepsBar";
import { ComponentPermission } from "@/shared/components/component-permission";

interface Props {
  requests: MovementRequestListItem[];
  loading: boolean;
}

const getSituationBadgeColor = (name?: string) => {
  if (name === 'Aprobado' || name === 'Recibido' || name === 'Enviado' || name === 'Completado') return 'bg-success hover:bg-success/80 text-success-foreground border-transparent';
  if (name === 'Negociación' || name === 'Solicitado') return 'bg-warning hover:bg-warning/80 text-warning-foreground border-transparent';
  if (name === 'Cancelado') return 'bg-destructive hover:bg-destructive/80 text-destructive-foreground border-transparent';
  return 'bg-secondary text-secondary-foreground hover:bg-secondary';
};

// ID, Almacén Origen, Almacén Destino, Situación, Fecha, Acciones. Si el rol
// no puede editar, la columna de Acciones no se pinta y este número queda uno
// largo: solo afecta a las filas de "cargando" y "no se encontraron", y la
// columna sobrante colapsa a 0px porque ninguna otra fila la ocupa.
const COL_SPAN = 6;

// Code de la columna Acciones, en una constante para que la cabecera y la
// celda no puedan quedar con listas distintas y aparezca un th sin td o al
// revés.
const ACTION_CODES = ["inventory_movement_requests.edit"];

export default function MovementRequestsTable({ requests, loading }: Props) {
  const navigate = useNavigate();

  return (
    <div className="relative h-full">
      {loading && requests.length > 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      )}
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Almacén Origen</TableHead>
          <TableHead>Almacén Destino</TableHead>
          <TableHead>Situación</TableHead>
          <TableHead>Fecha</TableHead>
          {/* Se envuelve el th entero y no su texto: una celda vacía sigue
              ocupando su ancho y deja un hueco muerto. */}
          <ComponentPermission codeIn={ACTION_CODES}>
            <TableHead className="text-right">Acciones</TableHead>
          </ComponentPermission>
        </TableRow>
      </TableHeader>
      <TableBody>
          {loading && requests.length === 0 ? (
            <TableRow>
              <TableCell colSpan={COL_SPAN} className="text-center py-8">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando solicitudes...
                </div>
              </TableCell>
            </TableRow>
          ) : requests.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={COL_SPAN}
                className="text-center py-8 text-muted-foreground"
              >
                No se encontraron solicitudes de traspaso.
              </TableCell>
            </TableRow>
          ) : (
        requests.map((req) => (
          <TableRow key={req.id}>
            <TableCell className="font-medium">#{req.id}</TableCell>
            <TableCell>{req.outWarehouseName}</TableCell>
            <TableCell>{req.inWarehouseName}</TableCell>
            <TableCell>
              <Badge className={getSituationBadgeColor(req.situationName)}>
                {req.situationName}
              </Badge>
              <MovementRequestStepsBar
                type={req.requestType}
                situationCode={req.situationCode}
                progressSituationCode={req.progressSituationCode}
              />
            </TableCell>
            <TableCell>
              {formatDateTime(req.createdAt)}
            </TableCell>
            <ComponentPermission codeIn={ACTION_CODES}>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  title="Editar la solicitud de movimiento"
                  onClick={() => navigate(`/inventory/movement-requests/edit/${req.id}`)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TableCell>
            </ComponentPermission>
          </TableRow>
        )))}
      </TableBody>
    </Table>
    </div>
  );
}
