import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Order, Product, OrderItem } from '../types';

type Tab = 'orders' | 'products';

const STATUS_FLOW: Order['status'][] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('orders');

  return (
    <div className="page admin-page">
      <h2 className="page-title">Admin Panel</h2>
      <div className="admin-tabs">
        <button className={`admin-tab ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}>
          Orders
        </button>
        <button className={`admin-tab ${tab === 'products' ? 'active' : ''}`} onClick={() => setTab('products')}>
          Products
        </button>
      </div>
      {tab === 'orders' ? <AdminOrders /> : <AdminProducts />}
    </div>
  );
}

function AdminOrders() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = async (orderId: string, status: Order['status']) => {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    qc.invalidateQueries({ queryKey: ['admin-orders'] });
  };

  const filtered = statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter);

  if (isLoading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="admin-orders">
      <div className="admin-filter-bar">
        {['all', ...STATUS_FLOW].map((s) => (
          <button
            key={s}
            className={`chip small ${statusFilter === s ? 'active' : ''}`}
            onClick={() => setStatusFilter(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><p>No orders</p></div>
      ) : (
        <div className="admin-orders-list">
          {filtered.map((order) => (
            <div key={order.id} className="admin-order-card">
              <div className="admin-order-header">
                <div>
                  <span className="order-id">#{order.id.slice(0, 8).toUpperCase()}</span>
                  <span className="order-date">
                    {new Date(order.created_at).toLocaleString()}
                  </span>
                </div>
                <span className={`status-badge ${order.status}`}>{order.status}</span>
              </div>

              <div className="admin-order-customer">
                <strong>{order.telegram_first_name} {order.telegram_last_name}</strong>
                {order.telegram_username && <span> @{order.telegram_username}</span>}
              </div>

              {(order.shipping_address as any)?.address && (
                <div className="admin-order-address">
                  {(order.shipping_address as any).address}, {(order.shipping_address as any).city}, {(order.shipping_address as any).country}
                  <br />
                  {(order.shipping_address as any).phone}
                </div>
              )}

              <div className="admin-order-items">
                {(order.items as OrderItem[]).map((item, i) => (
                  <span key={i} className="admin-item">{item.name} × {item.quantity}</span>
                ))}
              </div>

              <div className="admin-order-footer">
                <span className="order-total">${order.total_amount.toFixed(2)}</span>
                <select
                  value={order.status}
                  onChange={(e) => updateStatus(order.id, e.target.value as Order['status'])}
                  className="status-select"
                >
                  {STATUS_FLOW.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminProducts() {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const toggleActive = async (product: Product) => {
    await supabase.from('products').update({ is_active: !product.is_active }).eq('id', product.id);
    qc.invalidateQueries({ queryKey: ['admin-products'] });
    qc.invalidateQueries({ queryKey: ['products'] });
  };

  const updateStock = async (productId: string, stock: number) => {
    await supabase.from('products').update({ stock }).eq('id', productId);
    qc.invalidateQueries({ queryKey: ['admin-products'] });
    qc.invalidateQueries({ queryKey: ['products'] });
    setEditingId(null);
  };

  if (isLoading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="admin-products-list">
      {products.map((product) => (
        <div key={product.id} className="admin-product-card">
          <img
            src={product.images[0] || 'https://images.pexels.com/photos/5632371/pexels-photo-5632371.jpeg'}
            alt={product.name}
            className="admin-product-img"
          />
          <div className="admin-product-info">
            <p className="admin-product-name">{product.name}</p>
            <p className="admin-product-price">${product.price.toFixed(2)}</p>
            <div className="admin-product-actions">
              {editingId === product.id ? (
                <StockEditor
                  initialStock={product.stock}
                  onSave={(s) => updateStock(product.id, s)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <button className="btn-ghost small" onClick={() => setEditingId(product.id)}>
                  Stock: {product.stock}
                </button>
              )}
              <button
                className={`btn-toggle ${product.is_active ? 'active' : 'inactive'}`}
                onClick={() => toggleActive(product)}
              >
                {product.is_active ? 'Visible' : 'Hidden'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StockEditor({ initialStock, onSave, onCancel }: {
  initialStock: number;
  onSave: (stock: number) => void;
  onCancel: () => void;
}) {
  const [val, setVal] = useState(String(initialStock));
  return (
    <div className="stock-editor">
      <input
        type="number"
        value={val}
        min={0}
        onChange={(e) => setVal(e.target.value)}
        className="stock-input"
      />
      <button className="btn-save" onClick={() => onSave(Math.max(0, parseInt(val) || 0))}>Save</button>
      <button className="btn-ghost small" onClick={onCancel}>✕</button>
    </div>
  );
}
