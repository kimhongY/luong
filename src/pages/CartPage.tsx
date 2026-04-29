import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { tg } from '../lib/telegram';

export default function CartPage() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCartStore();

  const handleCheckout = () => {
    if (items.length === 0) return;
    tg?.HapticFeedback?.impactOccurred('medium');
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="page">
        <h2 className="page-title">Cart</h2>
        <div className="empty-state">
          <CartEmptyIcon />
          <p>Your cart is empty</p>
          <button className="btn-primary" onClick={() => navigate('/')}>
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page cart-page">
      <div className="cart-header">
        <h2 className="page-title">Cart</h2>
        <button className="btn-ghost" onClick={clearCart}>Clear all</button>
      </div>

      <div className="cart-items">
        {items.map(({ product, quantity }) => (
          <div key={product.id} className="cart-item">
            <img
              src={product.images[0] || 'https://images.pexels.com/photos/5632371/pexels-photo-5632371.jpeg'}
              alt={product.name}
              className="cart-item-img"
              onClick={() => navigate(`/product/${product.id}`)}
            />
            <div className="cart-item-info">
              <p className="cart-item-name" onClick={() => navigate(`/product/${product.id}`)}>
                {product.name}
              </p>
              <p className="cart-item-price">${product.price.toFixed(2)}</p>
              <div className="quantity-control">
                <button
                  onClick={() => updateQuantity(product.id, quantity - 1)}
                  className="qty-btn"
                >−</button>
                <span className="qty-value">{quantity}</span>
                <button
                  onClick={() => updateQuantity(product.id, quantity + 1)}
                  className="qty-btn"
                  disabled={quantity >= product.stock}
                >+</button>
              </div>
            </div>
            <div className="cart-item-right">
              <p className="cart-item-total">${(product.price * quantity).toFixed(2)}</p>
              <button className="remove-btn" onClick={() => removeItem(product.id)}>
                <TrashIcon />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="summary-row">
          <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
          <span>${totalPrice().toFixed(2)}</span>
        </div>
        <div className="summary-row total">
          <span>Total</span>
          <span>${totalPrice().toFixed(2)}</span>
        </div>
        <button className="btn-primary full" onClick={handleCheckout}>
          Checkout
        </button>
      </div>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

function CartEmptyIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3, marginBottom: '16px' }}>
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6" />
    </svg>
  );
}
