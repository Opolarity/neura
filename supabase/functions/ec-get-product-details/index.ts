import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-channel-code',
}

const LEVELS = [
  { min: 150,  max: 749.99,   discount: 0.05 },
  { min: 750,  max: 1499.99,  discount: 0.10 },
  { min: 1500, max: 2999.99,  discount: 0.15 },
  { min: 3000, max: Infinity, discount: 0.30 },
];

function getUserIdFromRequest(req: Request): string | null {
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const payload = JSON.parse(atob(auth.slice(7).split('.')[1]));
    if (!payload.sub || payload.role === 'anon' || payload.role === 'service_role') return null;
    return payload.sub;
  } catch {
    return null;
  }
}

async function getLevelDiscount(supabaseClient: any, userId: string | null): Promise<number> {
  if (!userId) return 0;
  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('accounts ( customer_profile ( points ) )')
    .eq('UID', userId)
    .maybeSingle();
  const accounts = profile?.accounts as any;
  const accountsObj = Array.isArray(accounts) ? accounts[0] : accounts;
  const customerProfile = accountsObj?.customer_profile;
  const cp = Array.isArray(customerProfile) ? customerProfile[0] : customerProfile;
  const points = cp?.points ?? 0;
  return LEVELS.find(l => points >= l.min && points <= l.max)?.discount ?? 0;
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

  const channel = req.headers.get('x-channel-code');

  try {
    // Get product ID from query params
    const url = new URL(req.url)
    const productId = url.searchParams.get('id')
    const userId = getUserIdFromRequest(req)

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

    // Validate channel code
    const channelInfo = await supabaseClient.from('channels').select('*').eq('code', channel).single();
    if (channelInfo.error || !channelInfo.data) {
      console.error('Channel validation error:', channelInfo.error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Código de canal inválido',
        details: channelInfo.error ? channelInfo.error.message : 'No channel found'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Call the stored procedure
    const { data, error } = await supabaseClient
      .rpc('sp_ec_get_product_detail', {
        p_product_id: productIdNum,
        p_price_list_id: channelInfo.data?.price_list_id,
        p_branch_id: channelInfo.data?.branch_id,
        p_warehouse_id: channelInfo.data?.warehouse_id,
        p_stock_type_id: channelInfo.data?.stock_type_id,
        p_sale_type_id: channelInfo.data?.sale_type_id,
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

    // Aplicar descuento de nivel si aplica
    const levelDiscount = await getLevelDiscount(supabaseClient, userId);
    if (levelDiscount > 0 && data?.data?.variations) {
      data.data.variations = data.data.variations.map((v: any) => ({
        ...v,
        price: Number((v.price * (1 - levelDiscount)).toFixed(2)),
      }));
      if (data.data.price_range) {
        data.data.price_range.min = Number((data.data.price_range.min * (1 - levelDiscount)).toFixed(2));
        data.data.price_range.max = Number((data.data.price_range.max * (1 - levelDiscount)).toFixed(2));
      }
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