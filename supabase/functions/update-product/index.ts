import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============= Type Definitions =============

interface ProductImage {
  id: string;
  path: string;
  order: number;
  isExisting?: boolean;
}

interface VariationAttribute {
  term_group_id: number;
  term_id: number;
}

interface VariationPrice {
  price_list_id: number;
  price?: number;
  sale_price?: number | null;
}

interface VariationStock {
  warehouse_id: number;
  stock: number;
}

interface IncomingVariation {
  id: string;
  attributes: VariationAttribute[];
  prices: VariationPrice[];
  stock: VariationStock[];
  selectedImages: string[];
}

interface ExistingVariation {
  id: number;
  sku: string;
  variation_terms: { term_id: number }[];
}

interface CategoryInsert {
  product_id: number;
  category_id: number;
}

interface UpdatePair {
  existing: ExistingVariation;
  incoming: IncomingVariation;
}

// ============= CORS Headers =============

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

    // Auth client to validate user
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
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
    } = await req.json() as {
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
      variations: IncomingVariation[];
    };

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
      const categoryInserts: CategoryInsert[] = selectedCategories.map((categoryId: number) => ({
        product_id: productId,
        category_id: categoryId
      }));

      const { error: categoriesError } = await supabaseAdmin
        .from('product_categories')
        .insert(categoryInserts);

      if (categoriesError) {
        console.error('Categories update error:', categoriesError);
        throw new Error(`Error al actualizar categorías: ${categoriesError.message}`);
      }
      console.log('Categories updated successfully');
    }

    // 3. Fetch existing variations with their terms
    console.log('Fetching existing variations with terms...');
    const { data: existingVariations } = await supabaseAdmin
      .from('variations')
      .select(`
        id,
        sku,
        variation_terms(term_id)
      `)
      .eq('product_id', productId);

    // 4. Update images (delete all and recreate with proper references)
    
    // First, fetch current images BEFORE deleting to identify which files to remove from storage
    console.log('Fetching current images before deletion...');
    const { data: currentImages } = await supabaseAdmin
      .from('product_images')
      .select('id, image_url')
      .eq('product_id', productId);

    // Identify existing images that should be kept (they have 'existing-' prefix in ID)
    const existingImageIds = productImages
      .filter((img: ProductImage) => img.id.startsWith('existing-'))
      .map((img: ProductImage) => parseInt(img.id.replace('existing-', '')));

    // Identify images to delete from storage (in DB but not in the request as existing)
    const imagesToDeleteFromStorage = (currentImages || []).filter(
      (img: { id: number; image_url: string }) => !existingImageIds.includes(img.id)
    );

    // Delete files from storage (except placeholder/default images)
    for (const img of imagesToDeleteFromStorage) {
      // Extract the relative path from the full URL
      // URL example: https://xxx.supabase.co/storage/v1/object/public/products/products-images/123/file.jpg
      const urlParts = img.image_url.split('/products/');
      if (urlParts[1] && !urlParts[1].includes('default/')) {
        const storagePath = urlParts[1];
        console.log(`Deleting image from storage: ${storagePath}`);
        
        const { error: deleteStorageError } = await supabaseAdmin.storage
          .from('products')
          .remove([storagePath]);
        
        if (deleteStorageError) {
          console.error('Error deleting image from storage:', deleteStorageError);
          // Don't throw - continue with the process even if storage deletion fails
        } else {
          console.log(`Image deleted successfully from storage: ${storagePath}`);
        }
      }
    }

    // Now delete all image records from DB
    console.log('Deleting old product images from database...');
    await supabaseAdmin.from('product_images').delete().eq('product_id', productId);

    // Map to track old image IDs to new DB IDs
    const imageIdMap: Record<string, number> = {};

    for (let i = 0; i < productImages.length; i++) {
      const image = productImages[i];
      
      // Get public URL from storage path
      const rawPath = image.path;
      let imageUrl: string;
      
      if (rawPath && (rawPath.startsWith('http') || image.isExisting)) {
        // If it's already a full URL or marked as existing, use it directly
        imageUrl = rawPath;
      } else {
        // For new images (storage paths from tmp/), move to product folder first
        if (rawPath && rawPath.includes('products-images/tmp/')) {
          const fileName = rawPath.split('/').pop();
          const newPath = `products-images/${productId}/${fileName}`;
          
          console.log(`Moving image from ${rawPath} to ${newPath}`);
          
          const { error: moveError } = await supabaseAdmin.storage
            .from('products')
            .move(rawPath, newPath);
          
          if (moveError) {
            console.error('Error moving image:', moveError);
            // If move fails, try to use the original path
            const { data: { publicUrl } } = supabaseAdmin.storage
              .from('products')
              .getPublicUrl(rawPath);
            imageUrl = publicUrl;
          } else {
            // Get public URL from the new location
            const { data: { publicUrl } } = supabaseAdmin.storage
              .from('products')
              .getPublicUrl(newPath);
            imageUrl = publicUrl;
            console.log(`Image moved successfully. New URL: ${imageUrl}`);
          }
        } else {
          // For other storage paths, just get the public URL
          const { data: { publicUrl } } = supabaseAdmin.storage
            .from('products')
            .getPublicUrl(rawPath);
          imageUrl = publicUrl;
        }
      }

      const { data: insertedImage, error: imageError } = await supabaseAdmin
        .from('product_images')
        .insert({
          product_id: productId,
          image_url: imageUrl,
          image_order: image.order
        })
        .select('id')
        .single();

      if (imageError) {
        console.error('Image record creation error:', imageError);
        throw imageError;
      }

      // Map the temp ID to the new DB ID
      imageIdMap[image.id] = insertedImage.id;
    }

    console.log('Images updated:', productImages.length);

    // 5. Categorize variations: update, create, delete
    console.log('Analyzing variation changes...');

    // Helper function to create a key from term IDs
    const createTermKey = (termIds: number[]): string => {
      return termIds.sort((a: number, b: number) => a - b).join(',');
    };

    // Map existing variations by their term combination
    const existingMap = new Map<string, ExistingVariation>();
    if (existingVariations && existingVariations.length > 0) {
      existingVariations.forEach((v: ExistingVariation) => {
        const termIds = v.variation_terms?.map((t: { term_id: number }) => t.term_id) || [];
        const key = createTermKey(termIds);
        existingMap.set(key, v);
      });
    }

    // Map incoming variations by their term combination
    const incomingMap = new Map<string, IncomingVariation>();
    variations.forEach((v: IncomingVariation) => {
      const termIds = v.attributes.map((a: VariationAttribute) => a.term_id);
      const key = createTermKey(termIds);
      incomingMap.set(key, v);
    });

    // Categorize operations
    const toUpdate: UpdatePair[] = [];
    const toDelete: ExistingVariation[] = [];
    const toCreate: IncomingVariation[] = [];

    // Check existing variations
    existingMap.forEach((existingVar: ExistingVariation, key: string) => {
      if (incomingMap.has(key)) {
        toUpdate.push({
          existing: existingVar,
          incoming: incomingMap.get(key)!
        });
      } else {
        toDelete.push(existingVar);
      }
    });

    // Check for new variations
    incomingMap.forEach((incomingVar: IncomingVariation, key: string) => {
      if (!existingMap.has(key)) {
        toCreate.push(incomingVar);
      }
    });

    console.log(`Variations to update: ${toUpdate.length}`);
    console.log(`Variations to create: ${toCreate.length}`);
    console.log(`Variations to delete: ${toDelete.length}`);

    // 6. Validate deletions - check if any are linked to orders
    if (toDelete.length > 0) {
      const idsToDelete = toDelete.map((v: ExistingVariation) => v.id);

      console.log('Checking if variations to delete are linked to orders...');
      const { data: linkedOrders, error: orderCheckError } = await supabaseAdmin
        .from('order_products')
        .select('product_variation_id')
        .in('product_variation_id', idsToDelete)
        .limit(1);

      if (orderCheckError) {
        console.error('Error checking order links:', orderCheckError);
        throw new Error('Error al verificar vínculos con pedidos');
      }

      if (linkedOrders && linkedOrders.length > 0) {
        throw new Error(
          'No se pueden eliminar variaciones vinculadas a pedidos existentes. ' +
          'Las variaciones que está intentando eliminar están asociadas a uno o más pedidos. ' +
          'Por favor, conserve los términos actuales o agregue nuevos sin eliminar los existentes.'
        );
      }
      console.log('Safe to delete - no order links found');
    }

    // 7. Update existing variations (only prices, stock, and images)
    console.log('Updating existing variations...');
    for (const { existing, incoming } of toUpdate) {
      console.log(`Updating variation ID: ${existing.id}`);

      // Update prices: delete old, insert new
      await supabaseAdmin.from('product_price').delete().eq('product_variation_id', existing.id);

      const priceInserts = incoming.prices
        .filter((p: VariationPrice) =>
          (p.price !== undefined && p.price > 0) ||
          (p.sale_price !== undefined && p.sale_price !== null && p.sale_price > 0)
        )
        .map((price: VariationPrice) => ({
          product_variation_id: existing.id,
          price_list_id: price.price_list_id,
          price: price.price !== undefined ? price.price : 0,
          sale_price: price.sale_price !== undefined && price.sale_price !== null ? price.sale_price : null
        }));

      if (priceInserts.length > 0) {
        const { error: pricesError } = await supabaseAdmin
          .from('product_price')
          .insert(priceInserts);
        if (pricesError) {
          console.error('Error updating prices:', pricesError);
          throw pricesError;
        }
      }

      // Update stock: delete old, insert new
      await supabaseAdmin.from('product_stock').delete().eq('product_variation_id', existing.id);

      const stockInserts = incoming.stock
        .filter((s: VariationStock) => s.stock > 0)
        .map((stock: VariationStock) => ({
          product_variation_id: existing.id,
          warehouse_id: stock.warehouse_id,
          stock: stock.stock,
          stock_type_id: 9 // Default stock type (PRD)
        }));

      if (stockInserts.length > 0) {
        const { error: stockError } = await supabaseAdmin
          .from('product_stock')
          .insert(stockInserts);
        if (stockError) {
          console.error('Error updating stock:', stockError);
          throw stockError;
        }
      }

      // Update variation images: delete old, insert new
      await supabaseAdmin.from('product_variation_images').delete().eq('product_variation_id', existing.id);

      if (incoming.selectedImages.length > 0) {
        for (const selectedImageId of incoming.selectedImages) {
          const dbImageId = imageIdMap[selectedImageId];
          if (dbImageId) {
            await supabaseAdmin.from('product_variation_images').insert({
              product_variation_id: existing.id,
              product_image_id: dbImageId
            });
          }
        }
      }

      console.log(`Variation ${existing.id} updated successfully`);
    }

    // 8. Create new variations
    if (toCreate.length > 0) {
      console.log('Creating new variations...');

      for (const variation of toCreate) {
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

        await supabaseAdmin
          .from('variations')
          .update({ sku })
          .eq('id', newVariation.id);

        console.log('SKU generated:', sku);

        // Insert variation terms
        if (variation.attributes.length > 0) {
          const termsInsert = variation.attributes.map((attr: VariationAttribute) => ({
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
        }

        // Insert prices
        const priceInserts = variation.prices
          .filter((p: VariationPrice) =>
            (p.price !== undefined && p.price > 0) ||
            (p.sale_price !== undefined && p.sale_price !== null && p.sale_price > 0)
          )
          .map((price: VariationPrice) => ({
            product_variation_id: newVariation.id,
            price_list_id: price.price_list_id,
            price: price.price !== undefined ? price.price : 0,
            sale_price: price.sale_price !== undefined && price.sale_price !== null ? price.sale_price : null
          }));

        if (priceInserts.length > 0) {
          await supabaseAdmin.from('product_price').insert(priceInserts);
        }

        // Insert stock
        const stockInserts = variation.stock
          .filter((s: VariationStock) => s.stock > 0)
          .map((stock: VariationStock) => ({
            product_variation_id: newVariation.id,
            warehouse_id: stock.warehouse_id,
            stock: stock.stock,
            stock_type_id: 9 // Default stock type (PRD)
          }));

        if (stockInserts.length > 0) {
          await supabaseAdmin.from('product_stock').insert(stockInserts);
        }

        // Insert variation images
        if (variation.selectedImages.length > 0) {
          for (const selectedImageId of variation.selectedImages) {
            const dbImageId = imageIdMap[selectedImageId];
            if (dbImageId) {
              await supabaseAdmin.from('product_variation_images').insert({
                product_variation_id: newVariation.id,
                product_image_id: dbImageId
              });
            }
          }
        }

        console.log(`New variation ${newVariation.id} created successfully`);
      }
    }

    // 9. Delete safe variations (not linked to orders)
    if (toDelete.length > 0) {
      console.log('Deleting safe variations...');

      for (const variation of toDelete) {
        console.log(`Deleting variation ID: ${variation.id}`);

        // Delete in proper order to avoid FK constraints
        await supabaseAdmin.from('product_variation_images').delete().eq('product_variation_id', variation.id);
        await supabaseAdmin.from('product_price').delete().eq('product_variation_id', variation.id);
        await supabaseAdmin.from('product_stock').delete().eq('product_variation_id', variation.id);
        await supabaseAdmin.from('variation_terms').delete().eq('product_variation_id', variation.id);
        await supabaseAdmin.from('variations').delete().eq('id', variation.id);

        console.log(`Variation ${variation.id} deleted successfully`);
      }
    }

    console.log('Product update completed successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Producto actualizado correctamente' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in update-product function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
