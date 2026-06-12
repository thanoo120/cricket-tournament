package com.cricket.tournament.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "app_users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password;   // BCrypt hash

    @Column(nullable = false)
    private String role;       // ADMIN | SCORER

    @Column(nullable = false)
    private String name;
}
