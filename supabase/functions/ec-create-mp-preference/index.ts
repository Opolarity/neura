import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type , x-channel-code',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const channel = req.headers.get('x-channel-code');


    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        )

        const { data: channelInfo, error: channelError } = await supabase
            .from('channels')
            .select('*')
            .eq('code', channel)
            .single();

        if (channelError || !channelInfo) {
            throw new Error('Código de canal inválido');
        }

        const { orderId, email, total, cartProducts } = await req.json()

        const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')
        const FRONTEND_URL = Deno.env.get('FRONTEND_URL')

        const items = cartProducts.map((p: any) => ({
            id: p.variation_id,
            title: `Producto: ${p.product_name}`,
            unit_price: Number(p.price),
            quantity: Number(p.quantity),
            currency_id: 'PEN'
        }))

        const preferenceBody = {
            items,
            payer: { email },
            external_reference: orderId.toString(),
            notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/ec-mp-webhook`,
            back_urls: {
                success: `${FRONTEND_URL}/checkout/success?orderId=${orderId}`,
                failure: `${FRONTEND_URL}/checkout/failure?orderId=${orderId}`,
                pending: `${FRONTEND_URL}/checkout/pending?orderId=${orderId}`,
            },
            auto_return: 'approved',
        }

        const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(preferenceBody),
        })

        const preference = await response.json()

        if (!response.ok) {
            throw new Error(preference.message || 'Error al crear la preferencia')
        }

        return new Response(
            JSON.stringify({ init_point: preference.init_point }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})