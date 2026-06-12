package com.cricket.tournament.config;

import com.cricket.tournament.model.*;
import com.cricket.tournament.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Component
@Profile("dev")
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final TournamentRepository tournamentRepository;
    private final TeamRepository teamRepository;
    private final PlayerRepository playerRepository;
    private final MatchRepository matchRepository;

    @Override
    public void run(String... args) {
        // Only seed if database is empty
        if (tournamentRepository.count() > 0) return;

        // Create a sample tournament
        Tournament t = new Tournament();
        t.setName("IPL 2025");
        t.setLocation("India");
        t.setStartDate(LocalDate.of(2025, 3, 22));
        t.setEndDate(LocalDate.of(2025, 5, 26));
        t.setStatus(Tournament.TournamentStatus.ONGOING);
        t = tournamentRepository.save(t);

        // Create teams
        Team csk = createTeam("Chennai Super Kings", "CSK", "#FDB913", t);
        Team mi = createTeam("Mumbai Indians", "MI", "#004BA0", t);
        Team rcb = createTeam("Royal Challengers Bangalore", "RCB", "#EC1C24", t);
        Team kkr = createTeam("Kolkata Knight Riders", "KKR", "#3A225D", t);

        // Create players for CSK
        createPlayer("MS Dhoni", Player.PlayerRole.WICKET_KEEPER, "7", csk);
        createPlayer("Ruturaj Gaikwad", Player.PlayerRole.BATSMAN, "31", csk);
        createPlayer("Ravindra Jadeja", Player.PlayerRole.ALL_ROUNDER, "8", csk);
        createPlayer("Deepak Chahar", Player.PlayerRole.BOWLER, "90", csk);
        createPlayer("Devon Conway", Player.PlayerRole.BATSMAN, "5", csk);

        // Create players for MI
        createPlayer("Rohit Sharma", Player.PlayerRole.BATSMAN, "45", mi);
        createPlayer("Hardik Pandya", Player.PlayerRole.ALL_ROUNDER, "228", mi);
        createPlayer("Jasprit Bumrah", Player.PlayerRole.BOWLER, "93", mi);
        createPlayer("Suryakumar Yadav", Player.PlayerRole.BATSMAN, "63", mi);
        createPlayer("Ishan Kishan", Player.PlayerRole.WICKET_KEEPER, "32", mi);

        // Create players for RCB
        createPlayer("Virat Kohli", Player.PlayerRole.BATSMAN, "18", rcb);
        createPlayer("Faf du Plessis", Player.PlayerRole.BATSMAN, "13", rcb);
        createPlayer("Glenn Maxwell", Player.PlayerRole.ALL_ROUNDER, "32", rcb);
        createPlayer("Mohammed Siraj", Player.PlayerRole.BOWLER, "73", rcb);
        createPlayer("Dinesh Karthik", Player.PlayerRole.WICKET_KEEPER, "1", rcb);

        // Create players for KKR
        createPlayer("Shreyas Iyer", Player.PlayerRole.BATSMAN, "41", kkr);
        createPlayer("Andre Russell", Player.PlayerRole.ALL_ROUNDER, "12", kkr);
        createPlayer("Sunil Narine", Player.PlayerRole.ALL_ROUNDER, "11", kkr);
        createPlayer("Pat Cummins", Player.PlayerRole.BOWLER, "30", kkr);
        createPlayer("Rinku Singh", Player.PlayerRole.BATSMAN, "83", kkr);

        // Create sample matches
        Match m1 = new Match();
        m1.setMatchNumber("Match 1");
        m1.setVenue("MA Chidambaram Stadium, Chennai");
        m1.setMatchDateTime(LocalDateTime.of(2025, 3, 22, 19, 30));
        m1.setTournament(t);
        m1.setTeam1(csk);
        m1.setTeam2(mi);
        m1.setOvers(20);
        m1.setStatus(Match.MatchStatus.SCHEDULED);
        matchRepository.save(m1);

        Match m2 = new Match();
        m2.setMatchNumber("Match 2");
        m2.setVenue("M. Chinnaswamy Stadium, Bangalore");
        m2.setMatchDateTime(LocalDateTime.of(2025, 3, 23, 19, 30));
        m2.setTournament(t);
        m2.setTeam1(rcb);
        m2.setTeam2(kkr);
        m2.setOvers(20);
        m2.setStatus(Match.MatchStatus.SCHEDULED);
        matchRepository.save(m2);
    }

    private Team createTeam(String name, String shortName, String color, Tournament tournament) {
        Team team = new Team();
        team.setName(name);
        team.setShortName(shortName);
        team.setLogoColor(color);
        team.setTournament(tournament);
        return teamRepository.save(team);
    }

    private Player createPlayer(String name, Player.PlayerRole role, String jersey, Team team) {
        Player p = new Player();
        p.setName(name);
        p.setRole(role);
        p.setJerseyNumber(jersey);
        p.setTeam(team);
        return playerRepository.save(p);
    }
}
