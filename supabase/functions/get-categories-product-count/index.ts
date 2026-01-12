import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CategoriesParams {
  search?: string;
  page?: number;
  size?: number;
  order?: string;
  parentCategory?: boolean | null;
  hasDescription?: boolean | null;
  hasImage?: boolean | null;
  minProducts?: number;
  maxProducts?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching categories with stored procedure...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get parameters from request body
    let params: CategoriesParams = {};
    
    if (req.method === 'POST') {
      try {
        params = await req.json();
      } catch {
        // If no body, use defaults
      }
    }

    console.log('Request params:', params);

    // Call the stored procedure
    const { data, error } = await supabase.rpc('sp_get_categories_product_count', {
      p_search: params.search || null,
      p_page: params.page || 1,
      p_size: params.size || 20,
      p_order: params.order || null,
      p_parentcategory: params.parentCategory ?? null,
      p_description: params.hasDescription ?? null,
      p_image: params.hasImage ?? null,
      p_min_products: params.minProducts || 0,
      p_max_products: params.maxProducts || 0,
    });

    if (error) {
      console.error('Error calling stored procedure:', error);
      throw error;
    }

    console.log(`Categories fetched successfully. Total: ${data?.page?.total || 0}`);

    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in get-categories-product-count function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
