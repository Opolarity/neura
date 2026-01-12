import { supabase } from '@/integrations/supabase/client';
import { 
  CategoriesApiResponse, 
  CategoriesQueryParams 
} from '../types/Categories.type';

/**
 * Fetches categories list using the stored procedure via edge function.
 */
export const getCategoriesList = async (
  params: CategoriesQueryParams
): Promise<CategoriesApiResponse> => {
  const { data, error } = await supabase.functions.invoke('get-categories-product-count', {
    body: {
      search: params.search || null,
      page: params.page,
      size: params.size,
      order: params.order,
      parentCategory: params.filters.isParent,
      hasDescription: params.filters.hasDescription,
      hasImage: params.filters.hasImage,
      minProducts: params.filters.minProducts ?? 0,
      maxProducts: params.filters.maxProducts ?? 0,
    },
  });

  if (error) throw error;
  
  return data as CategoriesApiResponse;
};

/**
 * Creates a new category.
 */
export const createCategory = async (category: {
  name: string;
  description?: string | null;
  image_url?: string | null;
}) => {
  const { data, error } = await supabase
    .from('categories')
    .insert([category])
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Updates an existing category.
 */
export const updateCategory = async (
  id: number,
  category: {
    name?: string;
    description?: string | null;
    image_url?: string | null;
  }
) => {
  const { data, error } = await supabase
    .from('categories')
    .update(category)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Deletes a category using the edge function.
 */
export const deleteCategory = async (categoryId: number) => {
  const { data, error } = await supabase.functions.invoke('delete-category', {
    body: { categoryId },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  
  return data;
};

/**
 * Uploads an image to storage.
 */
export const uploadCategoryImage = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `categories/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('products')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('products')
    .getPublicUrl(fileName);

  return publicUrl;
};
