import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTeams, createTeam, deleteTeam, getTournament } from '../services/api';
import { useAuth } from '../context/AuthContext';

const COLORS = [
  { name: 'Gold', value: '#d4a017' }, { name: 'Royal Blue', value: '#1565c0' },
  { name: 'Emerald', value: '#2e7d32' }, { name: 'Crimson', value: '#c62828' },
  { name: 'Violet', value: '#6a1b9a' }, { name: 'Teal', value: '#00695c' },
  { name: 'Orange', value: '#e65100' }, { name: 'Rose', value: '#ad1457' },
];

export default function Teams({ readOnly }) {
  const { id } = useParams();
  const [teams, setTeams] = useState([]);
  const [tournament, setTournament] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', shortName: '', logoColor: '#1565c0', logoUrl: '' });
  const [saving, setSaving] = useState(false);
  const { isAdmin } = useAuth();
  const canEdit = !readOnly && isAdmin;

  useEffect(() => {
    getTeams(id).then(r => setTeams(r.data));
    getTournament(id).then(r => setTournament(r.data));
  }, [id]);

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    await createTeam({ ...form, tournamentId: +id });
    setShowCreate(false);
    setForm({ name: '', shortName: '', logoColor: '#1565c0', logoUrl: '' });
    getTeams(id).then(r => setTeams(r.data));
    setSaving(false);
  };

  const handleDelete = async (tid) => {
    if (!window.confirm('Delete this team? All players will also be removed.')) return;
    await deleteTeam(tid);
    getTeams(id).then(r => setTeams(r.data));
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div>
            <div className="page-header-title">Teams</div>
            {tournament && <div className="page-header-sub">{tournament.name}</div>}
          </div>
        </div>
        <div className="page-header-right">
          {canEdit && <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Add Team</button>}
        </div>
      </div>

      <div className="page-content">
        <div className="breadcrumb">
          <Link to={readOnly ? `/tournaments/${id}` : `/admin/tournaments/${id}`}>Overview</Link>
          <span className="breadcrumb-sep">/</span>
          <span>Teams</span>
        </div>

        {teams.length === 0 ? (
          <div className="card"><div className="empty-state">
            <div className="empty-state-icon">🛡</div>
            <h3>No teams yet</h3>
            <p>{canEdit ? 'Add the first team to this tournament' : 'Teams will appear here once added'}</p>
          </div></div>
        ) : (
          <div className="grid-auto">
            {teams.map(t => (
              <div key={t.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Color bar */}
                <div style={{ height: 6, background: t.logoColor || 'var(--gold)' }} />
                <div style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{
                        width: 52, height: 52, borderRadius: 'var(--r-md)',
                        background: t.logoUrl ? '#fff' : (t.logoColor || 'var(--gold)'),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 18, color: '#fff',
                        boxShadow: `0 4px 12px ${t.logoColor || 'var(--gold)'}44`,
                        overflow: 'hidden',
                      }}>
                        {t.logoUrl
                          ? <img src={t.logoUrl} alt={t.shortName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={e => { e.target.style.display = 'none'; }} />
                          : t.shortName?.slice(0, 3)
                        }
                      </div>
                      <div>
                        <div style={{ fontFamily: 'Rajdhani', fontSize: 20, fontWeight: 700, color: 'var(--text-1)' }}>{t.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{t.playerCount || 0} players</div>
                      </div>
                    </div>
                    {canEdit && (
                      <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(t.id)} title="Delete team">✕</button>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="team-stats-grid" style={{ marginBottom: 14 }}>
                    {[['M', t.matchesPlayed], ['W', t.matchesWon], ['L', t.matchesLost], ['Pts', t.points]].map(([label, val]) => (
                      <div key={label} style={{ textAlign: 'center', background: 'var(--navy-3)', borderRadius: 'var(--r-sm)', padding: '8px 4px' }}>
                        <div style={{ fontFamily: 'Rajdhani', fontSize: 18, fontWeight: 700, color: label === 'W' ? 'var(--green)' : label === 'L' ? 'var(--red)' : label === 'Pts' ? 'var(--gold-light)' : 'var(--text-1)' }}>{val || 0}</div>
                        <div style={{ fontSize: 9, color: 'var(--text-3)', letterSpacing: 1, textTransform: 'uppercase' }}>{label}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 12, color: t.netRunRate > 0 ? 'var(--green)' : t.netRunRate < 0 ? 'var(--red)' : 'var(--text-3)' }}>
                      NRR: {t.netRunRate > 0 ? '+' : ''}{t.netRunRate?.toFixed(3) || '0.000'}
                    </div>
                    <Link to={readOnly ? `/tournaments/${id}/players` : `/admin/tournaments/${id}/players`} className="btn btn-ghost btn-sm">
                      View Squad →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="modal modal-sm">
            <div className="modal-header">
              <div className="modal-title">Add Team</div>
              <button className="close-btn" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Team Name</label>
                  <input className="form-input" placeholder="e.g. Chennai Super Kings" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Short Name</label>
                  <input className="form-input" placeholder="e.g. CSK" maxLength={5} required value={form.shortName} onChange={e => setForm(f => ({ ...f, shortName: e.target.value.toUpperCase() }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Team Color</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                    {COLORS.map(c => (
                      <button key={c.value} type="button"
                        onClick={() => setForm(f => ({ ...f, logoColor: c.value }))}
                        style={{
                          width: 32, height: 32, borderRadius: 8, background: c.value, border: 'none',
                          outline: form.logoColor === c.value ? `3px solid white` : 'none',
                          cursor: 'pointer', transition: 'transform 0.15s',
                          transform: form.logoColor === c.value ? 'scale(1.2)' : 'scale(1)',
                        }} title={c.name} />
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Logo URL <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span></label>
                  <input className="form-input" type="url" placeholder="https://example.com/logo.png"
                    value={form.logoUrl} onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))} />
                  {form.logoUrl && (
                    <div style={{ marginTop: 8 }}>
                      <img src={form.logoUrl} alt="logo preview" style={{ height: 40, objectFit: 'contain', border: '1px solid var(--card-border)', borderRadius: 6, padding: 4 }}
                        onError={e => e.target.style.display = 'none'} />
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Adding...' : 'Add Team'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
