DROP FUNCTION IF EXISTS sp_get_invoice_for_emit(bigint);

CREATE OR REPLACE FUNCTION sp_get_invoice_for_emit(p_invoice_id integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
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
BEGIN
  SELECT * INTO v_invoice FROM invoices WHERE id = p_invoice_id;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Comprobante no encontrado');
  END IF;
  IF v_invoice.declared THEN
    RETURN json_build_object('error', 'El comprobante ya fue emitido en SUNAT');
  END IF;

  SELECT json_agg(json_build_object(
    'description', ii.description, 'quantity', ii.quantity,
    'measurement_unit', ii.measurement_unit, 'unit_price', ii.unit_price,
    'discount', COALESCE(ii.discount, 0), 'igv', ii.igv, 'total', ii.total
  ) ORDER BY ii.id) INTO v_items
  FROM invoice_items ii WHERE ii.invoice_id = p_invoice_id;
  IF v_items IS NULL THEN
    RETURN json_build_object('error', 'El comprobante no tiene items');
  END IF;

  SELECT t.code INTO v_invoice_type_code FROM types t WHERE t.id = v_invoice.invoice_type_id;
  SELECT dt.state_code INTO v_doc_type_state_code FROM document_types dt WHERE dt.id = v_invoice.customer_document_type_id;

  IF v_invoice.tax_serie IS NULL OR v_invoice.tax_serie = '' THEN
    RETURN json_build_object('error', 'El comprobante no tiene serie asignada');
  END IF;

  v_serie_prefix := split_part(v_invoice.tax_serie, '-', 1);
  v_serie_number := COALESCE(NULLIF(split_part(v_invoice.tax_serie, '-', 2), '')::integer, 1);

  SELECT ip.url, ip.token
  INTO v_provider_url, v_provider_token
  FROM invoice_series ise
  JOIN invoice_providers ip ON ip.id = ise.invoice_provider_id
  WHERE ise.serie = v_serie_prefix
  LIMIT 1;

  IF v_provider_url IS NULL THEN
    RETURN json_build_object('error', 'No se encontró proveedor de facturación para la serie');
  END IF;

  RETURN json_build_object(
    'invoice', json_build_object(
      'id', v_invoice.id, 'total_amount', v_invoice.total_amount,
      'total_taxes', v_invoice.total_taxes,
      'customer_document_number', v_invoice.customer_document_number,
      'client_name', v_invoice.client_name, 'client_email', v_invoice.client_email,
      'client_address', v_invoice.client_address, 'created_at', v_invoice.created_at
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

NOTIFY pgrst, 'reload schema';