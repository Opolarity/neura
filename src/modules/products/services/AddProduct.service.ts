import { supabase } from '@/integrations/supabase/client';
import type { 
  ProductFormDataResponse, 
  ProductDetailsResponse,
  CreateProductRequest,
  UpdateProductRequest 
} from '../types/AddProduct.types';

export const AddProductService = {
  /**
   * Obtiene los datos necesarios para el formulario de producto
   * (categorías, términos, listas de precios, almacenes)
   */
  async getFormData(): Promise<ProductFormDataResponse> {
    const { data, error } = await supabase.functions.invoke('get-product-form-data');
    if (error) throw error;
    return data;
  },

  /**
   * Obtiene los detalles de un producto para edición
   */
  async getProductDetails(productId: number): Promise<ProductDetailsResponse> {
    const { data, error } = await supabase.functions.invoke('get-product-details', {
      body: { productId }
    });
    if (error) throw error;
    return data;
  },

  /**
   * Valida si se puede cambiar el tipo de producto (variable/simple)
   */
  async validateTypeChange(productId: number, newIsVariable: boolean): Promise<{ canChange: boolean; reason?: string }> {
    const { data, error } = await supabase.functions.invoke('validate-product-type-change', {
      body: { productId, newIsVariable }
    });
    if (error) throw error;
    return data;
  },

  /**
   * Crea un nuevo producto
   */
  async createProduct(productData: CreateProductRequest): Promise<{ success: boolean; product?: any; error?: string; message?: string }> {
    const { data, error } = await supabase.functions.invoke('create-product', {
      body: productData
    });
    
    if (error) {
      const serverBody = (error as any)?.context?.body;
      let errorMessage = error.message || 'Error al crear el producto';
      try {
        const parsed = typeof serverBody === 'string' ? JSON.parse(serverBody) : serverBody;
        errorMessage = parsed?.error || parsed?.message || errorMessage;
      } catch {}
      throw new Error(errorMessage);
    }
    
    return data;
  },

  /**
   * Actualiza un producto existente
   */
  async updateProduct(productData: UpdateProductRequest): Promise<{ success: boolean; error?: string; message?: string }> {
    const { data, error } = await supabase.functions.invoke('update-product', {
      body: productData
    });
    
    if (error) {
      const serverBody = (error as any)?.context?.body;
      let errorMessage = error.message || 'Error al actualizar el producto';
      try {
        const parsed = typeof serverBody === 'string' ? JSON.parse(serverBody) : serverBody;
        errorMessage = parsed?.error || parsed?.message || errorMessage;
      } catch {}
      throw new Error(errorMessage);
    }
    
    return data;
  },

  /**
   * Sube una imagen al storage en la carpeta temporal
   */
  async uploadImage(file: File, productId?: number): Promise<string> {
    const fileExtension = file.name.split('.').pop() || 'jpg';
    // Siempre subir a products-images/tmp/ primero, el edge function moverá a la carpeta correcta
    const fileName = `products-images/tmp/${crypto.randomUUID()}.${fileExtension}`;
    
    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(fileName, file, { 
        upsert: true,
        contentType: file.type 
      });

    if (uploadError) throw uploadError;
    return fileName;
  },

  /**
   * Elimina una imagen del storage
   */
  async deleteImage(imagePath: string): Promise<void> {
    await supabase.storage.from('products').remove([imagePath]);
  },

  /**
   * Obtiene la URL pública de una imagen
   */
  getPublicUrl(path: string): string {
    const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(path);
    return publicUrl;
  }
};
