import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children, isAdmin }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pubMenuOpen, setPubMenuOpen] = useState(false);

  const tidMatch = location.pathname.match(/\/tournaments\/(\d+)/);
  const tid = tidMatch ? tidMatch[1] : null;

  const mainNav = isAdmin ? [
    { to: '/admin/dashboard', icon: '⊙', label: 'Dashboard' },
    { to: '/admin/tournaments', icon: '🏆', label: 'Tournaments' },
    { to: '/admin/scorer', icon: '⚾', label: 'Live Scorer' },
  ] : [
    { to: '/dashboard', icon: '⊙', label: 'Live Dashboard' },
    { to: '/fixtures', icon: '⊞', label: 'Fixtures' },
  ];

  const tournamentNav = tid ? (isAdmin ? [
    { to: `/admin/tournaments/${tid}`, icon: '◻', label: 'Overview', exact: true },
    { to: `/admin/tournaments/${tid}/teams`, icon: '⊙', label: 'Teams' },
    { to: `/admin/tournaments/${tid}/players`, icon: '▸', label: 'Players' },
    { to: `/admin/tournaments/${tid}/matches`, icon: '◈', label: 'Matches' },
    { to: `/admin/tournaments/${tid}/leaderboard`, icon: '▲', label: 'Leaderboard' },
  ] : [
    { to: `/tournaments/${tid}`, icon: '◻', label: 'Overview', exact: true },
    { to: `/tournaments/${tid}/teams`, icon: '⊙', label: 'Teams' },
    { to: `/tournaments/${tid}/players`, icon: '▸', label: 'Players' },
    { to: `/tournaments/${tid}/leaderboard`, icon: '▲', label: 'Standings' },
  ]) : null;

  const handleLogout = () => { logout(); navigate('/dashboard'); };

  const isLiveConsolePage = location.pathname.includes('/score');

  return (
    <div className="app-layout">
      {isAdmin && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 199, backdropFilter: 'blur(2px)' }} />
      )}

      {/* Sidebar — admin only */}
      {isAdmin && <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/urumari_logo.png" alt="Logo" style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'contain', flexShrink: 0 }} />
            {isAdmin && (
              <div>
                <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 15, color: 'var(--text-1)', letterSpacing: 0.5 }}>Urumari</div>
                <div className="logo-sub">Admin Console</div>
              </div>
            )}
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">{isAdmin ? 'Admin' : 'Navigate'}</div>
          {mainNav.map(item => (
            <NavLink key={item.to + item.label} to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}>
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          {tournamentNav && (
            <>
              <div className="nav-section-label" style={{ marginTop: 8 }}>Tournament</div>
              {tournamentNav.map(item => (
                <NavLink key={item.to} to={item.to} end={item.exact}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}>
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="sidebar-bottom">
          {isAdmin && isAuthenticated && (
            <button className="create-match-btn"
              onClick={() => { navigate(tid ? `/admin/tournaments/${tid}/matches` : '/admin/tournaments'); setSidebarOpen(false); }}>
              {tid ? '+ New Match' : '+ New Tournament'}
            </button>
          )}
          {isAuthenticated ? (
            <div className="user-row">
              <div className="user-avatar" style={{
                background: 'var(--accent-muted)',
                border: '2px solid rgba(179,38,30,0.2)',
                color: 'var(--accent)',
                fontFamily: 'Rajdhani',
                fontWeight: 700,
                fontSize: 16,
              }}>
                {user?.name?.charAt(0) || '?'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name || 'User'}
                </div>
                <div className="user-role">{user?.role === 'ADMIN' ? 'Super Admin' : 'Scorer'}</div>
              </div>
              <button title="Sign out" aria-label="Sign out" onClick={handleLogout}
                style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 16, padding: 4, borderRadius: 6, transition: 'all 0.15s' }}
                onMouseOver={e => { e.currentTarget.style.background = 'var(--red-muted)'; e.currentTarget.style.color = 'var(--red)'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-3)'; }}>
                ⎋
              </button>
            </div>
          ) : null}
        </div>
      </aside>}

      {/* Main */}
      <main className={`main-content${isAdmin ? '' : ' main-content-public'}`}>
        {/* Admin top bar */}
        {isAdmin && (
          <div className="top-bar">
            <div className="top-bar-title-section">
              {isLiveConsolePage && (
                <span className="top-bar-page-title">
                  <span style={{ color: 'var(--red)', marginRight: 6, fontSize: 10 }}>●</span>
                  Live Console
                </span>
              )}
            </div>
            <div className="top-bar-right">
              {isAuthenticated && (
                <>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '5px 12px', borderRadius: 'var(--r-md)',
                    background: 'var(--card-bg2)', border: '1px solid var(--card-border)',
                  }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: 'var(--accent-muted)', border: '1.5px solid rgba(179,38,30,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: 'var(--accent)', fontFamily: 'Rajdhani',
                    }}>
                      {user?.name?.charAt(0)}
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>{user?.name}</span>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Sign out</button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Public sticky navbar */}
        {!isAdmin && (
          <header className="pub-navbar">
            <div className="pub-navbar-inner">
              <Link to="/dashboard" className="pub-navbar-logo" onClick={() => setPubMenuOpen(false)}>
                <img src="/urumari_logo.png" alt="Urumari" />
              </Link>

              {/* Desktop nav links */}
              <nav className="pub-navbar-links">
                <NavLink to="/dashboard" className={({ isActive }) => `pub-nav-link${isActive ? ' active' : ''}`}>
                  Live Scores
                </NavLink>
                <NavLink to="/fixtures" className={({ isActive }) => `pub-nav-link${isActive ? ' active' : ''}`}>
                  Fixtures
                </NavLink>
              </nav>
              <div className="pub-navbar-right">
                <Link to="/login" className="pub-nav-admin-btn">Admin Login</Link>
              </div>

              {/* Mobile hamburger */}
              <button className={`pub-hamburger${pubMenuOpen ? ' open' : ''}`} onClick={() => setPubMenuOpen(o => !o)} aria-label="Menu">
                <span /><span /><span />
              </button>
            </div>

            {/* Mobile floating menu — backdrop + card */}
            {pubMenuOpen && (
              <>
                <div className="pub-mobile-backdrop" onClick={() => setPubMenuOpen(false)} />
                <div className="pub-mobile-menu">
                  <div className="pub-mobile-menu-header">
                    <img src="/urumari_logo.png" alt="Urumari" className="pub-mobile-menu-logo" />
                    <div className="pub-mobile-menu-title">Urumari</div>
                  </div>
                  <div className="pub-mobile-menu-divider" />
                  <nav className="pub-mobile-menu-nav">
                    <NavLink to="/dashboard" className={({ isActive }) => `pub-mobile-link${isActive ? ' active' : ''}`}
                      onClick={() => setPubMenuOpen(false)}>
                      <span className="pub-mobile-link-icon">📺</span>
                      Live Scores
                    </NavLink>
                    <NavLink to="/fixtures" className={({ isActive }) => `pub-mobile-link${isActive ? ' active' : ''}`}
                      onClick={() => setPubMenuOpen(false)}>
                      <span className="pub-mobile-link-icon">📅</span>
                      Fixtures
                    </NavLink>
                  </nav>
                  <div className="pub-mobile-menu-divider" />
                  <Link to="/login" className="pub-mobile-admin-btn" onClick={() => setPubMenuOpen(false)}>
                    Admin Login
                  </Link>
                </div>
              </>
            )}
          </header>
        )}

        {/* Mobile top bar — admin only */}
        {isAdmin && <div className="mobile-topbar" style={{
          padding: '10px 14px', background: 'var(--sidebar-bg)',
          borderBottom: '1px solid var(--card-border)',
          alignItems: 'center', justifyContent: 'space-between',
        }}>
          <button className="icon-btn" onClick={() => setSidebarOpen(true)}>☰</button>
          <Link to="/dashboard" style={{ textDecoration: 'none' }}>
            <img src="/urumari_logo.png" alt="Logo" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'contain' }} />
          </Link>
          <div style={{ width: 34, display: 'flex', justifyContent: 'flex-end' }}>
            {isAuthenticated && (
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'var(--accent-muted)', border: '1.5px solid rgba(179,38,30,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: 'var(--accent)', fontFamily: 'Rajdhani',
              }}>
                {user?.name?.charAt(0)}
              </div>
            )}
          </div>
        </div>}

        {children}
      </main>
    </div>
  );
}
