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
public class TournamentService {

    private final TournamentRepository tournamentRepository;
    private final TeamRepository teamRepository;
    private final MatchRepository matchRepository;

    public List<TournamentResponse> getAllTournaments() {
        return tournamentRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public TournamentResponse getTournament(Long id) {
        return toResponse(tournamentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tournament not found: " + id)));
    }

    @Transactional
    public TournamentResponse createTournament(TournamentRequest request) {
        Tournament t = new Tournament();
        t.setName(request.getName());
        t.setLocation(request.getLocation());
        t.setStartDate(request.getStartDate());
        t.setEndDate(request.getEndDate());
        t.setStatus(Tournament.TournamentStatus.UPCOMING);
        return toResponse(tournamentRepository.save(t));
    }

    @Transactional
    public TournamentResponse updateTournament(Long id, TournamentRequest request) {
        Tournament t = tournamentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tournament not found: " + id));
        t.setName(request.getName());
        t.setLocation(request.getLocation());
        t.setStartDate(request.getStartDate());
        t.setEndDate(request.getEndDate());
        return toResponse(tournamentRepository.save(t));
    }

    @Transactional
    public TournamentResponse updateStatus(Long id, Tournament.TournamentStatus status) {
        Tournament t = tournamentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tournament not found: " + id));
        t.setStatus(status);
        return toResponse(tournamentRepository.save(t));
    }

    public void deleteTournament(Long id) {
        tournamentRepository.deleteById(id);
    }

    public TournamentResponse toResponse(Tournament t) {
        TournamentResponse r = new TournamentResponse();
        r.setId(t.getId());
        r.setName(t.getName());
        r.setLocation(t.getLocation());
        r.setStartDate(t.getStartDate());
        r.setEndDate(t.getEndDate());
        r.setStatus(t.getStatus());
        r.setTeamCount(teamRepository.findByTournamentId(t.getId()).size());
        r.setMatchCount(matchRepository.findByTournamentIdOrderByMatchDateTimeAsc(t.getId()).size());
        return r;
    }
}
