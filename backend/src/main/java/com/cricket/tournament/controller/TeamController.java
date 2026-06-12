package com.cricket.tournament.controller;

import com.cricket.tournament.dto.DTOs.*;
import com.cricket.tournament.service.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TeamController {

    private final TeamService teamService;

    @GetMapping("/tournament/{tournamentId}")
    public ResponseEntity<List<TeamResponse>> getByTournament(@PathVariable Long tournamentId) {
        return ResponseEntity.ok(teamService.getTeamsByTournament(tournamentId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TeamResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(teamService.getTeam(id));
    }

    @PostMapping
    public ResponseEntity<TeamResponse> create(@RequestBody TeamRequest request) {
        return ResponseEntity.ok(teamService.createTeam(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TeamResponse> update(@PathVariable Long id,
                                                @RequestBody TeamRequest request) {
        return ResponseEntity.ok(teamService.updateTeam(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        teamService.deleteTeam(id);
        return ResponseEntity.noContent().build();
    }
}
