package com.cricket.tournament.controller;

import com.cricket.tournament.dto.DTOs.*;
import com.cricket.tournament.model.Tournament;
import com.cricket.tournament.service.TournamentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tournaments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TournamentController {

    private final TournamentService tournamentService;

    @GetMapping
    public ResponseEntity<List<TournamentResponse>> getAll() {
        return ResponseEntity.ok(tournamentService.getAllTournaments());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TournamentResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(tournamentService.getTournament(id));
    }

    @PostMapping
    public ResponseEntity<TournamentResponse> create(@RequestBody TournamentRequest request) {
        return ResponseEntity.ok(tournamentService.createTournament(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TournamentResponse> update(@PathVariable Long id,
                                                      @RequestBody TournamentRequest request) {
        return ResponseEntity.ok(tournamentService.updateTournament(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<TournamentResponse> updateStatus(@PathVariable Long id,
                                                            @RequestParam Tournament.TournamentStatus status) {
        return ResponseEntity.ok(tournamentService.updateStatus(id, status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        tournamentService.deleteTournament(id);
        return ResponseEntity.noContent().build();
    }
}
