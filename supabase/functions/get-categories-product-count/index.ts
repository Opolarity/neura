import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching categories product count...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all categories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id')
      .neq('id', 0);

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      throw categoriesError;
    }

    // Get product count for each category
    const categoryProductCounts = await Promise.all(
      categories.map(async (category) => {
        console.log(`Counting products for category ${category.id}`);
        
        const { count, error, data } = await supabase
          .from('product_categories')
          .select('*', { count: 'exact' })
          .eq('category_id', category.id);

        if (error) {
          console.error(`Error counting products for category ${category.id}:`, error);
          return { category_id: category.id, product_count: 0 };
        }

        console.log(`Category ${category.id} has ${count} products. Data:`, data);

        return { category_id: category.id, product_count: count || 0 };
      })
    );

    console.log(`Product counts calculated for ${categoryProductCounts.length} categories`);

    return new Response(
      JSON.stringify(categoryProductCounts),
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
