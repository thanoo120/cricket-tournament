package com.cricket.tournament.controller;

import com.cricket.tournament.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final JwtTokenProvider jwtTokenProvider;

    @Value("${app.auth.admin.username}")
    private String adminUsername;
    @Value("${app.auth.admin.password}")
    private String adminPassword;
    @Value("${app.auth.admin.name}")
    private String adminName;

    @Value("${app.auth.scorer.username}")
    private String scorerUsername;
    @Value("${app.auth.scorer.password}")
    private String scorerPassword;
    @Value("${app.auth.scorer.name}")
    private String scorerName;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        String username = request.username().trim().toLowerCase();
        String password = request.password();

        String role;
        String name;

        if (username.equals(adminUsername.toLowerCase()) && password.equals(adminPassword)) {
            role = "ADMIN";
            name = adminName;
        } else if (username.equals(scorerUsername.toLowerCase()) && password.equals(scorerPassword)) {
            role = "SCORER";
            name = scorerName;
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid username or password"));
        }

        String token = jwtTokenProvider.generateToken(username, role, name);
        return ResponseEntity.ok(Map.of(
                "token", token,
                "username", username,
                "role", role,
                "name", name
        ));
    }

    public record LoginRequest(String username, String password) {}
}
