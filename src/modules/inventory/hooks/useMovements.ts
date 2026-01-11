import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { inventoryService } from "../services/inventory.service";
import { StockMovement, InventoryFilters } from "../inventory.types";

export const useMovements = () => {
    const { user } = useAuth();
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<InventoryFilters>({
        search: "",
        startDate: "",
        endDate: "",
    });

    useEffect(() => {
        if (user) {
            fetchMovements();
        }
    }, [user]);

    const fetchMovements = async () => {
        setLoading(true);
        try {
            const data = await inventoryService.getMovements();
            setMovements(data || []);
        } catch (error) {
            console.error("Error fetching stock movements:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredMovements = useMemo(() => {
        let filtered = [...movements];

        if (filters.search) {
            const search = filters.search.toLowerCase();
            filtered = filtered.filter(
                (m) =>
                    m.variations.products.title.toLowerCase().includes(search) ||
                    m.variations.sku?.toLowerCase().includes(search)
            );
        }

        if (filters.startDate) {
            filtered = filtered.filter(
                (m) => new Date(m.created_at) >= new Date(filters.startDate!)
            );
        }

        if (filters.endDate) {
            filtered = filtered.filter(
                (m) => new Date(m.created_at) <= new Date(filters.endDate! + "T23:59:59")
            );
        }

        return filtered;
    }, [movements, filters]);

    const summary = useMemo(() => {
        const totalOutflow = filteredMovements
            .filter((m) => m.order_id)
            .reduce((sum, m) => sum + m.quantity, 0);

        const manualMovements = filteredMovements.filter((m) => !m.order_id).length;

        return {
            totalMovements: filteredMovements.length,
            totalOutflow,
            manualMovements,
        };
    }, [filteredMovements]);

    return {
        movements: filteredMovements,
        loading,
        filters,
        setFilters,
        summary,
        refresh: fetchMovements,
    };
};
