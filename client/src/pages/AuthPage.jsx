import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '../AuthContext.jsx';
import { errorMessage } from '../api.js';
import Notice from '../components/Notice.jsx';

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { user, signIn, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const signedInUser = isRegister ? await register(form) : await signIn({ email: form.email, password: form.password });
      const destination = location.state?.from || (signedInUser.role === 'admin' ? '/admin' : '/');
      navigate(destination, { replace: true });
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <Link className="auth-brand" to="/"><span className="brand-mark"><UtensilsCrossed size={19} /></span> smart<span className="brand-accent">canteen</span></Link>
        <span className="eyebrow">{isRegister ? 'JOIN THE CAMPUS TABLE' : 'WELCOME BACK'}</span>
        <h1>{isRegister ? 'Create your account' : 'Good to see you.'}</h1>
        <p className="auth-description">{isRegister ? 'Sign up to order your campus favourites and keep track of every pickup.' : 'Sign in to order ahead or check in on your latest pickup.'}</p>
        {error && <Notice>{error}</Notice>}
        <form className="form-stack" onSubmit={submit}>
          {isRegister && <label>Your name<input required minLength="2" maxLength="100" autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>}
          <label>Email address<input required type="email" maxLength="254" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <label>Password<input required type="password" minLength={isRegister ? 8 : 1} maxLength="72" autoComplete={isRegister ? 'new-password' : 'current-password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /><small>{isRegister ? 'At least 8 characters.' : 'Your password is case-sensitive.'}</small></label>
          <button className="button button-primary button-full auth-submit" disabled={submitting} type="submit">{submitting ? 'Please wait...' : isRegister ? 'Create account' : 'Sign in'} <ArrowRight size={16} /></button>
        </form>
        <p className="auth-switch">{isRegister ? 'Already have an account?' : 'New to SmartCanteen?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create an account'}</Link></p>
        <Link className="auth-back" to="/">← Back to the menu</Link>
      </div>
      <div className="auth-decoration"><span className="auth-decoration-kicker">GOOD FOOD<br />IS A CAMPUS<br /><em>TRADITION.</em></span><span className="auth-food">🥗</span><span className="auth-decoration-footer">FRESHLY PREPARED · ALWAYS CLOSE BY</span></div>
    </section>
  );
}
