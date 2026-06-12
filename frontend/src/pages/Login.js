import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [tab, setTab] = useState('admin');
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Already logged in — bounce to appropriate dashboard
  if (isAuthenticated) {
    return <Navigate to={isAdmin ? '/admin/dashboard' : '/admin/scorer'} replace />;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const result = login(form.username, form.password);
      if (result.ok) {
        navigate(result.role === 'SCORER' ? '/admin/scorer' : '/admin/dashboard');
      } else {
        setError(result.error);
      }
      setLoading(false);
    }, 600);
  };

  const fillDemo = (role) => {
    if (role === 'admin') setForm({ username: 'admin', password: 'cricket@2025' });
    else setForm({ username: 'scorer', password: 'scorer@2025' });
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-brand">CricLive</div>
          <p>Tournament Management System</p>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'admin' ? 'active' : ''}`} onClick={() => { setTab('admin'); setForm({ username: '', password: '' }); }}>
            👑 Admin
          </button>
          <button className={`auth-tab ${tab === 'scorer' ? 'active' : ''}`} onClick={() => { setTab('scorer'); setForm({ username: '', password: '' }); }}>
            🎯 Scorer
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }} onClick={() => fillDemo('admin')}>
            Use Admin Demo
          </button>
          <button className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }} onClick={() => fillDemo('scorer')}>
            Use Scorer Demo
          </button>
        </div>

        {error && <div className="auth-error">⚠ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              type="text"
              placeholder={tab === 'admin' ? 'admin' : 'scorer'}
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Enter password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '11px' }} type="submit" disabled={loading}>
            {loading ? '⟳ Signing in...' : '→ Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 24, padding: '16px', background: 'var(--card-bg2)', borderRadius: 'var(--r-md)', border: '1px solid var(--card-border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Demo Credentials</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.8 }}>
            <div><strong style={{ color: 'var(--accent)' }}>Admin:</strong> admin / cricket@2025</div>
            <div><strong style={{ color: 'var(--blue)' }}>Scorer:</strong> scorer / scorer@2025</div>
          </div>
        </div>

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <Link to="/dashboard" style={{ fontSize: 12, color: 'var(--text-3)', transition: 'color 0.15s' }}
            onMouseOver={e => e.target.style.color = 'var(--accent)'}
            onMouseOut={e => e.target.style.color = 'var(--text-3)'}>
            ← Back to public dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
