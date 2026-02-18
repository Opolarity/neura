import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============= Types =============

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
  stock_type_id?: number;
}

interface IncomingVariation {
  id: string;
  attributes: VariationAttribute[];
  prices: VariationPrice[];
  stock: VariationStock[];
  selectedImages: string[];
}

interface RequestBody {
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
  resetVariations?: boolean;
}

// ============= CORS =============

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============= Handler =============

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "No autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User authenticated:", user.id);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json() as RequestBody;
    const {
      productId,
      productName,
      shortDescription,
      description,
      isVariable,
      isActive,
      isWeb,
      selectedCategories,
      productImages,
      variations,
      resetVariations = false,
    } = body;

    console.log("Calling SP sp_update_product for product:", productId);

    // ── Llamar al Stored Procedure ────────────────────────────
    const { data: spResult, error: spError } = await supabaseAdmin.rpc("sp_update_product", {
      p_product_id: productId,
      p_product_name: productName,
      p_short_description: shortDescription,
      p_description: description,
      p_is_variable: isVariable,
      p_is_active: isActive,
      p_is_web: isWeb,
      p_selected_categories: selectedCategories,
      p_product_images: productImages,
      p_variations: variations,
      p_reset_variations: resetVariations,
      p_user_id: user.id,
    });

    if (spError) {
      console.error("SP error:", spError);
      throw new Error(spError.message);
    }

    console.log("SP executed successfully");


    const imageIdMap: Record<string, number> = spResult?.o_image_id_map ?? {};
    const imagesToDelete: string[] = spResult?.o_images_to_delete ?? [];

    for (const imageUrl of imagesToDelete) {
      const urlParts = imageUrl.split("/products/");
      if (urlParts[1] && !urlParts[1].includes("default/")) {
        const storagePath = urlParts[1];
        console.log("Deleting from storage:", storagePath);
        const { error: delErr } = await supabaseAdmin.storage
          .from("products")
          .remove([storagePath]);
        if (delErr) console.error("Storage delete error:", delErr);
      }
    }


    for (const image of productImages) {
      const rawPath = image.path;
      const isTmp = rawPath && rawPath.includes("products-images/tmp/");
      if (!isTmp) continue;

      const dbImageId = imageIdMap[image.id];
      if (!dbImageId) continue;

      const originalFileName = rawPath.split("/").pop() ?? "";
      const extension = originalFileName.includes(".")
        ? originalFileName.substring(originalFileName.lastIndexOf("."))
        : ".jpg";

      const newFileName = `${dbImageId}-${productId}${extension}`;
      const newPath = `products-images/${productId}/${newFileName}`;

      console.log(`Moving image ${rawPath} → ${newPath}`);

      const { error: moveError } = await supabaseAdmin.storage
        .from("products")
        .move(rawPath, newPath);

      if (moveError) {
        console.error("Error moving image:", moveError);
        continue; // Mantener URL original si falla el movimiento
      }

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from("products")
        .getPublicUrl(newPath);

      const { error: updateErr } = await supabaseAdmin
        .from("product_images")
        .update({ image_url: publicUrl })
        .eq("id", dbImageId);

      if (updateErr) {
        console.error("Error updating image URL:", updateErr);
      } else {
        console.log(`Image ${dbImageId} URL updated: ${publicUrl}`);
      }
    }


    return new Response(
      JSON.stringify({ success: true, message: "Producto actualizado correctamente" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in update-product function:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});