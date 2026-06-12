import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTournaments, getMatches, getTournamentStats, getTopBatsmen, getTopBowlers } from '../services/api';

const TEAM_COLORS = ['#d4a017','#2979ff','#00c853','#ff3b3b','#7c4dff','#00e5ff','#ff9100','#e91e63'];

function MatchCard({ match }) {
  const isLive = match.status === 'LIVE';
  const isCompleted = match.status === 'COMPLETED';
  return (
    <div className={`match-card ${isLive ? 'live' : ''}`}>
      <div className="match-card-top">
        <span className="match-number">Match #{match.matchNumber}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="match-venue">{match.venue}</span>
          {isLive && <span className="badge badge-live">Live</span>}
          {isCompleted && <span className="badge badge-completed">Final</span>}
          {match.status === 'SCHEDULED' && <span className="badge badge-scheduled">Upcoming</span>}
        </div>
      </div>
      <div className="match-teams">
        <div className="match-team home">
          <div className="team-name-row">
            <div className="team-color-dot" style={{ background: TEAM_COLORS[0] }} />
            <span className="team-short">{match.team1Name}</span>
          </div>
          {(match.team1Score !== null && match.team1Score !== undefined) ? (
            <span className="team-score">{match.team1Score}/{match.team1Wickets || 0}</span>
          ) : <span style={{ color: 'var(--text-3)', fontSize: 13 }}>Yet to bat</span>}
          {match.team1Overs > 0 && <span className="team-overs">({match.team1Overs} ov)</span>}
        </div>
        <div className="match-vs">VS</div>
        <div className="match-team away" style={{ alignItems: 'flex-end' }}>
          <div className="team-name-row" style={{ flexDirection: 'row-reverse' }}>
            <div className="team-color-dot" style={{ background: TEAM_COLORS[1] }} />
            <span className="team-short">{match.team2Name}</span>
          </div>
          {(match.team2Score !== null && match.team2Score !== undefined) ? (
            <span className="team-score">{match.team2Score}/{match.team2Wickets || 0}</span>
          ) : <span style={{ color: 'var(--text-3)', fontSize: 13 }}>Yet to bat</span>}
          {match.team2Overs > 0 && <span className="team-overs">({match.team2Overs} ov)</span>}
        </div>
      </div>
      <div className="match-card-footer">
        <span className="match-result">{match.result || (isLive ? '● Live Coverage' : match.status === 'SCHEDULED' ? `📅 ${new Date(match.matchDateTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : '')}</span>
        <Link to={`/matches/${match.id}/scorecard`} className="btn btn-ghost btn-sm">Scorecard →</Link>
      </div>
    </div>
  );
}

export default function PublicDashboard() {
  const [tournaments, setTournaments] = useState([]);
  const [allMatches, setAllMatches] = useState([]);
  const [stats, setStats] = useState(null);
  const [batsmen, setBatsmen] = useState([]);
  const [bowlers, setBowlers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTid, setActiveTid] = useState(null);

  useEffect(() => {
    getTournaments().then(res => {
      const ts = res.data;
      setTournaments(ts);
      const ongoing = ts.find(t => t.status === 'ONGOING') || ts[0];
      if (ongoing) {
        setActiveTid(ongoing.id);
        loadTournamentData(ongoing.id);
      } else {
        setLoading(false);
      }
    }).catch(() => setLoading(false));
  }, []);

  const loadTournamentData = (tid) => {
    setLoading(true);
    Promise.all([
      getMatches(tid),
      getTournamentStats(tid),
      getTopBatsmen(tid),
      getTopBowlers(tid),
    ]).then(([m, s, b, bw]) => {
      setAllMatches(m.data);
      setStats(s.data);
      setBatsmen(b.data.slice(0, 5));
      setBowlers(bw.data.slice(0, 5));
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  const liveMatches = allMatches.filter(m => m.status === 'LIVE');
  const recentMatches = allMatches.filter(m => m.status === 'COMPLETED').slice(-3).reverse();
  const upcomingMatches = allMatches.filter(m => m.status === 'SCHEDULED').slice(0, 3);

  if (loading) return <div className="loading"><div className="spinner" /><span>Loading live data...</span></div>;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div>
            <div className="page-header-title">Live Tournament Dashboard</div>
            <div className="page-header-sub">Official scores, stats & standings</div>
          </div>
        </div>
        <div className="page-header-right">
          {tournaments.length > 1 && tournaments.map(t => (
            <button key={t.id}
              className={`btn btn-sm ${activeTid === t.id ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => { setActiveTid(t.id); loadTournamentData(t.id); }}>
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <div className="page-content">
        {/* Stats */}
        {stats && (
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-card-icon">🏏</div>
              <div className="stat-value">{stats.totalMatches}</div>
              <div className="stat-label">Total Matches</div>
              <div className="stat-sub">{stats.completedMatches} completed</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon">🏃</div>
              <div className="stat-value" style={{ color: 'var(--cyan)' }}>{stats.totalRuns?.toLocaleString()}</div>
              <div className="stat-label">Total Runs</div>
              <div className="stat-sub">across all innings</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon">🎯</div>
              <div className="stat-value" style={{ color: '#b388ff' }}>{stats.totalWickets}</div>
              <div className="stat-label">Total Wickets</div>
              <div className="stat-sub">in completed matches</div>
            </div>
            {stats.liveMatches > 0 && (
              <div className="stat-card" style={{ borderColor: 'rgba(255,23,68,0.4)' }}>
                <div className="stat-card-icon" style={{ background: 'var(--red-muted)' }}>📡</div>
                <div className="stat-value" style={{ color: 'var(--red)' }}>{stats.liveMatches}</div>
                <div className="stat-label">Live Now</div>
                <div className="stat-sub">matches in progress</div>
              </div>
            )}
            {stats.topScorer && (
              <div className="stat-card">
                <div className="stat-card-icon">👑</div>
                <div style={{ fontSize: 18, fontFamily: 'Rajdhani', fontWeight: 700, color: 'var(--gold-light)', marginBottom: 2 }}>
                  {stats.topScorer.name}
                </div>
                <div className="stat-label">Top Scorer</div>
                <div className="stat-sub">{stats.topScorer.totalRuns} runs</div>
              </div>
            )}
            {stats.topWicketTaker && (
              <div className="stat-card">
                <div className="stat-card-icon">🎳</div>
                <div style={{ fontSize: 18, fontFamily: 'Rajdhani', fontWeight: 700, color: 'var(--gold-light)', marginBottom: 2 }}>
                  {stats.topWicketTaker.name}
                </div>
                <div className="stat-label">Top Wicket Taker</div>
                <div className="stat-sub">{stats.topWicketTaker.totalWickets} wickets</div>
              </div>
            )}
          </div>
        )}

        {/* Live Matches */}
        {liveMatches.length > 0 && (
          <>
            <div className="section-title">📡 Live Matches</div>
            <div className="fixtures-grid" style={{ marginBottom: 28 }}>
              {liveMatches.map(m => <MatchCard key={m.id} match={m} />)}
            </div>
          </>
        )}

        <div className="grid-2">
          {/* Recent Results */}
          <div>
            <div className="section-title">✅ Recent Results</div>
            {recentMatches.length === 0
              ? <div className="card"><div className="empty-state"><div className="empty-state-icon">🏏</div><p>No completed matches yet</p></div></div>
              : <div className="fixtures-grid">{recentMatches.map(m => <MatchCard key={m.id} match={m} />)}</div>
            }
          </div>

          {/* Upcoming */}
          <div>
            <div className="section-title">📅 Upcoming Fixtures</div>
            {upcomingMatches.length === 0
              ? <div className="card"><div className="empty-state"><div className="empty-state-icon">📅</div><p>No upcoming fixtures scheduled</p></div></div>
              : <div className="fixtures-grid">{upcomingMatches.map(m => <MatchCard key={m.id} match={m} />)}</div>
            }
          </div>
        </div>

        {/* Top Performers */}
        <div style={{ marginTop: 28 }} className="grid-2">
          <div>
            <div className="section-title">🏏 Top Run Scorers</div>
            <div className="card">
              {batsmen.length === 0
                ? <div className="empty-state"><p>No batting data yet</p></div>
                : <div className="table-wrap">
                  <table>
                    <thead><tr>
                      <th style={{ width: 36 }}>#</th><th>Player</th><th className="right">Runs</th><th className="right">Avg</th><th className="right">SR</th><th className="right">100s</th>
                    </tr></thead>
                    <tbody>
                      {batsmen.map((p, i) => (
                        <tr key={p.id}>
                          <td><span className={`rank-cell rank-${i < 3 ? i + 1 : 'other'}`}>{i + 1}</span></td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{p.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.teamName}</div>
                          </td>
                          <td className="right td-mono" style={{ color: 'var(--gold-light)', fontWeight: 700 }}>{p.totalRuns}</td>
                          <td className="right td-mono">{p.battingAverage?.toFixed(1) || '-'}</td>
                          <td className="right td-mono">{p.battingStrikeRate?.toFixed(1) || '-'}</td>
                          <td className="right td-mono">{p.hundreds}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              }
              {activeTid && <div style={{ padding: '10px 16px', borderTop: '1px solid var(--card-border)' }}>
                <Link to={`/tournaments/${activeTid}/players`} className="btn btn-ghost btn-sm">View All Stats →</Link>
              </div>}
            </div>
          </div>

          <div>
            <div className="section-title">🎯 Top Wicket Takers</div>
            <div className="card">
              {bowlers.length === 0
                ? <div className="empty-state"><p>No bowling data yet</p></div>
                : <div className="table-wrap">
                  <table>
                    <thead><tr>
                      <th style={{ width: 36 }}>#</th><th>Player</th><th className="right">Wkts</th><th className="right">Avg</th><th className="right">Eco</th><th className="right">5W</th>
                    </tr></thead>
                    <tbody>
                      {bowlers.map((p, i) => (
                        <tr key={p.id}>
                          <td><span className={`rank-cell rank-${i < 3 ? i + 1 : 'other'}`}>{i + 1}</span></td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{p.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.teamName}</div>
                          </td>
                          <td className="right td-mono" style={{ color: 'var(--green)', fontWeight: 700 }}>{p.totalWickets}</td>
                          <td className="right td-mono">{p.bowlingAverage?.toFixed(1) || '-'}</td>
                          <td className="right td-mono">{p.bowlingEconomy?.toFixed(2) || '-'}</td>
                          <td className="right td-mono">{p.fiveWicketHauls}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              }
              {activeTid && <div style={{ padding: '10px 16px', borderTop: '1px solid var(--card-border)' }}>
                <Link to={`/tournaments/${activeTid}/players`} className="btn btn-ghost btn-sm">View All Stats →</Link>
              </div>}
            </div>
          </div>
        </div>

        {/* Quick links to tournaments */}
        {tournaments.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <div className="section-title">🏆 Tournaments</div>
            <div className="grid-auto">
              {tournaments.map(t => (
                <Link to={`/tournaments/${t.id}`} key={t.id} className="card" style={{ display: 'block', padding: 20, textDecoration: 'none', transition: 'all 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(212,160,23,0.35)'}
                  onMouseOut={e => e.currentTarget.style.borderColor = 'var(--card-border)'}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ fontSize: 28 }}>🏆</div>
                    <span className={`badge badge-${t.status.toLowerCase()}`}>{t.status}</span>
                  </div>
                  <div style={{ fontFamily: 'Rajdhani', fontSize: 20, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12 }}>📍 {t.location}</div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-2)' }}>
                    <span>🛡 {t.teamCount || 0} teams</span>
                    <span>🎯 {t.matchCount || 0} matches</span>
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
