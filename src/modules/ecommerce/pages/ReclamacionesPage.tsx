import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { Loader2, Search, Eye } from "lucide-react";
import { useReclamaciones } from "../hooks/useReclamaciones";
import { formatDateDisplay, formatDateTime } from "@/shared/utils/date";
import { ComponentPermission } from "@/shared/components/component-permission";
import ReclamacionesHeader from "../components/reclamaciones/ReclamacionesHeader";
import ReclamacionesFilterModal from "../components/reclamaciones/ReclamacionesFilterModal";
import {
  ComplaintStatusBadge,
  ComplaintTypeBadge,
} from "../components/reclamaciones/ComplaintBadges";

// # Reclamo, Orden, Correo, Fecha de registro, Fecha de incidente, Monto, Tipo,
// Estado, Acción. Si el rol no puede ver el detalle, la columna de Acción no se
// pinta y este número queda uno largo: solo afecta a las filas de "cargando" y
// "no se encontraron reclamaciones", y la columna sobrante colapsa a 0px porque
// ninguna otra fila la ocupa.
const COL_SPAN = 9;

// Code de la columna Acción, en una constante para que la cabecera y la celda no
// puedan quedar con listas distintas y aparezca un th sin td o al revés.
const ACTION_CODES = ["ecommerce_claims.view"];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(amount);

export default function ReclamacionesPage() {
  const navigate = useNavigate();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const {
    reclamaciones,
    loading,
    exporting,
    search,
    status,
    pagination,
    onSearchChange,
    onStatusChange,
    onPageChange,
    onPageSizeChange,
    onExport,
  } = useReclamaciones();

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <ReclamacionesHeader
        onOpenFilters={() => setFiltersOpen(true)}
        onExport={onExport}
        exporting={exporting}
        filtersActive={status !== ""}
      />

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="!p-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            {/* El buscador antiguo prometía "orden, correo o detalle" y no
                encontraba nada: filtraba por orden_id, que siempre está vacío.
                Ahora busca por número de reclamo o correo, que es lo que el SP
                sabe resolver. */}
            <Input
              placeholder="Buscar por N° de reclamo o correo..."
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
                <TableHead>N° Reclamo</TableHead>
                <TableHead># Orden</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Fecha de registro</TableHead>
                <TableHead>Fecha de incidente</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
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
                    <TableCell className="font-medium">#{r.id}</TableCell>
                    <TableCell>{r.orderId ? `#${r.orderId}` : "-"}</TableCell>
                    <TableCell>{r.email || "-"}</TableCell>
                    <TableCell>{r.createdAt ? formatDateTime(r.createdAt) : "-"}</TableCell>
                    <TableCell>
                      {r.incidentDate ? formatDateDisplay(r.incidentDate) : "-"}
                    </TableCell>
                    <TableCell>{formatCurrency(r.amountClaim)}</TableCell>
                    <TableCell>
                      <ComplaintTypeBadge claimType={r.claimType} />
                    </TableCell>
                    <TableCell>
                      <ComplaintStatusBadge status={r.status} />
                    </TableCell>
                    <ComponentPermission codeIn={ACTION_CODES}>
                      <TableCell>
                        {/* El botón lleva a /ecommerce/reclamaciones/view/:id, ya
                            protegida con ecommerce_claims.view: se reutiliza ese
                            code. */}
                        <Button
                          variant="outline"
                          size="sm"
                          title="Ver la reclamación"
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

      <ReclamacionesFilterModal
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        status={status}
        onApply={onStatusChange}
      />
    </div>
  );
}
