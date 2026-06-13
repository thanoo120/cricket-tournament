package com.cricket.tournament.service;

import com.cricket.tournament.dto.DTOs.*;
import com.cricket.tournament.model.*;
import com.cricket.tournament.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MatchService {

    private final MatchRepository matchRepository;
    private final TournamentRepository tournamentRepository;
    private final TeamRepository teamRepository;
    private final PlayerRepository playerRepository;
    private final BattingPerformanceRepository battingRepo;
    private final BowlingPerformanceRepository bowlingRepo;
    private final BallRepository ballRepository;
    private final TeamService teamService;
    private final PlayerService playerService;
    private final SseService sseService;

    public List<MatchResponse> getMatchesByTournament(Long tournamentId) {
        return matchRepository.findByTournamentIdOrderByMatchDateTimeAsc(tournamentId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public MatchResponse getMatch(Long id) {
        return toResponse(matchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Match not found: " + id)));
    }

    @Transactional
    public MatchResponse createMatch(MatchRequest request) {
        Tournament tournament = tournamentRepository.findById(request.getTournamentId())
                .orElseThrow(() -> new RuntimeException("Tournament not found"));
        Team team1 = teamRepository.findById(request.getTeam1Id())
                .orElseThrow(() -> new RuntimeException("Team1 not found"));
        Team team2 = teamRepository.findById(request.getTeam2Id())
                .orElseThrow(() -> new RuntimeException("Team2 not found"));

        Match match = new Match();
        match.setMatchNumber(request.getMatchNumber());
        match.setVenue(request.getVenue());
        match.setMatchDateTime(request.getMatchDateTime());
        match.setTournament(tournament);
        match.setTeam1(team1);
        match.setTeam2(team2);
        match.setOvers(request.getOvers() > 0 ? request.getOvers() : 3);
        match.setStatus(Match.MatchStatus.SCHEDULED);
        return toResponse(matchRepository.save(match));
    }

    @Transactional
    public MatchResponse updateScore(Long matchId, ScoreUpdateRequest request) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found: " + matchId));

        // Capture original status before any mutation so updatePointsTable can guard against double-counting
        Match.MatchStatus originalStatus = match.getStatus();

        if (request.getTeam() != null) {
            if ("team1".equals(request.getTeam())) {
                match.setTeam1Score(request.getScore());
                match.setTeam1Wickets(request.getWickets());
                match.setTeam1Overs(request.getOvers());
            } else if ("team2".equals(request.getTeam())) {
                match.setTeam2Score(request.getScore());
                match.setTeam2Wickets(request.getWickets());
                match.setTeam2Overs(request.getOvers());
            }
        }

        if (request.getTossWinnerId() != null) {
            teamRepository.findById(request.getTossWinnerId()).ifPresent(match::setTossWinner);
        }
        if (request.getTossDecision() != null) {
            match.setTossDecision(request.getTossDecision());
        }
        if (request.getStatus() != null) {
            try {
                match.setStatus(Match.MatchStatus.valueOf(request.getStatus()));
            } catch (IllegalArgumentException ignored) {}
        }
        if (request.getResult() != null && !request.getResult().isEmpty()) {
            match.setResult(request.getResult());
        }
        if (request.getWinnerId() != null) {
            Team winner = teamRepository.findById(request.getWinnerId())
                    .orElseThrow(() -> new RuntimeException("Winner team not found"));
            match.setWinner(winner);
            updatePointsTable(match, winner, originalStatus);
            updateNetRunRates(match);
        }
        if (request.getPlayerOfMatchId() != null) {
            playerRepository.findById(request.getPlayerOfMatchId()).ifPresent(match::setPlayerOfMatch);
        }

        MatchResponse saved = toResponse(matchRepository.save(match));
        sseService.broadcast(matchId, saved);
        return saved;
    }

    @Transactional
    public BallResponse recordBall(BallRequest request) {
        Match match = matchRepository.findById(request.getMatchId())
                .orElseThrow(() -> new RuntimeException("Match not found"));

        Ball ball = new Ball();
        ball.setMatch(match);
        ball.setInningsType(request.getInningsType());
        ball.setOverNumber(request.getOverNumber());
        ball.setBallNumber(request.getBallNumber());
        ball.setRuns(request.getRuns());
        ball.setDot(request.isDot());
        ball.setWicket(request.isWicket());
        ball.setWide(request.isWide());
        ball.setNoBall(request.isNoBall());
        ball.setFour(request.isFour());
        ball.setSix(request.isSix());
        ball.setLegBye(request.isLegBye());
        // Note: BallRequest uses non-is prefix fields; Ball entity uses isDot etc.
        ball.setRecordedAt(LocalDateTime.now());

        if (request.getBatsmanId() != null) {
            playerRepository.findById(request.getBatsmanId()).ifPresent(ball::setBatsman);
        }
        if (request.getBowlerId() != null) {
            playerRepository.findById(request.getBowlerId()).ifPresent(ball::setBowler);
        }

        ballRepository.save(ball);

        // Update match score automatically
        boolean isFirstInnings = "FIRST".equals(request.getInningsType());
        int extraRuns = (request.isWide() || request.isNoBall()) ? 1 : 0;
        int totalRuns = request.getRuns() + extraRuns;

        if (isFirstInnings) {
            match.setTeam1Score((match.getTeam1Score() != null ? match.getTeam1Score() : 0) + totalRuns);
            if (request.isWicket()) match.setTeam1Wickets(Math.min(match.getTeam1Wickets() + 1, 10));
            if (!request.isWide() && !request.isNoBall()) {
                match.setTeam1Overs(advanceOvers(match.getTeam1Overs()));
            }
        } else {
            match.setTeam2Score((match.getTeam2Score() != null ? match.getTeam2Score() : 0) + totalRuns);
            if (request.isWicket()) match.setTeam2Wickets(Math.min(match.getTeam2Wickets() + 1, 10));
            if (!request.isWide() && !request.isNoBall()) {
                match.setTeam2Overs(advanceOvers(match.getTeam2Overs()));
            }
        }

        Match saved = matchRepository.save(match);

        BallResponse resp = new BallResponse();
        resp.setId(ball.getId());
        resp.setMatchId(match.getId());
        resp.setInningsType(request.getInningsType());
        resp.setOverNumber(request.getOverNumber());
        resp.setBallNumber(request.getBallNumber());
        resp.setRuns(request.getRuns());
        resp.setDot(request.isDot());
        resp.setWicket(request.isWicket());
        resp.setWide(request.isWide());
        resp.setNoBall(request.isNoBall());
        resp.setFour(request.isFour());
        resp.setSix(request.isSix());
        resp.setLegBye(request.isLegBye());
        if (ball.getBatsman() != null) { resp.setBatsmanId(ball.getBatsman().getId()); resp.setBatsmanName(ball.getBatsman().getName()); }
        if (ball.getBowler() != null) { resp.setBowlerId(ball.getBowler().getId()); resp.setBowlerName(ball.getBowler().getName()); }
        resp.setMatchTeam1Score(saved.getTeam1Score());
        resp.setMatchTeam1Wickets(saved.getTeam1Wickets());
        resp.setMatchTeam1Overs(saved.getTeam1Overs());
        resp.setMatchTeam2Score(saved.getTeam2Score());
        resp.setMatchTeam2Wickets(saved.getTeam2Wickets());
        resp.setMatchTeam2Overs(saved.getTeam2Overs());

        sseService.broadcast(match.getId(), resp);
        return resp;
    }

    public List<BallResponse> getBalls(Long matchId, String inningsType) {
        List<Ball> balls = inningsType != null
                ? ballRepository.findByMatchIdAndInningsTypeOrderByOverNumberAscBallNumberAsc(matchId, inningsType)
                : ballRepository.findByMatchIdOrderByOverNumberAscBallNumberAsc(matchId);
        return balls.stream().map(b -> {
            BallResponse r = new BallResponse();
            r.setId(b.getId());
            r.setMatchId(matchId);
            r.setInningsType(b.getInningsType());
            r.setOverNumber(b.getOverNumber());
            r.setBallNumber(b.getBallNumber());
            r.setRuns(b.getRuns());
            r.setDot(b.isDot());
            r.setWicket(b.isWicket());
            r.setWide(b.isWide());
            r.setNoBall(b.isNoBall());
            r.setFour(b.isFour());
            r.setSix(b.isSix());
            r.setLegBye(b.isLegBye());
            if (b.getBatsman() != null) { r.setBatsmanId(b.getBatsman().getId()); r.setBatsmanName(b.getBatsman().getName()); }
            if (b.getBowler() != null) { r.setBowlerId(b.getBowler().getId()); r.setBowlerName(b.getBowler().getName()); }
            return r;
        }).collect(Collectors.toList());
    }

    @Transactional
    public void deleteMatch(Long matchId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found: " + matchId));
        ballRepository.deleteByMatchId(matchId);
        battingRepo.deleteByMatchId(matchId);
        bowlingRepo.deleteByMatchId(matchId);
        matchRepository.delete(match);
    }

    @Transactional
    public MatchResponse undoLastBall(Long matchId, String inningsType) {
        Ball last = ballRepository.findTopByMatchIdAndInningsTypeOrderByIdDesc(matchId, inningsType)
                .orElseThrow(() -> new RuntimeException("No balls recorded for this innings"));

        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        boolean isFirst = "FIRST".equals(inningsType);
        int extraPenalty = (last.isWide() || last.isNoBall()) ? 1 : 0;
        int totalRuns = last.getRuns() + extraPenalty;

        if (isFirst) {
            match.setTeam1Score(Math.max(0, (match.getTeam1Score() != null ? match.getTeam1Score() : 0) - totalRuns));
            if (last.isWicket()) match.setTeam1Wickets(Math.max(0, match.getTeam1Wickets() - 1));
            if (!last.isWide() && !last.isNoBall())
                match.setTeam1Overs(reverseOvers(match.getTeam1Overs()));
        } else {
            match.setTeam2Score(Math.max(0, (match.getTeam2Score() != null ? match.getTeam2Score() : 0) - totalRuns));
            if (last.isWicket()) match.setTeam2Wickets(Math.max(0, match.getTeam2Wickets() - 1));
            if (!last.isWide() && !last.isNoBall())
                match.setTeam2Overs(reverseOvers(match.getTeam2Overs()));
        }

        ballRepository.delete(last);
        Match saved = matchRepository.save(match);
        MatchResponse resp = toResponse(saved);
        sseService.broadcast(matchId, resp);
        return resp;
    }

    private double advanceOvers(double current) {
        int wholePart = (int) current;
        int balls = (int) Math.round((current - wholePart) * 10);
        balls++;
        if (balls >= 6) { wholePart++; balls = 0; }
        return Math.round((wholePart + balls / 10.0) * 10.0) / 10.0;
    }

    private double reverseOvers(double current) {
        int wholePart = (int) current;
        int balls = (int) Math.round((current - wholePart) * 10);
        balls--;
        if (balls < 0) { wholePart--; balls = 5; }
        if (wholePart < 0) return 0.0;
        return Math.round((wholePart + balls / 10.0) * 10.0) / 10.0;
    }

    private void updatePointsTable(Match match, Team winner, Match.MatchStatus originalStatus) {
        Team t1 = match.getTeam1();
        Team t2 = match.getTeam2();

        // Only increment matchesPlayed if the match wasn't already completed before this update
        if (originalStatus != Match.MatchStatus.COMPLETED) {
            t1.setMatchesPlayed(t1.getMatchesPlayed() + 1);
            t2.setMatchesPlayed(t2.getMatchesPlayed() + 1);
        }

        if (winner.getId().equals(t1.getId())) {
            t1.setMatchesWon(t1.getMatchesWon() + 1);
            t1.setPoints(t1.getPoints() + 2);
            t2.setMatchesLost(t2.getMatchesLost() + 1);
        } else {
            t2.setMatchesWon(t2.getMatchesWon() + 1);
            t2.setPoints(t2.getPoints() + 2);
            t1.setMatchesLost(t1.getMatchesLost() + 1);
        }
        teamRepository.save(t1);
        teamRepository.save(t2);
    }

    /**
     * NRR = (total runs scored / total overs faced) - (total runs conceded / total overs bowled)
     * Recalculate NRR for both teams from ALL completed matches in the tournament.
     */
    private void updateNetRunRates(Match match) {
        Long tournamentId = match.getTournament().getId();
        List<Match> completed = matchRepository.findByTournamentIdAndStatus(
                tournamentId, Match.MatchStatus.COMPLETED);
        List<Team> teams = teamRepository.findByTournamentId(tournamentId);

        for (Team team : teams) {
            double runsScored = 0, oversPlayed = 0, runsConceded = 0, oversFaced = 0;

            for (Match m : completed) {
                if (m.getTeam1() != null && m.getTeam1().getId().equals(team.getId())) {
                    runsScored  += (m.getTeam1Score() != null ? m.getTeam1Score() : 0);
                    oversPlayed += m.getTeam1Overs();
                    runsConceded += (m.getTeam2Score() != null ? m.getTeam2Score() : 0);
                    oversFaced  += m.getTeam2Overs();
                } else if (m.getTeam2() != null && m.getTeam2().getId().equals(team.getId())) {
                    runsScored  += (m.getTeam2Score() != null ? m.getTeam2Score() : 0);
                    oversPlayed += m.getTeam2Overs();
                    runsConceded += (m.getTeam1Score() != null ? m.getTeam1Score() : 0);
                    oversFaced  += m.getTeam1Overs();
                }
            }

            double nrr = 0;
            if (oversPlayed > 0 && oversFaced > 0) {
                nrr = (runsScored / oversPlayed) - (runsConceded / oversFaced);
                nrr = Math.round(nrr * 1000.0) / 1000.0;
            }
            team.setNetRunRate(nrr);
            teamRepository.save(team);
        }
    }

    @Transactional
    public BattingPerformanceResponse addBattingPerformance(BattingPerformanceRequest request) {
        Match match = matchRepository.findById(request.getMatchId())
                .orElseThrow(() -> new RuntimeException("Match not found"));
        Player player = playerRepository.findById(request.getPlayerId())
                .orElseThrow(() -> new RuntimeException("Player not found"));

        // Team is the player's own team
        Team team = player.getTeam();

        BattingPerformance bp = new BattingPerformance();
        bp.setMatch(match);
        bp.setPlayer(player);
        bp.setTeam(team);
        bp.setRuns(request.getRuns());
        bp.setBalls(request.getBalls());
        bp.setFours(request.getFours());
        bp.setSixes(request.getSixes());
        bp.setOut(request.isOut());
        bp.setDismissalType(request.getDismissalType());
        bp.setBattingOrder(request.getBattingOrder());
        bp.setInningsType(request.getInningsType());
        battingRepo.save(bp);

        // Update cumulative player stats
        player.setTotalRuns(player.getTotalRuns() + request.getRuns());
        player.setTotalBallsFaced(player.getTotalBallsFaced() + request.getBalls());
        player.setTotalFours(player.getTotalFours() + request.getFours());
        player.setTotalSixes(player.getTotalSixes() + request.getSixes());
        player.setInningsBatted(player.getInningsBatted() + 1);
        if (!request.isOut()) player.setNotOuts(player.getNotOuts() + 1);
        if (request.getRuns() > player.getHighestScore()) player.setHighestScore(request.getRuns());
        if (request.getRuns() >= 100) player.setHundreds(player.getHundreds() + 1);
        else if (request.getRuns() >= 50) player.setFifties(player.getFifties() + 1);
        playerRepository.save(player);

        return toBattingResponse(bp);
    }

    @Transactional
    public BowlingPerformanceResponse addBowlingPerformance(BowlingPerformanceRequest request) {
        Match match = matchRepository.findById(request.getMatchId())
                .orElseThrow(() -> new RuntimeException("Match not found"));
        Player player = playerRepository.findById(request.getPlayerId())
                .orElseThrow(() -> new RuntimeException("Player not found"));

        Team team = player.getTeam();

        BowlingPerformance bp = new BowlingPerformance();
        bp.setMatch(match);
        bp.setPlayer(player);
        bp.setTeam(team);
        bp.setOvers(request.getOvers());
        bp.setMaidens(request.getMaidens());
        bp.setRunsConceded(request.getRunsConceded());
        bp.setWickets(request.getWickets());
        bp.setWides(request.getWides());
        bp.setNoBalls(request.getNoBalls());
        bp.setInningsType(request.getInningsType());
        bowlingRepo.save(bp);

        // Update cumulative bowling stats
        player.setTotalWickets(player.getTotalWickets() + request.getWickets());
        player.setTotalOversBowled((int)(player.getTotalOversBowled() + request.getOvers()));
        player.setTotalRunsConceded(player.getTotalRunsConceded() + request.getRunsConceded());
        if (request.getWickets() >= 5) player.setFiveWicketHauls(player.getFiveWicketHauls() + 1);
        if (request.getWickets() > player.getBestBowlingWickets() ||
                (request.getWickets() == player.getBestBowlingWickets() &&
                        request.getRunsConceded() < player.getBestBowlingRuns())) {
            player.setBestBowlingWickets(request.getWickets());
            player.setBestBowlingRuns(request.getRunsConceded());
        }
        playerRepository.save(player);

        return toBowlingResponse(bp);
    }

    public ScorecardResponse getScorecard(Long matchId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found: " + matchId));

        List<BattingPerformanceResponse> bat1 = battingRepo.findByMatchIdAndInningsType(matchId, "FIRST")
                .stream().map(this::toBattingResponse).collect(Collectors.toList());
        List<BowlingPerformanceResponse> bowl1 = bowlingRepo.findByMatchIdAndInningsType(matchId, "FIRST")
                .stream().map(this::toBowlingResponse).collect(Collectors.toList());
        List<BattingPerformanceResponse> bat2 = battingRepo.findByMatchIdAndInningsType(matchId, "SECOND")
                .stream().map(this::toBattingResponse).collect(Collectors.toList());
        List<BowlingPerformanceResponse> bowl2 = bowlingRepo.findByMatchIdAndInningsType(matchId, "SECOND")
                .stream().map(this::toBowlingResponse).collect(Collectors.toList());

        List<Ball> balls1 = ballRepository.findByMatchIdAndInningsTypeOrderByOverNumberAscBallNumberAsc(matchId, "FIRST");
        List<Ball> balls2 = ballRepository.findByMatchIdAndInningsTypeOrderByOverNumberAscBallNumberAsc(matchId, "SECOND");
        int extras1 = balls1.stream().mapToInt(b -> {
            int e = 0;
            if (b.isWide() || b.isNoBall()) e += 1;
            if (b.isLegBye()) e += b.getRuns();
            return e;
        }).sum();
        int extras2 = balls2.stream().mapToInt(b -> {
            int e = 0;
            if (b.isWide() || b.isNoBall()) e += 1;
            if (b.isLegBye()) e += b.getRuns();
            return e;
        }).sum();

        InningsData first = null, second = null;

        if (!bat1.isEmpty() || !bowl1.isEmpty()) {
            first = new InningsData();
            first.setTeam(match.getTeam1() != null ? match.getTeam1().getName() : "");
            first.setTotal(match.getTeam1Score());
            first.setWickets(match.getTeam1Wickets());
            first.setOvers(match.getTeam1Overs());
            first.setExtras(extras1);
            first.setBatting(bat1);
            first.setBowling(bowl1);
        }

        if (!bat2.isEmpty() || !bowl2.isEmpty()) {
            second = new InningsData();
            second.setTeam(match.getTeam2() != null ? match.getTeam2().getName() : "");
            second.setTotal(match.getTeam2Score());
            second.setWickets(match.getTeam2Wickets());
            second.setOvers(match.getTeam2Overs());
            second.setExtras(extras2);
            second.setBatting(bat2);
            second.setBowling(bowl2);
        }

        ScorecardResponse sc = new ScorecardResponse();
        sc.setMatch(toResponse(match));
        sc.setFirstInnings(first);
        sc.setSecondInnings(second);
        return sc;
    }

    public TournamentStatsResponse getTournamentStats(Long tournamentId) {
        List<Match> matches = matchRepository.findByTournamentIdOrderByMatchDateTimeAsc(tournamentId);
        List<Player> batsmen = playerRepository.findTopBatsmenByTournament(tournamentId);
        List<Player> bowlers = playerRepository.findTopBowlersByTournament(tournamentId);

        TournamentStatsResponse stats = new TournamentStatsResponse();
        stats.setTotalMatches(matches.size());
        stats.setCompletedMatches((int) matches.stream()
                .filter(m -> m.getStatus() == Match.MatchStatus.COMPLETED).count());
        stats.setLiveMatches((int) matches.stream()
                .filter(m -> m.getStatus() == Match.MatchStatus.LIVE).count());

        int totalRuns = matches.stream()
                .mapToInt(m -> (m.getTeam1Score() != null ? m.getTeam1Score() : 0)
                        + (m.getTeam2Score() != null ? m.getTeam2Score() : 0))
                .sum();
        stats.setTotalRuns(totalRuns);

        if (!batsmen.isEmpty()) stats.setTopScorer(playerService.toResponse(batsmen.get(0)));
        if (!bowlers.isEmpty()) stats.setTopWicketTaker(playerService.toResponse(bowlers.get(0)));

        return stats;
    }

    /**
     * Flat MatchResponse — no nested objects, all fields the frontend needs directly.
     */
    public MatchResponse toResponse(Match m) {
        MatchResponse r = new MatchResponse();
        r.setId(m.getId());
        r.setMatchNumber(m.getMatchNumber());
        r.setVenue(m.getVenue());
        r.setMatchDateTime(m.getMatchDateTime());
        r.setTournamentId(m.getTournament() != null ? m.getTournament().getId() : null);

        if (m.getTeam1() != null) {
            r.setTeam1Id(m.getTeam1().getId());
            r.setTeam1Name(m.getTeam1().getName());
            r.setTeam1ShortName(m.getTeam1().getShortName());
            r.setTeam1Color(m.getTeam1().getLogoColor());
        }
        if (m.getTeam2() != null) {
            r.setTeam2Id(m.getTeam2().getId());
            r.setTeam2Name(m.getTeam2().getName());
            r.setTeam2ShortName(m.getTeam2().getShortName());
            r.setTeam2Color(m.getTeam2().getLogoColor());
        }

        if (m.getTossWinner() != null) {
            r.setTossWinnerId(m.getTossWinner().getId());
            r.setTossWinnerName(m.getTossWinner().getName());
        }
        r.setTossDecision(m.getTossDecision());
        r.setStatus(m.getStatus());
        r.setOvers(m.getOvers());

        r.setTeam1Score(m.getTeam1Score());
        r.setTeam1Wickets(m.getTeam1Wickets());
        r.setTeam1Overs(m.getTeam1Overs());
        r.setTeam2Score(m.getTeam2Score());
        r.setTeam2Wickets(m.getTeam2Wickets());
        r.setTeam2Overs(m.getTeam2Overs());

        if (m.getWinner() != null) {
            r.setWinnerId(m.getWinner().getId());
            r.setWinnerName(m.getWinner().getName());
        }
        r.setResult(m.getResult());
        if (m.getPlayerOfMatch() != null) {
            r.setPlayerOfMatchId(m.getPlayerOfMatch().getId());
            r.setPlayerOfMatchName(m.getPlayerOfMatch().getName());
        }
        return r;
    }

    private BattingPerformanceResponse toBattingResponse(BattingPerformance bp) {
        BattingPerformanceResponse r = new BattingPerformanceResponse();
        r.setId(bp.getId());
        r.setPlayerId(bp.getPlayer().getId());
        r.setPlayerName(bp.getPlayer().getName());
        r.setTeamName(bp.getTeam() != null ? bp.getTeam().getName() : "");
        r.setRuns(bp.getRuns());
        r.setBalls(bp.getBalls());
        r.setFours(bp.getFours());
        r.setSixes(bp.getSixes());
        r.setOut(bp.isOut());
        r.setDismissalType(bp.getDismissalType());
        r.setStrikeRate(bp.getStrikeRate());
        r.setBattingOrder(bp.getBattingOrder());
        r.setInningsType(bp.getInningsType());
        return r;
    }

    private BowlingPerformanceResponse toBowlingResponse(BowlingPerformance bp) {
        BowlingPerformanceResponse r = new BowlingPerformanceResponse();
        r.setId(bp.getId());
        r.setPlayerId(bp.getPlayer().getId());
        r.setPlayerName(bp.getPlayer().getName());
        r.setTeamName(bp.getTeam() != null ? bp.getTeam().getName() : "");
        r.setOvers(bp.getOvers());
        r.setMaidens(bp.getMaidens());
        r.setRunsConceded(bp.getRunsConceded());
        r.setWickets(bp.getWickets());
        r.setWides(bp.getWides());
        r.setNoBalls(bp.getNoBalls());
        r.setEconomy(bp.getEconomy());
        r.setInningsType(bp.getInningsType());
        return r;
    }
}
