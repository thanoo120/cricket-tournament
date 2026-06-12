package com.cricket.tournament.config;

import com.cricket.tournament.model.*;
import com.cricket.tournament.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Production seed — run once to populate the real tournament data.
 *
 * Usage:
 *   java -jar tournament.jar --spring.profiles.active=prod,seed
 *
 * The seed is idempotent: if a tournament already exists it exits immediately.
 */
@Component
@Profile("seed")
@RequiredArgsConstructor
public class TournamentSeeder implements CommandLineRunner {

    private final TournamentRepository tournamentRepository;
    private final TeamRepository teamRepository;
    private final PlayerRepository playerRepository;
    private final MatchRepository matchRepository;

    @Value("${seed.tournament.date:2026-06-13}")
    private String tournamentDateStr;

    @Override
    public void run(String... args) {
        if (tournamentRepository.count() > 0) {
            System.out.println("[Seed] Tournament data already exists — skipping.");
            return;
        }
        LocalDate day = LocalDate.parse(tournamentDateStr);
        seed(tournamentRepository, teamRepository, playerRepository, matchRepository, day);
        System.out.println("[Seed] Urumari tournament seeded successfully.");
    }

    // ── Static helper so DataInitializer (dev profile) can reuse the same logic ──

    static void seed(TournamentRepository tRepo, TeamRepository teamRepo,
                     PlayerRepository playerRepo, MatchRepository matchRepo) {
        seed(tRepo, teamRepo, playerRepo, matchRepo, LocalDate.of(2026, 6, 13));
    }

