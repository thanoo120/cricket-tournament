import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTournaments, getMatches, getTournamentStats, getTopBatsmen, getTopBowlers } from '../services/api';

const PALETTE = ['#b3261e','#1a73e8','#e37400','#7c3aed','#0097a7','#e91e63','#5d4037','#2e7d32'];

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function TeamAvatar({ name, color, size = 44 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color + '15', border: `2px solid ${color}50`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Rajdhani', fontWeight: 700, fontSize: size * 0.35,
      color, flexShrink: 0, letterSpacing: 0.5,
    }}>
      {initials(name)}
    </div>
  );
}

function MatchCard({ match, idx = 0 }) {
  const isLive   = match.status === 'LIVE';
  const isDone   = match.status === 'COMPLETED';
  const isSched  = match.status === 'SCHEDULED';
  const c1 = PALETTE[idx % PALETTE.length];
  const c2 = PALETTE[(idx + 3) % PALETTE.length];

  const crr = isLive && match.team1Overs > 0
    ? ((match.team1Score || 0) / match.team1Overs).toFixed(2) : null;
  const overPct = match.overs
    ? Math.min(100, ((match.team1Overs || 0) / match.overs) * 100) : null;

  return (
    <div className={`pmc-card${isLive ? ' pmc-live' : isDone ? ' pmc-done' : ''}`}>
      {/* Header strip */}
      <div className="pmc-header">
        <div className="pmc-header-left">
          <span className="pmc-num">Match #{match.matchNumber}</span>
          {match.venue && <span className="pmc-venue">{match.venue}</span>}
        </div>
        {isLive  && <span className="badge badge-live">● Live</span>}
        {isDone  && <span className="badge badge-completed">Final</span>}
        {isSched && <span className="badge badge-scheduled">Upcoming</span>}
      </div>

      {/* Teams row */}
      <div className="pmc-teams">
        {/* Team 1 */}
        <div className="pmc-team">
          <TeamAvatar name={match.team1Name} color={c1} />
          <div className="pmc-team-info">
            <div className="pmc-team-name">{match.team1Name}</div>
            {match.team1Score != null
              ? <div className="pmc-score">{match.team1Score}<span className="pmc-wkts">/{match.team1Wickets || 0}</span></div>
              : <div className="pmc-yet">Yet to bat</div>}
            {match.team1Overs > 0 && (
              <div className="pmc-overs">
                {match.team1Overs} ov
                {crr && <span className="pmc-crr">CRR {crr}</span>}
              </div>
            )}
          </div>
        </div>

        {/* VS divider */}
        <div className="pmc-vs">
          <span>VS</span>
          {isSched && match.matchDateTime && (
            <span className="pmc-time">
              {new Date(match.matchDateTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {match.overs && <span className="pmc-overs-lbl">{match.overs} ov</span>}
        </div>

        {/* Team 2 */}
        <div className="pmc-team pmc-team-r">
          <div className="pmc-team-info pmc-team-info-r">
            <div className="pmc-team-name">{match.team2Name}</div>
            {match.team2Score != null
              ? <div className="pmc-score">{match.team2Score}<span className="pmc-wkts">/{match.team2Wickets || 0}</span></div>
              : <div className="pmc-yet">Yet to bat</div>}
            {match.team2Overs > 0 && <div className="pmc-overs">{match.team2Overs} ov</div>}
          </div>
          <TeamAvatar name={match.team2Name} color={c2} />
        </div>
      </div>

      {/* Live progress bar */}
      {isLive && overPct !== null && (
        <div className="pmc-progress-wrap">
          <div className="pmc-progress-bar">
            <div className="pmc-progress-fill" style={{ width: `${overPct}%` }} />
          </div>
          <div className="pmc-progress-lbl">
            <span>Over {Math.floor(match.team1Overs || 0)}</span>
            <span>of {match.overs}</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="pmc-footer">
        <div className="pmc-result">
          {isLive && (
            <span className="pmc-live-txt">
              <span className="pmc-live-dot" />
              Live Coverage
            </span>
          )}
          {isDone && match.result && <span className="pmc-result-txt">{match.result}</span>}
          {isSched && match.matchDateTime && (
            <span className="pmc-date-txt">
              {new Date(match.matchDateTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
        <Link to={`/matches/${match.id}/scorecard`} className="btn btn-ghost btn-sm">Scorecard →</Link>
      </div>
    </div>
  );
}

function StatPill({ label, value, color, sub }) {
  return (
    <div className="pd-stat-pill">
      <div className="pd-stat-val" style={{ color }}>{value}</div>
      <div className="pd-stat-lbl">{label}</div>
      {sub && <div className="pd-stat-sub">{sub}</div>}
    </div>
  );
}

export default function PublicDashboard() {
  const [tournaments, setTournaments]       = useState([]);
  const [allMatches, setAllMatches]         = useState([]);
  const [stats, setStats]                   = useState(null);
  const [batsmen, setBatsmen]               = useState([]);
  const [bowlers, setBowlers]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [activeTid, setActiveTid]           = useState(null);
  const [activeTournament, setActiveTournament] = useState(null);
  const [tab, setTab]                       = useState('live');

  useEffect(() => {
    getTournaments().then(res => {
      const ts = Array.isArray(res.data) ? res.data : [];
      setTournaments(ts);
      const ongoing = ts.find(t => t.status === 'ONGOING') || ts[0];
      if (ongoing) {
        setActiveTid(ongoing.id);
        setActiveTournament(ongoing);
        loadTournamentData(ongoing.id);
      } else {
        setLoading(false);
      }
    }).catch(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll every 30s for live match updates; auto-switch to Live tab when a match goes live
  useEffect(() => {
    if (!activeTid) return;
    const interval = setInterval(() => {
      getMatches(activeTid).then(r => {
        setAllMatches(prev => {
          const next = Array.isArray(r.data) ? r.data : prev;
          const hadLive = prev.some(m => m.status === 'LIVE');
          const hasLive = next.some(m => m.status === 'LIVE');
          if (!hadLive && hasLive) setTab('live');
          return next;
        });
      }).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [activeTid]);

  const loadTournamentData = (tid) => {
    setLoading(true);
    Promise.all([getMatches(tid), getTournamentStats(tid), getTopBatsmen(tid), getTopBowlers(tid)])
      .then(([m, s, b, bw]) => {
        setAllMatches(Array.isArray(m.data) ? m.data : []);
        setStats(s.data);
        setBatsmen(Array.isArray(b.data) ? b.data.slice(0, 5) : []);
        setBowlers(Array.isArray(bw.data) ? bw.data.slice(0, 5) : []);
        setLoading(false);
      }).catch(() => setLoading(false));
  };

  const switchTournament = (t) => {
    setActiveTid(t.id);
    setActiveTournament(t);
    loadTournamentData(t.id);
  };

  const liveMatches     = allMatches.filter(m => m.status === 'LIVE');
  const recentMatches   = allMatches.filter(m => m.status === 'COMPLETED').slice().reverse();
  const upcomingMatches = allMatches.filter(m => m.status === 'SCHEDULED');

  const defaultTab = liveMatches.length > 0 ? 'live' : recentMatches.length > 0 ? 'results' : 'upcoming';
  const activeTab  = tab === 'live' && liveMatches.length === 0 ? defaultTab : tab;
  const tabMatches = activeTab === 'live' ? liveMatches : activeTab === 'results' ? recentMatches : upcomingMatches;

  if (loading) return (
    <div className="loading" style={{ minHeight: '60vh' }}>
      <div className="spinner" /><span>Loading tournament data...</span>
    </div>
  );

  return (
    <div className="pub-page">

      {/* Live score ticker */}
      {liveMatches.length > 0 && (
        <div className="live-ticker">
          <div className="ticker-label">LIVE</div>
          <div className="ticker-scroll">
            <div className="ticker-track">
              {[...liveMatches, ...liveMatches].map((m, i) => (
                <span key={i} className="ticker-item">
                  <span className="ticker-dot">●</span>
                  <strong>{m.team1Name}</strong>
                  {m.team1Score != null ? ` ${m.team1Score}/${m.team1Wickets || 0} (${m.team1Overs || 0} ov)` : ''}
                  <span className="ticker-sep">vs</span>
                  <strong>{m.team2Name}</strong>
                  {m.team2Score != null ? ` ${m.team2Score}/${m.team2Wickets || 0}` : ''}
                  <span className="ticker-sep">·</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      {activeTournament && (
        <div className="pd-hero">
          <div className="pd-hero-inner">
            <div className="pd-hero-left">
              <div className="pd-hero-badge">
                {activeTournament.status === 'ONGOING' && <span className="pd-hero-dot" />}
                <span>
                  {activeTournament.status === 'ONGOING' ? 'Tournament In Progress'
                    : activeTournament.status === 'UPCOMING' ? 'Coming Soon' : 'Tournament Completed'}
                </span>
              </div>
              <h1 className="pd-hero-title">{activeTournament.name}</h1>
              <div className="pd-hero-meta">
                {activeTournament.location && <span>📍 {activeTournament.location}</span>}
                {activeTournament.startDate && (
                  <span>📅 {activeTournament.startDate}{activeTournament.endDate ? ` – ${activeTournament.endDate}` : ''}</span>
                )}
              </div>
              {tournaments.length > 1 && (
                <div className="pd-hero-switcher">
                  <span className="pd-switcher-label">Switch tournament:</span>
                  {tournaments.map(t => (
                    <button key={t.id}
                      onClick={() => switchTournament(t)}
                      className={`pd-switcher-btn${activeTid === t.id ? ' active' : ''}`}>
                      {t.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {stats && (
              <div className="pd-hero-stats">
                <div className="pd-hero-stat">
                  <div className="pd-hero-stat-val">{stats.totalMatches || 0}</div>
                  <div className="pd-hero-stat-lbl">Matches</div>
                </div>
                <div className="pd-hero-stat">
                  <div className="pd-hero-stat-val">{stats.completedMatches || 0}</div>
                  <div className="pd-hero-stat-lbl">Played</div>
                </div>
                <div className="pd-hero-stat">
                  <div className="pd-hero-stat-val">{(stats.totalRuns || 0).toLocaleString()}</div>
                  <div className="pd-hero-stat-lbl">Runs</div>
                </div>
                <div className="pd-hero-stat">
                  <div className="pd-hero-stat-val">{stats.totalWickets || 0}</div>
                  <div className="pd-hero-stat-lbl">Wickets</div>
                </div>
                {liveMatches.length > 0 && (
                  <div className="pd-hero-stat pd-hero-stat-live">
                    <div className="pd-hero-stat-val">{liveMatches.length}</div>
                    <div className="pd-hero-stat-lbl">Live</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="pd-body">

        {/* Quick stats strip */}
        {stats && (
          <div className="pd-stats-strip">
            <StatPill label="Total Matches" value={stats.totalMatches || 0} color="var(--text-1)" />
            <StatPill label="Completed"     value={stats.completedMatches || 0} color="var(--green)" />
            <StatPill label="Total Runs"    value={(stats.totalRuns || 0).toLocaleString()} color="var(--blue)" />
            <StatPill label="Wickets"       value={stats.totalWickets || 0} color="var(--purple)" />
            {liveMatches.length > 0 && <StatPill label="Live Now" value={liveMatches.length} color="var(--red)" />}
            {stats.topScorer && (
              <StatPill label="Top Scorer" value={stats.topScorer.name} sub={`${stats.topScorer.totalRuns} runs`} color="var(--accent)" />
            )}
            {stats.topWicketTaker && (
              <StatPill label="Top Bowler" value={stats.topWicketTaker.name} sub={`${stats.topWicketTaker.totalWickets} wkts`} color="var(--gold)" />
            )}
          </div>
        )}

        <div className="pd-main-grid">
          {/* Left: Match tabs */}
          <div className="pd-matches-col">
            <div className="pd-card">
              <div className="pd-tab-bar">
                {[
                  { key: 'live',     label: 'Live',     count: liveMatches.length,     dot: true },
                  { key: 'results',  label: 'Results',  count: recentMatches.length },
                  { key: 'upcoming', label: 'Upcoming', count: upcomingMatches.length },
                ].map(t => (
                  <button key={t.key}
                    className={`pd-tab${activeTab === t.key ? ' active' : ''}`}
                    onClick={() => setTab(t.key)}>
                    {t.dot && t.count > 0 && <span className="pd-tab-dot" />}
                    {t.label}
                    <span className="pd-tab-count">{t.count}</span>
                  </button>
                ))}
                <Link to="/fixtures" className="pd-tab-more">All fixtures →</Link>
              </div>

              {tabMatches.length === 0 ? (
                <div className="pd-empty">
                  <div className="pd-empty-icon">
                    {activeTab === 'live' ? '📡' : activeTab === 'results' ? '🏏' : '📅'}
                  </div>
                  <div className="pd-empty-title">
                    {activeTab === 'live' ? 'No live matches right now'
                      : activeTab === 'results' ? 'No results yet' : 'No upcoming fixtures'}
                  </div>
                  <div className="pd-empty-sub">Check back soon</div>
                </div>
              ) : (
                <div className="pd-match-list">
                  {tabMatches.map((m, i) => <MatchCard key={m.id} match={m} idx={i} />)}
                </div>
              )}
            </div>
          </div>

          {/* Right: Leaderboards + Tournaments */}
          <div className="pd-side-col">

            {/* Batting leaderboard */}
            <div className="pd-card">
              <div className="pd-leaderboard-hdr">
                <span className="pd-lb-icon" style={{ background: 'rgba(179,38,30,0.1)', color: 'var(--accent)' }}>🏏</span>
                <div>
                  <div className="pd-lb-title">Top Run Scorers</div>
                  <div className="pd-lb-sub">Batting leaderboard</div>
                </div>
                {activeTid && <Link to={`/tournaments/${activeTid}/players`} className="pd-lb-all">All →</Link>}
              </div>
              {batsmen.length === 0
                ? <div className="pd-empty-sm">No batting data yet</div>
                : batsmen.map((p, i) => (
                  <div key={p.id} className="pd-lb-row">
                    <span className={`pd-rank rank-${i < 3 ? i + 1 : 'x'}`}>{i + 1}</span>
                    <div className="pd-p-avatar" style={{ background: PALETTE[i % PALETTE.length] + '20', color: PALETTE[i % PALETTE.length] }}>
                      {initials(p.name)}
                    </div>
                    <div className="pd-p-info">
                      <div className="pd-p-name">{p.name}</div>
                      <div className="pd-p-team">{p.teamName}</div>
                    </div>
                    <div className="pd-p-stat-group">
                      <div>
                        <div className="pd-p-stat" style={{ color: 'var(--accent)' }}>{p.totalRuns}</div>
                        <div className="pd-p-stat-lbl">runs</div>
                      </div>
                      <div>
                        <div className="pd-p-stat" style={{ color: 'var(--text-2)', fontSize: 13 }}>{p.battingAverage?.toFixed(1) || '–'}</div>
                        <div className="pd-p-stat-lbl">avg</div>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>

            {/* Bowling leaderboard */}
            <div className="pd-card">
              <div className="pd-leaderboard-hdr">
                <span className="pd-lb-icon" style={{ background: 'rgba(26,115,232,0.1)', color: 'var(--blue)' }}>🎯</span>
                <div>
                  <div className="pd-lb-title">Top Wicket Takers</div>
                  <div className="pd-lb-sub">Bowling leaderboard</div>
                </div>
                {activeTid && <Link to={`/tournaments/${activeTid}/players`} className="pd-lb-all">All →</Link>}
              </div>
              {bowlers.length === 0
                ? <div className="pd-empty-sm">No bowling data yet</div>
                : bowlers.map((p, i) => (
                  <div key={p.id} className="pd-lb-row">
                    <span className={`pd-rank rank-${i < 3 ? i + 1 : 'x'}`}>{i + 1}</span>
                    <div className="pd-p-avatar" style={{ background: PALETTE[i % PALETTE.length] + '20', color: PALETTE[i % PALETTE.length] }}>
                      {initials(p.name)}
                    </div>
                    <div className="pd-p-info">
                      <div className="pd-p-name">{p.name}</div>
                      <div className="pd-p-team">{p.teamName}</div>
                    </div>
                    <div className="pd-p-stat-group">
                      <div>
                        <div className="pd-p-stat" style={{ color: 'var(--blue)' }}>{p.totalWickets}</div>
                        <div className="pd-p-stat-lbl">wkts</div>
                      </div>
                      <div>
                        <div className="pd-p-stat" style={{ color: 'var(--text-2)', fontSize: 13 }}>{p.bowlingEconomy?.toFixed(2) || '–'}</div>
                        <div className="pd-p-stat-lbl">eco</div>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>

            {/* Tournaments list */}
            {tournaments.length > 0 && (
              <div className="pd-card">
                <div className="pd-card-title">Tournaments</div>
                <div className="pd-tournament-list">
                  {tournaments.map(t => (
                    <Link key={t.id} to={`/tournaments/${t.id}`} className="pd-tournament-row">
                      <span className="pd-t-icon">🏆</span>
                      <div className="pd-t-info">
                        <div className="pd-t-name">{t.name}</div>
                        {t.location && <div className="pd-t-loc">📍 {t.location}</div>}
                        <div className="pd-t-meta">{t.teamCount || 0} teams · {t.matchCount || 0} matches</div>
                      </div>
                      <span className={`badge badge-${t.status.toLowerCase()}`}>{t.status}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
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
