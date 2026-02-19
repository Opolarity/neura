import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { categoryId, confirmed } = await req.json();

    if (!categoryId) {
      return new Response(
        JSON.stringify({ error: 'Category ID is required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    console.log('Deleting category:', categoryId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: children, error: childrenError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('parent_category', categoryId);

    if (childrenError) {
      console.error('Error checking children:', childrenError);
      throw childrenError;
    }



    const allCategoryIds = await getAllDescendantIds(supabase, categoryId);
    console.log('Total categories and descendants to process:', allCategoryIds);


    const { error: deletePCError } = await supabase
      .from('product_categories')
      .delete()
      .in('category_id', allCategoryIds);

    if (deletePCError) {
      console.error('Error deleting product_categories:', deletePCError);
      throw deletePCError;
    }

    console.log('Deleted product_categories records for all affected IDs');


    const { error: deleteCategoryError } = await supabase
      .from('categories')
      .delete()
      .in('id', allCategoryIds);

    if (deleteCategoryError) {
      console.error('Error deleting category hierarchy:', deleteCategoryError);
      throw deleteCategoryError;
    }

    console.log('Category hierarchy deleted successfully');

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in delete-category function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

async function getAllDescendantIds(supabase: any, parentId: string): Promise<string[]> {
  const { data: children, error } = await supabase
    .from('categories')
    .select('id')
    .eq('parent_category', parentId);

  if (error) {
    console.error(`Error fetching descendants for ${parentId}:`, error);
    return [parentId];
  }

  let ids = [parentId];
  if (children && children.length > 0) {
    for (const child of children) {
      const childIds = await getAllDescendantIds(supabase, child.id);
      ids = [...ids, ...childIds];
    }
  }
  return ids;
}