import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTeams, getPlayers, createPlayer, deletePlayer, getTopBatsmen, getTopBowlers } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ROLES = ['BATSMAN', 'BOWLER', 'ALL_ROUNDER', 'WICKET_KEEPER'];
const ROLE_LABEL = { BATSMAN: 'Bat', BOWLER: 'Bowl', ALL_ROUNDER: 'All', WICKET_KEEPER: 'WK' };
const ROLE_COLOR = { BATSMAN: 'var(--green)', BOWLER: '#82b1ff', ALL_ROUNDER: 'var(--gold-light)', WICKET_KEEPER: 'var(--cyan)' };

export default function Players({ readOnly }) {
  const { id } = useParams();
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [activeTab, setActiveTab] = useState('squad');
  const [topBatsmen, setTopBatsmen] = useState([]);
  const [topBowlers, setTopBowlers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', role: 'BATSMAN', jerseyNumber: '', photoUrl: '', teamId: '' });
  const [saving, setSaving] = useState(false);
  const { isAdmin } = useAuth();
  const canEdit = !readOnly && isAdmin;
  const base = readOnly ? `/tournaments/${id}` : `/admin/tournaments/${id}`;

  useEffect(() => {
    getTeams(id).then(r => {
      const data = r.data || [];
      setTeams(data);
      if (data.length > 0) {
        setSelectedTeam(String(r.data[0].id));
        setForm(f => ({ ...f, teamId: String(r.data[0].id) }));
      }
    });
    getTopBatsmen(id).then(r => setTopBatsmen(r.data || []));
    getTopBowlers(id).then(r => setTopBowlers(r.data || []));
  }, [id]);

  useEffect(() => {
    if (selectedTeam) getPlayers(selectedTeam).then(r => setPlayers(r.data || []));
  }, [selectedTeam]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    await createPlayer({ ...form, teamId: parseInt(form.teamId, 10) });
    setShowModal(false);
    if (selectedTeam) getPlayers(selectedTeam).then(r => setPlayers(r.data || []));
    setSaving(false);
  };

  const handleDelete = async (playerId) => {
    if (!window.confirm('Remove this player from the squad?')) return;
    await deletePlayer(playerId);
    getPlayers(selectedTeam).then(r => setPlayers(r.data));
  };

  const initials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-title">Players & Stats</div>
        </div>
        <div className="page-header-right">
          {canEdit && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Player</button>
          )}
        </div>
      </div>

      <div className="page-content">
        <div className="breadcrumb">
          <Link to={base}>Overview</Link>
          <span className="breadcrumb-sep">/</span>
          <span>Players</span>
        </div>

        <div className="tabs">
          <button className={`tab ${activeTab === 'squad' ? 'active' : ''}`} onClick={() => setActiveTab('squad')}>👥 Squad</button>
          <button className={`tab ${activeTab === 'batting' ? 'active' : ''}`} onClick={() => setActiveTab('batting')}>🏏 Batting Stats</button>
          <button className={`tab ${activeTab === 'bowling' ? 'active' : ''}`} onClick={() => setActiveTab('bowling')}>🎳 Bowling Stats</button>
        </div>

        {activeTab === 'squad' && (
          <>
            {/* Team selector */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {teams.map(t => (
                <button key={t.id}
                  className={`btn btn-sm ${selectedTeam === String(t.id) ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setSelectedTeam(String(t.id))}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.logoColor || 'var(--gold)' }} />
                  {t.name}
                </button>
              ))}
            </div>

            {players.length === 0 ? (
              <div className="card"><div className="empty-state">
                <div className="empty-state-icon">👥</div>
                <h3>No players in squad</h3>
                <p>{canEdit ? 'Add players to build this team\'s squad' : 'Squad will appear once players are added'}</p>
              </div></div>
            ) : (
              <div className="grid-auto">
                {players.map((p, i) => (
                  <div key={p.id} className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.15s' }}
                    onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(212,160,23,0.25)'}
                    onMouseOut={e => e.currentTarget.style.borderColor = 'var(--card-border)'}>
                    {/* Avatar */}
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: `linear-gradient(135deg, var(--navy-3), var(--navy-4))`,
                      border: `2px solid ${ROLE_COLOR[p.role] || 'var(--card-border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 15, color: 'var(--text-1)',
                      flexShrink: 0, overflow: 'hidden',
                    }}>
                      {p.photoUrl
                        ? <img src={p.photoUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} onError={e => { e.target.style.display = 'none'; }} />
                        : (p.jerseyNumber ? `#${p.jerseyNumber}` : initials(p.name))
                      }
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, letterSpacing: 0.8,
                          color: ROLE_COLOR[p.role] || 'var(--text-3)',
                          textTransform: 'uppercase',
                        }}>
                          {ROLE_LABEL[p.role] || p.role}
                        </span>
                        {p.totalRuns > 0 && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>· {p.totalRuns} runs</span>}
                        {p.totalWickets > 0 && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>· {p.totalWickets} wkts</span>}
                      </div>
                    </div>

                    {canEdit && (
                      <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(p.id)} title="Remove player">✕</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'batting' && (
          <div className="card">
            <div className="card-header">
              <div className="card-title"><span className="card-title-icon">🏏</span>Batting Rankings</div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>#</th>
                    <th>Player</th>
                    <th className="right">Inns</th>
                    <th className="right">NO</th>
                    <th className="right">Runs</th>
                    <th className="right">HS</th>
                    <th className="right">Avg</th>
                    <th className="right">SR</th>
                    <th className="right">100s</th>
                    <th className="right">50s</th>
                    <th className="right">4s</th>
                    <th className="right">6s</th>
                  </tr>
                </thead>
                <tbody>
                  {topBatsmen.map((p, i) => (
                    <tr key={p.id}>
                      <td><span className={`rank-cell rank-${i < 3 ? i + 1 : 'other'}`}>{i + 1}</span></td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: ROLE_COLOR[p.role] || 'var(--text-3)' }}>
                          {p.teamShortName || p.teamName} · {ROLE_LABEL[p.role] || p.role}
                        </div>
                      </td>
                      <td className="right td-mono">{p.inningsBatted}</td>
                      <td className="right td-mono">{p.notOuts}</td>
                      <td className="right td-mono" style={{ color: 'var(--gold-light)', fontWeight: 700, fontSize: 15 }}>{p.totalRuns}</td>
                      <td className="right td-mono">{p.highestScore}</td>
                      <td className="right td-mono">{typeof p.battingAverage === 'number' ? p.battingAverage.toFixed(2) : (p.battingAverage || '-')}</td>
                      <td className="right td-mono">{typeof p.battingStrikeRate === 'number' ? p.battingStrikeRate.toFixed(1) : (p.battingStrikeRate || '-')}</td>
                      <td className="right td-mono" style={{ color: 'var(--gold-light)' }}>{p.hundreds}</td>
                      <td className="right td-mono" style={{ color: 'var(--green)' }}>{p.fifties}</td>
                      <td className="right td-mono">{p.totalFours}</td>
                      <td className="right td-mono">{p.totalSixes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {topBatsmen.length === 0 && <div className="empty-state"><p>No batting data recorded yet</p></div>}
          </div>
        )}

        {activeTab === 'bowling' && (
          <div className="card">
            <div className="card-header">
              <div className="card-title"><span className="card-title-icon">🎳</span>Bowling Rankings</div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>#</th>
                    <th>Player</th>
                    <th className="right">Overs</th>
                    <th className="right">Mdns</th>
                    <th className="right">Runs</th>
                    <th className="right">Wkts</th>
                    <th className="right">Best</th>
                    <th className="right">Avg</th>
                    <th className="right">Eco</th>
                    <th className="right">5W</th>
                  </tr>
                </thead>
                <tbody>
                  {topBowlers.map((p, i) => (
                    <tr key={p.id}>
                      <td><span className={`rank-cell rank-${i < 3 ? i + 1 : 'other'}`}>{i + 1}</span></td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: ROLE_COLOR[p.role] || 'var(--text-3)' }}>
                          {p.teamShortName || p.teamName} · {ROLE_LABEL[p.role] || p.role}
                        </div>
                      </td>
                      <td className="right td-mono">{p.totalOversBowled || p.oversBowled || '-'}</td>
                      <td className="right td-mono">{p.maidens || 0}</td>
                      <td className="right td-mono">{p.totalRunsConceded || p.runsConceded || 0}</td>
                      <td className="right td-mono" style={{ color: 'var(--green)', fontWeight: 700, fontSize: 15 }}>{p.totalWickets}</td>
                      <td className="right td-mono">{p.bestBowling || '-'}</td>
                      <td className="right td-mono">{typeof p.bowlingAverage === 'number' ? p.bowlingAverage.toFixed(2) : (p.bowlingAverage || '-')}</td>
                      <td className="right td-mono">{typeof p.bowlingEconomy === 'number' ? p.bowlingEconomy.toFixed(2) : (p.bowlingEconomy || '-')}</td>
                      <td className="right td-mono" style={{ color: p.fiveWicketHauls > 0 ? 'var(--gold-light)' : 'inherit' }}>{p.fiveWicketHauls}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {topBowlers.length === 0 && <div className="empty-state"><p>No bowling data recorded yet</p></div>}
          </div>
        )}
      </div>

      {/* Add Player Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal modal-sm">
            <div className="modal-header">
              <div className="modal-title">Add Player</div>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" placeholder="e.g. Virat Kohli" required
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select className="form-select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                      {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Jersey #</label>
                    <input className="form-input" type="number" min="1" max="99" placeholder="e.g. 18"
                      value={form.jerseyNumber} onChange={e => setForm(f => ({ ...f, jerseyNumber: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Photo URL <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span></label>
                  <input className="form-input" type="url" placeholder="https://example.com/photo.jpg"
                    value={form.photoUrl} onChange={e => setForm(f => ({ ...f, photoUrl: e.target.value }))} />
                  {form.photoUrl && (
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <img src={form.photoUrl} alt="preview" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--card-border)' }}
                        onError={e => e.target.style.display = 'none'} />
                      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Preview</span>
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Team</label>
                  <select className="form-select" required value={form.teamId} onChange={e => setForm(f => ({ ...f, teamId: e.target.value }))}>
                    <option value="">— Select team —</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Adding...' : 'Add Player'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
