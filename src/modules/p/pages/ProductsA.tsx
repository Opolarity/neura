import { useNavigate } from "react-router-dom";
import { useProducts } from "../hooks/useProducts";
import { useProductSelection } from "../hooks/useProductSelection";
import ProductHeader from "../components/ProductHeader";

const ProductsPage = () => {
  const navigate = useNavigate();
  const { products, loading, search, setSearch, reload } = useProducts();
  const selection = useProductSelection();

  return (
    <>
      <ProductHeader
        search={search}
        onSearch={setSearch}
        onNew={() => navigate("/products/add")}
      />
    </>
  );
};
export default ProductsPage;
