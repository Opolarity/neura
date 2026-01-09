import ProductHeader from "../components/ProductHeader";
import ProductsTable from "../components/ProductsTable";
import { useProducts } from "../hooks/useProducts";

const Products = () => {
  const { products, loading, search, onSearchChange } = useProducts();

  return (
    <div className="space-y-6">
      <ProductHeader />

      <ProductsTable
        products={products}
        loading={loading}
        search={search}
        onSearchChange={onSearchChange}
      />
    </div>
  );
};

export default Products;
