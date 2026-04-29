import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Order } from '../types';

export default function OrderSuccessPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: order } = useQuery<Order>({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  return (
    <div className="page success-page">
      <div className="success-icon">
        <CheckCircleIcon />
      </div>
      <h2>Order Placed!</h2>
      <p className="success-sub">Your order has been received and is being processed.</p>

      {order && (
        <div className="order-detail-card">
          <div className="order-detail-row">
            <span>Order ID</span>
            <span className="order-id">#{order.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="order-detail-row">
            <span>Total</span>
            <span>${order.total_amount.toFixed(2)}</span>
          </div>
          <div className="order-detail-row">
            <span>Status</span>
            <span className={`status-badge ${order.status}`}>{order.status}</span>
          </div>
          <div className="order-detail-row">
            <span>Items</span>
            <span>{(order.items as any[]).length} item{(order.items as any[]).length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      <div className="success-actions">
        <button className="btn-primary" onClick={() => navigate('/orders')}>
          View My Orders
        </button>
        <button className="btn-secondary" onClick={() => navigate('/')}>
          Continue Shopping
        </button>
      </div>
    </div>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
