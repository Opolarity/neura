import { PaginationState } from "@/shared/components/pagination/Pagination";
import {
    Category,
    CategoryApiResponse,
} from "../types/Categories.types";

export const categoryAdapter = (response: CategoryApiResponse) => {
    const formattedCategories: Category[] = response.data.map(
        (item) => ({
            id: item.id_category,
            name: item.name,
            description: item.description,
            image: item.image_url,
            products: item.products,
            parent_category: item.parent_category_name,
            parent_id: item.id_parent,
        })
    );

    const pagination: PaginationState = {
        p_page: response.page.page,
        p_size: response.page.size,
        total: response.page.total,
    };

    return { data: formattedCategories, pagination };
};