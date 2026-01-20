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

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } }
      }
    );

    const { 
      productName, 
      shortDescription, 
      description, 
      isVariable, 
      isActive, 
      isWeb, 
      selectedCategories, 
      productImages, 
      variations 
    } = await req.json();

    console.log('Creating product via RPC:', productName);

    // Prepare images with public URLs
    const preparedImages = [];
    for (const image of productImages) {
      const { data: { publicUrl } } = supabaseClient.storage
        .from('products')
        .getPublicUrl(image.path);
      
      preparedImages.push({
        id: image.id,
        url: publicUrl,
        order: image.order
      });
    }

    // Prepare variations (sanitize data)
    const preparedVariations = variations.map((v: any) => ({
      id: v.id,
      attributes: v.attributes || [],
      prices: (v.prices || []).map((p: any) => ({
        price_list_id: p.price_list_id,
        price: Number(p.price) || 0,
        sale_price: p.sale_price !== null && p.sale_price !== undefined ? Number(p.sale_price) : null
      })),
      stock: (v.stock || []).map((s: any) => ({
        warehouse_id: s.warehouse_id,
        stock: Number(s.stock) || 0
      })),
      selectedImages: v.selectedImages || []
    }));

    // Call the transactional RPC
    const { data, error } = await supabaseClient.rpc('sp_create_product', {
      p_title: productName,
      p_short_description: shortDescription || '',
      p_description: description || '',
      p_is_variable: isVariable,
      p_active: isActive,
      p_web: isWeb,
      p_categories: selectedCategories,
      p_images: preparedImages,
      p_variations: preparedVariations
    });

    if (error) {
      console.error('RPC error:', error);
      throw error;
    }

    console.log('Product created successfully:', data);

    return new Response(JSON.stringify({
      success: true,
      product: { id: data.product_id },
      message: 'Producto creado correctamente'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in create-product function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
