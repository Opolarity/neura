import { inventoryService } from "../services/inventory.service";
import { inventoryAdapter } from "../adapters/inventory.adapter";

export const getMovementsStore = async () => {
    try {
        const data = await inventoryService.getMovements();
        return inventoryAdapter.mapMovements(data);
    } catch (error: any) {
        console.error("Movements Store Error:", error);
        throw error;
    }
};
