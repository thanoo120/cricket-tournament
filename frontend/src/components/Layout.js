import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ─── SVG Icon Components ──────────────────────────────────────────────────────
const Icon = ({ path, size = 16, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" {...rest}>
    {path}
  </svg>
);

const Icons = {
  dashboard: <Icon path={<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>} />,
  trophy:    <Icon path={<><path d="M6 9H4a2 2 0 0 1-2-2V5h4"/><path d="M18 9h2a2 2 0 0 0 2-2V5h-4"/><path d="M8 21h8"/><path d="M12 17v4"/><path d="M6 5h12v7a6 6 0 0 1-12 0V5Z"/></>} />,
  scorer:    <Icon path={<><circle cx="12" cy="12" r="2"/><path d="M4.93 4.93a10 10 0 0 1 14.14 0"/><path d="M7.76 7.76a6 6 0 0 1 8.49 0"/><path d="M19.07 19.07a10 10 0 0 1-14.14 0"/><path d="M16.24 16.24a6 6 0 0 1-8.49 0"/></>} />,
  signal:    <Icon path={<><path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 4v16"/></>} />,
  calendar:  <Icon path={<><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>} />,
  overview:  <Icon path={<><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z"/><path d="M9 21V12h6v9"/></>} />,
  teams:     <Icon path={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>} />,
  players:   <Icon path={<><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></>} />,
  matches:   <Icon path={<><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/><path d="M5.5 5.5a10 10 0 0 1 13 0"/><path d="M18.5 18.5a10 10 0 0 1-13 0"/></>} />,
  leaderboard: <Icon path={<><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></>} />,
  logout:    <Icon path={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>} />,
  liveDot:   <Icon path={<circle cx="12" cy="12" r="5" fill="currentColor"/>} size={10} />,
};

export default function Layout({ children, isAdmin }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pubMenuOpen, setPubMenuOpen] = useState(false);

  const tidMatch = location.pathname.match(/\/tournaments\/(\d+)/);
  const tid = tidMatch ? tidMatch[1] : null;

  const mainNav = isAdmin ? [
    { to: '/admin/dashboard', icon: Icons.dashboard, label: 'Dashboard' },
    { to: '/admin/tournaments', icon: Icons.trophy, label: 'Tournaments' },
    { to: '/admin/scorer', icon: Icons.scorer, label: 'Live Scorer' },
  ] : [
    { to: '/dashboard', icon: Icons.signal, label: 'Live Dashboard' },
    { to: '/fixtures', icon: Icons.calendar, label: 'Fixtures' },
  ];

  const tournamentNav = tid ? (isAdmin ? [
    { to: `/admin/tournaments/${tid}`, icon: Icons.overview, label: 'Overview', exact: true },
    { to: `/admin/tournaments/${tid}/teams`, icon: Icons.teams, label: 'Teams' },
    { to: `/admin/tournaments/${tid}/players`, icon: Icons.players, label: 'Players' },
    { to: `/admin/tournaments/${tid}/matches`, icon: Icons.matches, label: 'Matches' },
    { to: `/admin/tournaments/${tid}/leaderboard`, icon: Icons.leaderboard, label: 'Leaderboard' },
  ] : [
    { to: `/tournaments/${tid}`, icon: Icons.overview, label: 'Overview', exact: true },
    { to: `/tournaments/${tid}/teams`, icon: Icons.teams, label: 'Teams' },
    { to: `/tournaments/${tid}/players`, icon: Icons.players, label: 'Players' },
    { to: `/tournaments/${tid}/leaderboard`, icon: Icons.leaderboard, label: 'Standings' },
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
            <div>
              <div className="logo-sub" style={{ fontSize: 11, marginTop: 2 }}>Admin Console</div>
            </div>
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
          {isAuthenticated && (
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
                style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 4, borderRadius: 6, transition: 'all 0.15s', display: 'flex', alignItems: 'center' }}
                onMouseOver={e => { e.currentTarget.style.background = 'var(--red-muted)'; e.currentTarget.style.color = 'var(--red)'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-3)'; }}>
                {Icons.logout}
              </button>
            </div>
          )}
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
                <img src="/urumari_logo.png" alt="Logo" />
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

            {/* Mobile floating menu */}
            {pubMenuOpen && (
              <>
                <div className="pub-mobile-backdrop" onClick={() => setPubMenuOpen(false)} />
                <div className="pub-mobile-menu">
                  <div className="pub-mobile-menu-header">
                    <img src="/urumari_logo.png" alt="Logo" className="pub-mobile-menu-logo" />
                    <div className="pub-mobile-menu-title">Tournament</div>
                  </div>
                  <div className="pub-mobile-menu-divider" />
                  <nav className="pub-mobile-menu-nav">
                    <NavLink to="/dashboard" className={({ isActive }) => `pub-mobile-link${isActive ? ' active' : ''}`}
                      onClick={() => setPubMenuOpen(false)}>
                      <span className="pub-mobile-link-icon">{Icons.signal}</span>
                      Live Scores
                    </NavLink>
                    <NavLink to="/fixtures" className={({ isActive }) => `pub-mobile-link${isActive ? ' active' : ''}`}
                      onClick={() => setPubMenuOpen(false)}>
                      <span className="pub-mobile-link-icon">{Icons.calendar}</span>
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
          <button className="icon-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
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