    static void seed(TournamentRepository tRepo, TeamRepository teamRepo,
                     PlayerRepository playerRepo, MatchRepository matchRepo,
                     LocalDate day) {

        // ── Tournament ────────────────────────────────────────────────────────
        Tournament t = new Tournament();
        t.setName("Urumari Cricket Tournament 2026");
        t.setLocation("Kelaniya, Sri Lanka");
        t.setStartDate(day);
        t.setEndDate(day);
        t.setStatus(Tournament.TournamentStatus.UPCOMING);
        t = tRepo.save(t);

        // ── Group A ───────────────────────────────────────────────────────────
        Team ktt = team("Kelaniya Tamil Titans", "KTT", "#1e3a8a", t, teamRepo);
        Team shk = team("Sharks Squad",           "SHK", "#0891b2", t, teamRepo);
        Team rgs = team("Ragama Strikers",         "RGS", "#ea580c", t, teamRepo);
        Team bbl = team("Beard Bulls",             "BBL", "#dc2626", t, teamRepo);

        // ── Group B ───────────────────────────────────────────────────────────
        Team bot = team("Team Botverse",           "BOT", "#7c3aed", t, teamRepo);
        Team nht = team("No Hitters",              "NHT", "#15803d", t, teamRepo);
        Team rvs = team("Ravana Strikers",         "RVS", "#7f1d1d", t, teamRepo);
        Team chg = team("Challengers",             "CHG", "#b45309", t, teamRepo);

        // ── Group C ───────────────────────────────────────────────────────────
        Team ksk = team("Kelaniya Super King",     "KSK", "#ca8a04", t, teamRepo);
        Team ttk = team("Tamil Titanic Kelani",    "TTK", "#1d4ed8", t, teamRepo);
        Team krp = team("Team Karuppu",            "KRP", "#374151", t, teamRepo);

        // ── Venue ─────────────────────────────────────────────────────────────
        final String VENUE = "Urumari Cricket Ground, Kelaniya";
        final int OVERS = 3;

        // ── Group Stage Matches (15 matches from schedule) ────────────────────
        //  Match  Group  Team 1                  vs  Team 2               Start
        match(t, "1",  "Group A", shk, ktt, day.atTime( 8,  0), VENUE, OVERS, matchRepo);
        match(t, "2",  "Group A", bbl, rgs, day.atTime( 8, 20), VENUE, OVERS, matchRepo);
        match(t, "3",  "Group B", rvs, chg, day.atTime( 8, 40), VENUE, OVERS, matchRepo);
        match(t, "4",  "Group A", shk, bbl, day.atTime( 9,  0), VENUE, OVERS, matchRepo);
        match(t, "5",  "Group B", nht, chg, day.atTime( 9, 20), VENUE, OVERS, matchRepo);
        match(t, "6",  "Group C", krp, ttk, day.atTime( 9, 40), VENUE, OVERS, matchRepo);
        match(t, "7",  "Group B", bot, rvs, day.atTime(10,  0), VENUE, OVERS, matchRepo);
        match(t, "8",  "Group A", ktt, rgs, day.atTime(10, 20), VENUE, OVERS, matchRepo);
        match(t, "9",  "Group B", nht, rvs, day.atTime(10, 40), VENUE, OVERS, matchRepo);
        match(t, "10", "Group B", bot, chg, day.atTime(11,  0), VENUE, OVERS, matchRepo);
        match(t, "11", "Group A", shk, rgs, day.atTime(11, 20), VENUE, OVERS, matchRepo);
        match(t, "12", "Group A", bbl, ktt, day.atTime(11, 40), VENUE, OVERS, matchRepo);
        match(t, "13", "Group B", bot, nht, day.atTime(12,  0), VENUE, OVERS, matchRepo);
        match(t, "14", "Group C", ksk, krp, day.atTime(12, 20), VENUE, OVERS, matchRepo);
        match(t, "15", "Group C", ksk, ttk, day.atTime(12, 40), VENUE, OVERS, matchRepo);

        // ── Players (add squad members here as they are confirmed) ────────────
        // Group A — Kelaniya Tamil Titans
        player("Player 1",  Player.PlayerRole.BATSMAN,        "1",  ktt, playerRepo);
        player("Player 2",  Player.PlayerRole.BOWLER,         "2",  ktt, playerRepo);
        player("Player 3",  Player.PlayerRole.ALL_ROUNDER,    "3",  ktt, playerRepo);
        player("Player 4",  Player.PlayerRole.WICKET_KEEPER,  "4",  ktt, playerRepo);
        player("Player 5",  Player.PlayerRole.BATSMAN,        "5",  ktt, playerRepo);

        // Group A — Sharks Squad
        player("Player 1",  Player.PlayerRole.BATSMAN,        "1",  shk, playerRepo);
        player("Player 2",  Player.PlayerRole.BOWLER,         "2",  shk, playerRepo);
        player("Player 3",  Player.PlayerRole.ALL_ROUNDER,    "3",  shk, playerRepo);
        player("Player 4",  Player.PlayerRole.WICKET_KEEPER,  "4",  shk, playerRepo);
        player("Player 5",  Player.PlayerRole.BATSMAN,        "5",  shk, playerRepo);

        // Group A — Ragama Strikers
        player("Player 1",  Player.PlayerRole.BATSMAN,        "1",  rgs, playerRepo);
        player("Player 2",  Player.PlayerRole.BOWLER,         "2",  rgs, playerRepo);
        player("Player 3",  Player.PlayerRole.ALL_ROUNDER,    "3",  rgs, playerRepo);
        player("Player 4",  Player.PlayerRole.WICKET_KEEPER,  "4",  rgs, playerRepo);
        player("Player 5",  Player.PlayerRole.BATSMAN,        "5",  rgs, playerRepo);

        // Group A — Beard Bulls
        player("Player 1",  Player.PlayerRole.BATSMAN,        "1",  bbl, playerRepo);
        player("Player 2",  Player.PlayerRole.BOWLER,         "2",  bbl, playerRepo);
        player("Player 3",  Player.PlayerRole.ALL_ROUNDER,    "3",  bbl, playerRepo);
        player("Player 4",  Player.PlayerRole.WICKET_KEEPER,  "4",  bbl, playerRepo);
        player("Player 5",  Player.PlayerRole.BATSMAN,        "5",  bbl, playerRepo);

        // Group B — Team Botverse
        player("Player 1",  Player.PlayerRole.BATSMAN,        "1",  bot, playerRepo);
        player("Player 2",  Player.PlayerRole.BOWLER,         "2",  bot, playerRepo);
        player("Player 3",  Player.PlayerRole.ALL_ROUNDER,    "3",  bot, playerRepo);
        player("Player 4",  Player.PlayerRole.WICKET_KEEPER,  "4",  bot, playerRepo);
        player("Player 5",  Player.PlayerRole.BATSMAN,        "5",  bot, playerRepo);

        // Group B — No Hitters
        player("Player 1",  Player.PlayerRole.BATSMAN,        "1",  nht, playerRepo);
        player("Player 2",  Player.PlayerRole.BOWLER,         "2",  nht, playerRepo);
        player("Player 3",  Player.PlayerRole.ALL_ROUNDER,    "3",  nht, playerRepo);
        player("Player 4",  Player.PlayerRole.WICKET_KEEPER,  "4",  nht, playerRepo);
        player("Player 5",  Player.PlayerRole.BATSMAN,        "5",  nht, playerRepo);

        // Group B — Ravana Strikers
        player("Player 1",  Player.PlayerRole.BATSMAN,        "1",  rvs, playerRepo);
        player("Player 2",  Player.PlayerRole.BOWLER,         "2",  rvs, playerRepo);
        player("Player 3",  Player.PlayerRole.ALL_ROUNDER,    "3",  rvs, playerRepo);
        player("Player 4",  Player.PlayerRole.WICKET_KEEPER,  "4",  rvs, playerRepo);
        player("Player 5",  Player.PlayerRole.BATSMAN,        "5",  rvs, playerRepo);

        // Group B — Challengers
        player("Player 1",  Player.PlayerRole.BATSMAN,        "1",  chg, playerRepo);
        player("Player 2",  Player.PlayerRole.BOWLER,         "2",  chg, playerRepo);
        player("Player 3",  Player.PlayerRole.ALL_ROUNDER,    "3",  chg, playerRepo);
        player("Player 4",  Player.PlayerRole.WICKET_KEEPER,  "4",  chg, playerRepo);
        player("Player 5",  Player.PlayerRole.BATSMAN,        "5",  chg, playerRepo);

        // Group C — Kelaniya Super King
        player("Player 1",  Player.PlayerRole.BATSMAN,        "1",  ksk, playerRepo);
        player("Player 2",  Player.PlayerRole.BOWLER,         "2",  ksk, playerRepo);
        player("Player 3",  Player.PlayerRole.ALL_ROUNDER,    "3",  ksk, playerRepo);
        player("Player 4",  Player.PlayerRole.WICKET_KEEPER,  "4",  ksk, playerRepo);
        player("Player 5",  Player.PlayerRole.BATSMAN,        "5",  ksk, playerRepo);

        // Group C — Tamil Titanic Kelani
        player("Player 1",  Player.PlayerRole.BATSMAN,        "1",  ttk, playerRepo);
        player("Player 2",  Player.PlayerRole.BOWLER,         "2",  ttk, playerRepo);
        player("Player 3",  Player.PlayerRole.ALL_ROUNDER,    "3",  ttk, playerRepo);
        player("Player 4",  Player.PlayerRole.WICKET_KEEPER,  "4",  ttk, playerRepo);
        player("Player 5",  Player.PlayerRole.BATSMAN,        "5",  ttk, playerRepo);

        // Group C — Team Karuppu
        player("Player 1",  Player.PlayerRole.BATSMAN,        "1",  krp, playerRepo);
        player("Player 2",  Player.PlayerRole.BOWLER,         "2",  krp, playerRepo);
        player("Player 3",  Player.PlayerRole.ALL_ROUNDER,    "3",  krp, playerRepo);
        player("Player 4",  Player.PlayerRole.WICKET_KEEPER,  "4",  krp, playerRepo);
        player("Player 5",  Player.PlayerRole.BATSMAN,        "5",  krp, playerRepo);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static Team team(String name, String shortName, String color,
                             Tournament t, TeamRepository repo) {
        Team team = new Team();
        team.setName(name);
        team.setShortName(shortName);
        team.setLogoColor(color);
        team.setTournament(t);
        return repo.save(team);
    }

    private static void match(Tournament t, String number, String group,
                              Team team1, Team team2,
                              LocalDateTime dateTime, String venue,
                              int overs, MatchRepository repo) {
        Match m = new Match();
        m.setMatchNumber(number);
        m.setVenue(group + " · " + venue);
        m.setMatchDateTime(dateTime);
        m.setTournament(t);
        m.setTeam1(team1);
        m.setTeam2(team2);
        m.setOvers(overs);
        m.setStatus(Match.MatchStatus.SCHEDULED);
        repo.save(m);
    }

    private static void player(String name, Player.PlayerRole role,
                               String jersey, Team team, PlayerRepository repo) {
        Player p = new Player();
        p.setName(name);
        p.setRole(role);
        p.setJerseyNumber(jersey);
        p.setTeam(team);
        repo.save(p);
    }
}
