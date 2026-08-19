import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { Loader2, Search, Eye } from "lucide-react";
import { useReclamaciones } from "../hooks/useReclamaciones";
import { formatDateDisplay } from "@/shared/utils/date";
import { ComponentPermission } from "@/shared/components/component-permission";

// # Orden, Correo, Fecha de Incidente, Monto, Detalle, Acción. Si el rol no
// puede ver el detalle, la columna de Acción no se pinta y este número queda uno
// largo: solo afecta a las filas de "cargando" y "no se encontraron
// reclamaciones", y la columna sobrante colapsa a 0px porque ninguna otra fila
// la ocupa.
const COL_SPAN = 6;

// Code de la columna Acción, en una constante para que la cabecera y la celda no
// puedan quedar con listas distintas y aparezca un th sin td o al revés.
const ACTION_CODES = ["ecommerce_claims.view"];

const formatDate = (date: string) => formatDateDisplay(date);

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(amount);

export default function ReclamacionesPage() {
  const navigate = useNavigate();
  const {
    reclamaciones,
    loading,
    search,
    pagination,
    onSearchChange,
    onPageChange,
    onPageSizeChange,
  } = useReclamaciones();

  const renderClaimType = (claimType: string | null) => {
    if (!claimType) {
      return <Badge variant="destructive">Reclamo</Badge>;
    }

    const normalized = claimType.toLowerCase();
    return (
      <Badge variant={normalized === "reclamo" ? "destructive" : "outline"}>
        {claimType.charAt(0).toUpperCase() + claimType.slice(1).toLowerCase()}
      </Badge>
    );
  };

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reclamaciones</h1>
        <p className="text-gray-600">Gestiona las quejas y reclamaciones de los clientes</p>
      </div>

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="!p-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por orden, correo o detalle..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead># Orden</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Fecha de Incidente</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Detalle</TableHead>
                {/* Se envuelve el th entero y no su texto: una celda vacía
                    sigue ocupando su ancho y deja un hueco muerto. */}
                <ComponentPermission codeIn={ACTION_CODES}>
                  <TableHead>Acción</TableHead>
                </ComponentPermission>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={COL_SPAN} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cargando reclamaciones...
                    </div>
                  </TableCell>
                </TableRow>
              ) : reclamaciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={COL_SPAN} className="text-center text-muted-foreground py-8">
                    No se encontraron reclamaciones
                  </TableCell>
                </TableRow>
              ) : (
                reclamaciones.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      {r.order_id ? `#${r.order_id}` : `Reclamo #${r.id}`}
                    </TableCell>
                    <TableCell>{r.email}</TableCell>
                    <TableCell>{formatDate(r.incident_date)}</TableCell>
                    <TableCell>{formatCurrency(r.amount_claim)}</TableCell>
                    <TableCell>{renderClaimType(r.claim_type)}</TableCell>
                    <ComponentPermission codeIn={ACTION_CODES}>
                      <TableCell>
                        {/* El botón lleva a /ecommerce/reclamaciones/view/:id, ya
                            protegida con ecommerce_claims.view: se reutiliza ese
                            code. */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/ecommerce/reclamaciones/view/${r.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </ComponentPermission>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        <CardFooter className="!p-0">
          <PaginationBar
            pagination={pagination}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </CardFooter>
      </Card>
    </div>
  );
}
