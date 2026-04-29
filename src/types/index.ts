export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  description: string;
  price: number;
  original_price: number | null;
  images: string[];
  stock: number;
  is_active: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
  categories?: Category;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  telegram_user_id: number;
  telegram_username: string;
  telegram_first_name: string;
  telegram_last_name: string;
  items: OrderItem[];
  total_amount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address: ShippingAddress;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ShippingAddress {
  full_name: string;
  phone: string;
  address: string;
  city: string;
  country: string;
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}
