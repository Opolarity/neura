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

interface CreateProductRequest {
  productName: string;
  shortDescription: string;
  description: string;
  isVariable: boolean;
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
      productName,
      shortDescription,
      description,
      isVariable,
      selectedCategories,
      productImages,
      variations
    }: CreateProductRequest = await req.json();

    console.log('Creating product:', productName);

    // 1. Create product
    const { data: product, error: productError } = await supabaseClient
      .from('products')
      .insert({
        title: productName,
        short_description: shortDescription,
        description: description,
        is_variable: isVariable
      })
      .select()
      .single();

    if (productError) {
      console.error('Product creation error:', productError);
      throw productError;
    }

    console.log('Product created with ID:', product.id);

    // 2. Create product categories
    if (selectedCategories.length > 0) {
      const categoryInserts = selectedCategories.map(categoryId => ({
        product_id: product.id,
        category_id: categoryId
      }));

      const { error: categoriesError } = await supabaseClient
        .from('product_categories')
        .insert(categoryInserts.map((cat, index) => ({ 
          ...cat, 
          id: Date.now() + index 
        })));

      if (categoriesError) {
        console.error('Categories creation error:', categoriesError);
        throw categoriesError;
      }
      console.log('Categories created');
    }

    // 3. Create product_images records (images already uploaded to storage)
    const imageMapping: { id: string; dbId: number; path: string }[] = [];
    
    for (let i = 0; i < productImages.length; i++) {
      const image = productImages[i];
      
      // Get public URL from storage path
      const { data: { publicUrl } } = supabaseClient.storage
        .from('products')
        .getPublicUrl(image.path);

      const imageId = Date.now() + Math.floor(Math.random() * 1000) + i;
      const { error: imageError } = await supabaseClient
        .from('product_images')
        .insert({
          id: imageId,
          product_id: product.id,
          image_url: publicUrl,
          image_order: image.order
        });

      if (imageError) {
        console.error('Image record creation error:', imageError);
        throw imageError;
      }

      imageMapping.push({ 
        id: image.id, 
        dbId: imageId,
        path: image.path 
      });
    }

    console.log('Image records created:', imageMapping.length);

    // 4. Create variations
    for (const variation of variations) {
      // Create variation record
      const { data: variationRecord, error: variationError } = await supabaseClient
        .from('variations')
        .insert({
          product_id: product.id
        })
        .select()
        .single();

      if (variationError) {
        console.error('Variation creation error:', variationError);
        throw variationError;
      }

      console.log('Variation created with ID:', variationRecord.id);

      // Create variation terms
      if (variation.attributes.length > 0) {
        const termInserts = variation.attributes.map(attr => ({
          product_variation_id: variationRecord.id,
          term_id: attr.term_id
        }));

        const { error: termsError } = await supabaseClient
          .from('variation_terms')
          .insert(termInserts);

        if (termsError) {
          console.error('Terms creation error:', termsError);
          throw termsError;
        }
        console.log('Variation terms created');
      }

      // Create prices
      const priceInserts = variation.prices
        .filter(p => p.price > 0 || p.sale_price > 0)
        .map(price => ({
          product_variation_id: variationRecord.id,
          proce_list_id: price.price_list_id, // Note: keeping original typo from schema
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

      // Create stock
      const stockInserts = variation.stock
        .filter(s => s.stock > 0)
        .map(stock => ({
          product_variation_id: variationRecord.id,
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

      // Create variation images (only for variable products)
      if (isVariable && variation.selectedImages.length > 0) {
        for (const imageId of variation.selectedImages) {
          const imageMap = imageMapping.find(img => img.id === imageId);
          if (imageMap) {
            const { error: variationImageError } = await supabaseClient
              .from('product_variation_images')
              .insert({
                id: Date.now() + Math.floor(Math.random() * 1000),
                product_variation_id: variationRecord.id,
                product_image_id: imageMap.dbId
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

    console.log('Product creation completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        product: product,
        message: 'Producto creado correctamente'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in create-product function:', error);
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