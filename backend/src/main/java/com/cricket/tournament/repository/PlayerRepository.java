package com.cricket.tournament.repository;

import com.cricket.tournament.model.Player;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PlayerRepository extends JpaRepository<Player, Long> {
    List<Player> findByTeamId(Long teamId);

    @Query("SELECT p FROM Player p WHERE p.team.tournament.id = :tournamentId ORDER BY p.totalRuns DESC")
    List<Player> findTopBatsmenByTournament(Long tournamentId);

    @Query("SELECT p FROM Player p WHERE p.team.tournament.id = :tournamentId ORDER BY p.totalWickets DESC")
    List<Player> findTopBowlersByTournament(Long tournamentId);
}
