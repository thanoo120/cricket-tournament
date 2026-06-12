package com.cricket.tournament.controller;

import com.cricket.tournament.dto.DTOs.*;
import com.cricket.tournament.service.PlayerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/players")
@RequiredArgsConstructor
public class PlayerController {

    private final PlayerService playerService;

    @GetMapping("/team/{teamId}")
    public ResponseEntity<List<PlayerResponse>> getByTeam(@PathVariable Long teamId) {
        return ResponseEntity.ok(playerService.getPlayersByTeam(teamId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlayerResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(playerService.getPlayer(id));
    }

    @GetMapping("/tournament/{tournamentId}/top-batsmen")
    public ResponseEntity<List<PlayerResponse>> getTopBatsmen(@PathVariable Long tournamentId) {
        return ResponseEntity.ok(playerService.getTopBatsmen(tournamentId));
    }

    @GetMapping("/tournament/{tournamentId}/top-bowlers")
    public ResponseEntity<List<PlayerResponse>> getTopBowlers(@PathVariable Long tournamentId) {
        return ResponseEntity.ok(playerService.getTopBowlers(tournamentId));
    }

    @PostMapping
    public ResponseEntity<PlayerResponse> create(@RequestBody PlayerRequest request) {
        return ResponseEntity.ok(playerService.createPlayer(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PlayerResponse> update(@PathVariable Long id,
                                                  @RequestBody PlayerRequest request) {
        return ResponseEntity.ok(playerService.updatePlayer(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        playerService.deletePlayer(id);
        return ResponseEntity.noContent().build();
    }
}
