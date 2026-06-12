import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMatches, createMatch, updateScore, getTeams } from '../services/api';
import { useAuth } from '../context/AuthContext';

const TEAM_FLAGS = ['🏏', '🎯', '⚡', '🔥', '🌟', '💥', '🏆', '⭐'];

function teamFlag(idx) { return TEAM_FLAGS[idx % TEAM_FLAGS.length]; }

export default function AdminMatches() {
  const { id } = useParams();
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ matchNumber: '', venue: '', matchDateTime: '', team1Id: '', team2Id: '', overs: 3 });
  const [saving, setSaving] = useState(false);
  const { isScorer } = useAuth();

  useEffect(() => {
    load();
    getTeams(id).then(r => setTeams(r.data));
  }, [id]);

  const load = () => getMatches(id).then(r => setMatches(r.data));

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    await createMatch({ ...form, tournamentId: +id, overs: +form.overs, team1Id: +form.team1Id, team2Id: +form.team2Id, matchNumber: +form.matchNumber });
    setShowCreate(false);
    setForm({ matchNumber: '', venue: '', matchDateTime: '', team1Id: '', team2Id: '', overs: 3 });
    load(); setSaving(false);
  };

  const quickStatus = async (match, status) => {
    await updateScore(match.id, { team: 'team1', score: match.team1Score || 0, wickets: match.team1Wickets || 0, overs: match.team1Overs || 0, status });
    load();
  };

  const teamIdx = (tid) => teams.findIndex(t => t.id === tid);

  const filtered = filter === 'ALL' ? matches : matches.filter(m => m.status === filter);
  const liveMatch = matches.find(m => m.status === 'LIVE');
  const completedMatches = matches.filter(m => m.status === 'COMPLETED');
  const upcomingMatches = matches.filter(m => m.status === 'SCHEDULED');
  const earlierMatches = completedMatches.slice(-5).reverse();

  const displayMatches = filter === 'ALL'
    ? filtered.filter(m => m.status !== 'COMPLETED' || completedMatches.indexOf(m) >= completedMatches.length - 2)
    : filtered;

  return (
    <div>
      <div className="match-center-page">
        <div className="match-center-header">
          <div>
            <div className="match-center-title">Match Center</div>
            <div className="match-center-sub">Global cricket schedule and results.</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="mc-filter-tabs">
              {['ALL', 'LIVE', 'SCHEDULED', 'COMPLETED'].map(f => (
                <button key={f} className={`mc-filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                  {f === 'ALL' ? 'Live' : f === 'SCHEDULED' ? 'Upcoming' : f.charAt(0) + f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
            {isScorer && (
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Schedule Match</button>
            )}
          </div>
        </div>

        {/* Featured Live Match */}
        {(filter === 'ALL' || filter === 'LIVE') && liveMatch && (
          <div className="featured-match live-match">
            <div className="featured-match-meta">
              <span className="badge badge-live" style={{ fontSize: 9 }}>LIVE NOW</span>
              <span className="featured-match-type">{liveMatch.matchType || 'T20 International Series'}</span>
            </div>

            <div className="featured-team" style={{ marginTop: 24 }}>
              <div className="featured-team-logo">{teamFlag(teamIdx(liveMatch.team1Id))}</div>
              <div className="featured-team-name">{liveMatch.team1Name}</div>
              <div className="featured-score">
                {liveMatch.team1Score != null ? `${liveMatch.team1Score}/${liveMatch.team1Wickets || 0}` : 'TBD'}
              </div>
              <div className="featured-overs">{liveMatch.team1Overs > 0 ? `(${liveMatch.team1Overs})` : ''}</div>
            </div>

            <div className="featured-mid">
              <div className="match-vs" style={{ fontSize: 16, padding: '8px 14px' }}>VS</div>
              {liveMatch.team2Score != null && liveMatch.team1Score != null && (
                <div className="featured-lead">
                  {liveMatch.team1Name} leads by {Math.abs(liveMatch.team1Score - (liveMatch.team2Score || 0))} runs
                </div>
              )}
              {liveMatch.result && (
                <div className="featured-lead">{liveMatch.result}</div>
              )}
            </div>

            <div className="featured-team" style={{ marginTop: 24 }}>
              <div className="featured-team-logo">{teamFlag(teamIdx(liveMatch.team2Id))}</div>
              <div className="featured-team-name">{liveMatch.team2Name}</div>
              <div className="featured-score">
                {liveMatch.team2Score != null ? `${liveMatch.team2Score}/${liveMatch.team2Wickets || 0}` : 'TBD'}
              </div>
              <div className="featured-overs">{liveMatch.team2Overs > 0 ? `(${liveMatch.team2Overs})` : ''}</div>
            </div>

            <div className="featured-right-info">
              <div className="top-performers-label">Top Performers</div>
              <div className="performer-row">
                <div className="performer-name" style={{ fontSize: 12, color: 'var(--text-3)' }}>Batting</div>
              </div>
              <div className="performer-row">
                <span className="performer-name">{liveMatch.team1Name} Batters</span>
                <div style={{ textAlign: 'right' }}>
                  <div className="performer-stat">{liveMatch.team1Score || 0}</div>
                  <div className="performer-stat-sub">runs</div>
                </div>
              </div>
              <div className="performer-row">
                <span className="performer-name">{liveMatch.team2Name} Bowlers</span>
                <div style={{ textAlign: 'right' }}>
                  <div className="performer-stat">{liveMatch.team2Wickets || 0}</div>
                  <div className="performer-stat-sub">wickets</div>
                </div>
              </div>
              <div style={{ marginTop: 14 }}>
                {isScorer ? (
                  <Link to={`/admin/matches/${liveMatch.id}/score`} className="match-center-btn">
                    Match Center
                  </Link>
                ) : (
                  <Link to={`/matches/${liveMatch.id}/scorecard`} className="match-center-btn">
                    Match Center
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Match Grid */}
        {filtered.length === 0 ? (
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="empty-state">
              <div className="empty-state-icon">🎯</div>
              <h3>No matches found</h3>
              <p>{isScorer ? 'Schedule a new match to get started' : 'No matches in this category yet'}</p>
            </div>
          </div>
        ) : (
          <div className="matches-grid">
            {(filter === 'ALL' ? filtered.filter(m => m !== liveMatch) : filtered).map(m => {
              const idx1 = teamIdx(m.team1Id);
              const idx2 = teamIdx(m.team2Id);
              const isCompleted = m.status === 'COMPLETED';
              const isUpcoming = m.status === 'SCHEDULED';
              const matchDate = m.matchDateTime ? new Date(m.matchDateTime) : null;

              return (
                <div key={m.id} className={`mc-match-card ${m.status === 'LIVE' ? 'live' : ''}`}>
                  <div className="mc-card-top">
                    <span className="mc-card-meta">
                      {m.matchType || (isCompleted ? 'Completed' : isUpcoming ? 'Upcoming' : 'Match')}
                      {isCompleted && matchDate && ` · Yesterday`}
                      {isUpcoming && matchDate && ` · ${matchDate.toLocaleDateString('en-GB', { weekday: 'short' })}, ${matchDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {m.venue && <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{m.venue}</span>}
                      {m.status === 'LIVE' && <span className="badge badge-live">Live</span>}
                      {isCompleted && <span className="badge badge-completed">Completed</span>}
                      {isUpcoming && <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{matchDate ? matchDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''}</span>}
                    </div>
                  </div>

                  <div className="mc-teams">
                    <div className="mc-team">
                      <div className="mc-team-logo">{teamFlag(idx1)}</div>
                      <div>
                        <div className="mc-team-name">{m.team1Name}</div>
                        {m.team1Score != null && <div className="mc-team-score">{m.team1Score}/{m.team1Wickets || 0}</div>}
                      </div>
                    </div>
                    <div className="mc-vs">VS</div>
                    <div className="mc-team" style={{ flexDirection: 'row-reverse' }}>
                      <div className="mc-team-logo">{teamFlag(idx2)}</div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="mc-team-name">{m.team2Name}</div>
                        {m.team2Score != null && <div className="mc-team-score">{m.team2Score}/{m.team2Wickets || 0}</div>}
                      </div>
                    </div>
                  </div>

                  <div className="mc-card-footer">
                    <div>
                      {m.result && <span className="mc-result">{m.result}</span>}
                      {isUpcoming && !m.result && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{m.venue}</span>}
                      {m.status === 'LIVE' && !m.result && <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>● Live Coverage</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {isUpcoming && <button className="icon-btn" title="Set reminder" style={{ width: 28, height: 28, fontSize: 13 }}>🔔</button>}
                      <Link to={`/matches/${m.id}/scorecard`} className="btn btn-ghost btn-sm">Scorecard</Link>
                      {isScorer && (
                        <>
                          {m.status === 'SCHEDULED' && (
                            <button className="btn btn-success btn-sm" onClick={() => quickStatus(m, 'LIVE')}>▶ Start</button>
                          )}
                          <Link to={`/admin/matches/${m.id}/score`} className="btn btn-primary btn-sm">
                            {m.status === 'LIVE' ? 'Score Live' : 'Manage'}
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Earlier This Week */}
        {(filter === 'ALL' || filter === 'COMPLETED') && earlierMatches.length > 0 && (
          <div>
            <div className="section-title">Earlier This Week</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {earlierMatches.map(m => {
                const idx1 = teamIdx(m.team1Id);
                const idx2 = teamIdx(m.team2Id);
                const isTeam1Winner = m.winnerId === m.team1Id;
                const isTeam2Winner = m.winnerId === m.team2Id;
                return (
                  <div key={m.id} className="week-match-row">
                    <div>
                      <div className="week-match-meta">{m.matchType || 'Match'}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
                        {m.status === 'COMPLETED' ? 'Final Result' : m.status}
                      </div>
                    </div>
                    <div className="week-team">
                      <div className="week-team-flag">{teamFlag(idx1)}</div>
                      <span className="week-team-name">{m.team1Name}</span>
                    </div>
                    <div>
                      <div className={`week-team-score ${isTeam1Winner ? 'winner' : isTeam2Winner ? 'loser' : ''}`}>
                        {m.team1Score != null ? `${m.team1Score}/${m.team1Wickets || 0}` : '—'}
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div className={`week-team-score ${isTeam2Winner ? 'winner' : isTeam1Winner ? 'loser' : ''}`}>
                          {m.team2Score != null ? `${m.team2Score}/${m.team2Wickets || 0}` : '—'}
                        </div>
                      </div>
                    </div>
                    <div className="week-team" style={{ flexDirection: 'row-reverse' }}>
                      <div className="week-team-flag">{teamFlag(idx2)}</div>
                      <span className="week-team-name">{m.team2Name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                      {m.result && <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 500 }}>{m.result}</span>}
                      <Link to={`/matches/${m.id}/scorecard`} className="btn btn-ghost btn-sm">View</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Create Match Modal */}
      {showCreate && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="modal modal-md">
            <div className="modal-header">
              <div className="modal-title">Schedule New Match</div>
              <button className="close-btn" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Match Number</label>
                    <input className="form-input" type="number" min="1" placeholder="e.g. 1" required value={form.matchNumber} onChange={e => setForm(f => ({ ...f, matchNumber: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Overs</label>
                    <input className="form-input" type="number" min="1" max="50" value={form.overs} onChange={e => setForm(f => ({ ...f, overs: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Venue</label>
                  <input className="form-input" placeholder="e.g. Eden Gardens, Kolkata" required value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Match Date & Time</label>
                  <input className="form-input" type="datetime-local" value={form.matchDateTime} onChange={e => setForm(f => ({ ...f, matchDateTime: e.target.value }))} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Team 1</label>
                    <select className="form-select" required value={form.team1Id} onChange={e => setForm(f => ({ ...f, team1Id: e.target.value }))}>
                      <option value="">— Select team —</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Team 2</label>
                    <select className="form-select" required value={form.team2Id} onChange={e => setForm(f => ({ ...f, team2Id: e.target.value }))}>
                      <option value="">— Select team —</option>
                      {teams.filter(t => t.id !== +form.team1Id).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Scheduling...' : 'Schedule Match'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
