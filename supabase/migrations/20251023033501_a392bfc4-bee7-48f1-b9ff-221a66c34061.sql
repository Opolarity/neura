-- Enable RLS on catalog/configuration tables (public read access)
ALTER TABLE public.capabilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view capabilities" ON public.capabilities FOR SELECT USING (true);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);

ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view cities" ON public.cities FOR SELECT USING (true);

ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view countries" ON public.countries FOR SELECT USING (true);

ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view document types" ON public.document_types FOR SELECT USING (true);

ALTER TABLE public.functions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view functions" ON public.functions FOR SELECT USING (true);

ALTER TABLE public.invoice_type ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view invoice types" ON public.invoice_type FOR SELECT USING (true);

ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view neighborhoods" ON public.neighborhoods FOR SELECT USING (true);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view payment methods" ON public.payment_methods FOR SELECT USING (true);

ALTER TABLE public.price_list ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view price lists" ON public.price_list FOR SELECT USING (true);

ALTER TABLE public.sale_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view sale types" ON public.sale_types FOR SELECT USING (true);

ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view states" ON public.states FOR SELECT USING (true);

ALTER TABLE public.term_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view term groups" ON public.term_groups FOR SELECT USING (true);

ALTER TABLE public.terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view terms" ON public.terms FOR SELECT USING (true);

-- Enable RLS on product-related tables (public read access)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);

ALTER TABLE public.variations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view variations" ON public.variations FOR SELECT USING (true);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view product categories" ON public.product_categories FOR SELECT USING (true);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view product images" ON public.product_images FOR SELECT USING (true);

ALTER TABLE public.product_variation_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view product variation images" ON public.product_variation_images FOR SELECT USING (true);

ALTER TABLE public.variation_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view variation terms" ON public.variation_terms FOR SELECT USING (true);

ALTER TABLE public.product_price ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view product prices" ON public.product_price FOR SELECT USING (true);

ALTER TABLE public.product_stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view product stock" ON public.product_stock FOR SELECT USING (true);

-- Enable RLS on warehouse table
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view warehouses" ON public.warehouses FOR SELECT USING (true);

-- Enable RLS on role and user management tables (restricted access)
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view roles" ON public.roles FOR SELECT USING (true);

ALTER TABLE public.role_functions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view role functions" ON public.role_functions FOR SELECT USING (true);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.user_functions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own functions" ON public.user_functions FOR SELECT USING (auth.uid() = user_id);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = "UID");