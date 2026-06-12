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
    return <Navigate to={isAdmin ? '/admin/dashboard' : '/admin/tournaments'} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(form.username, form.password);
      if (result.ok) {
        navigate(result.role === 'SCORER' ? '/admin/tournaments' : '/admin/dashboard');
      }
    } catch (err) {
      setError(
        err.response?.data?.error || 'Invalid username or password'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/urumari_logo.png" alt="Logo" style={{ width: 80, height: 80, borderRadius: 16, objectFit: 'contain', marginBottom: 12 }} />
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
