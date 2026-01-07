interface ProductHeaderProps{
    search:string,
        onSearch:()=>void,
        onNew:()=>void,
}

const ProductHeader = ({
    search={search},
    onSearch={setSearch},
    onNew={() => navigate("/products/add")}
}) => {
    return ();
}

export default ProductHeader;