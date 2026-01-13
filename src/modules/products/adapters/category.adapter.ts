import { Category, CategoryWithCount } from "../products.types";

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

export const categoryWithCountAdapter = (data: any[]): any[] => {
    return data.map((item: any) => ({
        image_url: item.imagen,
        name: item.nombre,
        parent_name: item["cat.padre"],
        product_count: item.productos,
        description: item.descripcion,
        max_products: item.max_productos,
        min_products: item.min_productos
    }));
};
