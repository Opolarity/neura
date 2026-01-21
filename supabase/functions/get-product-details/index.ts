import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } }
      }
    );

    const { productId } = await req.json();

    if (!productId) {
      throw new Error('Product ID is required');
    }

    console.log('Fetching product details for ID:', productId);

    // Fetch product basic data
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, title, short_description, description, is_variable, active, web')
      .eq('id', productId)
      .single();

    if (productError) throw productError;
    if (!product) throw new Error('Product not found');

    // Fetch related data in parallel
    const [categoriesResult, imagesResult, variationsResult] = await Promise.all([
      supabase
        .from('product_categories')
        .select('category_id')
        .eq('product_id', productId),
      supabase
        .from('product_images')
        .select('id, image_url, image_order')
        .eq('product_id', productId)
        .order('image_order'),
      supabase
        .from('variations')
        .select(`
          id,
          sku,
          variation_terms(term_id),
          product_price(price_list_id, price, sale_price),
          product_stock(warehouse_id, stock, stock_type_id),
          product_variation_images(product_image_id)
        `)
        .eq('product_id', productId)
    ]);

    if (categoriesResult.error) throw categoriesResult.error;
    if (imagesResult.error) throw imagesResult.error;
    if (variationsResult.error) throw variationsResult.error;

    // Format response
    const response = {
      product: {
        id: product.id,
        title: product.title,
        short_description: product.short_description,
        description: product.description,
        is_variable: product.is_variable,
        active: product.active,
        web: product.web
      },
      categories: (categoriesResult.data || []).map((c: any) => c.category_id),
      images: (imagesResult.data || []).map((img: any) => ({
        id: img.id,
        image_url: img.image_url,
        image_order: img.image_order
      })),
      variations: (variationsResult.data || []).map((v: any) => ({
        id: v.id,
        sku: v.sku,
        terms: (v.variation_terms || []).map((t: any) => t.term_id),
        prices: (v.product_price || []).map((p: any) => ({
          price_list_id: p.price_list_id,
          price: p.price,
          sale_price: p.sale_price
        })),
        stock: (v.product_stock || []).map((s: any) => ({
          warehouse_id: s.warehouse_id,
          stock: s.stock,
          stock_type_id: s.stock_type_id
        })),
        images: (v.product_variation_images || []).map((i: any) => i.product_image_id)
      }))
    };

    console.log('Product details fetched successfully');

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in get-product-details:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
