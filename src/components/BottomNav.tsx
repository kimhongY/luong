import { Link, useLocation } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';

export default function BottomNav() {
  const location = useLocation();
  const totalItems = useCartStore((s) => s.totalItems());

  const links = [
    { to: '/', label: 'Shop', icon: HomeIcon },
    { to: '/orders', label: 'Orders', icon: OrderIcon },
    { to: '/cart', label: 'Cart', icon: CartIcon, badge: totalItems },
  ];

  return (
    <nav className="bottom-nav">
      {links.map(({ to, label, icon: Icon, badge }) => {
        const active = location.pathname === to;
        return (
          <Link key={to} to={to} className={`bottom-nav-item ${active ? 'active' : ''}`}>
            <span className="bottom-nav-icon">
              <Icon />
              {badge != null && badge > 0 && (
                <span className="badge">{badge > 99 ? '99+' : badge}</span>
              )}
            </span>
            <span className="bottom-nav-label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function OrderIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6" />
    </svg>
  );
}
