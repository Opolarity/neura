import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign } from "lucide-react";
import { usePriceList } from "../hooks/usePriceList";

const PriceListPage = () => {
  const { priceLists, loading } = usePriceList();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
          <DollarSign className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Listas de Precios</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona las listas de precios del sistema
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Listado</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Código</TableHead>
                <TableHead className="text-center">Ubicación</TableHead>
                <TableHead className="text-center">Web</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : priceLists.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    No se encontraron listas de precios
                  </TableCell>
                </TableRow>
              ) : (
                priceLists.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-muted-foreground">
                      {item.id}
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      {item.code ? (
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {item.code}
                        </code>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">{item.location}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={item.web ? "default" : "secondary"}>
                        {item.web ? "Sí" : "No"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PriceListPage;
