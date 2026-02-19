import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Term {
  id: number
  name: string
  group_code: string
  group_name: string
}

interface VariationImage {
  id: number
  url: string
  order: number
}

interface Variation {
  id: number
  sku: string
  price: number
  regular_price: number
  sale_price: number | null
  stock: number
  in_stock?: boolean
  terms: Term[]
  images?: VariationImage[]
}

interface AttributeGroup {
  id: number
  code: string
  name: string
  terms: Array<{ id: number; name: string }>
}

interface ProductImage {
  id: number
  url: string
  order: number
}

interface Category {
  id: number
  name: string
}

interface ProductDetail {
  id: number
  title: string
  short_description: string
  description: string
  is_variable: boolean
  price_range?: {
    min: number
    max: number
    display: string
  }
  images: ProductImage[]
  categories: Category[]
  attribute_groups: AttributeGroup[]
  variations: Variation[]
}

interface ProductDetailResponse {
  success: boolean
  data?: ProductDetail
  error?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get product ID from query params
    const url = new URL(req.url)
    const productId = url.searchParams.get('id')

    if (!productId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'El parámetro "id" es requerido'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate product ID is a number
    const productIdNum = parseInt(productId, 10)
    if (isNaN(productIdNum)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'El ID del producto debe ser un número válido'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

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
      .rpc('sp_ec_get_product_detail', {
        p_product_id: productIdNum
      })

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Error al obtener el detalle del producto',
          details: error.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if product was found
    if (!data || data.success === false) {
      return new Response(
        JSON.stringify({
          success: false,
          error: data?.error || 'Producto no encontrado'
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Return the product detail
    return new Response(
      JSON.stringify(data),
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