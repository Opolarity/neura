import { supabase } from "@/integrations/supabase/client"
import { buildEndpoint } from "@/shared/utils/utils";
import { CategoryApiResponse, CategoryFilters, CategoryPayload, SimpleCategory } from "../types/Categories.types"
import { invokeFunction } from "@/integrations/supabase/invokeFunction";

export const categoriesListApi = async (): Promise<SimpleCategory[]> => {
    const { data, error } = await supabase
        .from("categories")
        .select("id, name, parent_category")
        .order("name");
    if (error) throw error;
    return (data ?? []).filter((category) => category.name.trim() !== "");
};

export const categoryApi = async (
    filters: CategoryFilters = {}
): Promise<CategoryApiResponse> => {
    const endpoint = buildEndpoint("get-categories-product-count", filters);

    const data = await invokeFunction(
        endpoint,
        {
            method: "GET",
        }
    );

    return (
        data ?? {
            data: [],
            page: { page: 1, size: 20, total: 0 },
        }
    );
};

export const createCategoryApi = async (newCategory: CategoryPayload) => {
    await invokeFunction("create-category", {
        method: "POST",
        body: newCategory
    });
}

export const updateCategoryApi = async (updateCategory: CategoryPayload) => {
    await invokeFunction("update-category", {
        body: updateCategory
    });
}

export const deleteCategoryApi = async (categoryId: number) => {
    await invokeFunction("delete-category", {
        body: { categoryId: categoryId },
    });
}
/*
export const categoryApi = async (
    filters: CategoryFilters
): Promise<CategoryApiResponse> => {
    const queryParams = new URLSearchParams(
        Object.entries(filters)
            .filter(
                ([, value]) => value !== undefined && value !== null && value !== ""
            )
            .map(([key, value]) => [key, String(value)])
    );

    const endpoint = queryParams.toString()
        ? `get-categories-product-count?${queryParams.toString()}`
        : "get-categories-product-count";

    const data = await invokeFunction(endpoint, {
        method: "GET",
    });

    return (
        data ?? {
            data: [],
            page: { page: 1, size: 20, total: 0 },
        }
    );
};
*/
