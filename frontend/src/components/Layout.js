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
    { to: '/admin/dashboard', icon: '⊙', label: 'Live Dashboard' },
    { to: '/admin/tournaments', icon: '⊞', label: 'Match Center' },
    { to: '/admin/scorer', icon: '⚾', label: 'Scorer' },
  ] : [
    { to: '/dashboard', icon: '⊙', label: 'Live Dashboard' },
    { to: '/fixtures', icon: '⊞', label: 'Match Center' },
  ];

  const secondaryNav = isAdmin ? [
    { to: '/admin/dashboard', icon: '▤', label: 'Statistics' },
    { to: '/admin/dashboard', icon: '≡', label: 'Standings' },
    { to: '/admin/dashboard', icon: '⚙', label: 'Admin Console' },
    { to: '/admin/tournaments', icon: '⊕', label: 'Manage Teams' },
  ] : [
    { to: '/dashboard', icon: '▤', label: 'Statistics' },
    { to: '/dashboard', icon: '≡', label: 'Standings' },
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
    { to: '/admin/dashboard', label: 'Stats' },
    { to: '/admin/dashboard', label: 'Standings' },
  ] : [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/fixtures', label: 'Matches' },
    { to: '/dashboard', label: 'Stats' },
    { to: '/dashboard', label: 'Standings' },
  ];

  const isLiveConsolePage = location.pathname.includes('/score');

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 199 }} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-brand">CricLive</div>
          <div className="logo-sub">{isAdmin ? 'Admin Console' : 'Scorer Access'}</div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Main</div>
          {mainNav.map(item => (
            <NavLink key={item.to + item.label} to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}>
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          {secondaryNav.length > 0 && (
            <>
              <div className="nav-section-label" style={{ marginTop: 8 }}>Tools</div>
              {secondaryNav.map(item => (
                <NavLink key={item.label} to={item.to}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}>
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
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

          {!isAuthenticated && (
            <div style={{ padding: '8px 8px 0' }}>
              <NavLink to="/login" className="nav-item" onClick={() => setSidebarOpen(false)}>
                <span className="nav-icon">→</span>
                Admin Login
              </NavLink>
            </div>
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
              <div className="user-avatar">
                {user?.name?.charAt(0) || '?'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name || 'User'}
                </div>
                <div className="user-role">{user?.role === 'ADMIN' ? 'Super Admin' : 'Scorer Access'}</div>
              </div>
              <button title="Sign out" onClick={handleLogout}
                style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 14, padding: 4 }}>
                ⟲
              </button>
            </div>
          ) : (
            <div className="user-row">
              <div className="user-avatar">?</div>
              <div style={{ flex: 1 }}>
                <div className="user-name">Guest</div>
                <div className="user-role">Public View</div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        {/* Top bar */}
        <div className="top-bar">
          {/* Mobile menu + title */}
          <div className="top-bar-title-section">
            <button className="icon-btn mobile-topbar" style={{ display: 'none' }}
              onClick={() => setSidebarOpen(true)}>☰</button>
            {isLiveConsolePage && (
              <span className="top-bar-page-title">Live Console</span>
            )}
          </div>

          {/* Center nav */}
          <nav className="top-bar-nav">
            {topNavLinks.map(item => (
              <Link key={item.label} to={item.to}
                className={`top-bar-nav-item ${location.pathname === item.to ? 'active' : ''}`}>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right: search + icons */}
          <div className="top-bar-right">
            <div className="search-bar">
              <span style={{ color: 'var(--text-3)', fontSize: 13 }}>⌕</span>
              <input placeholder="Search data..." />
            </div>
            <button className="icon-btn" title="Settings">⚙</button>
            <button className="icon-btn" title="Profile"
              style={{ borderRadius: '50%', fontWeight: 700, fontSize: 13, color: isAuthenticated ? 'var(--accent)' : 'var(--text-3)' }}>
              {isAuthenticated ? (user?.name?.charAt(0) || '?') : '?'}
            </button>
          </div>
        </div>

        {/* Mobile top bar */}
        <div className="mobile-topbar" style={{ padding: '10px 14px', background: 'var(--sidebar-bg)', borderBottom: '1px solid var(--card-border)', alignItems: 'center', justifyContent: 'space-between' }}>
          <button className="icon-btn" onClick={() => setSidebarOpen(true)}>☰</button>
          <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, color: 'var(--accent)', fontSize: 22, letterSpacing: 1 }}>CricLive</span>
          <div style={{ width: 34 }} />
        </div>

        {children}
      </main>
    </div>
  );
}
