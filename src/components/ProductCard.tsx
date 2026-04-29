import { Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import type { Product } from '../types';
import { tg } from '../lib/telegram';

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);
  const inCart = items.some((i) => i.product.id === product.id);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    tg?.HapticFeedback?.impactOccurred('light');
  };

  const discount = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : null;

  return (
    <Link to={`/product/${product.id}`} className="product-card">
      <div className="product-card-image">
        <img
          src={product.images[0] || 'https://images.pexels.com/photos/5632371/pexels-photo-5632371.jpeg'}
          alt={product.name}
          loading="lazy"
        />
        {discount && <span className="badge-discount">-{discount}%</span>}
        {product.stock === 0 && <span className="badge-out">Out of stock</span>}
      </div>
      <div className="product-card-body">
        <h3 className="product-card-name">{product.name}</h3>
        <div className="product-card-prices">
          <span className="price-current">${product.price.toFixed(2)}</span>
          {product.original_price && (
            <span className="price-original">${product.original_price.toFixed(2)}</span>
          )}
        </div>
        <button
          className={`btn-add ${inCart ? 'in-cart' : ''}`}
          onClick={handleAdd}
          disabled={product.stock === 0}
        >
          {inCart ? 'Added' : 'Add to Cart'}
        </button>
      </div>
    </Link>
  );
}
