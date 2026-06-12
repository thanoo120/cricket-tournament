import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTournaments, getMatches, getTournamentStats, updateTournamentStatus } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const [tournaments, setTournaments] = useState([]);
  const [stats, setStats] = useState({});
  const [liveMatches, setLiveMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const tr = await getTournaments();
      setTournaments(tr.data);
      // Load stats & live matches for first ongoing tournament
      const ongoing = tr.data.find(t => t.status === 'ONGOING') || tr.data[0];
      if (ongoing) {
        const [sr, mr] = await Promise.all([getTournamentStats(ongoing.id), getMatches(ongoing.id)]);
        setStats(sr.data);
        setLiveMatches(mr.data.filter(m => m.status === 'LIVE'));
      }
    } catch (e) {}
    setLoading(false);
  };

  const toggleStatus = async (t) => {
    const next = t.status === 'UPCOMING' ? 'ONGOING' : t.status === 'ONGOING' ? 'COMPLETED' : 'UPCOMING';
    await updateTournamentStatus(t.id, next);
    load();
  };

  if (loading) return <div className="loading"><div className="spinner" /><span>Loading admin panel...</span></div>;

  const completed = tournaments.filter(t => t.status === 'COMPLETED').length;
  const ongoing = tournaments.filter(t => t.status === 'ONGOING').length;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div>
            <div className="page-header-title">Admin Dashboard</div>
            <div className="page-header-sub">Welcome back, {user?.name}</div>
          </div>
        </div>
        <div className="page-header-right">
          {isAdmin && (
            <Link to="/admin/tournaments" className="btn btn-primary">
              + New Tournament
            </Link>
          )}
        </div>
      </div>

      <div className="page-content">
        {/* Quick stats */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-card-icon">🏆</div>
            <div className="stat-value">{tournaments.length}</div>
            <div className="stat-label">Tournaments</div>
            <div className="stat-sub">{ongoing} ongoing · {completed} completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon">🎯</div>
            <div className="stat-value" style={{ color: 'var(--cyan)' }}>{stats.totalMatches || 0}</div>
            <div className="stat-label">Matches</div>
            <div className="stat-sub">{stats.completedMatches || 0} played</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon">🏃</div>
            <div className="stat-value" style={{ color: 'var(--green)' }}>{stats.totalRuns?.toLocaleString() || 0}</div>
            <div className="stat-label">Total Runs</div>
            <div className="stat-sub">scored across matches</div>
          </div>
          {liveMatches.length > 0 && (
            <div className="stat-card" style={{ borderColor: 'rgba(255,23,68,0.4)' }}>
              <div className="stat-card-icon" style={{ background: 'var(--red-muted)' }}>📡</div>
              <div className="stat-value" style={{ color: 'var(--red)' }}>{liveMatches.length}</div>
              <div className="stat-label">Live Now</div>
              <div className="stat-sub">needs scoring</div>
            </div>
          )}
        </div>

        {/* Live matches alert */}
        {liveMatches.length > 0 && (
          <div className="alert alert-danger" style={{ marginBottom: 20 }}>
            <span>📡</span>
            <strong>{liveMatches.length} match{liveMatches.length > 1 ? 'es' : ''} in progress</strong>
            <span style={{ marginLeft: 8, fontSize: 12 }}>— Go to Matches to update live scores</span>
            {tournaments.find(t => t.status === 'ONGOING') && (
              <Link to={`/admin/tournaments/${tournaments.find(t => t.status === 'ONGOING').id}/matches`}
                className="btn btn-danger btn-sm" style={{ marginLeft: 'auto' }}>
                Score Now →
              </Link>
            )}
          </div>
        )}

        {/* Credential info for admin */}
        <div className="alert alert-warning" style={{ marginBottom: 24 }}>
          <span>🔑</span>
          <div>
            <strong>Demo Credentials</strong>
            <div style={{ fontSize: 12, marginTop: 3 }}>Admin: admin / cricket@2025 &nbsp;|&nbsp; Scorer: scorer / scorer@2025</div>
          </div>
        </div>

        {/* Tournaments table */}
        <div className="section-title">🏆 All Tournaments</div>
        {tournaments.length === 0 ? (
          <div className="card"><div className="empty-state">
            <div className="empty-state-icon">🏆</div>
            <h3>No tournaments yet</h3>
            <p>Create your first tournament to get started</p>
            <Link to="/admin/tournaments" className="btn btn-primary" style={{ marginTop: 16 }}>Create Tournament</Link>
          </div></div>
        ) : (
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th>Tournament</th>
                  <th>Location</th>
                  <th className="center">Status</th>
                  <th className="center">Teams</th>
                  <th className="center">Matches</th>
                  <th className="right">Actions</th>
                </tr></thead>
                <tbody>
                  {tournaments.map(t => (
                    <tr key={t.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{t.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                          {t.startDate} → {t.endDate}
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-2)' }}>📍 {t.location}</td>
                      <td className="center">
                        <span className={`badge badge-${t.status.toLowerCase()}`}>{t.status}</span>
                      </td>
                      <td className="center td-mono">{t.teamCount || 0}</td>
                      <td className="center td-mono">{t.matchCount || 0}</td>
                      <td className="right">
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <Link to={`/admin/tournaments/${t.id}/matches`} className="btn btn-secondary btn-sm">Matches</Link>
                          <Link to={`/admin/tournaments/${t.id}`} className="btn btn-ghost btn-sm">Manage</Link>
                          {isAdmin && (
                            <button className="btn btn-ghost btn-sm" onClick={() => toggleStatus(t)}
                              title={`Set to ${t.status === 'UPCOMING' ? 'ONGOING' : t.status === 'ONGOING' ? 'COMPLETED' : 'UPCOMING'}`}>
                              ⟳
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div style={{ marginTop: 28 }}>
          <div className="section-title">⚡ Quick Actions</div>
          <div className="grid-3">
            {[
              { icon: '🏆', title: 'New Tournament', desc: 'Create a tournament and set up fixtures', to: '/admin/tournaments', color: 'var(--gold-glow)' },
              { icon: '🛡', title: 'Manage Teams', desc: 'Add teams, assign colors and players', to: tournaments[0] ? `/admin/tournaments/${tournaments[0]?.id}/teams` : '/admin/tournaments', color: 'var(--blue-muted)' },
              { icon: '🎯', title: 'Score Matches', desc: 'Enter ball-by-ball live scores', to: tournaments.find(t => t.status === 'ONGOING') ? `/admin/tournaments/${tournaments.find(t => t.status === 'ONGOING').id}/matches` : '/admin/tournaments', color: 'var(--red-muted)' },
            ].map(a => (
              <Link to={a.to} key={a.title} className="card" style={{ display: 'block', padding: 20, textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(212,160,23,0.3)'}
                onMouseOut={e => e.currentTarget.style.borderColor = 'var(--card-border)'}>
                <div style={{ width: 42, height: 42, borderRadius: 'var(--r-md)', background: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 12 }}>
                  {a.icon}
                </div>
                <div style={{ fontFamily: 'Rajdhani', fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{a.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{a.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
