import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getMatch, updateScore, getScorecard, addBattingPerformance, addBowlingPerformance,
  getPlayers, recordBall, getBalls, getMatches, getTournaments
} from '../services/api';

const DISMISSAL_TYPES = ['Bowled', 'Caught', 'LBW', 'Run Out', 'Stumped', 'Hit Wicket', 'Retired Hurt'];

export default function LiveScoring() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Match selection state (when no id in URL)
  const [tournaments, setTournaments] = useState([]);
  const [allMatches, setAllMatches] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState('');

  const [match, setMatch] = useState(null);
  const [scorecard, setScorecard] = useState(null);
  const [team1Players, setTeam1Players] = useState([]);
  const [team2Players, setTeam2Players] = useState([]);
  const [balls, setBalls] = useState([]);
  const [loading, setLoading] = useState(!!id);
  const [activeInnings, setActiveInnings] = useState('FIRST');
  const [saving, setSaving] = useState(false);
  const [showBatModal, setShowBatModal] = useState(false);
  const [showBowlModal, setShowBowlModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [msg, setMsg] = useState('');

  // Current ball state
  const [strikeBatsman, setStrikeBatsman] = useState('');
  const [nonStrikeBatsman, setNonStrikeBatsman] = useState('');
  const [currentBowler, setCurrentBowler] = useState('');
  const [currentOver, setCurrentOver] = useState(1);
  const [ballInOver, setBallInOver] = useState(1);

  const [batForm, setBatForm] = useState({
    playerId: '', runs: 0, balls: 0, fours: 0, sixes: 0,
    isOut: false, dismissalType: 'Bowled', battingOrder: 1, inningsType: 'FIRST'
  });
  const [bowlForm, setBowlForm] = useState({
    playerId: '', overs: 0, maidens: 0, runsConceded: 0, wickets: 0,
    wides: 0, noBalls: 0, inningsType: 'FIRST'
  });
  const [scoreForm, setScoreForm] = useState({
    team1Score: '', team1Wickets: '', team1Overs: '',
    team2Score: '', team2Wickets: '', team2Overs: '',
    status: 'LIVE', tossWinnerId: '', tossDecision: 'BAT',
    winnerId: '', result: '', playerOfMatchId: ''
  });

  const loadMatchData = useCallback((matchId) => {
    Promise.all([getMatch(matchId), getScorecard(matchId), getBalls(matchId)]).then(([mr, sr, br]) => {
      setMatch(mr.data);
      setScorecard(sr.data);
      setBalls(br.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Load match data when id is available
  useEffect(() => {
    if (!id) return;
    loadMatchData(id);
    getMatch(id).then(mr => {
      getPlayers(mr.data.team1Id).then(r => setTeam1Players(r.data));
      getPlayers(mr.data.team2Id).then(r => setTeam2Players(r.data));
    });
  }, [id, loadMatchData]);

  // Load tournaments for fixture selector when no match selected
  useEffect(() => {
    if (id) return;
    getTournaments().then(r => {
      setTournaments(r.data || []);
      if (r.data?.length > 0) setSelectedTournament(String(r.data[0].id));
    });
  }, [id]);

  useEffect(() => {
    if (!selectedTournament || id) return;
    getMatches(selectedTournament).then(r => setAllMatches(r.data || []));
  }, [selectedTournament, id]);

  const showMsg = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleSelectMatch = (matchId) => {
    navigate(`/admin/matches/${matchId}/score`);
  };

  // Compute current over/ball numbers from loaded balls
  useEffect(() => {
    if (!balls.length) return;
    const inningsBalls = balls.filter(b => b.inningsType === activeInnings && !b.wide && !b.noBall);
    const legal = inningsBalls.length;
    const over = Math.floor(legal / 6) + 1;
    const ball = (legal % 6) + 1;
    setCurrentOver(over);
    setBallInOver(ball);
  }, [balls, activeInnings]);

  const doRecordBall = async (opts) => {
    if (!match || !strikeBatsman || !currentBowler) {
      showMsg('Select batsman and bowler first');
      return;
    }
    setSaving(true);
    try {
      await recordBall({
        matchId: +id,
        inningsType: activeInnings,
        overNumber: currentOver,
        ballNumber: ballInOver,
        batsmanId: +strikeBatsman,
        bowlerId: +currentBowler,
        runs: opts.runs || 0,
        dot: opts.dot || false,
        wicket: opts.wicket || false,
        wide: opts.wide || false,
        noBall: opts.noBall || false,
        four: opts.four || false,
        six: opts.six || false,
        legBye: opts.legBye || false,
      });
      const msg =
        opts.wicket ? 'Wicket!' :
        opts.wide   ? 'Wide +1' :
        opts.noBall ? 'No Ball +1' :
        opts.runs === 4 ? 'FOUR!' :
        opts.runs === 6 ? 'SIX!' :
        opts.runs === 0 ? 'Dot ball' :
        `+${opts.runs}`;

      // Strike rotation: odd legal runs = batsmen crossed
      const isLegal   = !opts.wide && !opts.noBall;
      const oddRuns   = isLegal && (opts.runs % 2 === 1);
      const endOfOver = isLegal && ballInOver >= 6;

      if (oddRuns) {
        // Batsmen crossed on the run
        setStrikeBatsman(nonStrikeBatsman);
        setNonStrikeBatsman(strikeBatsman);
      }

      if (endOfOver) {
        if (!oddRuns) {
          // Even runs on last ball — rotate so non-striker faces next over
          setStrikeBatsman(nonStrikeBatsman);
          setNonStrikeBatsman(strikeBatsman);
        }
        setCurrentBowler('');
      }

      // Show message and refresh data after state is ready
      Promise.all([loadMatchData(id), getBalls(id).then(r => setBalls(r.data || []))]).then(() => {
        showMsg(endOfOver ? 'Over complete! Select new bowler' : msg);
      });
    } catch (e) {
      showMsg('Failed to record ball');
    }
    setSaving(false);
  };

  const handleScoreUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (scoreForm.team1Score !== '') {
        await updateScore(id, {
          team: 'team1', score: +scoreForm.team1Score,
          wickets: +scoreForm.team1Wickets || 0, overs: +scoreForm.team1Overs || 0,
          status: scoreForm.status, tossWinnerId: scoreForm.tossWinnerId || undefined,
          tossDecision: scoreForm.tossDecision, result: scoreForm.result || undefined,
          winnerId: scoreForm.winnerId ? +scoreForm.winnerId : undefined,
          playerOfMatchId: scoreForm.playerOfMatchId ? +scoreForm.playerOfMatchId : undefined,
        });
      }
      if (scoreForm.team2Score !== '') {
        await updateScore(id, {
          team: 'team2', score: +scoreForm.team2Score,
          wickets: +scoreForm.team2Wickets || 0, overs: +scoreForm.team2Overs || 0,
        });
      }
      loadMatchData(id); setShowScoreModal(false); showMsg('Score updated');
    } catch { showMsg('Failed to update score'); }
    setSaving(false);
  };

  const handleBatSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await addBattingPerformance({ ...batForm, matchId: +id, runs: +batForm.runs, balls: +batForm.balls, fours: +batForm.fours, sixes: +batForm.sixes, battingOrder: +batForm.battingOrder, playerId: +batForm.playerId });
      loadMatchData(id); setShowBatModal(false); showMsg('Batting performance saved');
      setBatForm({ playerId: '', runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, dismissalType: 'Bowled', battingOrder: 1, inningsType: 'FIRST' });
    } catch { showMsg('Failed'); }
    setSaving(false);
  };

  const handleBowlSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await addBowlingPerformance({ ...bowlForm, matchId: +id, overs: +bowlForm.overs, maidens: +bowlForm.maidens, runsConceded: +bowlForm.runsConceded, wickets: +bowlForm.wickets, wides: +bowlForm.wides, noBalls: +bowlForm.noBalls, playerId: +bowlForm.playerId });
      loadMatchData(id); setShowBowlModal(false); showMsg('Bowling performance saved');
      setBowlForm({ playerId: '', overs: 0, maidens: 0, runsConceded: 0, wickets: 0, wides: 0, noBalls: 0, inningsType: 'FIRST' });
    } catch { showMsg('Failed'); }
    setSaving(false);
  };

  // --- Fixture selector screen ---
  if (!id) {
    const liveOrScheduled = allMatches.filter(m => m.status === 'LIVE' || m.status === 'SCHEDULED');
    return (
      <div style={{ padding: '16px', maxWidth: '700px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <h2 style={{ marginBottom: 20 }}>Select Match to Score</h2>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--text-2)' }}>Tournament</label>
          <select className="form-select" value={selectedTournament} onChange={e => setSelectedTournament(e.target.value)} style={{ maxWidth: '100%' }}>
            {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        {liveOrScheduled.length === 0 ? (
          <div style={{ color: 'var(--text-3)', padding: '24px 0' }}>No live or upcoming matches found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {liveOrScheduled.map(m => (
              <div key={m.id} className="card" style={{ padding: '16px 20px', cursor: 'pointer', border: m.status === 'LIVE' ? '1px solid var(--accent)' : undefined }}
                onClick={() => handleSelectMatch(m.id)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{m.team1Name} vs {m.team2Name}</span>
                    <span style={{ marginLeft: 12, fontSize: 12, color: 'var(--text-3)' }}>Match #{m.matchNumber}</span>
                    {m.status === 'LIVE' && <span className="badge badge-live" style={{ marginLeft: 8 }}>LIVE</span>}
                  </div>
                  <button className="btn btn-primary btn-sm">Score This</button>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{m.venue} · {m.overs} overs</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (loading) return <div className="loading"><div className="spinner" /><span>Loading match data...</span></div>;
  if (!match) return <div className="loading"><p>Match not found</p></div>;

  const isLive = match.status === 'LIVE';
  const allPlayers = [...team1Players, ...team2Players];
  const battingTeamPlayers = activeInnings === 'FIRST' ? team1Players : team2Players;
  const bowlingTeamPlayers = activeInnings === 'FIRST' ? team2Players : team1Players;
  const innings1 = scorecard?.firstInnings;
  const innings2 = scorecard?.secondInnings;
  const activeScore = activeInnings === 'FIRST' ? (match.team1Score ?? 0) : (match.team2Score ?? 0);
  const activeWickets = activeInnings === 'FIRST' ? match.team1Wickets : match.team2Wickets;
  const activeOvers = activeInnings === 'FIRST' ? match.team1Overs : match.team2Overs;
  const activeBalls = balls.filter(b => b.inningsType === activeInnings);
  const currentOverBalls = activeBalls.filter(b => b.overNumber === currentOver);
  const maxOvers = match.overs || 3;
  const crr = activeOvers > 0 ? (activeScore / activeOvers).toFixed(2) : '0.00';

  return (
    <div className="live-console">
      {/* Header */}
      <div className="live-score-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="live-badge-row">
            {isLive && <span className="badge badge-live">LIVE</span>}
            {match.status === 'COMPLETED' && <span className="badge badge-completed">FINAL</span>}
            <span className="live-match-name">{match.team1Name} vs {match.team2Name}</span>
            <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 8 }}>{maxOvers} overs/team</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
            <span className="live-score-main">{activeScore}/{activeWickets ?? 0}</span>
            <span className="live-score-overs">({activeOvers ?? 0} ov)</span>
          </div>
        </div>
        <div className="live-stat-box"><div className="live-stat-label">CRR</div><div className="live-stat-value">{crr}</div></div>
        <div className="live-stat-box"><div className="live-stat-label">Over</div><div className="live-stat-value">{currentOver}/{maxOvers}</div></div>
        {match.team1Score != null && activeInnings === 'SECOND' && (
          <div className="live-stat-box">
            <div className="live-stat-label">Target</div>
            <div className="live-stat-value">{match.team1Score + 1}</div>
          </div>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexShrink: 0 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/matches/' + id + '/score')}>
            † Back
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => {
            setScoreForm({
              team1Score: match.team1Score ?? '', team1Wickets: match.team1Wickets ?? '',
              team1Overs: match.team1Overs ?? '', team2Score: match.team2Score ?? '',
              team2Wickets: match.team2Wickets ?? '', team2Overs: match.team2Overs ?? '',
              status: match.status || 'LIVE', tossWinnerId: '', tossDecision: match.tossDecision || 'BAT',
              winnerId: '', result: match.result || '', playerOfMatchId: ''
            });
            setShowScoreModal(true);
          }}>Settings</button>
        </div>
      </div>

      {msg && (
        <div style={{ padding: '8px 20px', background: msg.includes('Failed') ? 'var(--red-muted)' : 'var(--accent-muted)', color: msg.includes('Failed') ? 'var(--red)' : 'var(--accent)', fontSize: 13, fontWeight: 600, borderBottom: '1px solid var(--card-border)' }}>
          {msg}
        </div>
      )}

      <div className="live-console-body">
        {/* LEFT: Player selectors + Ball pad */}
        <div className="lc-left">
          {/* Innings Selector */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button className={`btn btn-sm ${activeInnings === 'FIRST' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveInnings('FIRST')}>{match.team1Name} (1st)</button>
            <button className={`btn btn-sm ${activeInnings === 'SECOND' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveInnings('SECOND')}>{match.team2Name} (2nd)</button>
          </div>

          {/* Player Selection */}
          <div className="lc-panel">
            <div className="lc-panel-header"><span className="lc-panel-label">Select Players</span></div>
            <div className="modal-body" style={{ padding: '12px 14px' }}>
              <div className="form-group" style={{ marginBottom: 10 }}>
                <label className="form-label">Striker (Batsman)</label>
                <select className="form-select" value={strikeBatsman} onChange={e => setStrikeBatsman(e.target.value)}>
                  <option value="">-- Select batsman --</option>
                  {battingTeamPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 10 }}>
                <label className="form-label">Non-Striker</label>
                <select className="form-select" value={nonStrikeBatsman} onChange={e => setNonStrikeBatsman(e.target.value)}>
                  <option value="">-- Select batsman --</option>
                  {battingTeamPlayers.filter(p => String(p.id) !== strikeBatsman).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Bowler</label>
                <select className="form-select" value={currentBowler} onChange={e => setCurrentBowler(e.target.value)}>
                  <option value="">-- Select bowler --</option>
                  {bowlingTeamPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              {strikeBatsman && currentBowler && (
                <div style={{ marginTop: 10, fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
                  Over {currentOver}.{ballInOver - 1} — Ready to score
                </div>
              )}
            </div>
          </div>

          {/* Ball Pad */}
          {isLive && (
            <div className="lc-panel">
              <div className="lc-panel-header"><span className="lc-panel-label">Record Ball — Over {currentOver}, Ball {ballInOver}</span></div>
              <div className="add-event-pad">
                <div className="event-grid">
                  {[0, 1, 2, 3].map(r => (
                    <button key={r} className="event-btn" disabled={saving} onClick={() => doRecordBall({ runs: r, dot: r === 0 })}>
                      <span className="event-btn-num">{r}</span>
                      <span className="event-btn-label">{r === 0 ? 'Dot' : r === 1 ? 'Run' : 'Runs'}</span>
                    </button>
                  ))}
                  <button className="event-btn boundary" disabled={saving} onClick={() => doRecordBall({ runs: 4, four: true })}>
                    <span className="event-btn-num">4</span>
                    <span className="event-btn-label">Four</span>
                  </button>
                  <button className="event-btn maximum" disabled={saving} onClick={() => doRecordBall({ runs: 6, six: true })}>
                    <span className="event-btn-num">6</span>
                    <span className="event-btn-label">Six</span>
                  </button>
                </div>
                <div className="event-extras">
                  <button className="event-extra-btn" disabled={saving} onClick={() => doRecordBall({ runs: 0, wide: true })}>
                    <span className="extra-code">WD</span> Wide
                  </button>
                  <button className="event-extra-btn" disabled={saving} onClick={() => doRecordBall({ runs: 0, noBall: true })}>
                    <span className="extra-code">NB</span> No Ball
                  </button>
                  <button className="event-extra-btn" disabled={saving} onClick={() => doRecordBall({ runs: 1, legBye: true })}>
                    <span className="extra-code">LB</span> Leg Bye
                  </button>
                  <button className="event-btn wicket-btn" style={{ padding: '8px 6px' }} disabled={saving}
                    onClick={() => doRecordBall({ runs: 0, wicket: true })}>
                    <span className="event-btn-num">W</span>
                    <span className="event-btn-label">Wicket</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MIDDLE: Current Over + Scorecard */}
        <div className="lc-middle">
          {/* This Over */}
          <div className="lc-panel">
            <div className="lc-panel-header">
              <span className="lc-panel-label">This Over ({currentOver}/{maxOvers})</span>
            </div>
            <div style={{ padding: '10px 14px' }}>
              <div className="over-balls" style={{ flexWrap: 'wrap' }}>
                {currentOverBalls.map((b, i) => (
                  <div key={b.id} className={`over-ball ${b.four ? 'four' : b.six ? 'six' : b.wicket ? 'wicket' : b.dot ? 'dot' : b.wide ? 'extra' : b.noBall ? 'extra' : ''}`}>
                    {b.wide ? 'Wd' : b.noBall ? 'Nb' : b.wicket ? 'W' : b.four ? '4' : b.six ? '6' : b.runs === 0 ? '·' : b.runs}
                  </div>
                ))}
                {!currentOverBalls.length && <span style={{ color: 'var(--text-3)', fontSize: 13 }}>No balls bowled yet this over</span>}
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-3)' }}>
                Balls: {currentOverBalls.filter(b => !b.wide && !b.noBall).length}/6
              </div>
            </div>
          </div>

          {/* Overs Summary */}
          <div className="lc-panel">
            <div className="lc-panel-header"><span className="lc-panel-label">Overs Summary</span></div>
            <div style={{ padding: '8px 14px' }}>
              {Array.from({ length: maxOvers }, (_, i) => i + 1).map(ov => {
                // eslint-disable-next-line no-unused-vars
                const ovBalls = activeBalls.filter(b => b.overNumber === ov && !b.wide && !b.noBall);
                const runs = activeBalls.filter(b => b.overNumber === ov).reduce((s, b) => s + b.runs + (b.wide || b.noBall ? 1 : 0), 0);
                const wkts = activeBalls.filter(b => b.overNumber === ov && b.wicket).length;
                return (
                  <div key={ov} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '1px solid var(--card-border)', fontSize: 13 }}>
                    <span style={{ minWidth: 52, color: 'var(--text-2)', fontWeight: 600 }}>Over {ov}</span>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {Array.from({ length: 6 }, (_, j) => {
                        const b = activeBalls.filter(x => x.overNumber === ov && !x.wide && !x.noBall)[j];
                        if (!b) return <div key={j} className="over-ball" style={{ width: 20, height: 20, fontSize: 10, opacity: 0.3 }}>-</div>;
                        return (
                          <div key={j} className={`over-ball ${b.four ? 'four' : b.six ? 'six' : b.wicket ? 'wicket' : b.dot ? 'dot' : ''}`} style={{ width: 20, height: 20, fontSize: 10 }}>
                            {b.wicket ? 'W' : b.four ? '4' : b.six ? '6' : b.runs === 0 ? '·' : b.runs}
                          </div>
                        );
                      })}
                    </div>
                    <span style={{ marginLeft: 'auto', color: 'var(--text-2)' }}>{runs} runs{wkts > 0 ? `, ${wkts}W` : ''}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Performance Records */}
          <div className="lc-panel">
            <div className="lc-panel-header">
              <span className="lc-panel-label">Performance Records</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => { setBatForm(f => ({ ...f, inningsType: activeInnings })); setShowBatModal(true); }}>+ Bat</button>
                <button className="btn btn-ghost btn-sm" onClick={() => { setBowlForm(f => ({ ...f, inningsType: activeInnings })); setShowBowlModal(true); }}>+ Bowl</button>
              </div>
            </div>
            <div style={{ padding: '8px 14px', fontSize: 12, color: 'var(--text-3)' }}>
              Add batting/bowling performance summaries after each innings.
            </div>
          </div>
        </div>

        {/* RIGHT: Scorecard */}
        <div className="lc-right">
          <div className="sc-header">
            <span className="sc-label">Scorecard</span>
            <Link to={`/matches/${id}/scorecard`} target="_blank" className="live-feedback-btn">Full View</Link>
          </div>

          {[
            { label: '1st Innings', innings: innings1, team: match.team1Name, score: match.team1Score, wkts: match.team1Wickets, overs: match.team1Overs },
            { label: '2nd Innings', innings: innings2, team: match.team2Name, score: match.team2Score, wkts: match.team2Wickets, overs: match.team2Overs },
          ].map(({ label, innings, team, score, wkts, overs }) => (
            <div key={label} className="lc-panel">
              <div className="lc-panel-header">
                <span className="lc-panel-label">{team}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', fontFamily: 'Rajdhani' }}>
                  {score ?? '-'}/{wkts ?? 0} ({overs ?? 0})
                </span>
              </div>
              {innings?.batting?.length > 0 && (
                <div className="sc-table-wrap">
                  <table className="sc-table">
                    <thead><tr><th>Batter</th><th className="right">R</th><th className="right">B</th><th className="right">4s</th><th className="right">6s</th></tr></thead>
                    <tbody>
                      {innings.batting.map(b => (
                        <tr key={b.id} className={!b.isOut ? 'on-strike' : ''}>
                          <td>{b.playerName}{!b.isOut && '*'}</td>
                          <td className="right" style={{ fontWeight: 700 }}>{b.runs}</td>
                          <td className="right" style={{ color: 'var(--text-3)' }}>{b.balls}</td>
                          <td className="right" style={{ color: 'var(--green)' }}>{b.fours}</td>
                          <td className="right" style={{ color: 'var(--accent)' }}>{b.sixes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {innings?.bowling?.length > 0 && (
                <div className="sc-table-wrap" style={{ borderTop: '1px solid var(--card-border)' }}>
                  <table className="sc-table">
                    <thead><tr><th>Bowler</th><th className="right">O</th><th className="right">R</th><th className="right">W</th></tr></thead>
                    <tbody>
                      {innings.bowling.map(b => (
                        <tr key={b.id}>
                          <td>{b.playerName}</td>
                          <td className="right" style={{ color: 'var(--text-3)' }}>{b.overs}</td>
                          <td className="right">{b.runsConceded}</td>
                          <td className="right" style={{ color: b.wickets >= 3 ? 'var(--green)' : 'inherit', fontWeight: b.wickets >= 3 ? 700 : 400 }}>{b.wickets}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {!innings?.batting?.length && !innings?.bowling?.length && (
                <div style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-3)' }}>No records yet</div>
              )}
            </div>
          ))}

          {/* Ball-by-ball timeline */}
          <div className="innings-timeline">
            <div className="timeline-label">Ball-by-Ball ({activeInnings === 'FIRST' ? match.team1Name : match.team2Name})</div>
            {[...activeBalls].reverse().slice(0, 20).map(b => (
              <div key={b.id} className="timeline-item">
                <div className={`timeline-dot ${b.four || b.six ? 'notable' : b.wicket ? 'wicket-dot' : ''}`} />
                <div style={{ flex: 1 }}>
                  <div className="timeline-over">Over {b.overNumber}.{b.ballNumber} · {b.batsmanName || '?'} vs {b.bowlerName || '?'}</div>
                  <div className="timeline-desc">
                    {b.wicket ? 'WICKET!' : b.six ? 'SIX!' : b.four ? 'FOUR!' : b.wide ? 'Wide' : b.noBall ? 'No Ball' : b.legBye ? `Leg Bye ${b.runs}` : b.runs === 0 ? 'Dot ball' : `${b.runs} run${b.runs !== 1 ? 's' : ''}`}
                  </div>
                </div>
                <div className={`timeline-runs ${b.wicket ? 'wicket' : ''}`}>
                  {b.wicket ? 'W' : b.wide ? 'Wd' : b.noBall ? 'Nb' : b.six ? '6' : b.four ? '4' : b.runs === 0 ? '·' : b.runs}
                </div>
              </div>
            ))}
            {!activeBalls.length && <div style={{ padding: '14px', fontSize: 13, color: 'var(--text-3)' }}>No balls recorded yet</div>}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="live-console-footer">
        <span style={{ fontSize: 13, color: 'var(--text-3)' }}>
          Match #{match.matchNumber} · {match.overs} overs/team · {match.venue}
        </span>
        <button className="footer-action-btn" onClick={() => setShowScoreModal(true)}>Match Settings</button>
        <Link to={`/matches/${id}/scorecard`} className="footer-action-btn" style={{ textDecoration: 'none' }} target="_blank">Full Scorecard</Link>
      </div>

      {/* Score Modal */}
      {showScoreModal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowScoreModal(false)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <div className="modal-title">Match Settings</div>
              <button className="close-btn" onClick={() => setShowScoreModal(false)}>×</button>
            </div>
            <form onSubmit={handleScoreUpdate}>
              <div className="modal-body">
                <div className="form-row" style={{ marginBottom: 20 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Match Status</label>
                    <select className="form-select" value={scoreForm.status} onChange={e => setScoreForm(f => ({ ...f, status: e.target.value }))}>
                      <option value="SCHEDULED">Scheduled</option>
                      <option value="LIVE">Live</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Toss Decision</label>
                    <select className="form-select" value={scoreForm.tossDecision} onChange={e => setScoreForm(f => ({ ...f, tossDecision: e.target.value }))}>
                      <option value="BAT">Elected to Bat</option>
                      <option value="BOWL">Elected to Bowl</option>
                    </select>
                  </div>
                </div>
                <div className="divider-label">1st Innings — {match.team1Name}</div>
                <div className="form-row-3">
                  <div className="form-group"><label className="form-label">Score</label><input className="form-input" type="number" min="0" value={scoreForm.team1Score} onChange={e => setScoreForm(f => ({ ...f, team1Score: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">Wickets</label><input className="form-input" type="number" min="0" max="10" value={scoreForm.team1Wickets} onChange={e => setScoreForm(f => ({ ...f, team1Wickets: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">Overs</label><input className="form-input" type="number" step="0.1" min="0" value={scoreForm.team1Overs} onChange={e => setScoreForm(f => ({ ...f, team1Overs: e.target.value }))} /></div>
                </div>
                <div className="divider-label">2nd Innings — {match.team2Name}</div>
                <div className="form-row-3">
                  <div className="form-group"><label className="form-label">Score</label><input className="form-input" type="number" min="0" value={scoreForm.team2Score} onChange={e => setScoreForm(f => ({ ...f, team2Score: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">Wickets</label><input className="form-input" type="number" min="0" max="10" value={scoreForm.team2Wickets} onChange={e => setScoreForm(f => ({ ...f, team2Wickets: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">Overs</label><input className="form-input" type="number" step="0.1" min="0" value={scoreForm.team2Overs} onChange={e => setScoreForm(f => ({ ...f, team2Overs: e.target.value }))} /></div>
                </div>
                {scoreForm.status === 'COMPLETED' && (
                  <>
                    <div className="divider-label">Result</div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Winner</label>
                        <select className="form-select" value={scoreForm.winnerId} onChange={e => setScoreForm(f => ({ ...f, winnerId: e.target.value }))}>
                          <option value="">— No result / Tie —</option>
                          <option value={match.team1Id}>{match.team1Name}</option>
                          <option value={match.team2Id}>{match.team2Name}</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Player of the Match</label>
                        <select className="form-select" value={scoreForm.playerOfMatchId} onChange={e => setScoreForm(f => ({ ...f, playerOfMatchId: e.target.value }))}>
                          <option value="">— Select player —</option>
                          {allPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Result Description</label>
                      <input className="form-input" placeholder="e.g. Team A won by 15 runs" value={scoreForm.result} onChange={e => setScoreForm(f => ({ ...f, result: e.target.value }))} />
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowScoreModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Update'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batting Modal */}
      {showBatModal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowBatModal(false)}>
          <div className="modal modal-md">
            <div className="modal-header"><div className="modal-title">Batting Performance</div><button className="close-btn" onClick={() => setShowBatModal(false)}>×</button></div>
            <form onSubmit={handleBatSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Batter</label>
                    <select className="form-select" required value={batForm.playerId} onChange={e => setBatForm(f => ({ ...f, playerId: e.target.value }))}>
                      <option value="">— Select —</option>
                      {allPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Innings</label>
                    <select className="form-select" value={batForm.inningsType} onChange={e => setBatForm(f => ({ ...f, inningsType: e.target.value }))}>
                      <option value="FIRST">1st</option><option value="SECOND">2nd</option>
                    </select>
                  </div>
                </div>
                <div className="form-row-3">
                  <div className="form-group"><label className="form-label">Runs</label><input className="form-input" type="number" min="0" value={batForm.runs} onChange={e => setBatForm(f => ({ ...f, runs: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">Balls</label><input className="form-input" type="number" min="0" value={batForm.balls} onChange={e => setBatForm(f => ({ ...f, balls: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">Order</label><input className="form-input" type="number" min="1" max="11" value={batForm.battingOrder} onChange={e => setBatForm(f => ({ ...f, battingOrder: e.target.value }))} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">4s</label><input className="form-input" type="number" min="0" value={batForm.fours} onChange={e => setBatForm(f => ({ ...f, fours: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">6s</label><input className="form-input" type="number" min="0" value={batForm.sixes} onChange={e => setBatForm(f => ({ ...f, sixes: e.target.value }))} /></div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                  <input type="checkbox" id="isOut" checked={batForm.isOut} onChange={e => setBatForm(f => ({ ...f, isOut: e.target.checked }))} style={{ width: 16, height: 16 }} />
                  <label htmlFor="isOut" style={{ fontSize: 13 }}>Got out</label>
                </div>
                {batForm.isOut && (
                  <div className="form-group" style={{ marginTop: 10 }}>
                    <label className="form-label">Dismissal</label>
                    <select className="form-select" value={batForm.dismissalType} onChange={e => setBatForm(f => ({ ...f, dismissalType: e.target.value }))}>
                      {DISMISSAL_TYPES.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowBatModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bowling Modal */}
      {showBowlModal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowBowlModal(false)}>
          <div className="modal modal-md">
            <div className="modal-header"><div className="modal-title">Bowling Performance</div><button className="close-btn" onClick={() => setShowBowlModal(false)}>×</button></div>
            <form onSubmit={handleBowlSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Bowler</label>
                    <select className="form-select" required value={bowlForm.playerId} onChange={e => setBowlForm(f => ({ ...f, playerId: e.target.value }))}>
                      <option value="">— Select —</option>
                      {allPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Innings</label>
                    <select className="form-select" value={bowlForm.inningsType} onChange={e => setBowlForm(f => ({ ...f, inningsType: e.target.value }))}>
                      <option value="FIRST">1st</option><option value="SECOND">2nd</option>
                    </select>
                  </div>
                </div>
                <div className="form-row-3">
                  <div className="form-group"><label className="form-label">Overs</label><input className="form-input" type="number" step="0.1" min="0" value={bowlForm.overs} onChange={e => setBowlForm(f => ({ ...f, overs: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">Maidens</label><input className="form-input" type="number" min="0" value={bowlForm.maidens} onChange={e => setBowlForm(f => ({ ...f, maidens: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">Runs</label><input className="form-input" type="number" min="0" value={bowlForm.runsConceded} onChange={e => setBowlForm(f => ({ ...f, runsConceded: e.target.value }))} /></div>
                </div>
                <div className="form-row-3">
                  <div className="form-group"><label className="form-label">Wickets</label><input className="form-input" type="number" min="0" max="10" value={bowlForm.wickets} onChange={e => setBowlForm(f => ({ ...f, wickets: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">Wides</label><input className="form-input" type="number" min="0" value={bowlForm.wides} onChange={e => setBowlForm(f => ({ ...f, wides: e.target.value }))} /></div>
                  <div className="form-group"><label className="form-label">No Balls</label><input className="form-input" type="number" min="0" value={bowlForm.noBalls} onChange={e => setBowlForm(f => ({ ...f, noBalls: e.target.value }))} /></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowBowlModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

