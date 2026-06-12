package com.cricket.tournament.service;

import com.cricket.tournament.dto.DTOs.*;
import com.cricket.tournament.model.*;
import com.cricket.tournament.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository teamRepository;
    private final TournamentRepository tournamentRepository;
    private final PlayerRepository playerRepository;

    public List<TeamResponse> getTeamsByTournament(Long tournamentId) {
        return teamRepository.findByTournamentId(tournamentId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public TeamResponse getTeam(Long id) {
        return toResponse(teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Team not found: " + id)));
    }

    @Transactional
    public TeamResponse createTeam(TeamRequest request) {
        Tournament tournament = tournamentRepository.findById(request.getTournamentId())
                .orElseThrow(() -> new RuntimeException("Tournament not found"));
        Team team = new Team();
        team.setName(request.getName());
        team.setShortName(request.getShortName());
        team.setLogoColor(request.getLogoColor());
        team.setLogoUrl(request.getLogoUrl());
        team.setTournament(tournament);
        return toResponse(teamRepository.save(team));
    }

    @Transactional
    public TeamResponse updateTeam(Long id, TeamRequest request) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Team not found: " + id));
        team.setName(request.getName());
        team.setShortName(request.getShortName());
        team.setLogoColor(request.getLogoColor());
        team.setLogoUrl(request.getLogoUrl());
        return toResponse(teamRepository.save(team));
    }

    public void deleteTeam(Long id) {
        teamRepository.deleteById(id);
    }

    public TeamResponse toResponse(Team t) {
        TeamResponse r = new TeamResponse();
        r.setId(t.getId());
        r.setName(t.getName());
        r.setShortName(t.getShortName());
        r.setLogoColor(t.getLogoColor());
        r.setLogoUrl(t.getLogoUrl());
        r.setTournamentId(t.getTournament() != null ? t.getTournament().getId() : null);
        r.setMatchesPlayed(t.getMatchesPlayed());
        r.setMatchesWon(t.getMatchesWon());
        r.setMatchesLost(t.getMatchesLost());
        r.setMatchesTied(t.getMatchesTied());
        r.setPoints(t.getPoints());
        r.setNetRunRate(t.getNetRunRate());
        r.setPlayerCount(playerRepository.findByTeamId(t.getId()).size());
        return r;
    }
}
