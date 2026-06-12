import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTournaments, getMatches, getTeams } from '../services/api';

function formatDate(dt) {
  if (!dt) return '';
  const d = new Date(dt);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(dt) {
  if (!dt) return '';
  const d = new Date(dt);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function groupByDate(matches) {
  return matches.reduce((acc, m) => {
    const key = m.matchDateTime ? formatDate(m.matchDateTime) : 'TBD';
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});
}

export default function Fixtures() {
  const [tournaments, setTournaments] = useState([]);
  const [activeTid, setActiveTid] = useState(null);
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTournaments().then(res => {
      setTournaments(res.data);
      const t = res.data.find(x => x.status === 'ONGOING') || res.data[0];
      if (t) { setActiveTid(t.id); loadTournament(t.id); }
      else setLoading(false);
    });
  }, []);

  const loadTournament = (tid) => {
    setLoading(true);
    Promise.all([getMatches(tid), getTeams(tid)]).then(([mr, tr]) => {
      setMatches(mr.data);
      setTeams(tr.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  const TEAM_COLORS = ['#d4a017','#2979ff','#00c853','#ff3b3b','#7c4dff','#00e5ff','#ff9100','#e91e63'];
  const teamColor = (tid) => {
    const idx = teams.findIndex(t => t.id === tid);
    return TEAM_COLORS[idx % TEAM_COLORS.length] || 'var(--text-3)';
  };

  const filtered = filter === 'ALL' ? matches : matches.filter(m => m.status === filter);
  const grouped = groupByDate(filtered);

  const stats = {
    total: matches.length,
    completed: matches.filter(m => m.status === 'COMPLETED').length,
    live: matches.filter(m => m.status === 'LIVE').length,
    scheduled: matches.filter(m => m.status === 'SCHEDULED').length,
  };

  if (loading) return <div className="loading"><div className="spinner" /><span>Loading fixtures...</span></div>;

  return (
    <div>
      <div className="top-bar">
        <div className="top-bar-left">
          <div>
            <div className="top-bar-title">Match Fixtures</div>
            <div className="top-bar-sub">Schedule, results & live matches</div>
          </div>
        </div>
        <div className="top-bar-right">
          {tournaments.map(t => (
            <button key={t.id}
              className={`btn btn-sm ${activeTid === t.id ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => { setActiveTid(t.id); loadTournament(t.id); }}>
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <div className="page-content">
        {/* Stats row */}
        <div className="stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Matches</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--green)' }}>{stats.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--red)' }}>{stats.live}</div>
            <div className="stat-label">Live Now</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--blue)' }}>{stats.scheduled}</div>
            <div className="stat-label">Upcoming</div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="tabs">
          {['ALL', 'LIVE', 'SCHEDULED', 'COMPLETED'].map(f => (
            <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'LIVE' && '📡 '}
              {f === 'SCHEDULED' && '📅 '}
              {f === 'COMPLETED' && '✅ '}
              {f === 'ALL' ? 'All Fixtures' : f.charAt(0) + f.slice(1).toLowerCase()}
              {f !== 'ALL' && <span style={{ marginLeft: 6, background: 'rgba(255,255,255,0.08)', padding: '0 5px', borderRadius: 10, fontSize: 10 }}>
                {matches.filter(m => m.status === f).length}
              </span>}
            </button>
          ))}
        </div>

        {/* Fixtures grouped by date */}
        {Object.keys(grouped).length === 0 ? (
          <div className="card"><div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <h3>No fixtures found</h3>
            <p>No {filter !== 'ALL' ? filter.toLowerCase() : ''} matches in this tournament</p>
          </div></div>
        ) : (
          Object.entries(grouped).map(([date, dayMatches]) => (
            <div key={date} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  background: 'var(--navy-3)', border: '1px solid var(--card-border)',
                  borderRadius: 'var(--r-md)', padding: '6px 14px',
                  fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 14, color: 'var(--gold-light)'
                }}>
                  📅 {date}
                </div>
                <div style={{ flex: 1, height: 1, background: 'var(--card-border)' }} />
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{dayMatches.length} match{dayMatches.length > 1 ? 'es' : ''}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {dayMatches.map(m => (
                  <div key={m.id} className={`match-card ${m.status === 'LIVE' ? 'live' : ''}`}
                    style={{ position: 'relative' }}>
                    <div className="match-card-top">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="match-number">Match #{m.matchNumber}</span>
                        {m.matchDateTime && (
                          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                            🕐 {formatTime(m.matchDateTime)}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="match-venue">📍 {m.venue}</span>
                        {m.status === 'LIVE' && <span className="badge badge-live">Live</span>}
                        {m.status === 'COMPLETED' && <span className="badge badge-completed">Final</span>}
                        {m.status === 'SCHEDULED' && <span className="badge badge-scheduled">Upcoming</span>}
                      </div>
                    </div>

                    <div className="match-teams">
                      <div className="match-team home">
                        <div className="team-name-row">
                          <div className="team-color-dot" style={{ background: teamColor(m.team1Id) }} />
                          <span className="team-short">{m.team1Name}</span>
                        </div>
                        {m.team1Score != null ? (
                          <span className="team-score">{m.team1Score}/{m.team1Wickets || 0}</span>
                        ) : <span style={{ color: 'var(--text-3)', fontSize: 13 }}>Yet to bat</span>}
                        {m.team1Overs > 0 && <span className="team-overs">({m.team1Overs} ov)</span>}
                        {m.team1Score != null && m.team1Overs > 0 && (
                          <span style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                            RR: {(m.team1Score / m.team1Overs).toFixed(2)}
                          </span>
                        )}
                      </div>

                      <div style={{ textAlign: 'center' }}>
                        <div className="match-vs">VS</div>
                        {m.overs && <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>{m.overs} overs</div>}
                      </div>

                      <div className="match-team away" style={{ alignItems: 'flex-end' }}>
                        <div className="team-name-row" style={{ flexDirection: 'row-reverse' }}>
                          <div className="team-color-dot" style={{ background: teamColor(m.team2Id) }} />
                          <span className="team-short">{m.team2Name}</span>
                        </div>
                        {m.team2Score != null ? (
                          <span className="team-score">{m.team2Score}/{m.team2Wickets || 0}</span>
                        ) : <span style={{ color: 'var(--text-3)', fontSize: 13 }}>Yet to bat</span>}
                        {m.team2Overs > 0 && <span className="team-overs">({m.team2Overs} ov)</span>}
                        {m.team2Score != null && m.team2Overs > 0 && (
                          <span style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                            RR: {(m.team2Score / m.team2Overs).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="match-card-footer">
                      <div>
                        {m.result && <span className="match-result">🏆 {m.result}</span>}
                        {m.tossWinnerName && <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: m.result ? 12 : 0 }}>
                          🪙 {m.tossWinnerName} won toss
                        </span>}
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {m.status === 'LIVE' && (
                          <Link to={`/matches/${m.id}/live`} className="btn btn-primary btn-sm" style={{ animation: 'pulse 1.5s infinite' }}>Live</Link>
                        )}
                        <Link to={`/matches/${m.id}/scorecard`} className="btn btn-ghost btn-sm">Scorecard</Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
