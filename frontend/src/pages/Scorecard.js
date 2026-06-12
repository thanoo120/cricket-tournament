import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getScorecard, getMatch } from '../services/api';

export default function Scorecard() {
  const { id } = useParams();
  const [sc, setSc] = useState(null);
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getScorecard(id), getMatch(id)]).then(([s, m]) => {
      setSc(s.data); setMatch(m.data); setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading"><div className="spinner" /><span>Loading scorecard...</span></div>;
  if (!sc || !match) return <div className="loading"><p>Scorecard not available</p></div>;

  const i1 = sc.firstInnings;
  const i2 = sc.secondInnings;

  const InningsBatting = ({ innings, teamName }) => {
    if (!innings?.batting?.length) return null;
    const sorted = [...innings.batting].sort((a, b) => a.battingOrder - b.battingOrder);
    const extras = innings.extras || 0;
    const total = innings.total;
    return (
      <div style={{ marginBottom: 24 }}>
        <div className="innings-label">{teamName} Innings</div>
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Batter</th>
                  <th>Dismissal</th>
                  <th className="right">R</th>
                  <th className="right">B</th>
                  <th className="right">4s</th>
                  <th className="right">6s</th>
                  <th className="right">SR</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(b => (
                  <tr key={b.id}>
                    <td>
                      <span className={b.runs >= 50 ? 'top-scorer' : ''}>
                        {b.playerName}
                        {!b.isOut && <span className="not-out"> *</span>}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: b.isOut ? 'var(--red)' : 'var(--green)', maxWidth: 180 }}>
                      {b.isOut ? b.dismissalType : 'not out'}
                    </td>
                    <td className="right td-mono" style={{ fontWeight: b.runs >= 50 ? 700 : 400, color: b.runs >= 100 ? 'var(--gold-light)' : b.runs >= 50 ? 'var(--cyan)' : 'inherit', fontSize: 14 }}>
                      {b.runs}
                    </td>
                    <td className="right td-mono">{b.balls}</td>
                    <td className="right td-mono" style={{ color: 'var(--green)' }}>{b.fours}</td>
                    <td className="right td-mono" style={{ color: 'var(--gold-light)' }}>{b.sixes}</td>
                    <td className="right td-mono">{b.strikeRate?.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <td colSpan={2} style={{ fontWeight: 600, color: 'var(--text-2)', fontSize: 12, padding: '8px 14px' }}>Extras</td>
                  <td className="right td-mono" colSpan={5} style={{ padding: '8px 14px' }}>{extras}</td>
                </tr>
                <tr style={{ background: 'rgba(212,160,23,0.06)', borderTop: '2px solid var(--card-border)' }}>
                  <td colSpan={2} style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 15, padding: '10px 14px' }}>
                    Total — {innings.wickets || 0} wkts, {innings.overs} overs
                  </td>
                  <td className="right" colSpan={5} style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 20, color: 'var(--gold-light)', padding: '10px 14px' }}>
                    {total}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {innings.bowling?.length > 0 && (
            <>
              <div style={{ padding: '10px 14px 6px', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', letterSpacing: 1.2, textTransform: 'uppercase', borderTop: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.02)' }}>
                Bowling
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Bowler</th>
                      <th className="right">O</th>
                      <th className="right">M</th>
                      <th className="right">R</th>
                      <th className="right">W</th>
                      <th className="right">Wd</th>
                      <th className="right">NB</th>
                      <th className="right">Eco</th>
                    </tr>
                  </thead>
                  <tbody>
                    {innings.bowling.map(b => (
                      <tr key={b.id}>
                        <td style={{ fontWeight: b.wickets >= 3 ? 600 : 400 }}>{b.playerName}</td>
                        <td className="right td-mono">{b.overs}</td>
                        <td className="right td-mono">{b.maidens}</td>
                        <td className="right td-mono">{b.runsConceded}</td>
                        <td className="right td-mono" style={{ color: b.wickets >= 3 ? 'var(--green)' : 'inherit', fontWeight: b.wickets >= 3 ? 700 : 400 }}>
                          {b.wickets}
                        </td>
                        <td className="right td-mono">{b.wides}</td>
                        <td className="right td-mono">{b.noBalls}</td>
                        <td className="right td-mono">{b.economy?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-title">Official Scorecard</div>
        </div>
        <div className="page-header-right">
          <Link to="/fixtures" className="btn btn-ghost btn-sm">← All Matches</Link>
        </div>
      </div>

      <div className="page-content">
        {/* Match Header */}
        <div className="scorecard-header">
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <span className={`badge badge-${match.status.toLowerCase()}`}>{match.status}</span>
            <span>Match #{match.matchNumber}</span>
          </div>
          <div className="scorecard-match-title">{match.team1Name} vs {match.team2Name}</div>
          <div className="scorecard-venue">📍 {match.venue}</div>

          <div className="scorecard-scores">
            <div className="scorecard-team-score">
              <div className="scorecard-team-short">{match.team1Name}</div>
              <div className="scorecard-score-main">
                {match.team1Score ?? '—'}{match.team1Wickets != null && <span>/{match.team1Wickets}</span>}
              </div>
              <div className="scorecard-overs-text">
                {match.team1Overs > 0 ? `(${match.team1Overs} overs)` : 'Yet to bat'}
              </div>
              {match.team1Score > 0 && match.team1Overs > 0 && (
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                  RR: {(match.team1Score / match.team1Overs).toFixed(2)}
                </div>
              )}
            </div>
            <div style={{ fontFamily: 'Rajdhani', fontSize: 14, fontWeight: 700, color: 'var(--text-3)', padding: '0 16px' }}>VS</div>
            <div className="scorecard-team-score">
              <div className="scorecard-team-short">{match.team2Name}</div>
              <div className="scorecard-score-main">
                {match.team2Score ?? '—'}{match.team2Wickets != null && <span>/{match.team2Wickets}</span>}
              </div>
              <div className="scorecard-overs-text">
                {match.team2Overs > 0 ? `(${match.team2Overs} overs)` : 'Yet to bat'}
              </div>
              {match.team2Score > 0 && match.team2Overs > 0 && (
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                  RR: {(match.team2Score / match.team2Overs).toFixed(2)}
                </div>
              )}
            </div>
          </div>

          {match.result && (
            <div style={{ marginTop: 16, padding: '10px 20px', background: 'var(--green-muted)', border: '1px solid rgba(0,200,83,0.25)', borderRadius: 'var(--r-md)', display: 'inline-block', fontSize: 14, fontWeight: 600, color: 'var(--green)' }}>
              🏆 {match.result}
            </div>
          )}

          {match.tossWinnerName && (
            <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text-3)' }}>
              🪙 {match.tossWinnerName} won toss and elected to {match.tossDecision === 'BAT' ? 'bat' : 'bowl'}
            </div>
          )}

          {match.playerOfMatchName && (
            <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: 'var(--gold-glow)', border: '1px solid rgba(212,160,23,0.25)', borderRadius: 20, fontSize: 13, color: 'var(--gold-light)', fontWeight: 600 }}>
              ⭐ Player of the Match: {match.playerOfMatchName}
            </div>
          )}
        </div>

        {/* Innings */}
        {i1 && <InningsBatting innings={i1} teamName={match.team1Name} />}
        {i2 && <InningsBatting innings={i2} teamName={match.team2Name} />}

        {!i1 && !i2 && (
          <div className="card"><div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No scorecard data</h3>
            <p>Performance records will appear here once innings data is entered</p>
          </div></div>
        )}
      </div>
    </div>
  );
}
