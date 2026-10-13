import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('smartcanteen_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api.get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem('smartcanteen_token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    async signIn(credentials) {
      const { data } = await api.post('/auth/login', credentials);
      localStorage.setItem('smartcanteen_token', data.token);
      setUser(data.user);
      return data.user;
    },
    async register(details) {
      const { data } = await api.post('/auth/register', details);
      localStorage.setItem('smartcanteen_token', data.token);
      setUser(data.user);
      return data.user;
    },
    signOut() {
      localStorage.removeItem('smartcanteen_token');
      setUser(null);
    }
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
