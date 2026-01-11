import { categoryService } from "../services/category.service";
import { categoryAdapter } from "../adapters/category.adapter";
import { Category, CategoryProductCount } from "../products.types";

export const getCategoriesStore = async (): Promise<Category[]> => {
    try {
        const data = await categoryService.fetchCategories();
        return categoryAdapter(data);
    } catch (error) {
        console.error("Error in getCategoriesStore:", error);
        throw error;
    }
};

export const getProductCountsStore = async (): Promise<CategoryProductCount[]> => {
    try {
        return await categoryService.fetchProductCounts();
    } catch (error) {
        console.error("Error in getProductCountsStore:", error);
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
