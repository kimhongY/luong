import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { supabase } from '../lib/supabase';
import { getCurrentUser, tg } from '../lib/telegram';
import type { ShippingAddress } from '../types';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const user = getCurrentUser();

  const [form, setForm] = useState<ShippingAddress>({
    full_name: `${user.first_name} ${user.last_name ?? ''}`.trim(),
    phone: '',
    address: '',
    city: '',
    country: '',
  });
  const [notes, setNotes] = useState('');

  const set = (field: keyof ShippingAddress) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    const missing = (['full_name', 'phone', 'address', 'city', 'country'] as const).find(
      (k) => !form[k].trim()
    );
    if (missing) {
      setError('Please fill all required fields.');
      return;
    }

    setLoading(true);
    setError('');

    const orderItems = items.map((i) => ({
      product_id: i.product.id,
      name: i.product.name,
      price: i.product.price,
      quantity: i.quantity,
      image: i.product.images[0] ?? '',
    }));

    const { data, error: dbError } = await supabase.from('orders').insert({
      telegram_user_id: user.id,
      telegram_username: user.username ?? '',
      telegram_first_name: user.first_name,
      telegram_last_name: user.last_name ?? '',
      items: orderItems,
      total_amount: totalPrice(),
      shipping_address: form,
      notes,
      status: 'pending',
    }).select().maybeSingle();

    setLoading(false);

    if (dbError) {
      setError('Failed to place order. Please try again.');
      return;
    }

    tg?.HapticFeedback?.notificationOccurred('success');
    clearCart();
    navigate(`/order-success/${data.id}`);
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="page checkout-page">
      <button className="back-btn" onClick={() => navigate(-1)}>
        <BackIcon /> Back
      </button>
      <h2 className="page-title">Checkout</h2>

      <div className="checkout-summary">
        <h3>Order Summary</h3>
        {items.map(({ product, quantity }) => (
          <div key={product.id} className="checkout-item">
            <span className="checkout-item-name">{product.name} × {quantity}</span>
            <span>${(product.price * quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="checkout-total">
          <span>Total</span>
          <span>${totalPrice().toFixed(2)}</span>
        </div>
      </div>

      <form className="checkout-form" onSubmit={handleSubmit}>
        <h3>Shipping Details</h3>

        <div className="form-group">
          <label>Full Name *</label>
          <input type="text" value={form.full_name} onChange={set('full_name')} placeholder="John Doe" required />
        </div>
        <div className="form-group">
          <label>Phone Number *</label>
          <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+1 234 567 890" required />
        </div>
        <div className="form-group">
          <label>Address *</label>
          <input type="text" value={form.address} onChange={set('address')} placeholder="123 Main St" required />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>City *</label>
            <input type="text" value={form.city} onChange={set('city')} placeholder="New York" required />
          </div>
          <div className="form-group">
            <label>Country *</label>
            <input type="text" value={form.country} onChange={set('country')} placeholder="US" required />
          </div>
        </div>
        <div className="form-group">
          <label>Notes (optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any delivery instructions..."
          />
        </div>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn-primary full" disabled={loading}>
          {loading ? 'Placing Order...' : `Place Order — $${totalPrice().toFixed(2)}`}
        </button>
      </form>
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
