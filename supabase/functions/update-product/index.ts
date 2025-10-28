import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductImage {
  id: string;
  path: string;
  order: number;
  isExisting: boolean;
}

interface ProductPrice {
  price_list_id: number;
  price: number;
  sale_price: number;
}

interface ProductStock {
  warehouse_id: number;
  stock: number;
}

interface ProductAttribute {
  term_id: number;
}

interface ProductVariation {
  id: string;
  attributes: ProductAttribute[];
  prices: ProductPrice[];
  stock: ProductStock[];
  selectedImages: string[];
}

interface UpdateProductRequest {
  productId: number;
  productName: string;
  shortDescription: string;
  description: string;
  isVariable: boolean;
  isActive: boolean;
  isWeb: boolean;
  originalIsVariable: boolean;
  selectedCategories: number[];
  productImages: ProductImage[];
  variations: ProductVariation[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Auth client to validate user
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Validate user authentication
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authenticated:', user.id);

    // Admin client for database operations (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const {
      productId,
      productName,
      shortDescription,
      description,
      isVariable,
      isActive,
      isWeb,
      originalIsVariable,
      selectedCategories,
      productImages,
      variations
    }: UpdateProductRequest = await req.json();

    console.log('Updating product:', productId, productName);

    // 1. Update basic product data
    console.log('Updating product basic data...');
    const { error: productError } = await supabaseAdmin
      .from('products')
      .update({
        title: productName,
        short_description: shortDescription,
        description: description,
        is_variable: isVariable,
        active: isActive,
        web: isWeb
      })
      .eq('id', productId);

    if (productError) {
      console.error('Product update error:', productError);
      throw new Error(`Error al actualizar producto: ${productError.message}`);
    }

    console.log('Product updated successfully');

    // 2. Update categories
    console.log('Deleting old categories...');
    await supabaseAdmin.from('product_categories').delete().eq('product_id', productId);
    
    if (selectedCategories.length > 0) {
      console.log('Inserting new categories...');
      const categoryInserts = selectedCategories.map(categoryId => ({
        product_id: productId,
        category_id: categoryId
      }));

      const { error: categoriesError } = await supabaseAdmin
        .from('product_categories')
        .insert(categoryInserts.map((cat, index) => ({ 
          ...cat, 
          id: Date.now() + index 
        })));

      if (categoriesError) {
        console.error('Categories update error:', categoriesError);
        throw new Error(`Error al actualizar categorías: ${categoriesError.message}`);
      }
      console.log('Categories updated successfully');
    }

    // 3. Handle variable type change - delete all existing variations
    console.log('Fetching old variations...');
    const { data: oldVariations } = await supabaseAdmin
      .from('variations')
      .select('id')
      .eq('product_id', productId);

    if (oldVariations && oldVariations.length > 0) {
      console.log('Deleting old variation data...');
      for (const variation of oldVariations) {
        await supabaseAdmin.from('product_variation_images').delete().eq('product_variation_id', variation.id);
        await supabaseAdmin.from('product_price').delete().eq('product_variation_id', variation.id);
        await supabaseAdmin.from('product_stock').delete().eq('product_variation_id', variation.id);
        await supabaseAdmin.from('variation_terms').delete().eq('product_variation_id', variation.id);
      }
      await supabaseAdmin.from('variations').delete().eq('product_id', productId);
      console.log('Old variations deleted successfully');
    }

    // 4. Update images (delete all and recreate with proper references)
    console.log('Deleting old product images...');
    await supabaseAdmin.from('product_images').delete().eq('product_id', productId);
    
    // Map to track old image IDs to new DB IDs
    const imageIdMap: Record<string, number> = {};
    
