import { supabase } from "@/integrations/supabase/client";
import { Category, CategoryProductCount } from "../products.types";

export const categoryService = {
    async fetchCategories(): Promise<Category[]> {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .neq('id', 0)
            .order('name');

        if (error) throw error;
        return data || [];
    },

    async fetchProductCounts(): Promise<CategoryProductCount[]> {
        const { data, error } = await supabase.functions.invoke('get-categories-product-count');
        if (error) throw error;
        return data || [];
    },

    async saveCategory(category: Partial<Category>, image?: File | null): Promise<void> {
        let imageUrl = category.image_url || null;

        if (image) {
            imageUrl = await this.uploadImage(image);
        }

        if (category.id) {
            const { error } = await supabase
                .from('categories')
                .update({
                    name: category.name,
                    description: category.description || null,
                    image_url: imageUrl,
                    parent_id: category.parent_id || null
                })
                .eq('id', category.id);

            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('categories')
                .insert([{
                    name: category.name,
                    description: category.description || null,
                    image_url: imageUrl,
                    parent_id: category.parent_id || null
                }]);

            if (error) throw error;
        }
    },

    async deleteCategory(categoryId: number): Promise<void> {
        const { data, error } = await supabase.functions.invoke('delete-category', {
            body: { categoryId },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);
    },

    async uploadImage(file: File): Promise<string> {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('products')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('products')
            .getPublicUrl(filePath);

        return publicUrl;
    }
};
