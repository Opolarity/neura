import { supabase } from '@/integrations/supabase/client';
import type {
  ProductFormDataResponse, 
  ProductDetailsResponse,
  CreateProductRequest,
  UpdateProductRequest 
} from '../types/AddProduct.types';
import { invokeFunction } from "@/integrations/supabase/invokeFunction";

export const AddProductService = {
  /**
   * Obtiene los datos necesarios para el formulario de producto
   * (categorías, términos, listas de precios, almacenes)
   */
  async getFormData(): Promise<ProductFormDataResponse> {
    const data = await invokeFunction('get-product-form-data');
    return data;
  },

  /**
   * Obtiene los detalles de un producto para edición
   */
  async getProductDetails(productId: number): Promise<ProductDetailsResponse> {
    const data = await invokeFunction('get-product-details', {
      body: { productId }
    });
    return data;
  },

  /**
   * Valida si se puede cambiar el tipo de producto (variable/simple)
   */
  async validateTypeChange(productId: number, newIsVariable: boolean): Promise<{ canChange: boolean; reason?: string }> {
    const data = await invokeFunction('validate-product-type-change', {
      body: { productId, newIsVariable }
    });
    return data;
  },

  /**
   * Crea un nuevo producto
   */
  async createProduct(productData: CreateProductRequest): Promise<{ success: boolean; product?: any; error?: string; message?: string }> {
    const data = await invokeFunction('create-product', {
      body: productData
    });

    return data;
  },

  /**
   * Actualiza un producto existente
   */
  async updateProduct(productData: UpdateProductRequest): Promise<{ success: boolean; error?: string; message?: string }> {
    const data = await invokeFunction('update-product', {
      body: productData
    });

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
  },

  // TODO: evaluar migrar SizeImagesModal (módulo ecommerce) a estos helpers,
  // hoy replica el mismo patrón de subida a products-images/sizes y sizes-ref.

  /**
   * Sube una imagen única de tallas o de referencia de tallas y devuelve su path y URL pública
   */
  async uploadSizeImage(file: File, folder: 'sizes' | 'sizes-ref'): Promise<{ path: string; url: string }> {
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const path = `products-images/${folder}/${crypto.randomUUID()}.${fileExtension}`;

    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(path, file, {
        upsert: true,
        contentType: file.type
      });

    if (uploadError) throw uploadError;
    return { path, url: this.getPublicUrl(path) };
  },

  /**
   * Deriva el path dentro del bucket 'products' a partir de una URL pública
   */
  getStoragePathFromUrl(publicUrl: string): string | null {
    const marker = '/products/';
    const index = publicUrl.indexOf(marker);
    if (index === -1) return null;
    return publicUrl.substring(index + marker.length);
  },

  /**
   * Elimina del storage una imagen a partir de su URL pública
   */
  async deleteImageByUrl(publicUrl: string): Promise<void> {
    const path = this.getStoragePathFromUrl(publicUrl);
    if (!path) return;
    await this.deleteImage(path);
  }
};
