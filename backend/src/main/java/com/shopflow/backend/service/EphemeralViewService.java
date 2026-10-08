package com.shopflow.backend.service;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * FILE LOCATION:
 *   src/main/java/com/shopflow/backend/service/EphemeralViewService.java
 *
 * PURPOSE:
 *   Issues a one-time, 20-second token that lets a buyer view the
 *   original (unblurred) image exactly once within the time window.
 *
 *   Tokens are stored in memory (ConcurrentHashMap). For a multi-instance
 *   deployment replace this with Redis (spring-boot-starter-data-redis).
 *
 * HOW TO USE:
 *   1. Buyer clicks "Preview" button on the product page.
 *   2. Frontend calls POST /api/products/{productId}/preview-token  (must be authenticated).
 *   3. Backend calls EphemeralViewService.generateToken(productId, buyerId).
 *   4. Returns { "token": "abc-123", "expiresIn": 20 }.
 *   5. Frontend immediately loads GET /api/secure-image/{token} in an <img> tag.
 *   6. After 20 seconds, frontend hides the image. The token is also invalidated server-side.
 */
@Service
public class EphemeralViewService {

    private static final long VIEW_WINDOW_MS = 20_000L; // 20 seconds

    private record TokenData(Long productId, Long buyerId, Instant expiresAt) {}

    // token  →  token metadata
    private final Map<String, TokenData> store = new ConcurrentHashMap<>();

    /** Call this when the buyer requests a preview. */
    public String generateToken(Long productId, Long buyerId) {
        // Remove any previous tokens for this buyer+product
        store.entrySet().removeIf(e ->
                e.getValue().productId().equals(productId) &&
                        e.getValue().buyerId().equals(buyerId)
        );

        String token = UUID.randomUUID().toString();
        store.put(token, new TokenData(productId, buyerId,
                Instant.now().plusMillis(VIEW_WINDOW_MS)));
        return token;
    }

    /**
     * Validate and consume a token.
     * Returns the productId if valid, or throws if invalid/expired.
     */
    public Long validateAndConsume(String token) {
        TokenData data = store.remove(token); // remove → one-time use
        if (data == null)
            throw new SecurityException("Invalid or already-used preview token.");
        if (Instant.now().isAfter(data.expiresAt()))
            throw new SecurityException("Preview token has expired (20-second window).");
        return data.productId();
    }

    /** Scheduled cleanup — call from a @Scheduled method or on every request. */
    public void purgeExpired() {
        Instant now = Instant.now();
        store.entrySet().removeIf(e -> now.isAfter(e.getValue().expiresAt()));
    }
}