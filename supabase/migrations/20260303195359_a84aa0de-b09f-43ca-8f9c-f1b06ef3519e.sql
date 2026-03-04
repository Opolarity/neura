
CREATE OR REPLACE FUNCTION public.create_bar_code(
  p_product_variation_id integer,
  p_price_list_id integer,
  p_sequence integer,
  p_quantities integer,
  p_created_by uuid,
  p_stock_movement_id integer DEFAULT NULL
)
RETURNS SETOF bar_codes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO public.bar_codes (
    product_variation_id,
    price_list_id,
    sequence,
    quantities,
    created_by,
    stock_movement_id
  ) VALUES (
    p_product_variation_id,
    p_price_list_id,
    p_sequence,
    p_quantities,
    p_created_by,
    p_stock_movement_id
  )
  RETURNING *;
END;
$$;
