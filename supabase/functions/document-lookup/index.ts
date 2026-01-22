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

    // Build API URL based on document type (using Decolecta API)
    const baseUrl = "https://api.decolecta.com/v1";
    const endpoint = docType === "DNI" 
      ? `${baseUrl}/reniec/dni?numero=${docNumber}`
      : `${baseUrl}/sunat/ruc?numero=${docNumber}`;

    console.log(`Looking up ${docType}: ${docNumber}`);

    // Call external API with Bearer token in header
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiToken}`,
      },
    });
    const data = await response.json();

    console.log("API Response:", JSON.stringify(data));

    if (!response.ok || data.error || !data.data) {
      console.log("Document not found in external API:", data);
      return new Response(
        JSON.stringify({ error: data.error || "Document not found", found: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return normalized response
    // Decolecta DNI response: { data: { nombres, apellido_paterno, apellido_materno, ... } }
    // Decolecta RUC response: { data: { nombre_o_razon_social, ... } }
    const apiData = data.data;
    let result;
    if (docType === "DNI") {
      result = {
        found: true,
        nombres: apiData.nombres || "",
        apellidoPaterno: apiData.apellido_paterno || "",
        apellidoMaterno: apiData.apellido_materno || "",
      };
    } else {
      // For RUC, use nombre_o_razon_social as customerName
      result = {
        found: true,
        nombres: apiData.nombre_o_razon_social || "",
        apellidoPaterno: "",
        apellidoMaterno: "",
        razonSocial: apiData.nombre_o_razon_social || "",
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
