import { useState, useEffect, useRef } from "react";
import { getSaleProducts } from "@/modules/inventory/services/Movements.service";
import { getTypes } from "@/shared/services/service";
import { getTypesAdapter } from "@/shared/adapters/adapter";
import { Types } from "@/shared/types/type";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import { useDebounce } from "@/shared/hooks";

export const useReturnSelectionCambio = () => {
    const initialized = useRef(false);

    const [productStatusTypes, setProductStatusTypes] = useState<Types[]>([]);
    const [productStatusType, setProductStatusType] = useState<Types | null>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [search, setSearch] = useState("");
    const [pagination, setPagination] = useState<PaginationState>({
        p_page: 1,
        p_size: 10,
        total: 0,
    });

    const debouncedSearch = useDebounce(search, 500);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (!initialized.current) return;
        loadProducts(1, pagination.p_size, debouncedSearch, productStatusType?.id || null);
    }, [debouncedSearch]);

    const loadInitialData = async () => {
        try {
            const typesRes = await getTypes("STK");
            const types = getTypesAdapter(typesRes);
            setProductStatusTypes(types);

            const defaultType = types.find((t) => t.code === "PRD") || types[0] || null;
            setProductStatusType(defaultType);

            await loadProducts(1, 10, "", defaultType?.id || null);
            initialized.current = true;
        } catch (error) {
            console.error("Error loading product types:", error);
        }
    };

    const loadProducts = async (
        page: number,
        size: number,
        searchTerm: string,
        typeId: number | null,
    ) => {
        setLoadingProducts(true);
        try {
            const response = await getSaleProducts({
                p_page: page,
                p_size: size || 5,
                p_search: searchTerm || null,
                p_stock_type_id: typeId,
            });
            setProducts(response.data || []);
            setPagination({
                p_page: response.page.page,
                p_size: response.page.size,
                total: response.page.total,
            });
        } catch (error) {
            console.error("Error loading products:", error);
        } finally {
            setLoadingProducts(false);
        }
    };

    const handleTypeChange = (type: Types | null) => {
        setProductStatusType(type);
        setSelectedProduct(null);
        loadProducts(1, pagination.p_size, search, type?.id || null);
    };

    const handleSearchChange = (value: string) => {
        setSearch(value);
    };

    const handlePageChange = (page: number) => {
        loadProducts(page, pagination.p_size, search, productStatusType?.id || null);
    };

    const handleSelectProduct = (product: any) => {
        setSelectedProduct(product);
        setIsOpen(false);
    };

    const resetSelection = () => {
        setSelectedProduct(null);
        setSearch("");
    };

    return {
        productStatusTypes,
        productStatusType,
        products,
        loadingProducts,
        isOpen,
        setIsOpen,
        selectedProduct,
        search,
        pagination,
        handleTypeChange,
        handleSearchChange,
        handlePageChange,
        handleSelectProduct,
        resetSelection,
    };
};
