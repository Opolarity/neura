//SEPARAR
/*
[x] -> archivos creados
- [x] ButtonDeleteBulk
- [x] ButtonAddProduct
- [x] ButtonFilter
- [x] ModalFilter
- [x] DataTable (Componente reutilizable)
  - Props: Paginación, Filas, Filas por Páginas
*/
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash, Search, Loader2, ListFilter } from "lucide-react";
import placeholderImage from "@/assets/product-placeholder.png";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useProductsLogic } from "../store/Products.logic";
import PageSizeSelector from "../components/PageSizeSelector";
import Pagination from "../components/Pagination";
import ProductHeader from "../components/ProductHeader";
import ProductsTable from "../components/ProductsTable";

const Products = () => {
  const {
    loading,
    searchTerm,
    setSearchTerm,
    filteredProducts,
    selectedProducts,
    deleteDialogOpen,
    setDeleteDialogOpen,
    productToDelete,
    deleting,
    handleNewProduct,
    toggleSelectAll,
    toggleProductSelection,
    handleBulkDelete,
    handleDeleteClick,
    handleDeleteConfirm,
    handleEditProduct,
    getProductPrice,
    getProductStock,
    getProductStatus,
  } = useProductsLogic();

  return (
    <div className="space-y-6">
      <ProductHeader />

      <ProductsTable />
    </div>
  );
};

export default Products;
