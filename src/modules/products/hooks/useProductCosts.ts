import { useState, useEffect } from "react";
import { ProductCost, ProductCostsFilters } from "../types/ProductCosts.types";
import { PaginationState } from "../types/Products.types";
import { productCostsApi } from "../services/ProductCosts.service";
import { productCostsAdapter } from "../adapters/ProductCosts.adapter";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useProductCosts = () => {
    const [products, setProducts] = useState<ProductCost[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [pagination, setPagination] = useState<PaginationState>({
        p_page: 1,
        p_size: 20,
        total: 0,
    });
    const [isOpenFilterModal, setIsOpenFilterModal] = useState(false);
    const [filters, setFilters] = useState<ProductCostsFilters>({
        mincost: null,
        maxcost: null,
        order: null,
        search: null,
        page: 1,
        size: 20,
        cost: null,
    });

    // Editing state
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [editedCosts, setEditedCosts] = useState<Record<number, number | "">>({});
    const { toast } = useToast();

    const loadData = async (filtersObj?: ProductCostsFilters) => {
        setLoading(true);
        setError(null);

        try {
            const activeFilters = filtersObj || filters;
            const dataProductCosts = await productCostsApi(activeFilters);
            const { products, pagination } = productCostsAdapter(dataProductCosts);
            console.log(dataProductCosts);

            setProducts(products);
            setPagination(pagination);
        } catch (error) {
            console.error(error);
            setError("Ocurrió un error al cargar datos de costos de productos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const debouncedSearch = useDebounce(search, 500);

    useEffect(() => {
        if (debouncedSearch !== filters.search) {
            const newFilters = { ...filters, search: debouncedSearch, page: 1 };
            setFilters(newFilters);
            loadData(newFilters);
        }
    }, [debouncedSearch]);

    const onSearchChange = (value: string) => {
        setSearch(value);
    };

    const onPageChange = (page: number) => {
        const newFilters = { ...filters, page };
        setFilters(newFilters);
        loadData(newFilters);
    };

    const onOrderChange = (order: string) => {
        const newFilters = { ...filters, order };
        setFilters(newFilters);
        loadData(newFilters);
    };

    const handlePageSizeChange = (size: number) => {
        const newFilters = { ...filters, size, page: 1 };
        setFilters(newFilters);
        loadData(newFilters);
    };

    const onOpenFilterModal = () => {
        setIsOpenFilterModal(true);
    };

    const onCloseFilterModal = () => {
        setIsOpenFilterModal(false);
    };

    const onApplyFilter = (newFilters: ProductCostsFilters) => {
        const updatedFilters = { ...newFilters, page: 1, size: filters.size };
        setFilters(updatedFilters);
        loadData(updatedFilters);
        setIsOpenFilterModal(false);

    };

    // Editing logic

    const handleCostChange = (variationId: number, value: string) => {
        setEditedCosts((prev) => ({
            ...prev,
            [variationId]: value === "" ? "" : parseFloat(value),
        }));
        setHasChanges(true);
    };



    const getCostValue = (
        variationId: number,
        originalCost: number | null
    ): number | "" => {
        return editedCosts[variationId] !== undefined
            ? editedCosts[variationId]
            : originalCost ?? "";
    };

    const handleEdit = () => {
        setIsEditing(true);
        setEditedCosts({});
        setHasChanges(false);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditedCosts({});
        setHasChanges(false);
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);


            const costUpdates = Object.entries(editedCosts).map(
                ([variationId, cost]) => ({
                    variation_id: parseInt(variationId),
                    product_cost: cost === "" ? null : cost,
                })
            );


            const { error } = await supabase.functions.invoke(
                "update-product-costs",
                {
                    body: { costUpdates },
                }
            );

            if (error) throw error;

            toast({
                title: "Éxito",
                description: "Costos actualizados correctamente",
            });

            setIsEditing(false);
            setEditedCosts({});
            setHasChanges(false);

            await loadData();
        } catch (error: any) {
            console.error("Error saving costs:", error);
            toast({
                title: "Error",
                description: "No se pudo actualizar los costos",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const hasActiveFilters = filters.mincost !== null || filters.maxcost !== null || filters.cost !== null;

    return {
        products,
        pagination,
        loading,
        error,
        search,
        isOpenFilterModal,
        filters,
        isEditing,
        isSaving,
        hasChanges,
        hasActiveFilters,
        onPageChange,
        handlePageSizeChange,
        onSearchChange,
        onOpenFilterModal,
        onCloseFilterModal,
        onApplyFilter,
        onOrderChange,
        handleCostChange,
        getCostValue,
        handleEdit,
        handleCancel,
        handleSave,
        loadData,
    };
};
