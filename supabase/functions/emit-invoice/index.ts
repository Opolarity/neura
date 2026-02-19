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

    // Use service_role to read provider credentials (no RLS on those tables)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Get invoice
    const { data: invoice, error: invErr } = await supabaseAdmin
      .from("invoices")
      .select("*")
      .eq("id", invoice_id)
      .single();

    if (invErr || !invoice) {
      return new Response(JSON.stringify({ error: "Comprobante no encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (invoice.declared) {
      return new Response(JSON.stringify({ error: "El comprobante ya fue emitido en SUNAT" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Get invoice items
    const { data: items } = await supabaseAdmin
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", invoice_id)
      .order("id");

    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ error: "El comprobante no tiene items" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Get invoice type code from types table
    const { data: invoiceType } = await supabaseAdmin
      .from("types")
      .select("code")
      .eq("id", invoice.invoice_type_id)
      .single();

    const tipoDeComprobante = invoiceType?.code ? parseInt(invoiceType.code) : 1;

    // 4. Get document type state_code
    const { data: docType } = await supabaseAdmin
      .from("document_types")
      .select("state_code")
      .eq("id", invoice.customer_document_type_id)
      .single();

    const clienteTipoDocumento = docType?.state_code ? parseInt(docType.state_code) : 1;

    // 5. Find invoice_series by tax_serie prefix to get invoice_provider_id
    const taxSerie = invoice.tax_serie || "";
    const serieParts = taxSerie.split("-");
    const seriePrefix = serieParts[0] || "";
    const serieNumber = serieParts.length > 1 ? parseInt(serieParts[1]) : 1;

    if (!seriePrefix) {
      return new Response(JSON.stringify({ error: "El comprobante no tiene serie asignada" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: serieRows } = await supabaseAdmin
      .from("invoice_series")
      .select("id, invoice_provider_id")
      .or(
        `fac_serie.eq.${seriePrefix},bol_serie.eq.${seriePrefix},ncf_serie.eq.${seriePrefix},ncb_serie.eq.${seriePrefix},ndf_serie.eq.${seriePrefix},ndb_serie.eq.${seriePrefix},grr_serie.eq.${seriePrefix},grt_serie.eq.${seriePrefix}`
      )
      .limit(1);

    if (!serieRows || serieRows.length === 0) {
      return new Response(
        JSON.stringify({ error: "No se encontró la serie del comprobante en la configuración" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Get provider url and token
    const { data: provider } = await supabaseAdmin
      .from("invoice_providers")
      .select("url, token")
      .eq("id", serieRows[0].invoice_provider_id)
      .single();

    if (!provider) {
      return new Response(
        JSON.stringify({ error: "Proveedor de facturación no encontrado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Build NubeFact JSON
    const fechaEmision = new Date(invoice.created_at);
    const fechaFormatted = `${String(fechaEmision.getDate()).padStart(2, "0")}-${String(
      fechaEmision.getMonth() + 1
    ).padStart(2, "0")}-${fechaEmision.getFullYear()}`;

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
      tipo_de_comprobante: tipoDeComprobante,
      serie: seriePrefix,
      numero: serieNumber,
      sunat_transaction: 1,
      cliente_tipo_de_documento: clienteTipoDocumento,
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

    // 8. Send to NubeFact
    const nubefactResponse = await fetch(provider.url, {
      method: "POST",
      headers: {
        Authorization: provider.token,
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

    // 9. Update invoice with response data
    const updateData: Record<string, any> = {};
    if (nubefactResult.enlace_del_pdf) updateData.pdf_url = nubefactResult.enlace_del_pdf;
    if (nubefactResult.enlace_del_xml) updateData.xml_url = nubefactResult.enlace_del_xml;
    if (nubefactResult.enlace_del_cdr) updateData.cdr_url = nubefactResult.enlace_del_cdr;
    if (nubefactResult.aceptada_por_sunat !== undefined) {
      updateData.declared = nubefactResult.aceptada_por_sunat;
    }

    if (Object.keys(updateData).length > 0) {
      await supabaseAdmin.from("invoices").update(updateData).eq("id", invoice_id);
    }

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
