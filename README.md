# 🏏 CricManager — Cricket Tournament Management System

A full-stack cricket tournament management platform built with **Spring Boot** (backend) and **React** (frontend).  
Supports live scoring, dual role-based dashboards, NRR calculations, fixtures, detailed scorecards, and player statistics.

---

## 📁 Folder Structure

```
cricket-tournament/
│
├── README.md
│
├── backend/                          ← Spring Boot 3.2 application
│   ├── pom.xml
│   └── src/main/java/com/cricket/tournament/
│       ├── TournamentApplication.java          ← Main entry point
│       │
│       ├── model/                              ← JPA Entities
│       │   ├── Tournament.java
│       │   ├── Team.java
│       │   ├── Player.java
│       │   ├── Match.java
│       │   ├── BattingPerformance.java
│       │   └── BowlingPerformance.java
│       │
│       ├── dto/
│       │   └── DTOs.java                       ← All request/response DTOs
│       │
│       ├── repository/                         ← Spring Data JPA repos
│       │   ├── TournamentRepository.java
│       │   ├── TeamRepository.java
│       │   ├── PlayerRepository.java
│       │   ├── MatchRepository.java
│       │   ├── BattingPerformanceRepository.java
│       │   └── BowlingPerformanceRepository.java
│       │
│       ├── service/                            ← Business logic
│       │   ├── TournamentService.java
│       │   ├── TeamService.java
│       │   ├── PlayerService.java
│       │   └── MatchService.java               ← NRR calc, scorecards, stats
│       │
│       ├── controller/                         ← REST API endpoints
│       │   ├── TournamentController.java       ← /api/tournaments
│       │   ├── TeamController.java             ← /api/teams
│       │   ├── PlayerController.java           ← /api/players
│       │   └── MatchController.java            ← /api/matches
│       │
│       └── config/
│           ├── DataInitializer.java            ← Seeds IPL 2025 sample data
│           └── WebConfig.java                  ← CORS config
│
└── frontend/                         ← React 18 application
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js                            ← React root
        ├── App.js                              ← Router — public + admin routes
        ├── App.css                             ← Full design system (1164 lines)
        │
        ├── context/
        │   └── AuthContext.js                  ← Auth state, login/logout, roles
        │
        ├── components/
        │   ├── Layout.js                       ← Dual sidebar (public / admin)
        │   └── ProtectedRoute.js               ← Route guard (isAuthenticated, isAdmin)
        │
        ├── pages/
        │   ├── Login.js                        ← Auth page (Admin/Scorer tabs)
        │   ├── PublicDashboard.js              ← Public: live scores, top scorers
        │   ├── AdminDashboard.js               ← Admin: tournament table, quick actions
        │   ├── Fixtures.js                     ← All fixtures grouped by date
        │   ├── LiveScoring.js                  ← Live scoring pad + performance entry
        │   ├── Matches.js                      ← Admin match list + schedule modal
        │   ├── Tournaments.js                  ← Tournament CRUD (admin only)
        │   ├── TournamentDetail.js             ← Tournament overview + nav cards
        │   ├── Teams.js                        ← Team cards with NRR + squad link
        │   ├── Players.js                      ← Squad list + batting/bowling stats
        │   ├── Leaderboard.js                  ← Points table + NRR + batting/bowling
        │   └── Scorecard.js                    ← Official match scorecard
        │
        └── services/
            └── api.js                          ← All Axios API calls
```

---

## 🚀 Running the Project

### 1. Backend (Spring Boot)
```bash
cd backend
# Requires Java 17+ and Maven 3.8+
mvn spring-boot:run
# Starts at: http://localhost:8080
# H2 Console: http://localhost:8080/h2-console
# Auto-seeds: IPL 2025 with 4 teams, 20 players, 2 scheduled matches
```

### 2. Frontend (React)
```bash
cd frontend
npm install
npm start
# Starts at: http://localhost:3000
# Proxies API calls to localhost:8080
```

---

## 🔐 Security & Roles

| Role    | Username | Password      | Can Do                                          |
|---------|----------|---------------|-------------------------------------------------|
| Public  | —        | —             | View dashboard, fixtures, scorecards, standings |
| Scorer  | scorer   | scorer@2025   | Score matches, update innings, manage fixtures  |
| Admin   | admin    | cricket@2025  | Everything + create/delete tournaments & teams  |

