
-- RPC to get all data needed to emit an invoice to SUNAT
CREATE OR REPLACE FUNCTION public.sp_get_invoice_for_emit(p_invoice_id integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice record;
  v_items json;
  v_invoice_type_code text;
  v_doc_type_state_code text;
  v_serie_prefix text;
  v_serie_number integer;
  v_provider_url text;
  v_provider_token text;
  v_provider_id integer;
BEGIN
  -- 1. Get invoice
  SELECT * INTO v_invoice
  FROM invoices
  WHERE id = p_invoice_id;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Comprobante no encontrado');
  END IF;

  IF v_invoice.declared THEN
    RETURN json_build_object('error', 'El comprobante ya fue emitido en SUNAT');
  END IF;

  -- 2. Get items as JSON array
  SELECT json_agg(json_build_object(
    'description', ii.description,
    'quantity', ii.quantity,
    'measurement_unit', ii.measurement_unit,
    'unit_price', ii.unit_price,
    'discount', COALESCE(ii.discount, 0),
    'igv', ii.igv,
    'total', ii.total
  ) ORDER BY ii.id)
  INTO v_items
  FROM invoice_items ii
  WHERE ii.invoice_id = p_invoice_id;

  IF v_items IS NULL THEN
    RETURN json_build_object('error', 'El comprobante no tiene items');
  END IF;

  -- 3. Get invoice type code
  SELECT t.code INTO v_invoice_type_code
  FROM types t
  WHERE t.id = v_invoice.invoice_type_id;

  -- 4. Get document type state_code
  SELECT dt.state_code INTO v_doc_type_state_code
  FROM document_types dt
  WHERE dt.id = v_invoice.customer_document_type_id;

  -- 5. Parse serie prefix and number
  IF v_invoice.tax_serie IS NULL OR v_invoice.tax_serie = '' THEN
    RETURN json_build_object('error', 'El comprobante no tiene serie asignada');
  END IF;

  v_serie_prefix := split_part(v_invoice.tax_serie, '-', 1);
  v_serie_number := COALESCE(NULLIF(split_part(v_invoice.tax_serie, '-', 2), '')::integer, 1);

  -- 6. Find provider via invoice_series
  SELECT ip.url, ip.token, ip.id
  INTO v_provider_url, v_provider_token, v_provider_id
  FROM invoice_series ise
  JOIN invoice_providers ip ON ip.id = ise.invoice_provider_id
  WHERE ise.fac_serie = v_serie_prefix
     OR ise.bol_serie = v_serie_prefix
     OR ise.ncf_serie = v_serie_prefix
     OR ise.ncb_serie = v_serie_prefix
     OR ise.ndf_serie = v_serie_prefix
     OR ise.ndb_serie = v_serie_prefix
     OR ise.grr_serie = v_serie_prefix
     OR ise.grt_serie = v_serie_prefix
  LIMIT 1;

  IF v_provider_url IS NULL THEN
    RETURN json_build_object('error', 'No se encontró proveedor de facturación para la serie');
  END IF;

  -- 7. Return all data
  RETURN json_build_object(
    'invoice', json_build_object(
      'id', v_invoice.id,
      'total_amount', v_invoice.total_amount,
      'total_taxes', v_invoice.total_taxes,
      'customer_document_number', v_invoice.customer_document_number,
      'client_name', v_invoice.client_name,
      'client_email', v_invoice.client_email,
      'client_address', v_invoice.client_address,
      'created_at', v_invoice.created_at
    ),
    'items', v_items,
    'tipo_de_comprobante', COALESCE(v_invoice_type_code::integer, 1),
    'cliente_tipo_de_documento', COALESCE(v_doc_type_state_code::integer, 1),
    'serie', v_serie_prefix,
    'numero', v_serie_number,
    'provider_url', v_provider_url,
    'provider_token', v_provider_token
  );
END;
$$;

-- RPC to update invoice after SUNAT emission
CREATE OR REPLACE FUNCTION public.sp_update_invoice_sunat_response(
  p_invoice_id integer,
  p_pdf_url text DEFAULT NULL,
  p_xml_url text DEFAULT NULL,
  p_cdr_url text DEFAULT NULL,
  p_declared boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE invoices
  SET
    pdf_url = COALESCE(p_pdf_url, pdf_url),
    xml_url = COALESCE(p_xml_url, xml_url),
    cdr_url = COALESCE(p_cdr_url, cdr_url),
    declared = p_declared
  WHERE id = p_invoice_id;
END;
$$;
