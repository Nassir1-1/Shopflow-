package com.shopflow.backend.controller;

import com.shopflow.backend.entity.Product;
import com.shopflow.backend.repository.ProductRepository;
import com.shopflow.backend.repository.UserRepository;
import com.shopflow.backend.service.EphemeralViewService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Map;

/**
 * FILE LOCATION:
 *   src/main/java/com/shopflow/backend/controller/DesignPreviewController.java
 *
 * TWO ENDPOINTS:
 *
 *   POST /api/products/{productId}/preview-token
 *     → Authenticated buyer requests a 20-second token.
 *     → Returns { token, expiresIn: 20 }.
 *
 *   GET  /api/secure-image/{token}
 *     → Serves the full-resolution image for 20 seconds.
 *     → Token is consumed immediately (one use only).
 *     → Add anti-caching headers so browser cannot replay it.
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DesignPreviewController {

    private final EphemeralViewService ephemeralService;
    private final ProductRepository    productRepository;
    private final UserRepository       userRepository;

    // Folder where original (unblurred) files are stored — outside web root
    private static final String PRIVATE_PATH = "/var/shopflow/private/";

    // ── Step 1: buyer requests a token ───────────────────
    @PostMapping("/products/{productId}/preview-token")
    public ResponseEntity<Map<String, Object>> requestToken(
            @PathVariable Long productId) {

        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();

        // Only authenticated users can get a token
        if ("anonymousUser".equals(email))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        Long buyerId = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found")).getId();

        String token = ephemeralService.generateToken(productId, buyerId);

        return ResponseEntity.ok(Map.of(
                "token",     token,
                "expiresIn", 20   // seconds — frontend should show countdown
        ));
    }

    // ── Step 2: browser fetches the image using the token ─
    @GetMapping("/secure-image/{token}")
    public ResponseEntity<Resource> serveSecureImage(@PathVariable String token)
            throws IOException {

        Long productId = ephemeralService.validateAndConsume(token); // throws if bad

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        // Load from private storage (not publicly accessible)
        byte[] imageBytes = Files.readAllBytes(Paths.get(PRIVATE_PATH + productId + ".jpg"));

        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                // Anti-caching headers — browser must not store or replay
                .header(HttpHeaders.CACHE_CONTROL,  "no-store, no-cache, must-revalidate, max-age=0")
                .header(HttpHeaders.PRAGMA,          "no-cache")
                .header(HttpHeaders.EXPIRES,         "0")
                .header("X-Content-Type-Options",    "nosniff")
                .body(new ByteArrayResource(imageBytes));
    }
}