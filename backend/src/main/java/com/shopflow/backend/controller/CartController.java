package com.shopflow.backend.controller;

import com.shopflow.backend.entity.Cart;
import com.shopflow.backend.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<Cart> getCart() {
        return ResponseEntity.ok(cartService.getOrCreateCart());
    }

    @PostMapping("/items")
    public ResponseEntity<Cart> addItem(
            @RequestParam Long productId,
            @RequestParam int quantite) {
        return ResponseEntity.ok(cartService.addItem(productId, quantite));
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<Cart> removeItem(@PathVariable Long itemId) {
        return ResponseEntity.ok(cartService.removeItem(itemId));
    }
}
