import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const apiToken = Deno.env.get("DNIRUC_API_TOKEN");

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!apiToken) {
      console.error("Missing DNIRUC_API_TOKEN secret");
      return new Response(
        JSON.stringify({ error: "API token not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get request body
    const { documentType, documentNumber } = await req.json();

    if (!documentType || !documentNumber) {
      return new Response(
        JSON.stringify({ error: "documentType and documentNumber are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate document type (only DNI or RUC)
    const validTypes = ["DNI", "RUC"];
    const docType = documentType.toUpperCase();
    if (!validTypes.includes(docType)) {
      return new Response(
        JSON.stringify({ error: "Only DNI or RUC types are supported" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate document number format
    const docNumber = documentNumber.toString().trim();
    if (docType === "DNI" && docNumber.length !== 8) {
      return new Response(
        JSON.stringify({ error: "DNI must be 8 digits", found: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (docType === "RUC" && docNumber.length !== 11) {
      return new Response(
        JSON.stringify({ error: "RUC must be 11 digits", found: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build API URL based on document type
    const endpoint = docType === "DNI" ? "dni" : "ruc";
    const apiUrl = `https://dniruc.apisperu.com/api/v1/${endpoint}/${docNumber}?token=${apiToken}`;

    console.log(`Looking up ${docType}: ${docNumber}`);

    // Call external API
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!response.ok || data.success === false || data.message) {
      console.log("Document not found in external API:", data);
      return new Response(
        JSON.stringify({ error: "Document not found", found: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return normalized response
    // DNI response: { nombres, apellidoPaterno, apellidoMaterno, ... }
    // RUC response: { razonSocial, ... }
    let result;
    if (docType === "DNI") {
      result = {
        found: true,
        nombres: data.nombres || "",
        apellidoPaterno: data.apellidoPaterno || "",
        apellidoMaterno: data.apellidoMaterno || "",
      };
    } else {
      // For RUC, use razonSocial as customerName
      result = {
        found: true,
        nombres: data.razonSocial || "",
        apellidoPaterno: "",
        apellidoMaterno: "",
        razonSocial: data.razonSocial || "",
      };
    }

    console.log(`Document found: ${JSON.stringify(result)}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in document-lookup:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
