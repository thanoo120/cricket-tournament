package com.cricket.tournament.controller;

import com.cricket.tournament.model.AppUser;
import com.cricket.tournament.repository.AppUserRepository;
import com.cricket.tournament.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final JwtTokenProvider  jwtTokenProvider;
    private final AppUserRepository userRepository;
    private final PasswordEncoder   passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request.username() == null || request.password() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username and password are required"));
        }

        Optional<AppUser> userOpt = userRepository.findByUsernameIgnoreCase(request.username().trim());

        if (userOpt.isEmpty() || !passwordEncoder.matches(request.password(), userOpt.get().getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid username or password"));
        }

        AppUser user  = userOpt.get();
        String  token = jwtTokenProvider.generateToken(user.getUsername(), user.getRole(), user.getName());

        return ResponseEntity.ok(Map.of(
                "token",    token,
                "username", user.getUsername(),
                "role",     user.getRole(),
                "name",     user.getName()
        ));
    }

    public record LoginRequest(String username, String password) {}
}
