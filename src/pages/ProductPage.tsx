import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useCartStore } from '../store/cartStore';
import type { Product } from '../types';
import { tg } from '../lib/telegram';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeImage, setActiveImage] = useState(0);
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(*)')
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const cartItem = items.find((i) => i.product.id === id);
  const quantity = cartItem?.quantity ?? 0;

  const handleAdd = () => {
    if (!product) return;
    addItem(product);
    tg?.HapticFeedback?.impactOccurred('medium');
  };

  const handleBuyNow = () => {
    if (!product) return;
    addItem(product);
    navigate('/cart');
  };

  if (isLoading) return <div className="page-loading"><div className="spinner" /></div>;
  if (!product) return <div className="page"><div className="empty-state">Product not found</div></div>;

  const discount = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : null;

  return (
    <div className="page product-page">
      <button className="back-btn" onClick={() => navigate(-1)}>
        <BackIcon /> Back
      </button>

      <div className="product-images">
        <div className="product-image-main">
          <img
            src={product.images[activeImage] || 'https://images.pexels.com/photos/5632371/pexels-photo-5632371.jpeg'}
            alt={product.name}
          />
          {discount && <span className="badge-discount large">-{discount}%</span>}
        </div>
        {product.images.length > 1 && (
          <div className="product-image-thumbs">
            {product.images.map((img, i) => (
              <button
                key={i}
                className={`thumb ${i === activeImage ? 'active' : ''}`}
                onClick={() => setActiveImage(i)}
              >
                <img src={img} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="product-detail">
        {product.categories && (
          <span className="product-category-label">{(product.categories as any).name}</span>
        )}
        <h1 className="product-detail-name">{product.name}</h1>

        <div className="product-detail-prices">
          <span className="price-current large">${product.price.toFixed(2)}</span>
          {product.original_price && (
            <span className="price-original">${product.original_price.toFixed(2)}</span>
          )}
        </div>

        <div className="product-stock">
          {product.stock > 0 ? (
            <span className="in-stock">In Stock ({product.stock} left)</span>
          ) : (
            <span className="out-of-stock">Out of Stock</span>
          )}
        </div>

        {product.description && (
          <div className="product-description">
            <h3>Description</h3>
            <p>{product.description}</p>
          </div>
        )}

        {product.tags.length > 0 && (
          <div className="product-tags">
            {product.tags.map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        )}

        {quantity > 0 && (
          <div className="cart-notice">
            {quantity} item{quantity > 1 ? 's' : ''} in cart
          </div>
        )}

        <div className="product-actions">
          <button
            className="btn-primary"
            onClick={handleAdd}
            disabled={product.stock === 0}
          >
            {quantity > 0 ? `Add More (+${quantity})` : 'Add to Cart'}
          </button>
          <button
            className="btn-secondary"
            onClick={handleBuyNow}
            disabled={product.stock === 0}
          >
            Buy Now
          </button>
        </div>
      </div>
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
