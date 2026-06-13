package com.cricket.tournament.repository;

import com.cricket.tournament.model.BattingPerformance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BattingPerformanceRepository extends JpaRepository<BattingPerformance, Long> {
    List<BattingPerformance> findByMatchId(Long matchId);
    List<BattingPerformance> findByMatchIdAndInningsType(Long matchId, String inningsType);
    Optional<BattingPerformance> findByMatchIdAndPlayerIdAndInningsType(Long matchId, Long playerId, String inningsType);
    List<BattingPerformance> findByPlayerId(Long playerId);
    void deleteByMatchId(Long matchId);
}
