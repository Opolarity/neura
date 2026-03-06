CREATE OR REPLACE FUNCTION sp_update_invoice_sunat_response(
  p_invoice_id bigint,
  p_pdf_url text DEFAULT NULL,
  p_xml_url text DEFAULT NULL,
  p_cdr_url text DEFAULT NULL,
  p_declared boolean DEFAULT false,
  p_invoice_number text DEFAULT NULL,
  p_qr_data text DEFAULT NULL
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
    declared = p_declared,
    invoice_number = COALESCE(p_invoice_number, invoice_number),
    qr_data = COALESCE(p_qr_data, qr_data)
  WHERE id = p_invoice_id;
END;
$$;