package com.shopflow.backend.service;

import com.shopflow.backend.dto.OrderRequest;
import com.shopflow.backend.dto.OrderResponse;
import com.shopflow.backend.entity.*;
import com.shopflow.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final UserRepository userRepository;

    @Transactional
    public OrderResponse placeOrder(OrderRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User customer = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Cart cart = cartRepository.findByCustomerId(customer.getId())
                .orElseThrow(() -> new RuntimeException("Cart is empty"));

        if (cart.getLignes().isEmpty()) {
            throw new RuntimeException("Cart is empty");
        }

        BigDecimal sousTotal = cart.getLignes().stream()
                .map(item -> item.getProduct().getPrix()
                        .multiply(BigDecimal.valueOf(item.getQuantite())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal fraisLivraison = new BigDecimal("7.00");
        BigDecimal totalTTC = sousTotal.add(fraisLivraison);

        List<OrderItem> lignes = cart.getLignes().stream().map(cartItem -> {
            OrderItem oi = new OrderItem();
            oi.setProduct(cartItem.getProduct());
            oi.setQuantite(cartItem.getQuantite());
            oi.setPrixUnitaire(cartItem.getProduct().getPrix());
            return oi;
        }).collect(Collectors.toList());

        Order order = Order.builder()
                .customer(customer)
                .numeroCommande(generateOrderNumber())
                .adresseLivraison(request.getAdresseLivraison())
                .sousTotal(sousTotal)
                .fraisLivraison(fraisLivraison)
                .totalTTC(totalTTC)
                .statut(OrderStatus.PENDING)
                .build();

        lignes.forEach(li -> li.setOrder(order));
        order.setLignes(lignes);

        cart.getLignes().clear();
        cartRepository.save(cart);

        return toResponse(orderRepository.save(order));
    }

    public List<OrderResponse> getMyOrders() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User customer = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return orderRepository.findByCustomerId(customer.getId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public OrderResponse getById(Long id) {
        return toResponse(orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found")));
    }

    @Transactional
    public OrderResponse updateStatus(Long id, OrderStatus status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        order.setStatut(status);
        return toResponse(orderRepository.save(order));
    }

    @Transactional
    public OrderResponse cancelOrder(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        if (order.getStatut() != OrderStatus.PENDING && order.getStatut() != OrderStatus.PAID) {
            throw new RuntimeException("Order cannot be cancelled");
        }
        order.setStatut(OrderStatus.CANCELLED);
        return toResponse(orderRepository.save(order));
    }

    private String generateOrderNumber() {
        String year = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy"));
        int rand = new Random().nextInt(99999);
        return String.format("ORD-%s-%05d", year, rand);
    }

    private OrderResponse toResponse(Order o) {
        OrderResponse r = new OrderResponse();
        r.setId(o.getId());
        r.setNumeroCommande(o.getNumeroCommande());
        r.setStatut(o.getStatut());
        r.setAdresseLivraison(o.getAdresseLivraison());
        r.setSousTotal(o.getSousTotal());
        r.setFraisLivraison(o.getFraisLivraison());
        r.setTotalTTC(o.getTotalTTC());
        r.setDateCommande(o.getDateCommande());
        return r;
    }
}