    for (let i = 0; i < productImages.length; i++) {
      const image = productImages[i];
      
      // Get public URL from storage path
      let imageUrl: string;
      if (image.isExisting) {
        // For existing images, use the path (which is the preview URL)
        imageUrl = image.path;
      } else {
        // For new images, path is the storage path
        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('products')
          .getPublicUrl(image.path);
        imageUrl = publicUrl;
      }

      const imageId = Date.now() + Math.floor(Math.random() * 1000) + i;
      const { error: imageError } = await supabaseAdmin
        .from('product_images')
        .insert({
          id: imageId,
          product_id: productId,
          image_url: imageUrl,
          image_order: image.order
        });

      if (imageError) {
        console.error('Image record creation error:', imageError);
        throw imageError;
      }
      
      // Map the temp ID to the new DB ID
      imageIdMap[image.id] = imageId;
    }

    console.log('Images updated:', productImages.length);

    // 5. Create new variations
    console.log('Creating new variations...');
    for (const variation of variations) {
      const { data: newVariation, error: variationError } = await supabaseAdmin
        .from('variations')
        .insert({
          product_id: productId,
          sku: null
        })
        .select()
        .single();

      if (variationError) {
        console.error('Variation creation error:', variationError);
        throw variationError;
      }

      console.log('Variation created with ID:', newVariation.id);

      // Generate and update SKU
      const brandCode = '100'; // Default brand code
      const productCode = String(productId).padStart(5, '0');
      const variationCode = String(newVariation.id).padStart(4, '0');
      const sku = `${brandCode}${productCode}${variationCode}`;

      const { error: skuError } = await supabaseAdmin
        .from('variations')
        .update({ sku })
        .eq('id', newVariation.id);

      if (skuError) {
        console.error('SKU update error:', skuError);
        throw skuError;
      }

      console.log('SKU generated:', sku);

      // Insert variation terms
      if (variation.attributes.length > 0) {
        const termsInsert = variation.attributes.map(attr => ({
          product_variation_id: newVariation.id,
          term_id: attr.term_id
        }));

        const { error: termsError } = await supabaseAdmin
          .from('variation_terms')
          .insert(termsInsert);

        if (termsError) {
          console.error('Terms creation error:', termsError);
          throw termsError;
        }
        console.log('Variation terms created');
      }

      // Insert prices
      const priceInserts = variation.prices
        .filter(p => p.price > 0 || p.sale_price > 0)
        .map(price => ({
          product_variation_id: newVariation.id,
          price_list_id: price.price_list_id,
          price: price.price,
          sale_price: price.sale_price
        }));

      if (priceInserts.length > 0) {
        const { error: pricesError } = await supabaseAdmin
          .from('product_price')
          .insert(priceInserts);

        if (pricesError) {
          console.error('Prices creation error:', pricesError);
          throw pricesError;
        }
        console.log('Prices created');
      }

      // Insert stock
      const stockInserts = variation.stock
        .filter(s => s.stock > 0)
        .map(stock => ({
          product_variation_id: newVariation.id,
          warehouse_id: stock.warehouse_id,
          stock: stock.stock
        }));

      if (stockInserts.length > 0) {
        const { error: stockError } = await supabaseAdmin
          .from('product_stock')
          .insert(stockInserts.map((stock, index) => ({ 
            ...stock, 
            id: Date.now() + index + Math.floor(Math.random() * 1000)
          })));

        if (stockError) {
          console.error('Stock creation error:', stockError);
          throw stockError;
        }
        console.log('Stock created');
      }

      // Insert variation images
      if (variation.selectedImages.length > 0) {
        for (const selectedImageId of variation.selectedImages) {
          const dbImageId = imageIdMap[selectedImageId];
          
          if (dbImageId) {
            const { error: variationImageError } = await supabaseAdmin
              .from('product_variation_images')
              .insert({
                id: Date.now() + Math.floor(Math.random() * 1000),
                product_variation_id: newVariation.id,
                product_image_id: dbImageId
              });

            if (variationImageError) {
              console.error('Variation image creation error:', variationImageError);
              throw variationImageError;
            }
          }
        }
        console.log('Variation images created');
      }
    }

    console.log('Product update completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Producto actualizado correctamente'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in update-product function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
