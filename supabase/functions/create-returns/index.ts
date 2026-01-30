import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) throw new Error('Invalid token');

    const created_by = user.id;
    console.log('Authenticated user:', created_by);

    const {
      orderID,
      documentTypeID,
      customerDocumentNumber,
      moduleID,
      statusID,
      situationID,
      returnTypeID,
      returnID,
      variationID,
      quantity,
      productAmount,
      warehouseID,
      output,
      stockTypeID,
      vinculatedProductID
    } = await req.json();


    const { data: newReturn, error: returnError } = await supabase
      .from('returns')
      .insert({
        order_id: orderID,
        customer_document_type_id: documentTypeID,
        customer_document_number: customerDocumentNumber,
        module_id: moduleID,
        status_id: statusID,
        situation_id: situationID,
        return_type_id: returnTypeID,
        created_by: created_by,
        return_id: returnID
      })
      .select('id')
      .single();

    if (returnError) throw returnError;

    const { data: movements_type, error: movementtypeerror } = await supabase
      .from('types')
      .select('id, modules!inner(code)')
      .eq('code', 'RTU')
      .eq('modules.code', 'STM')
      .single();

    if (movementtypeerror) throw movementtypeerror;

    const { data: stockMovement, error: stockError } = await supabase
      .from('stock_movements')
      .insert({
        product_variation_id: variationID,
        quantity: quantity,
        created_by: created_by,
        movement_type: movements_type.id,
        warehouse_id: warehouseID,
        completed: false,
        stock_type_id: stockTypeID,
        vinculated_movement_id: null,
        is_active: true
      })
      .select('id')
      .single();

    if (stockError) throw stockError;

    const { data: returnProduct, error: prodError } = await supabase
      .from('returns_products')
      .insert({
        return_id: newReturn.id,
        product_variation_id: variationID,
        quantity: quantity,
        product_amount: productAmount,
        output: output,
        stock_movement_id: stockMovement.id,
        vinculated_return_product_id: vinculatedProductID
      })
      .select()
      .single();
    if (prodError) throw prodError;

    if (returnProduct.vinculated_return_product_id !== null) {
      const { data: returnProducts } = await supabase
        .from('returns_products')
        .select('product_amount, output')
        .eq('return_id', newReturn.id);

      const totalRefund = returnProducts
        .filter((p) => p.output === false)
        .reduce((sum, p) => sum + (p.product_amount || 0), 0);

      const totalExchange = returnProducts
        .filter((p) => p.output === true)
        .reduce((sum, p) => sum + (p.product_amount || 0), 0);

      const difference = totalRefund - totalExchange;

      await supabase
        .from('returns')
        .update({
          total_refund_amount: totalRefund,
          total_exchange_difference: difference
        })
        .select('returns_products(return_id)')
        .eq('returns_products.return_id', newReturn.id);
    }


    const { error: sitError } = await supabase
      .from('return_situations')
      .insert({
        return_id: newReturn.id,
        module_id: moduleID,
        status_id: statusID,
        situation_id: situationID,
        last_row: true,
        created_by: created_by
      });

    if (sitError) throw sitError;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Retorno y producto procesados',
        data: {
          return_id: newReturn.id,
          product_entry_id: returnProduct.id
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});