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
import ProductHeader from "../components/ProductHeader";
import ProductsTable from "../components/ProductsTable";

const Products = () => {
  return (
    <div className="space-y-6">
      <ProductHeader />

      <ProductsTable />
    </div>
  );
};

export default Products;
