import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { Edit, Save, Loader2, Search, ListFilter } from "lucide-react";
import { useProductCostsLogic } from "../store/ProductCosts.logic";

const ProductCosts = () => {
  const {
    products,
    loading,
    isEditing,
    isSaving,
    hasChanges,
    search,
    onSearchChange,
    handleCostChange,
    getCostValue,
    handleEdit,
    handleCancel,
    handleSave,
    onOpen,
  } = useProductCostsLogic();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ProductCostsHeader */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Costos de Productos
          </h1>
          <p className="text-muted-foreground">
            Gestiona el costo de cada variación de producto
          </p>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button onClick={handleEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Actualizar
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          {/* ProductCostsFilterBar */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                type="text"
                placeholder="Buscar productos..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <Button onClick={onOpen} className="gap-2">
              <ListFilter className="w-4 h-4" />
              Filtrar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* ProductCostsTable */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Variación</TableHead>
                <TableHead>Costo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((item) => (
                <TableRow key={item.variation_id}>
                  <TableCell className="font-mono text-sm">
                    {item.sku}
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.term}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={getCostValue(item.variation_id, item.cost)}
                      onChange={(e) =>
                        handleCostChange(item.variation_id, e.target.value)
                      }
                      onWheel={(e) => e.currentTarget.blur()}
                      disabled={!isEditing}
                      className="w-32 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductCosts;
