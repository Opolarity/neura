-- Create returns table
CREATE TABLE public.returns (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  order_id bigint NOT NULL REFERENCES public.orders(id),
  customer_document_type_id bigint REFERENCES public.document_types(id),
  customer_document_number varchar(50) NOT NULL,
  reason text,
  total_return boolean NOT NULL DEFAULT false,
  shipping_return boolean NOT NULL DEFAULT false,
  status_id bigint NOT NULL REFERENCES public.statuses(id),
  situation_id bigint NOT NULL REFERENCES public.situations(id),
  total_refund_amount numeric,
  total_exchange_difference numeric,
  return_type_id bigint NOT NULL REFERENCES public.types(id),
  created_by uuid NOT NULL REFERENCES public.profiles("UID"),
  created_at timestamptz DEFAULT now()
);

-- Create returns_products table
CREATE TABLE public.returns_products (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  return_id bigint NOT NULL REFERENCES public.returns(id) ON DELETE CASCADE,
  product_variation_id bigint NOT NULL REFERENCES public.variations(id),
  quantity bigint NOT NULL,
  product_amount numeric,
  output boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create stock_movements table
CREATE TABLE public.stock_movements (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  product_variation_id bigint NOT NULL REFERENCES public.variations(id),
  quantity bigint NOT NULL,
  order_id bigint REFERENCES public.orders(id),
  manual_movement boolean NOT NULL,
  created_by uuid NOT NULL REFERENCES public.profiles("UID"),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for returns
CREATE POLICY "Authenticated users can view returns"
  ON public.returns FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create returns"
  ON public.returns FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update returns"
  ON public.returns FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- RLS Policies for returns_products
CREATE POLICY "Authenticated users can view returns_products"
  ON public.returns_products FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.returns
      WHERE returns.id = returns_products.return_id
    )
  );

CREATE POLICY "Authenticated users can create returns_products"
  ON public.returns_products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.returns
      WHERE returns.id = returns_products.return_id
      AND returns.created_by = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can update returns_products"
  ON public.returns_products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.returns
      WHERE returns.id = returns_products.return_id
      AND returns.created_by = auth.uid()
    )
  );

-- RLS Policies for stock_movements
CREATE POLICY "Authenticated users can view stock_movements"
  ON public.stock_movements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create stock_movements"
  ON public.stock_movements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Create indexes for better performance
CREATE INDEX idx_returns_order_id ON public.returns(order_id);
CREATE INDEX idx_returns_created_by ON public.returns(created_by);
CREATE INDEX idx_returns_status_id ON public.returns(status_id);
CREATE INDEX idx_returns_products_return_id ON public.returns_products(return_id);
CREATE INDEX idx_returns_products_variation_id ON public.returns_products(product_variation_id);
CREATE INDEX idx_stock_movements_variation_id ON public.stock_movements(product_variation_id);
CREATE INDEX idx_stock_movements_order_id ON public.stock_movements(order_id);
CREATE INDEX idx_stock_movements_created_by ON public.stock_movements(created_by);