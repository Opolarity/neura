import { supabase } from "@/integrations/supabase/client"
import { buildEndpoint } from "@/shared/utils/utils";
import { CategoryApiResponse, CategoryFilters, CategoryPayload, SimpleCategory } from "../types/Categories.types"

export const categoriesListApi = async (): Promise<SimpleCategory[]> => {
    const { data, error } = await supabase
        .from("categories")
        .select("id, name, parent_category")
        .order("name");
    if (error) throw error;
    return data ?? [];
};

export const categoryApi = async (
    filters: CategoryFilters = {}
): Promise<CategoryApiResponse> => {
    const endpoint = buildEndpoint("get-categories-product-count", filters);

    const { data, error } = await supabase.functions.invoke(
        endpoint,
        {
            method: "GET",
        }
    );

    if (error) {
        console.error("Invoke error:", error);
        throw error;
    }

    return (
        data ?? {
            data: [],
            page: { page: 1, size: 20, total: 0 },
        }
    );
};

export const createCategoryApi = async (newCategory: CategoryPayload) => {
    const { data, error } = await supabase.functions.invoke("create-category", {
        method: "POST",
        body: newCategory
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);
}

export const updateCategoryApi = async (updateCategory: CategoryPayload) => {
    const { data, error } = await supabase.functions.invoke("update-category", {
        body: updateCategory
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);
}

export const deleteCategoryApi = async (categoryId: number) => {
    const { data, error } = await supabase.functions.invoke("delete-category", {
        body: { categoryId: categoryId },
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);
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

    const { data, error } = await supabase.functions.invoke(endpoint, {
        method: "GET",
    });

    if (error) {
        console.error("Invoke error:", error);
        throw error;
    }

    return (
        data ?? {
            data: [],
            page: { page: 1, size: 20, total: 0 },
        }
    );
};
*/
