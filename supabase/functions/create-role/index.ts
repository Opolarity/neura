import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Manejo de CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {

    const payload = await req.json();
    const { name, admin, functions } = payload;

    if (!name) {
      return new Response(
        JSON.stringify({ error: 'Name is required for role' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Creating role:', name, 'Admin:', admin);

    // 1. Insert Role
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .insert({
        name,
        admin: !!admin, // Coerce to boolean
      })
      .select()
      .single();

    if (roleError) {
      console.error('Error creating role:', roleError);
      throw roleError;
    }

    // 2. Associate Functions
    if (functions && Array.isArray(functions) && functions.length > 0) {
      const functionInserts = functions.map((funcId: number | string) => ({
        role_id: roleData.id,
        function_id: funcId,
      }));

      const { error: funcError } = await supabase
        .from('role_functions')
        .insert(functionInserts);

      if (funcError) {
        console.error('Error associating functions:', funcError);
        throw funcError;
      }
    }

    return new Response(
      JSON.stringify({ success: true, data: roleData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in create-role function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});