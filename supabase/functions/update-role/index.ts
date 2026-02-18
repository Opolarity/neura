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
    const { id, name, admin, functions } = payload;

    if (!id || !name) {
      return new Response(
        JSON.stringify({ error: 'ID and Name are required for role update' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Updating role:', id, name, 'Admin:', admin);

    // 1. Update Role Details
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .update({
        name,
        admin: admin !== undefined ? !!admin : undefined, // Only update if provided
      })
      .eq('id', id)
      .select()
      .single();

    if (roleError) {
      console.error('Error updating role:', roleError);
      throw roleError;
    }

    // 2. Sync Functions (Delete old and insert new if functions array is provided)
    if (functions && Array.isArray(functions)) {
      // Clear existing associations
      const { error: deleteError } = await supabase
        .from('role_functions')
        .delete()
        .eq('role_id', id);

      if (deleteError) {
        console.error('Error clearing old associations:', deleteError);
        throw deleteError;
      }

      // Insert new associations
      if (functions.length > 0) {
        const functionInserts = functions.map((funcId: number | string) => ({
          role_id: id,
          function_id: funcId,
        }));

        const { error: insertError } = await supabase
          .from('role_functions')
          .insert(functionInserts);

        if (insertError) {
          console.error('Error inserting new associations:', insertError);
          throw insertError;
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, data: roleData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in update-role function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});