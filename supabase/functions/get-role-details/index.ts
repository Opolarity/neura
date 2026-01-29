import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } }
      }
    );

    const { roleId } = await req.json();

    if (!roleId) {
      throw new Error('Role ID is required');
    }

    console.log('Fetching product details for ID:', productId);

    // Fetch product basic data
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('id, name, is_admin')
      .eq('id', roleId)
      .single();

    if (rolesError) throw rolesError;
    if (!roles) throw new Error('Role not found');

    const { data: functions, error: functionsError } = await supabase
      .from('role_functions')
      .select('function_id')
      .eq('role_id', roleId);

    if (functionsError) throw functionsError;
    if (!functions) throw new Error('Functions not found');


    const functionIds = functions.map((func) => func.function_id);

    const response = {
      role: {
        id: roles.id,
        name: roles.name,
        is_admin: roles.is_admin,
      },
      functionIds: functionIds
    };

    console.log('Role details fetched successfully');

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in get-product-details:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
