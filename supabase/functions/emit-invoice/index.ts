import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoice_id } = await req.json();
    if (!invoice_id) {
      return new Response(JSON.stringify({ error: "invoice_id es requerido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Get all invoice data via RPC
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc(
      "sp_get_invoice_for_emit",
      { p_invoice_id: invoice_id }
    );

    if (rpcError) {
      console.error("RPC error:", rpcError);
      return new Response(JSON.stringify({ error: rpcError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check for business logic errors from RPC
    if (rpcResult?.error) {
      return new Response(JSON.stringify({ error: rpcResult.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      invoice,
      items,
      tipo_de_comprobante,
      cliente_tipo_de_documento,
      serie,
      numero,
      provider_url,
      provider_token,
    } = rpcResult;

    // 2. Build NubeFact JSON - NubeFact requires today's date
    const now = new Date();
    // Use Peru timezone (UTC-5) to ensure correct date
    const peruDate = new Date(now.getTime() - 5 * 60 * 60 * 1000);
    const fechaFormatted = `${String(peruDate.getUTCDate()).padStart(2, "0")}-${String(
      peruDate.getUTCMonth() + 1
    ).padStart(2, "0")}-${peruDate.getUTCFullYear()}`;

    const totalGravada = items.reduce((sum: number, item: any) => {
      const base = item.quantity * item.unit_price - (item.discount || 0);
      return sum + base;
    }, 0);

    const totalIgv = items.reduce((sum: number, item: any) => sum + item.igv, 0);

    const nubefactItems = items.map((item: any) => {
      const base = item.quantity * item.unit_price - (item.discount || 0);
      const valorUnitario = +(base / item.quantity).toFixed(10);
      const precioUnitario = +(item.total / item.quantity).toFixed(10);

      return {
        unidad_de_medida: item.measurement_unit || "NIU",
        codigo: "",
        descripcion: item.description,
        cantidad: item.quantity,
        valor_unitario: valorUnitario,
        precio_unitario: precioUnitario,
        descuento: item.discount ? +item.discount.toFixed(2) : "",
        subtotal: +base.toFixed(2),
        tipo_de_igv: 1,
        igv: +item.igv.toFixed(2),
        total: +item.total.toFixed(2),
        anticipo_regularizacion: false,
        anticipo_documento_serie: "",
        anticipo_documento_numero: "",
      };
    });

    const nubefactPayload = {
      operacion: "generar_comprobante",
      tipo_de_comprobante,
      serie,
      numero,
      sunat_transaction: 1,
      cliente_tipo_de_documento,
      cliente_numero_de_documento: invoice.customer_document_number || "",
      cliente_denominacion: invoice.client_name || "",
      cliente_direccion: invoice.client_address || "",
      cliente_email: invoice.client_email || "",
      cliente_email_1: "",
      cliente_email_2: "",
      fecha_de_emision: fechaFormatted,
      fecha_de_vencimiento: "",
      moneda: 1,
      tipo_de_cambio: "",
      porcentaje_de_igv: 18.0,
      descuento_global: "",
      total_descuento: "",
      total_anticipo: "",
      total_gravada: +totalGravada.toFixed(2),
      total_inafecta: "",
      total_exonerada: "",
      total_igv: +totalIgv.toFixed(2),
      total_gratuita: "",
      total_otros_cargos: "",
      total: +invoice.total_amount.toFixed(2),
      percepcion_tipo: "",
      percepcion_base_imponible: "",
      total_percepcion: "",
      total_incluido_percepcion: "",
      detraccion: false,
      observaciones: "",
      documento_que_se_modifica_tipo: "",
      documento_que_se_modifica_serie: "",
      documento_que_se_modifica_numero: "",
      tipo_de_nota_de_credito: "",
      tipo_de_nota_de_debito: "",
      enviar_automaticamente_a_la_sunat: true,
      enviar_automaticamente_al_cliente: !!invoice.client_email,
      condiciones_de_pago: "",
      medio_de_pago: "",
      placa_vehiculo: "",
      orden_compra_servicio: "",
      formato_de_pdf: "",
      items: nubefactItems,
    };

    console.log("Sending to NubeFact:", JSON.stringify(nubefactPayload));

    // 3. Send to NubeFact
    const nubefactResponse = await fetch(provider_url, {
      method: "POST",
      headers: {
        Authorization: provider_token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(nubefactPayload),
    });

    const nubefactResult = await nubefactResponse.json();
    console.log("NubeFact response:", JSON.stringify(nubefactResult));

    if (!nubefactResponse.ok) {
      return new Response(
        JSON.stringify({
          error: nubefactResult.errors || nubefactResult.message || "Error al emitir en SUNAT",
          nubefact_response: nubefactResult,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Update invoice via RPC
    await supabaseAdmin.rpc("sp_update_invoice_sunat_response", {
      p_invoice_id: invoice_id,
      p_pdf_url: nubefactResult.enlace_del_pdf || null,
      p_xml_url: nubefactResult.enlace_del_xml || null,
      p_cdr_url: nubefactResult.enlace_del_cdr || null,
      p_declared: nubefactResult.aceptada_por_sunat ?? false,
    });

    return new Response(JSON.stringify(nubefactResult), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("emit-invoice error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Error interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
