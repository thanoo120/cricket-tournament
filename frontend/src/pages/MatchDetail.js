import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMatch, getTeams, getPlayers, addBattingPerformance, addBowlingPerformance } from '../services/api';

const DISMISSALS = ['BOWLED', 'CAUGHT', 'LBW', 'RUN_OUT', 'STUMPED', 'HIT_WICKET', 'RETIRED', 'NOT_OUT'];

export default function MatchDetail() {
  const { id } = useParams();
  const [match, setMatch] = useState(null);
  const [activeTab, setActiveTab] = useState('batting1');
  const [showBattingModal, setShowBattingModal] = useState(false);
  const [showBowlingModal, setShowBowlingModal] = useState(false);
  const [team1Players, setTeam1Players] = useState([]);
  const [team2Players, setTeam2Players] = useState([]);
  const [saving, setSaving] = useState(false);
  const [battingForm, setBattingForm] = useState({ playerId: '', teamId: '', runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, dismissalType: 'NOT_OUT', battingOrder: 1, inningsType: 'FIRST' });
  const [bowlingForm, setBowlingForm] = useState({ playerId: '', teamId: '', overs: 0, maidens: 0, runsConceded: 0, wickets: 0, wides: 0, noBalls: 0, inningsType: 'FIRST' });

  useEffect(() => { loadMatch(); }, [id]);

  const loadMatch = () => getMatch(id).then(r => {
    setMatch(r.data);
    if (r.data.team1) getPlayers(r.data.team1.id).then(p => setTeam1Players(p.data));
    if (r.data.team2) getPlayers(r.data.team2.id).then(p => setTeam2Players(p.data));
  });

  const handleBatting = async (e) => {
    e.preventDefault();
    setSaving(true);
    await addBattingPerformance({ ...battingForm, matchId: parseInt(id), playerId: parseInt(battingForm.playerId), teamId: parseInt(battingForm.teamId) });
    setShowBattingModal(false);
    setSaving(false);
  };

  const handleBowling = async (e) => {
    e.preventDefault();
    setSaving(true);
    await addBowlingPerformance({ ...bowlingForm, matchId: parseInt(id), playerId: parseInt(bowlingForm.playerId), teamId: parseInt(bowlingForm.teamId), overs: parseFloat(bowlingForm.overs) });
    setShowBowlingModal(false);
    setSaving(false);
  };

  if (!match) return <div className="loading"><div className="spinner"></div>Loading...</div>;

  const team1 = match.team1;
  const team2 = match.team2;

  return (
    <div>
      <div className="page-header">
        <span className="page-header-title">Match Detail</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setShowBattingModal(true)}>+ Batting</button>
          <button className="btn btn-secondary" onClick={() => setShowBowlingModal(true)}>+ Bowling</button>
          <Link to={`/matches/${id}/scorecard`} className="btn btn-primary">📋 Scorecard</Link>
        </div>
      </div>
      <div className="page-content">
        <div className="breadcrumb">
          {match.tournamentId && <Link to={`/tournaments/${match.tournamentId}/matches`}>Matches</Link>}
          <span className="breadcrumb-sep">/</span>
          <span>{match.matchNumber}</span>
        </div>

        {/* Match header */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
              <span className={`badge badge-${match.status?.toLowerCase()}`}>{match.status}</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{match.matchNumber} · {match.venue}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: team1?.logoColor || '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#000', margin: '0 auto 8px' }}>
                  {team1?.shortName || '?'}
                </div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{team1?.name}</div>
                {match.team1Score > 0 && (
                  <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'Oswald, sans-serif', color: 'var(--accent)', marginTop: 4 }}>
                    {match.team1Score}/{match.team1Wickets}
                  </div>
                )}
                {match.team1Overs > 0 && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>({match.team1Overs} overs)</div>}
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-muted)', fontFamily: 'Oswald, sans-serif' }}>VS</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{match.overs} overs</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: team2?.logoColor || '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#000', margin: '0 auto 8px' }}>
                  {team2?.shortName || '?'}
                </div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{team2?.name}</div>
                {match.team2Score > 0 && (
                  <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'Oswald, sans-serif', color: 'var(--accent)', marginTop: 4 }}>
                    {match.team2Score}/{match.team2Wickets}
                  </div>
                )}
                {match.team2Overs > 0 && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>({match.team2Overs} overs)</div>}
              </div>
            </div>
            {match.result && <div className="match-result" style={{ marginTop: 16, fontSize: 14, fontStyle: 'normal', fontWeight: 600 }}>🏆 {match.result}</div>}
            {match.tossWinner && <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>🪙 {match.tossWinner} won toss & elected to {match.tossDecision?.toLowerCase()}</div>}
            {match.playerOfMatch && <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--accent)', marginTop: 8 }}>⭐ Player of the Match: {match.playerOfMatch}</div>}
          </div>
        </div>

        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
          Use the <strong>+ Batting</strong> and <strong>+ Bowling</strong> buttons above to enter player performances, then view the full <strong>📋 Scorecard</strong>.
        </div>
      </div>

      {/* Batting Performance Modal */}
      {showBattingModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Add Batting Performance</h3>
              <button className="modal-close" onClick={() => setShowBattingModal(false)}>✕</button>
            </div>
            <form onSubmit={handleBatting}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Innings</label>
                    <select className="form-control" value={battingForm.inningsType} onChange={e => setBattingForm({ ...battingForm, inningsType: e.target.value })}>
                      <option value="FIRST">1st Innings ({team1?.name})</option>
                      <option value="SECOND">2nd Innings ({team2?.name})</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Team</label>
                    <select className="form-control" value={battingForm.teamId} onChange={e => setBattingForm({ ...battingForm, teamId: e.target.value })} required>
                      <option value="">Select</option>
                      <option value={team1?.id}>{team1?.name}</option>
                      <option value={team2?.id}>{team2?.name}</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Player *</label>
                  <select className="form-control" value={battingForm.playerId} onChange={e => setBattingForm({ ...battingForm, playerId: e.target.value })} required>
                    <option value="">Select player</option>
                    {(battingForm.teamId === String(team1?.id) ? team1Players : team2Players).map(p => (
                      <option key={p.id} value={p.id}>{p.name} (#{p.jerseyNumber})</option>
                    ))}
                  </select>
                </div>
                <div className="score-input-grid">
                  <div className="form-group">
                    <label className="form-label">Runs</label>
                    <input type="number" className="form-control" value={battingForm.runs} onChange={e => setBattingForm({ ...battingForm, runs: e.target.value })} min={0} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Balls</label>
                    <input type="number" className="form-control" value={battingForm.balls} onChange={e => setBattingForm({ ...battingForm, balls: e.target.value })} min={0} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Order</label>
                    <input type="number" className="form-control" value={battingForm.battingOrder} onChange={e => setBattingForm({ ...battingForm, battingOrder: e.target.value })} min={1} max={11} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">4s</label>
                    <input type="number" className="form-control" value={battingForm.fours} onChange={e => setBattingForm({ ...battingForm, fours: e.target.value })} min={0} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">6s</label>
                    <input type="number" className="form-control" value={battingForm.sixes} onChange={e => setBattingForm({ ...battingForm, sixes: e.target.value })} min={0} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Dismissal</label>
                  <select className="form-control" value={battingForm.dismissalType} onChange={e => setBattingForm({ ...battingForm, dismissalType: e.target.value, isOut: e.target.value !== 'NOT_OUT' })}>
                    {DISMISSALS.map(d => <option key={d} value={d}>{d.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowBattingModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bowling Performance Modal */}
      {showBowlingModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Add Bowling Performance</h3>
              <button className="modal-close" onClick={() => setShowBowlingModal(false)}>✕</button>
            </div>
            <form onSubmit={handleBowling}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Innings (Bowling)</label>
                    <select className="form-control" value={bowlingForm.inningsType} onChange={e => setBowlingForm({ ...bowlingForm, inningsType: e.target.value })}>
                      <option value="FIRST">1st Innings (bowling at {team1?.name})</option>
                      <option value="SECOND">2nd Innings (bowling at {team2?.name})</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bowling Team</label>
                    <select className="form-control" value={bowlingForm.teamId} onChange={e => setBowlingForm({ ...bowlingForm, teamId: e.target.value })} required>
                      <option value="">Select</option>
                      <option value={team1?.id}>{team1?.name}</option>
                      <option value={team2?.id}>{team2?.name}</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Bowler *</label>
                  <select className="form-control" value={bowlingForm.playerId} onChange={e => setBowlingForm({ ...bowlingForm, playerId: e.target.value })} required>
                    <option value="">Select bowler</option>
                    {(bowlingForm.teamId === String(team1?.id) ? team1Players : team2Players).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="score-input-grid">
                  <div className="form-group">
                    <label className="form-label">Overs</label>
                    <input type="number" step="0.1" className="form-control" value={bowlingForm.overs} onChange={e => setBowlingForm({ ...bowlingForm, overs: e.target.value })} min={0} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Runs</label>
                    <input type="number" className="form-control" value={bowlingForm.runsConceded} onChange={e => setBowlingForm({ ...bowlingForm, runsConceded: e.target.value })} min={0} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Wickets</label>
                    <input type="number" className="form-control" value={bowlingForm.wickets} onChange={e => setBowlingForm({ ...bowlingForm, wickets: e.target.value })} min={0} max={10} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Maidens</label>
                    <input type="number" className="form-control" value={bowlingForm.maidens} onChange={e => setBowlingForm({ ...bowlingForm, maidens: e.target.value })} min={0} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Wides</label>
                    <input type="number" className="form-control" value={bowlingForm.wides} onChange={e => setBowlingForm({ ...bowlingForm, wides: e.target.value })} min={0} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">No Balls</label>
                    <input type="number" className="form-control" value={bowlingForm.noBalls} onChange={e => setBowlingForm({ ...bowlingForm, noBalls: e.target.value })} min={0} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowBowlingModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
