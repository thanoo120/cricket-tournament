import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

const CREDENTIALS = {
  admin: { password: 'cricket@2025', role: 'ADMIN', name: 'Administrator' },
  scorer: { password: 'scorer@2025', role: 'SCORER', name: 'Match Scorer' },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cric_user')); } catch { return null; }
  });

  const login = (username, password) => {
    const cred = CREDENTIALS[username.toLowerCase()];
    if (cred && cred.password === password) {
      const u = { username: username.toLowerCase(), role: cred.role, name: cred.name };
      setUser(u);
      localStorage.setItem('cric_user', JSON.stringify(u));
      return { ok: true };
    }
    return { ok: false, error: 'Invalid username or password' };
  };

  const logout = () => { setUser(null); localStorage.removeItem('cric_user'); };

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
