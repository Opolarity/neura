import { ProductData } from "../types";

interface ProductTableProps{
    products:ProductData,
    loading:boolean,
    selection:number,
    onEdit
}

function ProductTable({
    products={products}
        loading={loading}
        selection={selection}
        onEdit={(id) => navigate(`/products/add?id=${id}`)}
        onReload={reload}
}) {
    return (  );
}

export default ProductTable;