import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTeams, getTopBatsmen, getTopBowlers, getTournament } from '../services/api';


export default function Leaderboard() {
  const { id } = useParams();
  const [teams, setTeams] = useState([]);
  const [batsmen, setBatsmen] = useState([]);
  const [bowlers, setBowlers] = useState([]);
  const [tournament, setTournament] = useState(null);
  const [activeTab, setActiveTab] = useState('points');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getTournament(id),
      getTeams(id),
      getTopBatsmen(id),
      getTopBowlers(id),
    ]).then(([t, te, b, bw]) => {
      setTournament(t.data);
      setTeams([...te.data].sort((a, b) => (b.points ?? 0) - (a.points ?? 0) || (b.netRunRate ?? 0) - (a.netRunRate ?? 0)));
      setBatsmen(b.data);
      setBowlers(bw.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading"><div className="spinner" /><span>Loading standings...</span></div>;

  const qualifyLine = Math.floor(teams.length / 2);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <div>
            <div className="page-header-title">Standings & Stats</div>
            {tournament && <div className="page-header-sub">{tournament.name}</div>}
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="breadcrumb">
          <Link to={`/tournaments/${id}`}>Tournament</Link>
          <span className="breadcrumb-sep">/</span>
          <span>Standings</span>
        </div>

        <div className="tabs">
          <button className={`tab ${activeTab === 'points' ? 'active' : ''}`} onClick={() => setActiveTab('points')}>📊 Points Table</button>
          <button className={`tab ${activeTab === 'batting' ? 'active' : ''}`} onClick={() => setActiveTab('batting')}>🏏 Batting</button>
          <button className={`tab ${activeTab === 'bowling' ? 'active' : ''}`} onClick={() => setActiveTab('bowling')}>🎳 Bowling</button>
        </div>

        {activeTab === 'points' && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <span className="card-title-icon">📊</span>
                Points Table
              </div>
              <div className="highlight-bar" style={{ fontSize: 11, padding: '4px 10px' }}>
                Top {qualifyLine} teams qualify
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>#</th>
                    <th>Team</th>
                    <th className="center">M</th>
                    <th className="center">W</th>
                    <th className="center">L</th>
                    <th className="center">T</th>
                    <th className="center">Pts</th>
                    <th className="right">NRR</th>
                    <th className="right">For</th>
                    <th className="right">Against</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((t, i) => (
                    <tr key={t.id} style={i === qualifyLine - 1 ? { borderBottom: '2px dashed rgba(212,160,23,0.4)' } : {}}>
                      <td>
                        <span className={`rank-cell rank-${i < 3 ? i + 1 : 'other'}`}>{i + 1}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: 'var(--r-sm)',
                            background: t.logoColor || 'var(--gold)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 12, color: '#fff',
                            flexShrink: 0,
                          }}>{t.shortName?.slice(0, 3)}</div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{t.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{t.shortName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="center td-mono">{t.matchesPlayed}</td>
                      <td className="center td-mono" style={{ color: 'var(--green)' }}>{t.matchesWon}</td>
                      <td className="center td-mono" style={{ color: 'var(--red)' }}>{t.matchesLost}</td>
                      <td className="center td-mono">{t.matchesTied || 0}</td>
                      <td className="center">
                        <span style={{
                          fontFamily: 'Rajdhani', fontSize: 18, fontWeight: 700,
                          color: t.points > 0 ? 'var(--gold-light)' : 'var(--text-2)'
                        }}>{t.points}</span>
                      </td>
                      <td className={`right td-mono ${t.netRunRate > 0 ? 'nrr-positive' : t.netRunRate < 0 ? 'nrr-negative' : 'nrr-neutral'}`}>
                        {t.netRunRate > 0 ? '+' : ''}{t.netRunRate?.toFixed(3) || '0.000'}
                      </td>
                      <td className="right td-mono" style={{ color: 'var(--text-2)', fontSize: 12 }}>
                        {t.runsScored != null ? `${t.runsScored}/${t.oversPlayed?.toFixed(1) || 0}` : '-'}
                      </td>
                      <td className="right td-mono" style={{ color: 'var(--text-2)', fontSize: 12 }}>
                        {t.runsConceded != null ? `${t.runsConceded}/${t.oversFaced?.toFixed(1) || 0}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--card-border)', fontSize: 11, color: 'var(--text-3)', display: 'flex', gap: 20 }}>
              <span>NRR = (Runs Scored ÷ Overs Faced) − (Runs Conceded ÷ Overs Bowled)</span>
              <span>W=2pts, T=1pt, L=0pts</span>
            </div>
          </div>
        )}

        {activeTab === 'batting' && (
          <div className="card">
            <div className="card-header">
              <div className="card-title"><span className="card-title-icon">🏏</span>Top Run Scorers</div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>#</th>
                    <th>Player</th>
                    <th className="right">Runs</th>
                    <th className="right">Inn</th>
                    <th className="right">NO</th>
                    <th className="right">HS</th>
                    <th className="right">Avg</th>
                    <th className="right">SR</th>
                    <th className="right">50s</th>
                    <th className="right">100s</th>
                    <th className="right">4s</th>
                    <th className="right">6s</th>
                  </tr>
                </thead>
                <tbody>
                  {batsmen.map((p, i) => (
                    <tr key={p.id}>
                      <td><span className={`rank-cell rank-${i < 3 ? i + 1 : 'other'}`}>{i + 1}</span></td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.teamName} · <span className="role-bat">{p.role}</span></div>
                      </td>
                      <td className="right td-mono" style={{ color: 'var(--gold-light)', fontWeight: 700, fontSize: 15 }}>{p.totalRuns}</td>
                      <td className="right td-mono">{p.inningsBatted}</td>
                      <td className="right td-mono">{p.notOuts}</td>
                      <td className="right td-mono">{p.highestScore}</td>
                      <td className="right td-mono">{p.battingAverage?.toFixed(2) || '-'}</td>
                      <td className="right td-mono">{p.battingStrikeRate?.toFixed(1) || '-'}</td>
                      <td className="right td-mono" style={{ color: 'var(--green)' }}>{p.fifties}</td>
                      <td className="right td-mono" style={{ color: 'var(--gold-light)' }}>{p.hundreds}</td>
                      <td className="right td-mono">{p.totalFours}</td>
                      <td className="right td-mono">{p.totalSixes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {batsmen.length === 0 && <div className="empty-state"><div className="empty-state-icon">🏏</div><p>No batting data recorded yet</p></div>}
          </div>
        )}

        {activeTab === 'bowling' && (
          <div className="card">
            <div className="card-header">
              <div className="card-title"><span className="card-title-icon">🎳</span>Top Wicket Takers</div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>#</th>
                    <th>Player</th>
                    <th className="right">Wkts</th>
                    <th className="right">Inn</th>
                    <th className="right">Overs</th>
                    <th className="right">Runs</th>
                    <th className="right">Avg</th>
                    <th className="right">Eco</th>
                    <th className="right">Best</th>
                    <th className="right">5W</th>
                  </tr>
                </thead>
                <tbody>
                  {bowlers.map((p, i) => (
                    <tr key={p.id}>
                      <td><span className={`rank-cell rank-${i < 3 ? i + 1 : 'other'}`}>{i + 1}</span></td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.teamName} · <span className="role-bowl">{p.role}</span></div>
                      </td>
                      <td className="right td-mono" style={{ color: 'var(--green)', fontWeight: 700, fontSize: 15 }}>{p.totalWickets}</td>
                      <td className="right td-mono">{p.inningsBowled || '-'}</td>
                      <td className="right td-mono">{p.oversBowled?.toFixed(1)}</td>
                      <td className="right td-mono">{p.runsConceded}</td>
                      <td className="right td-mono">{p.bowlingAverage?.toFixed(2) || '-'}</td>
                      <td className="right td-mono">{p.bowlingEconomy?.toFixed(2) || '-'}</td>
                      <td className="right td-mono">{p.bestBowling || '-'}</td>
                      <td className="right td-mono" style={{ color: p.fiveWicketHauls > 0 ? 'var(--gold-light)' : 'inherit' }}>{p.fiveWicketHauls}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {bowlers.length === 0 && <div className="empty-state"><div className="empty-state-icon">🎳</div><p>No bowling data recorded yet</p></div>}
          </div>
        )}
      </div>
    </div>
  );
}
