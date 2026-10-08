package com.shopflow.backend.service;

import com.shopflow.backend.entity.*;
import com.shopflow.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // ── @Transactional keeps the Hibernate session open so lignes loads correctly ──
    @Transactional
    public Cart getOrCreateCart() {
        User customer = getCurrentUser();
        Cart cart = cartRepository.findByCustomerId(customer.getId())
                .orElseGet(() -> {
                    Cart c = Cart.builder().customer(customer).build();
                    return cartRepository.save(c);
                });
        // Force-initialize the lazy collection while session is still open
        cart.getLignes().size();
        cart.getLignes().forEach(item -> {
            if (item.getProduct() != null) {
                item.getProduct().getNom(); // touch each product to load it
            }
        });
        return cart;
    }

    @Transactional
    public Cart addItem(Long productId, int quantite) {
        Cart cart = getOrCreateCart();
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        cart.getLignes().stream()
                .filter(i -> i.getProduct().getId().equals(productId))
                .findFirst()
                .ifPresentOrElse(
                        item -> item.setQuantite(item.getQuantite() + quantite),
                        () -> {
                            CartItem item = CartItem.builder()
                                    .cart(cart)
                                    .product(product)
                                    .quantite(quantite)
                                    .build();
                            cart.getLignes().add(item);
                        }
                );
        Cart saved = cartRepository.save(cart);
        saved.getLignes().size(); // keep session open
        saved.getLignes().forEach(i -> i.getProduct().getNom());
        return saved;
    }

    @Transactional
    public Cart removeItem(Long itemId) {
        Cart cart = getOrCreateCart();
        cart.getLignes().removeIf(i -> i.getId().equals(itemId));
        Cart saved = cartRepository.save(cart);
        saved.getLignes().size();
        saved.getLignes().forEach(i -> i.getProduct().getNom());
        return saved;
    }
}