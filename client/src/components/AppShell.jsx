import { Link, NavLink, Outlet } from 'react-router-dom';
import { ArrowRight, ShoppingBag, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '../AuthContext.jsx';
import { useCart } from '../CartContext.jsx';

export default function AppShell() {
  const { user, signOut } = useAuth();
  const { count } = useCart();
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" to="/">
            <span className="brand-mark"><UtensilsCrossed size={20} /></span>
            <span>smart<span className="brand-accent">canteen</span><small>CAMPUS FOOD, MADE SIMPLE</small></span>
          </Link>
          <nav className="main-nav" aria-label="Main navigation">
            <NavLink to="/" end>Menu</NavLink>
            {user && user.role === 'student' && <NavLink to="/orders">My orders</NavLink>}
            {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
          </nav>
          <div className="header-actions">
            <Link className="cart-link" to="/cart" aria-label={`Cart, ${count} items`}>
              <ShoppingBag size={19} /><span>Cart</span><span className="cart-count">{count}</span>
            </Link>
            {user ? (
              <div className="user-menu">
                <span className="user-greeting">Hi, {user.name.split(' ')[0]}</span>
                <button className="button button-quiet" type="button" onClick={signOut}>Sign out</button>
              </div>
            ) : <Link className="button button-outline header-sign-in" to="/login">Sign in <ArrowRight size={15} /></Link>}
          </div>
        </div>
      </header>
      <main className="page-content"><Outlet /></main>
      <footer className="site-footer">
        <div><strong>smartcanteen</strong><span>Good food. Less waiting.</span></div>
        <span>Made for the campus community · Cash at pickup</span>
      </footer>
    </div>
  );
}
