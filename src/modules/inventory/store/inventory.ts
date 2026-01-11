import { inventoryService } from "../services/inventory.service";
import { inventoryAdapter } from "../adapters/inventory.adapter";

export const getInventoryStore = async () => {
    try {
        const data = await inventoryService.getInventory();
        return inventoryAdapter.mapInventory(data);
    } catch (error: any) {
        console.error("Inventory Store Error:", error);
        throw error;
    }
};

export const updateStockStore = async (stockUpdates: any[], defectsUpdates: any[]) => {
    try {
        return await inventoryService.updateStock(stockUpdates, defectsUpdates);
    } catch (error: any) {
        console.error("Update Stock Store Error:", error);
        throw error;
    }
};
