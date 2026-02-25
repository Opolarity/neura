import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from '@/hooks/use-toast'
import { createMovementsTypeStockApi, createStockMovementsEntranceApi, getSaleProducts, getStockByVariationAndTypeApi, getUserWarehouse } from '../services/Movements.service';
import { typesByModuleCode } from '@/shared/services/service';
import { getProductSalesAdapter, getUserWarehouseAdapter } from '../adapters/Movements.adapter';

import { ProductSales, UserSummary, ProductSalesFilter, SelectedProduct } from "../types/Movements.types"
import { Types } from '@/shared/types/type';
import { PaginationState } from '@/shared/components/pagination/Pagination';
import { useDebounce } from '@/shared/hooks';

export const useCreateMovements = () => {
    const navigate = useNavigate();
    const [loadingInitial, setLoadingInitial] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(true);
    //USER SUMMARY
    const [movementType, setMovementType] = useState<Types | null>(null); // type of movement selected
    const [movementTypes, setMovementTypes] = useState<Types[]>([]);
    const [productStatusTypes, setProductStatusTypes] = useState<Types[]>([]);
    const [productStatusType, setProductStatusType] = useState<Types | null>(null);
    const [userSummary, setUserSummary] = useState<UserSummary | null>(null);
    //SELECT PRODUCTS
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [products, setProducts] = useState<ProductSales[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(
        [],
    );
    const [selectedProduct, setSelectedProduct] = useState<ProductSales | null>(
        null,
    );
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState("");
    const [pagination, setPagination] = useState<PaginationState>({
        p_page: 1,
        p_size: 10,
        total: 0,
    });
    const [filters, setFilters] = useState<ProductSalesFilter>({
        p_page: 1,
        p_size: 10,
        p_search: "",
    });

    const makeKey = (productId: number, typeId: number) =>
        `${productId}-${typeId}`;

    const debouncedSearch = useDebounce(search, 500);
    useEffect(() => {
        if (!loadingInitial && debouncedSearch !== filters.p_search) {
            const newFilters = { ...filters, p_search: debouncedSearch, p_page: 1 };
            setFilters(newFilters);
            loadProducts(newFilters);
        }
    }, [debouncedSearch]);

    const normalizeQuantity = (
        rawValue: string,
        stock: number,
    ): number | null => {
        const sanitized = rawValue.replace(/\D/g, "");

        if (sanitized === "") return null;

        const value = Number(sanitized);

        if (!value || value <= 0) return null;

        return Math.min(value, stock);
    };

    const handleMovementType = (type: Types | null) => {
        setMovementType(type);
    };
    const handleTypeSalesProduct = (type: Types | null) => {
        const newFilters = {
            ...filters,
            p_stock_type_id: type?.id || null,
            p_page: 1,
        };
        setProductStatusType(type);
        setFilters(newFilters);
        loadProducts(newFilters);
    };

    const handleQuantitySelectedProduct = (
        productId: number,
        originTypeId: number,
        value: string,
    ) => {
        setSelectedProducts((prev) =>
            prev.map((p) => {
                if (p.variationId !== productId || p.originType.id !== originTypeId) {
                    return p;
                }

                const quantity = normalizeQuantity(value, p.stock);
                console.log("STOCK USADO:", p.stock, "INPUT:", value, "RESULT:", quantity);

                return {
                    ...p,
                    quantity,
                };
            }),
        );
    };

    const handleSelectedProductStock = async (
        productId: number,
        originTypeId: number,
        typeId: string | null,
    ) => {
        const stockRes = await getStockByVariationAndTypeApi(productId, Number(typeId), userSummary?.warehouse_id);

        setSelectedProducts((prev) =>
            prev.map((p) => {
                if (p.variationId !== productId || p.originType.id !== originTypeId) {
                    return p;
                }

                return {
                    ...p,
                    destinationType:
                        typeId === "none"
                            ? null
                            : productStatusTypes.find((t) => t.id.toString() === typeId) ||
                            null,
                    destinationTypeStock: stockRes?.stock || 0,
                };
            }),
        );
        console.log(productId, typeId, userSummary?.warehouse_id);


        console.log(stockRes);

    };

    const addProduct = () => {
        if (!selectedProduct || !movementType) return;

        const exists = selectedProducts.some(
            (p) =>
                p.variationId === selectedProduct.variationId && p.originType.id === movementType.id,
        );

        if (exists) {
            console.log("Este producto ya se encuentra en la tabla");
            return;
        }

        const newSelected: SelectedProduct = {
            ...selectedProduct,
            quantity: null,
            originType: productStatusType,
            destinationType: productStatusType?.code === "TRS" ? null : undefined,
        };

        setSelectedProducts((prev) => [...prev, newSelected]);
        setSelectedProduct(null);
        console.log("Producto agregado correctamente");
    };

    const onSelectProduct = (product: ProductSales) => {
        if (product.stock === 0) {
            console.log("Producto sin stock disponible");
            return;
        }
        if (!productStatusType) return;

        const key = makeKey(product.variationId, productStatusType.id);

        if (selectedIds.has(key)) {
            console.log("Este producto ya se encuentra en la tabla");
            return;
        }
        setSelectedIds((prev) => {
            const next = new Set(prev);

            // 🔹 limpiar selección temporal anterior
            if (selectedProduct) {
                const prevKey = makeKey(selectedProduct.variationId, productStatusType.id);

                const isAlreadyAdded = selectedProducts.some(
                    (p) =>
                        p.variationId === selectedProduct.variationId &&
                        p.originType.id === productStatusType.id,
                );

                if (!isAlreadyAdded) {
                    next.delete(prevKey);
                }
            }

            // 🔹 marcar el nuevo producto
            next.add(key);
            return next;
        });
        setSelectedProduct(product);
        setIsOpen(false);
    };

    const handleSearchChange = (value: string) => {
        setSearch(value);
    };

    const handlePageChange = (page: number) => {
        const newFilters = { ...filters, p_page: page };
        setFilters(newFilters);
        loadProducts(newFilters);
    };

    const handlePageSizeChange = (size: number) => {
        const newFilters = { ...filters, p_size: size, p_page: 1 };
        setFilters(newFilters);
        loadProducts(newFilters);
    };

    const sendMovement = async () => {
        try {
            if (movementType.code === "MER") {
                const transformed = selectedProducts.map(item => ({
                    product_variation_id: item.variationId,
                    quantity: item.quantity,
                    stock_type_id: item.originType.id,
                    movements_type_id: movementType?.id,
                    warehouse_id: userSummary?.warehouse_id
                }));

                await createStockMovementsEntranceApi(transformed);
            } else if (movementType.code === "TRS") {
                const payload = {
                    warehouse_id: userSummary?.warehouse_id,
                    products: selectedProducts.map(item => ({
                        product_variation_id: item.variationId,
                        quantity: item.quantity,
                        origin_stock_type_code: item.originType.code,
                        destination_stock_type_code: item.destinationType.code
                    }))
                };

                await createMovementsTypeStockApi(payload);
            }

            toast({
                title: "Movimiento creado",
                description: "El movimiento de inventario se creó exitosamente.",
            });
            navigate("/inventory/movements");
        } catch (error) {
            console.error("Error al crear movimiento:", error);
            toast({
                title: "Error",
                description: "No se pudo crear el movimiento de inventario.",
                variant: "destructive",
            });
        }
    }

    const loadProducts = async (newFilters: ProductSalesFilter) => {
        setLoadingProducts(true);

        try {
            const responseProducts = await getSaleProducts(newFilters);
            const { data: dataProducts, pagination: newPagination } = getProductSalesAdapter(responseProducts);
            setProducts(dataProducts);
            setPagination(newPagination);
        } catch (error) {
            console.error("Error al cargar productos:", error);
        } finally {
            setLoadingProducts(false);
        }
    }

    const loadInitialData = async () => {
        try {
            // 1. Datos del usuario y almacén
            const userRes = await getUserWarehouse();
            const userAdp = getUserWarehouseAdapter(userRes);
            setUserSummary(userAdp);

            // 2. Tipos necesarios
            const [typesSTMRes, typesSTKRes] = await Promise.all([
                typesByModuleCode("STM"),
                typesByModuleCode("STK")
            ]);

            const typesSTMAdp = typesSTMRes.map(t => ({ id: t.id, name: t.name, code: t.code }));
            const typesSTKAdp = typesSTKRes.map(t => ({ id: t.id, name: t.name, code: t.code }));

            setMovementTypes(typesSTMAdp);
            setProductStatusTypes(typesSTKAdp);

            // 3. Determinar filtro por defecto (PRD)
            const typeSalesProductDefault = typesSTKAdp.find((type) => type.code === "PRD");

            const initialFilters: ProductSalesFilter = {
                p_warehouse_id: userAdp.warehouse_id,
                p_stock_type_id: typeSalesProductDefault?.id || null,
            };

            setFilters(initialFilters);
            setProductStatusType(typeSalesProductDefault);
            // 4. Cargar productos con los filtros iniciales completos
            await loadProducts(initialFilters);

            setLoadingInitial(false);
        } catch (error) {
            console.error("Error al cargar datos CreateMovements:", error);
        }
    };
    useEffect(() => {
        loadInitialData();
    }, []);

    return {
        loadingInitial,
        loadingProducts,
        movementType,
        movementTypes,
        productStatusTypes,
        productStatusType,
        userSummary,
        isOpen,
        products,
        selectedProduct,
        selectedProducts,
        selectedIds,
        search,
        pagination,
        filters,
        setIsOpen,
        handleMovementType,
        handleQuantitySelectedProduct,
        handleSelectedProductStock,
        addProduct,
        onSelectProduct,
        handleTypeSalesProduct,
        handleSearchChange,
        handlePageChange,
        handlePageSizeChange,
        sendMovement
    }
}
