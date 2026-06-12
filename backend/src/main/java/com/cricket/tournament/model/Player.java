package com.cricket.tournament.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "players")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Player {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    private PlayerRole role;

    private String jerseyNumber;
    private String photoUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;

    // Batting stats
    private int totalRuns = 0;
    private int totalBallsFaced = 0;
    private int totalFours = 0;
    private int totalSixes = 0;
    private int highestScore = 0;
    private int fifties = 0;
    private int hundreds = 0;
    private int inningsBatted = 0;
    private int notOuts = 0;

    // Bowling stats
    private int totalWickets = 0;
    private int totalOversBowled = 0;
    private int totalRunsConceded = 0;
    private int fiveWicketHauls = 0;
    private int bestBowlingWickets = 0;
    private int bestBowlingRuns = 999;

    // Fielding stats
    private int catches = 0;
    private int runOuts = 0;
    private int stumpings = 0;

    public enum PlayerRole {
        BATSMAN, BOWLER, ALL_ROUNDER, WICKET_KEEPER
    }

    public double getBattingAverage() {
        int dismissals = inningsBatted - notOuts;
        if (dismissals == 0) return totalRuns;
        return Math.round((double) totalRuns / dismissals * 100.0) / 100.0;
    }

    public double getBattingStrikeRate() {
        if (totalBallsFaced == 0) return 0;
        return Math.round((double) totalRuns / totalBallsFaced * 10000.0) / 100.0;
    }

    public double getBowlingAverage() {
        if (totalWickets == 0) return 0;
        return Math.round((double) totalRunsConceded / totalWickets * 100.0) / 100.0;
    }

    public double getBowlingEconomy() {
        if (totalOversBowled == 0) return 0;
        return Math.round((double) totalRunsConceded / totalOversBowled * 100.0) / 100.0;
    }
}
