package com.cricket.tournament.controller;

import com.cricket.tournament.dto.DTOs.*;
import com.cricket.tournament.service.MatchService;
import com.cricket.tournament.service.SseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
public class MatchController {

    private final MatchService matchService;
    private final SseService sseService;

    @GetMapping("/tournament/{tournamentId}")
    public ResponseEntity<List<MatchResponse>> getByTournament(@PathVariable Long tournamentId) {
        return ResponseEntity.ok(matchService.getMatchesByTournament(tournamentId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MatchResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(matchService.getMatch(id));
    }

    @PostMapping
    public ResponseEntity<MatchResponse> create(@RequestBody MatchRequest request) {
        return ResponseEntity.ok(matchService.createMatch(request));
    }

    @PatchMapping("/{id}/score")
    public ResponseEntity<MatchResponse> updateScore(@PathVariable Long id,
                                                      @RequestBody ScoreUpdateRequest request) {
        return ResponseEntity.ok(matchService.updateScore(id, request));
    }

    @GetMapping("/{id}/scorecard")
    public ResponseEntity<ScorecardResponse> getScorecard(@PathVariable Long id) {
        return ResponseEntity.ok(matchService.getScorecard(id));
    }

    @PostMapping("/batting-performance")
    public ResponseEntity<BattingPerformanceResponse> addBatting(
            @RequestBody BattingPerformanceRequest request) {
        return ResponseEntity.ok(matchService.addBattingPerformance(request));
    }

    @PostMapping("/bowling-performance")
    public ResponseEntity<BowlingPerformanceResponse> addBowling(
            @RequestBody BowlingPerformanceRequest request) {
        return ResponseEntity.ok(matchService.addBowlingPerformance(request));
    }

    @GetMapping("/tournament/{tournamentId}/stats")
    public ResponseEntity<TournamentStatsResponse> getTournamentStats(@PathVariable Long tournamentId) {
        return ResponseEntity.ok(matchService.getTournamentStats(tournamentId));
    }

    @PostMapping("/balls")
    public ResponseEntity<BallResponse> recordBall(@RequestBody BallRequest request) {
        return ResponseEntity.ok(matchService.recordBall(request));
    }

    @GetMapping("/{id}/balls")
    public ResponseEntity<List<BallResponse>> getBalls(@PathVariable Long id,
                                                        @RequestParam(required = false) String inningsType) {
        return ResponseEntity.ok(matchService.getBalls(id, inningsType));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMatch(@PathVariable Long id) {
        matchService.deleteMatch(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/balls/last")
    public ResponseEntity<MatchResponse> undoLastBall(
            @PathVariable Long id,
            @RequestParam String inningsType) {
        return ResponseEntity.ok(matchService.undoLastBall(id, inningsType));
    }

    @GetMapping(value = "/{id}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@PathVariable Long id) {
        return sseService.subscribe(id);
    }
}
