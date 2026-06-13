package com.cricket.tournament.repository;

import com.cricket.tournament.model.Ball;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BallRepository extends JpaRepository<Ball, Long> {
    List<Ball> findByMatchIdAndInningsTypeOrderByOverNumberAscBallNumberAsc(Long matchId, String inningsType);
    List<Ball> findByMatchIdOrderByOverNumberAscBallNumberAsc(Long matchId);
    Optional<Ball> findTopByMatchIdAndInningsTypeOrderByIdDesc(Long matchId, String inningsType);
    void deleteByMatchId(Long matchId);
}
