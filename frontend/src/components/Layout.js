import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children, isAdmin }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const tidMatch = location.pathname.match(/\/tournaments\/(\d+)/);
  const tid = tidMatch ? tidMatch[1] : null;

  const mainNav = isAdmin ? [
    { to: '/admin/dashboard', icon: '⊙', label: 'Dashboard' },
    { to: '/admin/tournaments', icon: '⊞', label: 'Matches' },
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

  const topNavLinks = isAdmin ? [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/tournaments', label: 'Matches' },
    { to: '/admin/scorer', label: 'Scorer' },
  ] : [
    { to: '/dashboard', label: 'Results' },
    { to: '/fixtures', label: 'Fixtures' },
  ];

  const isLiveConsolePage = location.pathname.includes('/score');

  return (
    <div className="app-layout">
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 199 }} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-brand">CricLive</div>
          <div className="logo-sub">{isAdmin ? 'Admin Console' : 'Live Scores & Results'}</div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">{isAdmin ? 'Admin' : 'Public'}</div>
          {mainNav.map(item => (
            <NavLink key={item.to + item.label} to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}>
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className="nav-section-label" style={{ marginTop: 8 }}>Manage</div>
              <NavLink to="/admin/tournaments"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}>
                <span className="nav-icon">⊕</span>
                Tournaments
              </NavLink>
            </>
          )}

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
              + Create New Match
            </button>
          )}
          {isAuthenticated ? (
            <div className="user-row">
              <div className="user-avatar">{user?.name?.charAt(0) || '?'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name || 'User'}
                </div>
                <div className="user-role">{user?.role === 'ADMIN' ? 'Super Admin' : 'Scorer'}</div>
              </div>
              <button title="Sign out" aria-label="Sign out" onClick={handleLogout}
                style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 16, padding: 4 }}>
                ⎋
              </button>
            </div>
          ) : null}
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        <div className="top-bar">
          <div className="top-bar-title-section">
            {isLiveConsolePage && (
              <span className="top-bar-page-title">Live Console</span>
            )}
          </div>

          <nav className="top-bar-nav">
            {topNavLinks.map(item => (
              <Link key={item.label} to={item.to}
                className={`top-bar-nav-item ${location.pathname === item.to ? 'active' : ''}`}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="top-bar-right">
            {isAuthenticated && (
              <>
                <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{user?.name}</span>
                <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Sign out</button>
              </>
            )}
          </div>
        </div>

        {/* Mobile top bar */}
        <div className="mobile-topbar" style={{ padding: '10px 14px', background: 'var(--sidebar-bg)', borderBottom: '1px solid var(--card-border)', alignItems: 'center', justifyContent: 'space-between' }}>
          <button className="icon-btn" onClick={() => setSidebarOpen(true)}>☰</button>
          <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, color: 'var(--accent)', fontSize: 22, letterSpacing: 1 }}>CricLive</span>
          <div style={{ width: 34 }}>
            {isAuthenticated && (
              <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>{user?.name?.charAt(0)}</span>
            )}
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
