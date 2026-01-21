-- Add is_active column to term_groups table
ALTER TABLE public.term_groups 
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Update sp_get_terms to filter out inactive terms and groups
CREATE OR REPLACE FUNCTION public.sp_get_terms(p_page integer DEFAULT 1, p_size integer DEFAULT 20)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  v_offset integer;
  v_total integer;
BEGIN
  v_offset := (p_page - 1) * p_size;
  
  -- Get total count of active groups
  SELECT COUNT(*) INTO v_total 
  FROM term_groups 
  WHERE is_active = true;
  
  -- Build the result with grouped terms
  SELECT json_build_object(
    'data', COALESCE(
      (SELECT json_agg(group_data ORDER BY group_data->>'group_name')
       FROM (
         SELECT json_build_object(
           'group_id', tg.id,
           'group_name', tg.name,
           'terms', COALESCE(
             (SELECT json_agg(
               json_build_object(
                 'id', t.id,
                 'name', t.name,
                 'products', COALESCE(
                   (SELECT COUNT(DISTINCT vt.product_variation_id)
                    FROM variation_terms vt
                    WHERE vt.term_id = t.id), 0
                 )
               ) ORDER BY t.name
             )
             FROM terms t
             WHERE t.term_group_id = tg.id AND t.is_active = true),
             '[]'::json
           )
         ) as group_data
         FROM term_groups tg
         WHERE tg.is_active = true
         ORDER BY tg.name
         LIMIT p_size OFFSET v_offset
       ) subq
      ),
      '[]'::json
    ),
    'page', p_page,
    'size', p_size,
    'total', v_total
  ) INTO result;
  
  RETURN result;
END;
$$;