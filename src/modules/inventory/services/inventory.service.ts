import { supabase } from "@/integrations/supabase/client";

export const inventoryService = {
    getInventory: async () => {
        const { data, error } = await supabase.functions.invoke('get-inventory');
        if (error) throw error;
        return data;
    },

    updateStock: async (stockUpdates: any[], defectsUpdates: any[]) => {
        const { data, error } = await supabase.functions.invoke('update-stock', {
            body: { stockUpdates, defectsUpdates },
        });
        if (error) throw error;
        return data;
    },

    getMovements: async () => {
        const { data, error } = await supabase
            .from("stock_movements")
            .select(`
        *,
        variations!inner (
          id,
          sku,
          products!inner (
            id,
            title
          ),
          variation_terms (
            terms (
              id,
              name
            )
          )
        ),
        types!stock_movements_movement_type_fkey (
          id,
          name
        ),
        orders (
          id,
          document_number
        ),
        profiles!stock_movements_created_by_fkey (
          name,
          last_name
        ),
        out_warehouse:warehouses!stock_movements_out_warehouse_id_fkey (
          id,
          name
        ),
        in_warehouse:warehouses!stock_movements_in_warehouse_id_fkey (
          id,
          name
        )
      `)
            .order("created_at", { ascending: false });

        if (error) throw error;
        return data;
    }
};
