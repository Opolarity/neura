import { PaginationState } from "@/shared/components/pagination/Pagination";
import {
    Category,
    CategoryApiResponse,
} from "../types/Categories.types";

export const categoryAdapter = (response: CategoryApiResponse) => {
    const formattedCategories = response.data.map(
        (item) => ({
            id: item.id_category,
            name: item.nombre,
            description: item.descripcion,
            image: item.imagen,
            products: item.productos,
            parent_category: item.categoria_padre,
        })
    );

    const pagination: PaginationState = {
        p_page: response.page.page,
        p_size: response.page.size,
        total: response.page.total,
    };

    return { formattedCategories, pagination };
};