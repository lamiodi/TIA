-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.addresses (
  id integer NOT NULL DEFAULT nextval('addresses_id_seq'::regclass),
  user_id integer,
  title character varying NOT NULL,
  address_line_1 character varying NOT NULL,
  landmark character varying,
  city character varying NOT NULL,
  state character varying,
  zip_code character varying,
  country character varying NOT NULL,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  deleted_at timestamp without time zone,
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT addresses_pkey PRIMARY KEY (id),
  CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.billing_addresses (
  id integer NOT NULL DEFAULT nextval('billing_addresses_id_seq'::regclass),
  user_id integer,
  full_name character varying NOT NULL,
  email character varying NOT NULL,
  phone_number character varying,
  address_line_1 character varying NOT NULL,
  city character varying NOT NULL,
  state character varying,
  zip_code character varying,
  country character varying NOT NULL,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  deleted_at timestamp without time zone,
  updated_at timestamp without time zone,
  CONSTRAINT billing_addresses_pkey PRIMARY KEY (id),
  CONSTRAINT billing_addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.bundle_images (
  id integer NOT NULL DEFAULT nextval('bundle_images_id_seq'::regclass),
  bundle_id integer NOT NULL,
  image_url text NOT NULL,
  is_primary boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT bundle_images_pkey PRIMARY KEY (id),
  CONSTRAINT bundle_images_bundle_id_fkey FOREIGN KEY (bundle_id) REFERENCES public.bundles(id)
);
CREATE TABLE public.bundle_items (
  id integer NOT NULL DEFAULT nextval('bundle_items_id_seq'::regclass),
  bundle_id integer NOT NULL,
  variant_id integer NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT bundle_items_pkey PRIMARY KEY (id),
  CONSTRAINT bundle_items_bundle_id_fkey FOREIGN KEY (bundle_id) REFERENCES public.bundles(id),
  CONSTRAINT bundle_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id)
);
CREATE TABLE public.bundles (
  id integer NOT NULL DEFAULT nextval('bundles_id_seq'::regclass),
  product_id integer,
  bundle_type character varying NOT NULL CHECK (bundle_type::text = ANY (ARRAY['3-in-1'::character varying::text, '5-in-1'::character varying::text])),
  bundle_price numeric,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  sku_prefix character varying,
  name text,
  description text,
  CONSTRAINT bundles_pkey PRIMARY KEY (id),
  CONSTRAINT bundles_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.cart (
  id integer NOT NULL DEFAULT nextval('cart_id_seq'::regclass),
  user_id integer NOT NULL,
  total numeric DEFAULT 0.00,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT cart_pkey PRIMARY KEY (id),
  CONSTRAINT cart_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.cart_bundle_items (
  id integer NOT NULL DEFAULT nextval('cart_bundle_items_id_seq'::regclass),
  cart_item_id integer NOT NULL,
  variant_id integer NOT NULL,
  size_id integer NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  price numeric,
  CONSTRAINT cart_bundle_items_pkey PRIMARY KEY (id),
  CONSTRAINT cart_bundle_items_cart_item_id_fkey FOREIGN KEY (cart_item_id) REFERENCES public.cart_items(id),
  CONSTRAINT cart_bundle_items_size_id_fkey FOREIGN KEY (size_id) REFERENCES public.sizes(id),
  CONSTRAINT cart_bundle_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id)
);
CREATE TABLE public.cart_items (
  id integer NOT NULL DEFAULT nextval('cart_items_id_seq'::regclass),
  cart_id integer NOT NULL,
  product_id integer,
  variant_id integer,
  bundle_id integer,
  size_id integer,
  quantity integer NOT NULL DEFAULT 1,
  is_bundle boolean NOT NULL DEFAULT false,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  user_id integer,
  color_name text,
  size_name text,
  price numeric DEFAULT 0.00,
  CONSTRAINT cart_items_pkey PRIMARY KEY (id),
  CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.cart(id),
  CONSTRAINT cart_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.colors (
  id integer NOT NULL DEFAULT nextval('colors_id_seq'::regclass),
  color_name character varying NOT NULL UNIQUE,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  color_code text,
  CONSTRAINT colors_pkey PRIMARY KEY (id)
);
CREATE TABLE public.discounts (
  id integer NOT NULL DEFAULT nextval('discounts_id_seq'::regclass),
  product_id integer,
  discount_type character varying CHECK (discount_type::text = ANY (ARRAY['percentage'::character varying, 'fixed'::character varying]::text[])),
  discount_value numeric NOT NULL,
  start_date timestamp without time zone NOT NULL,
  end_date timestamp without time zone NOT NULL,
  active boolean DEFAULT true,
  CONSTRAINT discounts_pkey PRIMARY KEY (id),
  CONSTRAINT discounts_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.newsletter_subscribers (
  id integer NOT NULL DEFAULT nextval('newsletter_subscribers_id_seq'::regclass),
  email character varying NOT NULL UNIQUE,
  subscribed_at timestamp without time zone DEFAULT now(),
  unsubscribed_at timestamp without time zone,
  CONSTRAINT newsletter_subscribers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.order_items (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  order_id bigint NOT NULL,
  variant_id bigint,
  bundle_id bigint,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric NOT NULL CHECK (price >= 0::numeric),
  size_id bigint,
  product_name text NOT NULL,
  image_url text,
  color_name text,
  size_name text,
  bundle_details jsonb,
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_bundle_id_fkey FOREIGN KEY (bundle_id) REFERENCES public.bundles(id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_items_size_id_fkey FOREIGN KEY (size_id) REFERENCES public.sizes(id),
  CONSTRAINT order_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id)
);
CREATE TABLE public.orders (
  id integer NOT NULL DEFAULT nextval('orders_id_seq'::regclass),
  user_id integer,
  cart_id integer,
  address_id integer,
  billing_address_id integer,
  total numeric NOT NULL,
  tax numeric NOT NULL,
  shipping_method character varying,
  shipping_method_id integer,
  shipping_cost numeric,
  shipping_country character varying,
  payment_method character varying,
  payment_status character varying,
  status character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  reference character varying,
  note text,
  currency character varying,
  delivery_fee_paid boolean DEFAULT false,
  updated_at timestamp without time zone DEFAULT now(),
  deleted_at timestamp without time zone,
  total_ngn numeric,
  exchange_rate numeric,
  base_currency_total numeric,
  converted_total numeric,
  delivery_fee numeric DEFAULT 0.00,
  discount numeric DEFAULT 0,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.payments (
  id integer NOT NULL DEFAULT nextval('payments_id_seq'::regclass),
  order_id integer NOT NULL,
  amount numeric NOT NULL,
  currency character varying NOT NULL,
  payment_method character varying NOT NULL,
  status character varying NOT NULL,
  reference character varying NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT payments_pkey PRIMARY KEY (id)
);
CREATE TABLE public.product_images (
  id integer NOT NULL DEFAULT nextval('product_images_id_seq'::regclass),
  variant_id integer NOT NULL,
  image_url text NOT NULL,
  is_primary boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT product_images_pkey PRIMARY KEY (id),
  CONSTRAINT product_images_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id)
);
CREATE TABLE public.product_variants (
  id integer NOT NULL DEFAULT nextval('product_variants_id_seq'::regclass),
  product_id integer NOT NULL,
  color_id integer NOT NULL,
  sku character varying UNIQUE,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  name text,
  CONSTRAINT product_variants_pkey PRIMARY KEY (id),
  CONSTRAINT product_variants_color_id_fkey FOREIGN KEY (color_id) REFERENCES public.colors(id),
  CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.products (
  id integer NOT NULL DEFAULT nextval('products_id_seq'::regclass),
  name character varying NOT NULL,
  description text,
  base_price numeric NOT NULL,
  sku_prefix character varying,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  is_new_release boolean DEFAULT false,
  category character varying,
  gender character varying,
  CONSTRAINT products_pkey PRIMARY KEY (id)
);
CREATE TABLE public.review_images (
  id integer NOT NULL DEFAULT nextval('review_images_id_seq'::regclass),
  review_id integer NOT NULL,
  image_url character varying NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT review_images_pkey PRIMARY KEY (id),
  CONSTRAINT review_images_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.reviews(id)
);
CREATE TABLE public.review_votes (
  id integer NOT NULL DEFAULT nextval('review_votes_id_seq'::regclass),
  review_id integer NOT NULL,
  user_id integer NOT NULL,
  vote_type character varying NOT NULL CHECK (vote_type::text = ANY (ARRAY['helpful'::character varying::text, 'not_helpful'::character varying::text])),
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT review_votes_pkey PRIMARY KEY (id),
  CONSTRAINT review_votes_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.reviews(id),
  CONSTRAINT review_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.reviews (
  id integer NOT NULL DEFAULT nextval('reviews_id_seq'::regclass),
  user_id integer NOT NULL,
  product_id integer,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title character varying NOT NULL,
  comment text NOT NULL,
  size character varying DEFAULT 'N/A'::character varying,
  color character varying DEFAULT 'N/A'::character varying,
  helpful integer DEFAULT 0,
  created_at date DEFAULT CURRENT_DATE,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  bundle_id integer,
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_bundle_id_fkey FOREIGN KEY (bundle_id) REFERENCES public.bundles(id),
  CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.sizes (
  id integer NOT NULL DEFAULT nextval('sizes_id_seq'::regclass),
  size_name character varying NOT NULL UNIQUE,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT sizes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.users (
  id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  first_name character varying,
  last_name character varying,
  username character varying NOT NULL UNIQUE,
  email character varying NOT NULL UNIQUE,
  password character varying,
  phone_number character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  is_admin boolean DEFAULT false,
  reset_token text,
  reset_token_expires timestamp without time zone,
  first_order boolean DEFAULT true,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.variant_sizes (
  id integer NOT NULL DEFAULT nextval('variant_sizes_id_seq'::regclass),
  variant_id integer NOT NULL,
  size_id integer NOT NULL,
  stock_quantity integer NOT NULL DEFAULT 0,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT variant_sizes_pkey PRIMARY KEY (id),
  CONSTRAINT variant_sizes_size_id_fkey FOREIGN KEY (size_id) REFERENCES public.sizes(id),
  CONSTRAINT variant_sizes_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id)
);
CREATE TABLE public.wishlist (
  id integer NOT NULL DEFAULT nextval('wishlist_id_seq'::regclass),
  user_id integer NOT NULL,
  product_id integer NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  bundle_id integer,
  CONSTRAINT wishlist_pkey PRIMARY KEY (id),
  CONSTRAINT wishlist_bundle_id_fkey FOREIGN KEY (bundle_id) REFERENCES public.bundles(id),
  CONSTRAINT wishlist_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT wishlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);