import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { getCurrentUser } from '../lib/telegram';
import type { Order, OrderItem } from '../types';

export default function OrdersPage() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['orders', user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('telegram_user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page">
      <h2 className="page-title">My Orders</h2>

      {orders.length === 0 ? (
        <div className="empty-state">
          <OrderEmptyIcon />
          <p>No orders yet</p>
          <button className="btn-primary" onClick={() => navigate('/')}>
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-card-header">
                <div>
                  <span className="order-id">#{order.id.slice(0, 8).toUpperCase()}</span>
                  <span className="order-date">
                    {new Date(order.created_at).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'short', day: 'numeric',
                    })}
                  </span>
                </div>
                <span className={`status-badge ${order.status}`}>{order.status}</span>
              </div>

              <div className="order-items-preview">
                {(order.items as OrderItem[]).slice(0, 3).map((item, i) => (
                  <img
                    key={i}
                    src={item.image || 'https://images.pexels.com/photos/5632371/pexels-photo-5632371.jpeg'}
                    alt={item.name}
                    className="order-thumb"
                  />
                ))}
                {(order.items as OrderItem[]).length > 3 && (
                  <span className="order-more">+{(order.items as OrderItem[]).length - 3}</span>
                )}
              </div>

              <div className="order-card-footer">
                <span>{(order.items as OrderItem[]).length} item{(order.items as OrderItem[]).length !== 1 ? 's' : ''}</span>
                <span className="order-total">${order.total_amount.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OrderEmptyIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3, marginBottom: '16px' }}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}
