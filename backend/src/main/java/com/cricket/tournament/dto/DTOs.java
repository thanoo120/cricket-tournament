package com.cricket.tournament.dto;

import com.cricket.tournament.model.*;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class DTOs {

    // ======================== TOURNAMENT ========================

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class TournamentRequest {
        private String name;
        private String location;
        private LocalDate startDate;
        private LocalDate endDate;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class TournamentResponse {
        private Long id;
        private String name;
        private String location;
        private LocalDate startDate;
        private LocalDate endDate;
        private Tournament.TournamentStatus status;
        // Frontend uses teamCount and matchCount
        private int teamCount;
        private int matchCount;
    }

    // ======================== TEAM ========================

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class TeamRequest {
        private String name;
        private String shortName;
        private String logoColor;
        private String logoUrl;
        private Long tournamentId;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class TeamResponse {
        private Long id;
        private String name;
        private String shortName;
        private String logoColor;
        private String logoUrl;
        private Long tournamentId;
        private int matchesPlayed;
        private int matchesWon;
        private int matchesLost;
        private int matchesTied;
        private int points;
        private double netRunRate;
        private int playerCount;
        // NRR detail fields
        private int runsScored;
        private double oversPlayed;
        private int runsConceded;
        private double oversFaced;
    }

    // ======================== PLAYER ========================

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class PlayerRequest {
        private String name;
        private Player.PlayerRole role;
        private String jerseyNumber;
        private String photoUrl;
        private Long teamId;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class PlayerResponse {
        private Long id;
        private String name;
        private Player.PlayerRole role;
        private String jerseyNumber;
        private String photoUrl;
        private Long teamId;
        private String teamName;
        private String teamShortName;
        // Batting
        private int totalRuns;
        private int inningsBatted;
        private int notOuts;
        private int highestScore;
        private double battingAverage;
        private double battingStrikeRate;
        private int fifties;
        private int hundreds;
        private int totalFours;
        private int totalSixes;
        // Bowling
        private int totalWickets;
        private int totalOversBowled;
        private double oversBowled;
        private int totalRunsConceded;
        private int runsConceded;
        private int maidens;
        private double bowlingAverage;
        private double bowlingEconomy;
        private int fiveWicketHauls;
        private String bestBowling;
        private int inningsBowled;
        // Fielding
        private int catches;
        private int runOuts;
        private int stumpings;
    }

    // ======================== MATCH ========================

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class MatchRequest {
        private String matchNumber;
        private String venue;
        private LocalDateTime matchDateTime;
        private Long tournamentId;
        private Long team1Id;
        private Long team2Id;
        private int overs;
    }

    /**
     * Flat MatchResponse — the frontend accesses fields like match.team1Name,
     * match.team1Id, match.tossWinnerName, etc. (not nested objects)
     */
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class MatchResponse {
        private Long id;
        private String matchNumber;
        private String venue;
        private LocalDateTime matchDateTime;
        private Long tournamentId;
        // Team 1 flattened
        private Long team1Id;
        private String team1Name;
        private String team1ShortName;
        private String team1Color;
        // Team 2 flattened
        private Long team2Id;
        private String team2Name;
        private String team2ShortName;
        private String team2Color;
        // Toss
        private Long tossWinnerId;
        private String tossWinnerName;
        private String tossDecision;
        // Match state
        private Match.MatchStatus status;
        private int overs;
        // Scores
        private Integer team1Score;
        private int team1Wickets;
        private double team1Overs;
        private Integer team2Score;
        private int team2Wickets;
        private double team2Overs;
        // Result
        private Long winnerId;
        private String winnerName;
        private String result;
        private Long playerOfMatchId;
        private String playerOfMatchName;
    }

    // ======================== SCORE UPDATE ========================

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class ScoreUpdateRequest {
        private String team;           // "team1" or "team2"
        private int score;
        private int wickets;
        private double overs;
        private String status;         // String so frontend can pass "LIVE" etc.
        private Long tossWinnerId;     // Now Long not String
        private String tossDecision;
        private Long winnerId;
        private String result;
        private Long playerOfMatchId;
    }

    // ======================== SCORECARD ========================

    /**
     * ScorecardResponse structured the way the frontend reads it:
     * sc.firstInnings.batting, sc.firstInnings.bowling
     */
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class ScorecardResponse {
        private MatchResponse match;
        private InningsData firstInnings;
        private InningsData secondInnings;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class InningsData {
        private String team;
        private Integer total;
        private Integer wickets;
        private Double overs;
        private int extras;
        private List<BattingPerformanceResponse> batting;
        private List<BowlingPerformanceResponse> bowling;
    }

    // ======================== BATTING PERFORMANCE ========================

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class BattingPerformanceRequest {
        private Long matchId;
        private Long playerId;
        private Long teamId;
        private int runs;
        private int balls;
        private int fours;
        private int sixes;
        @JsonProperty("isOut")
        private boolean isOut;
        private String dismissalType;
        private int battingOrder;
        private String inningsType;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class BattingPerformanceResponse {
        private Long id;
        private Long playerId;
        private String playerName;
        private String teamName;
        private int runs;
        private int balls;
        private int fours;
        private int sixes;
        @JsonProperty("isOut")
        private boolean isOut;
        private String dismissalType;
        private double strikeRate;
        private int battingOrder;
        private String inningsType;
    }

    // ======================== BOWLING PERFORMANCE ========================

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class BowlingPerformanceRequest {
        private Long matchId;
        private Long playerId;
        private Long teamId;
        private double overs;
        private int maidens;
        private int runsConceded;
        private int wickets;
        private int wides;
        private int noBalls;
        private String inningsType;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class BowlingPerformanceResponse {
        private Long id;
        private Long playerId;
        private String playerName;
        private String teamName;
        private double overs;
        private int maidens;
        private int runsConceded;
        private int wickets;
        private int wides;
        private int noBalls;
        private double economy;
        private String inningsType;
    }

    // ======================== BALL ========================

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class BallRequest {
        private Long matchId;
        private String inningsType; // FIRST or SECOND
        private int overNumber;
        private int ballNumber;
        private Long batsmanId;
        private Long bowlerId;
        private int runs;
        private boolean dot;
        private boolean wicket;
        private boolean wide;
        private boolean noBall;
        private boolean four;
        private boolean six;
        private boolean legBye;
        private boolean bye;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class BallResponse {
        private Long id;
        private Long matchId;
        private String inningsType;
        private int overNumber;
        private int ballNumber;
        private Long batsmanId;
        private String batsmanName;
        private Long bowlerId;
        private String bowlerName;
        private int runs;
        private boolean dot;
        private boolean wicket;
        private boolean wide;
        private boolean noBall;
        private boolean four;
        private boolean six;
        private boolean legBye;
        private boolean bye;
        // match state after this ball
        private Integer matchTeam1Score;
        private int matchTeam1Wickets;
        private double matchTeam1Overs;
        private Integer matchTeam2Score;
        private int matchTeam2Wickets;
        private double matchTeam2Overs;
    }

    // ======================== TOURNAMENT STATS ========================

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class TournamentStatsResponse {
        private int totalMatches;
        private int completedMatches;
        private int liveMatches;
        private int totalRuns;
        private int totalWickets;
        private int totalSixes;
        private int totalFours;
        private PlayerResponse topScorer;
        private PlayerResponse topWicketTaker;
    }
}
