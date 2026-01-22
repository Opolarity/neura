import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all dropdown data in parallel
    const [
      documentTypesRes,
      saleTypesRes,
      priceListsRes,
      shippingMethodsRes,
      countriesRes,
      statesRes,
      citiesRes,
      neighborhoodsRes,
      paymentMethodsRes,
      situationsRes,
      productsRes,
    ] = await Promise.all([
      supabase.from("document_types").select("id, name, code").order("name"),
      supabase.from("sale_types").select("id, name").order("name"),
      supabase.from("price_list").select("id, code, name").order("name"),
      supabase.from("shipping_methods").select("id, name").order("name"),
      supabase.from("countries").select("id, name").order("name"),
      supabase.from("states").select("id, name, country_id").order("name"),
      supabase.from("cities").select("id, name, state_id, country_id").order("name"),
      supabase.from("neighborhoods").select("id, name, city_id, state_id, country_id").order("name"),
      supabase.from("payment_methods").select("id, name").eq("active", true).order("name"),
      supabase.from("situations").select("id, name").eq("module_id", 1).order("order"), // Module 1 = Sales
      // Fetch only active products with active variations
      supabase
        .from("products")
        .select(`
          id,
          title,
          variations!inner (
            id,
            sku,
            product_id,
            is_active,
            variation_terms (
              term_id,
              terms (
                id,
                name
              )
            ),
            product_price (
              price_list_id,
              price,
              sale_price
            )
          )
        `)
        .eq("is_active", true)
        .eq("active", true)
        .eq("variations.is_active", true),
    ]);

    // Check for errors
    const errors = [
      documentTypesRes.error,
      saleTypesRes.error,
      priceListsRes.error,
      shippingMethodsRes.error,
      countriesRes.error,
      statesRes.error,
      citiesRes.error,
      neighborhoodsRes.error,
      paymentMethodsRes.error,
      situationsRes.error,
      productsRes.error,
    ].filter(Boolean);

    if (errors.length > 0) {
      console.error("Database errors:", errors);
      return new Response(
        JSON.stringify({ error: "Error fetching data", details: errors }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Transform products to include terms properly
    const products = (productsRes.data || []).map((product: any) => ({
      id: product.id,
      title: product.title,
      variations: (product.variations || []).map((variation: any) => ({
        id: variation.id,
        sku: variation.sku,
        product_id: variation.product_id,
        terms: (variation.variation_terms || []).map((vt: any) => ({
          id: vt.terms?.id,
          name: vt.terms?.name,
        })),
        prices: (variation.product_price || []).map((p: any) => ({
          price_list_id: p.price_list_id,
          price: p.price,
          sale_price: p.sale_price,
        })),
      })),
    }));

    const response = {
      documentTypes: documentTypesRes.data || [],
      saleTypes: saleTypesRes.data || [],
      priceLists: priceListsRes.data || [],
      shippingMethods: shippingMethodsRes.data || [],
      countries: countriesRes.data || [],
      states: statesRes.data || [],
      cities: citiesRes.data || [],
      neighborhoods: neighborhoodsRes.data || [],
      paymentMethods: paymentMethodsRes.data || [],
      situations: situationsRes.data || [],
      products,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
