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
      shipping_cost,
      tipo_de_comprobante,
      cliente_tipo_de_documento,
      serie,
      numero,
      provider_url,
      provider_token,
    } = rpcResult;

    // 2. Build NubeFact JSON - NubeFact requires today's date in Peru timezone
    const now = new Date();
    const peruTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Lima" }));
    const fechaFormatted = `${String(peruTime.getDate()).padStart(2, "0")}-${String(
      peruTime.getMonth() + 1
    ).padStart(2, "0")}-${peruTime.getFullYear()}`;

    // Items from invoice_items have:
    // - unit_price: precio del producto (con IGV incluido)
    // - discount: descuento por producto (con IGV incluido)
    // - total: lineTotal = (unit_price * quantity) - discount (con IGV incluido)
    // For NubeFact:
    // - precio_unitario = unit_price (precio con IGV)
    // - valor_unitario = (unit_price - discount/quantity) / 1.18 (precio sin IGV, ya descontado)
    // - igv = total - total / 1.18
    // - subtotal (base gravada) = total / 1.18

    const nubefactItems = items.map((item: any) => {
      const discount = item.discount || 0;
      const lineTotal = item.total; // total con IGV incluido
      const baseGravada = +(lineTotal / 1.18).toFixed(2);
      const igv = +(lineTotal - baseGravada).toFixed(2);
      const precioUnitario = +((item.unit_price * item.quantity - discount) / item.quantity).toFixed(10);
      const valorUnitario = +(precioUnitario / 1.18).toFixed(10);

      return {
        unidad_de_medida: item.measurement_unit || "NIU",
        codigo: "",
        descripcion: item.description,
        cantidad: item.quantity,
        valor_unitario: valorUnitario,
        precio_unitario: precioUnitario,
        descuento: "",
        subtotal: baseGravada,
        tipo_de_igv: 1,
        igv: igv,
        total: +lineTotal.toFixed(2),
        anticipo_regularizacion: false,
        anticipo_documento_serie: "",
        anticipo_documento_numero: "",
      };
    });

    // Add shipping cost as an additional item if > 0
    const shippingCost = Number(shipping_cost) || 0;
    if (shippingCost > 0) {
      const shippingBase = +(shippingCost / 1.18).toFixed(2);
      const shippingIgv = +(shippingCost - shippingBase).toFixed(2);
      nubefactItems.push({
        unidad_de_medida: "ZZ",
        codigo: "",
        descripcion: "Costo de envío",
        cantidad: 1,
        valor_unitario: +shippingBase.toFixed(10),
        precio_unitario: +shippingCost.toFixed(10),
        descuento: "",
        subtotal: shippingBase,
        tipo_de_igv: 1,
        igv: shippingIgv,
        total: +shippingCost.toFixed(2),
        anticipo_regularizacion: false,
        anticipo_documento_serie: "",
        anticipo_documento_numero: "",
      });
    }

    // Calculate totals from all nubefact items
    const totalGravada = +nubefactItems.reduce((sum: number, i: any) => sum + i.subtotal, 0).toFixed(2);
    const totalIgv = +nubefactItems.reduce((sum: number, i: any) => sum + i.igv, 0).toFixed(2);
    const totalConIgv = +nubefactItems.reduce((sum: number, i: any) => sum + i.total, 0).toFixed(2);

    // Pad numero to 8 chars with leading zeros
    const numeroPadded = String(numero).padStart(8, "0");

    const nubefactPayload = {
      operacion: "generar_comprobante",
      tipo_de_comprobante,
      serie,
      numero: numeroPadded,
      sunat_transaction: 1,
      cliente_tipo_de_documento,
      cliente_numero_de_documento: (invoice.customer_document_number || "").trim()
        ? invoice.customer_document_number.trim().padStart(8, "0")
        : "00000000",
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
      total_gravada: totalGravada,
      total_inafecta: "",
      total_exonerada: "",
      total_igv: totalIgv,
      total_gratuita: "",
      total_otros_cargos: "",
      total: totalConIgv,
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

    // 4. Update invoice via RPC - save invoice_number as "SERIE-NUMERO"
    const invoiceNumber = numeroPadded;
    await supabaseAdmin.rpc("sp_update_invoice_sunat_response", {
      p_invoice_id: invoice_id,
      p_pdf_url: nubefactResult.enlace_del_pdf || null,
      p_xml_url: nubefactResult.enlace_del_xml || null,
      p_cdr_url: nubefactResult.enlace_del_cdr || null,
      p_declared: true,
      p_invoice_number: invoiceNumber,
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
