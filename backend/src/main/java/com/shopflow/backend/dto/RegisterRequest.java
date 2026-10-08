package com.shopflow.backend.dto;

import com.shopflow.backend.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterRequest {
    @Email
    @NotBlank
    private String email;
    @NotBlank
    private String motDePasse;
    private String prenom;
    private String nom;
    private Role role;
}