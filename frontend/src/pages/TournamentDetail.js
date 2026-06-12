import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTournament, getMatches, getTeams, getTournamentStats, getTopBatsmen, getTopBowlers } from '../services/api';

export default function TournamentDetail({ admin }) {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [stats, setStats] = useState(null);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [topBat, setTopBat] = useState([]);
  const [topBowl, setTopBowl] = useState([]);
  const [loading, setLoading] = useState(true);

  const base = admin ? `/admin/tournaments/${id}` : `/tournaments/${id}`;

  useEffect(() => {
    Promise.all([
      getTournament(id), getMatches(id), getTeams(id),
      getTournamentStats(id), getTopBatsmen(id), getTopBowlers(id)
    ]).then(([t, m, te, s, b, bw]) => {
      setTournament(t.data); setMatches(m.data); setTeams(te.data);
      setStats(s.data); setTopBat(b.data.slice(0, 3)); setTopBowl(bw.data.slice(0, 3));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading"><div className="spinner" /><span>Loading tournament...</span></div>;
  if (!tournament) return <div className="loading"><p>Tournament not found</p></div>;

  const liveMatches = matches.filter(m => m.status === 'LIVE');
  // const upcoming = matches.filter(m => m.status === 'SCHEDULED').slice(0, 3);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div>
            <div className="page-header-title">{tournament.name}</div>
            <div className="page-header-sub">📍 {tournament.location} · {tournament.startDate} to {tournament.endDate}</div>
          </div>
        </div>
        <div className="page-header-right">
          <span className={`badge badge-${tournament.status.toLowerCase()}`}>{tournament.status}</span>
        </div>
      </div>

      <div className="page-content">
        {/* Stats */}
        {stats && (
          <div className="stats-row">
            <div className="stat-card"><div className="stat-card-icon">🛡</div><div className="stat-value">{teams.length}</div><div className="stat-label">Teams</div></div>
            <div className="stat-card"><div className="stat-card-icon">🎯</div><div className="stat-value" style={{ color: 'var(--cyan)' }}>{stats.totalMatches}</div><div className="stat-label">Matches</div><div className="stat-sub">{stats.completedMatches} played</div></div>
            <div className="stat-card"><div className="stat-card-icon">🏃</div><div className="stat-value" style={{ color: 'var(--green)' }}>{stats.totalRuns?.toLocaleString() || 0}</div><div className="stat-label">Total Runs</div></div>
            {stats.liveMatches > 0 && (
              <div className="stat-card" style={{ borderColor: 'rgba(255,23,68,0.4)' }}><div className="stat-card-icon" style={{ background: 'var(--red-muted)' }}>📡</div><div className="stat-value" style={{ color: 'var(--red)' }}>{stats.liveMatches}</div><div className="stat-label">Live Now</div></div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="grid-3" style={{ marginBottom: 28 }}>
          {[
            { to: `${base}/teams`, icon: '🛡', title: 'Teams', desc: `${teams.length} teams` },
            { to: `${base}/players`, icon: '🏏', title: 'Players & Stats', desc: 'Batting & bowling figures' },
            { to: admin ? `${base}/matches` : '/fixtures', icon: '🎯', title: 'Fixtures', desc: `${matches.length} matches` },
            { to: `${base}/leaderboard`, icon: '📊', title: 'Standings', desc: 'Points table & NRR' },
          ].map(item => (
            <Link to={item.to} key={item.to} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 18, textDecoration: 'none', transition: 'all 0.2s' }}
              onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(212,160,23,0.35)'}
              onMouseOut={e => e.currentTarget.style.borderColor = 'var(--card-border)'}>
              <div style={{ width: 42, height: 42, borderRadius: 'var(--r-md)', background: 'var(--gold-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{item.icon}</div>
              <div>
                <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 16, color: 'var(--text-1)' }}>{item.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{item.desc}</div>
              </div>
              <div style={{ marginLeft: 'auto', color: 'var(--text-3)', fontSize: 18 }}>›</div>
            </Link>
          ))}
        </div>

        {/* Live Matches */}
        {liveMatches.length > 0 && (
          <>
            <div className="section-title">📡 Live Matches</div>
            {liveMatches.map(m => (
              <div key={m.id} className="match-card live" style={{ marginBottom: 12 }}>
                <div className="match-card-top">
                  <span className="match-number">Match #{m.matchNumber}</span>
                  <span className="badge badge-live">Live</span>
                </div>
                <div className="match-teams">
                  <div className="match-team home">
                    <span className="team-short">{m.team1Name}</span>
                    {m.team1Score != null && <span className="team-score">{m.team1Score}/{m.team1Wickets || 0}</span>}
                  </div>
                  <div className="match-vs">VS</div>
                  <div className="match-team away" style={{ alignItems: 'flex-end' }}>
                    <span className="team-short">{m.team2Name}</span>
                    {m.team2Score != null && <span className="team-score">{m.team2Score}/{m.team2Wickets || 0}</span>}
                  </div>
                </div>
                <div className="match-card-footer">
                  <span />
                  <Link to={`/matches/${m.id}/scorecard`} className="btn btn-ghost btn-sm">Scorecard →</Link>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Top performers */}
        {(topBat.length > 0 || topBowl.length > 0) && (
          <div className="grid-2" style={{ marginTop: 8 }}>
            {topBat.length > 0 && (
              <div>
                <div className="section-title">🏏 Top Scorers</div>
                <div className="card">
                  {topBat.map((p, i) => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < topBat.length - 1 ? '1px solid var(--card-border)' : 'none' }}>
                      <span className={`rank-cell rank-${i < 3 ? i + 1 : 'other'}`} style={{ fontSize: 16, width: 28 }}>{i + 1}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.teamName}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'Rajdhani', fontSize: 20, fontWeight: 700, color: 'var(--gold-light)' }}>{p.totalRuns}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-3)' }}>runs</div>
                      </div>
                    </div>
                  ))}
                  <div style={{ padding: '10px 16px', borderTop: '1px solid var(--card-border)' }}>
                    <Link to={`${base}/players`} className="btn btn-ghost btn-sm">Full Stats →</Link>
                  </div>
                </div>
              </div>
            )}
            {topBowl.length > 0 && (
              <div>
                <div className="section-title">🎯 Top Wicket Takers</div>
                <div className="card">
                  {topBowl.map((p, i) => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < topBowl.length - 1 ? '1px solid var(--card-border)' : 'none' }}>
                      <span className={`rank-cell rank-${i < 3 ? i + 1 : 'other'}`} style={{ fontSize: 16, width: 28 }}>{i + 1}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.teamName}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'Rajdhani', fontSize: 20, fontWeight: 700, color: 'var(--green)' }}>{p.totalWickets}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-3)' }}>wickets</div>
                      </div>
                    </div>
                  ))}
                  <div style={{ padding: '10px 16px', borderTop: '1px solid var(--card-border)' }}>
                    <Link to={`${base}/players`} className="btn btn-ghost btn-sm">Full Stats →</Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
