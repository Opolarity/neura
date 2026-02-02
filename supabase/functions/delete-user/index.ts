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
        const { uid } = payload;

        if (!uid) {
            return new Response(
                JSON.stringify({ error: 'UID (auth_uid) is required for soft delete' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            );
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        console.log('Starting soft delete for user:', uid);

        // 1. Scramble password to prevent further logins
        const generateRandomPassword = (length: number) => {
            const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&/()=";
            let retVal = "";
            for (let i = 0, n = charset.length; i < length; ++i) {
                retVal += charset.charAt(Math.floor(Math.random() * n));
            }
            return retVal;
        };

        const newPassword = generateRandomPassword(20);
        const { error: authError } = await supabase.auth.admin.updateUserById(
            uid,
            { password: newPassword }
        );

        if (authError) {
            console.error('Error updating user auth (password scramble):', authError);
            throw new Error(`Failed to scramble password: ${authError.message}`);
        }

        // 2. Deactivate profile
        const { error: profileError } = await supabase
            .from('profiles')
            .update({ is_active: false })
            .eq('UID', uid);

        if (profileError) {
            console.error('Error deactivating profile:', profileError);
            throw new Error(`Profile deactivation failed: ${profileError.message}`);
        }

        // 3. Remove user roles
        const { error: roleError } = await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', uid);

        if (roleError) {
            console.error('Error deleting user roles:', roleError);
            throw new Error(`User roles deletion failed: ${roleError.message}`);
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: 'User soft deleted (deactivated) successfully'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );

    } catch (error) {
        console.error('Error in user soft delete workflow:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return new Response(
            JSON.stringify({ error: errorMessage }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
    }
});
