import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getMatch, updateScore, getScorecard, addBattingPerformance, addBowlingPerformance,
  getPlayers, recordBall, getBalls, getMatches, getTournaments, undoLastBall
} from '../services/api';

const DISMISSAL_TYPES = ['Bowled', 'Caught', 'LBW', 'Run Out', 'Stumped', 'Hit Wicket', 'Retired Hurt'];

function BallChip({ b, size }) {
  const sz = size || 28;
  const label =
    b.wide ? 'Wd' :
    b.noBall ? 'Nb' :
    b.wicket ? 'W' :
    b.six ? '6' :
    b.four ? '4' :
    b.legBye ? `${b.runs}lb` :
    b.bye ? `${b.runs}b` :
    b.runs === 0 ? '·' : b.runs;

  let bg = '#e2e8f0', color = '#334155';
  if (b.wicket)                { bg = '#ef4444'; color = '#fff'; }
  else if (b.six)              { bg = '#f97316'; color = '#fff'; }
  else if (b.four)             { bg = '#22c55e'; color = '#fff'; }
  else if (b.wide || b.noBall) { bg = '#facc15'; color = '#78350f'; }
  else if (b.legBye || b.bye)  { bg = '#a78bfa'; color = '#fff'; }
  else if (b.runs === 0)       { bg = '#94a3b8'; color = '#fff'; }

  return (
    <div style={{
      width: sz, height: sz, borderRadius: '50%', background: bg, color,
      fontSize: String(label).length > 2 ? 9 : 11, fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      {label}
    </div>
  );
}

function PBtn({ label, sub, onClick, disabled, danger, accent }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        height: 52,
        minWidth: 0,
        background: danger ? 'rgba(239,68,68,0.85)' : accent ? '#7c3aed' : 'rgba(0,0,0,0.18)',
        border: '1px solid rgba(255,255,255,0.18)',
        borderRadius: 8,
        color: '#fff',
        fontSize: String(label).length > 4 ? 12 : String(label).length > 2 ? 14 : 20,
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 1, padding: '4px 2px', fontFamily: 'inherit',
      }}
    >
      <span>{label}</span>
      {sub && <span style={{ fontSize: 9, opacity: 0.75, fontWeight: 400 }}>{sub}</span>}
    </button>
  );
}

const PAD_ROW = { display: 'flex', gap: 4, padding: '4px 8px' };
const PAD_BG = { background: '#ea580c', borderTop: '3px solid #c2410c', paddingBottom: 6 };
const BACK_BTN = { background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: 0, lineHeight: 1 };
const PAD_TITLE = { color: '#fff', fontWeight: 700, fontSize: 14 };
const PAD_HEADER = { padding: '6px 8px 2px', display: 'flex', alignItems: 'center', gap: 8 };

