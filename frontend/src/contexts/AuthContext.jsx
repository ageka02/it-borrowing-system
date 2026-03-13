import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('admin_token'));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('admin_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  // Verify token on mount
  useEffect(() => {
    if (token && !user) {
      setLoading(true);
      authAPI
        .getMe()
        .then((res) => {
          setUser(res.data);
          localStorage.setItem('admin_user', JSON.stringify(res.data));
        })
        .catch(() => {
          setToken(null);
          setUser(null);
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
        })
        .finally(() => setLoading(false));
    }
  }, [token, user]);

  const login = useCallback(async (username, password) => {
    const res = await authAPI.login(username, password);
    const { access_token, username: uname } = res.data;
    setToken(access_token);
    setUser({ username: uname });
    localStorage.setItem('admin_token', access_token);
    localStorage.setItem('admin_user', JSON.stringify({ username: uname }));
    return res.data;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
