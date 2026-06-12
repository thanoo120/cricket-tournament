import React, { createContext, useContext, useState } from 'react';
import { loginApi } from '../services/api';

const AuthContext = createContext(null);

function loadUser() {
  try { return JSON.parse(localStorage.getItem('cric_user')); } catch { return null; }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser);

  const login = async (username, password) => {
    const res = await loginApi(username, password);
    const { token, role, name, username: uname } = res.data;
    const u = { username: uname, role, name };
    localStorage.setItem('cric_token', token);
    localStorage.setItem('cric_user', JSON.stringify(u));
    setUser(u);
    return { ok: true, role };
  };

  const logout = () => {
    localStorage.removeItem('cric_token');
    localStorage.removeItem('cric_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAdmin: user?.role === 'ADMIN',
      isScorer: ['ADMIN', 'SCORER'].includes(user?.role),
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
