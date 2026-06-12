import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTournaments, createTournament, deleteTournament, updateTournamentStatus } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUS_CYCLE = { UPCOMING: 'ONGOING', ONGOING: 'COMPLETED', COMPLETED: 'UPCOMING' };

export default function Tournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', location: '', startDate: '', endDate: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { isAdmin } = useAuth();

  useEffect(() => { load(); }, []);
  const load = () => getTournaments().then(r => { setTournaments(r.data); setLoading(false); });

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await createTournament(form);
      setShowModal(false);
      setForm({ name: '', location: '', startDate: '', endDate: '' });
      load();
    } catch { setError('Failed to create tournament. Please try again.'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this tournament? All associated data will be permanently removed.')) return;
    try { await deleteTournament(id); load(); } catch { alert('Failed to delete.'); }
  };

  const cycleStatus = async (t) => {
    const next = STATUS_CYCLE[t.status] || 'UPCOMING';
    await updateTournamentStatus(t.id, next);
    load();
  };

  if (loading) return <div className="loading"><div className="spinner" /><span>Loading tournaments...</span></div>;

  const ongoing = tournaments.filter(t => t.status === 'ONGOING');
  const upcoming = tournaments.filter(t => t.status === 'UPCOMING');
  const completed = tournaments.filter(t => t.status === 'COMPLETED');

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div>
            <div className="page-header-title">Tournaments</div>
            <div className="page-header-sub">{tournaments.length} total · {ongoing.length} active</div>
          </div>
        </div>
        <div className="page-header-right">
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Create Tournament</button>
          )}
        </div>
      </div>

      <div className="page-content">
        {/* Overview stats */}
        <div className="stats-row" style={{ marginBottom: 28 }}>
          <div className="stat-card">
            <div className="stat-card-icon">🏆</div>
            <div className="stat-value">{tournaments.length}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon">⚡</div>
            <div className="stat-value" style={{ color: 'var(--gold-light)' }}>{ongoing.length}</div>
            <div className="stat-label">Active</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon">📅</div>
            <div className="stat-value" style={{ color: 'var(--blue)' }}>{upcoming.length}</div>
            <div className="stat-label">Upcoming</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon">✅</div>
            <div className="stat-value" style={{ color: 'var(--green)' }}>{completed.length}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>

        {tournaments.length === 0 ? (
          <div className="card"><div className="empty-state">
            <div className="empty-state-icon">🏆</div>
            <h3>No tournaments yet</h3>
            <p>Create your first cricket tournament to get started</p>
            {isAdmin && <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>Create Tournament</button>}
          </div></div>
        ) : (
          <div className="grid-auto">
            {tournaments.map(t => (
              <div key={t.id} className="card" style={{ overflow: 'hidden', transition: 'all 0.2s' }}
                onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(212,160,23,0.3)'}
                onMouseOut={e => e.currentTarget.style.borderColor = 'var(--card-border)'}>
                {/* Color accent top bar */}
                <div style={{
                  height: 4, background:
                    t.status === 'ONGOING' ? 'var(--grad-gold)' :
                    t.status === 'COMPLETED' ? 'var(--green)' :
                    'var(--card-border)'
                }} />

                <div style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div style={{ fontSize: 28 }}>🏏</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className={`badge badge-${t.status.toLowerCase()}`}>{t.status}</span>
                      {isAdmin && (
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => cycleStatus(t)} title={`Move to ${STATUS_CYCLE[t.status]}`} style={{ fontSize: 14 }}>⟳</button>
                      )}
                    </div>
                  </div>

                  <div style={{ fontFamily: 'Rajdhani', fontSize: 22, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4, lineHeight: 1.2 }}>
                    {t.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12 }}>📍 {t.location}</div>

                  {(t.startDate || t.endDate) && (
                    <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>📅</span>
                      <span>{t.startDate}</span>
                      {t.endDate && <><span style={{ color: 'var(--text-3)' }}>→</span><span>{t.endDate}</span></>}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>
                    <span>🛡 {t.teamCount || 0} teams</span>
                    <span>🎯 {t.matchCount || 0} matches</span>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link to={`/admin/tournaments/${t.id}`} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                      Manage
                    </Link>
                    <Link to={`/admin/tournaments/${t.id}/matches`} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                      Matches
                    </Link>
                    {isAdmin && (
                      <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(t.id)} title="Delete tournament">✕</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal modal-sm">
            <div className="modal-header">
              <div className="modal-title">Create Tournament</div>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="auth-error">{error}</div>}
                <div className="form-group">
                  <label className="form-label">Tournament Name</label>
                  <input className="form-input" placeholder="e.g. IPL 2025" required
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Location / Host City</label>
                  <input className="form-input" placeholder="e.g. Mumbai, India" required
                    value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input className="form-input" type="date" value={form.startDate}
                      onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input className="form-input" type="date" value={form.endDate}
                      onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Tournament'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
