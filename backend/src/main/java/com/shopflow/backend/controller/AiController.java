package com.shopflow.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * Proxies AI requests through the backend so the Anthropic API key
 * is never exposed to the browser.
 *
 * POST /api/ai/bio  { name, context }  → { bio }
 */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    // Add this to application.properties:
    //   anthropic.api.key=sk-ant-...
    @Value("${anthropic.api.key:}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping("/bio")
    public ResponseEntity<Map<String, String>> generateBio(
            @RequestBody Map<String, String> body) {

        String name    = body.getOrDefault("name",    "Unknown");
        String context = body.getOrDefault("context", "");

        // If no API key configured, return a sensible fallback
        if (apiKey == null || apiKey.isBlank()) {
            String fallback = name + " is a talented creator whose works reflect " +
                    "remarkable skill and artistic vision. Their portfolio showcases a " +
                    "distinctive style that invites viewers into a world of creativity.";
            return ResponseEntity.ok(Map.of("bio", fallback));
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-api-key",         apiKey);
            headers.set("anthropic-version", "2023-06-01");

            Map<String, Object> reqBody = Map.of(
                    "model",      "claude-haiku-4-5-20251001",
                    "max_tokens", 220,
                    "messages",   List.of(Map.of(
                            "role",    "user",
                            "content", "Write a professional 3-sentence biography for the " +
                                    "artist/author \"" + name + "\". " +
                                    "Context: " + context + ". " +
                                    "Be engaging and factual. Do not invent awards."
                    ))
            );

            ResponseEntity<Map> resp = restTemplate.exchange(
                    "https://api.anthropic.com/v1/messages",
                    HttpMethod.POST,
                    new HttpEntity<>(reqBody, headers),
                    Map.class
            );

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> content =
                    (List<Map<String, Object>>) resp.getBody().get("content");

            String bioText = content.isEmpty() ? "Biography unavailable."
                    : (String) content.get(0).get("text");

            return ResponseEntity.ok(Map.of("bio", bioText));

        } catch (Exception e) {
            // Return a graceful fallback on any API error
            String fallback = name + " is a talented creator with a distinctive artistic " +
                    "vision. Their works explore themes of beauty and expression, earning " +
                    "recognition among collectors and art enthusiasts alike.";
            return ResponseEntity.ok(Map.of("bio", fallback));
        }
    }
}