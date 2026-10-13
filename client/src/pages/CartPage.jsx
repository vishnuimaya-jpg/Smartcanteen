import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { api, errorMessage } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { useCart } from '../CartContext.jsx';
import Notice from '../components/Notice.jsx';

export default function CartPage() {
  const { items, total, setQuantity, remove, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);

  async function checkout() {
    setError('');
    setPlacing(true);
    try {
      const { data } = await api.post('/orders', {
        paymentMethod: 'cash_at_pickup',
        items: items.map((item) => ({ foodItemId: item.id, quantity: item.quantity }))
      });
      clear();
      navigate('/orders', { state: { confirmation: data.order } });
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setPlacing(false);
    }
  }

  return (
    <section className="section-wrap content-page">
      <Link className="back-link" to="/"><ArrowLeft size={16} /> Back to menu</Link>
      <div className="section-heading page-heading">
        <div><span className="eyebrow">YOUR ORDER</span><h1>Your cart<span className="heading-dot">.</span></h1></div>
        <span className="menu-caption">{items.reduce((sum, item) => sum + item.quantity, 0)} items</span>
      </div>
      {error && <Notice>{error}</Notice>}
      {items.length === 0 ? (
        <div className="empty-state cart-empty"><span className="empty-icon"><ShoppingBag size={36} /></span><h3>Your cart is taking a little break</h3><p>Add something delicious from the menu to get started.</p><Link className="button button-primary" to="/">Browse the menu</Link></div>
      ) : (
        <div className="cart-layout">
          <div className="cart-list">
            {items.map((item) => (
              <article className="cart-item" key={item.id}>
                <div className="cart-food-icon">{item.imageUrl ? <img src={item.imageUrl} alt="" /> : '🍽️'}</div>
                <div className="cart-item-main"><span className="cart-category">{item.categoryName || 'Canteen favourite'}</span><h3>{item.name}</h3><span className="cart-unit-price">₹{Number(item.price).toFixed(2)} each</span></div>
                <div className="quantity-control">
                  <button type="button" aria-label={`Remove one ${item.name}`} onClick={() => setQuantity(item.id, item.quantity - 1)}><Minus size={14} /></button>
                  <span>{item.quantity}</span>
                  <button type="button" aria-label={`Add one ${item.name}`} disabled={item.quantity >= item.stock} onClick={() => setQuantity(item.id, item.quantity + 1)}><Plus size={14} /></button>
                </div>
                <strong className="cart-line-total">₹{(item.price * item.quantity).toFixed(2)}</strong>
                <button type="button" className="icon-button remove-item" aria-label={`Remove ${item.name}`} onClick={() => remove(item.id)}><Trash2 size={17} /></button>
              </article>
            ))}
            <Link className="back-link continue-shopping" to="/"><ArrowLeft size={15} /> Continue browsing</Link>
          </div>
          <aside className="checkout-card">
            <span className="eyebrow">PICKUP SUMMARY</span><h2>Order total</h2>
            <div className="summary-row"><span>Subtotal</span><strong>₹{total.toFixed(2)}</strong></div>
            <div className="summary-row"><span>Payment</span><strong>Cash at pickup</strong></div>
            <div className="summary-total"><span>Total</span><strong>₹{total.toFixed(2)}</strong></div>
            {!user ? (
              <div className="sign-in-prompt"><p>Sign in to place your order. Your cart will be here when you return.</p><Link to="/login" className="button button-primary button-full">Sign in to continue</Link></div>
            ) : user.role !== 'student' ? (
              <p className="muted-copy">Student accounts can place pickup orders. Sign out of the administrator account to continue.</p>
            ) : (
              <button className="button button-primary button-full checkout-button" type="button" disabled={placing} onClick={checkout}>
                {placing ? <><span className="spinner spinner-light" /> Placing order...</> : 'Place order · Cash at pickup'}
              </button>
            )}
            <p className="checkout-footnote">Your order total is confirmed by the canteen when you place it.</p>
          </aside>
        </div>
      )}
    </section>
  );
}
