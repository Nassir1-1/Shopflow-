package com.shopflow.backend.controller;

import com.shopflow.backend.dto.*;
import com.shopflow.backend.entity.*;
import com.shopflow.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
public class BookController {

    private final UserProgressRepository progressRepo;
    private final UserRepository         userRepo;
    private final ProductRepository      productRepo;

    public static final double COMMISSION = 0.10;   // 10%

    /* ── Save reading progress ─────────────────────────── */
    @PostMapping("/{bookId}/progress")
    public ResponseEntity<ProgressResponse> save(
            @PathVariable Long bookId,
            @RequestBody ProgressRequest req) {

        String email = auth();
        User    user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Product book = productRepo.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found"));

        UserProgress p = progressRepo
                .findByUserIdAndProductId(user.getId(), bookId)
                .orElseGet(() -> UserProgress.builder().user(user).product(book).build());
        p.setLastPage(req.getPage());
        p.setLastRead(LocalDateTime.now());
        progressRepo.save(p);

        return ResponseEntity.ok(new ProgressResponse(bookId, req.getPage()));
    }

    /* ── Load reading progress ─────────────────────────── */
    @GetMapping("/{bookId}/progress")
    public ResponseEntity<ProgressResponse> load(@PathVariable Long bookId) {
        String email = auth();
        User   user  = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        int page = progressRepo
                .findByUserIdAndProductId(user.getId(), bookId)
                .map(UserProgress::getLastPage).orElse(0);
        return ResponseEntity.ok(new ProgressResponse(bookId, page));
    }

    /* ── Commission breakdown for a book ──────────────── */
    @GetMapping("/{bookId}/earnings")
    public ResponseEntity<Map<String,Object>> earnings(@PathVariable Long bookId) {
        Product book  = productRepo.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found"));
        double price  = book.getPrix().doubleValue();
        return ResponseEntity.ok(Map.of(
                "listPrice",     price,
                "commission",    Math.round(price * COMMISSION   * 100.0) / 100.0,
                "sellerEarning", Math.round(price * (1-COMMISSION) * 100.0) / 100.0,
                "rate",          COMMISSION
        ));
    }

    /* ── Update seller portfolio bio ───────────────────── */
    @PutMapping("/portfolio/bio")
    public ResponseEntity<Map<String,String>> updateBio(@RequestBody Map<String,String> body) {
        String email = auth();
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setBio(body.get("bio"));
        if (body.containsKey("avatarUrl")) user.setAvatarUrl(body.get("avatarUrl"));
        if (body.containsKey("website"))   user.setWebsite(body.get("website"));
        userRepo.save(user);
        return ResponseEntity.ok(Map.of("status", "updated"));
    }

    private String auth() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}