import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Product {
  product_id: number
  name: string
  image_url: string | null
  categories: string | null
  terminos: string | null
  price: number
  stock: number
  estado: boolean
  web: boolean
}

interface ProductListResponse {
  data: Product[]
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url= new URL(req.url);
  const search = url.searchParams.get('search') || null ;
  const category_id = Number(url.searchParams.get ('category_id') ) || null;
  const size = Number(url.searchParams.get ('size') ) || null;
  const sale_price = url.searchParams.get('sale_price') || false;

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Call the stored procedure
    const { data, error } = await supabaseClient
      .rpc('sp_ec_get_product_list',{
         p_search : search,
         p_category_id: category_id,
         p_size: size,
         p_sale_price: sale_price
      })

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Error al obtener los productos',
          details: error.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Return the products
    return new Response(
      JSON.stringify({
        success: true,
        ...data
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Error inesperado en el servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})