package com.cricket.tournament.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "matches")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String matchNumber;
    private String venue;
    private LocalDateTime matchDateTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournament_id")
    private Tournament tournament;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team1_id")
    private Team team1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team2_id")
    private Team team2;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "toss_winner_id")
    private Team tossWinner;

    private String tossDecision; // BAT or BOWL

    @Enumerated(EnumType.STRING)
    private MatchStatus status = MatchStatus.SCHEDULED;

    private int overs = 3;

    // Use Integer (nullable) so frontend can detect "yet to bat" (null vs 0)
    private Integer team1Score;
    private int team1Wickets = 0;
    private double team1Overs = 0.0;

    private Integer team2Score;
    private int team2Wickets = 0;
    private double team2Overs = 0.0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "winner_id")
    private Team winner;

    private String result;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_of_match_id")
    private Player playerOfMatch;

    @OneToMany(mappedBy = "match", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<BattingPerformance> battingPerformances;

    @OneToMany(mappedBy = "match", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<BowlingPerformance> bowlingPerformances;

    public enum MatchStatus {
        SCHEDULED, LIVE, COMPLETED, CANCELLED
    }
}
