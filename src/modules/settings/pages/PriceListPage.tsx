import { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { usePriceList } from "../hooks/usePriceList";
import { PriceListFormDialog } from "../components/list-price/PriceListFormDialog";
import { PriceList } from "../types/PriceList.types";
import { useCreatePriceList } from "../hooks/useCreatePriceList";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";

const PriceListPage = () => {
  const {
    priceLists,
    loading,
    openFormModal,
    saving,
    pagination,
    savePriceList,
    deletePriceList,
    handleOpenChange,
  } = usePriceList();

  const [editingItem, setEditingItem] = useState<PriceList | null>(null);

  return (
    <div className="p-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Listas de Precios
          </h1>
          <p className="text-muted-foreground">
            Gestiona las listas de precios del sistema
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingItem(null);
            handleOpenChange(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva Lista de Precios
        </Button>
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
                <TableHead className="text-center w-28">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : priceLists.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-10 text-muted-foreground"
                  >
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
                    <TableCell className="text-center">
                      {item.location}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={item.isWeb ? "default" : "secondary"}>
                        {item.isWeb ? "Sí" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingItem(item);
                            handleOpenChange(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => deletePriceList(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
            onPageChange={() => {}}
            onPageSizeChange={() => {}}
          />
        </CardFooter>
      </Card>

      <PriceListFormDialog
        key={editingItem?.id ?? "new"}
        open={openFormModal}
        item={editingItem}
        saving={saving}
        onSaved={savePriceList}
        onOpenChange={handleOpenChange}
      />
    </div>
  );
};

export default PriceListPage;