export default function LiveScoring() {
  const { id } = useParams();
  const navigate = useNavigate();

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
  const [undoing, setUndoing] = useState(false);
  const [showTossEdit, setShowTossEdit] = useState(false);
  const [showBatModal, setShowBatModal] = useState(false);
  const [showBowlModal, setShowBowlModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [msg, setMsg] = useState('');
  // mode: null | 'wide' | 'noBall' | 'noBallLegBye' | 'noBallBye' | 'legBye' | 'bye' | 'moreRuns' | 'more'
  const [mode, setMode] = useState(null);
  const [freehit, setFreehit] = useState(false);

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
      const m = mr.data;
      setMatch(m);
      setScorecard(sr.data);
      setBalls(br.data || []);
      // Sync all scoreForm fields from latest match data
      setScoreForm(f => ({
        ...f,
        team1Score: m.team1Score ?? '',
        team1Wickets: m.team1Wickets ?? '',
        team1Overs: m.team1Overs ?? '',
        team2Score: m.team2Score ?? '',
        team2Wickets: m.team2Wickets ?? '',
        team2Overs: m.team2Overs ?? '',
        status: m.status || f.status,
        tossWinnerId: m.tossWinnerId ? String(m.tossWinnerId) : '',
        tossDecision: m.tossDecision || 'BAT',
        winnerId: m.winnerId ? String(m.winnerId) : '',
        result: m.result || '',
        playerOfMatchId: m.playerOfMatchId ? String(m.playerOfMatchId) : '',
      }));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!id) return;
    loadMatchData(id);
    getMatch(id).then(mr => {
      getPlayers(mr.data.team1Id).then(r => setTeam1Players(r.data || []));
      getPlayers(mr.data.team2Id).then(r => setTeam2Players(r.data || []));
    });
  }, [id, loadMatchData]);

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

  const doUndoLastBall = async () => {
    if (!window.confirm('Undo the last recorded ball? This will reverse the score.')) return;
    setUndoing(true);
    try {
      await undoLastBall(id, activeInnings);
      await Promise.all([loadMatchData(id), getBalls(id).then(r => setBalls(r.data || []))]);
      setMode(null);
      setFreehit(false);
      showMsg('Last ball undone');
    } catch { showMsg('Nothing to undo'); }
    setUndoing(false);
  };

  // Reset pad mode when innings changes so no stale sub-screen carries over
  useEffect(() => { setMode(null); }, [activeInnings]);

  useEffect(() => {
    if (!balls.length) return;
    const legal = balls.filter(b => b.inningsType === activeInnings && !b.wide && !b.noBall).length;
    setCurrentOver(Math.floor(legal / 6) + 1);
    setBallInOver((legal % 6) + 1);
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
        bye: opts.bye || false,
      });
      const m =
        opts.wicket ? 'Wicket!' :
        opts.wide   ? `Wide +${1 + (opts.runs || 0)}` :
        opts.noBall && opts.bye    ? `NB + ${opts.runs} Bye` :
        opts.noBall && opts.legBye ? `NB + ${opts.runs} LB` :
        opts.noBall ? 'No Ball +1' :
        opts.bye    ? `${opts.runs} Bye` :
        opts.legBye ? `${opts.runs} Leg Bye` :
        opts.runs === 4 ? 'FOUR!' :
        opts.runs === 6 ? 'SIX!' :
        opts.runs === 0 ? 'Dot ball' :
        `+${opts.runs}`;

      setMode(null);
      setFreehit(!!opts.noBall);

      const isLegal = !opts.wide && !opts.noBall;
      const oddRuns = isLegal && (opts.runs % 2 === 1);
      const endOfOver = isLegal && ballInOver >= 6;

      if (oddRuns) {
        setStrikeBatsman(nonStrikeBatsman);
        setNonStrikeBatsman(strikeBatsman);
      }
      if (endOfOver) {
        if (!oddRuns) {
          setStrikeBatsman(nonStrikeBatsman);
          setNonStrikeBatsman(strikeBatsman);
        }
        setCurrentBowler('');
      }

      Promise.all([loadMatchData(id), getBalls(id).then(r => setBalls(r.data || []))]).then(() => {
        showMsg(endOfOver ? 'Over complete! Select new bowler.' : m);
      });
    } catch { showMsg('Failed to record ball'); }
    setSaving(false);
  };

  const handleScoreUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Always send metadata (status, toss, winner, result) + team1 score
      await updateScore(id, {
        team: 'team1',
        score: scoreForm.team1Score !== '' ? +scoreForm.team1Score : (match.team1Score ?? 0),
        wickets: scoreForm.team1Wickets !== '' ? +scoreForm.team1Wickets : (match.team1Wickets ?? 0),
        overs: scoreForm.team1Overs !== '' ? +scoreForm.team1Overs : (match.team1Overs ?? 0),
        status: scoreForm.status,
        tossWinnerId: scoreForm.tossWinnerId ? +scoreForm.tossWinnerId : undefined,
        tossDecision: scoreForm.tossDecision || undefined,
        result: scoreForm.result || undefined,
        winnerId: scoreForm.winnerId ? +scoreForm.winnerId : undefined,
        playerOfMatchId: scoreForm.playerOfMatchId ? +scoreForm.playerOfMatchId : undefined,
      });
      // Team2 score is separate since the API splits by team
      await updateScore(id, {
        team: 'team2',
        score: scoreForm.team2Score !== '' ? +scoreForm.team2Score : (match.team2Score ?? 0),
        wickets: scoreForm.team2Wickets !== '' ? +scoreForm.team2Wickets : (match.team2Wickets ?? 0),
        overs: scoreForm.team2Overs !== '' ? +scoreForm.team2Overs : (match.team2Overs ?? 0),
      });
      await loadMatchData(id);
      setShowScoreModal(false);
      showMsg('Settings saved');
    } catch { showMsg('Failed to update settings'); }
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

  // ---- Fixture selector ----
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
              <div key={m.id} className="card" style={{ padding: '16px 20px', cursor: 'pointer', border: m.status === 'LIVE' ? '2px solid var(--accent)' : undefined }}
                onClick={() => navigate(`/admin/matches/${m.id}/score`)}>
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

  // Determine batting order from toss. Default: team1 bats first.
  const team1BatsFirst = !match.tossWinnerId ||
    (String(match.tossWinnerId) === String(match.team1Id) && match.tossDecision === 'BAT') ||
    (String(match.tossWinnerId) === String(match.team2Id) && match.tossDecision === 'BOWL');

  // Which team bats in the currently selected innings
  const battingIsTeam1 = activeInnings === 'FIRST' ? team1BatsFirst : !team1BatsFirst;
  const battingTeamPlayers = battingIsTeam1 ? team1Players : team2Players;
  const bowlingTeamPlayers = battingIsTeam1 ? team2Players : team1Players;
  const battingTeamName   = battingIsTeam1 ? match.team1Name : match.team2Name;

  // Backend always stores team1Score for team1, team2Score for team2 — map by team identity
  const activeScore   = battingIsTeam1 ? (match.team1Score ?? 0) : (match.team2Score ?? 0);
  const activeWickets = battingIsTeam1 ? match.team1Wickets : match.team2Wickets;
  const activeOvers   = battingIsTeam1 ? match.team1Overs   : match.team2Overs;

  // First-innings batting team score = target for second innings
  const firstBattingIsTeam1 = team1BatsFirst;
  const firstInningsScore = firstBattingIsTeam1 ? match.team1Score : match.team2Score;

  // Scorecard innings: backend groups by inningsType which matches the play order,
  // but labels team/total as team1 always — override with correct batting team values.
  const rawInnings1 = scorecard?.firstInnings;
  const rawInnings2 = scorecard?.secondInnings;
  const innings1 = rawInnings1 ? {
    ...rawInnings1,
    team: firstBattingIsTeam1 ? match.team1Name : match.team2Name,
    total: firstBattingIsTeam1 ? match.team1Score : match.team2Score,
    wickets: firstBattingIsTeam1 ? match.team1Wickets : match.team2Wickets,
    overs: firstBattingIsTeam1 ? match.team1Overs : match.team2Overs,
  } : null;
  const innings2 = rawInnings2 ? {
    ...rawInnings2,
    team: firstBattingIsTeam1 ? match.team2Name : match.team1Name,
    total: firstBattingIsTeam1 ? match.team2Score : match.team1Score,
    wickets: firstBattingIsTeam1 ? match.team2Wickets : match.team1Wickets,
    overs: firstBattingIsTeam1 ? match.team2Overs : match.team1Overs,
  } : null;

  const activeBalls = balls.filter(b => b.inningsType === activeInnings);
  const currentOverBalls = activeBalls.filter(b => b.overNumber === currentOver);
  const maxOvers = match.overs || 3;
  const crr = activeOvers > 0 ? (activeScore / activeOvers).toFixed(2) : '0.00';
  const activeOversVal = activeOvers ?? 0;
  const oversComplete = Math.floor(activeOversVal) >= maxOvers;
  const allOut = (activeWickets ?? 0) >= 10;
  const inningsComplete = isLive && (oversComplete || allOut);
  const target = firstInningsScore != null ? firstInningsScore + 1 : null;
  const chaseWon = activeInnings === 'SECOND' && target != null && activeScore >= target;

  const legalBallsPlayed = Math.floor(activeOversVal) * 6 + Math.round((activeOversVal % 1) * 10);
  const needMoreBalls = Math.max(0, maxOvers * 6 - legalBallsPlayed);

  // Extras from balls
  const extraRuns = activeBalls.reduce((s, b) =>
    s + (b.wide ? 1 : 0) + (b.noBall ? 1 : 0) + (b.legBye ? b.runs : 0) + (b.bye ? b.runs : 0), 0);

  // Partnership since last wicket
  const lastWicketIdx = activeBalls.reduce((idx, b, i) => b.wicket ? i : idx, -1);
  const partnershipBalls = activeBalls.slice(lastWicketIdx + 1);
  const partnership = {
    runs: partnershipBalls.reduce((s, b) => s + b.runs + (b.wide || b.noBall ? 1 : 0), 0),
    balls: partnershipBalls.filter(b => !b.wide && !b.noBall).length,
  };

  // Live stats computed from balls
  const batsmanStats = (pid) => {
    if (!pid) return { runs: 0, balls: 0, fours: 0, sixes: 0, sr: '-' };
    const myBalls = activeBalls.filter(b => String(b.batsmanId) === String(pid) && !b.wide);
    const runs = myBalls.filter(b => !b.legBye && !b.bye).reduce((s, b) => s + b.runs, 0);
    const bf = myBalls.length;
    return {
      runs, balls: bf, fours: myBalls.filter(b => b.four).length, sixes: myBalls.filter(b => b.six).length,
      sr: bf > 0 ? ((runs / bf) * 100).toFixed(0) : '-',
    };
  };

  const bowlerStats = (bid) => {
    if (!bid) return { overs: '0.0', runs: 0, wickets: 0, eco: '-' };
    const myBalls = activeBalls.filter(b => String(b.bowlerId) === String(bid));
    const legal = myBalls.filter(b => !b.wide && !b.noBall).length;
    const runs = myBalls.reduce((s, b) => {
      const pen = (b.wide || b.noBall) ? 1 : 0;
      const bat = (!b.legBye && !b.bye) ? b.runs : 0;
      return s + bat + pen;
    }, 0);
    const wickets = myBalls.filter(b => b.wicket).length;
    const ov = `${Math.floor(legal / 6)}.${legal % 6}`;
    const eco = legal > 0 ? (runs / (legal / 6)).toFixed(1) : '-';
    return { overs: ov, runs, wickets, eco };
  };

  const striker = battingTeamPlayers.find(p => String(p.id) === String(strikeBatsman));
  const nonStriker = battingTeamPlayers.find(p => String(p.id) === String(nonStrikeBatsman));
  const bowler = bowlingTeamPlayers.find(p => String(p.id) === String(currentBowler));
  const strikerStats = batsmanStats(strikeBatsman);
  const nonStrikerStats = batsmanStats(nonStrikeBatsman);
  const bStats = bowlerStats(currentBowler);

  const needRuns = target ? target - activeScore : null;

  // ---- Ball pad ----
  const renderBallPad = () => {
    if (!strikeBatsman || !currentBowler) {
      return (
        <div style={{ ...PAD_BG, padding: '14px 12px', textAlign: 'center' }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>
            {!strikeBatsman ? 'Select striker above to begin scoring' : 'Select bowler above to begin scoring'}
          </span>
        </div>
      );
    }

    if (mode === 'wide') return (
      <div style={PAD_BG}>
        <div style={PAD_HEADER}>
          <button style={BACK_BTN} onClick={() => setMode(null)}>←</button>
          <span style={PAD_TITLE}>Wide — select overthrow runs</span>
        </div>
        <div style={{ ...PAD_ROW, flexWrap: 'wrap' }}>
          {[0, 1, 2, 3, 4, 5, 6].map(r => (
            <PBtn key={r} label={r === 0 ? 'Wd' : `${r}+Wd`} disabled={saving}
              onClick={() => doRecordBall({ runs: r, wide: true, four: r === 4 })} />
          ))}
          <PBtn label="Run Out" sub="on wide" danger disabled={saving}
            onClick={() => doRecordBall({ runs: 0, wide: true, wicket: true })} />
        </div>
      </div>
    );

    if (mode === 'noBall') return (
      <div style={PAD_BG}>
        <div style={PAD_HEADER}>
          <button style={BACK_BTN} onClick={() => setMode(null)}>←</button>
          <span style={PAD_TITLE}>No Ball — select runs off bat</span>
        </div>
        <div style={PAD_ROW}>
          {[0, 1, 2, 3, 4, 6].map(r => (
            <PBtn key={r} label={r === 0 ? 'NB' : `${r}NB`} disabled={saving}
              onClick={() => doRecordBall({ runs: r, noBall: true, four: r === 4, six: r === 6 })} />
          ))}
        </div>
        <div style={PAD_ROW}>
          <PBtn label="Leg Byes" sub="+NB" onClick={() => setMode('noBallLegBye')} />
          <PBtn label="Byes" sub="+NB" onClick={() => setMode('noBallBye')} />
          <PBtn label="4 5 6 7" sub="more +NB" onClick={() => setMode('noBallMore')} />
        </div>
      </div>
    );

    if (mode === 'noBallMore') return (
      <div style={PAD_BG}>
        <div style={PAD_HEADER}>
          <button style={BACK_BTN} onClick={() => setMode('noBall')}>←</button>
          <span style={PAD_TITLE}>No Ball + More Runs</span>
        </div>
        <div style={{ ...PAD_ROW, flexWrap: 'wrap' }}>
          {[4, 5, 6, 7, 8, 9, 10].map(r => (
            <PBtn key={r} label={`${r}NB`} disabled={saving}
              onClick={() => doRecordBall({ runs: r, noBall: true, four: r === 4, six: r === 6 })} />
          ))}
        </div>
      </div>
    );

    if (mode === 'noBallLegBye') return (
      <div style={PAD_BG}>
        <div style={PAD_HEADER}>
          <button style={BACK_BTN} onClick={() => setMode('noBall')}>←</button>
          <span style={PAD_TITLE}>No Ball + Leg Byes</span>
        </div>
        <div style={{ ...PAD_ROW, flexWrap: 'wrap' }}>
          {[1, 2, 3, 4, 5, 6, 7].map(r => (
            <PBtn key={r} label={`${r}LB`} sub="+ NB" disabled={saving}
              onClick={() => doRecordBall({ runs: r, noBall: true, legBye: true })} />
          ))}
        </div>
      </div>
    );

    if (mode === 'noBallBye') return (
      <div style={PAD_BG}>
        <div style={PAD_HEADER}>
          <button style={BACK_BTN} onClick={() => setMode('noBall')}>←</button>
          <span style={PAD_TITLE}>No Ball + Byes</span>
        </div>
        <div style={{ ...PAD_ROW, flexWrap: 'wrap' }}>
          {[1, 2, 3, 4, 5, 6, 7].map(r => (
            <PBtn key={r} label={`${r}B`} sub="+ NB" disabled={saving}
              onClick={() => doRecordBall({ runs: r, noBall: true, bye: true })} />
          ))}
        </div>
      </div>
    );

    if (mode === 'legBye') return (
      <div style={PAD_BG}>
        <div style={PAD_HEADER}>
          <button style={BACK_BTN} onClick={() => setMode(null)}>←</button>
          <span style={PAD_TITLE}>Leg Byes</span>
        </div>
        <div style={{ ...PAD_ROW, flexWrap: 'wrap' }}>
          {[1, 2, 3, 4, 5, 6, 7].map(r => (
            <PBtn key={r} label={`${r}LB`} disabled={saving}
              onClick={() => doRecordBall({ runs: r, legBye: true })} />
          ))}
        </div>
      </div>
    );

    if (mode === 'bye') return (
      <div style={PAD_BG}>
        <div style={PAD_HEADER}>
          <button style={BACK_BTN} onClick={() => setMode(null)}>←</button>
          <span style={PAD_TITLE}>Byes</span>
        </div>
        <div style={{ ...PAD_ROW, flexWrap: 'wrap' }}>
          {[1, 2, 3, 4, 5, 6, 7].map(r => (
            <PBtn key={r} label={`${r}B`} disabled={saving}
              onClick={() => doRecordBall({ runs: r, bye: true })} />
          ))}
        </div>
      </div>
    );

    if (mode === 'moreRuns') return (
      <div style={PAD_BG}>
        <div style={PAD_HEADER}>
          <button style={BACK_BTN} onClick={() => setMode(null)}>←</button>
          <span style={PAD_TITLE}>More Runs</span>
        </div>
        <div style={{ ...PAD_ROW, flexWrap: 'wrap' }}>
          {[4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map(r => (
            <PBtn key={r} label={r} disabled={saving}
              onClick={() => doRecordBall({ runs: r, four: r === 4, six: r === 6 })} />
          ))}
        </div>
      </div>
    );

    if (mode === 'more') return (
      <div style={PAD_BG}>
        <div style={PAD_HEADER}>
          <button style={BACK_BTN} onClick={() => setMode(null)}>←</button>
          <span style={PAD_TITLE}>More Options</span>
        </div>
        <div style={PAD_ROW}>
          <PBtn label="End Innings" onClick={() => { setMode(null); setActiveInnings(activeInnings === 'FIRST' ? 'SECOND' : 'FIRST'); }} />
          <PBtn label="+ Bat" onClick={() => { setMode(null); setBatForm(f => ({ ...f, inningsType: activeInnings })); setShowBatModal(true); }} />
          <PBtn label="+ Bowl" onClick={() => { setMode(null); setBowlForm(f => ({ ...f, inningsType: activeInnings })); setShowBowlModal(true); }} />
          <PBtn label="Settings" onClick={() => { setMode(null); setShowScoreModal(true); }} />
        </div>
      </div>
    );

    // Normal pad
    return (
      <div style={PAD_BG}>
        {freehit && (
          <div style={{ background: '#7c3aed', textAlign: 'center', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 0' }}>
            ⚡ FREE HIT — only run out allowed
          </div>
        )}
        {/* Row 1: 1 2 3 4 6 */}
        <div style={PAD_ROW}>
          {[1, 2, 3, 4, 6].map(r => (
            <PBtn key={r} label={r} disabled={saving}
              onClick={() => doRecordBall({ runs: r, four: r === 4, six: r === 6 })} />
          ))}
        </div>
        {/* Row 2: LB Bye Wide NB · */}
        <div style={PAD_ROW}>
          <PBtn label="LB" sub="leg bye" onClick={() => setMode('legBye')} disabled={saving} />
          <PBtn label="Bye" onClick={() => setMode('bye')} disabled={saving} />
          <PBtn label="Wide" onClick={() => setMode('wide')} disabled={saving} />
          <PBtn label="NB" sub="no ball" onClick={() => setMode('noBall')} disabled={saving} />
          <PBtn label="·" sub="dot" disabled={saving} onClick={() => doRecordBall({ runs: 0, dot: true })} />
        </div>
        {/* Row 3: More ⇄ 4567 Undo Out */}
        <div style={PAD_ROW}>
          <PBtn label="More" onClick={() => setMode('more')} disabled={saving} />
          <PBtn label="⇄" sub="rotate" disabled={saving} onClick={() => {
            const tmp = strikeBatsman;
            setStrikeBatsman(nonStrikeBatsman);
            setNonStrikeBatsman(tmp);
          }} />
          <PBtn label="4567" sub="more runs" onClick={() => setMode('moreRuns')} disabled={saving} />
          <PBtn label="Undo" disabled={undoing || saving} onClick={doUndoLastBall} />
          <PBtn label="Out" sub={freehit ? 'run out' : 'wicket'} danger disabled={saving}
            onClick={() => doRecordBall({ runs: 0, wicket: true })} />
        </div>
      </div>
    );
  };

  const tblHead = { textAlign: 'left', padding: '4px 10px', fontWeight: 500, color: '#64748b', fontSize: 11 };
  const tblHeadR = { ...tblHead, textAlign: 'right', width: 32 };
  const tblCell = { padding: '5px 10px', fontSize: 12 };
  const tblCellR = { ...tblCell, textAlign: 'right' };
  const selStyle = { fontSize: 11, border: '1px solid #e2e8f0', borderRadius: 4, color: '#64748b', background: '#f8fafc', padding: '2px 4px', marginLeft: 6 };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f1f5f9', position: 'relative' }}>

      {/* TOP NAV */}
      <div style={{ background: '#0f172a', color: '#fff', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: 0 }}>←</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, opacity: 0.55, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {match.team1Name} vs {match.team2Name} · Match #{match.matchNumber}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>
            {battingTeamName} — {activeInnings === 'FIRST' ? '1st' : '2nd'} Innings
          </div>
        </div>
        {isLive && <span style={{ fontSize: 10, fontWeight: 700, background: '#ef4444', color: '#fff', borderRadius: 4, padding: '2px 6px', flexShrink: 0 }}>LIVE</span>}
        {match.status === 'COMPLETED' && <span style={{ fontSize: 10, fontWeight: 700, background: '#64748b', color: '#fff', borderRadius: 4, padding: '2px 6px', flexShrink: 0 }}>FINAL</span>}
        <button
          onClick={() => setShowScoreModal(true)}
          style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>
          ⚙
        </button>
      </div>

      {/* SCORE BAND */}
      <div style={{ background: '#1e293b', color: '#fff', padding: '12px 14px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 48, fontWeight: 900, lineHeight: 1, fontFamily: 'Rajdhani, monospace' }}>
            {activeScore}/{activeWickets ?? 0}
          </span>
          <span style={{ fontSize: 18, opacity: 0.65, fontFamily: 'Rajdhani, monospace' }}>({activeOvers ?? 0} ov)</span>
          {activeInnings === 'SECOND' && needRuns != null && needRuns > 0 && (
            <span style={{ fontSize: 13, opacity: 0.85, marginLeft: 'auto' }}>
              Need {needRuns} off {needMoreBalls} balls
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 18, marginTop: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'Extras', val: extraRuns },
            { label: 'CRR', val: crr },
            { label: 'Overs', val: `${currentOver - 1}.${ballInOver - 1}/${maxOvers}` },
            { label: 'Partnership', val: `${partnership.runs}(${partnership.balls})` },
            ...(target ? [{ label: 'Target', val: target }] : []),
          ].map(({ label, val }) => (
            <div key={label}>
              <div style={{ fontSize: 9, opacity: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* THIS OVER */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, minWidth: 58 }}>This Over</span>
        <div style={{ display: 'flex', gap: 4, flex: 1, flexWrap: 'nowrap', overflowX: 'auto' }}>
          {currentOverBalls.length === 0
            ? <span style={{ fontSize: 12, color: '#94a3b8' }}>No balls yet</span>
            : currentOverBalls.map(b => <BallChip key={b.id} b={b} />)}
        </div>
        <span style={{ fontSize: 11, color: '#64748b', flexShrink: 0 }}>
          {currentOverBalls.filter(b => !b.wide && !b.noBall).length}/6
        </span>
      </div>

      {/* TOSS INFO BAR — shown once toss is confirmed */}
      {isLive && match.tossWinnerId && (
        <div style={{ background: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 13 }}>🪙</span>
          <span style={{ fontSize: 12, color: '#94a3b8', flex: 1 }}>
            <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{match.tossWinnerName}</span>
            {' '}won the toss and elected to{' '}
            <span style={{ color: '#f97316', fontWeight: 600 }}>
              {match.tossDecision === 'BAT' ? 'bat' : 'bowl'}
            </span>
          </span>
          <button
            onClick={() => setShowTossEdit(true)}
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#cbd5e1', borderRadius: 6, padding: '3px 10px', fontSize: 11, cursor: 'pointer', flexShrink: 0 }}>
            Edit
          </button>
        </div>
      )}

      {/* TOSS SETUP — shown when toss hasn't been set yet */}
      {isLive && !match.tossWinnerId && (
        <div style={{ background: '#1e40af', color: '#fff', padding: '14px 14px', flexShrink: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>🪙 Set Toss Result</div>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 10 }}>Who won the toss?</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {[{ id: match.team1Id, name: match.team1Name }, { id: match.team2Id, name: match.team2Name }].map(t => (
              <button key={t.id}
                onClick={() => setScoreForm(f => ({ ...f, tossWinnerId: String(t.id) }))}
                style={{
                  flex: 1, padding: '8px 4px', borderRadius: 8, border: '2px solid',
                  borderColor: scoreForm.tossWinnerId === String(t.id) ? '#fff' : 'rgba(255,255,255,0.3)',
                  background: scoreForm.tossWinnerId === String(t.id) ? 'rgba(255,255,255,0.2)' : 'transparent',
                  color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                }}>
                {t.name}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>Elected to…</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {['BAT', 'BOWL'].map(d => (
              <button key={d}
                onClick={() => setScoreForm(f => ({ ...f, tossDecision: d }))}
                style={{
                  flex: 1, padding: '8px 4px', borderRadius: 8, border: '2px solid',
                  borderColor: scoreForm.tossDecision === d ? '#fff' : 'rgba(255,255,255,0.3)',
                  background: scoreForm.tossDecision === d ? 'rgba(255,255,255,0.2)' : 'transparent',
                  color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                }}>
                {d === 'BAT' ? '🏏 Bat' : '⚾ Bowl'}
              </button>
            ))}
          </div>
          <button
            disabled={!scoreForm.tossWinnerId || saving}
            onClick={async () => {
              setSaving(true);
              try {
                await updateScore(id, {
                  team: 'team1', score: match.team1Score ?? 0,
                  wickets: match.team1Wickets ?? 0, overs: match.team1Overs ?? 0,
                  status: 'LIVE',
                  tossWinnerId: +scoreForm.tossWinnerId,
                  tossDecision: scoreForm.tossDecision,
                });
                loadMatchData(id);
              } catch { showMsg('Failed to save toss'); }
              setSaving(false);
            }}
            style={{
              width: '100%', padding: '10px', borderRadius: 8, border: 'none',
              background: scoreForm.tossWinnerId ? '#fff' : 'rgba(255,255,255,0.3)',
              color: scoreForm.tossWinnerId ? '#1e40af' : 'rgba(255,255,255,0.5)',
              fontWeight: 700, fontSize: 14, cursor: scoreForm.tossWinnerId ? 'pointer' : 'not-allowed',
            }}>
            {saving ? 'Saving…' : 'Confirm Toss →'}
          </button>
        </div>
      )}

      {/* LIVE PLAYERS */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '10px 12px', flexShrink: 0 }}>
        {/* Batting table */}
        <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Batting</div>
        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ color: '#94a3b8', fontSize: 10 }}>
              <th style={{ textAlign: 'left', fontWeight: 400, paddingBottom: 2 }}>Batter</th>
              <th style={{ textAlign: 'right', fontWeight: 400, width: 28 }}>R</th>
              <th style={{ textAlign: 'right', fontWeight: 400, width: 28 }}>B</th>
              <th style={{ textAlign: 'right', fontWeight: 400, width: 28 }}>4s</th>
              <th style={{ textAlign: 'right', fontWeight: 400, width: 28 }}>6s</th>
              <th style={{ textAlign: 'right', fontWeight: 400, width: 36 }}>SR</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ paddingBottom: 3 }}>
                <span style={{ fontWeight: 700 }}>{striker ? striker.name : '—'}</span>
                {striker && <span style={{ fontSize: 11, marginLeft: 3, color: '#f97316' }}>*</span>}
                <select value={strikeBatsman} onChange={e => setStrikeBatsman(e.target.value)} style={selStyle}>
                  <option value="">— set striker —</option>
                  {battingTeamPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </td>
              <td style={{ textAlign: 'right', fontWeight: 700 }}>{strikerStats.runs}</td>
              <td style={{ textAlign: 'right', color: '#64748b' }}>{strikerStats.balls}</td>
              <td style={{ textAlign: 'right', color: '#22c55e' }}>{strikerStats.fours}</td>
              <td style={{ textAlign: 'right', color: '#f97316' }}>{strikerStats.sixes}</td>
              <td style={{ textAlign: 'right', color: '#64748b' }}>{strikerStats.sr}</td>
            </tr>
            <tr>
              <td style={{ paddingBottom: 2 }}>
                <span style={{ color: '#475569' }}>{nonStriker ? nonStriker.name : '—'}</span>
                <select value={nonStrikeBatsman} onChange={e => setNonStrikeBatsman(e.target.value)} style={selStyle}>
                  <option value="">— set non-striker —</option>
                  {battingTeamPlayers.filter(p => String(p.id) !== strikeBatsman).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </td>
              <td style={{ textAlign: 'right' }}>{nonStrikerStats.runs}</td>
              <td style={{ textAlign: 'right', color: '#64748b' }}>{nonStrikerStats.balls}</td>
              <td style={{ textAlign: 'right', color: '#22c55e' }}>{nonStrikerStats.fours}</td>
              <td style={{ textAlign: 'right', color: '#f97316' }}>{nonStrikerStats.sixes}</td>
              <td style={{ textAlign: 'right', color: '#64748b' }}>{nonStrikerStats.sr}</td>
            </tr>
          </tbody>
        </table>

        {/* Bowling table */}
        <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8, marginBottom: 4 }}>Bowling</div>
        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ color: '#94a3b8', fontSize: 10 }}>
              <th style={{ textAlign: 'left', fontWeight: 400, paddingBottom: 2 }}>Bowler</th>
              <th style={{ textAlign: 'right', fontWeight: 400, width: 36 }}>O</th>
              <th style={{ textAlign: 'right', fontWeight: 400, width: 28 }}>R</th>
              <th style={{ textAlign: 'right', fontWeight: 400, width: 28 }}>W</th>
              <th style={{ textAlign: 'right', fontWeight: 400, width: 36 }}>Eco</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>{bowler ? bowler.name : '—'}</span>
                <select value={currentBowler} onChange={e => setCurrentBowler(e.target.value)} style={selStyle}>
                  <option value="">— set bowler —</option>
                  {bowlingTeamPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </td>
              <td style={{ textAlign: 'right', color: '#64748b' }}>{bStats.overs}</td>
              <td style={{ textAlign: 'right' }}>{bStats.runs}</td>
              <td style={{ textAlign: 'right', fontWeight: bStats.wickets >= 3 ? 700 : 400, color: bStats.wickets >= 3 ? '#22c55e' : 'inherit' }}>{bStats.wickets}</td>
              <td style={{ textAlign: 'right', color: '#64748b' }}>{bStats.eco}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Alerts */}
      {msg && (
        <div style={{ padding: '8px 12px', background: msg.includes('Failed') ? '#fef2f2' : '#f0fdf4', color: msg.includes('Failed') ? '#dc2626' : '#16a34a', fontSize: 13, fontWeight: 600, textAlign: 'center', flexShrink: 0 }}>
          {msg}
        </div>
      )}
      {(inningsComplete || chaseWon) && (
        <div style={{ background: chaseWon ? '#16a34a' : '#f97316', color: '#fff', padding: '12px 14px', textAlign: 'center', fontWeight: 700, flexShrink: 0 }}>
          {chaseWon
            ? `🏆 ${team1BatsFirst ? match.team2Name : match.team1Name} wins the match!`
            : allOut
              ? `All out! Innings complete.`
              : `Over limit reached — innings complete.`}
          {!chaseWon && activeInnings === 'FIRST' && (
            <button onClick={() => setActiveInnings('SECOND')}
              style={{ marginLeft: 12, background: '#fff', color: '#f97316', border: 'none', borderRadius: 6, padding: '4px 12px', fontWeight: 700, cursor: 'pointer' }}>
              2nd Innings →
            </button>
          )}
        </div>
      )}

      {/* SCROLLABLE CONTENT */}
      <div style={{ flex: 1, paddingBottom: isLive && !inningsComplete && !chaseWon ? '4px' : '16px' }}>

        {/* Innings toggle + scorecard link */}
        <div style={{ display: 'flex', padding: '10px 12px', gap: 8, background: '#f8fafc', borderBottom: '1px solid #e2e8f0', alignItems: 'center' }}>
          <button className={`btn btn-sm ${activeInnings === 'FIRST' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveInnings('FIRST')}>
            {team1BatsFirst ? match.team1Name : match.team2Name} (1st)
          </button>
          <button className={`btn btn-sm ${activeInnings === 'SECOND' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveInnings('SECOND')}>
            {team1BatsFirst ? match.team2Name : match.team1Name} (2nd)
          </button>
          <Link to={`/matches/${id}/scorecard`} target="_blank"
            style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>
            Full Scorecard ↗
          </Link>
        </div>

        {/* Scorecard tables */}
        {[
          { label: `1st — ${innings1?.team ?? (team1BatsFirst ? match.team1Name : match.team2Name)}`, score: innings1?.total, wkts: innings1?.wickets, overs: innings1?.overs, innings: innings1 },
          { label: `2nd — ${innings2?.team ?? (team1BatsFirst ? match.team2Name : match.team1Name)}`, score: innings2?.total, wkts: innings2?.wickets, overs: innings2?.overs, innings: innings2 },
        ].map(({ label, score, wkts, overs, innings }) => (
          <div key={label} style={{ background: '#fff', marginTop: 8, borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{label}</span>
              <span style={{ fontSize: 15, fontWeight: 800, fontFamily: 'Rajdhani, monospace' }}>
                {score ?? '-'}/{wkts ?? 0} ({overs ?? 0})
              </span>
            </div>
            {innings?.batting?.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 280 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={tblHead}>Batter</th>
                      <th style={tblHeadR}>R</th>
                      <th style={tblHeadR}>B</th>
                      <th style={tblHeadR}>4s</th>
                      <th style={tblHeadR}>6s</th>
                      <th style={tblHeadR}>SR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {innings.batting.map(b => (
                      <tr key={b.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td style={tblCell}>{b.playerName}{!b.isOut && '*'}</td>
                        <td style={{ ...tblCellR, fontWeight: 700 }}>{b.runs}</td>
                        <td style={{ ...tblCellR, color: '#64748b' }}>{b.balls}</td>
                        <td style={{ ...tblCellR, color: '#22c55e' }}>{b.fours}</td>
                        <td style={{ ...tblCellR, color: '#f97316' }}>{b.sixes}</td>
                        <td style={{ ...tblCellR, color: '#64748b' }}>{b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(0) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {innings?.bowling?.length > 0 && (
              <div style={{ overflowX: 'auto', borderTop: '1px solid #e2e8f0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 240 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={tblHead}>Bowler</th>
                      <th style={tblHeadR}>O</th>
                      <th style={tblHeadR}>R</th>
                      <th style={tblHeadR}>W</th>
                      <th style={tblHeadR}>Eco</th>
                    </tr>
                  </thead>
                  <tbody>
                    {innings.bowling.map(b => (
                      <tr key={b.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td style={tblCell}>{b.playerName}</td>
                        <td style={{ ...tblCellR, color: '#64748b' }}>{b.overs}</td>
                        <td style={tblCellR}>{b.runsConceded}</td>
                        <td style={{ ...tblCellR, fontWeight: b.wickets >= 3 ? 700 : 400, color: b.wickets >= 3 ? '#22c55e' : 'inherit' }}>{b.wickets}</td>
                        <td style={{ ...tblCellR, color: '#64748b' }}>{b.overs > 0 ? (b.runsConceded / b.overs).toFixed(1) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!innings?.batting?.length && !innings?.bowling?.length && (
              <div style={{ padding: '12px', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>No records yet</div>
            )}
            {isLive && (
              <div style={{ padding: '8px 12px', display: 'flex', gap: 8, borderTop: '1px solid #f1f5f9' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => { setBatForm(f => ({ ...f, inningsType: activeInnings })); setShowBatModal(true); }}>+ Batting</button>
                <button className="btn btn-ghost btn-sm" onClick={() => { setBowlForm(f => ({ ...f, inningsType: activeInnings })); setShowBowlModal(true); }}>+ Bowling</button>
              </div>
            )}
          </div>
        ))}

        {/* Overs summary */}
        <div style={{ background: '#fff', marginTop: 8, borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ padding: '8px 12px', fontSize: 12, fontWeight: 700, background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
            Over by Over — {battingTeamName}
          </div>
          {Array.from({ length: Math.max(currentOver, 1) }, (_, i) => i + 1).map(ov => {
            const ovBalls = activeBalls.filter(b => b.overNumber === ov);
            const runs = ovBalls.reduce((s, b) => s + b.runs + (b.wide || b.noBall ? 1 : 0), 0);
            const wkts = ovBalls.filter(b => b.wicket).length;
            return (
              <div key={ov} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderTop: '1px solid #f1f5f9', fontSize: 12 }}>
                <span style={{ minWidth: 40, color: '#64748b', fontWeight: 600 }}>Ov {ov}</span>
                <div style={{ display: 'flex', gap: 3, flex: 1 }}>
                  {Array.from({ length: 6 }, (_, j) => {
                    const b = activeBalls.filter(x => x.overNumber === ov && !x.wide && !x.noBall)[j];
                    return b
                      ? <BallChip key={j} b={b} size={22} />
                      : <div key={j} style={{ width: 22, height: 22, borderRadius: '50%', background: '#f1f5f9', border: '1px dashed #cbd5e1', flexShrink: 0 }} />;
                  })}
                </div>
                <span style={{ color: '#64748b', minWidth: 48, textAlign: 'right' }}>
                  {runs}R{wkts ? `, ${wkts}W` : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* BALL PAD — sticky bottom */}
      {isLive && !inningsComplete && !chaseWon && (
        <div style={{ position: 'sticky', bottom: 0, zIndex: 100, flexShrink: 0 }}>
          {renderBallPad()}
        </div>
      )}

      {/* ---- MODALS ---- */}

      {/* TOSS EDIT MODAL */}
      {showTossEdit && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowTossEdit(false)}>
          <div className="modal modal-sm">
            <div className="modal-header">
              <div className="modal-title">🪙 Edit Toss</div>
              <button className="close-btn" onClick={() => setShowTossEdit(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Toss Won By</label>
                <select className="form-select" value={scoreForm.tossWinnerId}
                  onChange={e => setScoreForm(f => ({ ...f, tossWinnerId: e.target.value }))}>
                  <option value="">— Select team —</option>
                  <option value={String(match.team1Id)}>{match.team1Name}</option>
                  <option value={String(match.team2Id)}>{match.team2Name}</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Elected To</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['BAT', 'BOWL'].map(d => (
                    <button key={d} type="button"
                      onClick={() => setScoreForm(f => ({ ...f, tossDecision: d }))}
                      style={{
                        flex: 1, padding: '10px', borderRadius: 8,
                        border: '2px solid',
                        borderColor: scoreForm.tossDecision === d ? 'var(--accent)' : 'var(--border)',
                        background: scoreForm.tossDecision === d ? 'var(--accent-muted, #fff7ed)' : 'transparent',
                        color: scoreForm.tossDecision === d ? 'var(--accent)' : 'var(--text-2)',
                        fontWeight: 700, fontSize: 14, cursor: 'pointer',
                      }}>
                      {d === 'BAT' ? '🏏 Bat' : '⚾ Bowl'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setShowTossEdit(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" disabled={!scoreForm.tossWinnerId || saving}
                onClick={async () => {
                  setSaving(true);
                  try {
                    await updateScore(id, {
                      team: 'team1', score: match.team1Score ?? 0,
                      wickets: match.team1Wickets ?? 0, overs: match.team1Overs ?? 0,
                      status: match.status,
                      tossWinnerId: +scoreForm.tossWinnerId,
                      tossDecision: scoreForm.tossDecision,
                    });
                    await loadMatchData(id);
                    setShowTossEdit(false);
                    showMsg('Toss updated');
                  } catch { showMsg('Failed to update toss'); }
                  setSaving(false);
                }}>
                {saving ? 'Saving…' : 'Save Toss'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showScoreModal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowScoreModal(false)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <div className="modal-title">Match Settings</div>
              <button className="close-btn" onClick={() => setShowScoreModal(false)}>×</button>
            </div>
            <form onSubmit={handleScoreUpdate}>
              <div className="modal-body">
                <div className="form-row" style={{ marginBottom: 16 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Match Status</label>
                    <select className="form-select" value={scoreForm.status} onChange={e => setScoreForm(f => ({ ...f, status: e.target.value }))}>
                      <option value="SCHEDULED">Scheduled</option>
                      <option value="LIVE">Live</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>
                </div>
                <div className="form-row" style={{ marginBottom: 16 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Toss Won By</label>
                    <select className="form-select" value={scoreForm.tossWinnerId} onChange={e => setScoreForm(f => ({ ...f, tossWinnerId: e.target.value }))}>
                      <option value="">— Select team —</option>
                      <option value={match.team1Id}>{match.team1Name}</option>
                      <option value={match.team2Id}>{match.team2Name}</option>
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
