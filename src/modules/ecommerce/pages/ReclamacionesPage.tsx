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

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reclamaciones</h1>
        <p className="text-gray-600">Gestiona las quejas y reclamaciones de los clientes</p>
      </div>

      <Card>
        <CardHeader>
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

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead># Orden</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Fecha de Incidente</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Detalle</TableHead>
                <TableHead>Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cargando reclamaciones...
                    </div>
                  </TableCell>
                </TableRow>
              ) : reclamaciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
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
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/ecommerce/reclamaciones/view/${r.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        <CardFooter>
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

