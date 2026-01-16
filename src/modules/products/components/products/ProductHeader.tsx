import { Button } from "@/components/ui/button";
import { Plus, Trash } from "lucide-react";

interface ProductsHeaderProps {
  selectedProducts: number[];
  handleBulkDelete: (productIds: number[]) => void;
  handleNewProduct: () => void;
}

const ProductHeader = ({
  selectedProducts,
  handleBulkDelete,
  handleNewProduct,
}: ProductsHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Gestión de Productos
        </h1>
        <p className="text-gray-600">Administra tu catálogo de productos</p>
      </div>
      <div className="flex gap-2">
        {selectedProducts.length > 1 && (
          <Button
            variant="destructive"
            onClick={() => handleBulkDelete(selectedProducts)}
            className="gap-2"
          >
            <Trash className="w-4 h-4" />
            Eliminar {selectedProducts.length} seleccionados
          </Button>
        )}
        <Button onClick={handleNewProduct} className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Producto
        </Button>
      </div>
    </div>
  );
};

export default ProductHeader;
