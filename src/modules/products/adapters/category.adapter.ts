import { Category } from "../products.types";

export const categoryAdapter = (data: any[]): Category[] => {
    return data.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description || null,
        image_url: item.image_url || null,
        parent_id: item.parent_id || null,
        created_at: item.created_at
    }));
};
