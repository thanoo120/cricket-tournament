import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getScorecard, getMatch } from '../services/api';

export default function Scorecard() {
  const { id } = useParams();
  const [sc, setSc]       = useState(null);
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getScorecard(id), getMatch(id)]).then(([s, m]) => {
      setSc(s.data); setMatch(m.data); setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading"><div className="spinner" /><span>Loading scorecard...</span></div>;
  if (!sc || !match) return (
    <div className="pub-page">
      <div className="pd-body">
        <div className="pd-card pd-empty" style={{ minHeight: 240 }}>
          <div className="pd-empty-icon">📋</div>
          <div className="pd-empty-title">Scorecard not available</div>
          <div className="pd-empty-sub">No data recorded for this match yet</div>
          <Link to="/fixtures" className="btn btn-ghost btn-sm" style={{ marginTop: 16 }}>← Back to fixtures</Link>
        </div>
      </div>
    </div>
  );

  const i1 = sc.firstInnings;
  const i2 = sc.secondInnings;

  const InningsBatting = ({ innings, teamName }) => {
    if (!innings?.batting?.length) return null;
    const sorted = [...innings.batting].sort((a, b) => (a.battingOrder ?? 999) - (b.battingOrder ?? 999));
    const extras = innings.extras || 0;
    const total  = innings.total;
    const crr    = innings.overs > 0 ? (total / innings.overs).toFixed(2) : null;

    return (
      <div className="sc-innings">
        {/* Innings header */}
        <div className="sc-innings-hdr">
          <div className="sc-innings-title">{teamName} Innings</div>
          <div className="sc-innings-score">
            <span>{total}/{innings.wickets || 0}</span>
            <span className="sc-innings-overs">({innings.overs} ov)</span>
            {crr && <span className="sc-innings-crr">CRR {crr}</span>}
          </div>
        </div>

        {/* Batting table */}
        <div className="table-wrap innings-batting-table">
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
                <tr key={b.id}
                  className={b.runs >= 100 ? 'hundred' : b.runs >= 50 ? 'fifty' : !b.isOut ? 'not-out-row' : ''}>
                  <td>
                    <span style={{ fontWeight: b.runs >= 50 ? 700 : 500 }}>{b.playerName}</span>
                    {!b.isOut && <span className="not-out"> *</span>}
                  </td>
                  <td style={{ fontSize: 12, color: b.isOut ? 'var(--red)' : 'var(--green)', maxWidth: 180 }}>
                    {b.isOut ? b.dismissalType : 'not out'}
                  </td>
                  <td className="right td-mono" style={{
                    fontWeight: 700, fontSize: 14,
                    color: b.runs >= 100 ? 'var(--orange)' : b.runs >= 50 ? 'var(--accent)' : 'var(--text-1)'
                  }}>{b.runs}</td>
                  <td className="right td-mono">{b.balls}</td>
                  <td className="right td-mono" style={{ color: 'var(--accent)' }}>{b.fours}</td>
                  <td className="right td-mono" style={{ color: 'var(--orange)' }}>{b.sixes}</td>
                  <td className="right td-mono">{b.strikeRate?.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="extras-row">
                <td colSpan={2}>Extras</td>
                <td className="right td-mono" colSpan={5}>{extras}</td>
              </tr>
              <tr className="total-row">
                <td colSpan={2} style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 15 }}>
                  Total — {innings.wickets || 0} wkts, {innings.overs} overs
                </td>
                <td className="right" colSpan={5} style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 20, color: 'var(--accent)' }}>
                  {total}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Bowling */}
        {innings.bowling?.length > 0 && (
          <>
            <div className="sc-bowling-label">Bowling</div>
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
                      <td className="right td-mono" style={{ color: b.wickets >= 3 ? 'var(--green)' : 'var(--text-1)', fontWeight: b.wickets >= 3 ? 700 : 400 }}>
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
    );
  };

  return (
    <div className="pub-page">
      {/* Page hero */}
      <div className="pub-page-hero">
        <div className="pub-page-hero-inner">
          <div>
            <h1 className="pub-page-title">Official Scorecard</h1>
            <p className="pub-page-sub">{match.team1Name} vs {match.team2Name}</p>
          </div>
          <Link to="/fixtures" className="btn btn-ghost btn-sm" style={{ color: 'rgba(255,255,255,0.85)', borderColor: 'rgba(255,255,255,0.3)' }}>
            ← All Fixtures
          </Link>
        </div>
      </div>

      <div className="pd-body">
        {/* Match summary card */}
        <div className="pd-card sc-match-card">
          <div className="sc-match-meta">
            <span className={`badge badge-${match.status.toLowerCase()}`}>{match.status}</span>
            <span className="sc-match-num">Match #{match.matchNumber}</span>
            {match.venue && <span className="sc-match-venue">📍 {match.venue}</span>}
          </div>

          <div className="sc-scoreboard">
            <div className="sc-team-block">
              <div className="sc-team-name">{match.team1Name}</div>
              <div className="sc-team-score">
                {match.team1Score ?? '—'}
                {match.team1Wickets != null && <span className="sc-team-wkts">/{match.team1Wickets}</span>}
              </div>
              <div className="sc-team-overs">
                {match.team1Overs > 0 ? `(${match.team1Overs} overs)` : 'Yet to bat'}
              </div>
              {match.team1Score > 0 && match.team1Overs > 0 && (
                <div className="sc-team-rr">RR: {(match.team1Score / match.team1Overs).toFixed(2)}</div>
              )}
            </div>

            <div className="sc-vs">VS</div>

            <div className="sc-team-block">
              <div className="sc-team-name">{match.team2Name}</div>
              <div className="sc-team-score">
                {match.team2Score ?? '—'}
                {match.team2Wickets != null && <span className="sc-team-wkts">/{match.team2Wickets}</span>}
              </div>
              <div className="sc-team-overs">
                {match.team2Overs > 0 ? `(${match.team2Overs} overs)` : 'Yet to bat'}
              </div>
              {match.team2Score > 0 && match.team2Overs > 0 && (
                <div className="sc-team-rr">RR: {(match.team2Score / match.team2Overs).toFixed(2)}</div>
              )}
            </div>
          </div>

          {match.result && (
            <div className="sc-result-banner">🏆 {match.result}</div>
          )}

          <div className="sc-match-extra-row">
            {match.tossWinnerName && (
              <span className="sc-toss">🪙 {match.tossWinnerName} won toss &amp; elected to {match.tossDecision === 'BAT' ? 'bat' : 'bowl'}</span>
            )}
            {match.playerOfMatchName && (
              <span className="sc-pom">⭐ Player of the Match: <strong>{match.playerOfMatchName}</strong></span>
            )}
          </div>
        </div>

        {/* Innings */}
        {i1 && <InningsBatting innings={i1} teamName={match.team1Name} />}
        {i2 && <InningsBatting innings={i2} teamName={match.team2Name} />}

        {!i1 && !i2 && (
          <div className="pd-card pd-empty" style={{ minHeight: 200 }}>
            <div className="pd-empty-icon">📋</div>
            <div className="pd-empty-title">No scorecard data yet</div>
            <div className="pd-empty-sub">Performance records will appear once innings data is entered</div>
          </div>
        )}

        <footer className="pd-footer">
          <div className="pd-footer-inner">
            <img src="/urumari_logo.png" alt="Urumari" className="pd-footer-logo" />
            <div className="pd-footer-org">
              <div className="pd-footer-org-label">Organised by</div>
              <div className="pd-footer-org-name">Tamil Students' Association<br />University of Kelaniya</div>
            </div>
            <div className="pd-footer-divider" />
            <div className="pd-footer-bottom">© {new Date().getFullYear()} · All rights reserved</div>
          </div>
        </footer>
      </div>
    </div>
  );
}
