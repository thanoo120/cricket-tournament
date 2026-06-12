package com.cricket.tournament.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "balls")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Ball {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id", nullable = false)
    private Match match;

    private String inningsType; // FIRST or SECOND

    private int overNumber;  // 1-indexed
    private int ballNumber;  // 1-6

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batsman_id")
    private Player batsman;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bowler_id")
    private Player bowler;

    private int runs;         // runs off the bat
    private boolean isDot;
    private boolean isWicket;
    private boolean isWide;
    private boolean isNoBall;
    private boolean isFour;
    private boolean isSix;
    private boolean isLegBye;

    private LocalDateTime recordedAt = LocalDateTime.now();
}
