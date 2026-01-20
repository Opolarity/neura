import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const PLACEHOLDER_PATH = 'products-images/default/product-placeholder.jpg';

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
    console.log('Images received:', productImages?.length || 0);

    // Prepare images - use placeholder if no images provided
    let imagesToProcess = productImages || [];
    let usingPlaceholder = false;

    if (imagesToProcess.length === 0) {
      console.log('No images provided, using placeholder');
      usingPlaceholder = true;
      imagesToProcess = [{
        id: 'placeholder',
        path: PLACEHOLDER_PATH,
        order: 0
      }];
    }

    // For now, prepare images with temporary URLs (will be updated after product creation)
    const tempPreparedImages = imagesToProcess.map((image: any) => {
      const { data: { publicUrl } } = supabaseClient.storage
        .from('products')
        .getPublicUrl(image.path);
      
      return {
        id: image.id,
        url: publicUrl,
        order: image.order,
        originalPath: image.path
      };
    });

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

    // Call the transactional RPC to create product first
    const { data, error } = await supabaseClient.rpc('sp_create_product', {
      p_title: productName,
      p_short_description: shortDescription || '',
      p_description: description || '',
      p_is_variable: isVariable,
      p_active: isActive,
      p_web: isWeb,
      p_categories: selectedCategories,
      p_images: tempPreparedImages.map((img: any) => ({
        id: img.id,
        url: img.url,
        order: img.order
      })),
      p_variations: preparedVariations
    });

    if (error) {
      console.error('RPC error:', error);
      throw error;
    }

    const productId = data.product_id;
    console.log('Product created with ID:', productId);

    // Now move images from tmp to the product folder (only if not using placeholder)
    if (!usingPlaceholder && productImages && productImages.length > 0) {
      console.log('Moving images to product folder...');
      
      const movedImages: { oldPath: string; newPath: string; newUrl: string }[] = [];
      
      for (const image of productImages) {
        const oldPath = image.path;
        // Only move if it's in the tmp folder
        if (oldPath.startsWith('products-images/tmp/')) {
          const fileName = oldPath.split('/').pop();
          const newPath = `products-images/${productId}/${fileName}`;
          
          console.log(`Moving: ${oldPath} -> ${newPath}`);
          
          const { error: moveError } = await supabaseClient.storage
            .from('products')
            .move(oldPath, newPath);
          
          if (moveError) {
            console.error('Error moving image:', moveError);
            // Continue with other images even if one fails
          } else {
            const { data: { publicUrl } } = supabaseClient.storage
              .from('products')
              .getPublicUrl(newPath);
            
            movedImages.push({
              oldPath,
              newPath,
              newUrl: publicUrl
            });
          }
        }
      }

      // Update image URLs in the database if we moved any
      if (movedImages.length > 0) {
        console.log('Updating image URLs in database...');
        
        for (const movedImage of movedImages) {
          // Get the old URL to find the record
          const { data: { publicUrl: oldUrl } } = supabaseClient.storage
            .from('products')
            .getPublicUrl(movedImage.oldPath);
          
          // Update the product_images table
          const { error: updateError } = await supabaseClient
            .from('product_images')
            .update({ image_url: movedImage.newUrl })
            .eq('product_id', productId)
            .eq('image_url', oldUrl);
          
          if (updateError) {
            console.error('Error updating image URL:', updateError);
          }
        }
      }
    }

    console.log('Product created successfully:', productId);

    return new Response(JSON.stringify({
      success: true,
      product: { id: productId },
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
