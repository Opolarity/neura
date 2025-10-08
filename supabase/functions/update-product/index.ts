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

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      productId,
      productName,
      shortDescription,
      description,
      isVariable,
      originalIsVariable,
      selectedCategories,
      productImages,
      variations
    }: UpdateProductRequest = await req.json();

    console.log('Updating product:', productId, productName);

    // 1. Update basic product data
    const { error: productError } = await supabaseClient
      .from('products')
      .update({
        title: productName,
        short_description: shortDescription,
        description: description,
        is_variable: isVariable
      })
      .eq('id', productId);

    if (productError) {
      console.error('Product update error:', productError);
      throw productError;
    }

    console.log('Product updated');

    // 2. Update categories
    await supabaseClient.from('product_categories').delete().eq('product_id', productId);
    
    if (selectedCategories.length > 0) {
      const categoryInserts = selectedCategories.map(categoryId => ({
        product_id: productId,
        category_id: categoryId
      }));

      const { error: categoriesError } = await supabaseClient
        .from('product_categories')
        .insert(categoryInserts.map((cat, index) => ({ 
          ...cat, 
          id: Date.now() + index 
        })));

      if (categoriesError) {
        console.error('Categories update error:', categoriesError);
        throw categoriesError;
      }
      console.log('Categories updated');
    }

    // 3. Handle variable type change - delete all existing variations
    const { data: oldVariations } = await supabaseClient
      .from('variations')
      .select('id')
      .eq('product_id', productId);

    if (oldVariations && oldVariations.length > 0) {
      for (const variation of oldVariations) {
        await supabaseClient.from('product_variation_images').delete().eq('product_variation_id', variation.id);
        await supabaseClient.from('product_price').delete().eq('product_variation_id', variation.id);
        await supabaseClient.from('product_stock').delete().eq('product_variation_id', variation.id);
        await supabaseClient.from('variation_terms').delete().eq('product_variation_id', variation.id);
      }
      await supabaseClient.from('variations').delete().eq('product_id', productId);
      console.log('Old variations deleted');
    }

    // 4. Update images (delete all and recreate with proper references)
    await supabaseClient.from('product_images').delete().eq('product_id', productId);
    
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
        const { data: { publicUrl } } = supabaseClient.storage
          .from('products')
          .getPublicUrl(image.path);
        imageUrl = publicUrl;
      }

      const imageId = Date.now() + Math.floor(Math.random() * 1000) + i;
      const { error: imageError } = await supabaseClient
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
    for (const variation of variations) {
      const { data: newVariation, error: variationError } = await supabaseClient
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

      // Insert variation terms
      if (variation.attributes.length > 0) {
        const termsInsert = variation.attributes.map(attr => ({
          product_variation_id: newVariation.id,
          term_id: attr.term_id
        }));

        const { error: termsError } = await supabaseClient
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
          proce_list_id: price.price_list_id,
          price: price.price,
          sale_price: price.sale_price
        }));

      if (priceInserts.length > 0) {
        const { error: pricesError } = await supabaseClient
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
        const { error: stockError } = await supabaseClient
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
            const { error: variationImageError } = await supabaseClient
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
