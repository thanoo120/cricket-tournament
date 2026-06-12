import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTournaments, getMatches, getTeams } from '../services/api';

function formatDate(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function groupByDate(matches) {
  return matches.reduce((acc, m) => {
    const key = m.matchDateTime ? formatDate(m.matchDateTime) : 'TBD';
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});
}

const TEAM_COLORS = ['#b3261e','#1a73e8','#e37400','#7c3aed','#0097a7','#e91e63','#5d4037','#2e7d32'];

export default function Fixtures() {
  const [tournaments, setTournaments] = useState([]);
  const [activeTid, setActiveTid]     = useState(null);
  const [matches, setMatches]         = useState([]);
  const [teams, setTeams]             = useState([]);
  const [filter, setFilter]           = useState('ALL');
  const [loading, setLoading]         = useState(true);

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

  const teamColor = (tid) => {
    const idx = teams.findIndex(t => t.id === tid);
    return TEAM_COLORS[idx % TEAM_COLORS.length] || '#999';
  };

  const filtered = filter === 'ALL' ? matches : matches.filter(m => m.status === filter);
  const grouped  = groupByDate(filtered);

  const stats = {
    total:     matches.length,
    completed: matches.filter(m => m.status === 'COMPLETED').length,
    live:      matches.filter(m => m.status === 'LIVE').length,
    scheduled: matches.filter(m => m.status === 'SCHEDULED').length,
  };

  if (loading) return <div className="loading"><div className="spinner" /><span>Loading fixtures...</span></div>;

  return (
    <div className="pub-page">
      {/* Page hero */}
      <div className="pub-page-hero">
        <div className="pub-page-hero-inner">
          <div>
            <h1 className="pub-page-title">Match Fixtures</h1>
            <p className="pub-page-sub">Full schedule, live scores &amp; results</p>
          </div>
          {tournaments.length > 1 && (
            <div className="pub-page-switcher">
              {tournaments.map(t => (
                <button key={t.id}
                  className={`pd-switcher-btn${activeTid === t.id ? ' active' : ''}`}
                  onClick={() => { setActiveTid(t.id); loadTournament(t.id); }}>
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="pd-body">
        {/* Stats strip */}
        <div className="pd-stats-strip">
          <div className="pd-stat-pill">
            <div className="pd-stat-val" style={{ color: 'var(--text-1)' }}>{stats.total}</div>
            <div className="pd-stat-lbl">Total</div>
          </div>
          <div className="pd-stat-pill">
            <div className="pd-stat-val" style={{ color: 'var(--green)' }}>{stats.completed}</div>
            <div className="pd-stat-lbl">Completed</div>
          </div>
          <div className="pd-stat-pill">
            <div className="pd-stat-val" style={{ color: 'var(--red)' }}>{stats.live}</div>
            <div className="pd-stat-lbl">Live</div>
          </div>
          <div className="pd-stat-pill">
            <div className="pd-stat-val" style={{ color: 'var(--blue)' }}>{stats.scheduled}</div>
            <div className="pd-stat-lbl">Upcoming</div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="pd-card" style={{ padding: 0 }}>
          <div className="pd-tab-bar" style={{ borderBottom: '1px solid var(--card-border)', borderRadius: 0 }}>
            {[
              { key: 'ALL',       label: 'All Fixtures',  count: matches.length },
              { key: 'LIVE',      label: 'Live',          count: stats.live,      dot: true },
              { key: 'SCHEDULED', label: 'Upcoming',      count: stats.scheduled },
              { key: 'COMPLETED', label: 'Results',       count: stats.completed },
            ].map(f => (
              <button key={f.key}
                className={`pd-tab${filter === f.key ? ' active' : ''}`}
                onClick={() => setFilter(f.key)}>
                {f.dot && f.count > 0 && <span className="pd-tab-dot" />}
                {f.label}
                <span className="pd-tab-count">{f.count}</span>
              </button>
            ))}
          </div>

          {/* Grouped matches */}
          {Object.keys(grouped).length === 0 ? (
            <div className="pd-empty">
              <div className="pd-empty-icon">📅</div>
              <div className="pd-empty-title">No fixtures found</div>
              <div className="pd-empty-sub">No {filter !== 'ALL' ? filter.toLowerCase() : ''} matches in this tournament</div>
            </div>
          ) : (
            <div style={{ padding: '16px' }}>
              {Object.entries(grouped).map(([date, dayMatches]) => (
                <div key={date} className="fx-day-group">
                  <div className="fx-day-header">
                    <div className="fx-day-label">📅 {date}</div>
                    <div className="fx-day-line" />
                    <span className="fx-day-count">{dayMatches.length} match{dayMatches.length > 1 ? 'es' : ''}</span>
                  </div>

                  <div className="fx-match-list">
                    {dayMatches.map(m => (
                      <div key={m.id} className={`fx-match-card${m.status === 'LIVE' ? ' fx-live' : ''}`}>
                        {/* Match header */}
                        <div className="fx-match-header">
                          <div className="fx-match-header-left">
                            <span className="fx-match-num">Match #{m.matchNumber}</span>
                            {m.matchDateTime && <span className="fx-match-time">🕐 {formatTime(m.matchDateTime)}</span>}
                            {m.venue && <span className="fx-match-venue">📍 {m.venue}</span>}
                          </div>
                          <div>
                            {m.status === 'LIVE'      && <span className="badge badge-live">● Live</span>}
                            {m.status === 'COMPLETED' && <span className="badge badge-completed">Final</span>}
                            {m.status === 'SCHEDULED' && <span className="badge badge-scheduled">Upcoming</span>}
                          </div>
                        </div>

                        {/* Teams */}
                        <div className="fx-teams">
                          <div className="fx-team">
                            <div className="fx-team-dot" style={{ background: teamColor(m.team1Id) }} />
                            <span className="fx-team-name">{m.team1Name}</span>
                            {m.team1Score != null
                              ? <span className="fx-team-score">{m.team1Score}/{m.team1Wickets || 0}</span>
                              : <span className="fx-yet">Yet to bat</span>}
                            {m.team1Overs > 0 && <span className="fx-overs">({m.team1Overs} ov)</span>}
                          </div>

                          <div className="fx-vs">
                            <span>VS</span>
                            {m.overs && <span className="fx-total-overs">{m.overs} ov</span>}
                          </div>

                          <div className="fx-team fx-team-r">
                            {m.team2Score != null
                              ? <span className="fx-team-score">{m.team2Score}/{m.team2Wickets || 0}</span>
                              : <span className="fx-yet">Yet to bat</span>}
                            {m.team2Overs > 0 && <span className="fx-overs">({m.team2Overs} ov)</span>}
                            <span className="fx-team-name">{m.team2Name}</span>
                            <div className="fx-team-dot" style={{ background: teamColor(m.team2Id) }} />
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="fx-match-footer">
                          <div className="fx-footer-left">
                            {m.result && <span className="fx-result">🏆 {m.result}</span>}
                            {m.tossWinnerName && <span className="fx-toss">🪙 {m.tossWinnerName} won toss</span>}
                          </div>
                          <div className="fx-footer-right">
                            {m.status === 'LIVE' && (
                              <Link to={`/matches/${m.id}/live`} className="btn btn-primary btn-sm">Live →</Link>
                            )}
                            <Link to={`/matches/${m.id}/scorecard`} className="btn btn-ghost btn-sm">Scorecard</Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <footer className="pd-footer">
          <div className="pd-footer-inner">
            <img src="/urumari_logo.png" alt="Urumari" className="pd-footer-logo" />
            <div className="pd-footer-org">
              <div className="pd-footer-org-label">Organised by</div>
              <div className="pd-footer-org-name">Tamil Students' Association<br />University of Kelaniya</div>
            </div>
            <div className="pd-footer-divider" />
            <div className="pd-footer-bottom">© {new Date().getFullYear()} · All rights reserved</div>
          </div>
        </footer>
      </div>
    </div>
  );
}
