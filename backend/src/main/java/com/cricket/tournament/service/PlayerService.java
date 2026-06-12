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
public class PlayerService {

    private final PlayerRepository playerRepository;
    private final TeamRepository teamRepository;

    public List<PlayerResponse> getPlayersByTeam(Long teamId) {
        return playerRepository.findByTeamId(teamId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public PlayerResponse getPlayer(Long id) {
        return toResponse(playerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Player not found: " + id)));
    }

    public List<PlayerResponse> getTopBatsmen(Long tournamentId) {
        return playerRepository.findTopBatsmenByTournament(tournamentId).stream()
                .limit(20)
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<PlayerResponse> getTopBowlers(Long tournamentId) {
        return playerRepository.findTopBowlersByTournament(tournamentId).stream()
                .limit(20)
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public PlayerResponse createPlayer(PlayerRequest request) {
        Team team = teamRepository.findById(request.getTeamId())
                .orElseThrow(() -> new RuntimeException("Team not found"));
        Player p = new Player();
        p.setName(request.getName());
        p.setRole(request.getRole());
        p.setJerseyNumber(request.getJerseyNumber());
        p.setPhotoUrl(request.getPhotoUrl());
        p.setTeam(team);
        return toResponse(playerRepository.save(p));
    }

    @Transactional
    public PlayerResponse updatePlayer(Long id, PlayerRequest request) {
        Player p = playerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Player not found: " + id));
        p.setName(request.getName());
        p.setRole(request.getRole());
        p.setJerseyNumber(request.getJerseyNumber());
        p.setPhotoUrl(request.getPhotoUrl());
        return toResponse(playerRepository.save(p));
    }

    public void deletePlayer(Long id) {
        playerRepository.deleteById(id);
    }

    public PlayerResponse toResponse(Player p) {
        PlayerResponse r = new PlayerResponse();
        r.setId(p.getId());
        r.setName(p.getName());
        r.setRole(p.getRole());
        r.setJerseyNumber(p.getJerseyNumber());
        r.setPhotoUrl(p.getPhotoUrl());
        r.setTeamId(p.getTeam() != null ? p.getTeam().getId() : null);
        r.setTeamName(p.getTeam() != null ? p.getTeam().getName() : null);
        r.setTeamShortName(p.getTeam() != null ? p.getTeam().getShortName() : null);
        // Batting
        r.setTotalRuns(p.getTotalRuns());
        r.setInningsBatted(p.getInningsBatted());
        r.setNotOuts(p.getNotOuts());
        r.setHighestScore(p.getHighestScore());
        r.setBattingAverage(p.getBattingAverage());
        r.setBattingStrikeRate(p.getBattingStrikeRate());
        r.setFifties(p.getFifties());
        r.setHundreds(p.getHundreds());
        r.setTotalFours(p.getTotalFours());
        r.setTotalSixes(p.getTotalSixes());
        // Bowling
        r.setTotalWickets(p.getTotalWickets());
        r.setTotalOversBowled(p.getTotalOversBowled());
        r.setOversBowled(p.getTotalOversBowled());
        r.setTotalRunsConceded(p.getTotalRunsConceded());
        r.setRunsConceded(p.getTotalRunsConceded());
        r.setBowlingAverage(p.getBowlingAverage());
        r.setBowlingEconomy(p.getBowlingEconomy());
        r.setFiveWicketHauls(p.getFiveWicketHauls());
        r.setBestBowling(p.getBestBowlingWickets() + "/" + p.getBestBowlingRuns());
        // Fielding
        r.setCatches(p.getCatches());
        r.setRunOuts(p.getRunOuts());
        r.setStumpings(p.getStumpings());
        return r;
    }
}
