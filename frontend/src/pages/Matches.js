import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMatches, createMatch, updateScore, getTeams, deleteMatch } from '../services/api';
import { useAuth } from '../context/AuthContext';

const PALETTE = ['#b3261e','#1a73e8','#e37400','#7c3aed','#0097a7','#e91e63','#5d4037','#2e7d32'];

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function TeamBadge({ name, idx }) {
  const color = PALETTE[idx % PALETTE.length];
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%',
      background: color + '18', border: `2px solid ${color}40`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 11,
      color, flexShrink: 0,
    }}>
      {initials(name)}
    </div>
  );
}

function formatDateTime(dt) {
  if (!dt) return '—';
  const d = new Date(dt);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' · ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export default function AdminMatches() {
  const { id } = useParams();
  const [matches, setMatches]     = useState([]);
  const [teams, setTeams]         = useState([]);
  const [filter, setFilter]       = useState('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]           = useState({ matchNumber: '', venue: '', matchDateTime: '', team1Id: '', team2Id: '', overs: 3 });
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(null); // id of match being deleted
  const [endMatch, setEndMatch]   = useState(null); // match being ended
  const [endForm, setEndForm]     = useState({ winnerId: '', result: '' });
  const { isScorer }              = useAuth();

  useEffect(() => {
    load();
    getTeams(id).then(r => setTeams(r.data || []));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const load = () => getMatches(id).then(r => setMatches(r.data || []));

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await createMatch({ ...form, tournamentId: +id, overs: +form.overs, team1Id: +form.team1Id, team2Id: +form.team2Id, matchNumber: +form.matchNumber });
      setShowCreate(false);
      setForm({ matchNumber: '', venue: '', matchDateTime: '', team1Id: '', team2Id: '', overs: 3 });
      load();
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (match) => {
    if (!window.confirm(`Delete Match #${match.matchNumber} (${match.team1Name} vs ${match.team2Name})? This cannot be undone.`)) return;
    setDeleting(match.id);
    try {
      await deleteMatch(match.id);
      load();
    } catch {
      alert('Failed to delete match. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const quickStatus = async (match, status) => {
    await updateScore(match.id, { team: 'team1', score: match.team1Score || 0, wickets: match.team1Wickets || 0, overs: match.team1Overs || 0, status });
    load();
  };

  const openEndMatch = (match) => {
    setEndMatch(match);
    setEndForm({ winnerId: '', result: '' });
  };

  const handleEndMatch = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await updateScore(endMatch.id, {
        team: 'team1',
        score: endMatch.team1Score || 0,
        wickets: endMatch.team1Wickets || 0,
        overs: endMatch.team1Overs || 0,
        status: 'COMPLETED',
        winnerId: endForm.winnerId ? +endForm.winnerId : undefined,
        result: endForm.result || undefined,
      });
      setEndMatch(null);
      load();
    } catch {}
    setSaving(false);
  };

  const teamIdx = (tid) => teams.findIndex(t => t.id === tid);

  const liveMatches     = matches.filter(m => m.status === 'LIVE');
  const scheduled       = matches.filter(m => m.status === 'SCHEDULED');
  const completed       = matches.filter(m => m.status === 'COMPLETED');

  const filtered = filter === 'ALL' ? matches
    : filter === 'LIVE' ? liveMatches
    : filter === 'SCHEDULED' ? scheduled
    : completed;

  const tabs = [
    { key: 'ALL',       label: 'All',       count: matches.length },
    { key: 'LIVE',      label: 'Live',      count: liveMatches.length, dot: true },
    { key: 'SCHEDULED', label: 'Upcoming',  count: scheduled.length },
    { key: 'COMPLETED', label: 'Completed', count: completed.length },
  ];

  return (
    <div className="page-content" style={{ paddingTop: 24 }}>

      {/* Page header */}
      <div className="page-header" style={{ padding: '0 0 20px' }}>
        <div className="page-header-left">
          <div>
            <div className="page-header-title">Matches</div>
            <div className="page-header-sub">
              {matches.length} matches · {liveMatches.length} live · {scheduled.length} upcoming
            </div>
          </div>
        </div>
        <div className="page-header-right">
          {isScorer && (
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Schedule Match</button>
          )}
        </div>
      </div>

      {/* Live match banner */}
      {liveMatches.map(lm => (
        <div key={lm.id} className="am-live-banner">
          <div className="am-live-banner-inner">
            <div className="am-live-badge">
              <span className="am-live-dot" />
              LIVE NOW
            </div>
            <div className="am-live-teams">
              <div className="am-live-team">
                <TeamBadge name={lm.team1Name} idx={teamIdx(lm.team1Id)} />
                <div>
                  <div className="am-live-team-name">{lm.team1Name}</div>
                  {lm.team1Score != null && (
                    <div className="am-live-score">{lm.team1Score}<span className="am-live-wkts">/{lm.team1Wickets || 0}</span>
                      {lm.team1Overs > 0 && <span className="am-live-overs"> ({lm.team1Overs} ov)</span>}
                    </div>
                  )}
                </div>
              </div>
              <div className="am-live-vs">VS</div>
              <div className="am-live-team am-live-team-r">
                <div style={{ textAlign: 'right' }}>
                  <div className="am-live-team-name">{lm.team2Name}</div>
                  {lm.team2Score != null && (
                    <div className="am-live-score">{lm.team2Score}<span className="am-live-wkts">/{lm.team2Wickets || 0}</span>
                      {lm.team2Overs > 0 && <span className="am-live-overs"> ({lm.team2Overs} ov)</span>}
                    </div>
                  )}
                </div>
                <TeamBadge name={lm.team2Name} idx={teamIdx(lm.team2Id)} />
              </div>
            </div>
            {lm.result && <div className="am-live-result">🏆 {lm.result}</div>}
            <div className="am-live-actions">
              <Link to={`/matches/${lm.id}/scorecard`} className="btn btn-ghost btn-sm">Scorecard</Link>
              {isScorer && (
                <Link to={`/admin/matches/${lm.id}/score`} className="btn btn-primary btn-sm">Score Live →</Link>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Stats strip */}
      <div className="am-stats-strip">
        {[
          { label: 'Total', value: matches.length,       color: 'var(--text-1)' },
          { label: 'Live',      value: liveMatches.length, color: 'var(--red)' },
          { label: 'Upcoming',  value: scheduled.length,   color: 'var(--blue)' },
          { label: 'Completed', value: completed.length,   color: 'var(--green)' },
        ].map(s => (
          <div key={s.label} className="am-stat-pill">
            <div className="am-stat-val" style={{ color: s.color }}>{s.value}</div>
            <div className="am-stat-lbl">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs + match list */}
      <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
        <div className="am-tab-bar">
          {tabs.map(t => (
            <button key={t.key}
              className={`am-tab${filter === t.key ? ' active' : ''}`}
              onClick={() => setFilter(t.key)}>
              {t.dot && t.count > 0 && <span className="am-tab-dot" />}
              {t.label}
              <span className="am-tab-count">{t.count}</span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: '48px 24px' }}>
            <div className="empty-state-icon">🎯</div>
            <h3>No {filter !== 'ALL' ? filter.toLowerCase() : ''} matches</h3>
            <p>{isScorer ? 'Schedule a new match to get started' : 'No matches in this category yet'}</p>
          </div>
        ) : (
          <div className="am-match-list">
            {filtered.map((m, i) => {
              const isLive      = m.status === 'LIVE';
              const isCompleted = m.status === 'COMPLETED';
              const isScheduled = m.status === 'SCHEDULED';
              const idx1 = teamIdx(m.team1Id);
              const idx2 = teamIdx(m.team2Id);

              return (
                <div key={m.id} className={`am-match-row${isLive ? ' am-row-live' : ''}`}>
                  {/* Match info */}
                  <div className="am-row-info">
                    <span className="am-row-num">#{m.matchNumber}</span>
                    <div className="am-row-meta">
                      {m.matchDateTime && <span>{formatDateTime(m.matchDateTime)}</span>}
                      {m.venue && <span className="am-row-venue">📍 {m.venue}</span>}
                      {m.overs && <span className="am-row-overs">{m.overs} ov</span>}
                    </div>
                  </div>

                  {/* Teams + scores */}
                  <div className="am-row-teams">
                    <div className="am-row-team">
                      <TeamBadge name={m.team1Name} idx={idx1} />
                      <div className="am-row-team-info">
                        <div className="am-row-team-name">{m.team1Name}</div>
                        {m.team1Score != null
                          ? <div className="am-row-team-score">{m.team1Score}/{m.team1Wickets || 0}
                              {m.team1Overs > 0 && <span className="am-row-team-overs"> ({m.team1Overs} ov)</span>}
                            </div>
                          : <div className="am-row-yet">Yet to bat</div>}
                      </div>
                    </div>

                    <div className="am-row-vs">VS</div>

                    <div className="am-row-team am-row-team-r">
                      <div className="am-row-team-info" style={{ alignItems: 'flex-end', textAlign: 'right' }}>
                        <div className="am-row-team-name">{m.team2Name}</div>
                        {m.team2Score != null
                          ? <div className="am-row-team-score">{m.team2Score}/{m.team2Wickets || 0}
                              {m.team2Overs > 0 && <span className="am-row-team-overs"> ({m.team2Overs} ov)</span>}
                            </div>
                          : <div className="am-row-yet">Yet to bat</div>}
                      </div>
                      <TeamBadge name={m.team2Name} idx={idx2} />
                    </div>
                  </div>

                  {/* Status + result */}
                  <div className="am-row-status">
                    {isLive      && <span className="badge badge-live">● Live</span>}
                    {isCompleted && <span className="badge badge-completed">Final</span>}
                    {isScheduled && <span className="badge badge-scheduled">Upcoming</span>}
                    {m.result && <div className="am-row-result">{m.result}</div>}
                  </div>

                  {/* Actions */}
                  <div className="am-row-actions">
                    <Link to={`/matches/${m.id}/scorecard`} className="btn btn-ghost btn-sm">Scorecard</Link>
                    {isScorer && (
                      <>
                        {isScheduled && (
                          <button className="btn btn-success btn-sm" onClick={() => quickStatus(m, 'LIVE')}>▶ Start</button>
                        )}
                        {isLive && (
                          <button className="btn btn-end btn-sm" onClick={() => openEndMatch(m)}>■ End</button>
                        )}
                        <Link to={`/admin/matches/${m.id}/score`} className="btn btn-primary btn-sm">
                          {isLive ? 'Score Live' : 'Manage'}
                        </Link>
                        <button
                          className="btn btn-sm"
                          style={{ background: 'var(--red-muted)', color: 'var(--red)', border: '1px solid var(--red)' }}
                          onClick={() => handleDelete(m)}
                          disabled={deleting === m.id}
                          title="Delete match">
                          {deleting === m.id ? '…' : '🗑'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
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
                    <input className="form-input" type="number" min="1" placeholder="1" required
                      value={form.matchNumber} onChange={e => setForm(f => ({ ...f, matchNumber: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Overs</label>
                    <input className="form-input" type="number" min="1" max="50"
                      value={form.overs} onChange={e => setForm(f => ({ ...f, overs: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Venue</label>
                  <input className="form-input" placeholder="e.g. Ground A, City" required
                    value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Match Date & Time</label>
                  <input className="form-input" type="datetime-local"
                    value={form.matchDateTime} onChange={e => setForm(f => ({ ...f, matchDateTime: e.target.value }))} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Team 1</label>
                    <select className="form-select" required value={form.team1Id}
                      onChange={e => setForm(f => ({ ...f, team1Id: e.target.value }))}>
                      <option value="">— Select team —</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Team 2</label>
                    <select className="form-select" required value={form.team2Id}
                      onChange={e => setForm(f => ({ ...f, team2Id: e.target.value }))}>
                      <option value="">— Select team —</option>
                      {teams.filter(t => t.id !== +form.team1Id).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Scheduling...' : 'Schedule Match'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* End Match Modal */}
      {endMatch && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setEndMatch(null)}>
          <div className="modal modal-sm">
            <div className="modal-header" style={{ borderTop: '3px solid var(--red)' }}>
              <div className="modal-title">End Match #{endMatch.matchNumber}</div>
              <button className="close-btn" onClick={() => setEndMatch(null)}>×</button>
            </div>
            <form onSubmit={handleEndMatch}>
              <div className="modal-body">
                <div style={{ background: 'var(--red-muted)', border: '1px solid rgba(179,38,30,0.2)', borderRadius: 'var(--r-md)', padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>
                  This will mark the match as completed and stop live scoring.
                </div>
                <div className="form-group">
                  <label className="form-label">Winner</label>
                  <select className="form-select" value={endForm.winnerId}
                    onChange={e => {
                      const wid = e.target.value;
                      const winner = wid === String(endMatch.team1Id) ? endMatch.team1Name
                        : wid === String(endMatch.team2Id) ? endMatch.team2Name : null;
                      setEndForm(f => ({ ...f, winnerId: wid, result: winner ? `${winner} won` : '' }));
                    }}>
                    <option value="">-- No result / Tie --</option>
                    <option value={endMatch.team1Id}>{endMatch.team1Name}</option>
                    <option value={endMatch.team2Id}>{endMatch.team2Name}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Result description <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span></label>
                  <input className="form-input" placeholder="e.g. Won by 5 wickets"
                    value={endForm.result}
                    onChange={e => setEndForm(f => ({ ...f, result: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setEndMatch(null)}>Cancel</button>
                <button type="submit" className="btn btn-danger" disabled={saving}>
                  {saving ? 'Ending...' : '■ End Match'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
