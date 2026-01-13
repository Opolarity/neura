import { Button } from "@/components/ui/button";
import { Plus, Trash } from "lucide-react";

interface ProductsHeaderProps {
  title?: string;
  selectedProducts?: number[] | [];
  handleBulkDelete?: () => void;
  handleNewProduct?: () => void;
  onAddClick?: () => void;
}

const ProductHeader = ({
  title = "Gestión de Productos",
  selectedProducts = [],
  handleBulkDelete,
  handleNewProduct,
  onAddClick,
}: ProductsHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {title}
        </h1>
        <p className="text-gray-600">Administra tu catálogo de productos</p>
      </div>
      <div className="flex gap-2">
        {selectedProducts.length > 0 && (
          <Button
            variant="destructive"
            onClick={handleBulkDelete}
            className="gap-2"
          >
            <Trash className="w-4 h-4" />
            Eliminar {selectedProducts.length} seleccionados
          </Button>
        )}
        {(handleNewProduct || onAddClick) && (
          <Button onClick={handleNewProduct || onAddClick} className="gap-2">
            <Plus className="w-4 h-4" />
            {title.includes("categoría") ? "Nueva Categoría" : "Nuevo Producto"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProductHeader;
