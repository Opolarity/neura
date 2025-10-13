-- Add Envíos (Shipping) function under sales
INSERT INTO public.functions (name, code, location, icon, active, parent_function, capability_id)
SELECT 'Envíos', 'shipping', '/shipping', 'Truck', true, f.id, c.id
FROM public.functions f, public.capabilities c
WHERE f.code = 'sales' AND c.code = 'ventas'
AND NOT EXISTS (SELECT 1 FROM public.functions WHERE code = 'shipping');