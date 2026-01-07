import { ProductData } from "../types";

interface ProductTableProps {
  products: ProductData[];
  loading: boolean;
  selection: number[];
  onEdit: (id: number) => void;
  onReload: () => void;
}

function ProductTable({ products, loading, selection, onEdit, onReload }: ProductTableProps) {
  return null;
}

export default ProductTable;
