import { useAttributes } from "../hooks/useAttributes";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
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
import { Edit, Trash2, Palette } from "lucide-react";
import AttributesHeader from "../components/attributes/AttributesHeader";
import AttributesFilterBar from "../components/attributes/AttributesFilterBar";
import AttributesFilterModal from "../components/attributes/AttributesFilterModal";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";

const AttributesPage = () => {
  const {
    attributes,
    loading,
    search,
    pagination,
    filters,
    isOpenFilterModal,
    onSearchChange,
    onPageChange,
    handlePageSizeChange,
    onOrderChange,
    onOpenFilterModal,
    onCloseFilterModal,
    onApplyFilter,
    onResetFilters,
  } = useAttributes();

  const handleNewAttribute = () => {
    // TODO: Implementar modal para nuevo atributo
    console.log("New attribute");
  };

  const handleNewTerm = () => {
    // TODO: Implementar modal para nuevo término
    console.log("New term");
  };

  const handleEdit = (id: string, type: "group" | "term") => {
    // TODO: Implementar edición
    console.log("Edit", id, type);
  };

  const handleDelete = (id: string, type: "group" | "term") => {
    // TODO: Implementar eliminación
    console.log("Delete", id, type);
  };

  const renderSkeletonRows = () => {
    return Array.from({ length: 8 }).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        <TableCell>
          <Skeleton className="h-5 w-40" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-20" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-8 w-20" />
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <div className="space-y-6">
      <AttributesHeader
        onNewAttribute={handleNewAttribute}
        onNewTerm={handleNewTerm}
      />

      <Card>
        <CardHeader>
          <AttributesFilterBar
            search={search}
            onSearchChange={onSearchChange}
            onOpen={onOpenFilterModal}
            order={filters.order}
            onOrderChange={onOrderChange}
          />
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Cantidad de Productos</TableHead>
                <TableHead className="w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                renderSkeletonRows()
              ) : attributes.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground py-8"
                  >
                    No se encontraron atributos
                  </TableCell>
                </TableRow>
              ) : (
                attributes.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      {row.type === "group" ? (
                        <div className="flex items-center gap-2">
                          <Palette className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold">{row.name}</span>
                          <Badge variant="outline" className="text-xs">
                            ATRIBUTO
                          </Badge>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 pl-6">
                          <span className="text-muted-foreground">•</span>
                          <span>{row.name}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground italic">
                      —
                    </TableCell>
                    <TableCell>{row.products} productos</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(row.id, row.type)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(row.id, row.type)}
                        >
                          <Trash2 className="w-4 h-4" />
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
            onPageChange={onPageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardFooter>
      </Card>

      <AttributesFilterModal
        isOpen={isOpenFilterModal}
        filters={filters}
        onClose={onCloseFilterModal}
        onApply={onApplyFilter}
        onReset={onResetFilters}
      />
    </div>
  );
};

export default AttributesPage;
