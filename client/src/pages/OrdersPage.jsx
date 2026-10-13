import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import { api, errorMessage } from '../api.js';
import Notice from '../components/Notice.jsx';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { state } = useLocation();
  useEffect(() => {
    api.get('/orders/mine')
      .then(({ data }) => setOrders(data.orders))
      .catch((reason) => setError(errorMessage(reason)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="section-wrap content-page">
      <Link className="back-link" to="/"><ArrowLeft size={16} /> Back to menu</Link>
      <div className="section-heading page-heading"><div><span className="eyebrow">YOUR CAMPUS PICKUPS</span><h1>My orders<span className="heading-dot">.</span></h1></div></div>
      {state?.confirmation && <Notice kind="success">Order #{state.confirmation.id} placed! Your total is ₹{Number(state.confirmation.totalAmount).toFixed(2)}. Pay cash when you pick it up.</Notice>}
      {error && <Notice>{error}</Notice>}
      {loading ? <div className="loading-state"><span className="spinner" />Loading your orders...</div> :
        orders.length ? (
          <div className="order-list">
            {orders.map((order) => (
              <article className="order-card" key={order.id}>
                <div className="order-card-top"><div><span className="order-number">ORDER #{order.id}</span><h3>{new Date(order.createdAt).toLocaleString()}</h3></div><span className={`status-badge status-${order.status.toLowerCase().replaceAll(' ', '-')}`}>{order.status}</span></div>
                <div className="order-items">{order.items.map((item, index) => <span key={`${item.name}-${index}`}>{item.quantity} × {item.name}</span>)}</div>
                <div className="order-card-bottom"><span>Cash at pickup</span><strong>₹{Number(order.totalAmount).toFixed(2)}</strong></div>
              </article>
            ))}
          </div>
        ) : <div className="empty-state"><span className="empty-icon"><ClipboardList size={34} /></span><h3>No orders yet</h3><p>Your next campus favourite is just a few clicks away.</p><Link className="button button-primary" to="/">Explore the menu</Link></div>}
    </section>
  );
}
