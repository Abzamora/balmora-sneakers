import { createContext, useContext, useEffect, useState } from 'react';
import { loginAdmin as loginRequest, fetchMe } from '../api/api';

const AuthContext = createContext(null);

/**
 * Holds the logged-in admin's identity and exposes login/logout.
 * The JWT itself lives in sessionStorage (cleared when the tab closes),
 * which is a reasonable tradeoff for a small admin panel: simpler than
 * httpOnly cookies + CSRF handling, safer than localStorage persisting
 * indefinitely across sessions on a shared device.
 */
export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('admin_token');
    if (!token) {
      setLoading(false);
      return;
    }
    fetchMe()
      .then(setAdmin)
      .catch(() => setAdmin(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(username, password) {
    const data = await loginRequest({ username, password });
    sessionStorage.setItem('admin_token', data.token);
    setAdmin({ id: data.id, username: data.username, role: data.role });
    return data;
  }

  function logout() {
    sessionStorage.removeItem('admin_token');
    setAdmin(null);
  }

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
