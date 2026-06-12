import axios from 'axios';

// In development, REACT_APP_API_URL is unset and the CRA proxy handles /api → localhost:8080.
// In production, set REACT_APP_API_URL=https://your-api-domain.com
const BASE_URL = process.env.REACT_APP_API_URL || '';

const API = axios.create({ baseURL: `${BASE_URL}/api` });

// Attach JWT to every request if present
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('cric_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear stored auth and redirect to login
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('cric_token');
      localStorage.removeItem('cric_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ---- Auth ----
export const loginApi = (username, password) =>
  API.post('/auth/login', { username, password });

// ---- Tournaments ----
export const getTournaments = () => API.get('/tournaments');
export const getTournament = (id) => API.get(`/tournaments/${id}`);
export const createTournament = (data) => API.post('/tournaments', data);
export const updateTournament = (id, data) => API.put(`/tournaments/${id}`, data);
export const updateTournamentStatus = (id, status) =>
  API.patch(`/tournaments/${id}/status?status=${status}`);
export const deleteTournament = (id) => API.delete(`/tournaments/${id}`);

// ---- Teams ----
export const getTeams = (tournamentId) => API.get(`/teams/tournament/${tournamentId}`);
export const getTeam = (id) => API.get(`/teams/${id}`);
export const createTeam = (data) => API.post('/teams', data);
export const updateTeam = (id, data) => API.put(`/teams/${id}`, data);
export const deleteTeam = (id) => API.delete(`/teams/${id}`);

// ---- Players ----
export const getPlayers = (teamId) => API.get(`/players/team/${teamId}`);
export const getPlayer = (id) => API.get(`/players/${id}`);
export const createPlayer = (data) => API.post('/players', data);
export const updatePlayer = (id, data) => API.put(`/players/${id}`, data);
export const deletePlayer = (id) => API.delete(`/players/${id}`);
export const getTopBatsmen = (tournamentId) =>
  API.get(`/players/tournament/${tournamentId}/top-batsmen`);
export const getTopBowlers = (tournamentId) =>
  API.get(`/players/tournament/${tournamentId}/top-bowlers`);

// ---- Matches ----
export const getMatches = (tournamentId) => API.get(`/matches/tournament/${tournamentId}`);
export const getMatch = (id) => API.get(`/matches/${id}`);
export const createMatch = (data) => API.post('/matches', data);
export const updateScore = (id, data) => API.patch(`/matches/${id}/score`, data);
export const getScorecard = (id) => API.get(`/matches/${id}/scorecard`);
export const addBattingPerformance = (data) => API.post('/matches/batting-performance', data);
export const addBowlingPerformance = (data) => API.post('/matches/bowling-performance', data);
export const getTournamentStats = (tournamentId) =>
  API.get(`/matches/tournament/${tournamentId}/stats`);
export const recordBall = (data) => API.post('/matches/balls', data);
export const getBalls = (matchId, inningsType) =>
  API.get(`/matches/${matchId}/balls${inningsType ? `?inningsType=${inningsType}` : ''}`);

// SSE — GET endpoint, no auth required; EventSource doesn't support custom headers
export const subscribeToMatch = (matchId, onUpdate) => {
  const url = `${BASE_URL}/api/matches/${matchId}/stream`;
  const es = new EventSource(url);
  es.addEventListener('score-update', (e) => {
    try { onUpdate(JSON.parse(e.data)); } catch {}
  });
  return es;
};
