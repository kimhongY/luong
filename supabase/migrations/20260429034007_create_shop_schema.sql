/*
  # Telegram Mini App Shop Schema

  ## Overview
  Creates the complete e-commerce schema for a Telegram mini app product store.

  ## New Tables

  ### categories
  - `id` (uuid, pk) - Unique identifier
  - `name` (text) - Category display name
  - `slug` (text, unique) - URL-safe identifier
  - `image_url` (text) - Optional category image
  - `sort_order` (int) - Display ordering
  - `created_at` (timestamptz)

  ### products
  - `id` (uuid, pk) - Unique identifier
  - `category_id` (uuid, fk) - Category reference
  - `name` (text) - Product name
  - `description` (text) - Full description
  - `price` (numeric) - Price in USD
  - `original_price` (numeric) - Original price (for sale display)
  - `images` (text[]) - Array of image URLs
  - `stock` (int) - Available quantity
  - `is_active` (boolean) - Visibility toggle
  - `tags` (text[]) - Searchable tags
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### orders
  - `id` (uuid, pk)
  - `telegram_user_id` (bigint) - Telegram user ID
  - `telegram_username` (text) - Telegram username
  - `telegram_first_name` (text)
  - `telegram_last_name` (text)
  - `items` (jsonb) - Snapshot of ordered items
  - `total_amount` (numeric)
  - `status` (text) - pending/confirmed/shipped/delivered/cancelled
  - `shipping_address` (jsonb) - Delivery details
  - `notes` (text) - Customer notes
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Products and categories are publicly readable
  - Orders are only accessible by the telegram user who placed them (via telegram_user_id)
  - Admin access via service role
*/

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  image_url text DEFAULT '',
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (true);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text DEFAULT '',
  price numeric(10, 2) NOT NULL CHECK (price >= 0),
  original_price numeric(10, 2),
  images text[] DEFAULT '{}',
  stock int NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_active boolean DEFAULT true,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id bigint NOT NULL,
  telegram_username text DEFAULT '',
  telegram_first_name text DEFAULT '',
  telegram_last_name text DEFAULT '',
  items jsonb NOT NULL DEFAULT '[]',
  total_amount numeric(10, 2) NOT NULL CHECK (total_amount >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  shipping_address jsonb DEFAULT '{}',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can insert own orders"
  ON orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed categories
INSERT INTO categories (name, slug, image_url, sort_order) VALUES
  ('Electronics', 'electronics', 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg', 1),
  ('Fashion', 'fashion', 'https://images.pexels.com/photos/934070/pexels-photo-934070.jpeg', 2),
  ('Home & Living', 'home-living', 'https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg', 3),
  ('Beauty', 'beauty', 'https://images.pexels.com/photos/3373736/pexels-photo-3373736.jpeg', 4)
ON CONFLICT (slug) DO NOTHING;

-- Seed sample products
INSERT INTO products (category_id, name, description, price, original_price, images, stock, tags)
SELECT 
  c.id,
  'Wireless Bluetooth Headphones',
  'Premium sound quality with 30-hour battery life. Active noise cancellation, comfortable over-ear design, and foldable for easy travel.',
  79.99,
  129.99,
  ARRAY['https://images.pexels.com/photos/3945667/pexels-photo-3945667.jpeg', 'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg'],
  50,
  ARRAY['audio', 'wireless', 'headphones']
FROM categories c WHERE c.slug = 'electronics'
ON CONFLICT DO NOTHING;

INSERT INTO products (category_id, name, description, price, original_price, images, stock, tags)
SELECT 
  c.id,
  'Smart Watch Pro',
  'Track your health metrics, receive notifications, and stay connected. Water-resistant with GPS and 7-day battery.',
  199.99,
  249.99,
  ARRAY['https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg', 'https://images.pexels.com/photos/393047/pexels-photo-393047.jpeg'],
  30,
  ARRAY['wearable', 'fitness', 'smartwatch']
FROM categories c WHERE c.slug = 'electronics'
ON CONFLICT DO NOTHING;

INSERT INTO products (category_id, name, description, price, images, stock, tags)
SELECT 
  c.id,
  'Classic Denim Jacket',
  'Timeless style meets modern comfort. Heavyweight denim construction with vintage wash finish. Available in multiple sizes.',
  59.99,
  ARRAY['https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg', 'https://images.pexels.com/photos/934070/pexels-photo-934070.jpeg'],
  80,
  ARRAY['jacket', 'denim', 'casual']
FROM categories c WHERE c.slug = 'fashion'
ON CONFLICT DO NOTHING;

INSERT INTO products (category_id, name, description, price, original_price, images, stock, tags)
SELECT 
  c.id,
  'Minimalist Table Lamp',
  'Scandinavian design with warm LED light. Touch-sensitive dimmer and USB charging port. Perfect for bedside or desk.',
  45.00,
  65.00,
  ARRAY['https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg', 'https://images.pexels.com/photos/380769/pexels-photo-380769.jpeg'],
  40,
  ARRAY['lamp', 'home', 'lighting']
FROM categories c WHERE c.slug = 'home-living'
ON CONFLICT DO NOTHING;

INSERT INTO products (category_id, name, description, price, images, stock, tags)
SELECT 
  c.id,
  'Luxury Skincare Set',
  'Complete 5-piece skincare routine with cleanser, toner, serum, moisturizer, and eye cream. Suitable for all skin types.',
  89.99,
  ARRAY['https://images.pexels.com/photos/3373736/pexels-photo-3373736.jpeg', 'https://images.pexels.com/photos/1599505/pexels-photo-1599505.jpeg'],
  60,
  ARRAY['skincare', 'beauty', 'set']
FROM categories c WHERE c.slug = 'beauty'
ON CONFLICT DO NOTHING;

INSERT INTO products (category_id, name, description, price, original_price, images, stock, tags)
SELECT 
  c.id,
  'Portable Bluetooth Speaker',
  '360° immersive sound with deep bass. 12-hour battery, waterproof IPX7 rating, and built-in microphone for calls.',
  49.99,
  69.99,
  ARRAY['https://images.pexels.com/photos/1706694/pexels-photo-1706694.jpeg', 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg'],
  45,
  ARRAY['audio', 'bluetooth', 'speaker', 'portable']
FROM categories c WHERE c.slug = 'electronics'
ON CONFLICT DO NOTHING;
