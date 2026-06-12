package com.cricket.tournament.repository;

import com.cricket.tournament.model.Match;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MatchRepository extends JpaRepository<Match, Long> {
    List<Match> findByTournamentIdOrderByMatchDateTimeAsc(Long tournamentId);
    List<Match> findByTournamentIdAndStatus(Long tournamentId, Match.MatchStatus status);
}
