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

    // Auth client to validate user
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } }
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
      const { data: { publicUrl } } = supabaseAdmin.storage
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

    // Call the transactional RPC to create product first (using admin client)
    const { data, error } = await supabaseAdmin.rpc('sp_create_product', {
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

    // Now move images from tmp to the product folder with proper naming (only if not using placeholder)
    if (!usingPlaceholder && productImages && productImages.length > 0) {
      console.log('Moving images to product folder with proper naming...');
      
      // First, get the inserted product_images IDs by order
      const { data: insertedImages } = await supabaseAdmin
        .from('product_images')
        .select('id, image_order')
        .eq('product_id', productId)
        .order('image_order', { ascending: true });
      
      if (insertedImages && insertedImages.length > 0) {
        for (const image of productImages) {
          const oldPath = image.path;
          // Only move if it's in the tmp folder
          if (oldPath.startsWith('products-images/tmp/')) {
            // Find the corresponding DB image ID by order
            const dbImage = insertedImages.find(img => img.image_order === image.order);
            if (!dbImage) {
              console.error(`No DB image found for order ${image.order}`);
              continue;
            }
            
            // Get file extension from original path
            const originalFileName = oldPath.split('/').pop() || '';
            const extension = originalFileName.includes('.') 
              ? originalFileName.substring(originalFileName.lastIndexOf('.')) 
              : '.jpg';
            
            // New file name format: {product_image_id}-{product_id}.{extension}
            const newFileName = `${dbImage.id}-${productId}${extension}`;
            const newPath = `products-images/${productId}/${newFileName}`;
            
            console.log(`Moving: ${oldPath} -> ${newPath}`);
            
            // Use admin client for storage operations
            const { error: moveError } = await supabaseAdmin.storage
              .from('products')
              .move(oldPath, newPath);
            
            if (moveError) {
              console.error('Error moving image:', moveError);
              // Continue with other images even if one fails
            } else {
              const { data: { publicUrl } } = supabaseAdmin.storage
                .from('products')
                .getPublicUrl(newPath);
              
              // Update the image URL in the database
              const { error: updateError } = await supabaseAdmin
                .from('product_images')
                .update({ image_url: publicUrl })
                .eq('id', dbImage.id);
              
              if (updateError) {
                console.error('Error updating image URL:', updateError);
              } else {
                console.log(`Image ${dbImage.id} moved successfully. New URL: ${publicUrl}`);
              }
            }
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
