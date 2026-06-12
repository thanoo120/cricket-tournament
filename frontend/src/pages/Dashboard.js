import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTournaments, getTournamentStats, getMatches } from '../services/api';

export default function Dashboard() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentMatches, setRecentMatches] = useState([]);

  useEffect(() => {
    getTournaments().then(res => {
      setTournaments(res.data);
      if (res.data.length > 0) {
        const t = res.data[0];
        getTournamentStats(t.id).then(s => setStats(s.data));
        getMatches(t.id).then(m => setRecentMatches(m.data.slice(-3).reverse()));
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner"></div>Loading...</div>;

  const ongoing = tournaments.filter(t => t.status === 'ONGOING');
  const upcoming = tournaments.filter(t => t.status === 'UPCOMING');

  return (
    <div>
      <div className="top-bar">
        <span className="top-bar-title">Dashboard</span>
        <div className="top-bar-right">
          <Link to="/tournaments" className="btn btn-primary">+ New Tournament</Link>
        </div>
      </div>
      <div className="page-content">

        {/* Hero stats */}
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-label">Tournaments</div>
            <div className="stat-value" style={{ color: 'var(--accent)' }}>{tournaments.length}</div>
            <div className="stat-sub">{ongoing.length} ongoing</div>
          </div>
          {stats && (
            <>
              <div className="stat-card">
                <div className="stat-label">Matches Played</div>
                <div className="stat-value" style={{ color: 'var(--blue)' }}>{stats.completedMatches}</div>
                <div className="stat-sub">of {stats.totalMatches} scheduled</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Total Runs</div>
                <div className="stat-value" style={{ color: 'var(--win-green)' }}>{stats.totalRuns}</div>
                <div className="stat-sub">across all matches</div>
              </div>
              {stats.liveMatches > 0 && (
                <div className="stat-card" style={{ border: '1px solid var(--live-red)' }}>
                  <div className="stat-label">Live Now</div>
                  <div className="stat-value" style={{ color: 'var(--live-red)' }}>{stats.liveMatches}</div>
                  <div className="stat-sub">match{stats.liveMatches > 1 ? 'es' : ''} in progress</div>
                </div>
              )}
            </>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Active Tournaments */}
          <div className="card">
            <div className="card-header">
              <h3>Tournaments</h3>
              <Link to="/tournaments" className="btn btn-secondary btn-sm">View All</Link>
            </div>
            <div>
              {tournaments.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🏆</div>
                  <p>No tournaments yet</p>
                </div>
              ) : (
                tournaments.map(t => (
                  <Link key={t.id} to={`/tournaments/${t.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                          📍 {t.location} · {t.totalTeams} teams · {t.totalMatches} matches
                        </div>
                      </div>
                      <span className={`badge badge-${t.status?.toLowerCase()}`}>{t.status}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Top Performers */}
          <div className="card">
            <div className="card-header"><h3>Top Performers</h3></div>
            <div className="card-body">
              {stats?.topScorer && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Top Scorer</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-elevated)', padding: '12px', borderRadius: 8 }}>
                    <div className="player-mini">
                      <div className="player-avatar">{stats.topScorer.name[0]}</div>
                      <div className="player-info">
                        <div className="player-name">{stats.topScorer.name}</div>
                        <div className="player-role">{stats.topScorer.teamName}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Oswald, sans-serif', color: 'var(--accent)' }}>{stats.topScorer.totalRuns}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>runs</div>
                    </div>
                  </div>
                </div>
              )}
              {stats?.topWicketTaker && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Top Wicket Taker</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-elevated)', padding: '12px', borderRadius: 8 }}>
                    <div className="player-mini">
                      <div className="player-avatar">{stats.topWicketTaker.name[0]}</div>
                      <div className="player-info">
                        <div className="player-name">{stats.topWicketTaker.name}</div>
                        <div className="player-role">{stats.topWicketTaker.teamName}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Oswald, sans-serif', color: 'var(--win-green)' }}>{stats.topWicketTaker.totalWickets}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>wickets</div>
                    </div>
                  </div>
                </div>
              )}
              {!stats?.topScorer && (
                <div className="empty-state" style={{ padding: 24 }}>
                  <p>No player data yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Matches */}
        {recentMatches.length > 0 && (
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-header"><h3>Recent Matches</h3></div>
            <div className="card-body" style={{ padding: '12px 20px' }}>
              {recentMatches.map(m => (
                <Link key={m.id} to={`/matches/${m.id}`} style={{ textDecoration: 'none' }}>
                  <div className={`match-card ${m.status === 'LIVE' ? 'live' : ''}`}>
                    <div className="match-meta">
                      <span className={`badge badge-${m.status?.toLowerCase()}`}>{m.status}</span>
                      <span>📍 {m.venue}</span>
                      <span>🕐 {m.matchNumber}</span>
                    </div>
                    <div className="match-teams">
                      <div className="match-team">
                        <div className="match-team-name">{m.team1?.shortName}</div>
                        {m.team1Score > 0 && <div className="match-score">{m.team1Score}/{m.team1Wickets}</div>}
                        {m.team1Overs > 0 && <div className="match-overs">({m.team1Overs} ov)</div>}
                      </div>
                      <div className="match-vs">VS</div>
                      <div className="match-team right">
                        <div className="match-team-name">{m.team2?.shortName}</div>
                        {m.team2Score > 0 && <div className="match-score">{m.team2Score}/{m.team2Wickets}</div>}
                        {m.team2Overs > 0 && <div className="match-overs">({m.team2Overs} ov)</div>}
                      </div>
                    </div>
                    {m.result && <div className="match-result">🏆 {m.result}</div>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
