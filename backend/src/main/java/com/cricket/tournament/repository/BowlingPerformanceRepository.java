package com.cricket.tournament.repository;

import com.cricket.tournament.model.BowlingPerformance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BowlingPerformanceRepository extends JpaRepository<BowlingPerformance, Long> {
    List<BowlingPerformance> findByMatchId(Long matchId);
    List<BowlingPerformance> findByMatchIdAndInningsType(Long matchId, String inningsType);
    Optional<BowlingPerformance> findByMatchIdAndPlayerIdAndInningsType(Long matchId, Long playerId, String inningsType);
    List<BowlingPerformance> findByPlayerId(Long playerId);
    void deleteByMatchId(Long matchId);
}
