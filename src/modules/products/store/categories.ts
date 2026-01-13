import { categoryService } from "../services/category.service";
import { categoryAdapter, categoryWithCountAdapter } from "../adapters/category.adapter";
import { Category, CategoryApiResponse, CategoryFilters } from "../products.types";

export const getCategoriesStore = async (): Promise<Category[]> => {
    try {
        const data = await categoryService.fetchCategories();
        return categoryAdapter(data);
    } catch (error) {
        console.error("Error in getCategoriesStore:", error);
        throw error;
    }
};

export const getPaginatedCategoriesStore = async (filters: CategoryFilters): Promise<CategoryApiResponse> => {
    try {
        const response = await categoryService.fetchProductCounts(filters);
        return {
            ...response,
            data: categoryWithCountAdapter(response.data) as any[]
        };
    } catch (error) {
        console.error("Error in getPaginatedCategoriesStore:", error);
        throw error;
    }
};

export const saveCategoryStore = async (category: Partial<Category>, image?: File | null): Promise<void> => {
    try {
        await categoryService.saveCategory(category, image);
    } catch (error) {
        console.error("Error in saveCategoryStore:", error);
        throw error;
    }
};

export const deleteCategoryStore = async (categoryId: number): Promise<void> => {
    try {
        await categoryService.deleteCategory(categoryId);
    } catch (error) {
        console.error("Error in deleteCategoryStore:", error);
        throw error;
    }
};