### Route Protection
| Route pattern              | Access            |
|----------------------------|-------------------|
| `/dashboard`, `/fixtures`  | Public (no login) |
| `/tournaments/:id/*`       | Public (no login) |
| `/matches/:id/scorecard`   | Public (no login) |
| `/admin/dashboard`         | Scorer + Admin    |
| `/admin/tournaments/:id/*` | Scorer + Admin    |
| `/admin/matches/:id/score` | Scorer + Admin    |
| `/admin/tournaments`       | Admin only        |

---

## 📡 REST API Reference

### Tournaments
| Method | Endpoint                        | Description              |
|--------|---------------------------------|--------------------------|
| GET    | /api/tournaments                | List all tournaments     |
| GET    | /api/tournaments/{id}           | Get tournament by ID     |
| POST   | /api/tournaments                | Create tournament        |
| PUT    | /api/tournaments/{id}           | Update tournament        |
| PATCH  | /api/tournaments/{id}/status    | Update status            |
| DELETE | /api/tournaments/{id}           | Delete tournament        |

### Teams
| Method | Endpoint                        | Description              |
|--------|---------------------------------|--------------------------|
| GET    | /api/teams/tournament/{id}      | Get teams in tournament  |
| GET    | /api/teams/{id}                 | Get team by ID           |
| POST   | /api/teams                      | Create team              |
| PUT    | /api/teams/{id}                 | Update team              |
| DELETE | /api/teams/{id}                 | Delete team              |

### Players
| Method | Endpoint                                        | Description                  |
|--------|-------------------------------------------------|------------------------------|
| GET    | /api/players/team/{teamId}                      | Get players in team          |
| GET    | /api/players/{id}                               | Get player by ID             |
| POST   | /api/players                                    | Create player                |
| PUT    | /api/players/{id}                               | Update player                |
| DELETE | /api/players/{id}                               | Delete player                |
| GET    | /api/players/tournament/{id}/top-batsmen        | Top run scorers              |
| GET    | /api/players/tournament/{id}/top-bowlers        | Top wicket takers            |

### Matches
| Method | Endpoint                                | Description                     |
|--------|-----------------------------------------|---------------------------------|
| GET    | /api/matches/tournament/{id}            | Get all matches in tournament   |
| GET    | /api/matches/{id}                       | Get match by ID                 |
| POST   | /api/matches                            | Schedule match                  |
| PATCH  | /api/matches/{id}/score                 | Update score / status / result  |
| GET    | /api/matches/{id}/scorecard             | Full scorecard with innings     |
| POST   | /api/matches/batting-performance        | Add batting record              |
| POST   | /api/matches/bowling-performance        | Add bowling record              |
| GET    | /api/matches/tournament/{id}/stats      | Tournament aggregate stats      |

---

## ⚡ Live Scoring Flow

1. Admin schedules a match → status: `SCHEDULED`
2. Scorer clicks **▶ Start** → status changes to `LIVE`
3. Scorer clicks **Score Live** → opens `/admin/matches/:id/score`
4. Use Quick Score buttons: **0, 1, 2, 3, 4 (FOUR), 6 (SIX), W (OUT), Wide +1, No Ball +1**
5. Use **Add Batting Record** and **Add Bowling Record** for per-player detail
6. When innings complete, use **Update Score** to set final totals, winner, toss, Player of the Match → status: `COMPLETED`
7. NRR auto-recalculates for both teams when match is completed

---

## 📊 Statistics Calculated

| Metric | Formula |
|--------|---------|
| NRR | (Runs Scored ÷ Overs Faced) − (Runs Conceded ÷ Overs Bowled) |
| Batting Avg | Runs ÷ (Innings − Not Outs) |
| Strike Rate | (Runs ÷ Balls) × 100 |
| Bowling Avg | Runs Conceded ÷ Wickets |
| Economy Rate | Runs Conceded ÷ Overs |
| Required RR | Runs Needed ÷ Remaining Overs |

---

## 🎨 Design System

- **Palette**: Navy (#04080f → #152545), Gold (#d4a017, #f0c040), Green (#00c853), Red (#ff3b3b), Blue (#2979ff)
- **Typography**: Rajdhani (headings/scores), Inter (body), JetBrains Mono (stats/numbers)
- **Live badge**: Pulsing red animation for live matches
- **Responsive**: Works on desktop, tablet, and mobile
