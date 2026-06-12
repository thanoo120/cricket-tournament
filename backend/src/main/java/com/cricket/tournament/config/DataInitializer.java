package com.cricket.tournament.config;

import com.cricket.tournament.model.AppUser;
import com.cricket.tournament.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Runs on every startup in any environment.
 * - Seeds admin + scorer users from env vars (idempotent — skips if username exists).
 * - Seeds tournament/teams/matches on first boot (skips if tournament data exists).
 */
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final TournamentRepository tournamentRepository;
    private final TeamRepository       teamRepository;
    private final PlayerRepository     playerRepository;
    private final MatchRepository      matchRepository;
    private final AppUserRepository    userRepository;
    private final PasswordEncoder      passwordEncoder;

    @Value("${app.auth.admin.username}")  private String adminUsername;
    @Value("${app.auth.admin.password}")  private String adminPassword;
    @Value("${app.auth.admin.name}")      private String adminName;

    @Value("${app.auth.scorer.username}") private String scorerUsername;
    @Value("${app.auth.scorer.password}") private String scorerPassword;
    @Value("${app.auth.scorer.name}")     private String scorerName;

    @Override
    public void run(String... args) {
        seedUsers();
        seedTournament();
    }

    private void seedUsers() {
        upsertUser(adminUsername,  adminPassword,  "ADMIN",  adminName);
        upsertUser(scorerUsername, scorerPassword, "SCORER", scorerName);
    }

    private void upsertUser(String username, String rawPassword, String role, String name) {
        userRepository.findByUsernameIgnoreCase(username).ifPresentOrElse(
            existing -> {
                // Re-hash and save if the stored hash doesn't match the configured password.
                // This lets you rotate credentials via env vars without manual DB edits.
                if (!passwordEncoder.matches(rawPassword, existing.getPassword())) {
                    existing.setPassword(passwordEncoder.encode(rawPassword));
                    existing.setName(name);
                    userRepository.save(existing);
                    System.out.printf("[Auth] Updated credentials for user: %s%n", username);
                }
            },
            () -> {
                AppUser u = AppUser.builder()
                        .username(username.toLowerCase())
                        .password(passwordEncoder.encode(rawPassword))
                        .role(role)
                        .name(name)
                        .build();
                userRepository.save(u);
                System.out.printf("[Auth] Created user: %s (%s)%n", username, role);
            }
        );
    }

    private void seedTournament() {
        if (tournamentRepository.count() > 0) return;
        TournamentSeeder.seed(tournamentRepository, teamRepository, playerRepository, matchRepository);
    }
}
