import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMatch, getScorecard, getBalls, subscribeToMatch } from '../services/api';

export default function LiveMatchView() {
  const { id } = useParams();
  const [match, setMatch] = useState(null);
  const [scorecard, setScorecard] = useState(null);
  const [balls, setBalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const esRef = useRef(null);

  const reload = () => {
    Promise.all([getMatch(id), getScorecard(id), getBalls(id)]).then(([mr, sr, br]) => {
      setMatch(mr.data);
      setScorecard(sr.data);
      setBalls(br.data || []);
      setLoading(false);
      setLastUpdate(new Date());
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    reload();

    // Subscribe to real-time updates via SSE
    esRef.current = subscribeToMatch(id, (data) => {
      // data could be a BallResponse or MatchResponse; just reload fresh state
      reload();
      setLastUpdate(new Date());
    });

    return () => {
      if (esRef.current) esRef.current.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <div className="loading"><div className="spinner" /><span>Loading live match...</span></div>;
  if (!match) return <div className="loading"><p>Match not found</p></div>;

  const innings1 = scorecard?.firstInnings;
  const innings2 = scorecard?.secondInnings;
  const isLive = match.status === 'LIVE';

  const getBallsByInnings = (type) => balls.filter(b => b.inningsType === type);

  const InningsTimeline = ({ type }) => {
    const inningsBalls = getBallsByInnings(type);
    const maxOvers = match.overs || 3;
    return (
      <div>
        {Array.from({ length: maxOvers }, (_, i) => i + 1).map(ov => {
          const ovBalls = inningsBalls.filter(b => b.overNumber === ov);
          if (!ovBalls.length) return null;
          const runs = ovBalls.reduce((s, b) => s + b.runs + (b.wide || b.noBall ? 1 : 0), 0);
          const wkts = ovBalls.filter(b => b.wicket).length;
          return (
            <div key={ov} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>
                Over {ov} â€” {runs} run{runs !== 1 ? 's' : ''}{wkts > 0 ? `, ${wkts} wkt${wkts > 1 ? 's' : ''}` : ''}
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {ovBalls.map((b, i) => (
                  <div key={b.id} className={`over-ball ${b.four ? 'four' : b.six ? 'six' : b.wicket ? 'wicket' : b.dot ? 'dot' : b.wide || b.noBall ? 'extra' : ''}`}
                    title={`${b.batsmanName || '?'} vs ${b.bowlerName || '?'}`}>
                    {b.wide ? 'Wd' : b.noBall ? 'Nb' : b.wicket ? 'W' : b.four ? '4' : b.six ? '6' : b.runs === 0 ? 'Â·' : b.runs}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ padding: '0 0 40px' }}>
      {/* Match Header */}
      <div className="live-score-header" style={{ padding: '20px 24px' }}>
        <div style={{ flex: 1 }}>
          <div className="live-badge-row">
            {isLive && <span className="badge badge-live" style={{ animation: 'pulse 1.5s infinite' }}>â— LIVE</span>}
            {match.status === 'COMPLETED' && <span className="badge badge-completed">FINAL</span>}
            {match.status === 'SCHEDULED' && <span className="badge" style={{ background: 'var(--card-bg)' }}>UPCOMING</span>}
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{match.venue} Â· {match.overs} overs</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, margin: '4px 0' }}>
            {match.team1Name} vs {match.team2Name}
          </div>
          {match.result && <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>{match.result}</div>}
          {lastUpdate && (
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
              Updated {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>
        <Link to={`/matches/${id}/scorecard`} className="btn btn-ghost btn-sm">Full Scorecard</Link>
      </div>

      <div style={{ padding: '0 24px' }}>
        {/* Scores */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
          {[
            { name: match.team1Name, color: match.team1Color, score: match.team1Score, wkts: match.team1Wickets, overs: match.team1Overs, label: '1st Innings' },
            { name: match.team2Name, color: match.team2Color, score: match.team2Score, wkts: match.team2Wickets, overs: match.team2Overs, label: '2nd Innings' },
          ].map((t, i) => (
            <div key={i} className="card" style={{ padding: 20, borderTop: `3px solid ${t.color || 'var(--accent)'}` }}>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 4 }}>{t.label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{t.name}</div>
              <div style={{ fontFamily: 'Rajdhani', fontSize: 36, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>
                {t.score ?? '-'}<span style={{ fontSize: 20 }}>/{t.wkts ?? 0}</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>
                {t.overs ?? 0} / {match.overs} overs
                {t.overs > 0 && t.score != null && (
                  <span style={{ marginLeft: 8 }}>CRR: {(t.score / t.overs).toFixed(2)}</span>
                )}
              </div>
              {i === 1 && match.team1Score != null && t.score != null && isLive && (
                <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>
                  Need {Math.max(0, match.team1Score - t.score + 1)} from {Math.max(0, (match.overs - t.overs)).toFixed(1)} overs
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Ball by Ball */}
        <div style={{ marginTop: 28 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Ball-by-Ball Commentary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {[
              { label: `1st Innings â€” ${match.team1Name}`, type: 'FIRST' },
              { label: `2nd Innings â€” ${match.team2Name}`, type: 'SECOND' },
            ].map(({ label, type }) => (
              <div key={type} className="card" style={{ padding: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>{label}</div>
                <InningsTimeline type={type} />
                {!getBallsByInnings(type).length && (
                  <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
                    {type === 'FIRST' ? 'Match not started yet' : 'Innings not started yet'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Batting Cards */}
        {(innings1 || innings2) && (
          <div style={{ marginTop: 28 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Batting</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {[
                { label: match.team1Name, innings: innings1 },
                { label: match.team2Name, innings: innings2 },
              ].map(({ label, innings }) => innings && (
                <div key={label} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', fontWeight: 600, fontSize: 13, borderBottom: '1px solid var(--card-border)' }}>{label}</div>
                  <div className="sc-table-wrap">
                    <table className="sc-table">
                      <thead><tr><th>Batter</th><th className="right">R</th><th className="right">B</th><th className="right">4s</th><th className="right">6s</th><th className="right">SR</th></tr></thead>
                      <tbody>
                        {innings.batting.map(b => (
                          <tr key={b.id} className={!b.isOut ? 'on-strike' : ''}>
                            <td>
                              <div style={{ fontWeight: !b.isOut ? 700 : 400 }}>{b.playerName}{!b.isOut && '*'}</div>
                              {b.isOut && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{b.dismissalType}</div>}
                            </td>
                            <td className="right" style={{ fontWeight: 700, fontFamily: 'Rajdhani', fontSize: 15, color: b.runs >= 50 ? 'var(--accent)' : 'inherit' }}>{b.runs}</td>
                            <td className="right" style={{ color: 'var(--text-3)' }}>{b.balls}</td>
                            <td className="right" style={{ color: 'var(--green)' }}>{b.fours}</td>
                            <td className="right" style={{ color: 'var(--accent)' }}>{b.sixes}</td>
                            <td className="right" style={{ color: 'var(--text-3)' }}>{b.strikeRate?.toFixed(0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bowling Cards */}
        {(innings1?.bowling?.length > 0 || innings2?.bowling?.length > 0) && (
          <div style={{ marginTop: 28 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Bowling</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {[
                { label: match.team2Name + ' bowling', innings: innings1 },
                { label: match.team1Name + ' bowling', innings: innings2 },
              ].map(({ label, innings }) => innings?.bowling?.length > 0 && (
                <div key={label} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', fontWeight: 600, fontSize: 13, borderBottom: '1px solid var(--card-border)' }}>{label}</div>
                  <div className="sc-table-wrap">
                    <table className="sc-table">
                      <thead><tr><th>Bowler</th><th className="right">O</th><th className="right">M</th><th className="right">R</th><th className="right">W</th><th className="right">Eco</th></tr></thead>
                      <tbody>
                        {innings.bowling.map(b => (
                          <tr key={b.id}>
                            <td style={{ fontWeight: b.wickets >= 3 ? 700 : 400 }}>{b.playerName}</td>
                            <td className="right" style={{ color: 'var(--text-3)' }}>{b.overs}</td>
                            <td className="right" style={{ color: 'var(--text-3)' }}>{b.maidens}</td>
                            <td className="right">{b.runsConceded}</td>
                            <td className="right" style={{ color: b.wickets >= 3 ? 'var(--green)' : 'inherit', fontWeight: b.wickets >= 3 ? 700 : 400 }}>{b.wickets}</td>
                            <td className="right" style={{ color: 'var(--text-3)' }}>{b.economy?.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

